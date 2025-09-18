import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

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
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
scene.add(dirLight);

// 🔹 Guardamos los modelos y sus offsets
const modelos = [];

// Función genérica para cargar modelo con su textura
function cargarModelo(rutaModelo, texturaRuta, posicionX, offset) {
  const texture = textureLoader.load(texturaRuta);

  loader.load(
    rutaModelo,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((node) => {
        if (node.isMesh) {
          node.receiveShadow = true;
        }

        // 👉 Buscar el mesh "pantalla"
        if (node.isMesh && node.name === "pantalla") {
          const bbox = new THREE.Box3().setFromObject(node);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          // Crear plano del tamaño exacto de la pantalla
          const planeGeometry = new THREE.PlaneGeometry(size.x, size.y);
          const planeMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.FrontSide,
          });

          const screenPlane = new THREE.Mesh(planeGeometry, planeMaterial);

          // 🔗 Lo anclamos directamente al mesh "pantalla"
          node.add(screenPlane);

          // ✅ Respetamos tus rotaciones y escala originales
          screenPlane.position.set(0, 0.0093, 0);
          screenPlane.rotation.x = Math.PI / -2;
          screenPlane.rotation.z = Math.PI / 1;
          screenPlane.scale.set(0.1, 0.1, 1);

          // Pequeño offset para que no se mezcle con la geometría
          screenPlane.translateZ(0.001);
        }
      });

      // Posicionamos cada modelo en la escena
      model.position.x = posicionX;
      model.rotation.y = Math.PI;
      scene.add(model);

      // Guardamos referencia con offset
      modelos.push({ model, offset, baseY: model.position.y });
    },
    (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% cargado"),
    (error) => console.error("Error al cargar el modelo", error)
  );
}

// 🔹 Llamamos la función 2 veces con texturas distintas
const texturaRuta1 = document.body.dataset.textura1;
const texturaRuta2 = document.body.dataset.textura2;

cargarModelo("../src/objt/phone/iphone.glb", texturaRuta1, -0.5, 0);
cargarModelo("../src/objt/phone/iphone.glb", texturaRuta2, 0.5, Math.PI / 2);

// Animación flotante
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.002; // tiempo animación

  modelos.forEach(({ model, offset, baseY }) => {
    model.rotation.y += 0.005; // rotación lenta
    model.position.y = baseY + Math.sin(time + offset) * 0.03; // flotar individual
  });

  renderer.render(scene, camera);
}
animate();

// Ajustar al redimensionar
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
