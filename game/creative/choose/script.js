let selected = [];
let pokes;
let filterName = "";

$(document).ready(function () {
  // Carrega os dados do JSON
  $.getJSON("../../db/pokedex.json", function (data) {
    pokes = data;

    // Função para carregar e exibir os cards dos pokémons
    function loadingData(data, filterName = "") {
      $('#pokemon-list').empty(); 

      data
        .filter(pokemon => pokemon.name.toLowerCase().includes(filterName))
        .forEach((pokemon) => {
          const isSelected = selected.includes(pokemon.id);
          const selectedClass = isSelected ? 'selected' : '';

          const card = `
            <div class="col-md-3">
              <div class="card pokemon ${selectedClass}" data-id="${pokemon.id}">
                <p>Lv: <span id="player-lvl">1</span></p> 
                <div class="sprite-wrapper justify-content-center align-items-center">
                  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemon.id}.gif" class="pokemon-sprite">
                </div>
                <div class="card-body text-center">
                  <h5 class="card-title">${pokemon.name}</h5>
                  <p>Type: ${pokemon.type}</p>
                  <p>HP: ${pokemon.hp} | Atk: ${pokemon.atk} | Def: ${pokemon.def} | Spe: ${pokemon.spe}</p>
                </div>
              </div>
            </div>
          `;
          $('#pokemon-list').append(card);
        });

      // Reaplica os eventos de clique após o redraw
      $('.pokemon').on('click', function () {
        const id = $(this).data('id');

        if ($(this).hasClass('selected')) {
          $(this).removeClass('selected');
          selected = selected.filter(p => p !== id);
        } else if (selected.length < 6) {
          $(this).addClass('selected');
          selected.push(id);
        }

        $('#confirm-btn').prop('disabled', selected.length !== 6);
      });
    }

    // Chamada inicial para exibir todos os pokémons
    loadingData(data);

    // Evento para filtro de busca
    $("#search-input").on("input", () => {
      filterName = $("#search-input").val().toLowerCase();
      loadingData(data, filterName);
    });

    // Botão de confirmação
    $('#confirm-btn').on('click', function () {
      localStorage.setItem('playerTeam', JSON.stringify(selected));
      let listPokes = pokes.filter(p => selected.includes(p.id));
      listPokes = listPokes.map(p => p.name);
      alert("Pokémon selecionados: " + listPokes.join(", "));
      window.location.href = "../menu";
    });
  });
});
