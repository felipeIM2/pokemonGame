    // Game state
    let gameState = {
        coins: 500,
        gems: 50,
        xp: 0,
        capturedPokemon: [],
        currentBattle: null
    };

    let pokemons;
    let moves;
    let effectiveness;
    let pcTeam = [];
    

    $('#coins-balance').text(gameState.coins);
    $('#xp-balance').text(gameState.xp);
    $('#gem-balance').text(gameState.gems);




    $("#capture-btn").on("click", () => { 
        $.when(
        $.getJSON("./db/pokemons.json"),
        $.getJSON("./db/moves.json"),
        $.getJSON("./db/effectiveness.json")
        ).done(function (pokeRes, moveRes, effectivenessRes) {
            
         if(gameState.gems < 10) return alert("Voce não tem gemas suficientes para capturar um pokemons!")
         
          const playerTeamNames = JSON.parse(localStorage.getItem('playerTeam') || "[]")
          if (!playerTeamNames || playerTeamNames.length !== 6) {
            alert("Você precisa escolher 6 Pokémon antes de batalhar.");
            window.location.href = "../pc";
            return;
          }

          pokemons = pokeRes[0];
          moves = moveRes[0]; 
          effectiveness = effectivenessRes[0];
          
          while (pcTeam.length < 10) {
            const rand = pokemons[Math.floor(Math.random() * pokemons.length)];
            pcTeam.push(rand);
          }

          console.log(pcTeam)

          localStorage.setItem('pcTeam', JSON.stringify(pcTeam.map(p => p.id)));
          location = "./capture"

      })
    })
    
    $("#boss-btn").on("click", () => { 
        $.when(
        $.getJSON("./db/pokemons.json"),
        $.getJSON("./db/moves.json"),
        $.getJSON("./db/effectiveness.json")
        ).done(function (pokeRes, moveRes, effectivenessRes) {
            
         if(gameState.coins < 300) return alert("Voce não tem moedas suficientes para enfrentar um boss!")
         
          const playerTeamNames = JSON.parse(localStorage.getItem('playerTeam') || "[]")
          if (!playerTeamNames || playerTeamNames.length !== 6) {
            alert("Você precisa escolher 6 Pokémon antes de batalhar.");
            window.location.href = "../pc";
            return;
          }

          pokemons = pokeRes[0];
          moves = moveRes[0]; 
          effectiveness = effectivenessRes[0];
          
          while (pcTeam.length < 1) {
            const rand = pokemons[Math.floor(Math.random() * pokemons.length)];
            pcTeam.push(rand);
          }

          console.log(pcTeam)
          localStorage.setItem('boss', JSON.stringify(pcTeam.map(p => p.id)));
          location = "./boss"

      })
    })

    $("#market-btn").click()

    $("#pc-btn").click(() => location = "./pc");