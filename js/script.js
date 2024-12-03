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
const tituloh1 = document.getElementById('tituloh1');
const contactnav = document.getElementById('contactnav');
const audio_container = document.getElementById('audio-container');
const videofondo = document.getElementById('videofondo');
const parrafodeinicio = document.getElementById('parrafodeinicio');

//timeline loading
const animaloading = gsap.timeline({
    paused: true
});
animaloading.to(parrafodeinicio, {
    duration: 1,
    opacity: "100%",
});
animaloading.to(contenedor_loading, {
    duration: 1,
    ease: 'power2.out',
    margin: "2vh",
    height: "96dvh",
    borderRadius: "2vh",
});
animaloading.to(tituloh1, {
    opacity: "100%",
});
animaloading.to(logoanimado, {
    duration: 1,
    ease: 'power2.out',
    top: "3vh",
    left: "3vh",
    width: "max-content",
});
animaloading.to(contactnav, {
    opacity: "100%",
});
animaloading.to(videofondo, {
    opacity: "100%",
});
animaloading.to(audio_container, {
    opacity: "100%",
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
let transitionFrame;

// Estados de la onda
const waveStates = [
    "M0 15 Q 10 15, 20 15 T 40 15 T 60 15 T 80 15 T 85 15 T 120 15", // Estado inicial plano
    "M0 15 Q 10 25, 20 15 T 40 15 T 60 15 T 80 15 T 100 15 T 120 15", // Estado inicial ondulado
    "M0 15 Q 10 30, 20 15 T 40 15 T 60 15 T 80 15 T 100 15 T 120 15" // Estado animado
];

// Función para animar las ondas
function animateWave() {
    let progress = 0;

    function step() {
        progress += 0.1;
        const t = (Math.sin(progress) + 1) / 5; // Oscilación entre 0 y 1
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

// Transición suave entre dos estados
function smoothTransition(startPath, endPath, duration = 600, callback) {
    cancelAnimationFrame(animationFrame); // Detiene la animación actual
    const startTime = performance.now();
    const regex = /-?\d+(\.\d+)?/g;
    const numsStart = startPath.match(regex).map(Number);
    const numsEnd = endPath.match(regex).map(Number);

    function step(currentTime) {
        const elapsedTime = currentTime - startTime;
        const t = Math.min(elapsedTime / duration, 1); // Normaliza entre 0 y 1
        const interpolated = numsStart.map((num, i) => num + t * (numsEnd[i] - num));
        const newPath = startPath.replace(regex, () => interpolated.shift());
        wavePath.setAttribute('d', newPath);

        if (t < 1) {
            transitionFrame = requestAnimationFrame(step);
        } else if (callback) {
            callback();
        }
    }
    requestAnimationFrame(step);
}

// Evento del botón de audio
audioButton.addEventListener('click', () => {
    if (isPlaying) {
        fadeVolume(audioPlayer, 1); // Aumenta volumen suavemente
        smoothTransition(
            wavePath.getAttribute('d'), // Estado actual
            waveStates[1], // Transición a ondulado inicial
            500, // Duración
            animateWave // Inicia la animación después de la transición
        );
    } else {
        fadeVolume(audioPlayer, 0); // Reduce volumen suavemente
        smoothTransition(
            wavePath.getAttribute('d'), // Estado actual
            waveStates[0], // Transición a estado plano
            500 // Duración de la transición más suave
        );
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

// Inicializar la animación de Lottie
const lottiePlayer = lottie.loadAnimation({
    container: document.getElementById('menu-button'), // Contenedor del botón
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: './src/img/iconmenu.json', // Cambia esto por la ruta de tu archivo JSON
    speed: 2,
});
lottiePlayer.setSpeed(2);

const menuButton = document.getElementById("menu-button");
const navMenu = document.getElementById("nav-menu");

let isMenuOpen = false;

menuButton.addEventListener("click", (event) => {
    isMenuOpen = !isMenuOpen;

    if (isMenuOpen) {
        // Mostrar el menú
        navMenu.classList.add("show");
        navMenu.classList.remove("hidden");

        // Animar del frame 0 al 30
        lottiePlayer.playSegments([0, 30], true);
    } else {
        // Ocultar el menú
        navMenu.classList.remove("show");
        setTimeout(() => {
            navMenu.classList.add("hidden");
        }, 500); // Coincide con la duración de la animación

        // Animar del frame 30 al 0
        lottiePlayer.playSegments([30, 0], true);
    }

    // Evitar que el clic en el botón del menú cierre el menú (propagación)
    event.stopPropagation();
});

// Cerrar el menú al hacer clic fuera de él
document.addEventListener("click", (event) => {
    if (!navMenu.contains(event.target) && !menuButton.contains(event.target) && isMenuOpen) {
        isMenuOpen = false;
        navMenu.classList.remove("show");

        // Animar del frame 30 al 0
        lottiePlayer.playSegments([30, 0], true);

        setTimeout(() => {
            navMenu.classList.add("hidden");
        }, 500); // Coincide con la duración de la animación
    }
});

//Animacion del cursor

var cursor = document.querySelector('.cursor'),
    cursorScale = document.querySelectorAll('.cursor-scale'),
    mouseX = 0,
    mouseY = 0


gsap.to({}, 0.050, {
    repeat: -1,
    onRepeat: function () {
        gsap.set(cursor, {
            css: {
                left: mouseX,
                top: mouseY
            }
        })
    }
});


window.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY
});


cursorScale.forEach(link => {
    link.addEventListener('mouseleave', () => {
        cursor.classList.remove('grow');
        cursor.classList.remove('grow-small');
    });
    link.addEventListener('mousemove', () => {
        cursor.classList.add('grow');
        if (link.classList.contains('small')) {
            cursor.classList.remove('grow');
            cursor.classList.add('grow-small');
        }
    });
});











//Animacion de inicio de escena


//timeline loading
const openescena = gsap.timeline({
    paused: true,
    duration: 1,
    delay: -1,
});

openescena.to(botoninicio, {
    bottom: "-5vh",
    
});



openescena.to(imgparrafoinicio, {

    opacity: "0",
    display:"none"
});
openescena.to(parrafodeinicio, {

    opacity: "0",
    display:"none"
});
openescena.to(tituloh1, {

    opacity: "0",
    display:"none"
});

openescena.to(contenedor_loading, {
    duration: 1,
    ease: 'power2.out',
    margin: "0vh",
    height: "100dvh",
    borderRadius: "0vh",
});



// Escuchar el evento click en el botón
document.getElementById("botoninicio").addEventListener("click", () => {
    openescena.play(); // Iniciar el timeline
    audioPlayer.play();
  });