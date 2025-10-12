import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.12.2";

// 🟢 Contenedor
const container = document.getElementById("section_once");

// 🟢 Detección de dispositivo
const isMobileOrTablet = /Mobi|Android|iPad|iPod/i.test(navigator.userAgent);

// 🟢 Escena
const scene = new THREE.Scene();

// 🟢 Cámara
const camera = new THREE.PerspectiveCamera(
  isMobileOrTablet ? 55 : 45, // apertura un poco mayor en móvil
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 7);

// 🟢 Renderizador
const renderer = new THREE.WebGLRenderer({
  antialias: !isMobileOrTablet, // desactiva AA en móviles
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = !isMobileOrTablet; // sin sombras en móviles
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 🔹 Ajuste de resolución dinámica
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileOrTablet ? 1.2 : 2));

container.appendChild(renderer.domElement);

// 🟢 Controles Orbit (solo desktop)
const controls = !isMobileOrTablet
  ? new OrbitControls(camera, renderer.domElement)
  : { update() {} };

// 🟢 Luces
const light = new THREE.DirectionalLight(0xffffff, isMobileOrTablet ? 0.8 : 1);
light.position.set(0, 10, 10);
light.castShadow = !isMobileOrTablet;
light.shadow.mapSize.set(512, 512);
light.shadow.bias = -0.001;
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, isMobileOrTablet ? 0.6 : 0.5));

// 🟢 Raycaster y mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(10, 10);
let mouseMoved = false;

// 🟢 Datos de clones
let hitboxes = [];

// 🟢 Carga del modelo
const loader = new GLTFLoader();
loader.load(
  "../src/objt/piedepagina/monedadsain.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.4, 0.4, 0.4);

    // Menos densidad de clones en móviles
    const filas = isMobileOrTablet ? 6 : 10;
    const columnas = isMobileOrTablet ? 10 : 17;
    const separacionX = 0.8;
    const separacionY = 0.8;

    const anchoTotal = (columnas - 1) * separacionX;
    const altoTotal = (filas - 1) * separacionY;

    const muro = new THREE.Group();

    // Material base compartido
    const baseMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.6,
    });

    // Reutilizar geometría del hitbox
    const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.2);
    const boxMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let y = 0; y < filas; y++) {
      for (let x = 0; x < columnas; x++) {
        const clone = model.clone(true);
        clone.rotation.x = Math.PI / 2;

        const caraSimbolo = clone.getObjectByName("carasimbolo");
        if (caraSimbolo) {
          caraSimbolo.traverse((child) => {
            if (child.isMesh) {
              const value = Math.random() * 0.8 + 0.5;
              const color = new THREE.Color(0, 0, value);
              child.material = baseMaterial.clone();
              child.material.color = color;
            }
          });
        }

        const hitbox = new THREE.Mesh(boxGeo, boxMat);
        hitbox.position.set(
          x * separacionX - anchoTotal / 2,
          -(y * separacionY - altoTotal / 2),
          0
        );

        clone.position.z = 0.01;
        hitbox.add(clone);
        muro.add(hitbox);

        hitboxes.push({ hitbox, model: clone, flipped: false });
      }
    }

    muro.frustumCulled = false; // evitar desapariciones erróneas
    scene.add(muro);
  },
  undefined,
  (error) => console.error("Error al cargar el modelo:", error)
);

// 🟢 Eventos de mouse (solo desktop)
if (!isMobileOrTablet) {
  container.addEventListener("mousemove", (event) => {
    mouseMoved = true;
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  });

  container.addEventListener("mouseleave", () => {
    mouseMoved = false;
    mouse.set(10, 10);
  });
}

// 🟢 IntersectionObserver (pausa render si no visible)
let isInViewport = true;
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      isInViewport = entry.isIntersecting;
    });
  },
  { threshold: 0.1 }
);
observer.observe(container);

// 🟢 Animación principal
function animate() {
  requestAnimationFrame(animate);

  if (!isInViewport) return; // ahorro energético

  let intersects = [];
  if (mouseMoved && hitboxes.length > 0) {
    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(hitboxes.map((h) => h.hitbox));
  }

  // Reset de rotación
  hitboxes.forEach((h) => {
    if (!intersects.find((i) => i.object === h.hitbox) && h.flipped) {
      gsap.to(h.model.rotation, { z: 0, duration: 2, ease: "power2.out" });
      h.flipped = false;
    }
  });

  // Hover
  intersects.forEach((intersect) => {
    const h = hitboxes.find((h) => h.hitbox === intersect.object);
    if (h && !h.flipped) {
      gsap.to(h.model.rotation, {
        z: Math.PI,
        duration: 0.5,
        ease: "power2.out",
      });
      h.flipped = true;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// 🟢 Resize
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
