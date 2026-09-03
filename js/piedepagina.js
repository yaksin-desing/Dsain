import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "https://cdn.skypack.dev/cannon-es@0.20.0";

// 🟢 Contenedor
const container = document.getElementById("section_once");

// 🟢 Detección de dispositivo y ancho
const isMobileOrTablet = /Mobi|Android|iPad|iPod/i.test(navigator.userAgent);
const disableInteractions = window.innerWidth <= 770;

// 🟢 Cuántas monedas caen (antes era una pared de 60-170, ahora solo un puñado)
const NUM_MONEDAS = isMobileOrTablet ? 7 : 17;

// 🟢 Escena y cámara
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  isMobileOrTablet ? 50 : 55,
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
const controls = !isMobileOrTablet ? new OrbitControls(camera, renderer.domElement) : { update() {} };

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
// OJO: lo bajé de 1.5 a 0.6 — el mouse "vive" en el plano z=0 (ver más abajo),
// así que entre más angosto sea este rango, más consistente es la colisión
// mouse-moneda (si lo dejas muy ancho, las monedas pueden quedar demasiado
// lejos del plano del mouse y nunca tocarlo).
const DEPTH_HALF = 0.6;
const wallBack = new CANNON.Body({ mass: 0, material: sueloMaterial });
wallBack.addShape(new CANNON.Plane()); // normal por defecto ya apunta a +z
world.addBody(wallBack);

const wallFront = new CANNON.Body({ mass: 0, material: sueloMaterial });
wallFront.addShape(new CANNON.Plane());
wallFront.quaternion.setFromEuler(0, Math.PI, 0); // voltea el normal a -z
world.addBody(wallFront);

// 🔴🟢 Planos DE DEPURACIÓN — visualizan dónde están fondo y frente.
// Pon DEBUG_WALLS en true si necesitas verlos de nuevo más adelante.
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

// 🟡 Pared visual de fondo (PNG) — coincide con wallBack físico y recibe sombra
// de las monedas. Cambia la ruta por la de tu imagen.
const wallBackTexture = new THREE.TextureLoader().load(
  "../src/img/proyectounodd.png"
);
wallBackTexture.encoding = THREE.sRGBEncoding; // three 0.129 usa encoding, no colorSpace

const wallBackVisualMaterial = new THREE.MeshStandardMaterial({
  map: wallBackTexture,
  transparent: false, // por si el PNG trae canal alfa
  roughness: 1,
  metalness: 0,
});

const wallBackVisualMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1), // el tamaño real se ajusta con .scale en updateStaticBounds
  wallBackVisualMaterial
);
wallBackVisualMesh.receiveShadow = true;
scene.add(wallBackVisualMesh);

