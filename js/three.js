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
  sceneDos,
  cameraDos,
  renderTarget,
  playToFrame125,
  resumeAnimationsFrom125,
} from './scenados.js';

import {
  sceneTres,
  cameraTres,
  water,
  renderTargetTres
} from './scenatres.js';

gsap.registerPlugin(ScrollTrigger);

// ───────────────────────── Ajustes rápidos ─────────────────────────
const SCRUB_SMOOTH = 0.5;    // antes 2. Smooth Scrollbar ya suaviza, así que un scrub alto suma retraso.
const PLANE_DISTANCE = 2.9;  // distancia del plane a la cámara (antes: cameraZ - 2.9)
const PLANE_DRAG = true;     // true = conserva el arrastre sutil en x/y; false = sigue la cámara exacto
const DEBUG_STATS = false;   // true = muestra el panel de FPS

function main() {
  const idioma = document.documentElement.lang;
  document.querySelectorAll("[data-es]").forEach((elemento) => {
    if (idioma === "es") {
      elemento.textContent = elemento.dataset.es;
    }
  });

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
  camera.position.set(0, 10.5, -4.8);

  scene.background = new THREE.Color(0x0000ff);

  //////////////////////////////////////////

  const renderer = new THREE.WebGLRenderer({
    powerPreference: "high-performance",
    antialias: false,
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Animación Lottie de progreso
  const animationprogres = lottie.loadAnimation({
    container: document.getElementById("lottie-container"),
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "./src/img/progreso.json",
  });

  const mouse = new THREE.Vector2();
  const minCameraX = -5;
  const maxCameraX = 5;
  if (window.innerWidth >= 990) {
    function onMouseMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 0.5 - 0.25;
    }
    window.addEventListener("mousemove", onMouseMove);
  }

  // Efecto giroscopio SOLO en Android y pantallas menores a 500 px
  if (/Android/i.test(navigator.userAgent) && window.innerWidth <= 500) {

    function iniciarGiroscopioAndroid() {
      window.addEventListener("deviceorientation", (event) => {
        const inclinacionY = event.gamma || 0;
        const rotacionLimitadaY = THREE.MathUtils.clamp(inclinacionY, -25, 25);
        const movCamX = rotacionLimitadaY * 0.01;

        gsap.to(camera.position, {
          x: movCamX,
          duration: 0.79,
          ease: "power2.out",
        });
      });
    }

    iniciarGiroscopioAndroid();
  }

  // ───────────────────────── Textos 3D ─────────────────────────
  let textMeshes = {};
  const loadertx = new FontLoader();

  function getTextConfig() {
    let screenWidth = window.innerWidth;

    if (screenWidth < 450) {
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

  function getResponsiveSize(baseSize) {
    return window.innerWidth / baseSize;
  }

  function createText({
    id,
    text,
    font,
    size,
    y
  }) {
    loadertx.load(font, function (loadedFont) {
      if (textMeshes[id]) {
        scene.remove(textMeshes[id]);
      }

      const textGeometry = new TextGeometry(text, {
        font: loadedFont,
        size: getResponsiveSize(size),
        height: 0,
        curveSegments: 12,
        bevelEnabled: false
      });

      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;

      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      });

      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.x = (-textWidth / 2);
      textMesh.position.y = y;

      scene.add(textMesh);
      textMeshes[id] = textMesh;
    });
  }

  function updateAllTexts() {
    let textsConfig = getTextConfig();
    textsConfig.forEach(createText);
  }

  updateAllTexts();

  // ───────────────────────── Fondo con gradiente ─────────────────────────
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0, "#FFEBA8FF"); // abajo
  gradient.addColorStop(1, "#0400FFFF"); // arriba

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);

  const geometry = new THREE.PlaneGeometry(1500, 150, 1);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
  });

  const backgroundRect = new THREE.Mesh(geometry, material);
  backgroundRect.position.set(0, -30, -189);
  backgroundRect.rotation.set(0, 0, 0);
  scene.add(backgroundRect);

  // ───────────────────────── Luces ─────────────────────────
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-15, 16, -50);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const segundaLight = new THREE.DirectionalLight(0xff9419, 1);
  segundaLight.position.set(0, 5, -40);
  segundaLight.target.position.set(0, 0, 0);
  scene.add(segundaLight);

  // ───────────────────────── Agua ─────────────────────────
  let wateru;

  const textureaguaLoader = new THREE.TextureLoader();
  textureaguaLoader.load('./src/objt/agua/norm.jpg', function (waterNormal) {
    waterNormal.wrapS = waterNormal.wrapT = THREE.RepeatWrapping;

    const waterGeometry = new THREE.PlaneGeometry(50, 150);

    wateru = new Water(waterGeometry, {
      textureWidth: 500,
      textureHeight: 500,
      waterNormals: waterNormal,
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xFFDA05,
      waterColor: 0x0199FF,
      distortionScale: 1,
      fog: false,
      alpha: 0.8,
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

  let model = null;

  // ───────────────────────── Logo ─────────────────────────
  const loader = new GLTFLoader();
  loader.load(
    "./src/objt/logo/scene.gltf",
    (gltf) => {
      model = gltf.scene;
      model.scale.set(1, 1, 1);
      model.position.set(0, 12, -5);
      model.rotation.set(-2, 0, 0);

      const rgbeLoader = new RGBELoader();
      rgbeLoader.load("./src/objt/logo/logo.hdr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        model.traverse((child) => {
          if (child.isMesh && child.material) {
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

        function rotateModel() {
          model.rotation.y += 0.01;
        }
        animateFunctions.push(rotateModel);
      });
    },
    undefined,
    (error) => console.error("Error al cargar el modelo:", error)
  );

  // ═════════════════════════════════════════════════════════════════
  //  PLANES DE PROYECTO (escenas 1, 2 y 3)
  //  Cada plane es HIJO de su cámara: se mueve con ella sin lerp,
  //  sin lookAt y sin recalcular posición por frame.
  // ═════════════════════════════════════════════════════════════════

  // Las texturas se suben a la GPU en cuanto cargan (no en el primer render visible)
  const texLoader = new THREE.TextureLoader();
  function loadTexture(url) {
    return texLoader.load(url, (tex) => {
      if (renderer.initTexture) renderer.initTexture(tex);
    });
  }

  const texUno = loadTexture('./src/img/proyectounod.png');
  const texDos = loadTexture('./src/img/proyectouno.jpg'); // escenas 2 y 3 usan la misma imagen

  // Un solo material/shader para los tres planes
  function createMaterial(tex) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: 0
        },
        uTexture: {
          value: tex
        },
        uOpacity: {
          value: 0
        },
      },
      vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave = sin(pos.y * 2.0 + uTime * 1.0) * 0.1;
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
        if (color.a < 0.1) discard;
        gl_FragColor = vec4(color.rgb, color.a * uOpacity);
      }
    `,
      transparent: true,
      depthWrite: false
    });
  }

  function createFollowPlane({ tex, cam, scn, minZ, maxZ, buttonId }) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.5, 1, 24), // antes 50x50 (2601 vértices); el wave solo usa y
      createMaterial(tex)
    );
    mesh.position.set(0, 0, -PLANE_DISTANCE); // local a la cámara
    mesh.visible = false;
    cam.add(mesh);
    if (cam.parent !== scn) scn.add(cam); // los hijos de la cámara solo se renderizan si la cámara está en la escena

    const u = mesh.material.uniforms;
    const button = document.getElementById(buttonId);
    let btnShown = null;
    let lagX = cam.position.x;
    let lagY = cam.position.y;

    function resize() {
      const w = window.innerWidth * 0.003;
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(w, w / 2, 1, 24);
    }
    resize();
    window.addEventListener("resize", resize);

    // active = false fuerza que el plane se oculte (por ejemplo, fuera de su tramo de scroll)
    function update(dt, active = true) {
      const cz = cam.position.z;
      const inRange = active && cz >= minZ && cz <= maxZ;
      const k = 1 - Math.exp(-7 * dt); // equivale a 0.1 por frame a 60fps, pero independiente de los FPS

      u.uOpacity.value += ((inRange ? 1 : 0) - u.uOpacity.value) * k;

      // arrastre sutil en x/y (offset local respecto a la cámara)
      lagX += (cam.position.x - lagX) * k;
      lagY += (cam.position.y - lagY) * k;

      const show = inRange || u.uOpacity.value > 0.01;
      mesh.visible = show; // fuera de rango no hay draw call
      if (show) {
        u.uTime.value += dt * 0.6; // equivale a 0.01 por frame a 60fps
        if (PLANE_DRAG) {
          mesh.position.x = lagX - cam.position.x;
          mesh.position.y = lagY - cam.position.y;
        }
      }

      // el botón solo se toca cuando cambia de estado (antes: escritura de estilo en cada frame)
      if (button && btnShown !== inRange) {
        btnShown = inRange;
        button.style.bottom = inRange ? "-20vh" : "-45vh";
      }
    }

    return { mesh, update };
  }

  const planeUno = createFollowPlane({
    tex: texUno,
    cam: camera,
    scn: scene,
    minZ: 35,
    maxZ: 80,
    buttonId: "botonsecundariouno"
  });

  const planeDos = createFollowPlane({
    tex: texDos,
    cam: cameraDos,
    scn: sceneDos,
    minZ: 1040,
    maxZ: 1090,
    buttonId: "botonsecundariodos"
  });

  const planeTres = createFollowPlane({
    tex: texDos,
    cam: cameraTres,
    scn: sceneTres,
    minZ: 20,
    maxZ: 110,
    buttonId: "botonsecundariotres"
  });

  // ───────────────────────── Dunas ─────────────────────────
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
        color: 0xf6b756,
        aoMap: ambientOcclusion,
        emissive: 0xcc5219,
        emissiveIntensity: 1,
        metalness: 0,
        roughness: 1,
        roughnessMap: roughnessMap,
        displacementMap: displacementMap,
        displacementScale: 0,
        displacementBias: 0,
        transparent: false,
        opacity: 1,
        side: THREE.FrontSide,
        flatShading: false,
        wireframe: false,
        shadowSide: true,
        envMap: null,
        envMapIntensity: 0,
        alphaTest: 0,
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
    emissive: 0xffffff,
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
    emissive: 0xff0000,
    emissiveIntensity: 1.8,
    color: 0xff0000,
  });
  const sun2 = new THREE.Mesh(sun2Geometry, sun2Material);
  sun2.position.set(3, 19, -150);
  scene.add(sun2);

  // ───────────────────────── Animaciones de la puerta ─────────────────────────
  let animationStarted = false;
  let isPaused = false;

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
  texture.encoding = THREE.sRGBEncoding;
  material.map.encoding = THREE.sRGBEncoding;

  // ───────────────────────── Botón de inicio ─────────────────────────
  const botonInicio = document.getElementById("botoninicio");

  botonInicio.addEventListener("click", () => {
    updateAnimations()
    document.getElementById("contenedor").classList.add("fijo");
    ScrollTrigger.refresh();

    setTimeout(() => {
      const currentFrame = animationprogres.currentFrame;
      if (currentFrame < 60) {
        animationprogres.playSegments([currentFrame, 61], true);
      }

      if (!model) {
        console.error("El modelo aún no se ha cargado.");
        return;
      }
    }, 1000);

    // Animación inicial
    const inicioescena = gsap.timeline({
      delay: 1
    });

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
      y: 0.8,
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

    // Lógica después de la animación inicial
    inicioescena.then(() => {
      console.log("Animación inicial completada.");

      animationStarted = true;

      const endFrame = 300;
      let lastLottieFrame = -1;

      gsap.timeline({
        scrollTrigger: {
          scroller: "#scroll-content",
          trigger: "#contenedor",
          start: "top top",
          end: () => window.innerWidth > 768 ? "25000vh" : "10000vh",
          scrub: SCRUB_SMOOTH,
          pin: true,
          markers: false,
          onUpdate: function (self) {
            const frame = Math.round(61 + self.progress * (endFrame - 61));
            // solo toca el DOM del Lottie cuando el frame realmente cambia
            if (frame !== lastLottieFrame) {
              lastLottieFrame = frame;
              animationprogres.goToAndStop(frame, true);
            }
          },
        },
      })
        .to(camera.position, {
          duration: 10,
          y: 2,
          z: 90,
          ease: "none",
        })
        .to([textMeshes["text1"].material, textMeshes["text2"].material], {
          delay: -10,
          duration: 3,
          opacity: 0,
        })
        .to(cameraDos.position, {
          duration: 10,
          y: 3,
          z: 1100,
          ease: "sine.in",
        })


        .to(cameraTres.position, {
          duration: 10,
          x: 0,
          y: 3,
          z: 163,
        })
    });
  });

  // ───────────────────────── Estado del render ─────────────────────────
  let frameCongelado = false;

  const clock = new THREE.Clock();

  const stats = new Stats();
  stats.showPanel(0);
  if (DEBUG_STATS) container.appendChild(stats.dom);

  // Visibilidad de meshes: solo se recorre la escena cuando el estado cambia (antes: traverse en cada frame)
  let sceneMeshesOn = null;
  let sceneTresMeshesOn = null;

  function setMeshesVisible(root, value) {
    root.traverse((child) => {
      if (child.isMesh) child.visible = value;
    });
  }

  function syncMeshVisibility(inSecondStage) {
    const wantScene = !(inSecondStage && cameraDos.position.z >= 1100);
    if (wantScene !== sceneMeshesOn) {
      sceneMeshesOn = wantScene;
      setMeshesVisible(scene, wantScene);
    }
    if (inSecondStage !== sceneTresMeshesOn) {
      sceneTresMeshesOn = inSecondStage;
      setMeshesVisible(sceneTres, inSecondStage);
    }
  }

  // Aspecto de la cámara principal: solo se recalcula al cambiar de modo (antes: en cada frame)
  let aspectMode = null; // "portal" | "normal"
  function setAspectMode(mode) {
    if (aspectMode === mode) return;
    aspectMode = mode;
    camera.aspect = mode === "portal" ?
      (container.clientWidth / 2.5) / container.clientHeight / 2 :
      container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  }

  // ───────────────────────── Loop principal ─────────────────────────
  // Va en el ticker de GSAP: la cámara (scrub) y el render se actualizan en el mismo tick
  function animate() {
    if (DEBUG_STATS) stats.begin();

    const delta = Math.min(clock.getDelta(), 0.05);

    if (mixerpuerta) {
      mixerpuerta.update(delta);
    }

    camera.position.x += (mouse.x - camera.position.x) * 0.07;
    camera.position.x = Math.max(
      minCameraX,
      Math.min(camera.position.x, maxCameraX)
    );

    animateFunctions.forEach((fn) => fn());

    const inSecondStage = camera.position.z >= 90;

    syncMeshVisibility(inSecondStage);

    planeUno.update(delta);
    planeDos.update(delta, inSecondStage);
    planeTres.update(delta, inSecondStage && cameraTres.position.z >= 5);

    if (inSecondStage) {
      setAspectMode("portal");

      // Escena principal al render target (portal) y escena 2 en pantalla
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(sceneDos, cameraDos);

      if (cameraDos.position.z >= 1100) {

        // Congelar el frame de sceneDos SOLO una vez
        if (!frameCongelado) {
          renderer.setRenderTarget(renderTargetTres);
          renderer.render(sceneDos, cameraDos);
          renderer.setRenderTarget(null);
          frameCongelado = true;
        }

        // Animación de agua dentro de sceneTres
        if (water?.material?.uniforms?.time) {
          water.material.uniforms.time.value += 0.02;
        }

        renderer.render(sceneTres, cameraTres);
      }

    } else {
      setAspectMode("normal");

      renderer.render(scene, camera);

      if (wateru && wateru.material.uniforms['time']) {
        wateru.material.uniforms['time'].value += 0.005;
      }

      // Los textos siguen a la cámara en z (sin crear objetos nuevos por frame)
      const targetTextZ = camera.position.z - 11;
      if (textMeshes["text1"]) {
        textMeshes["text1"].position.z += (targetTextZ - textMeshes["text1"].position.z) * 0.1;
      }
      if (textMeshes["text2"]) {
        textMeshes["text2"].position.z += (targetTextZ - textMeshes["text2"].position.z) * 0.1;
      }
    }

    updateAnimations();

    if (DEBUG_STATS) stats.end();
  }

  gsap.ticker.add(animate);
  gsap.ticker.lagSmoothing(0);

  // ───────────────────────── Resize (un solo handler) ─────────────────────────
  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    renderTarget.setSize(width, height);

    cameraTres.aspect = width / height;
    cameraTres.updateProjectionMatrix();

    cameraDos.aspect = width / height;
    cameraDos.updateProjectionMatrix();

    aspectMode = null; // la cámara principal recalcula su aspecto en el siguiente frame

    renderer.setSize(width, height);
  });

  // Ajuste inicial (antes lo hacían las funciones updatePlanesSize*)
  cameraDos.aspect = container.clientWidth / container.clientHeight;
  cameraDos.updateProjectionMatrix();
  cameraTres.aspect = container.clientWidth / container.clientHeight;
  cameraTres.updateProjectionMatrix();
}
main();