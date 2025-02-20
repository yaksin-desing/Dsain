import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import {
  OrbitControls
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import {
  Water
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Water.js";

import { Sky } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Sky.js";


const container = document.getElementById("scene-container");

const sceneTres = new THREE.Scene();
const cameraTres = new THREE.PerspectiveCamera(
  70,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
cameraTres.position.set(26, 13, -21);
cameraTres.quaternion.setFromEuler(new THREE.Euler(0.05,-1.58, 0, "YXZ"));

// Configuración de la luz direccional
const luzdospasillo = new THREE.DirectionalLight(0xffffff, 3);
luzdospasillo.position.set(0, 80, 0);
luzdospasillo.castShadow = true;
luzdospasillo.shadow.camera.top = 100;
luzdospasillo.shadow.camera.bottom = -50;
luzdospasillo.shadow.camera.left = -30;
luzdospasillo.shadow.camera.right = 30;
luzdospasillo.shadow.camera.near = 0.5;
luzdospasillo.shadow.camera.far = 85;
luzdospasillo.shadow.mapSize.width = 2000;
luzdospasillo.shadow.mapSize.height = 2000;
luzdospasillo.shadow.bias = -0.001;
luzdospasillo.shadow.opacity = 0;

const targetdos = new THREE.Object3D();
targetdos.position.set(0, 0, 0);
sceneTres.add(targetdos);
luzdospasillo.target = targetdos;

// const shadowCameraHelper = new THREE.CameraHelper(luzdospasillo.shadow.camera);
// sceneTres.add(shadowCameraHelper);

// const directionalLightHelper = new THREE.DirectionalLightHelper(luzdospasillo, 10);
// sceneTres.add(directionalLightHelper);

sceneTres.add(luzdospasillo);

//luz suelo

const luzHemisferica = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
luzHemisferica.position.set(0, -5, 0);
sceneTres.add(luzHemisferica);


// Cargar modelo Roca
const loaderroca = new GLTFLoader();
loaderroca.load(
  "./src/objt/escena/escenatres/roca.glb",
  (gltf) => {
    const modeloBase = gltf.scene;

    function crearRoca(posX, posY, posZ, escalaX, escalaY, escalaZ, rotacionX, rotacionY, rotacionZ) {
      const clonRoca = modeloBase.clone();
      clonRoca.position.set(posX, posY, posZ);
      clonRoca.scale.set(escalaX, escalaY, escalaZ);
      clonRoca.rotation.set(rotacionX, rotacionY, rotacionZ);

      clonRoca.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      sceneTres.add(clonRoca);
    }

    crearRoca(28, 0, -100,  0.5, 0.8, 0.2,  0.2, 0, 0);
    crearRoca(40, 0, -15,   0.5, 0.3, 0.3,  0, -1.8, 0);
    crearRoca(30, 0, -40,   1, 2, 1,  0, -5, 0);
    crearRoca(28, 0, -150,   1, 2, 1,  0, -4.5, 0);


    crearRoca(-15, 0, -100, 0.3, 0.5, 0.2, 0.2, -0.5, 0);
    crearRoca(-30, 0, -60, 0.3, 0.5, 0.3, 0.2, 1, 0);
    crearRoca(-20, -1, -20, 0.3, 0.5, 0.3, 0, -1.8, 0);
    crearRoca(-40, 0, -40,   1, 2, 0.4,  0, -1.8, 0);
    crearRoca(-30, 0, -140,   1, 2, 0.4,  0, -2, 0);
    crearRoca(-15, -5, -230,   1, 2.5, 0.4,  1, -2.5, 1);


  },
  undefined,
  (error) => console.error("Error al cargar el modelo de roca:", error)
);

// Cargar modelo Palmera
const loaderpalmera = new GLTFLoader();
loaderpalmera.load(
  "./src/objt/escena/escenatres/palmera.glb",
  (gltf) => {
    const modeloBase = gltf.scene;

    function crearPalmera(posX, posY, posZ, escalaX, escalaY, escalaZ, rotacionX, rotacionY, rotacionZ) {
      const clonPalmera = modeloBase.clone();
      clonPalmera.position.set(posX, posY, posZ);
      clonPalmera.scale.set(escalaX, escalaY, escalaZ);
      clonPalmera.rotation.set(rotacionX, rotacionY, rotacionZ);

      clonPalmera.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      sceneTres.add(clonPalmera);
    }

    crearPalmera(30, 15, -85, 0.3, 0.3, 0.3, 0, 0, 0);
    crearPalmera(-25, 10, -100, 0.4, 0.4, 0.4, 0, 0, 0);


    crearPalmera(-25, 10, -40, 0.4, 0.3, 0.4, 0, 0, 0);
    

  },
  undefined,
  (error) => console.error("Error al cargar el modelo de palmera:", error)
);

// Cargar modelo Planta
const loaderplanta = new GLTFLoader();
loaderplanta.load(
  "./src/objt/escena/escenatres/planta.glb",
  (gltf) => {
    const modeloBase = gltf.scene;

    function crearPalmera(posX, posY, posZ, escalaX, escalaY, escalaZ, rotacionX, rotacionY, rotacionZ) {
      const clonplanta = modeloBase.clone();
      clonplanta.position.set(posX, posY, posZ);
      clonplanta.scale.set(escalaX, escalaY, escalaZ);
      clonplanta.rotation.set(rotacionX, rotacionY, rotacionZ);

      clonplanta.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      sceneTres.add(clonplanta);
    }

    crearPalmera(15, 0, -15, 0.4, 0.3, 0.4, 0, 0, 0);


    crearPalmera(-45, 3, -25, 0.4, 0.3, 0.4, 0, 0, 0);

  },
  undefined,
  (error) => console.error("Error al cargar el modelo de palmera:", error)
);

// Crear el render target con el ancho aumentado
const renderTargetTres = new THREE.WebGLRenderTarget(
  container.clientWidth, // Aumenta el ancho
  container.clientHeight, // Mantén la altura igual
  {
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  }
);


// Crea la geometría del plano
const planeGeometryportal = new THREE.PlaneGeometry(17.5, 9.5);

// Crea el material usando la textura del render target
const planeMaterialportal = new THREE.MeshBasicMaterial({
  map: renderTargetTres.texture, // Usa la textura del render target
});

// Crea el mesh combinando geometría y material
const textuportal = new THREE.Mesh(planeGeometryportal, planeMaterialportal);

// Configura la posición del plano si es necesario
textuportal.position.set(31, 12.8, -21); // Cambia las coordenadas según tu escena
textuportal.quaternion.setFromEuler(new THREE.Euler(0.05,-1.58, 0, "YXZ"));


// Agrega el plano a la escena secundaria
sceneTres.add(textuportal);

// Cargar pared
const loaderpared = new GLTFLoader();
loaderpared.load(
  "./src/objt/escena/escenatres/paredtres.glb",
  (gltf) => {
    const paredtres = gltf.scene;
    paredtres.position.set(35, -3, -20);
    paredtres.scale.set(0.4, 0.4, 0.4);
    paredtres.rotation.set(0, -1.58, 0);

    paredtres.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    sceneTres.add(paredtres);
  },
  undefined,
  (error) => console.error("Error al cargar el modelo de paredtres:", error)
);

let water; // Definir variable globalmente

const textureaguaLoader = new THREE.TextureLoader();
textureaguaLoader.load('./src/objt/agua/norm.jpg', function (waterNormal) {
  waterNormal.wrapS = waterNormal.wrapT = THREE.RepeatWrapping;

  const waterGeometry = new THREE.PlaneGeometry(200, 300);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormal,
    sunDirection: new THREE.Vector3(0, 1, 0),
    sunColor: 0xffffff,
    waterColor: 0x0199FF,
    distortionScale: 3.7,
    fog: false,
  });

  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.5;
  water.position.z = -100;

  sceneTres.add(water);

  console.log("¡Agua cargada correctamente!", water);
}, undefined, function (error) {
  console.error("Error al cargar la textura del agua:", error);
});

// Crear cielo
const sky = new Sky();
sky.scale.setScalar(1000); // Tamaño del cielo

// Configurar los parámetros del shader del cielo
const skyUniforms = sky.material.uniforms;
skyUniforms["turbidity"].value = 0.1;  // Turbulencia atmosférica
skyUniforms["rayleigh"].value = 4;    // Dispersión de la luz en la atmósfera
skyUniforms["mieCoefficient"].value = 0.0001; // Dispersión de partículas pequeñas
skyUniforms["mieDirectionalG"].value = 0.9; // Intensidad de la dispersión Mie

// Posición del sol
const sun = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(94 - 9); // Altura del sol (elevación)
const theta = THREE.MathUtils.degToRad(180); // Dirección del sol (azimutal)
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms["sunPosition"].value.copy(sun);

// Agregar el cielo a la escena
sceneTres.add(sky);





// // Agregar controles de cámara
// const controls = new OrbitControls(cameraTres, container);
// controls.enableDamping = true; // Suaviza el movimiento
// controls.dampingFactor = 0.05;
// controls.screenSpacePanning = false;
// controls.minDistance = 2; // Zoom mínimo
// controls.maxDistance = 50; // Zoom máximo
// controls.maxPolarAngle = Math.PI / 2; // Limitar rotación vertical


export {
  sceneTres,
  cameraTres,
  water,
  renderTargetTres
};