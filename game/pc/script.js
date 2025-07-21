    let selected = [];
    let pokes;
    let filterName = "";

    // Recupera seleção anterior, se houver
   const savedSelection = JSON.parse(localStorage.getItem('playerTeam') || '[]');
    
    if (Array.isArray(savedSelection)) {
      selected = savedSelection;
    }

    $(document).ready(function () {
    $.getJSON("../db/pc.json", function (pc) {

      setTimeout(() => {
        const data = pc;
        pokes = data;

        function loadingData(data, filterName = "") {
          $('#pokemon-list').empty(); 
          $('#loading').hide();

          const filteredData = data.filter(pokemon => pokemon.name.toLowerCase().includes(filterName));
          
          if (filteredData.length === 0) {
            $('#no-results').show();
            return;
          }
          
          $('#no-results').hide();

          filteredData.forEach((pokemon) => {
            
            const isSelected = selected.includes(pokemon.register);
            const selectedClass = isSelected ? 'selected' : '';
              
            const card = `
              <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                <div class="pokemon-card ${selectedClass}" data-id="${pokemon.register}">
                  <div class="pokemon-level">Lv: <span>1</span></div>
                  <div class="sprite-container">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemon.id}.gif" class="pokemon-sprite" loading="lazy">
                  </div>
                  <div class="pokemon-info">
                    <div class="pokemon-name">${pokemon.name}</div>
                    <div class="pokemon-type-info">Type: ${pokemon.type}</div>
                    <div class="pokemon-stats">HP: ${pokemon.hp} | Atk: ${pokemon.atk} | Def: ${pokemon.def} | Spe: ${pokemon.spe}</div>
                  </div>
                </div>
              </div>
            `;
            $('#pokemon-list').append(card);
          });

          // Reaplica os eventos de clique após o redraw
          $('.pokemon-card').on('click', function () {
            const id = $(this).data('id');

            if ($(this).hasClass('selected')) {
              $(this).removeClass('selected');
              selected = selected.filter(p => p !== id);

            } else if (selected.length < 6) {
              $(this).addClass('selected');
              selected.push(id);

            } else if (selected.length === 6) {
              const firstId = selected.shift(); 
              $(`[data-id='${firstId}']`).removeClass('selected'); 

              // Adiciona o novo
              $(this).addClass('selected');
              selected.push(id);
            }

            $('#confirm-btn').prop('disabled', selected.length <= 0);
            updateConfirmButtonText();
          });

          
          $('#confirm-btn').prop('disabled', selected.length <= 0);
          updateConfirmButtonText();
        }

        function updateConfirmButtonText() {
          const count = selected.length;
          const btn = $('#confirm-btn');
          btn.text(` Confirmar Seleção (${count})`);
          
          if (count === 6) {
            btn.addClass('team-complete');
          } else {
            btn.removeClass('team-complete');
          }
        }

        // Mostra loading inicialmente
        $('#loading').show();
        
        // Chamada inicial para exibir todos os pokémons
        setTimeout(() => {
          loadingData(data);
        }, 500);

        // Evento para filtro de busca
        $("#search-input").on("input", () => {
          filterName = $("#search-input").val().toLowerCase();
          loadingData(data, filterName);
        });

        // Botão de confirmação
        $('#confirm-btn').on('click', function () {
          if (selected.length <= 6) {
            // console.log(selected)
             localStorage.setItem('playerTeam', JSON.stringify(selected));
            let listPokes = pokes.filter(p => selected.includes(p.register));
            listPokes = listPokes.map(p => p.name);
            showNotification("Pokémon selecionados: " + listPokes.join(", "), 'success');
            
            setTimeout(() => {
              window.location.href = "../";
            }, 1000);

          }
        });

        updateConfirmButtonText();
      }, 800); 
      
  })



	function showNotification(message, type = 'info') {
			const notification = document.createElement('div');
			notification.className = `notification ${type}`;
			notification.textContent = message;
			
			notification.style.cssText = `
					position: fixed;
					top: 20px;
					right: 20px;
					background: ${type === 'error' ? 'linear-gradient(45deg, #e74c3c, #c0392b)' : 
											type === 'success' ? 'linear-gradient(45deg, #27ae60, #2ecc71)' : 
											'linear-gradient(45deg, #3498db, #2980b9)'};
					color: white;
					padding: 15px 25px;
					border-radius: 10px;
					font-weight: 600;
					font-family: 'Rajdhani', sans-serif;
					font-size: 16px;
					box-shadow: 0 10px 25px rgba(0,0,0,0.3);
					z-index: 10000; transform: translateX(100%);
					opacity: 0;
					transition: all 0.3s ease;
			`;
			
			document.body.appendChild(notification);
			
			setTimeout(() => {
					notification.style.transform = 'translateX(0)';
					notification.style.opacity = '1';
			}, 10);
			
			setTimeout(() => {
					notification.style.transform = 'translateX(100%)';
					notification.style.opacity = '0';
					setTimeout(() => {
							notification.remove();
					}, 300);
			}, 3000);
	}

});