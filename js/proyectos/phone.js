import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "https://cdn.skypack.dev/gsap";

// Contenedor
const container = document.getElementById("section_siete");

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// Cámara fija
const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 2);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 5, 7);
dirLight.castShadow = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
scene.add(dirLight);

// 🔹 Guardamos los modelos y sus offsets
const modelos = [];

// Map para controlar los tweens que generan la rotación por mouse
const mouseTweens = new Map();

// Estado del efecto mouse / click
let efectoMouseActivo = false;
let mouseEffectPaused = false;
let clickInProgress = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Función para actualizar (crear) los tweens de rotación que siguen al mouse
function updateMouseTweens(mx, my) {
  modelos.forEach(({ model, baseRotX, baseRotY }) => {
    const prev = mouseTweens.get(model);
    if (prev) prev.kill();

    const t = gsap.to(model.rotation, {
      x: baseRotX + my * 0.1,
      y: baseRotY + mx * 0.3,
      duration: 0.5,
      ease: "power2.out",
    });

    mouseTweens.set(model, t);
  });
}

// Función para cargar modelos
function cargarModelo(rutaModelo, texturaRuta, posicionX, offset, rotY = Math.PI, rotX = 0) {
  const texture = textureLoader.load(texturaRuta);

  loader.load(
    rutaModelo,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((node) => {
        if (node.isMesh) {
          node.receiveShadow = true;
        }

        if (node.isMesh && node.name === "pantalla") {
          const bbox = new THREE.Box3().setFromObject(node);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          const planeGeometry = new THREE.PlaneGeometry(size.x, size.y);
          const planeMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.FrontSide,
          });

          const screenPlane = new THREE.Mesh(planeGeometry, planeMaterial);
          node.add(screenPlane);

          screenPlane.position.set(0, 0.01099, 0);
          screenPlane.rotation.x = Math.PI / -2;
          screenPlane.rotation.z = Math.PI / 1;
          screenPlane.scale.set(0.1, 0.1, 1);
          screenPlane.translateZ(0.001);
        }
      });

      model.position.x = posicionX < 0 ? -5 : 5;
      model.position.y = 0;
      model.rotation.set(rotX, rotY, 0);

      scene.add(model);

      modelos.push({
        model,
        offset,
        baseY: model.position.y,
        targetX: posicionX,
        baseRotX: model.rotation.x,
        baseRotY: model.rotation.y,
      });
    },
    undefined,
    (error) => console.error("Error al cargar el modelo", error)
  );
}

// 🔹 Cargar modelos
const texturaRuta1 = document.body.dataset.textura1;
const texturaRuta2 = document.body.dataset.textura2;

cargarModelo("../src/objt/phone/iphone.glb", texturaRuta1, -0.4, 0, Math.PI, 0);
cargarModelo("../src/objt/phone/iphone.glb", texturaRuta2, 0.5, Math.PI / 2, Math.PI, -0.05);

// Animación flotante
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.002;

  modelos.forEach(({ model, offset, baseY }) => {
    model.position.y = baseY + Math.sin(time + offset) * 0.03;
  });

  renderer.render(scene, camera);
}
animate();

// ✅ IntersectionObserver para animación de entrada
let animacionEjecutada = false;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !animacionEjecutada) {
        animacionEjecutada = true;

        const timeline = gsap.timeline({
          onComplete: () => {
            modelos.forEach((m) => {
              m.baseRotX = m.model.rotation.x;
              m.baseRotY = m.model.rotation.y;
            });

            efectoMouseActivo = true;
            updateMouseTweens(lastMouseX, lastMouseY);
          },
        });

        modelos.forEach(({ model, targetX }) => {
          timeline.to(model.position, {
            x: targetX,
            duration: 2,
            ease: "power2.out",
          }, 0);

          timeline.to(model.rotation, {
            y: "+=" + Math.PI * 2,
            duration: 2,
            ease: "power2.out",
          }, 0);
        });

        observer.disconnect();
      }
    });
  },
  { threshold: 0.5 }
);

observer.observe(container);

// ✅ Detectar si es móvil/tablet
const isMobileOrTablet = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// ✅ Solo activar el hover de mouse en desktop
if (!isMobileOrTablet) {
  window.addEventListener("mousemove", (event) => {
    lastMouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    lastMouseY = (event.clientY / window.innerHeight - 0.5) * 2;

    if (!efectoMouseActivo || mouseEffectPaused) return;
    updateMouseTweens(lastMouseX, lastMouseY);
  });
}

// ✅ Raycaster para detectar clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

container.addEventListener("click", (event) => {
  if (!efectoMouseActivo) return;
  if (clickInProgress) return;

  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length === 0) return;

  let clicked = intersects[0].object;
  while (clicked.parent && !modelos.find((m) => m.model === clicked)) {
    clicked = clicked.parent;
  }

  const modeloData = modelos.find((m) => m.model === clicked);
  if (!modeloData) return;

  mouseEffectPaused = true;
  clickInProgress = true;

  mouseTweens.forEach((t) => t.kill());
  mouseTweens.clear();

  gsap.to(modeloData.model.rotation, {
    y: modeloData.model.rotation.y + Math.PI * 2,
    duration: 3,
    ease: "power2.inOut",
    onComplete: () => {
      modeloData.baseRotX = modeloData.model.rotation.x;
      modeloData.baseRotY = modeloData.model.rotation.y;
      mouseEffectPaused = false;
      clickInProgress = false;
      updateMouseTweens(lastMouseX, lastMouseY);
    },
  });
});

// Ajustar al redimensionar
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
