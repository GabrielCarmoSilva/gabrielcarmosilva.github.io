document.addEventListener("DOMContentLoaded", function () {
    const loader = document.querySelector("#loader");
    const btnStart = document.querySelector("#btn-start");
    const loadingScreen = document.querySelector("#loading-screen");
    const webglOutput = document.getElementById("webgl-output");

    // Inicia o carregamento do jogo enquanto a animação do loader ocorre
    document.querySelector(".box-loader").addEventListener("animationstart", function () {
        const script = document.createElement("script");
        script.type = "module";
        script.src = "index.js";
        webglOutput.appendChild(script);
    });

    // Evento para esconder o loader e mostrar o botão de start após a animação
    document.querySelector(".box-loader").addEventListener("animationend", function () {
        loader.style.display = "none"; 
        btnStart.style.display = "block"; 
    });

    // Ao clicar no botão start, a loadingScreen desaparece
    btnStart.addEventListener("click", function () {
        loadingScreen.style.display = "none"; 
    });
});


