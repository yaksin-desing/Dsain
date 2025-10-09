import {
  gsap
} from "https://cdn.skypack.dev/gsap";
import {
  SplitText
} from "https://cdn.skypack.dev/gsap/SplitText";

gsap.registerPlugin(SplitText);

window.addEventListener("load", () => {
  const elementos = document.querySelectorAll(".animar-texto");

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return; // esperar a que entre al viewport

        const el = entry.target;
        animarTexto(el); // animar elemento
        obs.unobserve(el); // ejecutar solo una vez
      });
    }, {
      threshold: 0, // apenas entra al viewport
      rootMargin: "0px 0px -10% 0px", // se activa un poquito antes
    }
  );

  elementos.forEach((el) => observer.observe(el));

  function animarTexto(el) {
    const tipo = (el.getAttribute("data-tipo") || "letras").toLowerCase(); // letras o palabras
    const velocidad = parseFloat(el.getAttribute("data-velocidad")) || 0.3;

    // revertir si ya estaba dividido
    if (el.splitText) el.splitText.revert();

    const splitType = tipo === "palabras" ? "words" : "chars";
    const split = new SplitText(el, {
      type: splitType,
      charsClass: "char"
    });
    el.splitText = split;

    const objetivo = tipo === "palabras" ? split.words : split.chars;

    gsap.from(objetivo, {
      y: 30,
      opacity: 0,
      stagger: 0.05,
      duration: velocidad,
      ease: "back.out(1.7)",
    });
  }
});

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

    // --- Animaciones existentes ---
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

    // --- NUEVO BLOQUE: animación del tubo ---
    const idSeccion = sections[current].id;
    let yValue = "0vh"; // posición base

    if (idSeccion === "section_ocho") yValue = "0vh";
    else if (idSeccion === "section_nueve") yValue = "100vh";
    else if (idSeccion === "section_diez") yValue = "200vh";
    else if (idSeccion === "section_once") yValue = "200vh";

    gsap.to("#cont_escena_tubo", {
      y: yValue,
      duration: 1.3,
      ease: "expo.inOut"
    });

    // --- Fin del nuevo bloque ---

    setTimeout(() => {
      isAnimating = false;
    }, 800);
  }

  // --- Eventos de scroll con rueda ---
  window.addEventListener("wheel", (e) => {
    if (e.deltaY > 0) {
      goTo(current + 1);
    } else if (e.deltaY < 0) {
      goTo(current - 1);
    }
  });

  // --- Eventos táctiles (móvil) ---
  let startY = 0;
  window.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
  });

  window.addEventListener("touchend", (e) => {
    let endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) {
      goTo(current + 1);
    } else if (endY - startY > 50) {
      goTo(current - 1);
    }
  });
});


