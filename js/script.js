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
    margin:"2vh",
    height: "96dvh",
    borderRadius:"2vh",
});
animaloading.to(logoanimado, {
    duration: 1,
    ease: 'power2.out',
    top:"3vh",
    left:"3vh",
    width:"2vw",
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
        conteprogress.style.opacity= "0%";
        animaloading.play();
    }
}

// Incrementa el progreso cada 50ms (puedes ajustarlo según tu preferencia)
const progressInterval = setInterval(updateProgressBar, 50);

// Detecta cuándo la página y los recursos han cargado completamente
window.addEventListener('load', () => {
    progress = 100; // Forza el progreso al 100% al terminar la carga
    updateProgressBar();
});