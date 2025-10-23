import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { gsap } from "https://cdn.skypack.dev/gsap";
import { SplitText } from "https://cdn.skypack.dev/gsap/SplitText";

window.addEventListener("load", () => {
  const container = document.getElementById("cont_escena_tubo");

  // 📦 Escena
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // 🎥 Cámara
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.52, 3.4);

  // 🖥️ Renderizador
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // 💡 Luces
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(3, 5, 7);
  scene.add(dirLight);

  // 🎞️ Crear material desde video
  function crearMaterialVideo(ruta) {
    const video = document.createElement("video");
    video.src = ruta;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.addEventListener("canplay", () => video.play().catch(() => {})); // ✅ mejora reproducción

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;

    return new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    });
  }

  // 🧠 Leer URLs de videos desde el HTML
  const videoURLs = [
    container.dataset.video1,
    container.dataset.video2,
    container.dataset.video3,
  ];

  const materiales = videoURLs.map((url) => crearMaterialVideo(url));

  // 🌀 Crear tubo dividido en 3 secciones
  const grupoTubo = new THREE.Group();
  const radio = 1.7;
  const altura = 0.7;
  const segmentos = 64;

  for (let i = 0; i < materiales.length; i++) {
    const inicio = i * ((2 * Math.PI) / 3);
    const geometry = new THREE.CylinderGeometry(
      radio,
      radio,
      altura,
      segmentos,
      1,
      true,
      inicio,
      Math.PI / 3
    );
    const mesh = new THREE.Mesh(geometry, materiales[i]);
    mesh.position.y = i * 1;
    grupoTubo.add(mesh);
  }

  scene.add(grupoTubo);

  // 🎬 Animación render
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // 📏 Resize
  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // 🧭 Rotación y posición del tubo (responsiva)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const id = entry.target.id;
      const isMobile = window.innerWidth <= 480;

      // 📐 Valores base (desktop)
      let rotY = 0;
      let posY = 0;
      let posZ = 0;
      let scale = 1;
      let camZ = 3.4;

      // 🌀 Ajustes según sección
      if (id === "section_ocho") {
        rotY = isMobile ? 1.57 : 1.57;
        posY = isMobile ? 0.3 : -0.13;
        posZ = isMobile ? 0.7 : 0;
        scale = isMobile ? 0.8 : 1;
        camZ = isMobile ? 4.2 : 3.4;
      } else if (id === "section_nueve") {
        rotY = isMobile ? 3.65 : 3.65;
        posY = isMobile ? 2 : 0.87;
        posZ = isMobile ? 0.7 : 0;
        scale = isMobile ? 0.8 : 1;
        camZ = isMobile ? 4.2 : 3.4;
      } else if (id === "section_diez") {
        rotY = isMobile ? 5.75 : 5.75;
        posY = isMobile ? 2 : 1.87;
        posZ = isMobile ? 0.7 : 0;
        scale = isMobile ? 0.8 : 1;
        camZ = isMobile ? 4.2 : 3.4;
      }

      // 🌀 Animaciones
      gsap.to(grupoTubo.rotation, { y: rotY, duration: 1, ease: "power2.out" });
      gsap.to(grupoTubo.position, { y: posY, z: posZ, duration: 1, ease: "power2.out" });
      gsap.to(grupoTubo.scale, { x: scale, y: scale, z: scale, duration: 1 });
      gsap.to(camera.position, { z: camZ, duration: 1, ease: "power2.out" });
    });
  }, { threshold: 0.5 });

  ["section_ocho", "section_nueve", "section_diez"].forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });

  // ----------------------------
  // ✨ SplitText para títulos y párrafos
  // ----------------------------
  gsap.registerPlugin(SplitText);

  const tituloParrafo = container.querySelector(".titulo_parrafo_escena");
  const parrafoEscena = container.querySelector(".parrafo_escena");

  function mostrarNuevoTexto(elemento, texto) {
    if (!elemento || !SplitText) return;
    if (elemento.splitText) elemento.splitText.revert();

    elemento.textContent = texto || "";

    const split = new SplitText(elemento, { type: "chars", charsClass: "char" });
    elemento.splitText = split;

    gsap.from(split.chars, {
      y: 30,
      opacity: 0,
      stagger: 0.04,
      duration: 0.2,
      ease: "back.out(1.7)",
    });
  }

  function animarTextoSplit(elemento, nuevoTexto) {
    if (!elemento) return;

    if (elemento.splitText) {
      const objetivo = elemento.splitText.chars;
      gsap.to(objetivo, {
        y: -30,
        opacity: 0,
        stagger: 0.02,
        duration: 0.1,
        ease: "power2.in",
        onComplete: () => {
          elemento.splitText.revert();
          mostrarNuevoTexto(elemento, nuevoTexto);
        },
      });
    } else {
      mostrarNuevoTexto(elemento, nuevoTexto);
    }
  }

  // 👀 Observer para cambiar el texto según la sección
  const textoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const sec = entry.target;
      if (!["section_ocho", "section_nueve", "section_diez"].includes(sec.id)) return;

      const nuevoTitulo = sec.dataset.titulo || (tituloParrafo ? tituloParrafo.textContent : "");
      const nuevoParrafo = sec.dataset.parrafo || (parrafoEscena ? parrafoEscena.textContent : "");

      if (tituloParrafo) animarTextoSplit(tituloParrafo, nuevoTitulo);
      if (parrafoEscena) gsap.delayedCall(0.15, () => animarTextoSplit(parrafoEscena, nuevoParrafo));
    });
  }, { threshold: 0.5 });

  ["section_ocho", "section_nueve", "section_diez"].forEach((id) => {
    const sec = document.getElementById(id);
    if (sec) textoObserver.observe(sec);
  });
});
