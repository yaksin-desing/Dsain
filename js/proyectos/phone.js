import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import {
  gsap
} from "https://cdn.skypack.dev/gsap";

// Contenedor
const container = document.getElementById("section_siete");

// Escena y cámara
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 2);

// Renderizador
const renderer = new THREE.WebGLRenderer({
  antialias: false,

});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);



// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 5, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// Cargadores
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// Datos globales
const modelos = [];
const mouseTweens = new Map();
let efectoMouseActivo = false;
let mouseEffectPaused = false;
let clickInProgress = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Función para cargar modelos
function cargarModelo(rutaModelo, texturaRuta, posX, offset, rotY = Math.PI, rotX = 0) {
  const texture = textureLoader.load(texturaRuta);

  loader.load(
    rutaModelo,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((node) => {
        if (node.isMesh && node.name === "pantalla") {
          const bbox = new THREE.Box3().setFromObject(node);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          const planeGeometry = new THREE.PlaneGeometry(size.x, size.y);
          const planeMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.FrontSide,
          });
          const screenPlane = new THREE.Mesh(planeGeometry, planeMaterial);
          node.add(screenPlane);
          screenPlane.position.set(0, 0.01099, 0);
          screenPlane.rotation.x = Math.PI / -2;
          screenPlane.rotation.z = Math.PI / 1;
          screenPlane.scale.set(0.1, 0.1, 1);
          screenPlane.translateZ(0.001);
        }
      });

      // 🔹 Coloca el modelo fuera de escena dependiendo de su lado
      const startX = posX < 0 ? -3 : 3;
      model.position.set(startX, 0, 0);
      model.rotation.set(rotX, rotY, 0);

      scene.add(model);
      modelos.push({
        model,
        offset,
        baseY: model.position.y,
        targetX: posX,
        baseRotX: model.rotation.x,
        baseRotY: model.rotation.y,
      });
    },
    undefined,
    (error) => console.error("Error al cargar modelo:", error)
  );
}

// Animación hover mouse
function updateMouseTweens(mx, my) {
  modelos.forEach(({
    model,
    baseRotX,
    baseRotY
  }) => {
    const prev = mouseTweens.get(model);
    if (prev) prev.kill();
    const t = gsap.to(model.rotation, {
      x: baseRotX + my * 0.1,
      y: baseRotY + mx * 0.3,
      duration: 0.5,
      ease: "power2.out",
    });
    mouseTweens.set(model, t);
  });
}

// 🔹 Optimiza rendimiento: pausa render fuera de viewport
let isInViewport = true;
const observerVisibilidad = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      isInViewport = entry.isIntersecting;
    });
  }, {
    threshold: 0.2
  }
);
observerVisibilidad.observe(container);

// Animación flotante
function animate() {
  requestAnimationFrame(animate);

  if (!isInViewport) return;
  const time = Date.now() * 0.002;
  modelos.forEach(({
    model,
    offset,
    baseY
  }) => {
    model.position.y = baseY + Math.sin(time + offset) * 0.03;
  });
  renderer.render(scene, camera);


}
animate();

// =====================
// 🔹 CONFIGURACIÓN SEGÚN MEDIAQUERY
// =====================
const texturaRuta1 = document.body.dataset.textura1;
const texturaRuta2 = document.body.dataset.textura2;

// Desktop
function escenaDesktop() {
  cargarModelo("../src/objt/phone/iphone.glb", texturaRuta1, -0.5, 0, Math.PI, 0);
  cargarModelo("../src/objt/phone/iphone.glb", texturaRuta2, 0.5, Math.PI / 2, Math.PI, -0.05);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const timeline = gsap.timeline({
            onComplete: () => {
              modelos.forEach((m) => {
                m.baseRotX = m.model.rotation.x;
                m.baseRotY = m.model.rotation.y;
              });
              efectoMouseActivo = true;
              updateMouseTweens(lastMouseX, lastMouseY);
            },
          });

          modelos.forEach(({
            model,
            targetX
          }, i) => {
            timeline.fromTo(
              model.position, {
                x: targetX < 0 ? -3 : 3,
                y: -1
              }, {
                x: targetX,
                y: 0,
                duration: 2.5,
                ease: "power4.out",
                delay: i * 0.3
              },
              0
            );

            timeline.fromTo(
              model.rotation, {
                y: 0
              }, {
                y: "+=" + Math.PI * 1,
                duration: 2.5,
                ease: "power4.out",
                delay: i * 0.2
              },
              0
            );
          });

          observer.disconnect();
        }
      });
    }, {
      threshold: 0.5
    }
  );
  observer.observe(container);
}

