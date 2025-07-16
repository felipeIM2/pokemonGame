// Dados fictícios de login para exemplo
const validUsers = [
    { username: "admin", password: "admin" },
    { username: "misty", password: "water123" },
    { username: "brock", password: "rock123" }
];

document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Previne o comportamento padrão do formulário

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const user = validUsers.find(user => user.username === username && user.password === password);

    if (user) {
        alert("Login bem-sucedido! Bem-vindo(a) ao mundo Pokémon.");
        window.location.href = "./game";  // Redirecionar para outra página (Exemplo: página inicial do jogo)
    } else {
        document.getElementById("error-message").textContent = "Usuário ou senha incorretos.";
    }
});
