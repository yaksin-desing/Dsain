import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";

import {
  FontLoader,
  TextGeometry
} from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import {
  RGBELoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";

import {
  Water
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Water.js";



import gsap from "https://cdn.skypack.dev/gsap@3.11.0";



import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js'




import {
  mixerpuerta,
  mixernubes,
  sceneDos,
  cameraDos,
  renderTarget,
  playToFrame125,
  resumeAnimationsFrom125,
  updatePlanesDos,
  planesD,
} from './scenados.js';

import {
  sceneTres,
  cameraTres,
  water,
  renderTargetTres
} from './scenatres.js';



gsap.registerPlugin(ScrollTrigger);

function main() {


  const container = document.getElementById("scene-container");

  //////////////////////////////////////////

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    70,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.rotation.set(1, 0, 0);
  camera.position.set(0, 10.5, -4.8); // Ajusta los valores según tu escena

  scene.background = new THREE.Color(0x0000ff); // Fondo azul cielo

  //////////////////////////////////////////

  // Inicializa el renderer antes de utilizarlo
  const renderer = new THREE.WebGLRenderer({
    powerPreference: "high-performance",
    antialias: true,
  });

  renderer.shadowMap.enabled = true;


  //Puedes probar con otros tipos como THREE.PCFSoftShadowMap - THREE.PCFShadowMap o THREE.VSMShadowMap

  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Máximo x2 para evitar sobrecarga
  container.appendChild(renderer.domElement);




  // Carga la animación Lottie
  const animationprogres = lottie.loadAnimation({
    container: document.getElementById("lottie-container"), // Contenedor para la animación
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "./src/img/progreso.json", // Ruta de tu archivo Lottie
  });



  const mouse = new THREE.Vector2();
  const minCameraX = -1;
  const maxCameraX = 500;


  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 0.5 - 0.25;
  }

  window.addEventListener("mousemove", onMouseMove);



  let textMeshes = {}; // Objeto para almacenar los textos
  const loadertx = new FontLoader();

  // Función para obtener la configuración de textos según el ancho de la pantalla
  function getTextConfig() {
    let screenWidth = window.innerWidth; // Usar window.innerWidth en vez de container.clientWidth para mejor compatibilidad

    if (screenWidth < 450) {
      // Configuración para pantallas muy pequeñas (<400px)
      return [{
          id: "text2",
          text: "Middle Ux-Designer",
          font: "src/fonts/Light_Regular.json",
          size: 2000,
          y: 2.8
        },
        {
          id: "text1",
          text: "YAKSIN SAIN",
          font: "src/fonts/false_Semi-bold.json",
          size: 900,
          y: 2
        },
      ];
    } else if (screenWidth < 855) {
      // Configuración para pantallas pequeñas (<855px)
      return [{
          id: "text2",
          text: "Middle Ux-Designer",
          font: "src/fonts/Light_Regular.json",
          size: 2500,
          y: 2.5
        },
        {
          id: "text1",
          text: "YAKSIN SAIN",
          font: "src/fonts/false_Semi-bold.json",
          size: 800,
          y: 1.5
        },
      ];
    } else {
      // Configuración para pantallas grandes (>=855px)
      return [{
          id: "text2",
          text: "Middle Ux-Designer",
          font: "src/fonts/Light_Regular.json",
          size: 4000,
          y: 3.5
        },
        {
          id: "text1",
          text: "YAKSIN SAIN",
          font: "src/fonts/false_Semi-bold.json",
          size: 900,
          y: 1.2
        },
      ];
    }

  }

  // Función para calcular el tamaño dinámico del texto
  function getResponsiveSize(baseSize) {
    return window.innerWidth / baseSize;
  }

  // Función para crear o actualizar textos
  function createText({
    id,
    text,
    font,
    size,
    y
  }) {
    loadertx.load(font, function (loadedFont) {
      // Eliminar texto anterior si ya existe
      if (textMeshes[id]) {
        scene.remove(textMeshes[id]);
      }

      const textGeometry = new TextGeometry(text, {
        font: loadedFont,
        size: getResponsiveSize(size), // Tamaño dinámico basado en el ancho de pantalla
        height: 0,
        curveSegments: 12,
        bevelEnabled: false
      });

      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;

      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        side: THREE.DoubleSide,
        transparent: true, // Permite transparencia
        opacity: 1, // Nivel de transparencia (0 = totalmente transparente, 1 = totalmente opaco)
      });

      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.x = (-textWidth / 2);
      textMesh.position.y = y;

      scene.add(textMesh);
      textMeshes[id] = textMesh; // Guardar el texto en el objeto global
    });
  }

  // Función para actualizar todos los textos según el tamaño de pantalla
  function updateAllTexts() {
    let textsConfig = getTextConfig(); // Obtener configuración correcta
    textsConfig.forEach(createText); // Aplicar los textos
  }

  // Crear textos iniciales
  updateAllTexts();







  // Crear un gradiente utilizando un Canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth; // Ajustamos el tamaño del canvas para que cubra toda la pantalla
  canvas.height = window.innerHeight;

  // Crear un gradiente lineal de arriba hacia abajo (puedes personalizarlo)
  const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0, "#FFEBA8FF"); // abajo
  gradient.addColorStop(1, "#0400FFFF"); // arriba

  // Rellenar el canvas con el gradiente
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Crear una textura con el canvas
  const texture = new THREE.CanvasTexture(canvas);

  // Crear un rectángulo (plane geometry) con un material que tenga el gradiente
  const geometry = new THREE.PlaneGeometry(1500, 150, 1); // Rectángulo de 2x2 unidades para que ocupe toda la pantalla
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true, // Hacerlo transparente
    opacity: 1, // Totalmente opaco
  });

  const backgroundRect = new THREE.Mesh(geometry, material);
  backgroundRect.position.set(0, -30, -189); // Colocarlo detrás de la cámara
  backgroundRect.rotation.set(0, 0, 0);
  scene.add(backgroundRect);





  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-15, 16, -50);
  directionalLight.castShadow = true;
  scene.add(directionalLight);


  const segundaLight = new THREE.DirectionalLight(0xff9419, 1);
  segundaLight.position.set(0, 5, -40);
  segundaLight.target.position.set(0, 0, 0); // Dirige la luz hacia el origen


  // Agregar la luz a la escena
  scene.add(segundaLight);


  let wateru; // Definir variable globalmente

  const textureaguaLoader = new THREE.TextureLoader();
  textureaguaLoader.load('./src/objt/agua/norm.jpg', function (waterNormal) {
    waterNormal.wrapS = waterNormal.wrapT = THREE.RepeatWrapping;

    const waterGeometry = new THREE.PlaneGeometry(100, 100);

    wateru = new Water(waterGeometry, {
      textureWidth: 50,
      textureHeight: 50,
      waterNormals: waterNormal,
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xFFDA05,
      waterColor: 0x0199FF,
      distortionScale: 4,
      fog: false,
      alpha: 0.8, // Nivel de transparencia (0 totalmente transparente, 1 totalmente opaco)
    });

    wateru.material.transparent = true;

    wateru.rotation.x = -Math.PI / 2;
    wateru.position.y = 0.2;
    wateru.position.z = 30;

    scene.add(wateru);

    console.log("¡Agua cargada correctamente!", water);
  }, undefined, function (error) {
    console.error("Error al cargar la textura del agua:", error);
  });

  let mixer;
  const animateFunctions = [];

  let model = null; // Variable global para el modelo


  // ((( LOGO ))) Cargar el modelo y aplicar un HDRI local solo al modelo
  const loader = new GLTFLoader();
  loader.load(
    "./src/objt/logo/scene.gltf",
    (gltf) => {
      model = gltf.scene; // Asignar el modelo a la variable global
      model.scale.set(1, 1, 1);
      model.position.set(0, 12, -5);
      model.rotation.set(-2, 0, 0);
      // Cargar HDRI específico para el modelo
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load("./src/objt/logo/logo.hdr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            // Aplica el HDRI solo al modelo
            child.material.envMap = texture;
            child.material.envMapIntensity = 1.5;
            child.material.metalness = 1;
            child.material.roughness = 0;
            child.material.emissive = new THREE.Color(0x9966cc);
            child.material.emissiveIntensity = 0.4;
            child.material.ior = 5;
            child.material.needsUpdate = true;
          }
        });

        scene.add(model);
        //focusCameraOnObject(camera, model);

        function rotateModel() {
          model.rotation.y += 0.01;
        }
        animateFunctions.push(rotateModel);
      });
    },
    undefined,
    (error) => console.error("Error al cargar el modelo:", error)
  );

  // cargar modelo base logo
  const baselogo = new GLTFLoader();
  baselogo.load(
    "./src/objt/escena/baselogo.glb",
    (gltf) => {
      const modelbaselogo = gltf.scene;
      modelbaselogo.position.set(0, -1.14, -5);
      modelbaselogo.scale.set(0.3, 0.36, 0.3);
      modelbaselogo.rotation.set(0, 0, 0);
      const modelbaselogoMaterial = new THREE.MeshStandardMaterial({

        color: 0xfff6e8, // Color base del material
        aoMap: null, // Mapa de oclusión ambiental
        emissive: 0xff9f73, // Color de emisión (luz propia)
        emissiveIntensity: 0.5, // Intensidad de la emisión
        emissiveMap: null, // Textura de emisión
        metalness: 0, // Cantidad de metal en el material (0 = no metálico, 1 = completamente metálico)
        metalnessMap: null, // Mapa de metalicidad
        roughness: 1, // Rugosidad de la superficie (0 = completamente suave, 1 = completamente rugoso)
        roughnessMap: null, // Mapa de rugosidad
        bumpMap: null, // Mapa de relieve (bump)
        normalMap: null, // Mapa normal (para efectos de iluminación)
        displacementMap: null, // Mapa de desplazamiento
        displacementScale: 0.2, // Escala del desplazamiento
        displacementBias: 0, // Desplazamiento de la altura
        alphaMap: null, // Mapa de transparencia
        transparent: false, // Si es transparente (se usa con alphaMap o opacity)
        opacity: 1, // Opacidad del material (0 = completamente transparente)
        side: THREE.FrontSide, // Qué caras del material se deben renderizar (FrontSide, BackSide, DoubleSide)
        flatShading: false, // Si se aplica sombreado plano en las caras
        wireframe: false, // Si se muestra como líneas (wireframe)
        wireframeLinewidth: 1, // Grosor de las líneas en el modo wireframe
        wireframeLinecap: "round", // Estilo de las líneas en wireframe (round, square, butt)
        wireframeLinejoin: "round", // Estilo de las esquinas de las líneas en wireframe (round, bevel, miter)
        shadowSide: true, // Qué caras se deben utilizar para las sombras (null, FrontSide, BackSide)
        envMap: null, // Mapa del entorno para reflejos
        envMapIntensity: 1, // Intensidad de los reflejos del mapa del entorno
        alphaTest: 0, // Umbral para la transparencia (si el valor alfa de la textura es menor que este valor, el píxel es descartado)
      });

      modelbaselogo.traverse((child) => {
        if (child.isMesh) {
          child.material = modelbaselogoMaterial;
        }
      });

      scene.add(modelbaselogo);
    },
    undefined,
    (error) =>
    console.error("Error al cargar el modelo de modelbaselogo ", error)
  );


  ///////// Crear luz direccional  ////////////////
  const luzdospasillo = new THREE.DirectionalLight(0xffffff, 0.8);
  luzdospasillo.position.set(30, 30, -10); // Posición de la luz
  luzdospasillo.castShadow = true; // Activar sombras

  // Ajustar la cámara de sombras (proyección ortográfica)
  luzdospasillo.shadow.camera.top = 100; // Límite superior
  luzdospasillo.shadow.camera.bottom = -100; // Límite inferior
  luzdospasillo.shadow.camera.left = -50; // Límite izquierdo
  luzdospasillo.shadow.camera.right = 50; // Límite derecho
  luzdospasillo.shadow.camera.near = 0.5; // Distancia mínima
  luzdospasillo.shadow.camera.far = 200; // Distancia máxima
  luzdospasillo.shadow.mapSize.width = 3000; // Ancho del mapa de sombras
  luzdospasillo.shadow.mapSize.height = 3000; // Alto del mapa de sombras
  luzdospasillo.shadow.bias = -0.001; // Previene artefactos de sombra
  luzdospasillo.shadow.opacity = 0.1; // Un valor entre 0 (transparente) y 1 (opaco)

  // Cambiar el objetivo de la luz
  const targetdos = new THREE.Object3D();
  targetdos.position.set(0, 0, 50); // Nuevo punto al que apunta la luz
  scene.add(targetdos); // Agregar el objetivo a la escena
  luzdospasillo.target = targetdos; // Asignar el objetivo a la luz


  // // Helper para la cámara de sombras
  // const shadowCameraHelper = new THREE.CameraHelper(luzdospasillo.shadow.camera);
  // scene.add(shadowCameraHelper);

  // // Helper para la luz direccional
  // const directionalLightHelper = new THREE.DirectionalLightHelper(luzdospasillo, 10); // El tamaño del helper (10) es ajustable
  // scene.add(directionalLightHelper);

  scene.add(luzdospasillo);
  // Cargar pascilloModel
  const pascilloLoader = new GLTFLoader();
  pascilloLoader.load(
    "./src/objt/escena/pasilloescenauno.glb",
    (gltf) => {
      const pascilloModel = gltf.scene;
      pascilloModel.scale.set(0.05, 0.05, 0.05);
      pascilloModel.position.set(0, 0.5, 35);



      pascilloModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(pascilloModel);
    },
    undefined,
    (error) => console.error("Error al cargar el modelo de pascilloModel:", error)
  );


  // Cargar modelo Planta
  const loadercolumn = new GLTFLoader();
  loadercolumn.load(
    "./src/objt/escena/columna.glb",
    (gltf) => {
      const modeloBase = gltf.scene;

      function crearPalmera(posX, posY, posZ, escalaX, escalaY, escalaZ) {
        const cloncolumn = modeloBase.clone();
        cloncolumn.position.set(posX, posY, posZ);
        cloncolumn.scale.set(escalaX, escalaY, escalaZ);

        cloncolumn.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(cloncolumn);
      }


      //derecha

      crearPalmera(2.7, 0.7, 35, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 37, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 39, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 41, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 43, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 45, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 47, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 49, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 51, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 53, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 55, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 57, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 59, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 61, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 63, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 65, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 67, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 69, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 71, 0.05, 0.05, 0.05);
      crearPalmera(2.7, 0.8, 73, 0.05, 0.05, 0.05);


      //izquierda

      crearPalmera(-2.7, 0.7, 35, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 37, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 39, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 41, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 43, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 45, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 47, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 49, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 51, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 53, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 55, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 57, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 59, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 61, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 63, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 65, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 67, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 69, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 71, 0.05, 0.05, 0.05);
      crearPalmera(-2.7, 0.8, 73, 0.05, 0.05, 0.05);



    },
    undefined,
    (error) => console.error("Error al cargar el modelo de columna:", error)
  );


  // Cargar múltiples texturas
