/* ===== Scroll por secciones — página About me =====
   Un gesto de scroll = un paso. Pasos (con 7 secciones):
     0  sección 1 (escena, cámara en su posición inicial)
     1  sección 1 con la cámara desplazada en Z
     2  sección 1 con la cámara aún más adentro
     3…8  secciones 2…7

   API:
   scrollSecciones.ir(paso)
   evento 'secciones:cambio' → detail { paso, seccion, escena }
*/

(function () {

  const CFG = {
    contenedor: '.contenedorproyectos',
    escenaEnPrimeraSeccion: true,
    bloqueoSeccion: 900,
    bloqueoEscena: 1400,
    retardoVuelta: 600,
    retardoAuto: 400,
    silencioRueda: 140,
    umbralRueda: 10,
    umbralTactil: 50,
    ignorarTactilEn: '#escena3d',
    ocultarNavEn: [],

    /* logo de la barra: el original (logoblanco.svg) se toma del propio HTML;
       desde la sección `desde` se usa el alternativo, y vuelve al original en la escena */
    logo: {
      selector: '.logo img',
      desde: 2,                                   // 1 = escena, 2 = la siguiente sección…
      alternativo: '../src/img/logoazul.svg',
      fade: 0.25                                  // segundos del desvanecimiento
    }
  };

  function iniciar() {

    const cont = document.querySelector(CFG.contenedor);
    const secs = cont ? [...cont.querySelectorAll(':scope > section')] : [];

    if (!cont || !secs.length) return;

    /* ---- pasos ---- */

    const pasos = [{ seccion: 0, escena: 0 }];

    if (CFG.escenaEnPrimeraSeccion) {
      pasos.push({ seccion: 0, escena: 1 });
      pasos.push({ seccion: 0, escena: 2, auto: true });
    }

    for (let i = 1; i < secs.length; i++) {
      pasos.push({ seccion: i });
    }

    let paso = 0;
    let bloqueado = false;
    let ultimaRueda = 0;

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    cont.scrollTop = 0;

    function desbloquear(ms) {

      const t0 = performance.now();

      setTimeout(function revisar() {

        const ahora = performance.now();

        if (
          ahora - ultimaRueda > CFG.silencioRueda ||
          ahora - t0 > ms + 1500
        ) {
          bloqueado = false;
        } else {
          setTimeout(revisar, 60);
        }

      }, ms);
    }

    function barraNav(seccionId) {

      const oculta = CFG.ocultarNavEn.includes(seccionId);

      if (window.gsap) {
        gsap.to('.barra_nav', {
          top: oculta ? '-5vh' : '0vh',
          opacity: oculta ? 0 : 1,
          duration: 0.8,
          ease: 'power2.inOut'
        });
      }
    }

    /* ---- logo de la barra ---- */

    const logoEl = CFG.logo ? document.querySelector(CFG.logo.selector) : null;
    const logoOriginal = logoEl ? logoEl.getAttribute('src') : '';

    let logoAlternativo = false;
    let logoTimer = null;

    if (logoEl && CFG.logo.alternativo) {
      const pre = new Image();
      pre.src = CFG.logo.alternativo;             // precarga para que el cambio sea inmediato
    }

    function cambiarLogo(indiceSeccion) {

      if (!logoEl) return;

      const quiere = indiceSeccion + 1 >= CFG.logo.desde;

      if (quiere === logoAlternativo) return;

      logoAlternativo = quiere;

      clearTimeout(logoTimer);

      const d = CFG.logo.fade;

      logoEl.style.transition = 'opacity ' + d + 's ease';
      logoEl.style.opacity = '0';

      logoTimer = setTimeout(() => {
        logoEl.setAttribute('src', logoAlternativo ? CFG.logo.alternativo : logoOriginal);
        logoEl.style.opacity = '1';
      }, d * 1000);
    }

    function ir(n) {

      let vuelta = false;

      if (n < paso && pasos[n] && pasos[n].auto) {
        n--;
        vuelta = true;
      }

      if (bloqueado || n < 0 || n >= pasos.length || n === paso) return;

      const prev = pasos[paso];
      const p = pasos[n];

      autoArmado = !!p.auto && n > paso;

      clearTimeout(autoTimer);

      paso = n;
      bloqueado = true;

      let ms = 0;

      if (p.seccion !== prev.seccion) {

        secs[p.seccion].scrollIntoView({
          behavior: 'smooth'
        });

        ms = CFG.bloqueoSeccion;
      }

      if (p.escena !== undefined) {

        if (vuelta) {

          if (window.pasilloCamara) {

            window.pasilloCamara.irAPaso(p.escena + 1, true);

            setTimeout(() => {

              if (pasos[paso] === p) {
                window.pasilloCamara.irAPaso(p.escena);
              }

            }, CFG.retardoVuelta);

          } else {
            window.__pasoEscena = p.escena;
          }

          ms = CFG.retardoVuelta + CFG.bloqueoEscena;

        } else if (window.pasilloCamara) {

          window.pasilloCamara.irAPaso(
            p.escena,
            p.seccion !== prev.seccion
          );

        } else {

          window.__pasoEscena = p.escena;

        }

        if (p.seccion === prev.seccion) {
          ms = CFG.bloqueoEscena;
        }
      }

      barraNav(secs[p.seccion].id);
      cambiarLogo(p.seccion);

      window.dispatchEvent(
        new CustomEvent('secciones:cambio', {
          detail: {
            paso: n,
            seccion: p.seccion,
            escena: p.escena
          }
        })
      );

      desbloquear(ms);
    }

    /* ---- paso automático de la cámara ---- */

    let autoTimer = null;
    let autoArmado = false;

    window.addEventListener('escena:camara-lista', (e) => {

      const actual = pasos[paso];

      if (
        !autoArmado ||
        !actual ||
        !actual.auto ||
        e.detail.paso !== actual.escena
      ) return;

      autoArmado = false;

      clearTimeout(autoTimer);

      autoTimer = setTimeout(() => {

        if (pasos[paso] !== actual) return;

        bloqueado = false;
        ir(paso + 1);

      }, CFG.retardoAuto);

    });

    /* ---- rueda / trackpad ---- */

    window.addEventListener('wheel', (e) => {

      if (e.ctrlKey) return;

      if (
        e.target.closest &&
        e.target.closest('[data-seccion-scroll]')
      ) return;

      e.preventDefault();

      ultimaRueda = performance.now();

      if (Math.abs(e.deltaY) < CFG.umbralRueda) return;

      ir(paso + (e.deltaY > 0 ? 1 : -1));

    }, { passive: false });

    /* ---- táctil ---- */

    let startY = 0;
    let tactilValido = false;

    window.addEventListener('touchstart', (e) => {

      startY = e.touches[0].clientY;

      tactilValido = !(
        CFG.ignorarTactilEn &&
        e.target.closest &&
        e.target.closest(CFG.ignorarTactilEn)
      );

    }, { passive: true });

    window.addEventListener('touchend', (e) => {

      if (!tactilValido) return;

      const d = startY - e.changedTouches[0].clientY;

      if (d > CFG.umbralTactil) {
        ir(paso + 1);
      } else if (d < -CFG.umbralTactil) {
        ir(paso - 1);
      }

    }, { passive: true });

    /* ---- redimensionar ---- */

    window.addEventListener('resize', () => {

      cont.scrollTo({
        top: secs[pasos[paso].seccion].offsetTop,
        behavior: 'instant'
      });

    });

    window.scrollSecciones = {
      ir,
      get paso() { return paso; },
      get seccion() { return pasos[paso].seccion; },
      pasos
    };

  }

  /* ---- textos animados ---- */

  function textosAnimados() {

    const els = document.querySelectorAll('.animar-texto');
    const hayGsap = window.gsap && window.SplitText;

    if (!hayGsap) {
      els.forEach((el) => {
        el.style.visibility = 'visible';
      });
      return;
    }

    gsap.registerPlugin(SplitText);

    const obs = new IntersectionObserver((entries, o) => {

      entries.forEach((en) => {

        if (!en.isIntersecting) return;

        const el = en.target;

        o.unobserve(el);

        const palabras =
          (el.getAttribute('data-tipo') || 'letras').toLowerCase() === 'palabras';

        const dur =
          parseFloat(el.getAttribute('data-velocidad')) || 0.3;

        if (el.splitText) el.splitText.revert();

        const split = new SplitText(el, {
          type: palabras ? 'words' : 'chars',
          charsClass: 'char'
        });

        el.splitText = split;
        el.style.visibility = 'visible';

        gsap.fromTo(
          palabras ? split.words : split.chars,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.05,
            duration: dur,
            ease: 'back.out(1.7)'
          }
        );

      });

    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    });

    els.forEach((el) => obs.observe(el));

  }

  const arrancar = () => {
    iniciar();
    textosAnimados();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }

})();


