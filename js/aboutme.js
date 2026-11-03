import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

/* Ruta del modelo, relativa a ESTE archivo (js/proyectos/pasillo.js → raíz del proyecto = ../../) */
const MODEL_URL = new URL('../src/objt/aboutme/techo_longitudinal.glb', import.meta.url).href;



/* ===== valores fijos ===== */
const SUN_AZ = 80;          // ángulo de la luz (°)
const SUN_EL = 70;          // altura de la luz (°)
const RAYS = 1.10;          // intensidad de los rayos de luz
const REFLECTION = 0.30;    // fuerza del reflejo del piso
const EXPOSURE = 1.2;      // exposición
const QUALITY = 1;       // resolución (pixel ratio)

/* ===== TEXTO EN CILINDRO "DSAINS" (todo lo que puedes ajustar) =====
   Cambia un valor y recarga. También puedes tocarlo en vivo desde la consola:
     pasilloTexto.config.radio = 4;  pasilloTexto.reconstruir();   // radio, tamaño, separaciones, etc.
     pasilloTexto.config.velocidad = 60;  pasilloTexto.aplicar();  // velocidad, color, posición, opacidad */
const TEXTO = {
  palabra: 'DSAINS',
  repeticiones: 7,              // cuántas veces se repite la palabra alrededor del cilindro
  fuente: new URL('../src/fonts/false_Semi-bold.json', import.meta.url).href,

  radio: 2.7,                   // radio del cilindro (unidades de la escena)
  tamano: 0.2,                  // alto de las letras
  grosor: 0,                    // profundidad de la letra (0 = plana)
  posicion: { x: 0, y: 1.2, z: 15 },   // centro del cilindro (el piso está en y = 0)

  velocidad: -20,               // grados por segundo (negativo = gira al revés, 0 = quieto)
  anguloInicial: 0,             // giro base de todo el cilindro (°)

  color: '#ffffff',
  opacidad: 1,

  separacionLetras: 0.08,       // espacio entre letras
  separacionPalabras: 0.9,      // espacio entre una palabra y la siguiente
  cerrarCirculo: true,          // true = reparte las palabras para cerrar el círculo exacto (ignora separacionPalabras)

  caraHacia: 'afuera',          // 'afuera' = se lee desde fuera del cilindro, 'adentro' = desde dentro

  /* rotación de CADA letra sobre su propio centro, en grados */
  rotacionLetra: { x: -40, y: 0, z: 0 },   // se aplica igual a todas las letras
  rotacionPorLetra: [                    // extra por posición dentro de la palabra: D, S, A, I, N, S
    // { x: 0, y: 0, z: 0 },   // D
    // { x: 0, y: 0, z: 15 },  // S
    // { x: 0, y: 0, z: 0 },   // A
    // { x: 0, y: 0, z: 0 },   // I
    // { x: 0, y: 0, z: 0 },   // N
    // { x: 0, y: 0, z: 0 },   // S
  ],

  /* imagen PNG que se coloca entre cada palabra (después de cada una, así el patrón cierra el círculo) */
  imagen: {
    activa: true,
    url: new URL('../src/img/star.png', import.meta.url).href,   // cambia por tu PNG
    alto: 0.1,                     // alto de la imagen (el ancho sale de sus proporciones)
    orden: 10,                     // orden de renderizado: mayor = se dibuja después, encima de lo transparente (piso 2, rayos 3-4)
    y: 0,                          // subir/bajar la imagen respecto a las letras
    rotacion: { x: -40, y: 0, z: 0 } // grados, igual que las letras
  },
};

/* ===== SEGUIMIENTO DE CABEZA (experimento: solo PC con mouse y cámara) =====*/

