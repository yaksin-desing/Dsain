/* =========================================================
   pasillo.js · escena 3D del pasillo neoclásico
   three.js + JavaScript vanilla (módulo ES)
   - Solo la escena: sin panel de ajustes, sin botones y sin cámara automática
   - Controles siempre activos: arrastrar = mirar, WASD / flechas = caminar,
     rueda = avanzar, Shift = correr; en móvil joystick a la izquierda + arrastrar para mirar
   ========================================================= */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

/* Ruta del modelo, relativa a ESTE archivo (js/proyectos/pasillo.js → raíz del proyecto = ../../) */
const MODEL_URL = new URL('../../src/objt/aboutme/techo_longitudinal.glb', import.meta.url).href;



/* ===== valores fijos ===== */
const SUN_AZ = 80;          // ángulo de la luz (°)
const SUN_EL = 70;          // altura de la luz (°)
const RAYS = 1.10;          // intensidad de los rayos de luz
const REFLECTION = 0.70;    // fuerza del reflejo del piso
const EXPOSURE = 1.00;      // exposición
const QUALITY = 1.40;       // resolución (pixel ratio)

const cont = document.getElementById('escena3d');
if (cont) {
  // se inicia cuando la escena está cerca de la pantalla
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); init(); }
  }, { rootMargin: '300px' });
  io.observe(cont);
}

function init() {

  
  /* ---------- imagen PNG transparente sobre un plano ---------- */

  const PNG_URL = new URL(
    '../../src/img/about.png',
    import.meta.url
  ).href;

  const imageTextureLoader = new THREE.TextureLoader();

  imageTextureLoader.load(
    PNG_URL,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        8,
        renderer.capabilities.getMaxAnisotropy()
      );

      // Altura deseada del plano.
      const IMAGE_HEIGHT = 2;

      // Calcula el ancho según las dimensiones originales del PNG.
      const aspect = texture.image.width / texture.image.height;
      const IMAGE_WIDTH = IMAGE_HEIGHT * aspect;

      const imageGeometry = new THREE.PlaneGeometry(
        IMAGE_WIDTH,
        IMAGE_HEIGHT
      );

      const imageMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false
      });

const imagePlane = new THREE.Mesh(
  imageGeometry,
  imageMaterial
);

imagePlane.name = 'imagenPNG';
imagePlane.position.set(0, 1, 15);
imagePlane.renderOrder = 10;