/* =========================================================
   RETÍCULA SVG — SISTEMA GEOMÉTRICO DINÁMICO
   ========================================================= */

const CONFIG_RETICULA = {

  color: '#0048ff',
  grosor: 1,
  puntoRadio: 2.5,

  margenLongitud: 1.05,

  // Posiciones iniciales.
  // Ángulo 0 = vertical.
  // Ángulo 90 = horizontal.

  lineas: {

    v1: {
      angulo: 0,
      desplazamiento: -0.99,
      referencia: 'ancho'
    },

    v2: {
      angulo: 0,
      desplazamiento: 0.99,
      referencia: 'ancho'
    },

    h1: {
      angulo: 90,
      desplazamiento: 0.99,
      referencia: 'alto'
    },

    h2: {
      angulo: 90,
      desplazamiento: -0.99,
      referencia: 'alto'
    }

  }

};


/* =========================================================
   CONSTRUCTOR DE LA RETÍCULA
   ========================================================= */

const reticula = (() => {

  const seccion = document.querySelector('#section_dos');

  if (!seccion) return null;

  const svg = seccion.querySelector('.reticula-svg');

  if (!svg) {
    console.warn('No se encontró el SVG de la retícula.');
    return null;
  }

  const lineas = {

    verticales: [
      svg.querySelector('#linea-v1'),
      svg.querySelector('#linea-v2')
    ],

    horizontales: [
      svg.querySelector('#linea-h1'),
      svg.querySelector('#linea-h2')
    ]

  };

  const todasLasLineas = [
    ...lineas.verticales,
    ...lineas.horizontales
  ];

  const puntos = [
    svg.querySelector('#punto-1'),
    svg.querySelector('#punto-2'),
    svg.querySelector('#punto-3'),
    svg.querySelector('#punto-4')
  ];

  if (
    [...todasLasLineas, ...puntos].some(el => !el)
  ) {
    console.warn('Faltan elementos SVG de la retícula.');
    return null;
  }


  /* -----------------------------------------
     ESTADO GEOMÉTRICO
  ----------------------------------------- */

  const estado = {

    ancho: 0,
    alto: 0,
    longitud: 0,

    lineas: {

      v1: { ...CONFIG_RETICULA.lineas.v1 },
      v2: { ...CONFIG_RETICULA.lineas.v2 },
      h1: { ...CONFIG_RETICULA.lineas.h1 },
      h2: { ...CONFIG_RETICULA.lineas.h2 }

    }

  };


  /* -----------------------------------------
     CALCULAR TAMAÑO
  ----------------------------------------- */

  function actualizarDimensiones() {

    const rect = seccion.getBoundingClientRect();

    estado.ancho = rect.width;
    estado.alto = rect.height;

    if (!estado.ancho || !estado.alto) return false;

    const diagonal = Math.hypot(
      estado.ancho,
      estado.alto
    );

    estado.longitud =
      diagonal * CONFIG_RETICULA.margenLongitud;

    svg.setAttribute(
      'viewBox',
      `0 0 ${estado.ancho} ${estado.alto}`
    );

    return true;

  }


  /* -----------------------------------------
     GEOMETRÍA DE CADA LÍNEA

     Cada línea conserva su dimensión original
     como referencia durante toda la rotación.

     v1 / v2 = ancho
     h1 / h2 = alto
  ----------------------------------------- */

  function obtenerGeometria(linea) {

    const rad = linea.angulo * Math.PI / 180;

    const cx = estado.ancho / 2;
    const cy = estado.alto / 2;

    const dx = Math.sin(rad);
    const dy = Math.cos(rad);

    const nx = Math.cos(rad);
    const ny = -Math.sin(rad);

    const dimension = linea.referencia === 'alto'
      ? estado.alto
      : estado.ancho;

    const distancia =
      linea.desplazamiento * dimension;

    const px = cx + nx * distancia;
    const py = cy + ny * distancia;

    const mitad = estado.longitud / 2;

    return {

      x1: px - dx * mitad,
      y1: py - dy * mitad,

      x2: px + dx * mitad,
      y2: py + dy * mitad

    };

  }


  /* -----------------------------------------
     DIBUJAR LAS CUATRO LÍNEAS
  ----------------------------------------- */

  function dibujarLineas() {

    const referencias = [
      ['v1', lineas.verticales[0]],
      ['v2', lineas.verticales[1]],
      ['h1', lineas.horizontales[0]],
      ['h2', lineas.horizontales[1]]
    ];

    referencias.forEach(([id, elemento]) => {

      const geometria = obtenerGeometria(
        estado.lineas[id]
      );

      elemento.setAttribute('x1', geometria.x1);
      elemento.setAttribute('y1', geometria.y1);

      elemento.setAttribute('x2', geometria.x2);
      elemento.setAttribute('y2', geometria.y2);

    });

  }


  /* -----------------------------------------
     CALCULAR INTERSECCIONES REALES

     Orden:
     v1-h1, v1-h2, v2-h1, v2-h2.
  ----------------------------------------- */

  function calcularIntersecciones() {

    const referencias = [
      ['v1', 'h1'],
      ['v1', 'h2'],
      ['v2', 'h1'],
      ['v2', 'h2']
    ];

    referencias.forEach(([idA, idB], i) => {

      const a = estado.lineas[idA];
      const b = estado.lineas[idB];

      const ga = obtenerGeometria(a);
      const gb = obtenerGeometria(b);

      const radA = a.angulo * Math.PI / 180;
      const radB = b.angulo * Math.PI / 180;

      const dxA = Math.sin(radA);
      const dyA = Math.cos(radA);

      const dxB = Math.sin(radB);
      const dyB = Math.cos(radB);

      const determinante =
        dxA * dyB - dyA * dxB;

      const punto = puntos[i];

      if (Math.abs(determinante) < 0.000001) {
        punto.style.opacity = 0;
        return;
      }

      const diferenciaX = gb.x1 - ga.x1;
      const diferenciaY = gb.y1 - ga.y1;

      const t = (
        diferenciaX * dyB -
        diferenciaY * dxB
      ) / determinante;

      const x = ga.x1 + t * dxA;
      const y = ga.y1 + t * dyA;

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        punto.style.opacity = 0;
        return;
      }

      punto.setAttribute('cx', x);
      punto.setAttribute('cy', y);
      punto.setAttribute('r', CONFIG_RETICULA.puntoRadio);

      punto.style.opacity = 1;

    });

  }


  /* -----------------------------------------
     RENDERIZAR TODA LA RETÍCULA
  ----------------------------------------- */

  function render() {

    dibujarLineas();
    calcularIntersecciones();

  }


  /* -----------------------------------------
     INICIALIZACIÓN
  ----------------------------------------- */

  function dibujar() {

    if (!actualizarDimensiones()) return;

    render();

  }

  svg.querySelectorAll('.linea-guia').forEach(linea => {

    linea.style.stroke = CONFIG_RETICULA.color;
    linea.style.strokeWidth = CONFIG_RETICULA.grosor;

  });

  svg.querySelectorAll('.punto-guia').forEach(punto => {

    punto.style.fill = CONFIG_RETICULA.color;
    punto.style.opacity = 1;

  });

  dibujar();


  /* -----------------------------------------
     REDIMENSIONAMIENTO
  ----------------------------------------- */

  const observer = new ResizeObserver(() => {

    if (!window.__reticulaAnimando) {
      dibujar();
    }

  });

  observer.observe(seccion);

  window.addEventListener('resize', dibujar);


  return {

    svg,
    seccion,
    estado,
    lineas,
    puntos,
    observer,

    dibujar,
    render,
    actualizarDimensiones

  };

})();


