import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";

import {
  GLTFLoader
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import {
  Water
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Water.js";

import {
  Sky
} from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Sky.js";


const container = document.getElementById("scene-container");


const sceneTres = new THREE.Scene();

const cameraTres = new THREE.PerspectiveCamera(
  80,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);

cameraTres.position.set(0, 7, -21);

//cameraTres.quaternion.setFromEuler(new THREE.Euler(0.05, -1.58, 0, "YXZ"));


// ============================================================
// LUCES
// ============================================================

// Configuración de la luz direccional
const luzdospasillo = new THREE.DirectionalLight(0xffffff, 1);

luzdospasillo.position.set(10, 80, -7);

luzdospasillo.castShadow = true;

luzdospasillo.shadow.camera.top = 100;
luzdospasillo.shadow.camera.bottom = -100;
luzdospasillo.shadow.camera.left = -30;
luzdospasillo.shadow.camera.right = 30;

luzdospasillo.shadow.camera.near = 0.5;
luzdospasillo.shadow.camera.far = 85;

luzdospasillo.shadow.mapSize.width = 2000;
luzdospasillo.shadow.mapSize.height = 2000;

luzdospasillo.shadow.bias = -0.001;

luzdospasillo.shadow.opacity = 0;


const targetdos = new THREE.Object3D();

targetdos.position.set(0, 0, 0);

sceneTres.add(targetdos);

luzdospasillo.target = targetdos;


// const shadowCameraHelper = new THREE.CameraHelper(luzdospasillo.shadow.camera);
// sceneTres.add(shadowCameraHelper);


// const directionalLightHelper = new THREE.DirectionalLightHelper(luzdospasillo, 10);
// sceneTres.add(directionalLightHelper);


sceneTres.add(luzdospasillo);


// Configuración de la luz direccional
const luzdospasillotres = new THREE.DirectionalLight(0xFDFFA2, 0.7);

luzdospasillotres.position.set(-5, 5, 500);


const targetres = new THREE.Object3D();

targetres.position.set(0, 0, 50);

sceneTres.add(targetres);

luzdospasillotres.target = targetres;

sceneTres.add(luzdospasillotres);


// ============================================================
// LINTERNA
// ============================================================

const luzLinterna = new THREE.SpotLight(0xffffff, 1.7);

luzLinterna.position.set(0, 0, 0);

// Ángulo más cerrado
luzLinterna.angle = 2;

// Qué tan difuso es el borde
luzLinterna.penumbra = 0.9;


// Configurar el target
const targetLinterna = new THREE.Object3D();

targetLinterna.position.set(0, 0, -5);

sceneTres.add(targetLinterna);

luzLinterna.target = targetLinterna;

sceneTres.add(luzLinterna);


// ============================================================
// LUZ SUELO
// ============================================================

const luzHemisferica = new THREE.HemisphereLight(
  0xffffff,
  0x444444,
  1.2
);

luzHemisferica.position.set(0, -5, 0);

sceneTres.add(luzHemisferica);


// ============================================================
// CARGAR MODELO ROCA
// ============================================================

const loaderroca = new GLTFLoader();

loaderroca.load(
  "./src/objt/escena/escenatres/roca.glb",

  (gltf) => {

    const modeloBase = gltf.scene;


    function crearRoca(
      posX,
      posY,
      posZ,
      escalaX,
      escalaY,
      escalaZ,
      rotacionX,
      rotacionY,
      rotacionZ
    ) {

      const clonRoca = modeloBase.clone();

      clonRoca.position.set(posX, posY, posZ);

      clonRoca.scale.set(
        escalaX,
        escalaY,
        escalaZ
      );

      clonRoca.rotation.set(
        rotacionX,
        rotacionY,
        rotacionZ
      );


      clonRoca.traverse((child) => {

        if (child.isMesh) {

          child.castShadow = true;
          child.receiveShadow = true;

        }

      });


      sceneTres.add(clonRoca);

    }


    //crearRoca(28, 0, -100, 0.5, 0.8, 0.2, 0.2, 0, 0);

    crearRoca(
      40,
      -1,
      -13,
      0.5,
      0.3,
      0.3,
      0,
      -1.8,
      0
    );

    //crearRoca(30, 0, -40, 1, 2, 1, 0, -5, 0);

    //crearRoca(28, 0, -150, 1, 2, 1, 0, -4.5, 0);


    crearRoca(
      -15,
      0,
      -100,
      0.3,
      0.5,
      0.2,
      0.2,
      -0.5,
      0
    );

    //crearRoca(-30, 0, -60, 0.3, 0.5, 0.3, 0.2, 1, 0);

    crearRoca(
      -20,
      -1,
      -20,
      0.3,
      0.5,
      0.3,
      0,
      -1.8,
      0
    );

    //crearRoca(-40, 0, -40, 1, 2, 0.4, 0, -1.8, 0);

    //crearRoca(-30, 0, -140, 1, 2, 0.4, 0, -2, 0);

    //crearRoca(-15, -5, -230, 1, 2.5, 0.4, 1, -2.5, 1);

  },

  undefined,

  (error) => console.error(
    "Error al cargar el modelo de roca:",
    error
  )
);


// ============================================================
// CARGAR MODELO PALMERA
// ============================================================

const loaderpalmera = new GLTFLoader();

loaderpalmera.load(
  "./src/objt/escena/escenatres/palma.glb",

  (gltf) => {

    const modeloBase = gltf.scene;


    function crearPalmera(
      posX,
      posY,
      posZ,
      escalaX,
      escalaY,
      escalaZ,
      rotacionX,
      rotacionY,
      rotacionZ
    ) {

      const clonPalmera = modeloBase.clone();

      clonPalmera.position.set(
        posX,
        posY,
        posZ
      );

      clonPalmera.scale.set(
        escalaX,
        escalaY,
        escalaZ
      );

      clonPalmera.rotation.set(
        rotacionX,
        rotacionY,
        rotacionZ
      );


      clonPalmera.traverse((child) => {

        if (child.isMesh) {

          child.castShadow = true;
          child.receiveShadow = true;

        }

      });


      sceneTres.add(clonPalmera);

    }


    crearPalmera(
      30,
      25,
      -85,
      0.3,
      0.3,
      0.3,
      0,
      0,
      0
    );

    crearPalmera(
      27,
      25,
      7,
      0.3,
      0.3,
      0.3,
      0,
      2,
      0
    );


    crearPalmera(
      -25,
      20,
      -100,
      0.4,
      0.4,
      0.4,
      0,
      0,
      0
    );

    crearPalmera(
      -25,
      20,
      -40,
      0.4,
      0.3,
      0.4,
      0,
      0,
      0
    );

  },

  undefined,

  (error) => console.error(
    "Error al cargar el modelo de palmera:",
    error
  )
);


// ============================================================
// CARGAR MODELO PLANTA
// ============================================================

const loaderplanta = new GLTFLoader();

loaderplanta.load(
  "./src/objt/escena/escenatres/planta.glb",

  (gltf) => {

    const modeloBase = gltf.scene;


    function crearPalmera(
      posX,
      posY,
      posZ,
      escalaX,
      escalaY,
      escalaZ,
      rotacionX,
      rotacionY,
      rotacionZ
    ) {

      const clonplanta = modeloBase.clone();

      clonplanta.position.set(
        posX,
        posY,
        posZ
      );

      clonplanta.scale.set(
        escalaX,
        escalaY,
        escalaZ
      );

      clonplanta.rotation.set(
        rotacionX,
        rotacionY,
        rotacionZ
      );


      clonplanta.traverse((child) => {

        if (child.isMesh) {

          child.castShadow = true;
          child.receiveShadow = true;

        }

      });


      sceneTres.add(clonplanta);

    }


    crearPalmera(
      5,
      -0.5,
      100,
      0.1,
      0.1,
      0.1,
      0,
      0,
      0
    );


    crearPalmera(
      -11,
      -0.5,
      120,
      0.1,
      0.1,
      0.1,
      0,
      0,
      0
    );

  },

  undefined,

  (error) => console.error(
    "Error al cargar el modelo de planta:",
    error
  )
);


// ============================================================
// RENDER TARGET
// ============================================================

const renderTargetTres = new THREE.WebGLRenderTarget(
  container.clientWidth,
  container.clientHeight,
  {
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
  }
);


// ============================================================
// PLANO PORTAL
// ============================================================

const planeGeometryportal = new THREE.PlaneGeometry(
  16,
  8
);


const planeMaterialportal = new THREE.MeshBasicMaterial({
  map: renderTargetTres.texture
});


const textuportal = new THREE.Mesh(
  planeGeometryportal,
  planeMaterialportal
);


textuportal.position.set(
  0,
  7,
  -21.2
);

textuportal.quaternion.setFromEuler(
  new THREE.Euler(
    0,
    0,
    0,
    "YXZ"
  )
);


sceneTres.add(textuportal);


// ============================================================
// VARIABLES PARA COMPARTIR MATERIAL
// ============================================================

// Material original encontrado dentro del pasillo
let materialPasillo = null;

// Modelo de la pared
let modeloParedTres = null;


// ============================================================
// FUNCIÓN PARA APLICAR MATERIAL DEL PASILLO A LA PARED
// ============================================================

function aplicarMaterialPasilloAPared() {

  // Si alguno de los dos modelos todavía no terminó
  // de cargar, no hacemos nada todavía.
  if (!materialPasillo || !modeloParedTres) {
    return;
  }


  modeloParedTres.traverse((child) => {

    if (!child.isMesh) {
      return;
    }


    // --------------------------------------------------------
    // Si la pared tiene un solo material
    // --------------------------------------------------------

    if (!Array.isArray(child.material)) {

      child.material = materialPasillo;

    }


    // --------------------------------------------------------
    // Si la pared tiene varios materiales
    // --------------------------------------------------------

    else {

      child.material = child.material.map(() => {
        return materialPasillo;
      });

    }


    child.castShadow = true;
    child.receiveShadow = true;

  });


  console.log(
    "Material del pasillo aplicado correctamente a la pared."
  );

}


// ============================================================
// CARGAR PARED
// ============================================================

const loaderpared = new GLTFLoader();

loaderpared.load(

  "./src/objt/escena/escenatres/paredtres.glb",

  (gltf) => {

    modeloParedTres = gltf.scene;


    modeloParedTres.position.set(
      1,
      -8.3,
      -23.7
    );


    modeloParedTres.scale.set(
      0.38,
      0.38,
      0.35
    );


    modeloParedTres.traverse((child) => {

      if (child.isMesh) {

        child.castShadow = true;
        child.receiveShadow = true;

      }

    });


    sceneTres.add(modeloParedTres);


    // Intentamos aplicar el material.
    // Si el pasillo todavía no cargó, la función
    // simplemente esperará.
    aplicarMaterialPasilloAPared();

  },

  undefined,

  (error) => console.error(
    "Error al cargar el modelo de paredtres:",
    error
  )

);


// ============================================================
// AGUA
// ============================================================

let water;


const textureaguaLoader = new THREE.TextureLoader();

textureaguaLoader.load(
  "./src/objt/agua/norm.jpg",

  function (waterNormal) {

    waterNormal.wrapS =
      waterNormal.wrapT =
      THREE.RepeatWrapping;


    const waterGeometry =
      new THREE.PlaneGeometry(
        550,
        550
      );


    water = new Water(
      waterGeometry,
      {
        textureWidth: 512,
        textureHeight: 512,

        waterNormals: waterNormal,

        sunDirection:
          new THREE.Vector3(0, 1, 0),

        sunColor: 0xffffff,

        waterColor: 0x0199FF,

        distortionScale: 0.5,

        fog: false,

        alpha: 0.8
      }
    );


    water.material.transparent = true;

    water.rotation.x = -Math.PI / 2;

    water.position.y = 0.9;

    water.position.z = 0;


    sceneTres.add(water);


    console.log(
      "¡Agua cargada correctamente!",
      water
    );

  },

  undefined,

  function (error) {

    console.error(
      "Error al cargar la textura del agua:",
      error
    );

  }
);


// ============================================================
// CIELO
// ============================================================

const sky = new Sky();

sky.scale.setScalar(1000);


// Configurar parámetros del shader
const skyUniforms = sky.material.uniforms;

skyUniforms["turbidity"].value = 0.1;

skyUniforms["rayleigh"].value = 4;

skyUniforms["mieCoefficient"].value = 0.0001;

skyUniforms["mieDirectionalG"].value = 0.9;


// Posición del sol
const sun = new THREE.Vector3();

const phi =
  THREE.MathUtils.degToRad(94 - 9);

const theta =
  THREE.MathUtils.degToRad(180);


sun.setFromSphericalCoords(
  1,
  phi,
  theta
);


skyUniforms["sunPosition"].value.copy(
  sun
);


// Agregar cielo
sceneTres.add(sky);


// ============================================================
// SUELO
// ============================================================

const sueloGeometry =
  new THREE.PlaneGeometry(
    700,
    700
  );


const sueloMaterial =
  new THREE.MeshStandardMaterial({

    color: 0x6EBFD3,

    side: THREE.DoubleSide

  });


const suelo =
  new THREE.Mesh(
    sueloGeometry,
    sueloMaterial
  );


suelo.rotation.x =
  -Math.PI / 2;


suelo.position.y = 0;


sceneTres.add(suelo);


// ============================================================
// TEXTURAS DEL PISO
// ============================================================

const loaderTress =
  new THREE.TextureLoader();


const baseColorTress =
  loaderTress.load(
    "./src/objt/escena/escenatres/textpiso/basecolor.png"
  );


const aoMapTress =
  loaderTress.load(
    "./src/objt/escena/escenatres/textpiso/ambientOcclusion.png"
  );


const heightMapTress =
  loaderTress.load(
    "./src/objt/escena/escenatres/textpiso/height.png"
  );


const normalMapTress =
  loaderTress.load(
    "./src/objt/escena/escenatres/textpiso/normal.png"
  );


// Hacer que las texturas se repitan
baseColorTress.wrapS =
  baseColorTress.wrapT =
  THREE.RepeatWrapping;


aoMapTress.wrapS =
  aoMapTress.wrapT =
  THREE.RepeatWrapping;


heightMapTress.wrapS =
  heightMapTress.wrapT =
  THREE.RepeatWrapping;


normalMapTress.wrapS =
  normalMapTress.wrapT =
  THREE.RepeatWrapping;


// Repetición
const repeatCountTress = 27;

baseColorTress.repeat.set(
  repeatCountTress,
  repeatCountTress
);

aoMapTress.repeat.set(
  repeatCountTress,
  repeatCountTress
);

heightMapTress.repeat.set(
  repeatCountTress,
  repeatCountTress
);

normalMapTress.repeat.set(
  repeatCountTress,
  repeatCountTress
);


// Crear material
const materialTress =
  new THREE.MeshStandardMaterial({

    map: baseColorTress,

    aoMap: aoMapTress,

    normalMap: normalMapTress,

    displacementMap: heightMapTress,

    displacementScale: 0.2

  });


// Crear plane
const geometryTress =
  new THREE.PlaneGeometry(
    200,
    300,
    1,
    1
  );


// UV2 para AO
geometryTress.setAttribute(
  "uv2",
  new THREE.BufferAttribute(
    geometryTress.attributes.uv.array,
    2
  )
);


const planeTress =
  new THREE.Mesh(
    geometryTress,
    materialTress
  );


sceneTres.add(planeTress);


// Rotar
planeTress.rotation.x =
  -Math.PI / 2;


planeTress.position.set(
  0,
  0.4,
  50
);


planeTress.receiveShadow = true;


// ============================================================
// CARGAR PASILLO
// ============================================================

const pascilloLoader =
  new GLTFLoader();


pascilloLoader.load(

  "./src/objt/escena/pasilloescenauno.glb",

  (gltf) => {

    const pascilloModel =
      gltf.scene;


    pascilloModel.scale.set(
      3,
      3,
      3
    );


    pascilloModel.position.set(
      0,
      0,
      116
    );


    // --------------------------------------------------------
    // BUSCAR MATERIAL DEL PASILLO
    // --------------------------------------------------------

    pascilloModel.traverse((child) => {

      if (child.isMesh) {

        child.castShadow = true;
        child.receiveShadow = true;


        // Tomamos el primer material encontrado
        if (!materialPasillo) {

          if (Array.isArray(child.material)) {

            materialPasillo =
              child.material[0];

          } else {

            materialPasillo =
              child.material;

          }

        }

      }

    });


    sceneTres.add(pascilloModel);


    // --------------------------------------------------------
    // AHORA QUE EL PASILLO TERMINÓ DE CARGAR,
    // APLICAMOS SU MATERIAL A LA PARED
    // --------------------------------------------------------

    aplicarMaterialPasilloAPared();


    console.log(
      "Material encontrado en el pasillo:",
      materialPasillo
    );

  },

  undefined,

  (error) => console.error(
    "Error al cargar el modelo de pascilloModel:",
    error
  )

);


// ============================================================
// CONTROLES DE CÁMARA
// ============================================================

// const controls = new OrbitControls(cameraTres, container);

// controls.enableDamping = true;

// controls.dampingFactor = 0.05;

// controls.screenSpacePanning = false;

// controls.minDistance = 2;

// controls.maxDistance = 50;

// controls.maxPolarAngle = Math.PI / 2;


// ============================================================
// EXPORTS
// ============================================================

export {

  sceneTres,

  cameraTres,

  water,

  renderTargetTres

};