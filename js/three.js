import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js';

function main() {
  const container = document.getElementById('scene-container');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x004ee); // Fondo azul cielo
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 1.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
  directionalLight.position.set(0.078, -0.058, -0.088);
  scene.add(directionalLight);

  let mouseX = 0, mouseY = 0;
  let model, mixer;

  // Registrar posición del mouse
  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  // Cargar modelo GLTF
  const loader = new GLTFLoader();
  loader.load(
    './src/objt/logo/logoanimado.glb',
    (gltf) => {
      model = gltf.scene;
      model.scale.set(1, 1, 1);
      model.position.set(0.1, -0.6, 0);

      // Aplicar HDRI al modelo
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load('./src/objt/logo/hdr.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.envMap = texture;
            child.material.envMapIntensity = 5;
            child.material.metalness = 0;
            child.material.roughness = 1;
            child.material.clearcoat = 1;
            child.material.clearcoatRoughness = 0;
            child.material.emissive = new THREE.Color(0x130047);
            child.material.emissiveIntensity = 2.24;
            child.material.ior = 2.33;
            child.material.transmission = 1;
            child.material.thickness = 0.5;
            child.material.needsUpdate = true;
          }
        });

        scene.add(model);
      });

      // Animaciones del modelo
      mixer = new THREE.AnimationMixer(model);
      if (gltf.animations.length > 0) {
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }
    },
    undefined,
    (error) => console.error('Error al cargar el modelo:', error)
  );

  // Animar escena sin OrbitControls
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);

    if (model) {
      // Rotación basada en la posición del mouse sin OrbitControls
      model.rotation.x = mouseY * 0.1;
      model.rotation.y = mouseX * 0.1;
    }

    // Actualizar la cámara si lo deseas (por ejemplo, moviéndola según el mouse)
    camera.rotation.x = mouseY * 0.05;
    camera.rotation.y = mouseX * 0.05;

    const delta = clock.getDelta();
    if (mixer) {
      mixer.update(delta);
    }
    renderer.render(scene, camera);
  }
  animate();

  // Ajustar tamaño en redimensionamiento
  window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });
}

main();