const CABEZA = {
  activa: true,                 // false = no se crea nada (ni el botón)
  boton: true,                  // false = sin botón (actívalo desde la consola con pasilloCabeza.activar())
  vistaAutoOcultar: true,       // true = al terminar la calibración el canvas se minimiza solo al botón-icono
  vistaIcono: '../src/img/iconoscam.svg',               // tu icono personalizado: ruta/URL de una imagen (png, svg, webp…).
                                //   Ej: new URL('../src/img/ojo.svg', import.meta.url).href   ('' = icono por defecto)
  vistaIconoSvg: '',            // alternativa: pega aquí el CÓDIGO de tu SVG animado (<svg ...>...</svg>) entre comillas invertidas ` `
  vistaIconoEscala: 70,         // tamaño del dibujo dentro del botón, en % (sube a 80–100 si tu SVG ya trae su propio margen)
  vistaIconoTam: 50,            // tamaño del botón-icono en px
  vistaAncho: 240,              // ancho del canvas en px
  debug: true,                  // true = muestra un panelito con el estado (cara detectada, calibración, valores); ponlo en false al terminar
  /* --- textos del popup de permiso de cámara --- */
  textos: {
    titulo: 'Activar la interacción con tu rostro',
    texto: 'Para que la escena reaccione al movimiento de tu cabeza necesitamos usar tu cámara. ' +
           'La usamos únicamente para detectar la posición de tu rostro en tiempo real: el video se procesa en tu ' +
           'dispositivo y no se graba, no se guarda ni se envía a ningún servidor.',
    aceptar: 'Permitir cámara',
    cancelar: 'Ahora no',
    tituloInfo: 'Cámara no disponible',
    bloqueado: 'El acceso a la cámara está bloqueado en tu navegador. Habilítalo desde el icono del candado junto a la ' +
               'dirección de la página y vuelve a pulsar el botón.',
    error: 'No se pudo acceder a la cámara. Comprueba que no la esté usando otra aplicación e inténtalo de nuevo.',
    entendido: 'Entendido',
  },

  /* --- tu equipo (medidas reales: son lo que hace que el efecto sea una ventana de verdad) --- */
  pantallaAnchoCm: 31,          // ancho FÍSICO de la imagen de tu pantalla en cm (MacBook 14" ≈ 30, 16" ≈ 34, monitor 27" ≈ 60)
  distanciaCm: 60,              // distancia habitual de tus ojos a la pantalla en cm
  camFovH: 70,                  // campo de visión horizontal de tu webcam en ° (la mayoría: 65–78)

  /* --- comportamiento --- */
  distanciaVentana: 8,          // profundidad (unidades de escena) del "cristal": lo que está ahí no se mueve,
                                //   lo más cercano se mueve al lado contrario de tu rostro, lo lejano apenas se mueve
  intensidad: 0.5,              // 1 = ventana físicamente exacta; menos = movimiento más sutil (0.3–0.7 es lo habitual)
  maxCm: 1.7,                     // máximo desplazamiento lateral/vertical de la cabeza que se tiene en cuenta (cm)
  maxCmZ: 7,                    // máximo acercarte / alejarte (cm)
  zonaMuertaCm: 0.5,            // movimientos menores a esto (temblor de la detección) se ignoran
  fovVentana: 0,                // 0 = no tocar el FOV de la cámara
  suavizado: 5,                 // mayor = responde más rápido, menor = más suave
  calibrarFrames: 20,           // lecturas para fijar tu posición neutra al activar

  libUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs',
  wasmUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
  modeloUrl: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
};

const cont = document.getElementById('escena3d');
if (cont) {
  // se inicia cuando la escena está cerca de la pantalla
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); init(); }
  }, { rootMargin: '300px' });
  io.observe(cont);
}