scene.add(imagePlane);
window.pasilloImagePlane = imagePlane;

      console.log('PNG cargado correctamente:', PNG_URL);
    },
    undefined,
    (error) => {
      console.error('Error cargando el PNG:', PNG_URL, error);
    }
  );




  const $ = (id) => cont.querySelector('#' + id);
  const isTouch = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  const cw = () => Math.max(1, cont.clientWidth);
  const ch = () => Math.max(1, cont.clientHeight);

  /* ---------- renderer ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'escena-canvas'; canvas.tabIndex = 0;
  cont.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(QUALITY);
  renderer.setSize(cw(), ch(), false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = EXPOSURE;

  /* ---------- escena: cielo, entorno y luces ---------- */
  const scene = new THREE.Scene();
  (function makeSky() {
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 256;
    const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0.0, '#3f74d9'); gr.addColorStop(0.42, '#9fc4f2'); gr.addColorStop(0.5, '#e6eef8');
    gr.addColorStop(0.52, '#d9dde4'); gr.addColorStop(1.0, '#bfc5cf');
    g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
    const t = new THREE.CanvasTexture(cv);
    t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
  })();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0xd2bfa0, 0.7));
  const bounce = new THREE.DirectionalLight(0xffe6c4, 1.0);       // rebote cálido desde el piso
  bounce.position.set(0, -10, 0); bounce.target.position.set(0, 0, 0);
  scene.add(bounce, bounce.target);
  function addSkyLight(x, y, z, intensity, dist) {
    const l = new THREE.PointLight(0xfff1dc, intensity, dist, 2);
    l.position.set(x, y, z); scene.add(l);
  }
  /* coordenadas three.js = (x, z_blender, -y_blender) */
  for (const z of [9, 3, -3, -9]) addSkyLight(0, 10.2, z, 60, 16);   // 4 óculos del pasillo
  addSkyLight(0, 11.2, -14.9, 140, 22);                              // cúpula del final
  addSkyLight(0, 11.2, 15.0, 140, 22);                               // cúpula del comienzo

  /* ---------- reflejo real del piso (planar + Fresnel) ---------- */
  const reflShader = {
    name: 'FloorReflect',
    uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
                uStrength: { value: REFLECTION }, uPower: { value: 3.0 } },
    vertexShader: `
      uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWP;
      void main() {
        vUv = textureMatrix * vec4(position, 1.0);
        vWP = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 color; uniform sampler2D tDiffuse; uniform float uStrength; uniform float uPower;
      varying vec4 vUv; varying vec3 vWP;
      void main() {
        vec4 base = texture2DProj(tDiffuse, vUv);
        vec3 V = normalize(cameraPosition - vWP);
        float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), uPower);
        float a = clamp(uStrength * (0.4 + 0.6 * fres), 0.0, 1.0);
        gl_FragColor = vec4(base.rgb * color, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  };
  function floorGeometry() {           // corredor + dos rotondas (x,y de Blender; z de three = -y)
    const geos = [];
    const rect = new THREE.Shape();
    rect.moveTo(-6.4, -12); rect.lineTo(6.4, -12); rect.lineTo(6.4, 12); rect.lineTo(-6.4, 12); rect.closePath();
    geos.push(new THREE.ShapeGeometry(rect));
    const R = 6.8, t0 = -Math.asin(3 / R), t1 = Math.PI - t0;
    for (const sgn of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const a = t0 + (t1 - t0) * i / 48;
        pts.push(new THREE.Vector2(R * Math.cos(a), sgn * (15 + R * Math.sin(a))));
      }
      geos.push(new THREE.ShapeGeometry(new THREE.Shape(pts)));
    }
    return BufferGeometryUtils.mergeGeometries(geos);
  }
  const reflScale = isTouch ? 0.4 : 0.6;
  const reflector = new Reflector(floorGeometry(), {
    shader: reflShader, color: 0xffffff, clipBias: 0.003,
    textureWidth: Math.floor(cw() * QUALITY * reflScale), textureHeight: Math.floor(ch() * QUALITY * reflScale)
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = 0.012;
  reflector.material.transparent = true; reflector.material.depthWrite = false;
  reflector.renderOrder = 2;
  scene.add(reflector);

  /* ---------- rayos de sol por los óculos (ángulo fijo) ---------- */
  const SUN_DIR = new THREE.Vector3();
  const DOWN = new THREE.Vector3(0, -1, 0);
  const SHAFT_COLOR = new THREE.Color(1.0, 0.90, 0.70);
  const shaftInt = { value: 0.35 * RAYS }, patchInt = { value: 0.55 * RAYS }, shaftTime = { value: 0 };
  const shaftVS = `
    varying vec2 vUv; varying vec3 vWP; varying vec3 vN;
    void main() {
      vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const shaftFS = `
    uniform vec3 uColor; uniform float uInt; uniform float uTime;
    varying vec2 vUv; varying vec3 vWP; varying vec3 vN;
    void main() {
      vec3 V = normalize(cameraPosition - vWP);
      float edge = smoothstep(0.0, 0.6, abs(dot(V, normalize(vN))));
      float s = 0.62 + 0.38 * sin(vUv.x * 6.2831853 * 5.0 + 1.7 + uTime * 0.15) * sin(vUv.x * 6.2831853 * 3.0 + 0.4 - uTime * 0.1);
      float g = smoothstep(0.0, 0.10, 1.0 - vUv.y) * pow(vUv.y, 0.85);
      gl_FragColor = vec4(uColor, uInt * g * edge * s);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const patchFS = `
    uniform vec3 uColor; uniform float uInt; varying vec2 vUv; varying vec3 vWP; varying vec3 vN;
    void main() {
      float r = length(vUv - 0.5) * 2.0;
      gl_FragColor = vec4(uColor, uInt * (1.0 - smoothstep(0.25, 1.0, r)));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const shafts = new THREE.Group(); scene.add(shafts);
  const shaftList = [];
  function makeShaft(x, topY, z, rx, rz) {
    const geo = new THREE.CylinderGeometry(1, 1.28, 1, 40, 1, true); geo.translate(0, -0.5, 0);
    const beam = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: { uColor: { value: SHAFT_COLOR }, uInt: shaftInt, uTime: shaftTime },
      vertexShader: shaftVS, fragmentShader: shaftFS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.renderOrder = 4;
    const g = new THREE.Group(); g.position.set(x, topY, z); g.add(beam); shafts.add(g);
    const pg = new THREE.CircleGeometry(1, 48); pg.rotateX(-Math.PI / 2);
    const patch = new THREE.Mesh(pg, new THREE.ShaderMaterial({
      uniforms: { uColor: { value: SHAFT_COLOR }, uInt: patchInt },
      vertexShader: shaftVS, fragmentShader: patchFS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    patch.renderOrder = 3;
    const pgp = new THREE.Group(); pgp.add(patch); shafts.add(pgp);
    shaftList.push({
      apply() {
        const H = topY / -SUN_DIR.y;                                   // largo del haz hasta el piso
        g.quaternion.setFromUnitVectors(DOWN, SUN_DIR);
        beam.scale.set(rx, H, rz);
        pgp.position.set(x + SUN_DIR.x * H, 0.03, z + SUN_DIR.z * H);   // mancha de luz en el piso
        pgp.rotation.y = -Math.atan2(SUN_DIR.z, SUN_DIR.x);
        patch.scale.set(rx * 1.28 / Math.abs(SUN_DIR.y), 1, rz * 1.28);
      }
    });
  }
  for (const z of [9, 3, -3, -9]) makeShaft(0, 10.9, z, 1.05, 1.15);   // 4 óculos del pasillo
  makeShaft(0, 11.4, -14.9, 1.55, 1.55);                               // cúpula del final
  makeShaft(0, 11.4, 15.0, 1.55, 1.55);                                // cúpula del comienzo
  {
    const az = THREE.MathUtils.degToRad(SUN_AZ), el = THREE.MathUtils.degToRad(SUN_EL);
    SUN_DIR.set(Math.cos(el) * Math.sin(az), -Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
    for (const s of shaftList) s.apply();
  }

  /* ---------- cámara y movimiento ---------- */
  const camera = new THREE.PerspectiveCamera(65, cw() / ch(), 0.1, 250);
  camera.rotation.order = 'YXZ';
  camera.position.set(0, 1, 17);
  let yaw = 0, pitch = 0.05;
  const keys = Object.create(null);
  const cols = [];
  const inside = (x, z) => {
    if (Math.abs(z) <= 12.05) return Math.abs(x) <= 5.7;
    const cz = z < 0 ? -14.95 : 15.0;
    return Math.hypot(x, z - cz) <= 6.2;
  };
  const free = (x, z) => {
    if (!inside(x, z)) return false;
    for (const c of cols) if (Math.hypot(x - c.x, z - c.y) < 0.7) return false;
    return true;
  };
  function move(f, s) {
    const sx = Math.sin(yaw), cz = Math.cos(yaw);
    const nx = camera.position.x + (-sx * f) + (cz * s), nz = camera.position.z + (-cz * f) + (-sx * s);
    if (free(nx, nz)) { camera.position.x = nx; camera.position.z = nz; }
    else if (free(nx, camera.position.z)) camera.position.x = nx;
    else if (free(camera.position.x, nz)) camera.position.z = nz;
  }

  /* ---------- controles (siempre activos) ---------- */
  const look = { id: null, x: 0, y: 0 };
  const joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  const joyEl = $('esc-joy'), knob = joyEl ? joyEl.firstElementChild : null;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const r = cont.getBoundingClientRect();
    if (joyEl && e.pointerType === 'touch' && (e.clientX - r.left) < r.width * 0.4 && joy.id === null) {
      joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = 0; joy.dy = 0;
      joyEl.style.display = 'block'; joyEl.style.left = (e.clientX - r.left) + 'px'; joyEl.style.top = (e.clientY - r.top) + 'px';
      if (knob) knob.style.transform = 'translate(0,0)';
    } else if (look.id === null) {
      look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId === look.id) {
      yaw -= (e.clientX - look.x) * 0.0042; pitch -= (e.clientY - look.y) * 0.0042;
      pitch = Math.max(-1.25, Math.min(1.25, pitch)); look.x = e.clientX; look.y = e.clientY;
    } else if (e.pointerId === joy.id) {
      const dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
      const L = Math.hypot(dx, dy) || 1, k = Math.min(L, 60) / L;
      joy.dx = dx * k / 60; joy.dy = dy * k / 60;
      if (knob) knob.style.transform = 'translate(' + (joy.dx * 38) + 'px,' + (joy.dy * 38) + 'px)';
    }
  });
  const endPointer = (e) => {
    if (e.pointerId === look.id) look.id = null;
    if (e.pointerId === joy.id) { joy.id = null; joy.dx = 0; joy.dy = 0; if (joyEl) joyEl.style.display = 'none'; }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); move(-e.deltaY * 0.01, 0); }, { passive: false });
  const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
  window.addEventListener('keydown', (e) => {
    if (typing(e)) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  /* ---------- tamaño del contenedor ---------- */
  function onResize() {
    camera.aspect = cw() / ch(); camera.updateProjectionMatrix();
    renderer.setSize(cw(), ch(), false);
    reflector.getRenderTarget().setSize(Math.floor(cw() * QUALITY * reflScale), Math.floor(ch() * QUALITY * reflScale));
  }
  new ResizeObserver(onResize).observe(cont);

  /* ---------- carga del modelo ---------- */
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const bar = cont.querySelector('.esc-bar i');
  loader.load(MODEL_URL, (gltf) => {
    const root = gltf.scene;
    const maxA = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const seen = new Set();
    root.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (seen.has(m)) continue; seen.add(m);
        for (const k of ['map', 'normalMap', 'emissiveMap']) if (m[k]) m[k].anisotropy = maxA;
        if (/Piso/i.test(m.name)) m.envMapIntensity = 0.45;
      }
    });
    scene.add(root);
    root.updateMatrixWorld(true);
    const tmp = new THREE.Matrix4(), p = new THREE.Vector3();       // colisión simple con columnas
    root.traverse((o) => {
      if (!/Col/i.test(o.name || '')) return;
      if (o.isInstancedMesh) {
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, tmp); tmp.premultiply(o.matrixWorld); p.setFromMatrixPosition(tmp);
          cols.push(new THREE.Vector2(p.x, p.z));
        }
      } else if (o.isMesh) { p.setFromMatrixPosition(o.matrixWorld); cols.push(new THREE.Vector2(p.x, p.z)); }
    });
    cont.classList.add('cargado');
  }, (xhr) => {
    if (xhr.lengthComputable && bar) bar.style.width = (xhr.loaded / xhr.total * 100) + '%';
  }, (err) => {
    console.error('No se pudo cargar el modelo:', MODEL_URL, err);
  });

  /* ---------- bucle ---------- */
  let last = performance.now(), visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(cont);
  renderer.setAnimationLoop((t) => {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!visible) return;
    const sprint = (keys.ShiftLeft || keys.ShiftRight) ? 2 : 1;
    let f = 0, s = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1;
    if (keys.KeyS || keys.ArrowDown) f -= 1;
    if (keys.KeyD) s += 1;
    if (keys.KeyA) s -= 1;
    if (keys.ArrowLeft) yaw += 1.6 * dt;
    if (keys.ArrowRight) yaw -= 1.6 * dt;
    f += -joy.dy; s += joy.dx;
    if (f || s) move(f * 3.2 * sprint * dt, s * 3.2 * sprint * dt);
    shaftTime.value = t / 1000;
    camera.rotation.set(pitch, yaw, 0);
    renderer.render(scene, camera);
  });
}