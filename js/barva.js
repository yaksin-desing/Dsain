// use a script tag or an external JS file
document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(MorphSVGPlugin)

  const wavePathStart = "M0,1080 L0,800 Q960,900 1920,800 L1920,1080 Z";

  const wavePathmed = "M0,1080 L0,100 Q960,0 1920,100 L1920,1080 Z";

  const wavePathEnd = "M0,1080 L0,-500 Q960,-300 1920,-500 L1920,1080 Z"; // fuera de pantalla

  barba.init({
    transitions: [{
      async leave(data) {
        const done = this.async();

        gsap.set("#transition", {
          pointerEvents: "auto"
        });

        await gsap.timeline()
          .to("#wave", {
            duration: 0.5,
            morphSVG: wavePathStart,
            ease: "none"
          })
          .to("#wave", {
            duration: 0.5,
            morphSVG: wavePathmed,
            ease: "none"
          })
          .to("#wave", {
            duration: 0.4,
            morphSVG: wavePathEnd,
            ease: "power1.in"
          })
          // 👉 Aquí mostramos el GIF justo al final de la ola
          .set("#gif-overlay", {
            display: "block",
            opacity: 0
          })
          .to("#gif-overlay", {
            opacity: 1,
            duration: 0.5
          }) // fade in rápido
          .to("#gif-overlay", {
            delay: 1.5,
            opacity: 0,
            duration: 0.5
          }) // lo dejamos 3s y fade out
          .set("#gif-overlay", {
            display: "none"
          });

        done();
      },
      async enter(data) {
        const done = this.async();

        // Ola baja (entrada)
        await gsap.timeline()
          .set("#wave", {
            morphSVG: wavePathEnd
          })
          .to("#wave", {
            delay: 0,
            duration: 1,
            morphSVG: wavePathStart,
            ease: "power4.out"
          });

        gsap.set("#transition", {
          pointerEvents: "none"
        });
        done();
      }
    }]
  });
});


let screenWidth = window.innerWidth; // Obtiene el ancho de la ventana del navegador

if (screenWidth > 1020) {
  var cursor = document.querySelector('.cursorp'),
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


//lottie menu

// Inicializar la animación de Lottie
const lottiePlayer = lottie.loadAnimation({
  container: document.getElementById('menu-button'), // Contenedor del botón
  renderer: 'svg',
  loop: false,
  autoplay: false,
  path: '../src/img/iconmenu.json', // Cambia esto por la ruta de tu archivo JSON
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



const progressBar = document.getElementById("progress-bar");
const container = document.body; // porque el body es el scroller

container.addEventListener("scroll", () => {
  const scrollTop = container.scrollTop;
  const docHeight = container.scrollHeight - container.clientHeight;
  const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  progressBar.style.height = scrollPercent + "%"; // crecerá hacia abajo
});

document.addEventListener("DOMContentLoaded", () => {
  const lotties = document.querySelectorAll(".lottie");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const lottie = entry.target;
      if (entry.isIntersecting) {
        lottie.play();
      } else {
        lottie.stop(); // o lottie.pause() si prefieres que quede en el frame actual
      }
    });
  }, {
    threshold: 0.5
  });

  lotties.forEach(lottie => observer.observe(lottie));
});





gsap.registerPlugin(SplitText);

const textos = {
  section_uno: "Proyecto terminado",
  section_screen_uno: "Vista web",
  section_dos: "Detalles del proyecto",
  section_tres: "Colores",
  section_cuatro: "Fonts",
  section_cinco: "Branding",
  section_seis: "Mapa del sitio",
  section_siete: "Versión móvil",
  cont_escena_tubo: "tubo",
  section_ocho: "ocho",
  section_nueve: "nueve",
  section_diez: "diez",
};

const textoGuia = document.getElementById("texto-guia");

function animarTexto(nuevoTexto) {
  // Si ya existe un split previo → animamos la salida
  if (textoGuia.splitText) {
    gsap.to(textoGuia.splitText.chars, {
      x: -30,
      opacity: 0,
      stagger: 0.03,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        textoGuia.splitText.revert(); // limpiar anterior
        mostrarNuevoTexto(nuevoTexto); // animar entrada
      }
    });
  } else {
    mostrarNuevoTexto(nuevoTexto);
  }
}

function mostrarNuevoTexto(nuevoTexto) {
  textoGuia.textContent = nuevoTexto;

  // nuevo split
  const split = new SplitText(textoGuia, {
    type: "chars",
    charsClass: "char"
  });
  textoGuia.splitText = split;

  // animación de entrada
  gsap.from(split.chars, {
    x: 30,
    opacity: 0,
    stagger: 0.05,
    duration: 0.4,
    ease: "back.out(1.7)"
  });
}

// Observer
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (textos[id]) {
          animarTexto(textos[id]);
        }
      }
    });
  }, {
    threshold: 0.5
  }
);

document.querySelectorAll("section").forEach((section) => {
  observer.observe(section);
});

// ✅ Texto inicial
animarTexto(textos.section_uno);