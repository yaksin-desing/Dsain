import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";

import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import {
  RGBELoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";

import {
  EffectComposer
} from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';
import {
  RenderPass
} from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js';
import {
  UnrealBloomPass
} from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js';


import gsap from "https://cdn.skypack.dev/gsap@3.11.0";



gsap.registerPlugin(ScrollTrigger);

function main() {
  const container = document.getElementById("scene-container");
  const scene = new THREE.Scene();

  scene.background = new THREE.Color(0x0000ff); // Fondo azul cielo

  // Inicializa el renderer antes de utilizarlo
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.shadowMap.enabled = true;


  //Puedes probar con otros tipos como THREE.PCFSoftShadowMap - THREE.PCFShadowMap o THREE.VSMShadowMap

  renderer.shadowMap.type = THREE.VSMShadowMap;

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);


  // Carga la animación Lottie
  const animationprogres = lottie.loadAnimation({
    container: document.getElementById("lottie-container"), // Contenedor para la animación
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "./src/img/progreso.json", // Ruta de tu archivo Lottie
  });

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.rotation.set(1, 0, 0);
  camera.position.set(0, 10.8, -4.9); // Ajusta los valores según tu escena
  //camera.lookAt(0, 0, 0); // Asegúrate de que apunte al origen o a donde necesites

  const mouse = new THREE.Vector2();
  const minCameraX = -1;
  const maxCameraX = 500;

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



  // Cargar texturas
  const textureLoadertrabajos = new THREE.TextureLoader();

  // Shader material para la animación tipo ondas
  const createWaveMaterial = (texture) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: {
          value: texture,
        },
        uTime: {
          value: 0,
        },
      },
      vertexShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec3 pos = position;
                pos.y += sin(pos.x * 2.0 + uTime) * 0.1;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
      fragmentShader: `
            uniform sampler2D uTexture;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(uTexture, vUv);
            }
        `,
    });
  };

  // Crear un plano reutilizable
  const createPlane = (texturePath, position) => {
    const texture = textureLoadertrabajos.load(texturePath, (texture) => {
      // Ajustar el tamaño del plano al tamaño de la textura
      const aspect = texture.image.width / texture.image.height;
      planes.scale.set(aspect, 1, 1);
    });
    const material = createWaveMaterial(texture);
    const geometry = new THREE.PlaneGeometry(1, 1, 64, 64); // El tamaño base será 1x1 para escalar dinámicamente
    const planes = new THREE.Mesh(geometry, material);
    planes.position.set(position.x, position.y, position.z);
    planes.rotation.y = 0; // Orientación vertical
    planes.castShadow = true;
    scene.add(planes);

    return planes;
  };

  // Crear dos planos con imágenes específicas
  const planeSpacing = window.innerWidth / 255; // Espaciado basado en el ancho de pantalla
  const planes = [
    //grupo uno
    createPlane("./src/img/proyectounod.png", {
      x: -planeSpacing / 3,
      y: -5,
      z: 0.1,
    }),
    createPlane("./src/img/proyectouno.jpg", {
      x: planeSpacing / 3,
      y: -5,
      z: 0.1,
    }),

    //----------------------------------//

    //grupo dos
    createPlane("./src/img/proyectounod.png", {
      x: -planeSpacing / 3,
      y: -5,
      z: 2.5,
    }),
    createPlane("./src/img/proyectouno.jpg", {
      x: planeSpacing / 3,
      y: -5,
      z: 2.5,
    }),

    //----------------------------------//

    //grupo tres
    createPlane("./src/img/proyectounod.png", {
      x: -planeSpacing / 3,
      y: -5,
      z: 11.5,
    }),
    createPlane("./src/img/proyectouno.jpg", {
      x: planeSpacing / 3,
      y: -5,
      z: 11.5,
    }),

    //----------------------------------//
  ];


  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-15, 16, -50);
  directionalLight.castShadow = true;
  //>>>>>>>>>>>>scene.add(directionalLight);<<<<<<<<<<<<<<<<<<


  const segundaLight = new THREE.DirectionalLight(0xff9419, 1);
  segundaLight.position.set(0, 5, -40);
  segundaLight.target.position.set(0, 0, 0); // Dirige la luz hacia el origen


  // Agregar la luz a la escena
  //>>>>>>>>>>>>>>>scene.add(segundaLight);<<<<<<<<<<<<<<<<<<<








  // Cargar texturas
  const textureLoader = new THREE.TextureLoader();
  const anormalMap = textureLoader.load("./src/objt/agua/norm.jpg");
  const adisplacementMap = textureLoader.load("./src/objt/agua/disp.png");

  anormalMap.wrapS = anormalMap.wrapT = THREE.RepeatWrapping;
  anormalMap.repeat.set(50, 50);

  adisplacementMap.wrapS = adisplacementMap.wrapT = THREE.RepeatWrapping;
  adisplacementMap.repeat.set(50, 50);

  // Crear geometría
  const planeGeometry = new THREE.PlaneGeometry(50, 50, 100);
  planeGeometry.attributes.uv2 = planeGeometry.attributes.uv;

  // Configurar CubeCamera
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 180, cubeRenderTarget);
  scene.add(cubeCamera);

  // Crear material con reflejos
  const planeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0026ff,
    emissive: 0x0026ff,
    emissiveIntensity: 1,
    roughness: 0.5,
    metalness: 1,
    transmission: 0,
    thickness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    normalMap: anormalMap,
    displacementMap: adisplacementMap,
    displacementScale: 0.6,
    transparent: true,
    opacity: 0.7,
    envMap: cubeRenderTarget.texture, // Usar textura generada por CubeCamera
  });

  // Crear malla
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, 0, 9);
  //>>>>>>>>>>>>>>>>>scene.add(plane);<<<<<<<<<<<<<<<<<<<<<<<<

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
            child.material.envMapIntensity = 2;
            child.material.metalness = 1;
            child.material.roughness = 0;
            child.material.clearcoat = 0;
            child.material.clearcoatRoughness = 0;
            child.material.emissive = new THREE.Color(0x9966cc);
            child.material.emissiveIntensity = 0.6;
            child.material.ior = 1;
            child.material.transmission = 0.5;
            child.material.thickness = 1;
            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
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

      // Habilitar sombras en el modelo
      modelbaselogo.castShadow = true; // El cubo emitirá sombras
      modelbaselogo.receiveShadow = true; // El cubo recibirá sombras si hay otras fuentes de luz

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
        reflectivity: 0.5, // Reflexión del material
        envMap: null, // Mapa del entorno para reflejos
        envMapIntensity: 1, // Intensidad de los reflejos del mapa del entorno
        alphaTest: 0, // Umbral para la transparencia (si el valor alfa de la textura es menor que este valor, el píxel es descartado)
        combine: THREE.MultiplyOperation, // Método de combinación para la textura (MultiplyOperation, MixOperation, AddOperation, ReplaceOperation)
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
  luzdospasillo.position.set(0, 80, 970); // Posición de la luz
  luzdospasillo.castShadow = true; // Activar sombras

  // Ajustar la cámara de sombras (proyección ortográfica)
  luzdospasillo.shadow.camera.top = 50; // Límite superior
  luzdospasillo.shadow.camera.bottom = -50; // Límite inferior
  luzdospasillo.shadow.camera.left = -50; // Límite izquierdo
  luzdospasillo.shadow.camera.right = 50; // Límite derecho
  luzdospasillo.shadow.camera.near = 0.5; // Distancia mínima
  luzdospasillo.shadow.camera.far = 100; // Distancia máxima
  luzdospasillo.shadow.mapSize.width = 2048; // Ancho del mapa de sombras
  luzdospasillo.shadow.mapSize.height = 2048; // Alto del mapa de sombras
  luzdospasillo.shadow.bias = -0.0001; // Previene artefactos de sombra

  // Cambiar el objetivo de la luz
  const targetdos = new THREE.Object3D();
  targetdos.position.set(0, 0, 1000); // Nuevo punto al que apunta la luz
  scene.add(targetdos); // Agregar el objetivo a la escena
  luzdospasillo.target = targetdos; // Asignar el objetivo a la luz

  // Opcional: Ayuda visual para la cámara de sombras
  const shadowHelperdos = new THREE.CameraHelper(luzdospasillo.shadow.camera);
  //scene.add(shadowHelperdos);

  const luzpasillohelperdos = new THREE.DirectionalLightHelper(
    luzdospasillo,
    5
  );
  //scene.add(luzpasillohelperdos);

  //>>>>>>>>>>>scene.add(luzdospasillo);<<<<<<<<<<<<<<<<<<

  const ambientLightdos = new THREE.DirectionalLight(0xffffff, 0.2); // Luz ambiental
  ambientLightdos.position.set(0, -1, 800); // Posición de la luz

  scene.add(ambientLightdos);

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
        reflectivity: 0, // Reflexión del material
        envMap: null, // Mapa del entorno para reflejos
        envMapIntensity: 0, // Intensidad de los reflejos del mapa del entorno
        alphaTest: 0, // Umbral para la transparencia (si el valor alfa de la textura es menor que este valor, el píxel es descartado)
        combine: THREE.MultiplyOperation, // Método de combinación para la textura (MultiplyOperation, MixOperation, AddOperation, ReplaceOperation)
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
  sun1.position.set(-25, 25, -100);
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

  //////// <<<<< base dos >>>>>> /////////////


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

  scene.add(planedos);

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
      scene.add(modeldavid);
    },
    undefined,
    (error) => console.error("Error al cargar el modelo de pasillo: ", error)
  );

  // Lista para almacenar los mixers
  const mixers = [];


  // Cargar el modelo nube.glb
  const nube = new GLTFLoader();
  nube.load(
    './src/objt/escena/escenados/nubes.glb', // Ruta al archivo .glb
    (gltf) => {
      const modelnube = gltf.scene;

      // Recorrer todos los objetos del modelo y asignar un material de nube
      modelnube.traverse((child) => {
        if (child.isMesh) {
          // Crear un material para las nubes
          child.material = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF, // Blanco
            emissive: 0xc4e5f5,
            emissiveIntensity: 0.7,
            envMap: null, // Deshabilitar HDRI solo para este material
          });
        }
      });

      // Ajustar posición y escala
      modelnube.position.set(0, 15, 950);
      modelnube.scale.set(2, 1, 1);
      modelnube.rotation.set(-0.2, 0, 0);

      // Agregar el modelo a la escena
      scene.add(modelnube);
    },
  );

  // Define la lista de objetos que deseas optimizar
  const objects = [
    planedos,
    plane,
    luzdospasillo,
    segundaLight,
    directionalLight,
    cubeCamera,
    sun1,
    sun2,
  ];

  // Distancia máxima a la que un objeto es visible
  const maxDistance = 250;

  function updateVisibility(camera) {
    objects.forEach((object) => {
      const distance = camera.position.distanceTo(object.position);
      if (distance <= maxDistance) {
        if (!scene.children.includes(object)) {
          scene.add(object); // Añade el objeto si no está en la escena
        }
      } else {
        if (scene.children.includes(object)) {
          scene.remove(object); // Elimina el objeto si está en la escena
        }
      }
    });
  }


  let mixerpuerta = null; // Guardar el mixer de la puerta
  let puertaAnim, perillaAnim, seguroAnim; // Declarar las animaciones globalmente

  const frameTarget = 125; // Frame donde queremos detener
  const totalFrames = 250; // Total de frames de la animación
  let isPaused = false; // Controla si la animación está pausada

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
      scene.add(modelpuerta);

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
      }

      if (perillaAnim) {
        const action = mixerpuerta.clipAction(perillaAnim);
        action.play();
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
      }

      if (seguroAnim) {
        const action = mixerpuerta.clipAction(seguroAnim);
        action.play();
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
      }
    },
    undefined,
    (error) => {
      console.error('Error al cargar el modelo:', error);
    }
  );

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

  // Controlar las animaciones según la posición de la cámara
  function updateAnimations() {
    if (camera.position.z >= 0 && camera.position.z <= 1009 && !isPaused) {
      isPaused = true;
      playToFrame125();
    } else if (camera.position.z > 1010 && isPaused) {
      isPaused = false;
      resumeAnimationsFrom125();
    }
  }

