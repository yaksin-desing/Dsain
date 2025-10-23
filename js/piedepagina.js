import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.12.2";
import Stats from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/libs/stats.module.js";

// 🟢 Contenedor
const container = document.getElementById("section_once");

// 🟢 Detección de dispositivo
const isMobileOrTablet = /Mobi|Android|iPad|iPod/i.test(navigator.userAgent);

// 🟢 Escena y cámara
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  isMobileOrTablet ? 55 : 45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 7);

function updateCameraPosition() {
  const width = window.innerWidth;
  if (width <= 480) camera.position.set(0, 0.25, 4);
  else if (width <= 768) camera.position.set(0, 0.1, 4);
  else camera.position.set(0, 0, 7);
  camera.updateProjectionMatrix();
}
updateCameraPosition();

// 🟢 Renderizador
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: true,
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = !isMobileOrTablet;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileOrTablet ? 2 : 2));
container.appendChild(renderer.domElement);

// 🟢 Controles
const controls = !isMobileOrTablet ? new OrbitControls(camera, renderer.domElement) : { update() {} };

// 🟢 Luces
const light = new THREE.DirectionalLight(0xffffff, isMobileOrTablet ? 0.8 : 1);
light.position.set(0, 10, 10);
light.castShadow = !isMobileOrTablet;
scene.add(light, new THREE.AmbientLight(0xffffff, isMobileOrTablet ? 0.6 : 0.5));

// 🟢 Raycaster y mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(10, 10);
let mouseMoved = false;

// 🟢 Datos de clones
let hitboxes = [];
let muro;

// 🟢 Carga del modelo
const loader = new GLTFLoader();
loader.load(
  "../src/objt/piedepagina/monedadsain.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.4, 0.4, 0.4);

    const filas = isMobileOrTablet ? 6 : 10;
    const columnas = isMobileOrTablet ? 10 : 17;
    const separacionX = 0.8, separacionY = 0.8;

    const anchoTotal = (columnas - 1) * separacionX;
    const altoTotal = (filas - 1) * separacionY;
    muro = new THREE.Group();

    const baseMaterial = new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.6 });
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
        hitbox.position.set(x * separacionX - anchoTotal / 2, -(y * separacionY - altoTotal / 2), 0);
        clone.position.z = 0.01;
        hitbox.add(clone);
        muro.add(hitbox);
        hitboxes.push({ hitbox, model: clone, flipped: false });
      }
    }

    muro.frustumCulled = false;
    scene.add(muro);
  },
  undefined,
  (err) => console.error("Error al cargar modelo:", err)
);

// 🟢 Control de eventos de mouse
function enableMouse() {
  if (isMobileOrTablet) return;
  container.addEventListener("mousemove", onMouseMove);
  container.addEventListener("mouseleave", onMouseLeave);
}
function disableMouse() {
  if (isMobileOrTablet) return;
  container.removeEventListener("mousemove", onMouseMove);
  container.removeEventListener("mouseleave", onMouseLeave);
}

function onMouseMove(event) {
  mouseMoved = true;
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}
function onMouseLeave() {
  mouseMoved = false;
  mouse.set(10, 10);
}
enableMouse();

// 🟢 IntersectionObserver (pausa inteligente)
let isInViewport = true;
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const visible = entry.isIntersecting;

      if (visible && !isInViewport) {
        // 🔄 Reanudar
        isInViewport = true;
        enableMouse();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileOrTablet ? 1.2 : 2));
        renderer.shadowMap.enabled = !isMobileOrTablet;
        gsap.globalTimeline.resume();
      } else if (!visible && isInViewport) {
        // ⏸️ Pausar
        isInViewport = false;
        disableMouse();
        renderer.setPixelRatio(0.5);
        renderer.shadowMap.enabled = false;
        gsap.globalTimeline.pause();
      }
    });
  },
  { threshold: 0.1 }
);
observer.observe(container);

// 🟢 Stats.js (monitor de FPS)
const stats = new Stats();
stats.showPanel(0); // 0 = FPS
stats.dom.style.position = "fixed";
stats.dom.style.left = "200px";
stats.dom.style.top = "10px";
stats.dom.style.zIndex = "9999";
document.body.appendChild(stats.dom);

// 🟢 Loop de render
function animate() {
  requestAnimationFrame(animate);
  stats.begin();

  if (!isInViewport) return;

  let intersects = [];
  if (mouseMoved && hitboxes.length > 0) {
    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(hitboxes.map((h) => h.hitbox));
  }

  hitboxes.forEach((h) => {
    if (!intersects.find((i) => i.object === h.hitbox) && h.flipped) {
      gsap.to(h.model.rotation, { z: 0, duration: 2, ease: "power2.out" });
      h.flipped = false;
    }
  });

  intersects.forEach((intersect) => {
    const h = hitboxes.find((h) => h.hitbox === intersect.object);
    if (h && !h.flipped) {
      gsap.to(h.model.rotation, { z: Math.PI, duration: 0.5, ease: "power2.out" });
      h.flipped = true;
    }
  });

  controls.update();
  renderer.render(scene, camera);

  stats.end();
}
animate();

// 🟢 Resize
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  renderer.setSize(container.clientWidth, container.clientHeight);
  updateCameraPosition();
});