const loaderbanderas = new THREE.TextureLoader();
const textures = [
  loaderbanderas.load('./src/img/proyectounod.png'),
  loaderbanderas.load('./src/img/proyectouno.jpg'),
];

// Geometría del plano
let geometrybanderas = new THREE.PlaneGeometry(2, 1, 50, 50);

// Función para crear materiales únicos con diferentes texturas y opacidad
function createMaterial(texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: texture },
      uOpacity: { value: 0 } // Inicialmente invisible
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Ondulación tipo bandera
        float wave = sin(pos.y * 3.0 + uTime * 1.0) * 0.1;
        pos.x += wave;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(uTexture, vUv);
        if (color.a < 0.1) discard; // Manejo de transparencia
        gl_FragColor = vec4(color.rgb, color.a * uOpacity);
      }
    `,
    transparent: true
  });
}

// Crear planos con materiales
const planes = textures.map(texture => new THREE.Mesh(geometrybanderas, createMaterial(texture)));
planes.forEach(plane => scene.add(plane));

// Función para actualizar el tamaño de los planos dinámicamente
function updatePlanesSize() {
  const aspectRatio = window.innerWidth / window.innerHeight;
  const width = 1; // Ancho base
  const height = 1; // Alto base

  planes.forEach(plane => {
    plane.scale.set(width, height, 1);
  });

  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Ejecutar en el inicio y en el evento de redimensionamiento
window.addEventListener('resize', updatePlanesSize);
updatePlanesSize();

// Función para actualizar la visibilidad y posición de los planos
function updatePlanes() {
  const cameraZ = camera.position.z;
  const cameraX = camera.position.x;
  const cameraY = camera.position.y;

  const visibilityRanges = [
    { plane: planes[0], minZ: 35, maxZ: 50 },
    { plane: planes[1], minZ: 50, maxZ: 68 },
  ];

  visibilityRanges.forEach(({ plane, minZ, maxZ }) => {
    // Suavizar posición
    plane.position.z += (cameraZ - 2 - plane.position.z) * 0.1;
    plane.position.x += (cameraX - plane.position.x) * 0.1;
    plane.position.y += (cameraY - plane.position.y) * 0.1;

    // Mantener los planos mirando a la cámara
    plane.lookAt(new THREE.Vector3(cameraX, cameraY, cameraZ));

    // Suavizar visibilidad usando el uniforme de opacidad
    const targetOpacity = (cameraZ >= minZ && cameraZ <= maxZ) ? 1 : 0;
    plane.material.uniforms.uOpacity.value += (targetOpacity - plane.material.uniforms.uOpacity.value) * 0.1;
  });
}









  // Cargar el modelo de las dunas
  const textureLoaderDunas = new THREE.TextureLoader();
  const ambientOcclusion = textureLoaderDunas.load(
    "./src/objt/tierra/arenaambientcclusion.jpg"
  );
  const roughnessMap = textureLoaderDunas.load(
    "./src/objt/tierra/arenaroughness.jpg"
  );
  const displacementMap = textureLoaderDunas.load(
    "./src/objt/tierra/arenaheight.png"
  );

  const dunasLoader = new GLTFLoader();
  dunasLoader.load(
    "./src/objt/escena/base.glb",
    (gltf) => {
      const modelDunas = gltf.scene;
      modelDunas.position.set(0, -1, 0);
      modelDunas.scale.set(0.5, 0.5, 0.5);
      modelDunas.rotation.set(0, 0, 0);
      modelDunas.receiveShadow = true;

      const sandMaterial = new THREE.MeshStandardMaterial({
        color: 0xf6b756, // Color base del material
        aoMap: ambientOcclusion, // Mapa de oclusión ambiental
        emissive: 0xcc5219, // Color de emisión (luz propia)
        emissiveIntensity: 1, // Intensidad de la emisión
        emissiveMap: null, // Textura de emisión
        metalness: 0, // Cantidad de metal en el material (0 = no metálico, 1 = completamente metálico)
        metalnessMap: null, // Mapa de metalicidad
        roughness: 1, // Rugosidad de la superficie (0 = completamente suave, 1 = completamente rugoso)
        roughnessMap: roughnessMap, // Mapa de rugosidad
        bumpMap: null, // Mapa de relieve (bump)
        normalMap: null, // Mapa normal (para efectos de iluminación)
        displacementMap: displacementMap, // Mapa de desplazamiento
        displacementScale: 0, // Escala del desplazamiento
        displacementBias: 0, // Desplazamiento de la altura
        alphaMap: null, // Mapa de transparencia
        transparent: false, // Si es transparente (se usa con alphaMap o opacity)
        opacity: 1, // Opacidad del material (0 = completamente transparente)
        side: THREE.FrontSide, // Qué caras del material se deben renderizar (FrontSide, BackSide, DoubleSide)
        flatShading: false, // Si se aplica sombreado plano en las caras
        wireframe: false, // Si se muestra como líneas (wireframe)
        wireframeLinewidth: 1, // Grosor de las líneas en el modo wireframe
        wireframeLinecap: "round", // Estilo de las líneas en wireframe (round, square, butt)
        wireframeLinejoin: "round", // Estilo de las esquinas de las líneas en wireframe (round, bevel, miter)
        shadowSide: true, // Qué caras se deben utilizar para las sombras (null, FrontSide, BackSide)
        envMap: null, // Mapa del entorno para reflejos
        envMapIntensity: 0, // Intensidad de los reflejos del mapa del entorno
        alphaTest: 0, // Umbral para la transparencia (si el valor alfa de la textura es menor que este valor, el píxel es descartado)
      });

      modelDunas.traverse((child) => {
        if (child.isMesh) {
          child.material = sandMaterial;
        }
      });

      scene.add(modelDunas);
    },
    undefined,
    (error) => console.error("Error al cargar el modelo de dunas:", error)
  );

  // Sol 1
  const sun1Geometry = new THREE.SphereGeometry(3, 32, 32);
  const sun1Material = new THREE.MeshStandardMaterial({
    emissive: 0xffffff, // Color brillante del primer sol
    emissiveIntensity: 1.8,
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.7,
  });
  const sun1 = new THREE.Mesh(sun1Geometry, sun1Material);
  sun1.position.set(-25, 30, -100);
  scene.add(sun1);

  // Sol 2
  const sun2Geometry = new THREE.SphereGeometry(25, 35, 35);
  const sun2Material = new THREE.MeshStandardMaterial({
    emissive: 0xff0000, // Color brillante del segundo sol
    emissiveIntensity: 1.8,
    color: 0xff0000,
  });
  const sun2 = new THREE.Mesh(sun2Geometry, sun2Material);
  sun2.position.set(3, 19, -150);
  scene.add(sun2);


  let animationStarted = false; // Definir la variable

  let isPaused = false; // Controla si la animación está pausada

  // Controlar las animaciones según la posición de la cámara
  function updateAnimations() {
    if (camera.position.z >= 0 && cameraDos.position.z <= 1011 && !isPaused) {
      isPaused = true;
      playToFrame125();
    } else if (cameraDos.position.z > 1012 && isPaused) {
      isPaused = false;
      resumeAnimationsFrom125();
    }
  }



  renderer.outputColorSpace = THREE.SRGBColorSpace;
  texture.encoding = THREE.sRGBEncoding; // Para texturas
  material.map.encoding = THREE.sRGBEncoding; // Si usas texturas en materiales

  const botonInicio = document.getElementById("botoninicio");

  botonInicio.addEventListener("click", () => {
    updateAnimations()

    setTimeout(() => { // Agregar el delay de 1 segundo
      const currentFrame = animationprogres.currentFrame; // Obtener el frame actual
      if (currentFrame < 60) {
        animationprogres.playSegments([currentFrame, 61], true);

      }

      if (!model) {
        console.error("El modelo aún no se ha cargado.");
        return;
      }
    }, 1000);

    animateWaves = true;

    // Animación inicial
    const inicioescena = gsap.timeline();

    inicioescena.to(camera.rotation, {
      duration: 2,
      x: 0,
      y: 0,
      z: 0,
      ease: "none",
    });

    inicioescena.to(camera.position, {
      delay: -2,
      duration: 2,
      x: 0,
      y: 1.5,
      z: -1,
      ease: "expo.out",
    });

    inicioescena.to(model.position, {
      delay: -1,
      x: 0,
      y: 1,
      z: -5,
      duration: 2,
      ease: "power3.easeInOut",
    });

    inicioescena.to(model.rotation, {
      delay: -2,
      x: 0,
      y: 0,
      z: 0,
      ease: "power3.easeInOut",
    });

    inicioescena.to(backgroundRect.position, {
      delay: 0,
      x: 0,
      y: 60,
      z: -190,
      ease: "none",
    });

    inicioescena.to(camera.position, {
      delay: -2,
      duration: 2,
      x: 0,
      y: 1,
      z: -1,
      ease: "expo.out",
    });

    // Ejecutar lógica después de la animación inicial
    inicioescena.then(() => {
      console.log("Animación inicial completada.");

      animationStarted = true; // Permitir que ScrollTrigger controle Lottie

      const contenedor = document.getElementById("contenedor");


      const endFrame = 300; // Suponiendo que la animación tiene 500 frames totales
      // Configurar ScrollTrigger para la animación de Lottie
      ScrollTrigger.create({
        trigger: contenedor,
        start: "top top",
        end: "+=30000",
        scrub: 2, // Elimina easing implícito para evitar desaceleración al inicio y final
        ease: "none", // Elimina easing implícito para evitar desaceleración al inicio y final
        onUpdate: function (self) {
          const progress = self.progress; // Progreso del scroll (0 a 1)
          const frame = Math.round(61 + progress * (endFrame - 61));
          animationprogres.goToAndStop(frame, true);
        },
      });
      // Configurar ScrollTrigger después de la animación inicial
      gsap.timeline({
          scrollTrigger: {
            trigger: contenedor, // Elemento que activa la animación
            start: "top top", // Punto inicial del scroll
            end: "+=30000", // Punto final (3000px adicionales para el scroll)
            scrub: 2,
            ease: "none", // Elimina easing implícito para evitar desaceleración al inicio y final
            pin: true, // Fija el contenedor durante la animación
            // Opcional: agrega marcadores si estás depurando
            // markers: { startColor: "red", endColor: "green", fontSize: "10px", fontWeight: "bold" }
            onUpdate: function () {
              // Cada vez que el scroll se actualiza, revisamos la posición de la cámara

            },
          },
        })


        .to(camera.position, {
          duration: 10,
          y: 2,
          z: 70,
        })


        .to([
          textMeshes["text1"].material,
          textMeshes["text2"].material,
        ], {
          delay: -10,
          duration: 3,
          opacity: 0,
        })


        .to(cameraDos.position, {
          duration: 10,

          y: 3,
          z: 1100,
        })
        .to(cameraTres.position, {
          duration: 5,
          x: -5,
          y: 5,
          z: 0,

        })
        .to(cameraTres.rotation, {
          delay: -5,
          duration: 5,
          x: 0,
          y: -1,
          z: 0,

        })
        .to(cameraTres.position, {
          duration: 5,
          x: 0,
          y: 3,
          z: 30,

        })
        .to(cameraTres.rotation, {
          delay: -5,
          duration: 5,
          x: 0,
          y: 0,
          z: 0,
        });
    });
  });
  let animateWaves = false;


  const clock = new THREE.Clock();

  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  container.appendChild(stats.dom);

  function animate() {



    stats.begin();

    // monitored code goes here

    stats.end();
    requestAnimationFrame(animate);



    const delta = clock.getDelta(); // Tiempo entre frames

    // Actualizar las animaciones si el mixer está definido
    if (mixerpuerta) {
      mixerpuerta.update(delta);
    }

    if (mixernubes) {
      mixernubes.update(delta);
    }

    camera.position.x += (mouse.x - camera.position.x) * 0.09;
    camera.position.x = Math.max(
      minCameraX,
      Math.min(camera.position.x, maxCameraX)
    );



    animateFunctions.forEach((fn) => fn());




    // Lógica para cambiar entre escenas según la posición de la cámara principal
    if (camera.position.z >= 70) {
      // Dividir el ancho de la cámara
      camera.aspect = (container.clientWidth / 2.5) / container.clientHeight / 2;
      camera.updateProjectionMatrix(); // Asegúrate de actualizar la matriz de proyección
      // Renderiza la escena primaria al render target
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null); // Restablece el render target
      // Actualizar la relación de aspecto de la cámara
      // Renderiza la escena secundaria en pantalla
      renderer.render(sceneDos, cameraDos);

      // Actualizar el tiempo en cada material
      planesD.forEach(planeD => {
        if (planeD.material.uniforms.uTime) {
          planeD.material.uniforms.uTime.value += 0.02;
        }
      });

      updatePlanesDos();


      // Ocultar objetos de la escena principal para liberar GPU
      scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
        }
      });

      // Ocultar objetos de la escena principal para liberar GPU
      sceneTres.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
        }
      });

      // Nueva condición dentro del primer if
      if (cameraDos.position.z >= 1100) {
        if (water) {
          if (water.material.uniforms['time']) {
            water.material.uniforms['time'].value += 0.02; // Ajusta la velocidad de la animación
          }
        }
        // Dividir el ancho de la cámara
        // Renderiza la escena primaria al render target
        renderer.setRenderTarget(renderTargetTres);
        renderer.render(sceneDos, cameraDos);
        renderer.setRenderTarget(null); // Restablece el render target
        // Actualizar la relación de aspecto de la cámara
        // Renderiza la escena secundaria en pantalla
        renderer.render(sceneTres, cameraTres);

        // Ocultar objetos de la escena principal para liberar GPU
        scene.traverse((child) => {
          if (child.isMesh) {
            child.visible = false;
          }
        });

        // Agrega aquí lo que debe pasar si la nueva condición es verdadera
      }
    } else {

      // Ocultar objetos de la escena principal para liberar GPU
      sceneTres.traverse((child) => {
        if (child.isMesh) {
          child.visible = false;
        }
      });

      // Restablece la relación de aspecto de la cámara original
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix(); // Asegúrate de actualizar la matriz de proyección
      // Renderiza la escena primaria si la posición Z de la cámara principal es menor o igual a 20

      renderer.render(scene, camera); // Renderiza la escena primaria
      // Capturar fondo en el render target

      if (wateru) {
        if (wateru.material.uniforms['time']) {
          wateru.material.uniforms['time'].value += 0.005; // Ajusta la velocidad de la animación
        }
      }


      if (textMeshes["text1"]) {
        textMeshes["text1"].position.lerp(
          new THREE.Vector3(
            textMeshes["text1"].position.x,
            textMeshes["text1"].position.y,
            camera.position.z - 11
          ),
          0.1 // Ajusta este valor para suavizar el movimiento
        );

      }

      if (textMeshes["text2"]) {
        textMeshes["text2"].position.lerp(
          new THREE.Vector3(
            textMeshes["text2"].position.x,
            textMeshes["text2"].position.y,
            camera.position.z - 11
          ),
          0.1
        );

      }

      if (camera.position.z >= 35) { // Actualizar el tiempo en cada material
        planes.forEach(plane => {
          if (plane.material.uniforms.uTime) {
            plane.material.uniforms.uTime.value += 0.02;
          }
        });

        // Actualizar planos
        updatePlanes();
      }




    }
    updateAnimations()

  }
  animate();
  window.addEventListener('resize', () => {
    // Actualizar el tamaño del render target con el factor de escala
    renderTarget.setSize(
      container.clientWidth, // Aumenta el ancho
      container.clientHeight // Mantén la altura original
    );

    // Actualizar las dimensiones del canvas
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Actualizar la relación de aspecto de la cámara
    cameraTres.aspect = width / height;
    cameraTres.updateProjectionMatrix();

    // Actualizar la relación de aspecto de la cámara
    cameraDos.aspect = width / height;
    cameraDos.updateProjectionMatrix();


    // Actualizar la relación de aspecto de la cámara
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Ajustar el tamaño del renderizador
    renderer.setSize(width, height);
  });
  
  



}
main();