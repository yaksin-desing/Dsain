import {
  gsap
} from "https://cdn.skypack.dev/gsap";
import {
  SplitText
} from "https://cdn.skypack.dev/gsap/SplitText";

gsap.registerPlugin(SplitText);

window.addEventListener("DOMContentLoaded", () => {
  const elementos = document.querySelectorAll(".animar-texto");

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        animarTexto(el);
        obs.unobserve(el);
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  elementos.forEach((el) => observer.observe(el));

  function animarTexto(el) {
    const tipo = (el.getAttribute("data-tipo") || "letras").toLowerCase();
    const velocidad = parseFloat(el.getAttribute("data-velocidad")) || 0.3;

    // Si ya estaba dividido, revertirlo
    if (el.splitText) el.splitText.revert();

    // Crear el SplitText
    const splitType = tipo === "palabras" ? "words" : "chars";
    const split = new SplitText(el, {
      type: splitType,
      charsClass: "char"
    });
    el.splitText = split;

    const objetivo = tipo === "palabras" ? split.words : split.chars;

    // 🔥 Hacer visible el elemento principal antes de animar
    el.style.visibility = "visible";

    // Animar desde oculto hasta visible
    gsap.fromTo(
      objetivo, {
        y: 30,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        duration: velocidad,
        ease: "back.out(1.7)",
      }
    );
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

    

    // Definir los media queries
    const mqSmall = window.matchMedia("(max-width: 480px)");
    const mqMedium = window.matchMedia("(min-width: 481px) and (max-width: 768px)");
    const mqLarge = window.matchMedia("(min-width: 769px) and (max-width: 1024px)");
    // Si no entra en ninguno, asumimos que es > 1024px

function aplicarAnimacion() {
      const idActual = sections[current].id;

      if (mqSmall.matches) {
        // --- MÓVIL PEQUEÑO (hasta 480px) ---
        console.log("[aplicarAnimacion] Breakpoint: MÓVIL PEQUEÑO (mqSmall)", "| Sección:", idActual);

        if (idActual === "section_screen_uno") {
          console.log("[aplicarAnimacion] Rama: section_screen_uno");
          gsap.to(".imagen_proyecto", {
            width: "130vh",
            duration: 1,
            ease: "power2.out"
          });
          gsap.to(".imagen_proyecto", {
            y: "88vh",
            duration: 1,
            ease: "power2.out"
          });
        } else {
          console.log("[aplicarAnimacion] Rama: else (otra sección)");
          gsap.to(".imagen_proyecto", {
            width: "70%",
            duration: 1,
            ease: "power2.out"
          });
          gsap.to(".imagen_proyecto", {
            y: "0vw",
            duration: 1,
            ease: "power2.out"
          });
        }

      } else if (mqMedium.matches) {
        // --- TABLET PEQUEÑA (481px a 768px) ---
        console.log("[aplicarAnimacion] Breakpoint: TABLET PEQUEÑA (mqMedium)", "| Sección:", idActual);

        if (idActual === "section_screen_uno") {
          console.log("[aplicarAnimacion] Rama: section_screen_uno");
          gsap.to(".imagen_proyecto", {
            width: "100vw",
            duration: 1,
            ease: "power2.out"
          });
          gsap.to(".imagen_proyecto", {
            y: "90vh",
            duration: 1,
            ease: "power2.out"
          });
        } else {
          console.log("[aplicarAnimacion] Rama: else (otra sección)");
          gsap.to(".imagen_proyecto", {
            width: "47%",
            duration: 1,
            ease: "power2.out"
          });
          gsap.to(".imagen_proyecto", {
            y: "0vw",
            duration: 1,
            ease: "power2.out"
          });
        }

      } else if (mqLarge.matches) {
        // --- TABLET GRANDE / LAPTOP (769px a 1024px) ---
        console.log("[aplicarAnimacion] Breakpoint: TABLET GRANDE / LAPTOP (mqLarge)", "| Sección:", idActual);

        if (idActual === "section_screen_uno") {
          console.log("[aplicarAnimacion] Rama: section_screen_uno");
          gsap.to(".imagen_proyecto", {
            width: "90vw",
            duration: 1,
            ease: "power2.out"
          });
          gsap.to(".imagen_proyecto", {
            y: "77vw",
            duration: 1,
            ease: "power2.out"
          });
        } else {
          console.log("[aplicarAnimacion] Rama: else (otra sección)");
          gsap.to(".imagen_proyecto", {
            width: "27%",
            duration: 1,
            ease: "power2.out"
          });
          gsap.to(".imagen_proyecto", {
            y: "0vw",
            duration: 1,
            ease: "power2.out"
          });
        }

      } else {
        // --- PANTALLAS GRANDES (> 1024px) ---
        console.log("[aplicarAnimacion] Breakpoint: PANTALLA GRANDE (default)", "| Sección:", idActual);

        if (idActual === "section_screen_uno") {
          console.log("[aplicarAnimacion] Rama: section_screen_uno");
          gsap.to(".imagen_proyecto", {
            width: "77vw",
            duration: 1,
            ease: "power2.out"
          });
          gsap.to(".imagen_proyecto", {
            y: "90%",
            duration: 1,
            ease: "power2.out"
          });
        } else {
          console.log("[aplicarAnimacion] Rama: else (otra sección)");
          gsap.to(".imagen_proyecto", {
            width: "13vw",
            duration: 1,
            ease: "power2.out"
          });
          gsap.to(".imagen_proyecto", {
            y: "0%",
            duration: 1,
            ease: "power2.out"
          });
        }
      }
    }

    // Ejecutar al cargar y cuando cambie el tamaño de pantalla
    aplicarAnimacion();
    mqSmall.addEventListener("change", aplicarAnimacion);
    mqMedium.addEventListener("change", aplicarAnimacion);
    mqLarge.addEventListener("change", aplicarAnimacion);

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
    let yValue = "0dvh"; // posición base

    if (idSeccion === "section_ocho") yValue = "0dvh";
    else if (idSeccion === "section_nueve") yValue = "100dvh";
    else if (idSeccion === "section_diez") yValue = "200dvh";
    else if (idSeccion === "section_once") yValue = "200dvh";

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