function init() {

    /* ---------- aviso de "escena lista" para la transición ---------- */
  let pendientes = 2; // modelo .glb + imagen PNG
  const listo = () => {
    if (--pendientes > 0) return;
    // dos frames para asegurar que la escena ya se dibujó
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__escena3dListo = true;
      window.dispatchEvent(new CustomEvent('escena3d:ready'));
    }));
  };

  
  /* ---------- imagen PNG transparente sobre un plano ---------- */

  const PNG_URL = new URL(
    '../src/img/about.png',
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
      const IMAGE_HEIGHT = 3;

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
imagePlane.position.set(0, 1.5, 15);
imagePlane.renderOrder = 10;

scene.add(imagePlane);
window.pasilloImagePlane = imagePlane;

      console.log('PNG cargado correctamente:', PNG_URL);
      listo();
    },
    undefined,
    (error) => {
      console.error('Error cargando el PNG:', PNG_URL, error);
      listo();
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
  /* AJUSTE 1: el haz se desvanece según la altura real (vWP.y) y se descarta
     cerca del piso, así su pared ya no corta el mármol y no deja los puntos. */
  const shaftFS = `
    uniform vec3 uColor; uniform float uInt; uniform float uTime;
    varying vec2 vUv; varying vec3 vWP; varying vec3 vN;
    void main() {
      if (vWP.y < 0.05) discard;
      vec3 V = normalize(cameraPosition - vWP);
      float edge = smoothstep(0.0, 0.6, abs(dot(V, normalize(vN))));
      float s = 0.62 + 0.38 * sin(vUv.x * 6.2831853 * 5.0 + 1.7 + uTime * 0.15) * sin(vUv.x * 6.2831853 * 3.0 + 0.4 - uTime * 0.1);
      float g = smoothstep(0.0, 0.10, 1.0 - vUv.y) * pow(vUv.y, 0.85);
      float floorFade = smoothstep(0.05, 1.2, vWP.y);   // 0 en el piso, 1 a 1.2 m de altura
      gl_FragColor = vec4(uColor, uInt * g * edge * s * floorFade);
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

  /* AJUSTE 2: el espejo del piso no dibuja los rayos (evita que se dupliquen
     o se mezclen mal dentro del render target del reflector). */
  {
    const reflRender = reflector.onBeforeRender;
    reflector.onBeforeRender = function (...args) {
      shafts.visible = false;
      reflRender.apply(this, args);
      shafts.visible = true;
    };
  }

  /* ---------- texto "DSAINS" en cilindro ---------- */
  const textoCil = (function () {
    const rad = THREE.MathUtils.degToRad;
    const grupo = new THREE.Group();
    scene.add(grupo);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
    const materialImg = new THREE.MeshBasicMaterial({
      transparent: true, alphaTest: 0.01, side: THREE.DoubleSide, depthWrite: false, toneMapped: false
    });
    let fuente = null;
    let textura = null, imgListo = false;           // imgListo = ya se intentó cargar el PNG (éxito o error)
    let geos = [];
    let giro = 0;                                   // ángulo acumulado por la animación (°)

    function aplicar() {                            // cambios que NO necesitan reconstruir
      grupo.position.set(TEXTO.posicion.x, TEXTO.posicion.y, TEXTO.posicion.z);
      material.color.set(TEXTO.color);
      material.opacity = TEXTO.opacidad;
      material.transparent = TEXTO.opacidad < 1;
      material.needsUpdate = true;
      grupo.rotation.y = rad(TEXTO.anguloInicial + giro);
    }

    function limpiar() {
      grupo.clear();
      geos.forEach((g) => g.dispose());
      geos = [];
    }

    function construir() {                          // radio, tamaño, separaciones, repeticiones, rotaciones
      if (!fuente || !imgListo) return;
      limpiar();

      const R = Math.max(0.1, TEXTO.radio);
      const dir = TEXTO.caraHacia === 'adentro' ? -1 : 1;
      const chars = [...TEXTO.palabra];

      // 1) una geometría por letra distinta, con el pivote en su centro
      const glyphs = {};
      let minY = Infinity, maxY = -Infinity;
      for (const ch of new Set(chars)) {
        const g = new TextGeometry(ch, {
          font: fuente, size: TEXTO.tamano, height: TEXTO.grosor,
          curveSegments: 10, bevelEnabled: false
        });
        g.computeBoundingBox();
        const b = g.boundingBox;
        minY = Math.min(minY, b.min.y); maxY = Math.max(maxY, b.max.y);
        glyphs[ch] = { g, w: b.max.x - b.min.x, cx: (b.min.x + b.max.x) / 2 };
        geos.push(g);
      }
      const cy = (minY + maxY) / 2;                 // mismo centro vertical para todas (mantiene la línea base)
      for (const k in glyphs) glyphs[k].g.translate(-glyphs[k].cx, -cy, 0);

      // 2) reparto a lo largo del arco
      const gapL = TEXTO.separacionLetras;
      const sumW = chars.reduce((a, c) => a + glyphs[c].w, 0);
      const wordLen = sumW + gapL * (chars.length - 1);
      const nW = Math.max(1, Math.round(TEXTO.repeticiones));
      const IMG = TEXTO.imagen;
      const hayImg = !!(IMG && IMG.activa && textura);
      const imgW = hayImg ? IMG.alto * (textura.image.width / textura.image.height) : 0;
      const huecos = hayImg ? 2 : 1;                // con imagen: un hueco antes y otro después de ella
      const gapW = TEXTO.cerrarCirculo
        ? Math.max(0, (2 * Math.PI * R - nW * (wordLen + imgW)) / (huecos * nW))
        : TEXTO.separacionPalabras;

      let s = 0;                                    // longitud de arco recorrida
      for (let w = 0; w < nW; w++) {
        chars.forEach((c, i) => {
          const { g, w: gw } = glyphs[c];
          const th = dir * (s + gw / 2) / R;        // ángulo del centro de esta letra

          const pivote = new THREE.Group();         // coloca la letra sobre el cilindro
          pivote.position.set(R * Math.sin(th), 0, R * Math.cos(th));
          pivote.rotation.y = th + (dir < 0 ? Math.PI : 0);

          const mesh = new THREE.Mesh(g, material); // rotación propia de la letra
          mesh.renderOrder = 9;                     // si opacidad < 1 también debe dibujarse después de lo transparente
          const extra = TEXTO.rotacionPorLetra[i] || {};
          mesh.rotation.set(
            rad((TEXTO.rotacionLetra.x || 0) + (extra.x || 0)),
            rad((TEXTO.rotacionLetra.y || 0) + (extra.y || 0)),
            rad((TEXTO.rotacionLetra.z || 0) + (extra.z || 0))
          );
          pivote.add(mesh);
          grupo.add(pivote);

          s += gw + (i < chars.length - 1 ? gapL : 0);
        });

        if (hayImg) {                               // imagen entre esta palabra y la siguiente
          s += gapW;
          const th = dir * (s + imgW / 2) / R;
          const pivote = new THREE.Group();
          pivote.position.set(R * Math.sin(th), IMG.y || 0, R * Math.cos(th));
          pivote.rotation.y = th + (dir < 0 ? Math.PI : 0);

          const geo = new THREE.PlaneGeometry(imgW, IMG.alto);
          geos.push(geo);
          const plano = new THREE.Mesh(geo, materialImg);
          plano.renderOrder = IMG.orden != null ? IMG.orden : 10;   // después del reflector y los rayos
          const rot = IMG.rotacion || {};
          plano.rotation.set(rad(rot.x || 0), rad(rot.y || 0), rad(rot.z || 0));
          pivote.add(plano);
          grupo.add(pivote);
          s += imgW + gapW;
        } else {
          s += gapW;
        }
      }
      aplicar();
    }

    function update(dt) {
      if (!TEXTO.velocidad) return;
      giro += TEXTO.velocidad * dt;
      grupo.rotation.y = rad(TEXTO.anguloInicial + giro);
    }

    new THREE.TextureLoader().load(TEXTO.imagen.url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textura = t;
      materialImg.map = t;
      materialImg.needsUpdate = true;
      imgListo = true;
      construir();
    }, undefined, (err) => {
      console.error('No se pudo cargar el PNG del cilindro:', TEXTO.imagen.url, err);
      imgListo = true;                              // sigue sin imagen, solo con el texto
      construir();
    });

    new FontLoader().load(TEXTO.fuente, (f) => { fuente = f; construir(); }, undefined,
      (err) => console.error('No se pudo cargar la fuente:', TEXTO.fuente, err));

    aplicar();
    window.pasilloTexto = { config: TEXTO, reconstruir: construir, aplicar, grupo };
    return { update };
  })();

  /* ---------- ***********cámara y movimiento********* ---------- */
  const camera = new THREE.PerspectiveCamera(65, cw() / ch(), 0.1, 250);
  camera.rotation.order = 'YXZ';
  camera.position.set(0, 1.5, 19);
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

  /* ---------- seguimiento de cabeza (experimento: solo PC con cámara) ---------- */
  const cabeza = (function () {
    const cfg = CABEZA;
    const clamp = THREE.MathUtils.clamp;
    const soportado = cfg.activa && !isTouch
      && matchMedia('(hover: hover) and (pointer: fine)').matches
      && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    const est = { activo: false, ex: 0, ey: 0, zc: 0 };       // valores suavizados
    const obj = { ex: 0, ey: 0, zc: 0 };                      // valores objetivo (lo que lee la cámara)
    const neutral = { x: 0.5, y: 0.5, d: 0.1 };               // posición de referencia de tu cara
    const cal = { n: 0, x: 0, y: 0, d: 0, listo: false };
    const base = new THREE.Vector3(), off = new THREE.Vector3();
    let landmarker = null, video = null, stream = null, lastVT = -1, aplicada = false;
    let fovOriginal = null;

    /* ---- interfaz: botón-icono, panel con la cámara y popup de permiso ---- */
    let vista = null, vctx = null, estadoTxt = '';
    let vWrap = null, vIcon = null, vMin = false, modal = null;
    let sesion = 0, activando = false;                        // sesion: invalida activaciones interrumpidas
    const T = cfg.textos;
    const LS_CAM = 'pasilloCamaraOk';
    const SVG_POWER = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round"><path d="M12 3v9"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg>';

    function refrescarUI() {                                  // el icono solo se ve cuando el panel está cerrado
      const abierto = !!vWrap && !vMin;
      if (vWrap) vWrap.style.display = abierto ? 'block' : 'none';
      if (vIcon) {
        vIcon.style.display = abierto ? 'none' : 'flex';
        vIcon.style.borderColor = est.activo ? '#0051ff' : 'rgba(255,255,255,.6)';   // verde = interacción activa
        vIcon.title = est.activo ? 'Ver cámara (interacción activa)' : 'Activar interacción con la cámara';
        vIcon.setAttribute('aria-label', vIcon.title);
      }
    }
    function minimizar(m) { vMin = m; refrescarUI(); }        // true = solo el botón-icono, false = panel abierto

    function btnRedondo(html, titulo, fn) {
      const bt = document.createElement('button');
      bt.type = 'button'; bt.title = titulo; bt.setAttribute('aria-label', titulo); bt.innerHTML = html;
      bt.style.cssText = 'display:flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;' +
        'border:1px solid rgba(255,255,255,.7);border-radius:50%;background:rgba(0,0,0,.6);color:#fff;' +
        'font:700 16px/1 sans-serif;cursor:pointer';
      bt.addEventListener('click', fn);
      return bt;
    }
    function crearPanel() {
      if (vWrap) return;
      vWrap = document.createElement('div');
      vWrap.style.cssText = 'position:absolute;right:16px;bottom:16px;z-index:5;';
      vista = document.createElement('canvas');
      vista.style.cssText = 'display:block;border-radius:8px;border:2px solid #f55;background:#000;pointer-events:none';
      const W = cfg.vistaAncho, H = Math.round(W * 0.75);
      vista.width = W; vista.height = H; vista.style.width = W + 'px'; vista.style.height = H + 'px';
      vctx = vista.getContext('2d');
      const barra = document.createElement('div');            // botones: desactivar interacción + minimizar
      barra.style.cssText = 'position:absolute;top:6px;right:6px;display:flex;gap:6px';
      barra.append(btnRedondo(SVG_POWER, 'Desactivar la interacción', () => apagar()),
                   btnRedondo('–', 'Minimizar', () => minimizar(true)));
      vWrap.append(vista, barra);
      cont.appendChild(vWrap);
    }
    function pantallaCarga(txt) {
      if (!vctx) return;
      vctx.save();
      vctx.fillStyle = '#000'; vctx.fillRect(0, 0, vista.width, vista.height);
      vctx.fillStyle = '#ddd'; vctx.font = '12px sans-serif'; vctx.textAlign = 'center';
      vctx.fillText(txt, vista.width / 2, vista.height / 2);
      vctx.restore();
    }

    /* ---- popup (permiso de cámara / avisos) ---- */
    function cerrarModal() {
      if (!modal) return;
      modal.remove(); modal = null;
      window.removeEventListener('keydown', escModal, true);
    }
    function escModal(e) { if (e.code === 'Escape') cerrarModal(); }
    function abrirModal(titulo, texto, botones) {
      cerrarModal();
      modal = document.createElement('div');
      modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
      modal.style.cssText = 'position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;' +
        'background:rgba(0,0,0,.55);backdrop-filter:blur(4px)';
      const card = document.createElement('div');
      card.style.cssText = 'box-sizing:border-box;max-width:380px;margin:16px;padding:22px;border-radius:16px;' +
        'background:#141414;color:#fff;border:1px solid rgba(255,255,255,.15);font:14px/1.55 sans-serif;' +
        'box-shadow:0 20px 60px rgba(0,0,0,.5)';
      const h = document.createElement('div');
      h.textContent = titulo; h.style.cssText = 'font-weight:600;font-size:16px;margin-bottom:8px';
      const p = document.createElement('p');
      p.textContent = texto; p.style.cssText = 'margin:0 0 18px;color:rgba(255,255,255,.78)';
      const fila = document.createElement('div');
      fila.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap';
      let foco = null;
      for (const d of botones) {
        const bt = document.createElement('button');
        bt.type = 'button'; bt.textContent = d.txt;
        bt.style.cssText = 'padding:9px 16px;border-radius:999px;font:500 13px/1 sans-serif;cursor:pointer;' +
          (d.primario ? 'border:1px solid #fff;background:#fff;color:#111' : 'border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff');
        bt.addEventListener('click', d.fn);
        fila.appendChild(bt);
        if (d.primario) foco = bt;
      }
      card.append(h, p, fila); modal.appendChild(card);
      modal.addEventListener('pointerdown', (e) => { if (e.target === modal) cerrarModal(); });
      window.addEventListener('keydown', escModal, true);
      cont.appendChild(modal);
      if (foco) foco.focus();
    }
    function modalPermiso() {
      abrirModal(T.titulo, T.texto, [
        { txt: T.cancelar, fn: cerrarModal },
        { txt: T.aceptar, primario: true, fn: () => { cerrarModal(); activar(); } },
      ]);
    }
    function modalInfo(texto) {
      abrirModal(T.tituloInfo, texto, [{ txt: T.entendido, primario: true, fn: cerrarModal }]);
    }

    /* ---- permiso de cámara ---- */
    async function estadoPermiso() {                          // 'granted' | 'prompt' | 'denied'
      try { return (await navigator.permissions.query({ name: 'camera' })).state; }
      catch (e) {                                             // navegadores sin Permissions API para la cámara
        try { return localStorage.getItem(LS_CAM) === '1' ? 'granted' : 'prompt'; } catch (e2) { return 'prompt'; }
      }
    }
    function recordarPermiso() { try { localStorage.setItem(LS_CAM, '1'); } catch (e) {} }

    async function alPulsarIcono() {
      if (est.activo || activando) { minimizar(false); return; }   // ya activo: abre el panel con la cámara
      const p = await estadoPermiso();
      if (p === 'granted') activar();                              // ya aceptó antes: directo al canvas y la calibración
      else if (p === 'denied') modalInfo(T.bloqueado);
      else modalPermiso();                                         // aún no aceptó: primero se explica
    }

    function dibujar(lm) {
      if (!vista || vMin || !video || !video.videoWidth) return;   // minimizado: no se dibuja (ahorra recursos)
      const W = cfg.vistaAncho, H = Math.round(W * video.videoHeight / video.videoWidth);
      if (vista.width !== W || vista.height !== H) {
        vista.width = W; vista.height = H; vista.style.width = W + 'px'; vista.style.height = H + 'px';
      }
      const c = vctx;
      c.save();
      c.translate(W, 0); c.scale(-1, 1);                      // espejo, como mirarte en un espejo
      c.drawImage(video, 0, 0, W, H);
      if (lm) {
        c.fillStyle = 'rgba(0,255,255,.85)';                  // los 478 puntos del rostro
        let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
        for (const p of lm) {
          c.fillRect(p.x * W - 0.75, p.y * H - 0.75, 1.5, 1.5);
          if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
          if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
        }
        c.strokeStyle = 'rgb(0, 4, 255)'; c.lineWidth = 1;              // caja del rostro
        c.strokeRect(x0 * W, y0 * H, (x1 - x0) * W, (y1 - y0) * H);

        const a = lm[33], b = lm[263];                        // esquinas de los ojos: lo que mide la cámara
        c.strokeStyle = 'rgb(0, 238, 255)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(a.x * W, a.y * H); c.lineTo(b.x * W, b.y * H); c.stroke();
        c.fillStyle = 'rgb(0, 102, 255)';
        for (const p of [a, b]) { c.beginPath(); c.arc(p.x * W, p.y * H, 3, 0, 6.2832); c.fill(); }
        const mx = (a.x + b.x) / 2 * W, my = (a.y + b.y) / 2 * H;
        c.fillStyle = '#f33'; c.beginPath(); c.arc(mx, my, 4, 0, 6.2832); c.fill();   // punto seguido

        if (cal.listo) {                                      // centro neutro (calibrado) y desvío actual
          const nx = neutral.x * W, ny = neutral.y * H;
          c.strokeStyle = '#fff'; c.lineWidth = 1;
          c.beginPath(); c.arc(nx, ny, 9, 0, 6.2832); c.moveTo(nx - 13, ny); c.lineTo(nx + 13, ny);
          c.moveTo(nx, ny - 13); c.lineTo(nx, ny + 13); c.stroke();
          c.beginPath(); c.moveTo(nx, ny); c.lineTo(mx, my); c.stroke();
        }
      }
      c.restore();

      const lineas = (estadoTxt || '').split('\n').filter(Boolean);   // texto (sin espejo)
      const alto = lineas.length * 13 + 6;
      if (lineas.length) {
        c.fillStyle = 'rgba(0, 0, 0, 0.69)'; c.fillRect(0, H - alto, W, alto);
        c.fillStyle = lm ? 'rgb(255, 255, 255)' : '#f88'; c.font = '11px monospace';
        lineas.forEach((l, i) => c.fillText(l, 6, H - alto + 14 + i * 13 - 3));
      }
      c.fillStyle = '#fff'; c.font = '10px monospace';
      c.fillText(video.videoWidth + 'x' + video.videoHeight, 6, 12);
      vista.style.borderColor = lm ? 'rgb(17, 0, 255)' : '#f55';
    }

    let hudEl = null;                                         // panel de estado (cfg.debug)
    function hud(t) {
      if (!cfg.debug) return;
      estadoTxt = t;
      if (vista) return;                                      // con el panel abierto, el texto va dentro del canvas
      if (!hudEl) {
        hudEl = document.createElement('div');
        hudEl.style.cssText = 'position:absolute;left:16px;bottom:56px;z-index:5;padding:6px 10px;' +
          'border-radius:8px;background:rgba(0,0,0,.55);color:#0ff;font:11px/1.4 monospace;' +
          'pointer-events:none;white-space:pre';
        cont.appendChild(hudEl);
      }
      hudEl.textContent = t;
    }

    function calibrar() {
      cal.n = 0; cal.x = cal.y = cal.d = 0; cal.listo = false;
      if (vWrap) minimizar(false);                            // al recalibrar (tecla C) se vuelve a abrir para ver el progreso
    }

    function leer() {                                         // una lectura de la cámara (si hay frame nuevo)
      if (!landmarker || !video || video.readyState < 2 || video.currentTime === lastVT) return;
      lastVT = video.currentTime;
      let res;
      try { res = landmarker.detectForVideo(video, performance.now()); }
      catch (err) { hud('error al detectar:\n' + err.message); dibujar(null); console.warn(err); return; }
      const lm = res.faceLandmarks && res.faceLandmarks[0];
      dibujar(lm);
      if (!lm) { obj.ex = obj.ey = obj.zc = 0; hud('sin rostro detectado\n(luz de frente, cara visible)'); return; }   // vuelve suave al centro

      // centros de los iris (468 y 473): no cambian al girar la cabeza, a diferencia de las esquinas de los ojos
      const a = lm[468] || lm[33], b = lm[473] || lm[263];
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, d = Math.hypot(a.x - b.x, a.y - b.y);

      if (!cal.listo) {                                       // fija la posición neutra con las primeras lecturas
        cal.x += x; cal.y += y; cal.d += d; cal.n++;
        if (cal.n >= cfg.calibrarFrames) {
          neutral.x = cal.x / cal.n; neutral.y = cal.y / cal.n; neutral.d = cal.d / cal.n; cal.listo = true;
          if (cfg.vistaAutoOcultar && vista) minimizar(true);   // calibración terminada → solo queda el botón-icono
        }
        hud(cal.listo ? 'calibrado' : 'calibrando ' + cal.n + '/' + cfg.calibrarFrames + '\n(quédate quieto mirando la pantalla)');
        return;
      }
      // medidas físicas: en la imagen, un ancho completo = 2·tan(fov/2)·distancia
      const anchoCamCm = 2 * Math.tan(THREE.MathUtils.degToRad(cfg.camFovH) / 2) * cfg.distanciaCm;
      const relAlto = video.videoHeight / video.videoWidth;
      const zm = (v) => (Math.abs(v) < cfg.zonaMuertaCm ? 0 : v - Math.sign(v) * cfg.zonaMuertaCm);
      // la cámara no está espejada: si mueves la cabeza a tu derecha, x baja en la imagen
      obj.ex = clamp(zm((neutral.x - x) * anchoCamCm), -cfg.maxCm, cfg.maxCm);
      obj.ey = clamp(zm((neutral.y - y) * anchoCamCm * relAlto), -cfg.maxCm, cfg.maxCm);
      obj.zc = clamp(zm(cfg.distanciaCm * (1 - neutral.d / d)), -cfg.maxCmZ, cfg.maxCmZ);   // + = más cerca
      hud('rostro detectado\nx ' + obj.ex.toFixed(2) + '  y ' + obj.ey.toFixed(2) + '  z ' + obj.zc.toFixed(2) + '\n(tecla C = recalibrar)');
    }

    /* Se llama justo antes de renderizar: suaviza, desplaza la cámara y le pone el frustum asimétrico */
    function preparar(dt) {
      if (!est.activo) return;
      leer();
      const k = 1 - Math.exp(-cfg.suavizado * dt);
      est.ex += (obj.ex - est.ex) * k;
      est.ey += (obj.ey - est.ey) * k;
      est.zc += (obj.zc - est.zc) * k;

      /* est.* está en cm de movimiento real de tu cabeza. La pantalla es la ventana: mide pantallaAnchoCm
         de ancho y está a distanciaCm. Todo se expresa como fracción de la distancia a la ventana (D). */
      const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));   // medio alto de la ventana (D = 1)
      const w = h * camera.aspect;
      const mediaAncho = cfg.pantallaAnchoCm / 2, mediaAlto = mediaAncho / camera.aspect;
      const I = cfg.intensidad;
      const ex = est.ex / mediaAncho * w * I;                         // desplazamiento del ojo / D
      const ey = est.ey / mediaAlto * h * I;
      const zc = clamp(est.zc / cfg.distanciaCm * I, -0.5, 0.5);
      const dz = 1 - zc;                                              // distancia ojo-ventana / D
      const n = camera.near, f = camera.far;
      camera.projectionMatrix.makePerspective(
        n * (-w - ex) / dz, n * (w - ex) / dz,
        n * (h - ey) / dz, n * (-h - ey) / dz, n, f);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

      /* La ventana (el plano de la pantalla) se queda fija en la escena; solo el ojo se mueve. Es lo mismo que
         mover la escena en sentido contrario, y la posición real de la cámara se restaura tras dibujar. */
      base.copy(camera.position);
      off.set(ex, ey, -zc).multiplyScalar(cfg.distanciaVentana).applyQuaternion(camera.quaternion);
      camera.position.add(off);
      aplicada = true;
    }
    function restaurar() {
      if (!aplicada) return;
      camera.position.copy(base);
      aplicada = false;
    }

    function apagar() {
      sesion++; activando = false;                            // cancela cualquier activación en curso
      est.activo = false;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      if (video) { video.srcObject = null; video.remove(); video = null; }
      est.ex = est.ey = est.zc = obj.ex = obj.ey = obj.zc = 0;
      if (hudEl) { hudEl.remove(); hudEl = null; }
      if (vWrap) { vWrap.remove(); vWrap = null; }
      vista = null; vctx = null; vMin = false;
      estadoTxt = '';
      if (fovOriginal !== null) { camera.fov = fovOriginal; fovOriginal = null; }
      camera.updateProjectionMatrix();                                // vuelve a la proyección normal
      refrescarUI();                                                  // queda solo el botón-icono
    }

    async function activar() {
      if (!soportado || est.activo || activando) return;
      activando = true;
      const mi = ++sesion;
      crearPanel(); minimizar(false); pantallaCarga('Cargando cámara…');
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
        if (mi !== sesion) { s.getTracks().forEach((t) => t.stop()); return; }   // lo desactivaron mientras tanto
        stream = s;
        recordarPermiso();
        video = document.createElement('video');
        video.srcObject = stream; video.muted = true; video.playsInline = true;
        video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
        document.body.appendChild(video);
        await video.play();
        if (mi !== sesion) return;

        if (!landmarker) {
          const mp = await import(cfg.libUrl);
          const files = await mp.FilesetResolver.forVisionTasks(cfg.wasmUrl);
          for (const delegate of ['GPU', 'CPU']) {                    // si la GPU falla, prueba con la CPU
            try {
              landmarker = await mp.FaceLandmarker.createFromOptions(files, {
                baseOptions: { modelAssetPath: cfg.modeloUrl, delegate },
                runningMode: 'VIDEO', numFaces: 1 });
              console.log('Seguimiento de cabeza: detector listo con', delegate);
              break;
            } catch (e) {
              console.warn('Detector con ' + delegate + ' falló:', e);
              if (delegate === 'CPU') throw e;
            }
          }
        }
        if (mi !== sesion) return;
        lastVT = -1; calibrar(); est.activo = true;
        if (cfg.fovVentana > 0) { fovOriginal = camera.fov; camera.fov = cfg.fovVentana; }
        hud('esperando rostro…');
        refrescarUI();
      } catch (err) {                                                 // permiso denegado, sin cámara o falló la librería
        if (mi !== sesion) return;
        console.warn('Seguimiento de cabeza no disponible:', err);
        apagar();
        modalInfo(err && err.name === 'NotAllowedError' ? T.bloqueado : T.error);
      } finally {
        if (mi === sesion) activando = false;
      }
    }

    function crearBoton() {                                           // el único elemento visible al inicio
      if (!cfg.boton || vIcon) return;
      if (getComputedStyle(cont).position === 'static') cont.style.position = 'relative';
      vIcon = document.createElement('button');
      vIcon.type = 'button';
      const Tm = cfg.vistaIconoTam;
      vIcon.style.cssText = 'position:absolute;right:16px;bottom:16px;z-index:5;display:flex;align-items:center;' +
        'justify-content:center;width:' + Tm + 'px;height:' + Tm + 'px;padding:0;border:2px solid rgba(255,255,255,.6);' +
        'border-radius:50%;background:rgb(240, 249, 255);backdrop-filter:blur(6px);cursor:pointer;overflow:hidden';
      if (cfg.vistaIcono) {
        const im = document.createElement('img');
        im.src = cfg.vistaIcono; im.alt = ''; im.draggable = false;
        im.style.cssText = 'width:' + cfg.vistaIconoEscala + '%;height:' + cfg.vistaIconoEscala + '%;object-fit:contain;pointer-events:none';
        vIcon.appendChild(im);
      } else if (cfg.vistaIconoSvg) {                                 // SVG animado pegado como código (inline)
        vIcon.innerHTML = cfg.vistaIconoSvg;
        const sv = vIcon.querySelector('svg');
        if (sv) { sv.style.cssText = 'width:' + cfg.vistaIconoEscala + '%;height:' + cfg.vistaIconoEscala + '%;display:block;pointer-events:none'; }
      } else {
        vIcon.textContent = '👁'; vIcon.style.fontSize = Math.round(Tm * 0.5) + 'px';
      }
      vIcon.addEventListener('click', alPulsarIcono);
      cont.appendChild(vIcon);
      refrescarUI();
    }

    if (soportado) {
      window.addEventListener('keydown', (e) => { if (e.code === 'KeyC' && est.activo && !typing(e)) calibrar(); });
      if (navigator.mediaDevices.enumerateDevices) {                  // el botón solo aparece si hay cámara
        navigator.mediaDevices.enumerateDevices()
          .then((d) => { if (d.some((x) => x.kind === 'videoinput')) crearBoton(); })
          .catch(() => {});
      }
    }
    window.pasilloCabeza = { config: CABEZA, activar, desactivar: apagar, calibrar };
    return { preparar, restaurar };
  })();

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
    listo();
  }, (xhr) => {
    if (xhr.lengthComputable && bar) bar.style.width = (xhr.loaded / xhr.total * 100) + '%';
  }, (err) => {
    console.error('No se pudo cargar el modelo:', MODEL_URL, err);
    listo();
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
    textoCil.update(dt);
    camera.rotation.set(pitch, yaw, 0);
    cabeza.preparar(dt);                 // desplaza la cámara y ajusta el frustum según tu cabeza
    renderer.render(scene, camera);
    cabeza.restaurar();                  // la posición real (colisiones, movimiento) no se toca
  });
}