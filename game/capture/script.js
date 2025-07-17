let playerTeam = [];
let pcTeam = [];
let playerIndex = 0;
let pcIndex = 0;
let player, pc;
let movesData = {};
let playerHPMap = {};
let pcHPMap = {};
let moves;
let effectivenessChart = {}

const typeColors = {
  Bug:     "#4A7437",
  Dark:    "#2C2C2C",
  Dragon:  "#4F6DA1",
  Electric:"#F4D23C",
  Fairy:   "#D46DB2",
  Fighting:"#C22E28",
  Fire:    "#EE8130",
  Flying:  "#A98FF3",
  Ghost:   "#735797",
  Grass:   "#7AC74C",
  Ground:  "#E2BF65",
  Ice:     "#96D9D6",
  Normal:  "#A8A77A",
  Poison:  "#A33EA1",
  Psychic: "#F95587",
  Rock:    "#B6A136",
  Steel:   "#B7B7CE",
  Water:   "#6390F0"
};

let controlHpPlayer = 10;
let controlHpPc = 10;
let controlDamageMinus = 0;
let controlDamagePlus = 0;

const attackSound = new Audio("../sounds/attack.mp3");
const faintSound = new Audio("../sounds/faint.mp3");
const superEffectiveSound = new Audio("../sounds/super-effective.mp3");
const battleMusic = new Audio("../sounds/battle-theme.mp3");
battleMusic.loop = true;

// Funções para controlar os botões de ação
function disableActionButtons() {
  $('.move-btn').prop('disabled', true);
  $('#btn-switch').prop('disabled', true);
  $('#btn-bag').prop('disabled', true);
  $('#btn-run').prop('disabled', true);
  

}

function enableActionButtons() {
  if (playerHPMap[playerIndex] > 0) {
    $('.move-btn').prop('disabled', false);
    $('#btn-switch').prop('disabled', false);
    $('#btn-bag').prop('disabled', false);
    $('#btn-run').prop('disabled', false);
    
  }
}

function getEffectiveness(attackType, targetTypes) {
  if (!Array.isArray(targetTypes)) targetTypes = [targetTypes];
  return targetTypes.reduce((multiplier, type) => {
    const value = effectivenessChart[attackType]?.[type] ?? 1;
    return multiplier * value;
  }, 1);
}

function calcDamage(attacker, defender, move) {
  const power = move.power;
  const effective = getEffectiveness(move.type, defender.type);
  const base = attacker.atk + power;
  const rawDamage = base * effective - defender.def;
  
  return {
    damage: Math.max(Math.floor(rawDamage), 0) + Number((rawDamage * controlDamagePlus/100).toFixed(0)) - Number((rawDamage * controlDamageMinus/100).toFixed(0)),
    effective
  };
}

function executeAttack(attacker, defender, move, defenderHPMap, defenderIndex) {
  const hitChance = move.accuracy ?? 100;
  const hitRoll = Math.random() * 100;

  if (hitRoll < hitChance) {
    const { damage, effective } = calcDamage(attacker, defender, move);
    defenderHPMap[defenderIndex] -= damage;

    return {
      hit: true,
      damage,
      effective,
      message: `${attacker.name} usou ${move.name} causando ${damage} de dano.` +
              (effective > 1 ? "<br><strong>É super efetivo!</strong>" :
                effective < 1 ? "<br><em>O ataque não foi muito efetivo...</em>" : "")
    };
  } else {
    return {
      hit: false,
      damage: 0,
      effective: 1,
      message: `${attacker.name} usou ${move.name}, mas errou o ataque!`
    };
  }
}

function updateUI() {
  const currentPlayerHP = playerHPMap[playerIndex];
  const currentPcHP = pcHPMap[pcIndex];
    
  $('#player-pokemon').text(player.name);
  $('#pc-pokemon').text(pc.name);
  $('#player-hp').text(Math.max(currentPlayerHP, 0));
  $('#pc-hp').text(Math.max(currentPcHP, 0));
  updateBar($('#player-hp-bar'), currentPlayerHP, player.maxHp);
  updateBar($('#pc-hp-bar'), currentPcHP, pc.maxHp);
  $('#player-sprite').attr('src', `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${player.id}.gif`);
  $('#pc-sprite').attr('src', `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pc.id}.gif`);
}