function updateStaticBounds() {
  bounds = getVisibleBounds();
  floorBody.position.set(0, -bounds.halfH, 0);
  wallLeft.position.set(-bounds.halfW, 0, 0);
  wallRight.position.set(bounds.halfW, 0, 0);
  wallBack.position.set(0, 0, -DEPTH_HALF);
  wallFront.position.set(0, 0, DEPTH_HALF);

  // 🟡 Ajusta la pared visual al ancho/alto real del viewport (responsive)
  wallBackVisualMesh.scale.set(bounds.halfW * 2, bounds.halfH * 2, 1);
  wallBackVisualMesh.position.set(0, 0, -DEPTH_HALF - 0.02); // ligeramente detrás para evitar z-fighting con las monedas

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

const MOUSE_RADIUS = 0.6;
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
// Se le da velocidad real (no solo posición) para que cannon-es
// resuelva el choque como un cuerpo en movimiento, no uno fijo.
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
// 📱 GRAVEDAD POR GIROSCOPIO (solo móvil) — el "lado más bajo" del
// teléfono, según su inclinación real, se vuelve el punto de atracción.
// Usamos accelerationIncludingGravity porque el sensor entrega
// directamente el vector de gravedad en los ejes de la pantalla
// (x = izquierda/derecha, y = arriba/abajo), que es justo lo que
// necesitamos para mover world.gravity.
// =========================================================
let gyroPermissionState = "unknown"; // 'unknown' | 'granted' | 'denied' | 'not-needed'

function needsGyroPermission() {
  return typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function";
}

function onDeviceMotion(event) {
  const g = event.accelerationIncludingGravity;
  if (!g || g.x === null || g.x === undefined) return;

  // Si en tu teléfono se siente "al revés" (las monedas ruedan al lado
  // contrario de la inclinación), invierte el signo de gx y/o gy aquí.
  const gx = THREE.MathUtils.clamp(g.x, -BASE_GRAVITY, BASE_GRAVITY);
  const gy = THREE.MathUtils.clamp(-g.y, -BASE_GRAVITY, BASE_GRAVITY);
  world.gravity.set(gx, gy, 0); // z en 0: el eje Z lo maneja el resorte hacia el mouse
}

function startGyroListener() {
  window.addEventListener("devicemotion", onDeviceMotion);
}
function stopGyroListener() {
  window.removeEventListener("devicemotion", onDeviceMotion);
  world.gravity.set(0, -BASE_GRAVITY, 0); // vuelve a la gravedad normal hacia abajo
}

// iOS 13+ exige que el permiso se pida dentro de un gesto real del
// usuario (touch/click) — por eso se engancha al primer toque en vez
// de pedirse automáticamente al cargar la página.
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
    startGyroListener(); // ya teníamos permiso, solo reanuda el listener
  } else {
    requestGyroPermissionOnce(); // primera vez (o permiso aún no pedido)
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
    modeloBase.scale.set(0.4, 0.4, 0.4);
    crearMonedas();
  },
  undefined,
  (err) => console.error("Error al cargar modelo:", err)
);

const baseMaterialColor = new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.6 });

function crearMonedas() {
  const escala = 0.4;
  // Medio ancho/alto aproximado de la moneda ya escalada, para la caja de colisión
  const halfExtent = new CANNON.Vec3(escala * 0.9, escala * 0.9, escala * 0.35);
  const shape = new CANNON.Box(halfExtent);

  for (let i = 0; i < NUM_MONEDAS; i++) {
    const clone = modeloBase.clone(true);
    clone.rotation.x = Math.PI / 2;

    // 🔧 FIX: castShadow/receiveShadow puestos en el Group raíz (clone) no
    // se propagan a los meshes hijos — three.js solo revisa esas flags en
    // los objetos que realmente son Mesh al construir el shadow map. Por
    // eso las monedas no proyectaban sombra: había que recorrer el árbol.
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
          // El traverse de arriba ya dejó castShadow/receiveShadow en
          // `child`; reemplazar el material no borra esas flags, pero lo
          // dejamos explícito por si en el futuro se clona el mesh entero.
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    scene.add(clone);

    // Peso aleatorio -> masas distintas, cada moneda cae/reacciona distinto
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

  soltarMonedas(); // primera caída al cargar
}

// 🟣 Reposiciona las monedas arriba del viewport y las "suelta" con velocidad/rotación aleatoria
function soltarMonedas() {
  monedas.forEach(({ body }, i) => {
    const x = (Math.random() * 2 - 1) * bounds.halfW * 0.7;
    const y = bounds.halfH + 1 + Math.random() * 1.5 + i * 0.4; // escalonadas para que no caigan todas pegadas
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

// 🟢 Loop de render — con arranque/parada real (no solo "saltar trabajo")
const clock = new THREE.Clock();
let rafId = null;

function animate() {
  rafId = requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 1 / 30);
  updateMouseBody(delta);

  // 🟣 Fuerza suave hacia z=0 — el mouse solo colisiona en ese plano,
  // así que evitamos que las monedas se alejen tanto que dejen de tocarlo.
  const Z_SPRING = 3.5;
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
  if (rafId !== null) return; // ya está corriendo
  clock.getDelta(); // descarta el tiempo acumulado mientras estuvo detenido
  animate();
}

function stopLoop() {
  if (rafId === null) return; // ya está detenido
  cancelAnimationFrame(rafId);
  rafId = null;
}

// 🟢 IntersectionObserver (pausa inteligente) — al salir detiene el loop
// por completo con cancelAnimationFrame (cero trabajo, cero recursos);
// al reentrar lo reanuda desde donde quedó la escena, sin reiniciar posiciones.
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