/* =========================================================
   TIMELINE — RETÍCULA SVG GSAP
   Suavizado + Delay + Secuencias múltiples
   ========================================================= */

window.__reticulaAnimando = false;

if (reticula && window.gsap) {

  const estado = reticula.estado;


  /* =====================================================
     CONFIGURACIÓN GENERAL
  ===================================================== */

  const CONFIG_ANIMACION = {

    delayInicio: 0,
    delayEntreAnimaciones: 0.1,
    duracion: 0.7,
    ease: 'power2.inOut'

  };


  /* =====================================================
     CREAR TIMELINE
  ===================================================== */

  const tlReticula = gsap.timeline({

    paused: true,

    onStart: () => {

      window.__reticulaAnimando = true;

      reticula.observer.disconnect();

    },

    onComplete: () => {

      window.__reticulaAnimando = false;

      reticula.actualizarDimensiones();
      reticula.render();

      reticula.observer.observe(reticula.seccion);

    }

  });


  tlReticula.eventCallback('onUpdate', () => {
    reticula.render();
  });


  /* =====================================================
     FUNCIÓN PARA AGREGAR UNA ANIMACIÓN
  ===================================================== */

  function agregarAnimacion({

    nombre,

    objetivos,

    duracion = CONFIG_ANIMACION.duracion,

    delay = CONFIG_ANIMACION.delayEntreAnimaciones,

    ease = CONFIG_ANIMACION.ease

  }) {

    const tiempoActual = tlReticula.duration();

    if (delay > 0) {

      tlReticula.to({}, {
        duration: delay
      }, tiempoActual);

    }

    const inicio = tiempoActual + delay;

    tlReticula.addLabel(nombre, inicio);

    Object.entries(objetivos).forEach(([id, propiedades]) => {

      tlReticula.to(
        estado.lineas[id],
        {

          angulo: propiedades.angulo,

          desplazamiento: propiedades.desplazamiento,

          duration: duracion,

          ease

        },
        inicio
      );

    });

    return tlReticula;

  }


  /* =====================================================
     DELAY INICIAL
  ===================================================== */

  tlReticula.to({}, {
    duration: CONFIG_ANIMACION.delayInicio
  }, 0);


  /* =====================================================
     ANIMACIONES
  ===================================================== */

  agregarAnimacion({

    nombre: 'an-01',

    duracion: 1.7,

    delay: 0,

    ease: 'power2.inOut',

    objetivos: {

      v1: {
        angulo: 0,
        desplazamiento: -0.05
      },

      v2: {
        angulo: 0,
        desplazamiento: 0.05
      },

      h1: {
        angulo: 90,
        desplazamiento: 0.05
      },

      h2: {
        angulo: 90,
        desplazamiento: -0.05
      }

    }

  });


  agregarAnimacion({

    nombre: 'an-02',

    duracion: 2.5,

    delay: 0.2,

    ease: 'power2.inOut',

    objetivos: {

      v1: {
        angulo: 90,
        desplazamiento: -0.167
      },

      v2: {
        angulo: 90,
        desplazamiento: 0.167
      },

      h1: {
        angulo: 180,
        desplazamiento: -0.334
      },

      h2: {
        angulo: 180,
        desplazamiento: 0.334
      }

    }

  });

    agregarAnimacion({

    nombre: 'an-03',

    duracion: 2,

    delay: 0,

    ease: 'power2.inOut',

    objetivos: {

      v1: {
        angulo: 180,
        desplazamiento: -0.3
      },

      v2: {
        angulo: 180,
        desplazamiento: 0.3
      },

      h1: {
        angulo: 270,
        desplazamiento: -0.27
      },

      h2: {
        angulo: 270,
        desplazamiento: 0.27
      }

    }

  });


  /* =====================================================
     CONTROLES
  ===================================================== */

  window.tlReticula = tlReticula;
  window.reticula = reticula;


  /* =====================================================
     ACTIVAR AL ENTRAR EN SECCIÓN 2
  ===================================================== */

  let reticulaAnimada = false;

  window.addEventListener('secciones:cambio', (e) => {

    const { seccion } = e.detail || {};

    if (seccion !== 1) return;

    if (reticulaAnimada) return;

    reticulaAnimada = true;

    tlReticula.restart();

  });


  console.log(
    'Timeline preparado.',
    'Duración:',
    tlReticula.duration(),
    'segundos'
  );

}