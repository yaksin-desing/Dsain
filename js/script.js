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
const cortina = document.getElementById('cortina');
const contparrafo = document.querySelector('.contparrafo');
const cursors = document.querySelector('.cursor');


function createAnimation() {
    let screenWidth = window.innerWidth; // Obtiene el ancho de la pantalla
    let animaloading = gsap.timeline({
        paused: true
    });

    // Animaciones para móviles
    if (screenWidth <= 550) {
        //timeline loading

        animaloading.to(contparrafo, {
            delay: -1,
            duration: 0,
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
        animaloading.to(parrafodeinicio, {
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
        animaloading.to(botoninicio, {
            bottom: "-20vh",
        });
        animaloading.to(cursors, {
            delay: -1,
            opacity: "100%",
        });
        animaloading.to(cortina, {
            opacity: 0, // Usa valores numéricos en vez de porcentajes
            duration: 1.5, // Aumenta la duración para más suavidad
            ease: 'power3.out', // Prueba con 'power4.out' si quieres algo aún más suave
        });
    } else if (screenWidth > 550 && screenWidth <= 1024) {
        // Animaciones para tablets
        animaloading.to(contparrafo, {
            duration: 0,
            opacity: "100%",
        });

        // animaloading.to(parrafodeinicio, {
        //     duration: 1,
        //     opacity: "100%",
        // });
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
        animaloading.to(botoninicio, {
            bottom: "-20vh",
        });
        animaloading.to(cursors, {
            delay: -1,
            opacity: "100%",
        });
        animaloading.to(cortina, {
            opacity: 0, // Usa valores numéricos en vez de porcentajes
            duration: 1.5, // Aumenta la duración para más suavidad
            ease: 'power3.out', // Prueba con 'power4.out' si quieres algo aún más suave
        });
    } else {
        // Animaciones para pantallas grandes

        animaloading.to(contparrafo, {
            delay: -1,
            duration: 0,
            opacity: "100%",
        });
        animaloading.to(contenedor_loading, {
            duration: 1,
            ease: 'power2.out',
            margin: "2vh",
            height: "96vh",
            borderRadius: "2vh",
        });
        animaloading.to(tituloh1, {
            opacity: "100%",
        });
        animaloading.to(parrafodeinicio, {
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
        animaloading.to(botoninicio, {
            bottom: "-20vh",
        });
        animaloading.to(cursors, {
            delay: -1,
            opacity: "100%",
        });
        animaloading.to(cortina, {
            opacity: 0, // Usa valores numéricos en vez de porcentajes
            duration: 1.5, // Aumenta la duración para más suavidad
            ease: 'power3.out', // Prueba con 'power4.out' si quieres algo aún más suave
        });
    }

    return animaloading;
}

// Crear la animación al cargar la página
let animaloading = createAnimation();

// Ejecutar la animación cuando termine la carga
setTimeout(() => {
    animaloading.play();
}, 0);


let progress = 0;
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const extraDelay = isMobile ? 500 : 0; // Si es móvil, agrega 2 segundos extra

// Función para actualizar la barra de progreso
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
            // audioPlayer.play();
            animateWave();
            conteprogress.style.display = "none"; // Oculta el loader
            animaloading.play(); // Inicia animaciones
        }, 500 + extraDelay); // Suma el tiempo extra si es móvil
    }
}

// Incrementa el progreso cada 50ms
const progressInterval = setInterval(updateProgressBar, 50);

// Detecta cuándo la página y los recursos han cargado completamente
window.addEventListener('load', () => {
    setTimeout(() => {
        progress = 100; // Forza el progreso al 100%
        updateProgressBar();
    }, extraDelay); // Si es móvil, espera antes de terminar la carga
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
animateWords();





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
        playAnimation()
    } else {
        // Ocultar el menú
        navMenu.classList.remove("show");
        setTimeout(() => {
            navMenu.classList.add("hidden");
        }, 500); // Coincide con la duración de la animación

        // Animar del frame 30 al 0
        lottiePlayer.playSegments([30, 0], true);
        reverseAnimation()
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

let screenWidth = window.innerWidth; // Obtiene el ancho de la ventana del navegador

if (screenWidth > 1020) {
    var cursor = document.querySelector('.cursor'),
        cursorScale = document.querySelectorAll('.cursor-scale'),
        mouseX = 0,
        mouseY = 0,
        targetX = 0,
        targetY = 0,
        prevX = 0,
        prevY = 0,
        lerpFactor = 0.12; // Suavizado

    // Animación del cursor
    gsap.to({}, 0.016, {
        repeat: -1,
        onRepeat: function () {
            // Movimiento suavizado
            targetX += (mouseX - targetX) * lerpFactor;
            targetY += (mouseY - targetY) * lerpFactor;

            // Diferencias de movimiento
            let deltaX = targetX - prevX;
            let deltaY = targetY - prevY;
            let speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.1;
            speed = Math.min(speed, 1);

            // Estiramiento según dirección y velocidad
            let scaleX = 1 + Math.abs(deltaX) * 0.02 + speed * 0.3;
            let scaleY = 1 + Math.abs(deltaY) * 0.02 + speed * 0.3;
            let rotation = deltaX * 2;

            // Aplicar transformaciones
            gsap.set(cursor, {
                x: targetX,
                y: targetY,
                scaleX: scaleX,
                scaleY: scaleY,
                rotation: rotation,
                ease: "power2.out"
            });

            prevX = targetX;
            prevY = targetY;
        }
    });

    // Capturar el movimiento del mouse
    window.addEventListener("mousemove", function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Regresar el cursor a su forma original cuando el mouse sale de la ventana
    window.addEventListener("mouseout", function () {
        gsap.to(cursor, {
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            duration: 0.3,
            ease: "elastic.out(1, 0.5)"
        });
    });

    // Efecto de escala y adhesión
    cursorScale.forEach(link => {
        link.addEventListener('mouseleave', () => {
            cursor.classList.remove('grow', 'grow-small');
        });

        link.addEventListener('mousemove', (e) => {
            // Determinar qué clase aplicar
            if (link.classList.contains('small')) {
                cursor.classList.remove('grow');
                cursor.classList.add('grow-small');
            } else {
                cursor.classList.add('grow');
            }

            // Mover el cursor al centro del elemento interactivo
            let rect = link.getBoundingClientRect();
            let centerX = rect.left + rect.width / 2;
            let centerY = rect.top + rect.height / 2;
            mouseX = centerX;
            mouseY = centerY;
        });
    });
}



//Animacion de inicio de escena
const contenedor = document.querySelector('.contenedor');
//timeline loading
const openescena = gsap.timeline({
    paused: true,
    duration: 1,
    delay: -1,
});

openescena.to(cursors, {
    marginTop: "-37px",
});

openescena.to(botoninicio, {
    bottom: "-35vh",
});

openescena.to(parrafodeinicio, {
    opacity: "0",
    display: "none"
});

openescena.to(imgparrafoinicio, {
    opacity: "0",
    display: "none"
});

openescena.to(tituloh1, {
    opacity: "0",
    display: "none"
});

openescena.to(contenedor_loading, {
    duration: 1,
    ease: 'power2.out',
    margin: "0vh",
    height: "100%",
    borderRadius: "0vh",
});


// Escuchar el evento click en el botón
document.getElementById("botoninicio").addEventListener("click", () => {
    openescena.play(); // Iniciar el timeline
    audioPlayer.play();
});


let timelinemenu = gsap.timeline({
    paused: true
}); // Timeline pausado al inicio

document.addEventListener("DOMContentLoaded", () => {
    // Función para dividir el texto en caracteres
    function splitText(element) {
        let text = element.textContent;
        let newHTML = "";
        for (let char of text) {
            newHTML += `<span class="char">${char}</span>`;
        }
        element.innerHTML = newHTML;
    }

    // Selecciona todos los textos animados
    document.querySelectorAll(".animated-text").forEach(el => {
        splitText(el);
        let delay = parseFloat(el.getAttribute("data-delay")) || 0; // Obtiene el delay personalizado

        // Agrega animaciones al timeline
        timelinemenu.to(el.querySelectorAll(".char"), {
            y: 0,
            opacity: 1,
            stagger: 0.05,
            duration: 0.5,
            ease: "power2.out",
            delay: delay
        }, "<"); // "<" hace que las animaciones empiecen en paralelo respetando sus delays
    });
});

// Función para iniciar la animación
function playAnimation() {
    timelinemenu.timeScale(1).play(); // Asegura que la velocidad sea normal al reproducir
}

// Función para reiniciar la animación rápidamente y dejarla en su estado inicial
function reverseAnimation() {
    timelinemenu.timeScale(10).reverse(); // Hace que la reversa sea más rápida
}



const contenedorsc = document.querySelector("#scroll-content");
// Inicializar Smooth Scrollbar
let scrollbar = Scrollbar.init(contenedorsc, {
    damping: 0.1, // Suavidad del scroll
    renderByPixels: false,
    alwaysShowTracks: false,
});

// Conectar ScrollTrigger con Smooth Scrollbar
ScrollTrigger.scrollerProxy(contenedorsc, {
    scrollTop(value) {
        if (arguments.length) {
            scrollbar.scrollTop = value;
        }
        return scrollbar.scrollTop;
    },
    getBoundingClientRect() {
        // Obtener altura del contenedor real
        return {
            top: 0,
            left: 0,
            width: contenedorsc.clientWidth,
            height: contenedorsc.clientHeight // Usar altura real del contenedor
        };
    },
});

// Escuchar los eventos de scroll de Smooth Scrollbar
scrollbar.addListener(ScrollTrigger.update);