// Material personalizado para el portal
const portalMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xFDE5B7) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      float glow = sin(vUv.y * 200.0 + time) * 0.1 + 1.0; // Animación de brillo
      vec3 neon = color * glow; // Color neón
      gl_FragColor = vec4(neon, 0.6); // Transparencia incluida
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

  // Crear un cuadrado geométrico y aplicarle el material
  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 4.6, 3, 1, 1, 1), // Geometría cuadrada con grosor mínimo
    portalMaterial
  );

  portal.position.set(0, 2, 994); // Ajusta la posición del portal
  scene.add(portal);

  // Configurar el compositor de efectos
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Agregar el efecto de brillo (UnrealBloomPass)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, // Intensidad
    0.4, // Radio
    0.85 // Umbral
  );
  composer.addPass(bloomPass);




  window.addEventListener("resize", () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  let animationStarted = false; // Definir la variable

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 0.5 - 0.25;
  }

  window.addEventListener("mousemove", onMouseMove);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  texture.encoding = THREE.sRGBEncoding; // Para texturas
  material.map.encoding = THREE.sRGBEncoding; // Si usas texturas en materiales

  const botonInicio = document.getElementById("botoninicio");

  botonInicio.addEventListener("click", () => {
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
      y: 1,
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
      z: 0,
      ease: "expo.out",
    });

    // Ejecutar lógica después de la animación inicial
    inicioescena.then(() => {
      console.log("Animación inicial completada.");

      animationStarted = true; // Permitir que ScrollTrigger controle Lottie

      const contenedor = document.getElementById("contenedor");
      const titulorango = document.getElementById("tituloescena"); // Suponiendo que tienes un título con el ID 'titulo


      const endFrame = 300; // Suponiendo que la animación tiene 500 frames totales
      // Configurar ScrollTrigger para la animación de Lottie
      ScrollTrigger.create({
        trigger: contenedor,
        start: "top top",
        end: "+=20000",
        scrub: true,
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
            end: "+=20000", // Punto final (3000px adicionales para el scroll)
            scrub: true, // Sincroniza con el scroll
            pin: true, // Fija el contenedor durante la animación
            // Opcional: agrega marcadores si estás depurando
            // markers: { startColor: "red", endColor: "green", fontSize: "10px", fontWeight: "bold" }
            onUpdate: function () {
              // Cada vez que el scroll se actualiza, revisamos la posición de la cámara
              actualizarTitulo();

            },
          },
        })
        .to(camera.position, {
          duration: 5,
          x: 0,
          y: 1,
          z: 5,
          ease: "none",
        })


        .to(camera.position, {
          duration: 5,
          x: 0,
          y: 1,
          z: 20,
          ease: "power1.inOut",
        })

        .to(backgroundRect.position, {
          duration: 0,
          x: 0,
          y: 10,
          z: 900,
          ease: "power1.inOut",
        })



        .to(camera.position, {
          duration: 0,
          x: 0,
          y: 2,
          z: 995,
          ease: "power1.inOut",
        })

        .to(camera.position, {
          duration: 10,
          x: 0,
          y: 3,
          z: 1100,
          ease: "power1.inOut",
        });

      let timelineUno = gsap.timeline({
        paused: true,
      });

      timelineUno.to(planes[0].position, {
        delay: 0,
        duration: 2,
        y: 1,
        ease: "expo.out",
      });
      timelineUno.to(planes[1].position, {
        delay: -2,
        duration: 2,
        y: 1,
        ease: "expo.out",
      });

      let timelineDos = gsap.timeline({
        paused: true,
      });


      timelineDos.to(planes[2].position, {
        delay: -2,
        duration: 2,
        y: 1,
        ease: "expo.out",
      });
      timelineDos.to(planes[3].position, {
        delay: -2,
        duration: 2,
        y: 1,
        ease: "expo.out",
      });

      let timelineTres = gsap.timeline({
        paused: true,
      });

      timelineTres.to(planes[4].position, {
        delay: -2,
        duration: 2,
        y: 1,
        ease: "expo.out",
      });
      timelineTres.to(planes[5].position, {
        delay: -2,
        duration: 2,
        y: 1,
        ease: "expo.out",
      });

      // Función para actualizar el título según la posición de la cámara
      let estadoActual = null;

      function actualizarTitulo() {
        const z = camera.position.z;
        if (z >= 0 && z < 2) {
          cambiarEstado("Scrollea para ver más", timelineUno, "rango1", []);
        } else if (z >= 2 && z < 4) {
          cambiarEstado(z.toFixed(2), timelineUno, "rango2", [timelineDos]);
        } else if (z >= 4 && z < 13) {
          cambiarEstado(z.toFixed(2), timelineDos, "rango3", [timelineUno, timelineTres]);
        } else if (z >= 13 && z <= 20) {
          cambiarEstado(z.toFixed(2), timelineTres, "rango4", [timelineDos]);
        }

      }


      function cambiarEstado(texto, timeline, estado, revertTimelines) {
        titulorango.textContent = texto;
        if (estadoActual !== estado) {
          timeline.play();
          revertTimelines.forEach((t) => t.reverse());
          estadoActual = estado;
        }
      }
    });
  });

  let animateWaves = false;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Tiempo entre frames

    // Actualizar las animaciones si el mixer está definido
    if (mixerpuerta) {
      mixerpuerta.update(delta);
    }

    if (camera.position.z >= -10 && camera.position.z < 20) {

      if (animateWaves) {
        const time = clock.getElapsedTime();
        const positionAttribute = plane.geometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
          const x = positionAttribute.getX(i);
          const y = positionAttribute.getY(i);
          const z =
            Math.sin(x * 0.5 + time) * 0.02 + Math.cos(y * 0.5 + time) * 0.02;
          positionAttribute.setZ(i, z);
        }
        positionAttribute.needsUpdate = true;
      }


      // Actualizar la posición del CubeCamera para que coincida con el plano
      cubeCamera.position.copy(plane.position);

      // Renderizar la escena desde la perspectiva del CubeCamera
      plane.visible = false; // Ocultar el plano mientras se actualizan los reflejos
      cubeCamera.update(renderer, scene);
      plane.visible = true; // Mostrar el plano nuevamente

    }

    portalMaterial.uniforms.time.value += 0.5;
    composer.render(); // Renderiza usando el compositor

    camera.position.x += (mouse.x - camera.position.x) * 0.05;
    camera.position.x = Math.max(
      minCameraX,
      Math.min(camera.position.x, maxCameraX)
    );

    animateFunctions.forEach((fn) => fn());

    const elapsedTime = clock.getElapsedTime();
    planes.forEach((plane) => {
      plane.material.uniforms.uTime.value = elapsedTime;
    });

    updateAnimations()

    // Actualiza la visibilidad de los objetos
    updateVisibility(camera);
    renderer.render(scene, camera);
  }


  animate();



}


main();