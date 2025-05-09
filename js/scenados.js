import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";

import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import {
  Sky
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Sky.js";


const container = document.getElementById("scene-container");

const sceneDos = new THREE.Scene();
const cameraDos = new THREE.PerspectiveCamera(
  80,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
cameraDos.rotation.set(0, 0, 0);
cameraDos.position.set(0, 2, 995.5); // Ajusta los valores según tu escena

sceneDos.background = new THREE.Color(0x0000ff); // Fondo azul cielo

if (screenWidth >= 990) {
const mouse = new THREE.Vector2();
const minCameraX = -5;
const maxCameraX = 5;

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 0.5 - 0.25; // Normaliza entre -1 y 1
}

window.addEventListener("mousemove", onMouseMove);

function updateCameraDos() {
  cameraDos.position.x += (mouse.x * maxCameraX - cameraDos.position.x) * 0.09;
  cameraDos.position.x = Math.max(minCameraX, Math.min(cameraDos.position.x, maxCameraX));

  requestAnimationFrame(updateCameraDos);
}

updateCameraDos();
}

//////// <<<<< base dos >>>>>> /////////////

// Crear cielo
const sky = new Sky();
sky.scale.setScalar(1000); // Tamaño del cielo
sky.position.set(0, 0, 1000);


// Configurar los parámetros del shader del cielo
const skyUniforms = sky.material.uniforms;
skyUniforms["turbidity"].value = 0.1; // Turbulencia atmosférica
skyUniforms["rayleigh"].value = 0.5; // Dispersión de la luz en la atmósfera
skyUniforms["mieCoefficient"].value = 0.0001; // Dispersión de partículas pequeñas
skyUniforms["mieDirectionalG"].value = 0.889; // Intensidad de la dispersión Mie

// Posición del sol
const sun = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(94 - 20); // Altura del sol (elevación)
const theta = THREE.MathUtils.degToRad(180); // Dirección del sol (azimutal)
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms["sunPosition"].value.copy(sun);

// Agregar el cielo a la escena
sceneDos.add(sky);

///////// Crear luz direccional  ////////////////
const luzdospasillo = new THREE.DirectionalLight(0xffffff, 0.8);
luzdospasillo.position.set(0, 80, 970); // Posición de la luz
luzdospasillo.castShadow = true; // Activar sombras

// Ajustar la cámara de sombras (proyección ortográfica)
luzdospasillo.shadow.camera.top = 200; // Límite superior
luzdospasillo.shadow.camera.bottom = -100; // Límite inferior
luzdospasillo.shadow.camera.left = -200; // Límite izquierdo
luzdospasillo.shadow.camera.right = 200; // Límite derecho
luzdospasillo.shadow.camera.near = 0.5; // Distancia mínima
luzdospasillo.shadow.camera.far = 200; // Distancia máxima
luzdospasillo.shadow.mapSize.width = 2000; // Ancho del mapa de sombras
luzdospasillo.shadow.mapSize.height = 2000; // Alto del mapa de sombras
luzdospasillo.shadow.bias = -0.001; // Previene artefactos de sombra
luzdospasillo.shadow.opacity = 0; // Un valor entre 0 (transparente) y 1 (opaco)

// Cambiar el objetivo de la luz
const targetdos = new THREE.Object3D();
targetdos.position.set(0, 0, 1000); // Nuevo punto al que apunta la luz
sceneDos.add(targetdos); // Agregar el objetivo a la escena
luzdospasillo.target = targetdos; // Asignar el objetivo a la luz


// // Helper para la cámara de sombras
// const shadowCameraHelper = new THREE.CameraHelper(luzdospasillo.shadow.camera);
// sceneDos.add(shadowCameraHelper);

// // Helper para la luz direccional
// const directionalLightHelper = new THREE.DirectionalLightHelper(luzdospasillo, 10); // El tamaño del helper (10) es ajustable
// sceneDos.add(directionalLightHelper);

sceneDos.add(luzdospasillo);

const ambientLightdos = new THREE.DirectionalLight(0xffffff, 0.2); // Luz ambiental
ambientLightdos.position.set(0, -1, 800); // Posición de la luz
sceneDos.add(ambientLightdos);


// Cargar las texturas usando TextureLoader
const textureLoaderazulejo = new THREE.TextureLoader();

const colorTexture = textureLoaderazulejo.load(
  "./src/objt/escena/escenados/azulejo/acolor.jpg"
);
const normalTexture = textureLoaderazulejo.load(
  "./src/objt/escena/escenados/azulejo/anorm.jpg"
);
const roughnessTexture = textureLoaderazulejo.load(
  "./src/objt/escena/escenados/azulejo/arough.jpg"
);
const aoTexture = textureLoaderazulejo.load(
  "./src/objt/escena/escenados/azulejo/aocc.jpg"
);
const displacementTexture = textureLoaderazulejo.load(
  "./src/objt/escena/escenados/azulejo/adisp.png"
);
// Configurar las texturas para que se repitan
[
  colorTexture,
  normalTexture,
  roughnessTexture,
  aoTexture,
  displacementTexture,
].forEach((texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(110, 40); // Ajustar el número de repeticiones (10 en X, 2 en Y)
});

// Crear el material con las texturas cargadas
const materialbasedos = new THREE.MeshStandardMaterial({
  map: colorTexture,
  normalMap: normalTexture,
  roughnessMap: roughnessTexture,
  aoMap: aoTexture,
  displacementMap: displacementTexture,
  displacementScale: 0.1,
  emissive: 0x2fa1ff,
  emissiveIntensity: 0.5,
});

// Crear la geometría del plano
const geometrybasedos = new THREE.PlaneGeometry(600, 200);

// Crear el mesh y añadirlo a la escena
const planedos = new THREE.Mesh(geometrybasedos, materialbasedos);

// Posicionar y rotar el plano
planedos.position.set(0, 0, 1000);
planedos.rotation.x = -Math.PI / 2;

// Habilitar sombras en el modelo
planedos.castShadow = true; // El cubo emitirá sombras
planedos.receiveShadow = true; // El cubo recibirá sombras si hay otras fuentes de luz

sceneDos.add(planedos);

// Cargar modelo david
const david = new GLTFLoader();
david.load(
  "./src/objt/escena/escenados/david.glb",
  (gltf) => {
    const modeldavid = gltf.scene;
    modeldavid.position.set(-5, -10, 980);
    modeldavid.scale.set(1, 1, 1);
    modeldavid.rotation.set(0, 0, 0);

    // Material para el pasillo
    const modeldavidMaterial = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      color: 0xffffff,
      emissive: 0xc4e5f5,
      emissiveIntensity: 0.4,
      envMap: null, // Deshabilitar HDRI solo para este material
    });

    // Aplicar material y configurar sombras
    modeldavid.traverse((child) => {
      if (child.isMesh) {
        child.material = modeldavidMaterial;
        child.castShadow = true; // Proyectar sombras
      }
    });

    // Agregar modelo a la escena
    sceneDos.add(modeldavid);
  },
  undefined,
  (error) => console.error("Error al cargar el modelo de pasillo: ", error)
);

