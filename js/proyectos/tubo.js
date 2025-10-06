import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";

// Contenedor
const container = document.getElementById("cont_escena_tubo");

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Cámara
const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 1.5, 3.4);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 5, 7);
scene.add(dirLight);

// 🎥 Crear material con video
function crearMaterialVideo(ruta) {
  const video = document.createElement("video");
  video.src = ruta;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;

  video.addEventListener("loadeddata", () => {
    video.play();
  });

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

// Videos
const materiales = [
  crearMaterialVideo("../src/img/assetproyectos/proyectodsains/videodsain.mp4"),
  crearMaterialVideo("../src/img/assetproyectos/proyectodsains/videodsain.mp4"),
  crearMaterialVideo("../src/img/assetproyectos/proyectodsains/videodsain.mp4"),
];

// 🎬 Crear secciones del cilindro
const radio = 1.7;
const altura = 0.7;
const segmentosRadiales = 64;

// 👉 Configuración de ángulos y huecos
const espacio = 0.0; // separación entre segmentos (en radianes)
const angulos = [Math.PI / 3, Math.PI / 3, Math.PI / 3]; 
// puedes personalizar cada segmento: ej. [Math.PI/2, Math.PI/4, Math.PI/3]

const posicionesY = [2, 1, 0];

for (let i = 0; i < 3; i++) {
  const inicio = i * ((2 * Math.PI) / 3); // separación cada 120°
  const angulo = angulos[i] - espacio;   // reducir el ángulo para dejar hueco

  const geometry = new THREE.CylinderGeometry(
    radio,
    radio,
    altura,
    segmentosRadiales,
    1,
    true,
    inicio,
    angulo
  );

  const mesh = new THREE.Mesh(geometry, materiales[i]);
  mesh.position.y = posicionesY[i];

  // Ajustar rotación para que se vea orientado correctamente
  mesh.rotation.y = Math.PI; 

  scene.add(mesh);
  mesh.rotation.y = -0.5; // Girar para que el video no salga al revés
}

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


