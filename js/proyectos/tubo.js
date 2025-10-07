import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import {
  gsap
} from "https://cdn.skypack.dev/gsap";

// Esperar a que cargue todo el DOM
window.addEventListener("load", () => {
  const container = document.getElementById("cont_escena_tubo");
  if (!container) {
    console.error("❌ No se encontró el contenedor #cont_escena_tubo");
    return;
  }

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
  camera.position.set(0, 1.5, 3.4);

  // 🖥️ Renderizador
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // 💡 Luces
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(3, 5, 7);
  scene.add(dirLight);

  // 🎞️ Video Material
  function crearMaterialVideo(ruta) {
    const video = document.createElement("video");
    video.src = ruta;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.addEventListener("loadeddata", () => video.play());

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

  const materiales = [
    crearMaterialVideo("../src/img/assetproyectos/proyectodsains/videodsain.mp4"),
    crearMaterialVideo("../src/img/assetproyectos/proyectodsains/videodsain.mp4"),
    crearMaterialVideo("../src/img/assetproyectos/proyectodsains/videodsain.mp4"),
  ];

  // 🌀 Crear el tubo
  const grupoTubo = new THREE.Group();
  const radio = 1.7;
  const altura = 0.7;
  const segmentos = 64;

  for (let i = 0; i < 3; i++) {
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

  // 🎬 Animación constante (rotación lenta base)
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

  // 🧭 Detectar sección visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;

          if (id === "section_ocho") {
            gsap.to(grupoTubo.rotation, {
              y: 1.57,
              duration: 1,
              ease: "power2.out",
            });
            gsap.to(grupoTubo.position, {
              y: -0.13,
              duration: 1,
              ease: "power2.out",
            });

          } else if (id === "section_nueve") {
            gsap.to(grupoTubo.rotation, {
              y: 3.7,
              duration: 1,
              ease: "power2.out",
            });
            gsap.to(grupoTubo.position, {
              y: 0.87,
              duration: 1,
              ease: "power2.out",
            });


          } else if (id === "section_diez") {
            gsap.to(grupoTubo.rotation, {
              y: 5.75,
              duration: 1,
              ease: "power2.out",
            });
            gsap.to(grupoTubo.position, {
              y: 1.87,
              duration: 1,
              ease: "power2.out",
            });

          }
        }
      });
    }, {
      threshold: 0.5
    }
  );

  // 🔍 Observar secciones
  ["section_ocho", "section_nueve", "section_diez"].forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
});