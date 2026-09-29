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
// Distancia del plane a la cámara según el ancho de pantalla (menor = más cerca = se ve más grande)
const PLANE_DISTANCE_MOBILE = 1.7;   // pantallas <= PLANE_BP_MOBILE
const PLANE_DISTANCE_DESKTOP = 2;  // pantallas >= PLANE_BP_DESKTOP (tu valor actual)
const PLANE_BP_MOBILE = 450;         // ancho donde empieza a acercarse
const PLANE_BP_DESKTOP = 990;        // ancho donde vuelve a la distancia de escritorio

// Interpola suave entre móvil y escritorio (sin saltos al redimensionar)
function getPlaneDistance() {
  const t = THREE.MathUtils.clamp(
    (window.innerWidth - PLANE_BP_MOBILE) / (PLANE_BP_DESKTOP - PLANE_BP_MOBILE),
    0,
    1
  );
  return THREE.MathUtils.lerp(PLANE_DISTANCE_MOBILE, PLANE_DISTANCE_DESKTOP, t);
}
const PLANE_DRAG = true;     // true = conserva el arrastre sutil en x/y; false = sigue la cámara exacto
const ENABLE_SKY = true;     // false = el cielo (backgroundRect) no se agrega a la escena (sirve para medir rendimiento)
const DEBUG_STATS = true;    // true = muestra el panel de FPS + escena actual, draw calls y triángulos (ponlo en false en producción)

// =========================================================
// 🌈 GRAINIENT — configuración del fondo animado (backgroundRect)
// Ajusta estos valores para personalizar el gradiente.
// =========================================================
const GRAINIENT_CONFIG = {
  color1: "#041dff",
  color2: "#e8e6ff",
  color3: "#2b80ff",

  speed: 0.1,         // 0 - 2   → velocidad global de la animación
  balance: 0.5,       // 0 - 1   → hacia qué color se inclina la mezcla
  rotation: 0.15,     // 0 - 1   → rotación orgánica del campo de ruido

  warpStrength: 0.55, // 0 - 1.5 → intensidad del "empuje" líquido
  warpFreq: 1.4,      // 0.3 - 4 → frecuencia/ondulación del warp

  angle: 70,          // 0 - 360 → ángulo base del gradiente
  softness: 0.45,     // 0.05 - 1 → qué tan difuminadas son las transiciones

  contrast: 1.05,     // 0.5 - 1.8
  saturation: 1.1,    // 0 - 2

  // Desvanece el borde superior del plano para que se funda con
  // scene.background (azul) y no se vea una línea dura. 0 = sin desvanecer.
  fadeTop: 0.25,      // 0 - 0.6 → fracción superior del plano que se desvanece
};

// Fondo FIJO (ya no se anima en la timeline): un tramo de esfera que rodea la
// escena, así cubre un ángulo real de visión en vez de un plano plano.
// Se ve desde adentro y está centrado hacia -z (hacia donde mira la cámara).
const BG_COVER_X_DEG = 180;         // cobertura horizontal (grados)
const BG_COVER_Y_DEG = 57;          // cobertura vertical (grados)
const BG_CENTER_Y = 50;             // sube TODO el cielo esta cantidad (unidades) para separarlo de los objetos
const BG_ELEVATION_START_DEG = -21; // borde inferior, medido desde el centro de la esfera (que ahora está en
                                    // y = BG_CENTER_Y). -21° compensa la subida: desde la cámara el borde
                                    // inferior sigue viéndose a ~-15°, escondido detrás de las dunas
const BG_RADIUS = 500;              // ya no importa para que toque objetos (se dibuja sin test de profundidad);
                                    // solo debe ser mayor que la distancia máxima de la cámara (z = 90)
                                    // y menor que camera.far

