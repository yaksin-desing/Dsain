// Variable que cambiará cuando la página esté completamente cargada
let pageLoaded = false;

// Referencia a la barra de progreso
const progressBar = document.getElementById('progressBar');
const contenedor_loading = document.getElementById('cont_loading');
const logoanimado = document.getElementById('logo_animado');
const conteprogress = document.getElementById('progress');
const ilogoestatico = document.getElementById('ilogoestatico');
const ilogoanimador = document.getElementById('ilogoanimador');

//timeline loading
const animaloading = gsap.timeline({
    paused: true
});
animaloading.to(contenedor_loading, {
    duration: 1,
    ease: 'power2.out',
    margin: "2vh",
    height: "96dvh",
    borderRadius: "2vh",
});
animaloading.to(logoanimado, {
    duration: 1,
    ease: 'power2.out',
    top: "3vh",
    left: "3vh",
    width: "max-content",
});
animaloading.to(ilogoanimador, {
    duration: 0,
    opacity: "0%",
});
animaloading.to(ilogoestatico, {
    duration: 0,
    opacity: "100%",
});


// Progreso inicial
let progress = 0;

// Función para actualizar el ancho de la barra de progreso
function updateProgressBar() {
    if (progress < 100) {
        progress += 1;
        progressBar.style.width = `${progress}%`;
        console.log(`Progress: ${progress}%`);
    } else {
        // Cuando el progreso llega al 100%
        clearInterval(progressInterval);
        progressBar.style.width = `${progress}%`;
        pageLoaded = true; // Cambia la variable
        setTimeout(() => {
            conteprogress.style.display = "none"; // Elimina el contenedor de la vista
            animaloading.play(); // Ejemplo: Se puede incluir otra animación aquí
            anitexto.play();
            animateWords(); // Llama a la función para animar palabras
        }, 500);
    }
}

// Incrementa el progreso cada 50ms (puedes ajustarlo según tu preferencia)
const progressInterval = setInterval(updateProgressBar, 50);

// Detecta cuándo la página y los recursos han cargado completamente
window.addEventListener('load', () => {
    progress = 100; // Forza el progreso al 100% al terminar la carga
    updateProgressBar();
});


// Seleccionar el texto
const textElement = document.querySelector('#animateText');

// Función para animar las palabras letra por letra
function animateWords() {
    // Divide el texto en letras
    textElement.innerHTML = textElement.textContent
        .split("")
        .map(char => `<span class="letter">${char}</span>`)
        .join("");

    // Selecciona todas las letras
    const letters = document.querySelectorAll(".letter");

    // Aplica la animación a cada letra
    letters.forEach((letter, index) => {
        setTimeout(() => {
            letter.style.transform = "translateY(0)";
            letter.style.opacity = "1";
        }, index * 100); // Retraso entre letras
    });
}

// Estilo inicial para las letras
document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `
      #animateText {
        display: inline-block;
        overflow: hidden;
        font-size: 21px;
      }
      .letter {
        display: inline-block;
        transform: translateY(100%);
        opacity: 0;
        transition: transform 0.5s ease, opacity 0.5s ease;
      }
    `;
    document.head.appendChild(style);
});


// Selecciona el título y divide cada letra en un span
const title = document.getElementById("animatedTitle");
title.innerHTML = title.textContent
    .split("")
    .map(letter => `<span>${letter}</span>`)
    .join("");

// Selecciona todas las letras
const letters = document.querySelectorAll("#animatedTitle span");

// Crea el timeline de GSAP
const anitexto = gsap.timeline({
    paused: true,
    defaults: {
        ease: "power2.out",
        duration: 0.5,
        delay: 1,
    }
});

// Anima cada letra desde el eje Y 100% al 0%
letters.forEach((letter, index) => {
    anitexto.to(
        letter, {
            y: "0%",
            opacity: 1
        },
        index * 0.2 // Retraso progresivo entre letras
    );
});