import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import {
  RGBELoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";
import {
  TextureLoader
} from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import gsap from "https://cdn.skypack.dev/gsap@3.11.0";

function main() {
  const container = document.getElementById("scene-container");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0000ff); // Fondo azul cielo

// Agregar niebla lineal
//scene.fog = new THREE.Fog(0xffbb33, 1, 40); // Color, inicio de la niebla, fin de la niebla

// Agregar niebla exponencial
//scene.fog = new THREE.FogExp2(0x0000ff, 0.01); // Color, densidad (ajusta para más o menos intensidad)



  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  const mouse = new THREE.Vector2();
  const targetX = 0;
  let cameraX = camera.position.x;
  const minCameraX = -1;
  const maxCameraX = 5;

  function focusCameraOnObject(camera, object, offset = {
    x: 0,
    y: -1,
    z: 1,
  }) {
    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = boundingBox.getCenter(new THREE.Vector3());
    camera.position.set(
      center.x + offset.x,
      center.y + offset.y,
      center.z + offset.z
    );
    camera.lookAt(center);
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5);
  directionalLight.position.set(0, 10, 50);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
  scene.add(directionalLightHelper);

  const textureLoader = new TextureLoader();
  const aroughnessMap = textureLoader.load("./src/objt/agua/roug.jpg");
  const aaoMap = textureLoader.load("./src/objt/agua/occ.jpg");
  const anormalMap = textureLoader.load("./src/objt/agua/norm.jpg");
  const adisplacementMap = textureLoader.load("./src/objt/agua/disp.png");
  const atexture = textureLoader.load("./src/objt/agua/hdr.png");

  const planeGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
  planeGeometry.attributes.uv2 = planeGeometry.attributes.uv;

  const planeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x000fff,
    roughness: 0,
    metalness: 0.1,
    transmission: 0.5,
    thickness: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMap: atexture,
    envMapIntensity: 2,
    normalMap: anormalMap,
    displacementMap: adisplacementMap,
    displacementScale: 0.3,
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, 0, 0);
  plane.receiveShadow = true;
  scene.add(plane);




  const pisoGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  const pisoMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffbb33,
    metalness: 0,
    transmission: 0,
  });
  const piso = new THREE.Mesh(pisoGeometry, pisoMaterial);
  piso.rotation.x = -Math.PI / 2;
  piso.position.set(0, -5, 0);
  scene.add(piso);



  let mixer;
  const animateFunctions = [];

  let model = null; // Variable global para el modelo

  // Cargar el HDR solo para el modelo
  const loader = new GLTFLoader();
  loader.load(
    "./src/objt/logo/scene.gltf",
    (gltf) => {
      model = gltf.scene; // Asignar el modelo a la variable global
      model.scale.set(1, 1, 1);
      model.position.set(0, 12, 0);
      model.rotation.set(-2, 0, 0);

      const rgbeLoader = new RGBELoader();
      rgbeLoader.load("./src/objt/logo/hdrs.hdr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            // Aplica el HDR solo al modelo
            child.material.envMap = texture;
            child.material.envMapIntensity = 3;
            child.material.metalness = 0.5;
            child.material.roughness = 0;
            child.material.clearcoat = 1;
            child.material.clearcoatRoughness = 0;
            child.material.emissive = new THREE.Color(0x9966cc);
            child.material.emissiveIntensity = 0.5;
            child.material.ior = 1;
            child.material.transmission =1;
            child.material.thickness = 1;
            child.material.needsUpdate = true;
            child.castShadow = true;
          }
        });

        scene.add(model);
        focusCameraOnObject(camera, model);

        function rotateModel() {
          model.rotation.y += 0.01;
        }
        animateFunctions.push(rotateModel);
      });
    },
    undefined,
    (error) => console.error("Error al cargar el modelo:", error)
  );

  let animateWaves = false;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    if (animateWaves) {
      const time = clock.getElapsedTime();
      const positionAttribute = plane.geometry.attributes.position;
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = Math.sin(x * 0.3 + time) * 0.1 + Math.cos(y * 0.3 + time) * 0.1;
        positionAttribute.setZ(i, z);
      }
      positionAttribute.needsUpdate = true;
    }

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    camera.position.x += (mouse.x - camera.position.x) * 0.05;
    camera.position.x = Math.max(minCameraX, Math.min(camera.position.x, maxCameraX));

    animateFunctions.forEach((fn) => fn());
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 0.25 - 0.125;
  }

  window.addEventListener("mousemove", onMouseMove);

  const botonInicio = document.getElementById("botoninicio");
  botonInicio.addEventListener("click", () => {
    if (!model) {
      console.error("El modelo aún no se ha cargado.");
      return;
    }

    animateWaves = true;

    const inicioescena = gsap.timeline();

    inicioescena.to(camera.position, {
      duration: 5,
      x: 0,
      y: 10,
      z: 1,
      ease: "none",

    });

    inicioescena.to(camera.position, {
      duration: 5,
      x: 0,
      y: 2,
      z: 2,
      ease: "none",
      onUpdate: () => {
        camera.lookAt(0, 1, 0);
      }
    });
    inicioescena.to(model.position, {
      delay: -3,
      x: 0,
      y: 1,
      z: 0,
      duration: 2,
      ease: "power3.easeInOut",
    });

    inicioescena.to(model.rotation, {
      delay: -3,
      x: 0,
      y: 0,
      z: 0,
      ease: "power3.easeInOut",
    });

    inicioescena.to(camera.position, {
      duration: 3,
      x: 0,
      y: 1,
      z: 5,
      ease: "power3.easeInOut",
      onUpdate: () => {
        camera.lookAt(0, 1, 0);
      }
    });
  });
}

main();