// Lista para almacenar los mixers
const mixers = [];




// Crear el render target con el ancho aumentado
const renderTarget = new THREE.WebGLRenderTarget(
  container.clientWidth, // Aumenta el ancho
  container.clientHeight, // Mantén la altura igual
  {
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  }
);


// Crea la geometría del plano
const planeGeometryportal = new THREE.PlaneGeometry(1.85, 4.8);

// Crea el material usando la textura del render target
const planeMaterialportal = new THREE.MeshBasicMaterial({
  map: renderTarget.texture, // Usa la textura del render target
});

// Crea el mesh combinando geometría y material
const textuportal = new THREE.Mesh(planeGeometryportal, planeMaterialportal);

// Configura la posición del plano si es necesario
textuportal.position.set(0, 2, 993.9); // Cambia las coordenadas según tu escena

// Agrega el plano a la escena secundaria
sceneDos.add(textuportal);




let mixerpuerta = null; // Guardar el mixer de la puerta
let puertaAnim, perillaAnim, seguroAnim; // Declarar las animaciones globalmente
// Cargar el modelo puerta.glb
const puerta = new GLTFLoader();
puerta.load(
  './src/objt/escena/escenados/door.glb', // Ruta al archivo .glb
  (gltf) => {
    const modelpuerta = gltf.scene;

    // Habilitar sombras para el modelo y sus hijos
    modelpuerta.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Ajustar posición y escala
    modelpuerta.position.set(0, 0.1, 994);
    modelpuerta.scale.set(1, 1, 1);
    modelpuerta.rotation.set(0, 0, 0);

    // Agregar el modelo a la escena
    sceneDos.add(modelpuerta);

    mixerpuerta = new THREE.AnimationMixer(modelpuerta);

    // Asociar las animaciones y configurarlas para que puedan ser pausadas o reanudadas
    puertaAnim = gltf.animations.find((anim) => anim.name === 'puerta');
    perillaAnim = gltf.animations.find((anim) => anim.name === 'perilla');
    seguroAnim = gltf.animations.find((anim) => anim.name === 'seguro');

    // Reproducir las animaciones y configurarlas para detenerse en el frame 125
    if (puertaAnim) {
      const action = mixerpuerta.clipAction(puertaAnim);
      action.play();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.setEffectiveTimeScale(1.3); // Configurar timeScale
    }

    if (perillaAnim) {
      const action = mixerpuerta.clipAction(perillaAnim);
      action.play();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.setEffectiveTimeScale(1.3); // Configurar timeScale
    }

    if (seguroAnim) {
      const action = mixerpuerta.clipAction(seguroAnim);
      action.play();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.setEffectiveTimeScale(1.3); // Configurar timeScale
    }
  },
  undefined,
  (error) => {
    console.error('Error al cargar el modelo:', error);
  }
);


