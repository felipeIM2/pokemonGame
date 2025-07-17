

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
let lastBossHP = Number(localStorage.getItem("bossHp")) || []

const typeColors = {
  Bug:     "#92BC2C",  // Verde inseto
  Grass:   "#5FBD58",  // Verde folha
  Fairy:   "#EE90E6",  // Rosa claro
  Normal:  "#A8A77A",  // Cinza/bege
  Dragon:  "#0C69C8",  // Azul escuro
  Psychic: "#FA8581",  // Rosa mais forte
  Ghost:   "#5F6DBC",  // Azul escuro meio roxo
  Ground:  "#DA7C4D",  // Marrom claro
  Steel:   "#5695A3",  // Azul acinzentado
  Fire:    "#FF9C54",  // Laranja forte
  Flying:  "#A1BBEC",  // Azul claro
  Ice:     "#70CCBD",  // Azul esverdeado
  Electric:"#F4D23C",  // Amarelo
  Rock:    "#C9BB8A",  // Bege
  Dark:    "#595761",  // Cinza escuro
  Water:   "#539DDF",  // Azul médio
  Fighting:"#D3425F",  // Vermelho rosado
  Poison:  "#B763CF"   // Roxo claro
};


// Controladores para aumentar o HP dos Pokémon o HP padrão será multiplicado pelo valor de controlHpPlayer e controlHpPc.
// Ex: se o HP padrão = 10 se controlHpPlayer = 10 o HP final = 100.
let controlHpPlayer = 10;
let controlHpPc = 100;

// Controladores de dano causado pelos ataques, o dano final será reduzido ou acrescido em 10% do dano calculado.
// Lembrando que se os dois forem valores iguais o dano final será o mesmo. 
let controlDamageMinus = 0;
let controlDamagePlus = 0;

let bossDamage = 100;



const attackSound = new Audio("../sounds/attack.mp3");
const faintSound = new Audio("../sounds/faint.mp3");
const superEffectiveSound = new Audio("../sounds/super-effective.mp3");
const battleMusic = new Audio("../sounds/battle-theme.mp3");
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
  
  const currentPcHP = pcHPMap[pcIndex];
  const currentPlayerHP = playerHPMap[playerIndex];
     
  $('#player-pokemon').text(player.name);
  $('#pc-pokemon').text(pc.name);
  $('#player-hp').text(Math.max(currentPlayerHP, 0));
  $('#pc-hp').text(Math.max(currentPcHP, 0));
  updateBar($('#player-hp-bar'), currentPlayerHP, player.maxHp);
  updateBar($('#pc-hp-bar'), currentPcHP, pc.maxHp);
  checkFaintAndSwitch(currentPcHP)
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

function checkFaintAndSwitch(currentPcHP) {
  
  if (playerHPMap[playerIndex] <= 0) {
    // Encontra Pokémon disponíveis para troca
    const available = playerTeam
      .map((poke, idx) => ({ ...poke, index: idx }))
      .filter(p => playerHPMap[p.index] > 0 && p.index !== playerIndex);

    
    if (available.length === 0) {
      $('#log').append("<br>💀 Você perdeu todos os seus Pokémon!");
      $('.move-btn').prop('disabled', true);
      battleMusic.pause();
      localStorage.removeItem('pcTeam');
      localStorage.setItem('bossHp', currentPcHP);
      alert("Você perdeu todos os seus Pokémon!")
      setTimeout(() => location = "../", 1500);
      return; 
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

    
    $(document).off('click', '.switch-btn');
    $(document).on('click', '.switch-btn', function() {
      const newIndex = parseInt($(this).data('index'));
      
      if (playerHPMap[newIndex] <= 0) {
        return;
      }

      playerIndex = newIndex;
      player = playerTeam[playerIndex];
      
  
      const modal = bootstrap.Modal.getInstance($('#switchModal'));
      if (modal) {
        modal.hide();
      }

      updateUI();
      updateMoveButtons();
      
      $('#log').append(`<br>⚡ Você enviou ${player.name}!`);

      $('.move-btn').prop('disabled', false);
    });

    const existingModal = bootstrap.Modal.getInstance($('#switchModal'));
    if (!existingModal || !existingModal._isShown) {
      const modal = new bootstrap.Modal($('#switchModal'));
      modal.show();
    }

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
      alert("Parabéns você venceu esta batalha!");
      localStorage.removeItem('pcTeam'); 
      localStorage.removeItem('bossHp'); 
      localStorage.removeItem('boss'); 

      return setTimeout(() => location = "../", 1000);
    }

    pc = pcTeam[pcIndex];
    updateUI();
    $('#log').append(`<br>⚠️ O PC enviou ${pc.name}!`);
  }
}

function updateMoveButtons() {
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

  // Reaplica o event listener para os novos botões
  $('.move-btn').off('click').on('click', function () {
    if (playerHPMap[playerIndex] <= 0 || pcHPMap[pcIndex] <= 0) return;
    const move = $(this).text();
    executeTurn(move, moves);
  });
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
    pcMove.power = pcMove.power + (pcMove.power * bossDamage/100)

  } else {
    first = pc; second = player;
    firstMove = pcMove; secondMove = playerMove;
    firstHPMap = playerHPMap; secondHPMap = pcHPMap;
    firstIndex = playerIndex; secondIndex = pcIndex;
    pcMove.power = pcMove.power + (pcMove.power * bossDamage/100)

    // console.log(pcMove.power)
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
    $.getJSON("../db/pokedex.json"),
    $.getJSON("../db/pc.json"),
    $.getJSON("../db/moves.json"),
    $.getJSON("../db/effectiveness.json")
  ).done(function (pokeRes, pcRes, moveRes, effectivenessRes) {


    
    const pokemons = pokeRes[0];
    const pcPlayer = pcRes[0];

    moves = moveRes[0];
    effectivenessChart = effectivenessRes[0];

    moves.forEach(m => {
      movesData[m.name] = m;
    });

    // console.log(moves)

    const playerTeamNames = JSON.parse(localStorage.getItem('playerTeam') || "[]");
    const boss = JSON.parse(localStorage.getItem('boss') || "[]");


    playerTeam = pcPlayer.filter(p => playerTeamNames.includes(p.register));
    pcTeam = pokemons.filter(p => boss.includes(p.id));
 

    // Inicializa mapas de HP
    playerTeam.forEach((p, i) => {
      p.maxHp = p.hp * controlHpPlayer;
      playerHPMap[i] = p.maxHp;
    });

    
    pcTeam.forEach((p, i) => {

      if(lastBossHP.length <= 0){
        p.maxHp = p.hp * controlHpPc;
        pcHPMap[i] = p.maxHp;
      }else {
        p.maxHp = p.hp * controlHpPc 
        pcHPMap[i] = (p.maxHp - p.maxHp) + lastBossHP;
      }
        
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




