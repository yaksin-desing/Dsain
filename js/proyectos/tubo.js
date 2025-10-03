import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Contenedor
const container = document.getElementById("cont_escena_tubo");

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Cámara fija
const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 2);

// ✅ Detectar si es móvil/tablet
const isMobileOrTablet = /Mobi|Android|iPad|iPod/i.test(navigator.userAgent);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
if (isMobileOrTablet) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 5, 7);
scene.add(dirLight);

// 🎥 Crear los videos como texturas
function crearVideoTextura(ruta) {
  const video = document.createElement("video");
  video.src = ruta;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.play();

  const texture = new THREE.VideoTexture(video);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;

  return texture;
}

const video1 = crearVideoTextura("../src/img/assetproyectos/proyectodsains/videodsain.mp4");
const video2 = crearVideoTextura("../src/img/assetproyectos/proyectodsains/videodsain.mp4");
const video3 = crearVideoTextura("../src/img/assetproyectos/proyectodsains/videodsain.mp4");

// Función para agregar un plano de video encima de cada cara
function agregarPantalla(node, videoTexture) {
  const bbox = new THREE.Box3().setFromObject(node);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const planeGeometry = new THREE.PlaneGeometry(size.x, size.y);
  const planeMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide,
  });

  const screenPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  node.add(screenPlane);

  // Lo pegamos al frente de la cara
  screenPlane.position.set(0, 0, 1);
//   screenPlane.rotation.copy(0,0,0);
  screenPlane.scale.set(1, 2, 1);
}

// Loader GLTF
const loader = new GLTFLoader();
loader.load(
  "../src/objt/tubo/tubo.glb",
  (gltf) => {
    const model = gltf.scene;

    model.traverse((node) => {
      if (node.isMesh) {
        if (node.name === "carauno") {
          agregarPantalla(node, video1);
        }
        if (node.name === "carados") {
          agregarPantalla(node, video2);
        }
        if (node.name === "caratres") {
          agregarPantalla(node, video3);
        }
      }
    });

    model.position.set(0, -1.5, 0);
    scene.add(model);
  },
  undefined,
  (error) => console.error("Error al cargar modelo", error)
);

// Animación
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Ajustar al redimensionar
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
