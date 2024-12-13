import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import {
  RGBELoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";

import gsap from "https://cdn.skypack.dev/gsap@3.11.0";

function main() {
  const container = document.getElementById("scene-container");
  const scene = new THREE.Scene();

  scene.background = new THREE.Color(0x0000ff); // Fondo azul cielo

  // Inicializa el renderer antes de utilizarlo
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.shadowMap.enabled = true;

  //Puedes probar con otros tipos como THREE.PCFSoftShadowMap - THREE.PCFShadowMap o THREE.VSMShadowMap

  renderer.shadowMap.type = THREE.VSMShadowMap;

  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);



  // Crear PMREMGenerator después de inicializar el renderer
  const pmremGenerator = new THREE.PMREMGenerator(renderer);


  // Cargar HDRI global
  const globalHdrLoader = new RGBELoader();
  globalHdrLoader.load("./src/objt/escena/cielo.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Convertir para compatibilidad con PMREM (mejor iluminación)
    const hdrEquirect = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = hdrEquirect; // HDRI global
    //scene.background = hdrEquirect;  // Fondo global (opcional)

  });

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.rotation.set(1, 0, 0);
  camera.position.set(0, 11, -5); // Ajusta los valores según tu escena
  //camera.lookAt(0, 0, 0); // Asegúrate de que apunte al origen o a donde necesites

  const mouse = new THREE.Vector2();
  const minCameraX = -1;
  const maxCameraX = 500;



  // Crear un gradiente utilizando un Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; // Ajustamos el tamaño del canvas para que cubra toda la pantalla
  canvas.height = window.innerHeight;

  // Crear un gradiente lineal de arriba hacia abajo (puedes personalizarlo)
  const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0, '#FFEBA8FF'); // abajo
  gradient.addColorStop(1, '#0400FFFF'); // arriba

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
  backgroundRect.position.set(0, -30, -190); // Colocarlo detrás de la cámara
  backgroundRect.rotation.set(0, 0, 0);
  scene.add(backgroundRect);



  const directionalLight = new THREE.DirectionalLight(0xFfffff, 2);
  directionalLight.position.set(-15, 15, -50);
  directionalLight.castShadow = true
  scene.add(directionalLight);
  console.log(directionalLight.shadow)

  const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
  //scene.add(directionalLightHelper);

  const segundaLight = new THREE.DirectionalLight(0xFF3419, 1);
  segundaLight.position.set(3, 19, -150);
  segundaLight.target.position.set(0, 1, 20); // Dirige la luz hacia el origen

  // Habilitar sombras
  segundaLight.castShadow = true;
  segundaLight.shadow.mapSize.width = 1024; // Tamaño del mapa de sombras
  segundaLight.shadow.mapSize.height = 1024;
  segundaLight.shadow.bias = -0.001; // Previene artefactos de sombra

  // Puedes ajustar la cámara de sombra para la luz direccional
  segundaLight.shadow.camera.left = -100;
  segundaLight.shadow.camera.right = 100;
  segundaLight.shadow.camera.top = 100;
  segundaLight.shadow.camera.bottom = 100;
  segundaLight.shadow.camera.near = 10;
  segundaLight.shadow.camera.far = 500;

  // Agregar la luz a la escena
  scene.add(segundaLight);

  const segundasombraHelper = new THREE.CameraHelper(segundaLight.shadow.camera);
  //scene.add(segundasombraHelper);

  const segundaLightHelper = new THREE.DirectionalLightHelper(segundaLight, 5);
  //scene.add(segundaLightHelper);

  const textureLoader = new THREE.TextureLoader();
  const aroughnessMap = textureLoader.load("./src/objt/agua/roug.jpg");
  const aaoMap = textureLoader.load("./src/objt/agua/occ.jpg");
  const anormalMap = textureLoader.load("./src/objt/agua/norm.jpg");
  const adisplacementMap = textureLoader.load("./src/objt/agua/disp.png");

  const planeGeometry = new THREE.PlaneGeometry(50, 50, 500, 500);
  planeGeometry.attributes.uv2 = planeGeometry.attributes.uv;

  const planeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0026FF,
    roughness: 0.1,
    metalness: 0.5,
    transmission: 0.5, // Esto hace que el material sea más transparente (efecto vidrio)
    thickness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1,
    normalMap: anormalMap,
    displacementMap: adisplacementMap,
    displacementScale: 0.3,
    transparent: true, // Habilitar la transparencia
    opacity: 0.7 // Controla el nivel de transparencia (0 es completamente transparente)
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, 0, 9);
  plane.receiveShadow = true;
  scene.add(plane);


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
      // Habilitar sombras en el modelo
      model.castShadow = true; // El cubo emitirá sombras
      model.receiveShadow = true; // El cubo recibirá sombras si hay otras fuentes de luz

      // Cargar HDRI específico para el modelo
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load("./src/objt/logo/logo.hdr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            // Aplica el HDRI solo al modelo
            child.material.envMap = texture;
            child.material.envMapIntensity = 3;
            child.material.metalness = 0.8;
            child.material.roughness = 0;
            child.material.clearcoat = 1;
            child.material.clearcoatRoughness = 0;
            child.material.emissive = new THREE.Color(0x9966cc);
            child.material.emissiveIntensity = 0.5;
            child.material.ior = 1;
            child.material.transmission = 1;
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
      modelbaselogo.position.set(0, -1.1, -5);
      modelbaselogo.scale.set(0.3, 0.36, 0.3);
      modelbaselogo.rotation.set(0, 0, 0);

      // Habilitar sombras en el modelo
      modelbaselogo.castShadow = true; // El cubo emitirá sombras
      modelbaselogo.receiveShadow = true; // El cubo recibirá sombras si hay otras fuentes de luz

      const modelbaselogoMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFF6E8, // Color base del material          
        aoMap: null, // Mapa de oclusión ambiental
        emissive: 0xFF9F73, // Color de emisión (luz propia)
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
    (error) => console.error("Error al cargar el modelo de modelbaselogo ", error)
  );

  /////// Crear luz direccional /////////////

  const luzpasillo = new THREE.DirectionalLight(0xFFC0A2, 1);
  luzpasillo.position.set(0, 20, 100); // Posición de la luz
  luzpasillo.castShadow = true; // Activar sombras

  // Ajustar la cámara de sombras (proyección ortográfica)
  luzpasillo.shadow.camera.top = 50; // Límite superior
  luzpasillo.shadow.camera.bottom = -50; // Límite inferior
  luzpasillo.shadow.camera.left = -50; // Límite izquierdo
  luzpasillo.shadow.camera.right = 50; // Límite derecho
  luzpasillo.shadow.camera.near = 0.5; // Distancia mínima
  luzpasillo.shadow.camera.far = 60; // Distancia máxima
  luzpasillo.shadow.mapSize.width = 2048; // Ancho del mapa de sombras
  luzpasillo.shadow.mapSize.height = 2048; // Alto del mapa de sombras
  luzpasillo.shadow.bias = -0.001; // Previene artefactos de sombra

  // Cambiar el objetivo de la luz
  const target = new THREE.Object3D();
  target.position.set(0, 0, 15); // Nuevo punto al que apunta la luz
  scene.add(target); // Agregar el objetivo a la escena
  luzpasillo.target = target; // Asignar el objetivo a la luz

  // Opcional: Ayuda visual para la cámara de sombras
  const shadowHelper = new THREE.CameraHelper(luzpasillo.shadow.camera);
  //scene.add(shadowHelper);

  // Agregar luz a la escena
  scene.add(luzpasillo);

  const luzpasillohelper = new THREE.DirectionalLightHelper(luzpasillo, 5);
  //scene.add(luzpasillohelper);


  ///////// Crear luz direccional  ////////////////
  const luzdospasillo = new THREE.DirectionalLight(0xFA7D66, 0.3);
  luzdospasillo.position.set(15, 20, 15); // Posición de la luz
  luzdospasillo.castShadow = true; // Activar sombras

  // Ajustar la cámara de sombras (proyección ortográfica)
  luzdospasillo.shadow.camera.top = 50; // Límite superior
  luzdospasillo.shadow.camera.bottom = -50; // Límite inferior
  luzdospasillo.shadow.camera.left = -50; // Límite izquierdo
  luzdospasillo.shadow.camera.right = 50; // Límite derecho
  luzdospasillo.shadow.camera.near = 0.5; // Distancia mínima
  luzdospasillo.shadow.camera.far = 60; // Distancia máxima
  luzdospasillo.shadow.mapSize.width = 2048; // Ancho del mapa de sombras
  luzdospasillo.shadow.mapSize.height = 2048; // Alto del mapa de sombras
  luzdospasillo.shadow.bias = -0.0001; // Previene artefactos de sombra

  // Cambiar el objetivo de la luz
  const targetdos = new THREE.Object3D();
  targetdos.position.set(5, 0, 20); // Nuevo punto al que apunta la luz
  scene.add(targetdos); // Agregar el objetivo a la escena
  luzdospasillo.targetdos = targetdos; // Asignar el objetivo a la luz

  // Opcional: Ayuda visual para la cámara de sombras
  const shadowHelperdos = new THREE.CameraHelper(luzdospasillo.shadow.camera);
  //scene.add(shadowHelper);

  // Agregar luz a la escena
  //scene.add(luzdospasillo);

  const luzpasillohelperdos = new THREE.DirectionalLightHelper(luzdospasillo, 5);
  //scene.add(luzpasillohelperdos);




  // Cargar el modelo de las dunas
  const textureLoaderDunas = new THREE.TextureLoader();
  const ambientOcclusion = textureLoaderDunas.load("./src/objt/tierra/arenaambientcclusion.jpg");
  const roughnessMap = textureLoaderDunas.load("./src/objt/tierra/arenaroughness.jpg");
  const displacementMap = textureLoaderDunas.load("./src/objt/tierra/arenaheight.png");

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
        color: 0xF6B756, // Color base del material          
        aoMap: ambientOcclusion, // Mapa de oclusión ambiental
        emissive: 0xCC5219, // Color de emisión (luz propia)
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
    metalness: 0.7
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

  // Geometría del toro
  const torusgeometry = new THREE.TorusGeometry(5, 0.6, 32, 64, Math.PI); // Arco en semicírculo
  const torusMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF,
    metalness: 1.2,
    roughness: 0,
    reflectivity: 2, // Alta reflectividad
    castShadow: true,

  });

  const torus = new THREE.Mesh(torusgeometry, torusMaterial);
  torus.position.set(13, 0, 7);
  torus.rotation.set(0, -11, 0);
  torus.castShadow = true; // Permitir que el toro proyecte sombras
  scene.add(torus);



  //////// <<<<< base dos >>>>>> /////////////

  // Cargar las texturas usando TextureLoader
  const textureLoaderazulejo = new THREE.TextureLoader();

  const colorTexture = textureLoaderazulejo.load('./src/objt/escena/escenados/azulejo/acolor.jpg');
  const normalTexture = textureLoaderazulejo.load('./src/objt/escena/escenados/azulejo/anorm.jpg');
  const roughnessTexture = textureLoaderazulejo.load('./src/objt/escena/escenados/azulejo/arough.jpg');
  const aoTexture = textureLoaderazulejo.load('./src/objt/escena/escenados/azulejo/aocc.jpg');
  const displacementTexture = textureLoaderazulejo.load('./src/objt/escena/escenados/azulejo/adisp.png');
  // Configurar las texturas para que se repitan
  [colorTexture, normalTexture, roughnessTexture, aoTexture, displacementTexture].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 20); // Ajustar el número de repeticiones (10 en X, 2 en Y)
  });

  // Crear el material con las texturas cargadas
  const materialbasedos = new THREE.MeshStandardMaterial({
    map: colorTexture, // Textura de color
    normalMap: normalTexture, // Textura de normales
    roughnessMap: roughnessTexture, // Textura de rugosidad
    aoMap: aoTexture, // Textura de oclusión ambiental
    displacementMap: displacementTexture, // Textura de desplazamiento
    displacementScale: 0.2, // Ajustar la escala del desplazamiento
    side: THREE.DoubleSide
  });

  // Crear la geometría del plano
  const geometrybasedos = new THREE.PlaneGeometry(500, 100);

  // Crear el mesh y añadirlo a la escena
  const planedos = new THREE.Mesh(geometrybasedos, materialbasedos);
  scene.add(planedos);

  // Posicionar y rotar el plano
  planedos.position.set(0, 0, 1000);
  planedos.rotation.x = -Math.PI / 2;

  // Configurar oclusión ambiental (opcional)
  geometrybasedos.attributes.uv2 = geometrybasedos.attributes.uv; // Necesario para oclusión ambiental


  
  // Cargar modelo david
  const david = new GLTFLoader();
  david.load(
    "./src/objt/escena/escenados/david.glb",
    (gltf) => {
      const modeldavid = gltf.scene;
      modeldavid.position.set(0, -10, 980);
      modeldavid.scale.set(1, 1, 1);
      modeldavid.rotation.set(0, 0, 0);

      // Material para el pasillo
      const modeldavidMaterial = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: 0xffffff,
        emissive: 0xFF8331,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
      });

      // Aplicar material y configurar sombras
      modeldavid.traverse((child) => {
        if (child.isMesh) {
          child.material = modeldavidMaterial;
          child.castShadow = true; // Proyectar sombras
          child.receiveShadow = true; // Recibir sombras
        }
      });

      // Agregar modelo a la escena
      scene.add(modeldavid);
    },
    undefined,
    (error) => console.error("Error al cargar el modelo de pasillo: ", error)
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
        const z = Math.sin(x * 0.5 + time) * 0.04 + Math.cos(y * 0.5 + time) * 0.01;
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

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  texture.encoding = THREE.sRGBEncoding; // Para texturas
  material.map.encoding = THREE.sRGBEncoding; // Si usas texturas en materiales



  const botonInicio = document.getElementById("botoninicio");
  botonInicio.addEventListener("click", () => {
    if (!model) {
      console.error("El modelo aún no se ha cargado.");
      return;
    }

    animateWaves = true;

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
      ease: "none",
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
      y: 30,
      z: -190,
      ease: "none",
    });

    inicioescena.to(camera.position, {
      delay: -2,
      duration: 2,
      x: 0,
      y: 2,
      z: 31,
      ease: "none",
    });

    inicioescena.to(camera.position, {
      delay: 0,
      duration: 0,
      x: 0,
      y: 10,
      z: 1050,
      ease: "none",
    });

  });
}

main();