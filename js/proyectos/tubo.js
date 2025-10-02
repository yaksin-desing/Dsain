import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import {
    GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Contenedor
const container = document.getElementById("cont_escena_tubo");

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Cámara
const camera = new THREE.PerspectiveCamera(50,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 2);

// Renderizador
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Luz básica
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
light.position.set(0, 20, 0);
scene.add(light);

// Loader de GLTF
const loader = new GLTFLoader();
loader.load(
    "../src/objt/tubo/tubo.glb",
    (gltf) => {
        const model = gltf.scene;

        // 🔹 Recorremos las mallas y activamos DoubleSide
        model.traverse((node) => {
            if (node.isMesh && node.material) {
                node.material.side = THREE.DoubleSide;
                node.material.needsUpdate = true;
            }
        });

        scene.add(model);
        model.position.set(0, -1.8, 0);
    },
    undefined,
    (error) => {
        console.error("Error al cargar el modelo:", error);
    }
);

// Animación básica (solo renderizar)
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