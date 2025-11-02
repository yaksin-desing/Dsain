import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import {
  Water
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Water.js";

import {
  Sky
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Sky.js";


const container = document.getElementById("scene-container");

const sceneTres = new THREE.Scene();
const cameraTres = new THREE.PerspectiveCamera(
  70,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
cameraTres.position.set(26, 9, -21);
cameraTres.quaternion.setFromEuler(new THREE.Euler(0.05, -1.58, 0, "YXZ"));


// Configuración de la luz direccional
const luzdospasillo = new THREE.DirectionalLight(0xffffff, 1);
luzdospasillo.position.set(10, 80, -7);
luzdospasillo.castShadow = true;
luzdospasillo.shadow.camera.top = 100;
luzdospasillo.shadow.camera.bottom = -100;
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

// Configuración de la luz direccional
const luzdospasillotres = new THREE.DirectionalLight(0xFDFFA2, 0.7);
luzdospasillotres.position.set(-5, 5, 500);

const targetres = new THREE.Object3D();
targetres.position.set(0, 0, 50);
sceneTres.add(targetres);
luzdospasillotres.target = targetres;
sceneTres.add(luzdospasillotres);


const luzLinterna = new THREE.SpotLight(0xffffff, 1.7);
luzLinterna.position.set(0, 0, 0);

// Ángulo más cerrado (en radianes, por ejemplo 0.1 para ángulo pequeño)
luzLinterna.angle = 2;

// Qué tan difuso es el borde (0 = borde duro, 1 = difuso)
luzLinterna.penumbra = 0.9;


// Configurar el target
const targetLinterna = new THREE.Object3D();
targetLinterna.position.set(0, 0, -5);
sceneTres.add(targetLinterna);
luzLinterna.target = targetLinterna;

sceneTres.add(luzLinterna);


//luz suelo

const luzHemisferica = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
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

    //crearRoca(28, 0, -100, 0.5, 0.8, 0.2, 0.2, 0, 0);
    crearRoca(40, -1, -13, 0.5, 0.3, 0.3, 0, -1.8, 0);
    //crearRoca(30, 0, -40, 1, 2, 1, 0, -5, 0);
    //crearRoca(28, 0, -150, 1, 2, 1, 0, -4.5, 0);


    crearRoca(-15, 0, -100, 0.3, 0.5, 0.2, 0.2, -0.5, 0);
    //crearRoca(-30, 0, -60, 0.3, 0.5, 0.3, 0.2, 1, 0);
    crearRoca(-20, -1, -20, 0.3, 0.5, 0.3, 0, -1.8, 0);
    //crearRoca(-40, 0, -40, 1, 2, 0.4, 0, -1.8, 0);
    //crearRoca(-30, 0, -140, 1, 2, 0.4, 0, -2, 0);
    //crearRoca(-15, -5, -230, 1, 2.5, 0.4, 1, -2.5, 1);


  },
  undefined,
  (error) => console.error("Error al cargar el modelo de roca:", error)
);

// Cargar modelo Palmera
const loaderpalmera = new GLTFLoader();
loaderpalmera.load(
  "./src/objt/escena/escenatres/palma.glb",
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

    crearPalmera(30, 25, -85, 0.3, 0.3, 0.3, 0, 0, 0);
    crearPalmera(27, 25, 7, 0.3, 0.3, 0.3, 0, 2, 0);



    crearPalmera(-25, 20, -100, 0.4, 0.4, 0.4, 0, 0, 0);
    crearPalmera(-25, 20, -40, 0.4, 0.3, 0.4, 0, 0, 0);


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

    crearPalmera(5, -0.5, 100, 0.1, 0.1, 0.1, 0, 0, 0);


    crearPalmera(-11, -0.5, 120, 0.1, 0.1, 0.1, 0, 0, 0);

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
const planeGeometryportal = new THREE.PlaneGeometry(16, 8);

// Crea el material usando la textura del render target
const planeMaterialportal = new THREE.MeshBasicMaterial({
  map: renderTargetTres.texture, // Usa la textura del render target
});

// Crea el mesh combinando geometría y material
const textuportal = new THREE.Mesh(planeGeometryportal, planeMaterialportal);

// Configura la posición del plano si es necesario
textuportal.position.set(31, 9.8, -21); // Cambia las coordenadas según tu escena
textuportal.quaternion.setFromEuler(new THREE.Euler(0.05, -1.58, 0, "YXZ"));


// Agrega el plano a la escena secundaria
sceneTres.add(textuportal);

// Cargar pared
const loaderpared = new GLTFLoader();
loaderpared.load(
  "./src/objt/escena/escenatres/paredtres.glb",
  (gltf) => {
    const paredtres = gltf.scene;
    paredtres.position.set(34.3, -6.1, -20);
    paredtres.scale.set(0.4, 0.4, 0.35);
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

  const waterGeometry = new THREE.PlaneGeometry(550, 550);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormal,
    sunDirection: new THREE.Vector3(0, 1, 0),
    sunColor: 0xffffff,
    waterColor: 0x0199FF,
    distortionScale: 0.5,
    fog: false,
    alpha: 0.8, // Nivel de transparencia (0 totalmente transparente, 1 totalmente opaco)
  });
  water.material.transparent = true;
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.9;
  water.position.z = 0;

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
skyUniforms["turbidity"].value = 0.1; // Turbulencia atmosférica
skyUniforms["rayleigh"].value = 4; // Dispersión de la luz en la atmósfera
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


// Crear la geometría del suelo
const sueloGeometry = new THREE.PlaneGeometry(700, 700); // tamaño del suelo

// Crear el material del suelo
const sueloMaterial = new THREE.MeshStandardMaterial({
  color: 0x6EBFD3, // color blanco
  side: THREE.DoubleSide // visible por ambos lados
});

// Crear el mesh combinando geometría y material
const suelo = new THREE.Mesh(sueloGeometry, sueloMaterial);

// Rotar el suelo para que quede horizontal
suelo.rotation.x = -Math.PI / 2; // rotarlo 90 grados en el eje X

// Opcional: posicionarlo un poco más abajo
suelo.position.y = 0;

// Añadir el suelo a la escena
sceneTres.add(suelo);


// Cargar texturas
const loaderTress = new THREE.TextureLoader();

const baseColorTress = loaderTress.load('./src/objt/escena/escenatres/textpiso/basecolor.png');
const aoMapTress = loaderTress.load('./src/objt/escena/escenatres/textpiso/ambientOcclusion.png');
const heightMapTress = loaderTress.load('./src/objt/escena/escenatres/textpiso/height.png');
const normalMapTress = loaderTress.load('./src/objt/escena/escenatres/textpiso/normal.png');


// Hacer que las texturas se repitan
baseColorTress.wrapS = baseColorTress.wrapT = THREE.RepeatWrapping;
aoMapTress.wrapS = aoMapTress.wrapT = THREE.RepeatWrapping;
heightMapTress.wrapS = heightMapTress.wrapT = THREE.RepeatWrapping;
normalMapTress.wrapS = normalMapTress.wrapT = THREE.RepeatWrapping;


// Definir cuánto quieres que se repitan (por ejemplo 4x4 veces)
const repeatCountTress = 27;
baseColorTress.repeat.set(repeatCountTress, repeatCountTress);
aoMapTress.repeat.set(repeatCountTress, repeatCountTress);
heightMapTress.repeat.set(repeatCountTress, repeatCountTress);
normalMapTress.repeat.set(repeatCountTress, repeatCountTress);


// Crear el material
const materialTress = new THREE.MeshStandardMaterial({
  map: baseColorTress,
  aoMap: aoMapTress,
  normalMap: normalMapTress,
  displacementMap: heightMapTress,
  displacementScale: 0.2,
});

// Crear un Plane
const geometryTress = new THREE.PlaneGeometry(200, 300, 1, 1);

// MUY IMPORTANTE: Necesitas UV2 para que el aoMap funcione
geometryTress.setAttribute('uv2', new THREE.BufferAttribute(geometryTress.attributes.uv.array, 2));

const planeTress = new THREE.Mesh(geometryTress, materialTress);
sceneTres.add(planeTress);

// Opcional: rotarlo para que esté horizontal
planeTress.rotation.x = -Math.PI / 2;
planeTress.position.set(0, 0.4, 50);
planeTress.receiveShadow = true; // Asegúrate de que el plano reciba sombras

sceneTres.add(luzdospasillo);
// Cargar pascilloModel
const pascilloLoader = new GLTFLoader();
pascilloLoader.load(
  "./src/objt/escena/pasilloescenauno.glb",
  (gltf) => {
    const pascilloModel = gltf.scene;
    pascilloModel.scale.set(3, 3, 3);
    pascilloModel.position.set(0, 0, 116);



    pascilloModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    sceneTres.add(pascilloModel);
  },
  undefined,
  (error) => console.error("Error al cargar el modelo de pascilloModel:", error)
);

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