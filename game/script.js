    // Game state
  let gameState = {
      coins: 500,
      gems: 50,
      xp: 0,
      capturedPokemon: [],
      currentBattle: null
  };


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


    $('#coins-balance').text(gameState.coins);
    $('#xp-balance').text(gameState.xp);
    $('#gem-balance').text(gameState.gems);


    $(document).ready(() => {
      
      $.getJSON("./db/pokemons.json").done(function (pokemons) {
        const playerTeam = JSON.parse(localStorage.getItem('playerTeam') || "[]");
        const findteam = pokemons.filter(p => playerTeam.includes(p.id));

        
        let teamHTML = findteam.map(pokemon => {
          
          const bgColor = typeColors[pokemon.type[0]] || "#FFF"; 

          return `
            <div class="pokemon-selected" style="background:${bgColor}">
              <div>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemon.id}.gif">
              </div>
            </div>
          `;
        }).join("");

        $("#selected-pokemon").html(teamHTML);
      });
    });

    $("#capture-btn").on("click", () => { 
        $.when(
        $.getJSON("./db/pokemons.json"),
        $.getJSON("./db/moves.json"),
        $.getJSON("./db/effectiveness.json")
        ).done(function (pokeRes, moveRes, effectivenessRes) {
            
         if(gameState.gems < 10) return alert("Voce não tem gemas suficientes para capturar um pokemons!")
         
          pokemons = pokeRes[0];
          moves = moveRes[0]; 
          effectiveness = effectivenessRes[0];
          

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
          
        // console.log(pcTeam)


          

          // localStorage.setItem('pcTeam', JSON.stringify(pcTeam.map(p => p.id)));
          // location = "./capture"

      })
    })
    
    $("#boss-btn").on("click", () => { 
        $.when(
        $.getJSON("./db/pokemons.json"),
        $.getJSON("./db/moves.json"),
        $.getJSON("./db/effectiveness.json")
        ).done(function (pokeRes, moveRes, effectivenessRes) {
            
         if(gameState.coins < 300) return alert("Voce não tem moedas suficientes para enfrentar um boss!")
         
          pokemons = pokeRes[0];
          moves = moveRes[0]; 
          effectiveness = effectivenessRes[0];
          
          function createBoss(pcTeam){
            
            while (pcTeam.length < 1) {
              const rand = pokemons[Math.floor(Math.random() * pokemons.length)];
              pcTeam.push(rand);
            }
          }
          createBoss(pcTeam)

          
          if(legendary.includes(pcTeam[0].name))return createBoss(pcTeam)

          localStorage.setItem('boss', JSON.stringify(pcTeam.map(p => p.id)));
          location = "./boss"

      })
    })

    $("#market-btn").click(() => alert("Módulo em manutenção!!") )

    $("#pc-btn").click(() => location = "./pc");