function updateBar($bar, current, max) {
  const percent = Math.max((current / max) * 100, 0);
  let color = percent > 60 ? 'green' : percent > 30 ? 'yellow' : 'red';
  $bar.removeClass('green yellow red').addClass(color).css('width', percent + '%');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkFaintAndSwitch() {
  if (playerHPMap[playerIndex] <= 0) {
    const available = playerTeam
      .map((poke, idx) => ({ ...poke, index: idx }))
      .filter(p => playerHPMap[p.index] > 0 && p.index !== playerIndex);

    if (available.length === 0) {
      $('#log').append("<br>💀 Você perdeu todos os seus Pokémon!");
      $('.move-btn').prop('disabled', true);
      disableActionButtons();
      battleMusic.pause();
      localStorage.removeItem('pcTeam');
      return setTimeout(() => location = "../", 800);
    }

    $('#switch-options').empty();
    playerTeam.forEach((poke, idx) => {
      if (idx === playerIndex) return;
      const hp = playerHPMap[idx];
      const disabled = hp <= 0 ? 'disabled' : '';
      const percent = Math.max((hp / poke.maxHp) * 100, 0);
      const color = hp <= 0 ? 'red' : percent > 60 ? 'green' : percent > 30 ? 'yellow' : 'red';

      $('#switch-options').append(`
        <div class="col-md-4 mb-3">
          <button class="btn btn-outline-${hp <= 0 ? 'secondary' : 'success'} w-100 switch-btn" data-index="${idx}" ${disabled}>
            ${poke.name}
            <div class="hp-bar-container mt-2">
              <div class="hp-bar ${color}" style="width: ${percent}%;"></div>
            </div>
          </button>
        </div>
      `);
    });

    const modal = new bootstrap.Modal(document.getElementById('switchModal'));
    modal.show();

    $('.switch-btn').off('click').on('click', function () {
      const chosen = parseInt($(this).data('index'));
      playerIndex = chosen;
      player = playerTeam[playerIndex];
      updateUI();
      refreshMoveButtons();
      $('#log').append(`⚠️ Você enviou ${player.name}!`);
      modal.hide();
      enableActionButtons();
    });

    return;
  }

  if (pcHPMap[pcIndex] <= 0) {
    pcIndex++;
    while (pcIndex < pcTeam.length && pcHPMap[pcIndex] <= 0) {
      pcIndex++;
    }

    if (pcIndex >= pcTeam.length) {
      $('#log').append("<br>🏆 Você venceu! O PC ficou sem Pokémon!");
      $('.move-btn').prop('disabled', true);
      disableActionButtons();
      battleMusic.pause();
      alert("Parabéns você venceu esta batalha!");
      localStorage.removeItem('pcTeam'); 
      return setTimeout(() => location = "../", 800);
    }

    pc = pcTeam[pcIndex];
    updateUI();
    $('#log').append(`<br>⚠️ O PC enviou ${pc.name}!`);
  }
}

function refreshMoveButtons() {
  $('#move-options').empty();

  player.moves.forEach(moveId => {
    const filteredMove = moves.find(m => m.id === moveId);
    if (!filteredMove) return;

    const type = filteredMove.type;
    const bgColor = typeColors[type] || '#cccccc';

    $('#move-options').append(`
      <button class="btn move-btn" style="background-color:${bgColor};">${filteredMove.name}</button>
    `);
  });

  $('.move-btn').off('click').on('click', function () {
    if (playerHPMap[playerIndex] <= 0 || pcHPMap[pcIndex] <= 0) return;
    const move = $(this).text();
    executeTurn(move, moves);
  });
}

async function executeTurn(playerMoveName, movesSet) {
  disableActionButtons();
  $('.move-btn').prop('disabled', true);
  

  const playerMove = movesData[playerMoveName];
  const pcMoveID = pc.moves[Math.floor(Math.random() * pc.moves.length)];
  const pcMove = movesSet.find(m => m.id === pcMoveID);

  const pPriority = playerMove.priority;
  const cPriority = pcMove.priority;

  const playerFirst = (
    pPriority > cPriority ||
    (pPriority === cPriority && player.spe >= pc.spe)
  );

  let first, second, firstMove, secondMove;
  let firstHPMap, secondHPMap, firstIndex, secondIndex;

  if (playerFirst) {
    first = player; second = pc;
    firstMove = playerMove; secondMove = pcMove;
    firstHPMap = pcHPMap; secondHPMap = playerHPMap;
    firstIndex = pcIndex; secondIndex = playerIndex;
  } else {
    first = pc; second = player;
    firstMove = pcMove; secondMove = playerMove;
    firstHPMap = playerHPMap; secondHPMap = pcHPMap;
    firstIndex = playerIndex; secondIndex = pcIndex;
  }

  // Turno 1
  const firstResult = executeAttack(first, second, firstMove, firstHPMap, firstIndex);
  $('#log').html(firstResult.message);
  if (firstResult.hit) {
    const sound = firstResult.effective > 1 ? superEffectiveSound : attackSound;
    sound.currentTime = 0; sound.play();
  }
  updateUI();
  await delay(1500);

  if (firstHPMap[firstIndex] <= 0) {
    $('#log').append(`<br>${second.name} desmaiou!`);
    faintSound.currentTime = 0; faintSound.play();
    updateUI();
    await delay(1500);
    checkFaintAndSwitch();
    enableActionButtons();
    $('.move-btn').prop('disabled', false);
    return;
  }

  // Turno 2
  const secondResult = executeAttack(second, first, secondMove, secondHPMap, secondIndex);
  $('#log').append(`<br>${secondResult.message}`);
  if (secondResult.hit) {
    const sound = secondResult.effective > 1 ? superEffectiveSound : attackSound;
    sound.currentTime = 0; sound.play();
  }
  updateUI();
  await delay(1500);

  if (secondHPMap[secondIndex] <= 0) {
    $('#log').append(`<br>${first.name} desmaiou!`);
    faintSound.currentTime = 0; faintSound.play();
    updateUI();
    await delay(1500);
    checkFaintAndSwitch();
  }

  setTimeout(() => {
    
  }, 2000);

  enableActionButtons();
  $('.move-btn').prop('disabled', false);
}

async function pcAttackAfterSwitch() {
  disableActionButtons();
  
  
  const pcMoveID = pc.moves[Math.floor(Math.random() * pc.moves.length)];
  const pcMove = moves.find(m => m.id === pcMoveID);
  const result = executeAttack(pc, player, pcMove, playerHPMap, playerIndex);
  
  $('#log').html(result.message);
  
  if (result.hit) {
    const sound = result.effective > 1 ? superEffectiveSound : attackSound;
    sound.currentTime = 0;
    sound.play();
  }

  updateUI();
  await delay(1500);

  if (playerHPMap[playerIndex] <= 0) {
    $('#log').append(`<br>${player.name} desmaiou!`);
    faintSound.currentTime = 0;
    faintSound.play();
    updateUI();
    await delay(1500);
    checkFaintAndSwitch();
  } else {
    setTimeout(() => {
      
    }, 2000);
  }
  
  enableActionButtons();
}

$(document).ready(function () {
  $.when(
    $.getJSON("../db/pokedex.json"),
    $.getJSON("../db/pc.json"),
    $.getJSON("../db/moves.json"),
    $.getJSON("../db/effectiveness.json")
  ).done(function (pokeRes, pcRes, moveRes, effectivenessRes) {

    const pokemons = pokeRes[0];
    const pcPlayer = pcRes[0]

    moves = moveRes[0];
    effectivenessChart = effectivenessRes[0];

    moves.forEach(m => {
      movesData[m.name] = m;
    });

    const playerTeamNames = JSON.parse(localStorage.getItem('playerTeam') || "[]");
    const pcTeamNames = JSON.parse(localStorage.getItem('pcTeam') || "[]");

    playerTeam = pcPlayer.filter(p => playerTeamNames.includes(p.register));
    pcTeam = pokemons.filter(p => pcTeamNames.includes(p.id));

    
    playerTeam.forEach((p, i) => {
      
      p.maxHp = p.hp * controlHpPlayer;
      playerHPMap[i] = p.maxHp;
    });

    pcTeam.forEach((p, i) => {
      p.maxHp = p.hp * controlHpPc;
      pcHPMap[i] = p.maxHp;
    });

    player = playerTeam[playerIndex];
    pc = pcTeam[pcIndex];

    updateUI();
    refreshMoveButtons();
    enableActionButtons();
   

    $('body').one('click', () => {
      // battleMusic.play().catch(() => {});
    });
  });
  
});

$('#btn-switch').on('click', function () {
  if (playerHPMap[playerIndex] <= 0) return;
  
  // Configura o modal
  const modal = new bootstrap.Modal($('#switchModal'));
  
  // Limpa e preenche as opções
  $('#switch-options').empty();
  playerTeam.forEach((poke, idx) => {
    if (idx === playerIndex) return;
    const hp = playerHPMap[idx];
    const disabled = hp <= 0 ? 'disabled' : '';
    const percent = Math.max((hp / poke.maxHp) * 100, 0);
    const color = hp <= 0 ? 'red' : percent > 60 ? 'green' : percent > 30 ? 'yellow' : 'red';

    $('#switch-options').append(`
      <div class="col-md-4 mb-3">
        <button class="btn btn-outline-${hp <= 0 ? 'secondary' : 'success'} w-100 switch-btn" data-index="${idx}" ${disabled}>
          ${poke.name}
          <div class="hp-bar-container mt-2">
            <div class="hp-bar ${color}" style="width: ${percent}%;"></div>
          </div>
        </button>
      </div>
    `);
  });

  // Mostra o modal
  modal.show();


  // Configura o clique nos botões de troca
  $('.switch-btn').off('click').on('click', async function () {
    const chosen = parseInt($(this).data('index'));
    playerIndex = chosen;
    player = playerTeam[playerIndex];
    updateUI();
    refreshMoveButtons();
    
    $('#log').html(`⚠️ Você enviou ${player.name}!`);
    modal.hide();
    
    await delay(1000);
    await pcAttackAfterSwitch();
  });
});

$('#btn-bag').on('click', function () {
  disableActionButtons();
  //  clearLog();
  $('#log').html('🎒 Você abriu a mochila... (função em construção)');
  setTimeout(() => {
    
    enableActionButtons();
  }, 2000);
});

$('#btn-run').on('click', async function () {
  disableActionButtons();
  const chance = Math.random();
  

  if (chance < 0.5) {
    $('#log').html('🏃‍♂️ Você tentou fugir... mas não conseguiu!');
    await delay(1000);
    await pcAttackAfterSwitch();
  } else {
    $('#log').html('🏃‍♂️ Você fugiu com sucesso!');
    await delay(1000);

    pcIndex++;
    while (pcIndex < pcTeam.length && pcHPMap[pcIndex] <= 0) {
      pcIndex++;
    }

    if (pcIndex < pcTeam.length) {
      pc = pcTeam[pcIndex];
      updateUI();
      $('#log').append(`<br>⚠️ O PC enviou ${pc.name}!`);
      await delay(1000);
      await pcAttackAfterSwitch();
    } else {
      $('#log').append("<br>🏆 Você venceu! O PC ficou sem Pokémon!");
      $('.move-btn').prop('disabled', true);
      disableActionButtons();
      battleMusic.pause();
      alert("Parabéns! Você venceu esta batalha!");
      localStorage.removeItem('pcTeam');
      return setTimeout(() => location = "../", 800);
    }
  }
  enableActionButtons();
});