const frameTarget = 125; // Frame donde queremos detener
const totalFrames = 250; // Total de frames de la animación


function playToFrame125() {
  if (mixerpuerta) {
    const puertaAction = mixerpuerta.clipAction(puertaAnim);
    const perillaAction = mixerpuerta.clipAction(perillaAnim);
    const seguroAction = mixerpuerta.clipAction(seguroAnim);

    // Calcular el tiempo correspondiente al frame 125
    const frame125Time = (frameTarget / totalFrames) * puertaAnim.duration;

    // Configurar las acciones
    puertaAction.reset();
    perillaAction.reset();
    seguroAction.reset();

    puertaAction.loop = THREE.LoopOnce;
    perillaAction.loop = THREE.LoopOnce;
    seguroAction.loop = THREE.LoopOnce;

    puertaAction.clampWhenFinished = true;
    perillaAction.clampWhenFinished = true;
    seguroAction.clampWhenFinished = true;

    puertaAction.play();
    perillaAction.play();
    seguroAction.play();

    // Usar `requestAnimationFrame` para detener en el frame 125
    function monitorAnimation() {
      mixerpuerta.update(1 / 60); // Actualizar el mixer manualmente

      if (puertaAction.time >= frame125Time) {
        puertaAction.time = frame125Time;
        perillaAction.time = frame125Time;
        seguroAction.time = frame125Time;

        puertaAction.paused = true;
        perillaAction.paused = true;
        seguroAction.paused = true;

        console.log('Animaciones detenidas exactamente en el frame 125');
      } else {
        requestAnimationFrame(monitorAnimation); // Seguir monitoreando
      }
    }

    monitorAnimation();
    console.log('Reproduciendo animaciones del frame 0 al 125');
  }
}

function resumeAnimationsFrom125() {
  if (mixerpuerta) {
    const puertaAction = mixerpuerta.clipAction(puertaAnim);
    const perillaAction = mixerpuerta.clipAction(perillaAnim);
    const seguroAction = mixerpuerta.clipAction(seguroAnim);

    puertaAction.loop = THREE.LoopOnce;
    perillaAction.loop = THREE.LoopOnce;
    seguroAction.loop = THREE.LoopOnce;

    puertaAction.time = (frameTarget / totalFrames) * puertaAnim.duration;
    perillaAction.time = (frameTarget / totalFrames) * perillaAnim.duration;
    seguroAction.time = (frameTarget / totalFrames) * seguroAnim.duration;

    puertaAction.paused = false;
    perillaAction.paused = false;
    seguroAction.paused = false;

    puertaAction.play();
    perillaAction.play();
    seguroAction.play();

    console.log('Reproduciendo animaciones del frame 125 al 250');
  }
}





export {
  mixerpuerta,
  sceneDos,
  cameraDos,
  renderTarget,
  playToFrame125,
  resumeAnimationsFrom125,
};