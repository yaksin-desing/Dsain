/* ===== Scroll por secciones — página About me =====
   Un gesto de scroll = un paso. Pasos (con 7 secciones):
     0  sección 1 (escena, cámara en su posición inicial)
     1  sección 1 con la cámara desplazada en Z (ESCENA_SCROLL.avance en pasillo.js)
     2  sección 1 con la cámara aún más adentro (ESCENA_SCROLL.avance2). Al terminar el movimiento pasa SOLO a la sección 2
     3…8  secciones 2…7
   Funciona con rueda, trackpad y gestos táctiles. Si añades o quitas <section> dentro de
   .contenedorproyectos, los pasos se recalculan solos.
   API:  scrollSecciones.ir(paso)  ·  evento 'secciones:cambio' → detail { paso, seccion, escena } */
(function () {
  const CFG = {
    contenedor: '.contenedorproyectos',
    escenaEnPrimeraSeccion: true,   // true = el primer scroll en la sección 1 mueve la cámara antes de cambiar de sección
    bloqueoSeccion: 900,            // ms que se ignora el scroll tras cambiar de sección
    bloqueoEscena: 1400,            // ms tras mover la cámara (un poco más que ESCENA_SCROLL.duracion)
    retardoVuelta: 600,             // ms que se ve la cámara en la posición avance2 al volver desde la sección 2, antes de ir a avance
    retardoAuto: 400,               // ms de pausa al llegar la cámara al final antes de pasar solo a la sección 2
    silencioRueda: 140,             // ms sin rueda para aceptar otro gesto (evita saltos dobles con la inercia del trackpad)
    umbralRueda: 10,                // ignora giros de rueda diminutos
    umbralTactil: 50,               // px de deslizamiento para contar como gesto
    ignorarTactilEn: '#escena3d',   // en la escena el dedo sirve para mirar/caminar, no para cambiar de sección
    ocultarNavEn: [],               // ids de sección donde se oculta .barra_nav, ej: ['section_siete']
  };

  function iniciar() {
    const cont = document.querySelector(CFG.contenedor);
    const secs = cont ? [...cont.querySelectorAll(':scope > section')] : [];
    if (!cont || !secs.length) return;

    /* ---- pasos ---- */
    const pasos = [{ seccion: 0, escena: 0 }];
    if (CFG.escenaEnPrimeraSeccion) {
      pasos.push({ seccion: 0, escena: 1 });
      pasos.push({ seccion: 0, escena: 2, auto: true });   // al terminar la cámara pasa solo a la siguiente sección
    }
    for (let i = 1; i < secs.length; i++) pasos.push({ seccion: i });

    let paso = 0, bloqueado = false, ultimaRueda = 0;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    cont.scrollTop = 0;

    function desbloquear(ms) {                    // espera a que termine la animación Y a que cese la inercia de la rueda
      const t0 = performance.now();
      setTimeout(function revisar() {
        const ahora = performance.now();
        if (ahora - ultimaRueda > CFG.silencioRueda || ahora - t0 > ms + 1500) bloqueado = false;
        else setTimeout(revisar, 60);
      }, ms);
    }

    function barraNav(seccionId) {
      const oculta = CFG.ocultarNavEn.includes(seccionId);
      if (window.gsap) {
        gsap.to('.barra_nav', { top: oculta ? '-5vh' : '0vh', opacity: oculta ? 0 : 1, duration: 0.8, ease: 'power2.inOut' });
      }
    }

    function ir(n) {
      let vuelta = false;
      if (n < paso && pasos[n] && pasos[n].auto) { n--; vuelta = true; }   // al volver desde la sección 2: la cámara aparece en avance2 y luego va a avance
      if (bloqueado || n < 0 || n >= pasos.length || n === paso) return;
      const prev = pasos[paso], p = pasos[n];
      autoArmado = !!p.auto && n > paso;          // al volver (subiendo) a este paso NO se salta de nuevo a la sección 2
      clearTimeout(autoTimer);
      paso = n; bloqueado = true;
      let ms = 0;

      if (p.seccion !== prev.seccion) {
        secs[p.seccion].scrollIntoView({ behavior: 'smooth' });
        ms = CFG.bloqueoSeccion;
      }
      if (p.escena !== undefined) {               // pasos que pertenecen a la escena 3D
        if (vuelta) {
          if (window.pasilloCamara) {
            window.pasilloCamara.irAPaso(p.escena + 1, true);                          // coloca la cámara en avance2 (la escena aún está oculta)
            setTimeout(() => { if (pasos[paso] === p) window.pasilloCamara.irAPaso(p.escena); }, CFG.retardoVuelta);   // y la lleva a avance
          } else window.__pasoEscena = p.escena;
          ms = CFG.retardoVuelta + CFG.bloqueoEscena;
        } else if (window.pasilloCamara) window.pasilloCamara.irAPaso(p.escena, p.seccion !== prev.seccion);
        else window.__pasoEscena = p.escena;      // la escena aún no cargó: se aplica al iniciar
        if (p.seccion === prev.seccion) ms = CFG.bloqueoEscena;
      }
      barraNav(secs[p.seccion].id);
      window.dispatchEvent(new CustomEvent('secciones:cambio', { detail: { paso: n, seccion: p.seccion, escena: p.escena } }));
      desbloquear(ms);
    }

    /* ---- paso automático: la cámara terminó el último movimiento de la escena ---- */
    let autoTimer = null, autoArmado = false;     // solo se arma al llegar HACIA ADELANTE (bajando)
    window.addEventListener('escena:camara-lista', (e) => {
      const actual = pasos[paso];
      if (!autoArmado || !actual || !actual.auto || e.detail.paso !== actual.escena) return;
      autoArmado = false;
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        if (pasos[paso] !== actual) return;       // el usuario ya cambió de paso
        bloqueado = false;                        // salta el bloqueo de la animación de la cámara
        ir(paso + 1);
      }, CFG.retardoAuto);
    });

    /* ---- rueda / trackpad ---- */
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;                      // zoom del navegador
      if (e.target.closest && e.target.closest('[data-seccion-scroll]')) return;   // zonas con scroll propio
      e.preventDefault();
      ultimaRueda = performance.now();
      if (Math.abs(e.deltaY) < CFG.umbralRueda) return;
      ir(paso + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    /* ---- táctil ---- */
    let startY = 0, tactilValido = false;
    window.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      tactilValido = !(CFG.ignorarTactilEn && e.target.closest && e.target.closest(CFG.ignorarTactilEn));
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (!tactilValido) return;
      const d = startY - e.changedTouches[0].clientY;
      if (d > CFG.umbralTactil) ir(paso + 1);
      else if (d < -CFG.umbralTactil) ir(paso - 1);
    }, { passive: true });

    /* ---- al redimensionar, mantener la sección actual alineada ---- */
    window.addEventListener('resize', () => {
      cont.scrollTo({ top: secs[pasos[paso].seccion].offsetTop, behavior: 'instant' });
    });

    window.scrollSecciones = { ir, get paso() { return paso; }, get seccion() { return pasos[paso].seccion; }, pasos };
  }

  /* ---- texto animado (.animar-texto) con GSAP SplitText, igual que en tus otras páginas ---- */
  function textosAnimados() {
    const els = document.querySelectorAll('.animar-texto');
    const hayGsap = window.gsap && window.SplitText;
    if (!hayGsap) { els.forEach((el) => { el.style.visibility = 'visible'; }); return; }
    gsap.registerPlugin(SplitText);
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target; o.unobserve(el);
        const palabras = (el.getAttribute('data-tipo') || 'letras').toLowerCase() === 'palabras';
        const dur = parseFloat(el.getAttribute('data-velocidad')) || 0.3;
        if (el.splitText) el.splitText.revert();
        const split = new SplitText(el, { type: palabras ? 'words' : 'chars', charsClass: 'char' });
        el.splitText = split;
        el.style.visibility = 'visible';
        gsap.fromTo(palabras ? split.words : split.chars, { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: dur, ease: 'back.out(1.7)' });
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
    els.forEach((el) => obs.observe(el));
  }

  const arrancar = () => { iniciar(); textosAnimados(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();