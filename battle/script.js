let playerTeam = [];
let pcTeam = [];
let playerIndex = 0;
let pcIndex = 0;
let player, pc;
let movesData = {};
let playerHPMap = {};
let pcHPMap = {};
let moves;

// Controladores para aumentar o HP dos Pokémon o HP padrão será multiplicado pelo valor de controlHpPlayer e controlHpPc.
// Ex: se o HP padrão = 10 se controlHpPlayer = 10 o HP final = 100.
let controlHpPlayer = 10;
let controlHpPc = 10;

// Controladores de dano causado pelos ataques, o dano final será reduzido ou acrescido em 10% do dano calculado.
// Lembrando que se os dois forem valores iguais o dano final será o mesmo. 
let controlDamageMinus = 0;
let controlDamagePlus = 0;



const attackSound = new Audio("sounds/attack.mp3");
const faintSound = new Audio("sounds/faint.mp3");
const superEffectiveSound = new Audio("sounds/super-effective.mp3");
const battleMusic = new Audio("sounds/battle-theme.mp3");
battleMusic.loop = true;

const effectivenessChart = {
  Electric: { Water: 2, Flying: 2, Ground: 0 },
  Water: { Fire: 2, Rock: 2, Grass: 0.5 },
  Fire: { Grass: 2, Ice: 2, Water: 0.5, Rock: 0.5 },
  Grass: { Water: 2, Rock: 2, Fire: 0.5, Flying: 0.5 },
  Rock: { Flying: 2, Fire: 2 },
  Fighting: { Normal: 2, Rock: 2 },
  Ghost: { Normal: 0, Psychic: 2 },
  Normal: {},
  Dark: { Psychic: 2 },
  Ice: { Grass: 2, Flying: 2 },
  Psychic: { Fighting: 2 },
  Fairy: { Fighting: 2, Dark: 2 }
};

function getEffectiveness(attackType, targetType) {
  return effectivenessChart[attackType]?.[targetType] || 1;
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

function updateUI() {

    

  const currentPlayerHP = playerHPMap[playerIndex];
  const currentPcHP = pcHPMap[pcIndex];
     
  $('#player-pokemon').text(player.name);
  $('#pc-pokemon').text(pc.name);
  $('#player-hp').text(Math.max(currentPlayerHP, 0));
  $('#pc-hp').text(Math.max(currentPcHP, 0));
  updateBar($('#player-hp-bar'), currentPlayerHP, player.hp);
  updateBar($('#pc-hp-bar'), currentPcHP, pc.hp);
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
      player.moves.forEach(move => {

       let filteredMove = moves.filter(m => m.id === move);
       $('#move-options').append(`<button class="btn btn-primary move-btn">${filteredMove[0].name}</button>`);

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
      return location = "../"
    }

    pc = pcTeam[pcIndex];
    updateUI();
    $('#log').append(`<br>⚠️ O PC enviou ${pc.name}!`);
  }
}

async function executeTurn(playerMoveName, movesSet) {
  $('.move-btn').prop('disabled', true);

  

  const playerMove = movesData[playerMoveName];
  const pcMoveID = pc.moves[pc.moves.length > 1 ? Math.floor(Math.random() * pc.moves.length) : 0];
  const pcMove = movesSet.filter(m => m.id === pcMoveID)[0]
  
  //  console.log(pcMove)
  

  const pPriority = playerMove.priority;
  const cPriority = pcMove.priority;

  const playerFirst = (
    pPriority > cPriority ||
    (pPriority === cPriority && player.spe >= pc.spe)
  );

  if (playerFirst) {
    let { damage, effective } = calcDamage(player, pc, playerMove);
    pcHPMap[pcIndex] -= damage;
    const sound = effective > 1 ? superEffectiveSound : attackSound;
    sound.currentTime = 0; sound.play();

    $('#log').html(`${player.name} usou ${playerMove.name} causando ${damage} de dano.`);
    if (effective > 1) $('#log').append("<br><strong>É super efetivo!</strong>");
    if (effective < 1) $('#log').append("<br><em>O ataque não foi muito efetivo...</em>");
    updateUI();
    await delay(1000);

    if (pcHPMap[pcIndex] <= 0) {
      $('#log').append(`<br>${pc.name} desmaiou!`);
      faintSound.currentTime = 0; faintSound.play();
      updateUI();
      await delay(1000);
      checkFaintAndSwitch();
      $('.move-btn').prop('disabled', false);
      return;
    }

    let res = calcDamage(pc, player, pcMove);
    playerHPMap[playerIndex] -= res.damage;
    const pcSound = res.effective > 1 ? superEffectiveSound : attackSound;
    pcSound.currentTime = 0; pcSound.play();

    $('#log').append(`<br>${pc.name} usou ${pcMove.name} causando ${res.damage} de dano.`);
    if (res.effective > 1) $('#log').append("<br><strong>É super efetivo!</strong>");
    if (res.effective < 1) $('#log').append("<br><em>O ataque não foi muito efetivo...</em>");
    updateUI();
    await delay(1000);
  } else {
    let res = calcDamage(pc, player, pcMove);
    playerHPMap[playerIndex] -= res.damage;
    const pcSound = res.effective > 1 ? superEffectiveSound : attackSound;
    pcSound.currentTime = 0; pcSound.play();

    $('#log').html(`${pc.name} usou ${pcMove.name} causando ${res.damage} de dano.`);
    if (res.effective > 1) $('#log').append("<br><strong>É super efetivo!</strong>");
    if (res.effective < 1) $('#log').append("<br><em>O ataque não foi muito efetivo...</em>");
    updateUI();
    await delay(1000);

    if (playerHPMap[playerIndex] <= 0) {
      $('#log').append(`<br>${player.name} desmaiou!`);
      faintSound.currentTime = 0; faintSound.play();
      updateUI();
      await delay(1000);
      checkFaintAndSwitch();
      $('.move-btn').prop('disabled', false);
      return;
    }

    let { damage, effective } = calcDamage(player, pc, playerMove);
    pcHPMap[pcIndex] -= damage;
    const sound = effective > 1 ? superEffectiveSound : attackSound;
    sound.currentTime = 0; sound.play();

    $('#log').append(`<br>${player.name} usou ${playerMove.name} causando ${damage} de dano.`);
    if (effective > 1) $('#log').append("<br><strong>É super efetivo!</strong>");
    if (effective < 1) $('#log').append("<br><em>O ataque não foi muito efetivo...</em>");
    updateUI();
    await delay(1000);
  }

  checkFaintAndSwitch();
  $('.move-btn').prop('disabled', false);
}

$(document).ready(function () {
  $.when(
    $.getJSON("../db/pokemons.json"),
    $.getJSON("../db/moves.json")
  ).done(function (pokeRes, moveRes) {

    
    const pokemons = pokeRes[0];
    moves = moveRes[0];

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
      p.hp = p.hp * controlHpPlayer
      playerHPMap[i] = p.hp
    });
    pcTeam.forEach((p, i) => {
      p.hp = p.hp * controlHpPc
      pcHPMap[i] = p.hp
    });

    player = playerTeam[playerIndex];
    pc = pcTeam[pcIndex];

    updateUI();

    

    

    player.moves.forEach(move => {
      
      let filteredMove = moves.filter(m => m.id === move);
      // console.log()
      $('#move-options').append(`<button class="btn btn-primary move-btn">${filteredMove[0].name}</button>`);
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
