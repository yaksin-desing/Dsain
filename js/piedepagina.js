import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.12.2";

// Contenedor
const container = document.getElementById("section_once");

// --- Escena, cámara y renderer ---
const scene = new THREE.Scene();

// Cámara
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 7);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 0); // Fondo transparente
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

container.appendChild(renderer.domElement);

// --- Controles ---
const controls = new OrbitControls(camera, renderer.domElement);

// --- Luz ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
light.castShadow = true;
light.shadow.mapSize.set(1024, 1024);
light.shadow.bias = -0.001;
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// --- Raycaster y mouse ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(10, 10); // fuera del rango para evitar intersecciones iniciales
let mouseMoved = false; // flag para activar detección solo después del primer movimiento

// Guardar referencias de clones para animaciones
let hitboxes = [];

// --- Loader ---
const loader = new GLTFLoader();
loader.load(
  "../src/objt/piedepagina/monedadsain.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.4, 0.4, 0.4);

    // Parámetros del muro
    const filas = 10;
    const columnas = 17;
    const separacionX = 0.8;
    const separacionY = 0.8;

    const anchoTotal = (columnas - 1) * separacionX;
    const altoTotal = (filas - 1) * separacionY;

    const muro = new THREE.Group();

    // Material base compartido (mejor rendimiento)
    const baseMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.6,
    });

    for (let y = 0; y < filas; y++) {
      for (let x = 0; x < columnas; x++) {
        const clone = model.clone(true);
        clone.rotation.x = Math.PI / 2;

        // Buscar "carasimbolo"
        const caraSimbolo = clone.getObjectByName("carasimbolo");
        if (caraSimbolo) {
          caraSimbolo.traverse((child) => {
            if (child.isMesh) {
              const value = Math.random() * 0.8 + 0.5; // gris azulado aleatorio
              const color = new THREE.Color(0, 0, value);
              child.material = baseMaterial.clone();
              child.material.color = color;
            }
          });
        }

        // Hitbox invisible
        const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.2);
        const boxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(boxGeo, boxMat);

        hitbox.position.set(
          x * separacionX - anchoTotal / 2,
          -(y * separacionY - altoTotal / 2),
          0
        );

        // evitar z-fighting leve
        clone.position.z = 0.01;

        hitbox.add(clone);
        muro.add(hitbox);

        hitboxes.push({ hitbox, model: clone, flipped: false });
      }
    }

    scene.add(muro);
  },
  undefined,
  (error) => {
    console.error("Error al cargar el modelo:", error);
  }
);

// --- Eventos de mouse ---
container.addEventListener("mousemove", (event) => {
  mouseMoved = true; // ahora sí permitir intersección
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
});

container.addEventListener("mouseleave", () => {
  // cuando sale el mouse del contenedor, lo ponemos fuera del rango
  mouseMoved = false;
  mouse.set(10, 10);
});

// --- Animación ---
function animate() {
  requestAnimationFrame(animate);

  let intersects = [];
  if (mouseMoved) {
    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(hitboxes.map(h => h.hitbox));
  }

  // Resetear todos
  hitboxes.forEach((h) => {
    if (!intersects.find((i) => i.object === h.hitbox)) {
      if (h.flipped) {
        gsap.to(h.model.rotation, { z: 0, duration: 2, ease: "power2.out" });
        h.flipped = false;
      }
    }
  });

  // Aplicar hover
  intersects.forEach((intersect) => {
    const h = hitboxes.find((h) => h.hitbox === intersect.object);
    if (h && !h.flipped) {
      gsap.to(h.model.rotation, { z: Math.PI, duration: 0.5, ease: "power2.out" });
      h.flipped = true;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- Resize ---
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
