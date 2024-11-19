// Variable que cambiará cuando la página esté completamente cargada
let pageLoaded = false;

// Referencia a la barra de progreso
const progressBar = document.getElementById('progressBar');
const contenedor_loading = document.getElementById('cont_loading');
const logoanimado = document.getElementById('logo_animado');
const conteprogress = document.getElementById('progress');
const ilogoestatico = document.getElementById('ilogoestatico');
const ilogoanimador = document.getElementById('ilogoanimador');
const textologo = document.getElementById('nombrelogo');
const imgparrafoinicio = document.getElementById('imgparrafoinicio');

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
animaloading.to(ilogoestatico, {
    duration: 0,
    opacity: "100%",
});
animaloading.to(ilogoanimador, {
    duration: 0,
    opacity: "0%",
});

animaloading.to(textologo, {
    duration: 1,
    width: "max-content",
    display: "flex"
});
animaloading.to(imgparrafoinicio, {
    duration: 1,
    opacity: "100%",
});


// Progreso inicial
let progress = 0;

// Función para actualizar el ancho de la barra de progreso
function updateProgressBar() {
    if (progress < 100) {
        progress += 1;
        progressBar.style.width = `${progress}%`;
    } else {
        // Cuando el progreso llega al 100%
        clearInterval(progressInterval);
        progressBar.style.width = `${progress}%`;
        pageLoaded = true; // Cambia la variable
        setTimeout(() => {
            audioPlayer.play();
            animateWave();
            conteprogress.style.display = "none"; // Elimina el contenedor de la vista
            animaloading.play(); // Ejemplo: Se puede incluir otra animación aquí
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





// Selecciona todos los elementos h5
const titles = document.querySelectorAll("h5");

// Función para animar las palabras letra por letra
function animateWords() {
    titles.forEach((title) => {
        // Obtén los valores personalizados del retraso desde los atributos 'data-*'
        const globalDelay = parseFloat(title.getAttribute('data-global-delay')); // Retraso global en segundos
        const letterDelay = parseInt(title.getAttribute('data-letter-delay')); // Retraso entre letras en milisegundos

        // Divide el texto de cada h5 en letras y espacios, envuelve cada uno en un <span>
        title.innerHTML = title.textContent
            .split("")
            .map(char => char === " " ? `<span class="space"> </span>` : `<span class="letter">${char}</span>`)
            .join("");

        // Selecciona todas las letras y espacios dentro del título actual
        const lettersAndSpaces = title.querySelectorAll(".letter, .space");

        // Aplica la animación a cada letra y espacio
        lettersAndSpaces.forEach((element, index) => {
            setTimeout(() => {
                // Añade el retraso global antes de iniciar la animación
                setTimeout(() => {
                    element.style.transform = "translateY(0)";
                    element.style.opacity = "1";
                }, globalDelay * 1000); // Retraso global (en segundos)

            }, index * letterDelay); // Retraso entre letras y espacios (en milisegundos)
        });
    });
}

// Inicia la animación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", animateWords);



const audioButton = document.getElementById('audio-button');
const audioPlayer = document.getElementById('audio-player');
const wavePath = document.getElementById('wave-path');

let isPlaying = false;
let animationFrame;

// Estados de la onda
const waveStates = [
    "M0 15 L 120 15",
    "M0 15 Q 10 5, 20 15 T 40 15 T 60 15 T 80 15 T 100 15 T 120 15", // Estado inicial
    "M0 15 Q 10 25, 20 15 T 40 15 T 60 15 T 80 15 T 100 15 T 120 15" // Estado animado
];

// Función para animar las ondas
function animateWave() {
    let progress = 0;

    function step() {
        progress += 0.1;
        const t = (Math.sin(progress) + 4) / 3; // Oscilación entre 0 y 1
        const interpolatedPath = interpolatePaths(waveStates[1], waveStates[2], t);
        wavePath.setAttribute('d', interpolatedPath);
        animationFrame = requestAnimationFrame(step);
    }
    step();
}

// Interpolación entre dos caminos SVG
function interpolatePaths(path1, path2, t) {
    const regex = /-?\d+(\.\d+)?/g;
    const nums1 = path1.match(regex).map(Number);
    const nums2 = path2.match(regex).map(Number);
    const interpolated = nums1.map((num, i) => num + t * (nums2[i] - num));
    return path1.replace(regex, () => interpolated.shift());
}


// Evento del botón de audio
audioButton.addEventListener('click', () => {
    if (isPlaying) {
        fadeVolume(audioPlayer, 1); // Aumenta volumen suavemente
        animateWave(); // Inicia la animación
    } else {
        fadeVolume(audioPlayer, 0); // Reduce volumen suavemente
        cancelAnimationFrame(animationFrame); // Detiene la animación
        wavePath.setAttribute('d', waveStates[0]); // Vuelve al estado inicial
    }
    isPlaying = !isPlaying;
});

// Función para hacer un fade del volumen
function fadeVolume(audioElement, targetVolume) {
    const step = 0.01; // Paso de volumen
    const intervalTime = 10; // Intervalo entre ajustes en ms
    const fadeInterval = setInterval(() => {
        if (Math.abs(audioElement.volume - targetVolume) <= step) {
            audioElement.volume = targetVolume; // Ajusta al volumen objetivo
            clearInterval(fadeInterval); // Detiene el intervalo
        } else if (audioElement.volume < targetVolume) {
            audioElement.volume += step; // Aumenta volumen
        } else {
            audioElement.volume -= step; // Disminuye volumen
        }
    }, intervalTime);
}





//lottie menu

LottieInteractivity.create({
    player: '#firstLottie',
    mode: 'cursor',
    speed:200,
    actions: [
        {
        type: "toggle",
        
    }]
});