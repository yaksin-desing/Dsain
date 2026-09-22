import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "https://cdn.skypack.dev/cannon-es@0.20.0";

// =========================================================
// 🌈 GRAINIENT — configuración del fondo animado
// Ajusta estos valores para personalizar el gradiente.
// =========================================================
const GRAINIENT_CONFIG = {
  color1: "#041dff",
  color2: "#e8e6ff",
  color3: "#2b80ff",

  speed: 0.7,        // 0 - 2   → velocidad global de la animación
  balance: 0.5,       // 0 - 1   → hacia qué color se inclina la mezcla
  rotation: 0.15,     // 0 - 1   → rotación orgánica del campo de ruido

  warpStrength: 0.55, // 0 - 1.5 → intensidad del "empuje" líquido
  warpFreq: 1.4,      // 0.3 - 4 → frecuencia/ondulación del warp

  angle: 70,          // 0 - 360 → ángulo base del gradiente (desktop, o en reposo)
  angleGyroSensitivity: 1.5, // grados de ángulo por grado de inclinación del teléfono
  angleTransitionSpeed: 4,   // qué tan rápido sigue el ángulo a la inclinación (suavizado)
  softness: 0.45,     // 0.05 - 1 → qué tan difuminadas son las transiciones

  grain: 0.09,        // 0 - 0.5  → densidad del grano de película (reposo)
  grainHover: 0.32,   // 0 - 0.5  → densidad del grano al hacer hover en el CTA
  grainTransitionSpeed: 6, // qué tan rápido sube/baja el grano (más alto = más brusco)
  grainScale: 1.6,    // 0.5 - 4  → tamaño del grano
  contrast: 1.05,     // 0.5 - 1.8
  saturation: 1.1,    // 0 - 2

  // Sombra de las monedas sobre el fondo animado (0 = desactivada)
  shadowOpacity: 0.35,
};