// Cielo optimizado: el degradado se calcula a baja resolución y a pocos FPS.
// Es suave y se mueve despacio, así que a ojo no se nota, pero el costo por
// píxel de pantalla baja a casi cero (solo se muestrea una textura).
const SKY_RT_WIDTH = window.innerWidth < 770 ? 256 : 512; // proporción 2:1 = 180° x 90°
const SKY_RT_HEIGHT = SKY_RT_WIDTH / 2;
const SKY_UPDATE_FPS = 20;                                // cuántas veces por segundo se recalcula
const SKY_UPDATE_INTERVAL = 1 / SKY_UPDATE_FPS;

// Menos octavas de ruido en pantallas chicas: es lo más caro del shader
const GRAINIENT_OCTAVES = window.innerWidth < 770 ? 3 : 5;

// El shader ya NO se dibuja sobre la esfera a resolución de pantalla: se calcula en
// un render target pequeño (quad a pantalla completa) y la esfera solo muestrea esa textura.
const GRAINIENT_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const GRAINIENT_FRAGMENT_SHADER = `
  precision highp float;
  #define OCTAVES ${GRAINIENT_OCTAVES}
  varying vec2 vUv;

  uniform float uTime;
  uniform float uAspect;

  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  uniform float uSpeed;
  uniform float uBalance;
  uniform float uRotation;

  uniform float uWarpStrength;
  uniform float uWarpFreq;

  uniform float uAngle;
  uniform float uSoftness;

  uniform float uContrast;
  uniform float uSaturation;
  uniform float uFadeTop;
  uniform vec3 uBgColor;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
          dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
      mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
          dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < OCTAVES; i++) {
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0*d + e)), d / (q.x + e), q.x);
  }
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    // vUv cubre todo el plano; uAspect corrige la proporción del plano
    // para que el ruido no se estire.
    vec2 p = (vUv - 0.5);
    p.x *= uAspect;

    float t = uTime * uSpeed;

    float rot = uRotation * t * 0.3;
    mat2 rotM = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    vec2 rp = rotM * p;

    vec2 warpUv = rp * uWarpFreq + vec2(t * 0.15, -t * 0.12);
    float n1 = fbm(warpUv);
    float n2 = fbm(warpUv + vec2(5.2, 1.3) + t * 0.08);
    vec2 warped = rp + uWarpStrength * vec2(n1, n2);

    float rad = radians(uAngle);
    vec2 axis = vec2(cos(rad), sin(rad));
    float g = dot(warped, axis) + 0.5;

    float n3 = fbm(warped * 1.3 - t * 0.05);
    g += n3 * 0.35;

    float soft = max(uSoftness, 0.001);
    float m1 = smoothstep(0.5 - soft, 0.5 + soft, g + (uBalance - 0.5));

    vec3 col = mix(uColor1, uColor2, m1);
    col = mix(col, uColor3, clamp((g - 0.65) / max(soft, 0.05), 0.0, 1.0) * 0.85);

    float swirl = smoothstep(0.3, 0.9, fbm(warped * 0.8 + 3.1));
    col = mix(col, uColor3, swirl * 0.25);

    col = (col - 0.5) * uContrast + 0.5;
    vec3 hsv = rgb2hsv(clamp(col, 0.0, 1.0));
    hsv.y = clamp(hsv.y * uSaturation, 0.0, 1.0);
    col = hsv2rgb(hsv);

    col = clamp(col, 0.0, 1.0);

    // Funde el borde superior con el azul de scene.background. Sin alpha:
    // el cielo es opaco y se dibuja primero, sin test de profundidad.
    float fade = smoothstep(1.0 - uFadeTop, 1.0, vUv.y);
    col = mix(col, uBgColor, fade);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function colorToVec3(hex) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

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
    80,
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
      // Libera geometría y material del mesh anterior antes de reemplazarlo
      if (textMeshes[id]) {
        scene.remove(textMeshes[id]);
        textMeshes[id].geometry.dispose();
        if (Array.isArray(textMeshes[id].material)) {
          textMeshes[id].material.forEach((m) => m.dispose());
        } else {
          textMeshes[id].material.dispose();
        }
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

  // ───────────────────────── Fondo animado (Grainient) ─────────────────────────
  // Se mantiene el nombre `backgroundRect`, pero ahora es un tramo de esfera FIJO:
  // ya no se mueve en la timeline, solo el shader se anima.
  const grainientMaterial = new THREE.ShaderMaterial({
    vertexShader: GRAINIENT_VERTEX_SHADER,
    fragmentShader: GRAINIENT_FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: BG_COVER_X_DEG / BG_COVER_Y_DEG },
      uColor1: { value: colorToVec3(GRAINIENT_CONFIG.color1) },
      uColor2: { value: colorToVec3(GRAINIENT_CONFIG.color2) },
      uColor3: { value: colorToVec3(GRAINIENT_CONFIG.color3) },
      uSpeed: { value: GRAINIENT_CONFIG.speed },
      uBalance: { value: GRAINIENT_CONFIG.balance },
      uRotation: { value: GRAINIENT_CONFIG.rotation },
      uWarpStrength: { value: GRAINIENT_CONFIG.warpStrength },
      uWarpFreq: { value: GRAINIENT_CONFIG.warpFreq },
      uAngle: { value: GRAINIENT_CONFIG.angle },
      uSoftness: { value: GRAINIENT_CONFIG.softness },
      uContrast: { value: GRAINIENT_CONFIG.contrast },
      uSaturation: { value: GRAINIENT_CONFIG.saturation },
      uFadeTop: { value: GRAINIENT_CONFIG.fadeTop },
      uBgColor: { value: colorToVec3(scene.background.getHex()) },
    },
  });

  // Render target pequeño donde se calcula el degradado, con su mini escena (un quad)
  const skyRT = new THREE.WebGLRenderTarget(SKY_RT_WIDTH, SKY_RT_HEIGHT, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const skyScene = new THREE.Scene();
  const skyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const skyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), grainientMaterial);
  skyQuad.frustumCulled = false;
  skyScene.add(skyQuad);

  // La esfera solo muestrea la textura: material básico, opaco y sin test de profundidad
  const skyDisplayMaterial = new THREE.MeshBasicMaterial({
    map: skyRT.texture,
    side: THREE.BackSide, // la cámara está dentro de la esfera
    depthTest: false,     // ignora la profundidad: NUNCA se cruza con los objetos
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });

  // Tramo de esfera: theta se mide desde el polo (+y), phi alrededor del eje y.
  const bgPhiLength = THREE.MathUtils.degToRad(BG_COVER_X_DEG);
  const bgPhiStart = THREE.MathUtils.degToRad(270) - bgPhiLength / 2; // 270° = dirección -z
  const bgThetaLength = THREE.MathUtils.degToRad(BG_COVER_Y_DEG);
  const bgThetaStart = THREE.MathUtils.degToRad(90 - (BG_ELEVATION_START_DEG + BG_COVER_Y_DEG));

  const backgroundRect = new THREE.Mesh(
    new THREE.SphereGeometry(
      BG_RADIUS, 64, 32,
      bgPhiStart, bgPhiLength,
      bgThetaStart, bgThetaLength
    ),
    skyDisplayMaterial
  );
  backgroundRect.position.set(0, BG_CENTER_Y, 0);
  backgroundRect.renderOrder = -1;      // se dibuja PRIMERO de todo; los objetos se pintan encima
  backgroundRect.frustumCulled = false; // la cámara siempre está dentro de la esfera
  if (ENABLE_SKY) scene.add(backgroundRect);

  // Tiempo del shader y acumulador para actualizar el render target a SKY_UPDATE_FPS
  let backgroundTime = 0;
  let skyAccum = SKY_UPDATE_INTERVAL; // así se dibuja el primer frame de inmediato

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

    console.log("¡Agua cargada correctamente!", wateru);
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
  //  PLANES DE PROYECTO (escenas 1, 2 y 3) — con VIDEO + marco marquee
  //  Cada plane es HIJO de su cámara: se mueve con ella sin lerp,
  //  sin lookAt y sin recalcular posición por frame.
  // ═════════════════════════════════════════════════════════════════

  // Crea un <video> oculto + su VideoTexture. No se agrega al DOM visible,
  // solo sirve como fuente de datos para Three.js.
  function loadVideoTexture(url) {
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;       // requerido para autoplay en casi todos los navegadores
    video.loop = true;
    video.playsInline = true; // evita fullscreen automático en iOS
    video.preload = 'auto';

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    return { texture: videoTexture, video };
  }

  // Videos de proyectos
  const { texture: texUno, video: videoUno } = loadVideoTexture('./src/img/proysamy.mp4');
  const { texture: texDos, video: videoDos } = loadVideoTexture('./src/img/proysamy.mp4');
  const { texture: texTres, video: videoTres } = loadVideoTexture('./src/img/proyectodsain.mp4');

  // Un solo material/shader para los tres planes (SIN CAMBIOS: es tu shader de bandera)
  function createMaterial(tex) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: tex },
        uOpacity: { value: 0 },
        uWidth: { value: 1 }, // ancho del plane, para que la amplitud escale con el tamaño
      },
      vertexShader: `
      uniform float uTime;
      uniform float uWidth;
      varying vec2 vUv;
      varying float vShade;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // 0 en el borde izquierdo (anclado) -> 1 en el borde libre
        float pin = smoothstep(0.0, 0.9, uv.x);

        // Tres ondas con distinta frecuencia, velocidad e inclinación
        float p1 = uv.x * 5.0  - uTime * 2.0 + uv.y * 2.0;
        float p2 = uv.x * 9.0  - uTime * 3.2 + uv.y * 4.5;
        float p3 = uv.y * 4.0  + uTime * 1.2 + uv.x * 2.0;

        float wave = sin(p1) + 0.5 * sin(p2) + 0.3 * sin(p3);
        pos.z += wave * uWidth * 0.025 * pin;

        // Pendiente de la onda en X: sirve para simular luz y sombra en los pliegues
        float slope = 5.0 * cos(p1) + 0.5 * 9.0 * cos(p2) + 0.3 * 2.0 * cos(p3);
        vShade = slope * pin;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
      fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vShade;

      void main() {
        vec4 color = texture2D(uTexture, vUv);
        if (color.a < 0.1) discard;

        // Aclara/oscurece según la inclinación del pliegue
        float shade = 1.0 + vShade * 0.06;
        gl_FragColor = vec4(color.rgb * shade, color.a * uOpacity);
      }
    `,
      transparent: true,
      depthWrite: false
    });
  }

  // ───────────────────────── Marco con texto marquee ─────────────────────────
  // Banda de texto que gira sin fin alrededor del plane. Comparte uTime, uOpacity
  // y uWidth con el material del plane, y usa la MISMA fórmula de onda, así que
  // ondea pegada al borde del video.
  function createMarqueeFrame(shared, options = {}) {
    const cfg = {
      items: ["DISEÑO WEB", "UX / UI", "BRANDING"], // textos que se repiten
      separator: "   ✦   ",                          // separador entre textos
      font: "500 64px 'DM Mono', monospace",        // el canvas mide 128px de alto
      color: "#ffffff",
      background: "rgba(0,0,0,0.6)",                // null = banda transparente
      thickness: 0.05,                              // grosor, como fracción del ancho del plane
      speed: 0.08,                                  // velocidad, en anchos del plane por segundo
      direction: 1,                                 // 1 = sentido horario, -1 = antihorario
      ...options
    };

    const TEX_H = 128;
    let tex = null;
    let texAspect = 8;
    let tileWorld = 1;
    let scroll = 0;
    let lastW = 1;
    let lastH = 0.5;

    const frameMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: shared.uTime,       // mismos objetos: se actualizan solos con el plane
        uOpacity: shared.uOpacity,
        uWidth: shared.uWidth,
        uScroll: { value: 0 },
        uTexture: { value: null },
      },
      vertexShader: `
      attribute vec2 aPlaneUv;
      uniform float uTime;
      uniform float uWidth;
      varying vec2 vUv;
      varying float vShade;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Misma onda que el plane (aPlaneUv = coordenada del vértice sobre el plane)
        float pin = smoothstep(0.0, 0.9, aPlaneUv.x);
        float p1 = aPlaneUv.x * 5.0  - uTime * 2.0 + aPlaneUv.y * 2.0;
        float p2 = aPlaneUv.x * 9.0  - uTime * 3.2 + aPlaneUv.y * 4.5;
        float p3 = aPlaneUv.y * 4.0  + uTime * 1.2 + aPlaneUv.x * 2.0;

        float wave = sin(p1) + 0.5 * sin(p2) + 0.3 * sin(p3);
        pos.z += wave * uWidth * 0.025 * pin;

        float slope = 5.0 * cos(p1) + 0.5 * 9.0 * cos(p2) + 0.3 * 2.0 * cos(p3);
        vShade = slope * pin;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
      fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      uniform float uScroll;
      varying vec2 vUv;
      varying float vShade;

      void main() {
        vec4 c = texture2D(uTexture, vec2(vUv.x - uScroll, vUv.y));
        if (c.a < 0.01) discard;
        float shade = 1.0 + vShade * 0.06;
        gl_FragColor = vec4(c.rgb * shade, c.a * uOpacity);
      }
    `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), frameMaterial);
    mesh.frustumCulled = false;
    mesh.position.z = 0.002; // apenas delante del video para evitar z-fighting

    // Un "tile" = todos los textos + separador. Se repite a lo largo del perímetro.
    function drawTexture() {
      const text = cfg.items.join(cfg.separator) + cfg.separator;
      const probe = document.createElement("canvas").getContext("2d");
      probe.font = cfg.font;
      const textW = Math.ceil(probe.measureText(text).width);

      const cv = document.createElement("canvas");
      cv.width = Math.max(textW, TEX_H);
      cv.height = TEX_H;
      const c2d = cv.getContext("2d");

      if (cfg.background) {
        c2d.fillStyle = cfg.background;
        c2d.fillRect(0, 0, cv.width, cv.height);
      }
      c2d.font = cfg.font;
      c2d.fillStyle = cfg.color;
      c2d.textBaseline = "middle";
      c2d.fillText(text, 0, TEX_H / 2 + 4);

      if (tex) tex.dispose();
      tex = new THREE.CanvasTexture(cv);
      tex.wrapS = THREE.RepeatWrapping;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texAspect = cv.width / TEX_H;
      frameMaterial.uniforms.uTexture.value = tex;
    }

    // redraw = true fuerza volver a dibujar el texto (por ejemplo, cuando carga la fuente)
    function rebuild(w = lastW, h = lastH, redraw = false) {
      lastW = w;
      lastH = h;
      if (!tex || redraw) drawTexture();

      const t = w * cfg.thickness;
      const P = 2 * (w + 2 * t) + 2 * h;                              // perímetro total
      const repeats = Math.max(1, Math.round(P / (t * texAspect)));   // entero => loop sin salto
      tileWorld = P / repeats;

      // Cada lado: punto inicial en el borde interior, dirección, largo y normal hacia afuera
      const sides = [
        { A: [-w / 2 - t,  h / 2], d: [ 1,  0], len: w + 2 * t, n: [ 0,  1] }, // arriba
        { A: [ w / 2,      h / 2], d: [ 0, -1], len: h,         n: [ 1,  0] }, // derecha
        { A: [ w / 2 + t, -h / 2], d: [-1,  0], len: w + 2 * t, n: [ 0, -1] }, // abajo
        { A: [-w / 2,     -h / 2], d: [ 0,  1], len: h,         n: [-1,  0] }, // izquierda
      ];

      const pos = [], planeUv = [], uvs = [], idx = [];
      let sOff = 0;
      let base = 0;

      sides.forEach(({ A, d, len, n }) => {
        const N = Math.max(2, Math.ceil((len / w) * 48));
        for (let i = 0; i <= N; i++) {
          const a = i / N;
          const ix = A[0] + d[0] * a * len;
          const iy = A[1] + d[1] * a * len;
          for (let k = 0; k < 2; k++) {                 // k=0 borde interior, k=1 exterior
            const x = ix + n[0] * t * k;
            const y = iy + n[1] * t * k;
            pos.push(x, y, 0);
            planeUv.push((x + w / 2) / w, (y + h / 2) / h); // UV del plane, para la onda
            uvs.push(((sOff + a * len) / P) * repeats, k);
          }
        }
        for (let i = 0; i < N; i++) {
          const a = base + i * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        base += (N + 1) * 2;
        sOff += len;
      });

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("aPlaneUv", new THREE.Float32BufferAttribute(planeUv, 2));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);

      mesh.geometry.dispose();
      mesh.geometry = geo;
    }

    function update(dt) {
      scroll = (scroll + (dt * cfg.speed * cfg.direction * lastW) / tileWorld) % 1;
      frameMaterial.uniforms.uScroll.value = scroll;
    }

    // Si la fuente aún no cargó al dibujar el canvas, redibuja cuando esté lista
    if (document.fonts && document.fonts.load) {
      document.fonts.load(cfg.font).then(() => rebuild(lastW, lastH, true)).catch(() => {});
    }

    return { mesh, rebuild, update };
  }

  // `video` es opcional: si se pasa, el plane pausa/reanuda el video según esté dentro o fuera de rango
  // `marquee` es opcional: si se pasa, dibuja el marco de texto alrededor del plane
  function createFollowPlane({ tex, cam, scn, minZ, maxZ, buttonId, video, marquee }) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.5, 40, 20),
      createMaterial(tex)
    );
     mesh.position.set(0, 0, -getPlaneDistance()); // local a la cámara
    mesh.visible = false;
    cam.add(mesh);
    if (cam.parent !== scn) scn.add(cam); // los hijos de la cámara solo se renderizan si la cámara está en la escena

    const u = mesh.material.uniforms;
    const button = document.getElementById(buttonId);
    let btnShown = null;
    let lagX = cam.position.x;
    let lagY = cam.position.y;

    // Marco de texto: hijo del plane, así hereda posición, arrastre y visibilidad
    const frame = marquee ? createMarqueeFrame(u, marquee) : null;
    if (frame) mesh.add(frame.mesh);

    function resize() {
      const w = window.innerWidth * 0.003;
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(w, w / 2, 40, 20);
      u.uWidth.value = w; // la amplitud escala con el tamaño
      mesh.position.z = -getPlaneDistance(); // recalcula la distancia según el ancho
      if (frame) frame.rebuild(w, w / 2);
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
        if (frame) frame.update(dt);
        if (PLANE_DRAG) {
          mesh.position.x = lagX - cam.position.x;
          mesh.position.y = lagY - cam.position.y;
        }
      }

      // Play/pause del video: solo decodifica mientras el plane es visible
      if (video) {
        if (inRange && video.paused) {
          video.play().catch(() => {
            // Autoplay bloqueado: reintenta tras la primera interacción (botonInicio)
            document.getElementById("botoninicio")?.addEventListener("click", () => {
              video.play().catch((e) => console.warn("No se pudo reproducir el video:", e));
            }, { once: true });
          });
        } else if (!inRange && !video.paused) {
          video.pause();
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

  // ── Planes: personaliza aquí el texto de cada marco ──
  const planeUno = createFollowPlane({
    tex: texUno,
    cam: camera,
    scn: scene,
    minZ: 35,
    maxZ: 80,
    buttonId: "botonsecundariouno",
    video: videoUno,
    marquee: {
      items: ["SAMY COSMETICS", "WEB APP", "LIP FILTER"],
      separator: "   ✦   ",
      color: "#ffffff",
      background: "rgba(4,0,255,0.7)",
      speed: 0.08,
      direction: 1, // gira en sentido
      thickness: 0.04 // Grosor
    }
  });

  const planeDos = createFollowPlane({
    tex: texDos,
    cam: cameraDos,
    scn: sceneDos,
    minZ: 1040,
    maxZ: 1090,
    buttonId: "botonsecundariodos",
    video: videoDos,
    marquee: {
      items: ["SAMY COSMETICS", "UX / UI", "MEDIAPIPE"],
      separator: "   ✦   ",
      color: "#ffffff",
      background: "rgba(4,0,255,0.7)",
      speed: 0.08,
      direction: 1, // gira en sentido
      thickness: 0.04 // Grosor
    }
  });

  const planeTres = createFollowPlane({
    tex: texTres,
    cam: cameraTres,
    scn: sceneTres,
    minZ: 20,
    maxZ: 110,
    buttonId: "botonsecundariotres",
    video: videoTres,
    marquee: {
      items: ["DSAIN", "PORTFOLIO", "UX-UI", "YAKSIN SAIN"],
      separator: "   ✦   ",
      color: "#ffffff",
      background: "rgba(4,0,255,0.7)",
      speed: 0.08,
      direction: 1, // gira en sentido
      thickness: 0.04 // Grosor
    }
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
          ease: "none",
        })
        .to(cameraTres.position, {
          duration: 4,
          x: 0,
          y: 3,
          z: 20,
          ease: "none",
        })
        .to(cameraTres.position, {
          duration: 10,
          x: 0,
          y: 3,
          z: 157,
          ease: "none",
        })

    });
  });

  // ───────────────────────── Estado del render ─────────────────────────
  let frameCongelado = false;

  const clock = new THREE.Clock();

  const stats = new Stats();
  stats.showPanel(0); // 0 = FPS, 1 = ms, 2 = MB (clic en el panel para cambiar)
  if (DEBUG_STATS) container.appendChild(stats.dom);

  // Panel extra: escena actual + draw calls / triángulos por frame.
  // Hay varios render() por frame (escena 1, portal, escena 3), así que se
  // desactiva el reset automático y se acumulan todos en animate().
  let debugInfo = null;
  let debugLastUpdate = 0;
  if (DEBUG_STATS) {
    renderer.info.autoReset = false;
    debugInfo = document.createElement("div");
    debugInfo.style.cssText =
      "position:fixed;top:48px;left:0;z-index:10000;padding:4px 6px;" +
      "font:11px/1.4 monospace;color:#0ff;background:rgba(0,0,0,.75);" +
      "pointer-events:none;white-space:pre";
    document.body.appendChild(debugInfo);
  }

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
    if (DEBUG_STATS) {
      stats.begin();
      renderer.info.reset();
    }

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

    // El cielo solo existe mientras la escena 1 está activa. Se asigna DESPUÉS de
    // syncMeshVisibility, que si no lo volvería a encender al cambiar de estado.
    backgroundRect.visible = ENABLE_SKY && !inSecondStage;

    // Cielo: recalcula el render target pequeño solo si es visible y toca actualizar
    if (backgroundRect.visible) {
      backgroundTime += delta;
      skyAccum += delta;
      if (skyAccum >= SKY_UPDATE_INTERVAL) {
        skyAccum = 0;
        grainientMaterial.uniforms.uTime.value = backgroundTime;
        renderer.setRenderTarget(skyRT);
        renderer.render(skyScene, skyCamera);
        renderer.setRenderTarget(null);
      }
    }

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

    if (DEBUG_STATS) {
      const now = performance.now();
      if (now - debugLastUpdate > 500) {
        debugLastUpdate = now;
        const stage = !inSecondStage
          ? "Escena 1"
          : (cameraDos.position.z >= 1100 ? "Escena 3" : "Escena 2 (portal)");
        const i = renderer.info;
        debugInfo.textContent =
          stage + "\n" +
          "draw calls: " + i.render.calls + "\n" +
          "triángulos: " + i.render.triangles + "\n" +
          "geometrías: " + i.memory.geometries + "\n" +
          "texturas: " + i.memory.textures;
      }
      stats.end();
    }
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