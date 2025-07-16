
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
  Bug:     "#4A7437",  // Verde escuro
  Dark:    "#2C2C2C",  // Preto/cinza escuro
  Dragon:  "#4F6DA1",  // Azul acinzentado
  Electric:"#F4D23C",  // Amarelo vibrante
  Fairy:   "#D46DB2",  // Rosa escuro
  Fighting:"#C22E28",  // Vermelho queimado
  Fire:    "#EE8130",  // Laranja forte
  Flying:  "#A98FF3",  // Azul lavanda
  Ghost:   "#735797",  // Roxo escuro
  Grass:   "#7AC74C",  // Verde folha vibrante
  Ground:  "#E2BF65",  // Bege amarelado
  Ice:     "#96D9D6",  // Azul gelo
  Normal:  "#A8A77A",  // Cinza/bege
  Poison:  "#A33EA1",  // Roxo escuro
  Psychic: "#F95587",  // Rosa neon
  Rock:    "#B6A136",  // Marrom/mostarda
  Steel:   "#B7B7CE",  // Cinza metálico claro
  Water:   "#6390F0"   // Azul oceano
};



// Controladores para aumentar o HP dos Pokémon o HP padrão será multiplicado pelo valor de controlHpPlayer e controlHpPc.
// Ex: se o HP padrão = 10 se controlHpPlayer = 10 o HP final = 100.
let controlHpPlayer = 10;
let controlHpPc = 10;

// Controladores de dano causado pelos ataques, o dano final será reduzido ou acrescido em 10% do dano calculado.
// Lembrando que se os dois forem valores iguais o dano final será o mesmo. 
let controlDamageMinus = 0;
let controlDamagePlus = 0;



const attackSound = new Audio("../../sounds/attack.mp3");
const faintSound = new Audio("../../sounds/faint.mp3");
const superEffectiveSound = new Audio("../../sounds/super-effective.mp3");
const battleMusic = new Audio("../../sounds/battle-theme.mp3");
battleMusic.loop = true;



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
    damage: Math.max(Math.floor(rawDamage), 0) + Number((rawDamage * controlDamagePlus/100).toFixed(0)) - Number((rawDamage * controlDamageMinus/100).toFixed(0))  , // Reduz o dano em 10% para balancear
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
      battleMusic.pause();
      return;
    }

    $('#switch-options').empty();
    playerTeam.forEach((poke, idx) => {
      if (idx === playerIndex) return;
      const hp = playerHPMap[idx];
      const disabled = hp <= 0 ? 'disabled' : '';
      const percent = Math.max((hp / poke.hp) * 100, 0);
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

    $('.switch-btn').on('click', function () {
      const chosen = parseInt($(this).data('index'));
      playerIndex = chosen;
      player = playerTeam[playerIndex];
      updateUI();

      $('#move-options').empty();

      player.moves.forEach(moveId => {
        const filteredMove = moves.find(m => m.id === moveId);
        if (!filteredMove) return;

        const type = filteredMove.type;
        const bgColor = typeColors[type] || '#cccccc'; // cor padrão se tipo não encontrado

        $('#move-options').append(`
          <button class="btn move-btn" style="background-color:${bgColor};">${filteredMove.name}</button>
        `);
      });

      $('.move-btn').on('click', function () {
        if (playerHPMap[playerIndex] <= 0 || pcHPMap[pcIndex] <= 0) return;
        const move = $(this).text();
        executeTurn(move, moves);
      });

      $('#log').append(`<br>⚠️ Você enviou ${player.name}!`);
      modal.hide();
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
      battleMusic.pause();
      alert("Parabens você venceu esta batalha!");
      return location = "../menu"
    }

    pc = pcTeam[pcIndex];
    updateUI();
    $('#log').append(`<br>⚠️ O PC enviou ${pc.name}!`);
  }
}

async function executeTurn(playerMoveName, movesSet) {
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
  await delay(1000);

  if (firstHPMap[firstIndex] <= 0) {
    $('#log').append(`<br>${second.name} desmaiou!`);
    faintSound.currentTime = 0; faintSound.play();
    updateUI();
    await delay(1000);
    checkFaintAndSwitch();
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
  await delay(1000);

  if (secondHPMap[secondIndex] <= 0) {
    $('#log').append(`<br>${first.name} desmaiou!`);
    faintSound.currentTime = 0; faintSound.play();
    updateUI();
    await delay(1000);
    checkFaintAndSwitch();
  }

  $('.move-btn').prop('disabled', false);
}

$(document).ready(function () {
  $.when(
    $.getJSON("../../db/pokedex.json"),
    $.getJSON("../../db/moves.json"),
    $.getJSON("../../db/effectiveness.json")
  ).done(function (pokeRes, moveRes, effectivenessRes) {


    
    const pokemons = pokeRes[0];
    moves = moveRes[0];
    effectivenessChart = effectivenessRes[0];

    moves.forEach(m => {
      movesData[m.name] = m;
    });

    // console.log(moves)

    const playerTeamNames = JSON.parse(localStorage.getItem('playerTeam') || "[]");
    if (!playerTeamNames || playerTeamNames.length !== 6) {
      alert("Você precisa escolher 6 Pokémon antes de batalhar.");
      window.location.href = "../choose/";
      return;
    }

    playerTeam = pokemons.filter(p => playerTeamNames.includes(p.id));
      // console.log(playerTeam);
    while (pcTeam.length < 6) {
      const rand = pokemons[Math.floor(Math.random() * pokemons.length)];
      if (!playerTeamNames.includes(rand.name) && !pcTeam.includes(rand)) {
        pcTeam.push(rand);
      }
    }

    // Inicializa mapas de HP
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

    
    player.moves.forEach(moveId => {
      const filteredMove = moves.find(m => m.id === moveId);
      if (!filteredMove) return;
     

      const type = filteredMove.type;
      const bgColor = typeColors[type] || '#cccccc'; 
      

      $('#move-options').append(`
        <button class="btn move-btn" style="background-color:${bgColor};">${filteredMove.name}</button>
      `);
    });

    $('.move-btn').on('click', function () {
      if (playerHPMap[playerIndex] <= 0 || pcHPMap[pcIndex] <= 0) return;
      const move = $(this).text();
      executeTurn(move, moves);
    });


    $('body').one('click', () => {
      // battleMusic.play().catch(() => {});
    });
  });
});