const GRAINIENT_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GRAINIENT_FRAGMENT_SHADER = `
  precision highp float;
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

  uniform float uGrain;
  uniform float uGrainScale;
  uniform float uContrast;
  uniform float uSaturation;

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
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  float hash1(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
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
    // vUv ya cubre exactamente el viewport visible (el plano está escalado
    // a bounds.halfW/halfH), así que solo falta corregir el aspecto igual
    // que se hacía antes con gl_FragCoord / uResolution.
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

    vec2 grainUv = vUv * 1000.0 / uGrainScale;
    float grainNoise = hash1(grainUv + fract(uTime) * 97.0) - 0.5;
    col += grainNoise * uGrain;

    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// 🟢 Contenedor
const container = document.getElementById("section_once");

// 🟢 Detección de dispositivo y ancho
const isMobileOrTablet = /Mobi|Android|iPad|iPod/i.test(navigator.userAgent);
const disableInteractions = window.innerWidth <= 770;

// 🟢 Cuántas monedas caen (antes era una pared de 60-170, ahora solo un puñado)
const NUM_MONEDAS = isMobileOrTablet ? 7 : 17;

// 🟢 Escala de las monedas según el ancho del dispositivo (se fija una sola
// vez al cargar la página, igual que NUM_MONEDAS)
function obtenerEscalaMonedas() {
  const width = window.innerWidth;
  if (width <= 480) return 0.1;      // celulares chicos
  else if (width <= 768) return 0.17; // tablets 
  else return 0.3;                    // desktop
}
const ESCALA_MONEDAS = obtenerEscalaMonedas();

// 🟢 Escena y cámara
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  isMobileOrTablet ? 40 : 40,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 7);

function updateCameraPosition() {
  const width = window.innerWidth;
  if (width <= 480) camera.position.set(0, 0, 7);
  else if (width <= 768) camera.position.set(0, 0.1, 4);
  else camera.position.set(0, 0, 7);
  camera.updateProjectionMatrix();
}
updateCameraPosition();

// 🟢 Renderizador
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: true,
  preserveDrawingBuffer: true, // 🆕 necesario para poder capturar el canvas
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0xffffff, 0);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// 🆕 Sombras activas también en móvil, pero con menos calidad:
// PCFSoftShadowMap suaviza el borde con varios muestreos extra por
// píxel — en gama baja eso pesa. BasicShadowMap es sombra dura sin
// suavizado, mucho más barata para GPUs de teléfono.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = isMobileOrTablet ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileOrTablet ? 1.2 : 2));
container.appendChild(renderer.domElement);

requestAnimationFrame(() => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// 🟢 Controles
const controls = !isMobileOrTablet ? new OrbitControls(camera, renderer.domElement) : { update() { } };

// 🟢 Luces (igual que antes)
const light = new THREE.DirectionalLight(0xffffff, isMobileOrTablet ? 0.8 : 1);
light.position.set(0, 0, 10);
light.castShadow = true;
scene.add(light, new THREE.AmbientLight(0xffffff, isMobileOrTablet ? 0.6 : 0.5));

// 🟡 Configuración de sombra del light (una sola vez; el frustum se ajusta
// en updateStaticBounds según el tamaño real del viewport)
// 🆕 Mapa de sombra más chico en móvil (512) para no golpear el fill-rate;
// en desktop se mantiene en 1024 para que se vea más nítida.
const SHADOW_MAP_SIZE = isMobileOrTablet ? 512 : 1024;
light.shadow.mapSize.width = SHADOW_MAP_SIZE;
light.shadow.mapSize.height = SHADOW_MAP_SIZE;
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 40;
light.shadow.bias = -0.0015; // 🆕 evita "shadow acne" / bandas en superficies casi planas

// =========================================================
// 🟣 MUNDO FÍSICO (cannon-es)
// =========================================================
const BASE_GRAVITY = 9.82; // magnitud de la gravedad "normal" hacia abajo
const world = new CANNON.World();
world.gravity.set(0, -BASE_GRAVITY, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 10;
world.allowSleep = true;

const monedaMaterial = new CANNON.Material("moneda");
const sueloMaterial = new CANNON.Material("suelo");

world.addContactMaterial(
  new CANNON.ContactMaterial(monedaMaterial, sueloMaterial, {
    friction: 0.4,
    restitution: 0.35, // rebote sutil, no queremos que boten como pelotas
  })
);
world.addContactMaterial(
  new CANNON.ContactMaterial(monedaMaterial, monedaMaterial, {
    friction: 0.3,
    restitution: 0.2,
  })
);

// 🟣 Calcula el alto/ancho visible del viewport en z = 0, según el FOV de cámara
function getVisibleBounds() {
  const vFOV = (camera.fov * Math.PI) / 180;
  const depth = Math.abs(camera.position.z);
  const height = 2 * Math.tan(vFOV / 2) * depth;
  const width = height * camera.aspect;
  return { halfW: width / 2, halfH: height / 2 };
}

let bounds = getVisibleBounds();

// 🟣 Piso invisible (estático) — un poco más abajo del borde inferior visible
const floorBody = new CANNON.Body({ mass: 0, material: sueloMaterial });
floorBody.addShape(new CANNON.Plane());
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(floorBody);

// 🟣 Paredes laterales invisibles, para que las monedas no se salgan del footer
const wallLeft = new CANNON.Body({ mass: 0, material: sueloMaterial });
wallLeft.addShape(new CANNON.Plane());
wallLeft.quaternion.setFromEuler(0, Math.PI / 2, 0);
world.addBody(wallLeft);

const wallRight = new CANNON.Body({ mass: 0, material: sueloMaterial });
wallRight.addShape(new CANNON.Plane());
wallRight.quaternion.setFromEuler(0, -Math.PI / 2, 0);
world.addBody(wallRight);

// 🟣 Paredes de profundidad (fondo y frente), para contener el eje Z
const DEPTH_HALF = 0;
const BACKGROUND_COVERAGE = 1.05;

const wallBack = new CANNON.Body({ mass: 0, material: sueloMaterial });
wallBack.addShape(new CANNON.Plane()); // normal por defecto ya apunta a +z
world.addBody(wallBack);

const wallFront = new CANNON.Body({ mass: 0, material: sueloMaterial });
wallFront.addShape(new CANNON.Plane());
wallFront.quaternion.setFromEuler(0, Math.PI, 0); // voltea el normal a -z
world.addBody(wallFront);

// 🔴🟢 Planos DE DEPURACIÓN — visualizan dónde están fondo y frente.
const DEBUG_WALLS = false;
let wallBackMesh, wallFrontMesh;
if (DEBUG_WALLS) {
  const wallGeo = new THREE.PlaneGeometry(1, 1);
  wallBackMesh = new THREE.Mesh(
    wallGeo,
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  wallFrontMesh = new THREE.Mesh(
    wallGeo,
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  scene.add(wallBackMesh, wallFrontMesh);
}

// =========================================================
// 🔤 TEXTO COMO PNG (mismo ancho que el fondo, pegado al piso del viewport)
// =========================================================
let textoMesh = null;
let textoAspect = 1; // se calcula real cuando carga la imagen

new THREE.TextureLoader().load(
  "../src/img/dsain-texto.png", // 🔧 tu PNG con el texto ya diseñado
  (texture) => {
    texture.encoding = THREE.sRGBEncoding;

    // 🟢 esto es lo importante: el aspecto real del PNG, no un número inventado
    textoAspect = texture.image.width / texture.image.height;

    const textoMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true, // para que se respete el canal alfa del PNG
        roughness: 1,
        metalness: 0,
    });

    textoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), textoMaterial);
    textoMesh.receiveShadow = true;
    scene.add(textoMesh);

    actualizarTextoResponsive(); // por si la imagen carga después del primer resize
  },
  undefined,
  (err) => console.error("Error al cargar textura de texto:", err)
);

function actualizarTextoResponsive() {
  if (!textoMesh) return; // todavía no cargó el PNG

  // 🟢 mismo ancho que wallBackVisualMesh: bounds.halfW * 2 * BACKGROUND_COVERAGE
  const anchoDeseado = bounds.halfW * 2 * BACKGROUND_COVERAGE;
  const altoDeseado = anchoDeseado / textoAspect; // el alto sigue siendo proporcional al PNG del texto, no al del fondo

  textoMesh.scale.set(anchoDeseado, altoDeseado, 1);

  // 🟢 pegado al piso del viewport: el borde inferior del plano coincide
  // con -bounds.halfH (el mismo borde inferior que usa floorBody)
  textoMesh.position.set(0, -bounds.halfH + altoDeseado / 2, 0);
}

// =========================================================
// 🌈 FONDO ANIMADO (Grainient) — reemplaza la textura estática
// (antes: wallBackTexture / wallBackVisualMaterial con MeshStandardMaterial)
// =========================================================
function colorToVec3(hex) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

const grainientMaterial = new THREE.ShaderMaterial({
  vertexShader: GRAINIENT_VERTEX_SHADER,
  fragmentShader: GRAINIENT_FRAGMENT_SHADER,
  uniforms: {
    uTime: { value: 0 },
    uAspect: { value: 1 },
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
    uGrain: { value: GRAINIENT_CONFIG.grain },
    uGrainScale: { value: GRAINIENT_CONFIG.grainScale },
    uContrast: { value: GRAINIENT_CONFIG.contrast },
    uSaturation: { value: GRAINIENT_CONFIG.saturation },
  },
});

// El plano de fondo ya NO recibe sombra (un ShaderMaterial sin "lights: true"
// no participa del sistema de luces/sombras de three.js).
const wallBackVisualMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1), // el tamaño real se ajusta con .scale en updateStaticBounds
  grainientMaterial
);
scene.add(wallBackVisualMesh);

// 🌗 "Atrapa-sombras": plano transparente que SOLO dibuja la sombra que
// proyectan las monedas, montado justo delante del fondo animado, para no
// perder el efecto de sombra que antes caía sobre la textura PNG.
// Si no te interesa conservarlo, borra este bloque y el mesh no se crea.
const shadowCatcherMaterial = new THREE.ShadowMaterial({
  opacity: GRAINIENT_CONFIG.shadowOpacity,
});
const shadowCatcherMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  shadowCatcherMaterial
);
shadowCatcherMesh.receiveShadow = true;
scene.add(shadowCatcherMesh);

// =========================================================
// 🖱️ HOVER EN EL CTA ("Hablemos" / "Talk me") → sube el grano del fondo
// Busca el botón dentro del footer (section_once), no el del menú de arriba.
// =========================================================
let grainTarget = GRAINIENT_CONFIG.grain;
let angleTarget = GRAINIENT_CONFIG.angle; // 🌈 se mueve con el giroscopio en móvil (ver onDeviceMotion)

const ctaButton = container.querySelector(".boton_contact");
if (ctaButton) {
  ctaButton.addEventListener("mouseenter", () => {
    grainTarget = GRAINIENT_CONFIG.grainHover;
  });
  ctaButton.addEventListener("mouseleave", () => {
    grainTarget = GRAINIENT_CONFIG.grain;
  });
} else {
  console.warn('Grainient: no se encontró ".boton_contact" dentro de #section_once');
}

function updateStaticBounds() {
  bounds = getVisibleBounds();
  floorBody.position.set(0, -bounds.halfH, 0);
  wallLeft.position.set(-bounds.halfW, 0, 0);
  wallRight.position.set(bounds.halfW, 0, 0);
  wallBack.position.set(0, 0, -DEPTH_HALF);
  wallFront.position.set(0, 0, 1);

  // 🟡 Ajusta el fondo animado y el atrapa-sombras al ancho/alto real del
  // viewport (responsive). 105% en vez de 100% deja margen de sobra para
  // que no se vea el borde del plano en los extremos.
  const anchoFondo = bounds.halfW * 2 * BACKGROUND_COVERAGE;
  const altoFondo = bounds.halfH * 2 * BACKGROUND_COVERAGE;

  wallBackVisualMesh.scale.set(anchoFondo, altoFondo, 1);
  wallBackVisualMesh.position.set(0, 0, -DEPTH_HALF); // ligeramente detrás para evitar z-fighting con las monedas

  // Mismo tamaño, un pelín más cerca de la cámara para que no compita en
  // el z-buffer con el plano del fondo (ambos están casi en el mismo z).
  shadowCatcherMesh.scale.set(anchoFondo, altoFondo, 1);
  shadowCatcherMesh.position.set(0, 0, -DEPTH_HALF + 0.01);

  // El shader necesita el aspecto real del plano (== aspecto del viewport)
  // para no deformar el ruido/warp en pantallas anchas o angostas.
  grainientMaterial.uniforms.uAspect.value = anchoFondo / altoFondo;

  // 🟡 El frustum de sombra del light debe cubrir el mismo rango visible,
  // si no las sombras se recortan o desaparecen al hacer resize
  light.shadow.camera.left = -bounds.halfW - 1;
  light.shadow.camera.right = bounds.halfW + 1;
  light.shadow.camera.top = bounds.halfH + 1;
  light.shadow.camera.bottom = -bounds.halfH - 1;
  light.shadow.camera.updateProjectionMatrix();

  if (DEBUG_WALLS) {
    const w = bounds.halfW * 2.2;
    const h = bounds.halfH * 2.2;
    wallBackMesh.scale.set(w, h, 1);
    wallBackMesh.position.set(0, 0, -DEPTH_HALF);
    wallFrontMesh.scale.set(w, h, 1);
    wallFrontMesh.position.set(0, 0, DEPTH_HALF);
  }

  actualizarTextoResponsive(); // 🆕 recalcula el ancho/alto/posición del texto con los nuevos bounds
}
updateStaticBounds();

// =========================================================
// 🟠 "MOUSE FÍSICO" — una esfera invisible kinemática que sigue
// al cursor en el plano z=0 y colisiona de verdad con las monedas.
// =========================================================
const mouseMaterial = new CANNON.Material("mouse");
world.addContactMaterial(
  new CANNON.ContactMaterial(monedaMaterial, mouseMaterial, {
    friction: 0.2,
    restitution: 0.5,
  })
);

const MOUSE_RADIUS = 1;
const mouseBody = new CANNON.Body({
  mass: 0,
  type: CANNON.Body.KINEMATIC,
  shape: new CANNON.Sphere(MOUSE_RADIUS),
  material: mouseMaterial,
});
mouseBody.position.set(0, 0, 9999); // arranca fuera de escena
world.addBody(mouseBody);

const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2(10, 10);
const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // plano z = 0
const mouseWorldPos = new THREE.Vector3();
const mousePrevPos = new CANNON.Vec3(0, 0, 9999);
let mouseActive = false;

function onMouseMove(event) {
  mouseActive = true;
  const rect = container.getBoundingClientRect();
  mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}
function onMouseLeave() {
  mouseActive = false;
}
function enableMouse() {
  if (disableInteractions) return;
  container.addEventListener("mousemove", onMouseMove);
  container.addEventListener("mouseleave", onMouseLeave);
}
function disableMouse() {
  container.removeEventListener("mousemove", onMouseMove);
  container.removeEventListener("mouseleave", onMouseLeave);
  mouseActive = false;
}

// Actualiza posición y velocidad del cuerpo del mouse cada frame.
function updateMouseBody(delta) {
  if (disableInteractions || !mouseActive) {
    mouseBody.velocity.set(0, 0, 0);
    mouseBody.position.set(0, 0, 9999);
    mousePrevPos.set(0, 0, 9999);
    return;
  }

  raycaster.setFromCamera(mouseNDC, camera);
  if (raycaster.ray.intersectPlane(mousePlane, mouseWorldPos)) {
    const dt = Math.max(delta, 1 / 60);
    mouseBody.velocity.set(
      (mouseWorldPos.x - mousePrevPos.x) / dt,
      (mouseWorldPos.y - mousePrevPos.y) / dt,
      (mouseWorldPos.z - mousePrevPos.z) / dt
    );
    mouseBody.position.set(mouseWorldPos.x, mouseWorldPos.y, mouseWorldPos.z);
    mousePrevPos.set(mouseWorldPos.x, mouseWorldPos.y, mouseWorldPos.z);
  }
}

// =========================================================
// 📱 GRAVEDAD POR GIROSCOPIO (solo móvil)
// =========================================================
let gyroPermissionState = "unknown"; // 'unknown' | 'granted' | 'denied' | 'not-needed'

function needsGyroPermission() {
  return typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function";
}

function onDeviceMotion(event) {
  const g = event.accelerationIncludingGravity;
  if (!g || g.x === null || g.x === undefined) return;

  const gx = THREE.MathUtils.clamp(g.x, -BASE_GRAVITY, BASE_GRAVITY);
  const gy = THREE.MathUtils.clamp(-g.y, -BASE_GRAVITY, BASE_GRAVITY);
  world.gravity.set(gx, gy, 0); // z en 0: el eje Z lo maneja el resorte hacia el mouse

  // 🌈 El mismo vector de gravedad indica hacia dónde está "abajo" según la
  // inclinación del teléfono — lo usamos para rotar el ángulo del gradiente.
  const tiltDeg = THREE.MathUtils.radToDeg(Math.atan2(gy, gx));
  angleTarget = GRAINIENT_CONFIG.angle + tiltDeg * GRAINIENT_CONFIG.angleGyroSensitivity;
}

function startGyroListener() {
  window.addEventListener("devicemotion", onDeviceMotion);
}
function stopGyroListener() {
  window.removeEventListener("devicemotion", onDeviceMotion);
  world.gravity.set(0, -BASE_GRAVITY, 0); // vuelve a la gravedad normal hacia abajo
  angleTarget = GRAINIENT_CONFIG.angle; // 🌈 vuelve al ángulo base del fondo
}

function requestGyroPermissionOnce() {
  if (gyroPermissionState !== "unknown") return;

  if (!needsGyroPermission()) {
    gyroPermissionState = "not-needed"; // Android y navegadores sin permiso explícito
    startGyroListener();
    return;
  }

  const askPermission = () => {
    document.removeEventListener("touchend", askPermission);
    DeviceMotionEvent.requestPermission()
      .then((response) => {
        gyroPermissionState = response === "granted" ? "granted" : "denied";
        if (gyroPermissionState === "granted") startGyroListener();
      })
      .catch(() => {
        gyroPermissionState = "denied"; // se queda con gravedad fija hacia abajo
      });
  };
  document.addEventListener("touchend", askPermission, { once: true });
}

function enableGyroIfMobile() {
  if (!isMobileOrTablet) return;
  if (gyroPermissionState === "granted" || gyroPermissionState === "not-needed") {
    startGyroListener();
  } else {
    requestGyroPermissionOnce();
  }
}

function disableGyroListener() {
  if (!isMobileOrTablet) return;
  stopGyroListener();
}

// 🟢 Datos de las monedas (mesh + cuerpo físico)
let monedas = []; // { mesh, body }
let modeloBase = null;

// 🟢 Carga del modelo
const loader = new GLTFLoader();
loader.load(
  "../src/objt/piedepagina/monedadsain.glb",
  (gltf) => {
    modeloBase = gltf.scene;
    modeloBase.scale.set(ESCALA_MONEDAS, ESCALA_MONEDAS, ESCALA_MONEDAS);
    crearMonedas();
  },
  undefined,
  (err) => console.error("Error al cargar modelo:", err)
);

const baseMaterialColor = new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.6 });

function crearMonedas() {
  const escala = ESCALA_MONEDAS;
  const halfExtent = new CANNON.Vec3(escala * 0.9, escala * 0.9, escala * 0.35);
  const shape = new CANNON.Box(halfExtent);

  for (let i = 0; i < NUM_MONEDAS; i++) {
    const clone = modeloBase.clone(true);
    clone.rotation.x = Math.PI / 2;

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const caraSimbolo = clone.getObjectByName("carasimbolo");
    if (caraSimbolo) {
      caraSimbolo.traverse((child) => {
        if (child.isMesh) {
          const value = Math.random() * 0.8 + 0.5;
          const color = new THREE.Color(0, 0, value);
          child.material = baseMaterialColor.clone();
          child.material.color = color;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    scene.add(clone);

    const mass = 0.6 + Math.random() * 1.2;

    const body = new CANNON.Body({
      mass,
      shape,
      material: monedaMaterial,
      linearDamping: 0.15,
      angularDamping: 0.3,
    });

    world.addBody(body);
    monedas.push({ mesh: clone, body });
  }

  soltarMonedas();
}

function soltarMonedas() {
  monedas.forEach(({ body }, i) => {
    const x = (Math.random() * 2 - 1) * bounds.halfW * 0.7;
    const y = bounds.halfH + 1 + Math.random() * 1.5 + i * 0.4;
    const z = (Math.random() - 0.5) * 0.5;

    body.position.set(x, y, z);
    body.velocity.set((Math.random() - 0.5) * 1.5, 0, 0);
    body.angularVelocity.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    );
    body.quaternion.setFromEuler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    body.wakeUp();
  });
}

// 🟢 Loop de render
const clock = new THREE.Clock();
let rafId = null;
let backgroundTime = 0; // 🌈 tiempo acumulado del shader, solo avanza mientras el loop corre

function animate() {
  rafId = requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 1 / 30);
  updateMouseBody(delta);

  // 🌈 Se pausa automáticamente junto con todo lo demás vía startLoop/stopLoop
  backgroundTime += delta;
  grainientMaterial.uniforms.uTime.value = backgroundTime;

  // 🖱️ Transición suave del grano hacia el valor objetivo (hover o reposo),
  // independiente del framerate (exponential smoothing).
  const currentGrain = grainientMaterial.uniforms.uGrain.value;
  grainientMaterial.uniforms.uGrain.value = THREE.MathUtils.lerp(
    currentGrain,
    grainTarget,
    1 - Math.exp(-GRAINIENT_CONFIG.grainTransitionSpeed * delta)
  );

  // 📱 Transición suave del ángulo hacia el valor objetivo (giroscopio en
  // móvil, o el ángulo base si no hay giroscopio / estamos en desktop).
  const currentAngle = grainientMaterial.uniforms.uAngle.value;
  grainientMaterial.uniforms.uAngle.value = THREE.MathUtils.lerp(
    currentAngle,
    angleTarget,
    1 - Math.exp(-GRAINIENT_CONFIG.angleTransitionSpeed * delta)
  );

  const Z_SPRING = 3;
  monedas.forEach(({ body }) => {
    body.velocity.z -= body.position.z * Z_SPRING * delta;
  });

  world.step(1 / 60, delta, 3);

  monedas.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  controls.update();
  renderer.render(scene, camera);
}

function startLoop() {
  if (rafId !== null) return;
  clock.getDelta();
  animate();
}

function stopLoop() {
  if (rafId === null) return;
  cancelAnimationFrame(rafId);
  rafId = null;
}

// 🟢 IntersectionObserver (pausa inteligente)
let isInViewport = false;
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const visible = entry.isIntersecting;

      if (visible && !isInViewport) {
        isInViewport = true;
        enableMouse();
        enableGyroIfMobile();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileOrTablet ? 1.2 : 2));
        renderer.shadowMap.enabled = true;
        startLoop();
      } else if (!visible && isInViewport) {
        isInViewport = false;
        disableMouse();
        disableGyroListener();
        stopLoop();
      }
    });
  },
  { threshold: 0.1 }
);

observer.observe(container);

// 🟢 Resize
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  renderer.setSize(container.clientWidth, container.clientHeight);
  updateCameraPosition();
  updateStaticBounds();
});