// Mobile
function escenaMobile() {
  cargarModelo("../src/objt/phone/iphone.glb", texturaRuta1, 0.5, Math.PI / 2, Math.PI, -0.05);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const timeline = gsap.timeline({
            onComplete: () => {
              modelos.forEach((m) => {
                m.baseRotX = m.model.rotation.x;
                m.baseRotY = m.model.rotation.y;
              });
              efectoMouseActivo = true;
              updateMouseTweens(lastMouseX, lastMouseY);
            },
          });

          modelos.forEach(({
            model
          }) => {
            timeline.fromTo(
              model.position, {
                y: -1
              }, {
                x: 0,
                y: 0,
                duration: 1.8,
                ease: "power4.out"
              },
              0
            );
            timeline.fromTo(
              model.rotation, {
                y: 0
              }, {
                y: "+=" + Math.PI * 1,
                duration: 1.5,
                ease: "power2.out"
              },
              0
            );
          });

          observer.disconnect();
        }
      });
    }, {
      threshold: 0.5
    }
  );
  observer.observe(container);
}

// Detectar ancho actual
if (window.innerWidth > 480) {
  escenaDesktop();
} else {
  escenaMobile();
}

// ✅ Efecto mouse solo en desktop
if (window.innerWidth > 780) {
  window.addEventListener("mousemove", (event) => {
    lastMouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    lastMouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    if (!efectoMouseActivo || mouseEffectPaused) return;
    updateMouseTweens(lastMouseX, lastMouseY);
  });
}

// ✅ Click para girar el modelo
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

container.addEventListener("click", (event) => {
  if (!efectoMouseActivo || clickInProgress) return;

  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length === 0) return;

  let clicked = intersects[0].object;
  while (clicked.parent && !modelos.find((m) => m.model === clicked)) {
    clicked = clicked.parent;
  }

  const data = modelos.find((m) => m.model === clicked);
  if (!data) return;

  mouseEffectPaused = true;
  clickInProgress = true;
  mouseTweens.forEach((t) => t.kill());
  mouseTweens.clear();

  gsap.to(data.model.rotation, {
    y: data.model.rotation.y + Math.PI * 2,
    duration: 2.5,
    ease: "power2.inOut",
    onComplete: () => {
      data.baseRotY = data.model.rotation.y;
      mouseEffectPaused = false;
      clickInProgress = false;
      updateMouseTweens(lastMouseX, lastMouseY);
    },
  });
});

// Ajustar al redimensionar
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ✅ Efecto giroscopio solo en móviles
if (window.innerWidth <= 480) {
  let modeloCelular = null;

  // Esperar a que el modelo esté cargado
  const esperarModelo = setInterval(() => {
    if (modelos.length > 0) {
      modeloCelular = modelos[0].model;
      clearInterval(esperarModelo);

      // Solicitar permiso en iOS (obligatorio desde iOS 13)
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        const botonPermiso = document.createElement("button");
        botonPermiso.textContent = "Activar movimiento";
        botonPermiso.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #000;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          z-index: 9999;
        `;
        document.body.appendChild(botonPermiso);

        botonPermiso.addEventListener("click", async () => {
          const permiso = await DeviceOrientationEvent.requestPermission();
          if (permiso === "granted") {
            iniciarGiroscopio();
            botonPermiso.remove();
          } else {
            alert("No se concedió acceso al giroscopio");
          }
        });
      } else {
        // En Android o navegadores sin restricción
        iniciarGiroscopio();
      }
    }
  }, 200);

  function iniciarGiroscopio() {
    window.addEventListener("deviceorientation", (event) => {
      if (!modeloCelular) return;

      const inclinacionX = event.beta || 0; // Adelante / atrás
      const inclinacionY = event.gamma || 0; // Izquierda / derecha

      // Limitar valores para evitar movimientos bruscos
      const rotacionLimitadaX = THREE.MathUtils.clamp(inclinacionX, -45, 45);
      const rotacionLimitadaY = THREE.MathUtils.clamp(inclinacionY, -45, 45);

      // Convertir a radianes y suavizar
      const rotX = THREE.MathUtils.degToRad(rotacionLimitadaX) * 0.3;
      const movCamX = rotacionLimitadaY * 0.01; // sensibilidad para cámara

      // 🔹 Rotar modelo suavemente en eje X
      gsap.to(modeloCelular.rotation, {
        x: rotX,
        duration: 0.3,
        ease: "power2.out",
      });

      // 🔹 Mover cámara en eje X (ligero efecto de parallax)
      gsap.to(camera.position, {
        x: movCamX,
        duration: 0.4,
        ease: "power2.out",
      });
    });
  }
}
