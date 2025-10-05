document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".contenedorproyectos > section");
  let current = 0;
  let isAnimating = false;

  function goTo(index) {
    if (isAnimating) return;
    if (index < 0 || index >= sections.length) return;

    isAnimating = true;
    current = index;

    sections[current].scrollIntoView({
      behavior: "smooth"
    });

    // --- Animación de la imagen ---
    if (sections[current].id === "section_screen_uno") {
      gsap.to(".imagen_proyecto", {
        width: "85vw",
        duration: 1,
        ease: "power2.out"
      });
      gsap.to(".imagen_proyecto", {
        y: "38vw",
        duration: 1,
        ease: "power2.out"
      });
    } else {
      gsap.to(".imagen_proyecto", {
        width: "15vw",
        duration: 1,
        ease: "power2.out"
      });
      gsap.to(".imagen_proyecto", {
        y: "0vw",
        duration: 1,
        ease: "power2.out"
      });
    }

    // --- Animación barra_nav y text_guia ---
    if (sections[current].id === "section_once") {
      gsap.to(".barra_nav", {
        top: "-5vh",
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut"
      });
      gsap.to(".text_guia", {
        left: "-3vw",
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut"
      });
      gsap.to("#progress-container", {
        x: "3vw",
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut"
      });
    } else {
      gsap.to(".barra_nav", {
        top: "0vh",
        opacity: 1,
        duration: 0.8,
        ease: "power2.inOut"
      });
      gsap.to(".text_guia", {
        left: "2vw",
        opacity: 1,
        duration: 0.8,
        ease: "power2.inOut"
      });
      gsap.to("#progress-container", {
        x: "0vw",
        opacity: 1,
        duration: 0.8,
        ease: "power2.inOut"
      });
    }

    // --- Animación del tubo dentro de las secciones 8, 9 y 10 ---
    // --- Animación del tubo dentro de las secciones 8, 9 y 10 ---
    const tubo = document.getElementById("cont_escena_tubo");
    const idSeccion = sections[current].id;

    if (idSeccion === "section_ocho") {
      gsap.to(tubo, {
        y: "100vh",
        duration: 0.8,
        ease: "power2.inOut"
      });

    } else if (idSeccion === "section_nueve") {
      gsap.to(tubo, {
        y: "200vh",
        duration: 0.8,
        ease: "power2.inOut"
      });

    } else if (idSeccion === "section_diez") {
      gsap.to(tubo, {
        y: "300vh",
        duration: 0.8,
        ease: "power2.inOut"
      });

    } else {
      // En cualquier otra sección, lo regresamos al inicio
      gsap.to(tubo, {
        y: "100vh",
        duration: 0.8,
        ease: "power2.inOut"
      });
    }

    setTimeout(() => {
      isAnimating = false;
    }, 800); // coincide con la duración de la animación
  }

  // --- Scroll con mouse (desktop) ---
  window.addEventListener("wheel", (e) => {
    if (e.deltaY > 0) {
      goTo(current + 1);
    } else if (e.deltaY < 0) {
      goTo(current - 1);
    }
  });

  // --- Scroll con touch (mobile) ---
  let startY = 0;
  window.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
  });
  window.addEventListener("touchend", (e) => {
    let endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) {
      goTo(current + 1); // swipe up
    } else if (endY - startY > 50) {
      goTo(current - 1); // swipe down
    }
  });
});