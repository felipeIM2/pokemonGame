$(document).ready(function () {
  $('#btn-choose').on('click', function () {
    window.location.href = 'choose/index.html';
  });

  $('#btn-battle').on('click', function () {
    window.location.href = 'battle/index.html';
  });


  $('#btn-random').on('click', function () {
    alert("Selecionar 6 Pokémon aleatórios para jogador e PC.");
    // Aqui você criará o time aleatório e inicia a batalha
  });

  $('#btn-reset-team').on('click', function () {
    localStorage.removeItem('playerTeam');
  });
  
});
