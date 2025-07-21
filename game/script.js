	let gameState = {}

	const typeColors = {
			Bug: "#4A7437", Dark: "#2C2C2C", Dragon: "#4F6DA1", Electric: "#F4D23C",
			Fairy: "#D46DB2", Fighting: "#C22E28", Fire: "#EE8130", Flying: "#A98FF3",
			Ghost: "#735797", Grass: "#7AC74C", Ground: "#E2BF65", Ice: "#96D9D6",
			Normal: "#A8A77A", Poison: "#A33EA1", Psychic: "#F95587", Rock: "#B6A136",
			Steel: "#B7B7CE", Water: "#6390F0"
	};

	const legendary = [
			"Articuno",
			"Zapdos",
			"Moltres",
			"Mewtwo",
			"Mew",
			"Raikou",
			"Entei",
			"Suicune",
			"Lugia",
			"Ho-Oh",
			"Celebi",
			"Regirock",
			"Regice",
			"Registeel",
			"Latias",
			"Latios",
			"Kyogre",
			"Groudon",
			"Rayquaza",
			"Jirachi",
			"Deoxys"
	];        
	
	let pokemons;
	let moves;
	let effectiveness;
	let pcTeam = [];
	let boss = localStorage.getItem("boss") || [];
	let mockTeam =localStorage.getItem("playerTeam") || []

        
function initializeInterface() {
		updateResourceDisplay();
		loadPokemonTeam();
		setupEventListeners();
		
}

function updateResourceDisplay() {
	$.when($.getJSON("./db/perfil.json")).done(function (perfil) {

		gameState = {
				coins: perfil[0].resources[0].coins,
				gems: perfil[0].resources[0].gems,
				xp: perfil[0].resources[0].xp,		
		};

		$('#coins-balance').text(perfil[0].resources[0].coins.toLocaleString()) ;
		$('#xp-balance').text(perfil[0].resources[0].xp.toLocaleString());
		$('#gem-balance').text(perfil[0].resources[0].gems.toLocaleString());

	})
}

function loadPokemonTeam() {

	$.when($.getJSON("./db/pc.json")).done(function (pc) {
		
	let playerTeam = pc.filter((p) => mockTeam.includes(p.register))

		const loadingSpinner = $('.loading-spinner');
		const pokemonContainer = $('.selected-pokemon');
		
		loadingSpinner[0].style.display = 'flex';
		pokemonContainer[0].style.display = 'none';
		
		setTimeout(() => {
				const teamHTML = playerTeam.map(pokemon => {
						const bgColor = typeColors[pokemon.type[0]] || "#A8A77A";
						
						return `
								<div class="pokemon-selected" style="background: linear-gradient(145deg, ${bgColor}88, ${bgColor}44);" title="${pokemon.name}">
										<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemon.id}.gif" 
													alt="${pokemon.name}" 
													onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png'">
								</div>
						`;
				}).join("");

				pokemonContainer[0].innerHTML = teamHTML;
				loadingSpinner[0].style.display = 'none';
				pokemonContainer[0].style.display = 'grid';
				
				
				const pokemonCards = $('.pokemon-selected');
				pokemonCards.forEach((card, index) => {
						card.style.opacity = '0';
						card.style.transform = 'translateY(30px) scale(0.8)';
						setTimeout(() => {
								card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
								card.style.opacity = '1';
								card.style.transform = 'translateY(0) scale(1)';
						}, index * 100);
				});
		}, 1000);
	})
}

function setupEventListeners() {
	$.when(
	$.getJSON("./db/pokedex.json"),
	$.getJSON("./db/moves.json"),
	).done(function (pokeRes, moveRes) {
            
		$('#capture-btn').on('click', function() {
		
			if(gameState.coins < 1000) return showNotification("Voce não tem moedas suficientes para capturar um pokemons!");
			if(mockTeam.length <= 0) return showNotification("Favor selecionar um pokemon para batalhar!");
			 showNotification('Preparando batalha de captura...', 'success');
				
					pokemons = pokeRes[0];
					moves = moveRes[0]; 
					
					const evo1 = 70;
					const evo2= 20;
					const legendaryChance = 2;

					function getRandomPokemon(pokemons, legendaryList, legendaryIncluded) {
							
							const rand = Math.random() * 100;

							if (!legendaryIncluded && rand <= legendaryChance) {
									const legendaryCandidates = pokemons.filter(p => legendaryList.includes(p.name));
									if (legendaryCandidates.length > 0) {
											const chosen = legendaryCandidates[Math.floor(Math.random() * legendaryCandidates.length)];
											return { pokemon: chosen, legendaryIncluded: true };
									}
							}

							const evoRand = Number((Math.random() * 100).toFixed(0));
							let evoStage;

							if (evoRand <= evo1) {
								evoStage = 1;
							} else if (evoRand <= evo2 + evo1) {
								evoStage = 2;
							} else {
								evoStage = 3;
							}

							const candidates = pokemons.filter(
								p => p.evo === evoStage && !legendaryList.includes(p.name)
							);

							if (candidates.length === 0) return null;

							const chosen = candidates[Math.floor(Math.random() * candidates.length)];
							return { pokemon: chosen, legendaryIncluded };
					}

					let legendaryIncluded = false;

					while (pcTeam.length < 10) {
							const result = getRandomPokemon(pokemons, legendary, legendaryIncluded);
							if (result && result.pokemon) {
									pcTeam.push(result.pokemon);
									legendaryIncluded = result.legendaryIncluded;
							}
					}
					
					localStorage.setItem('pcTeam', JSON.stringify(pcTeam.map(p => p.id)));
					console.log(pcTeam)
					setTimeout(() => {
							this.style.transform = '';
							// location.href = './capture';
					}, 1000);
		});
					
		$('#boss-btn').on('click', function() {
	
			if(gameState.gems < 10) return showNotification("Voce não tem gemas suficientes para enfrentar um boss!");
			if(mockTeam.length <= 0) return showNotification("Favor selecionar um pokemon para batalhar!");
			 showNotification('Preparando batalha contra boss...', 'success');

          pokemons = pokeRes[0];
          moves = moveRes[0]; 
          
          if(boss.length === 0) {

            function createBoss(boss){
              
              while (boss.length < 1) {
                const rand = pokemons[Math.floor(Math.random() * pokemons.length)];
                boss.push(rand);
              }
            }
              createBoss(boss)

            if(legendary.includes(boss[0].name))return createBoss(boss)

            localStorage.setItem('boss', JSON.stringify(boss.map(p => p.id)));
						this.style.transform = '';
						
           	setTimeout(() => {	
							location = "./boss"
						}, 1000);

          } else {

            localStorage.setItem('boss', boss);
						this.style.transform = '';
						
						setTimeout(() => {	
							location = "./boss"
						}, 1000);

          }   
		});
					
		['market-btn', 'events-btn', 'bag-btn'].forEach(btnId => {
				$(btnId).on('click', function() {

						showNotification('Funcionalidade em desenvolvimento!', 'info');
				});
		});

		$('#pc-btn').on('click', function() {
				showNotification('Abrindo PC Pokémon...', 'success');
				location.href = './pc';
		});

 })
}

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

  $(document).on('DOMContentLoaded', initializeInterface);
