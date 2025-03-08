import * as THREE from "three";
// import Stats from "../../../../build/jsm/libs/stats.module.js";
import Stats from "/build/jsm/libs/stats.module.js";

import { Camera } from "./Cameras/camera.js";
import World from "./Terrain/world.js";
import ResourceManager from "./resourceManager.js";
import { setupUI } from "./ui.js";
import WorldParams from "./Terrain/worldParams.js";
import Fog from "./fog.js";
import { Player } from "./Player/player.js";
import { Physics } from "./Physics/physics.js";
import { InfoBox } from "/libs/util/util.js";
// import { InfoBox } from "/libs/util/util.js";
import Building from "./building.js";

//CENA PRINCIPAL
const scene = new THREE.Scene();
const params = WorldParams.instance;

//FOG
const fog = Fog.instance;
scene.fog = fog;

//RENDERER
let renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
//renderer.setClearColor(0x80a0e0);

//Habilita sombras no renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//Criação do FPS na tela
const stats = new Stats();
document.body.append(stats.dom);

//INICIALIZAÇÃO DO PLAYER
const player = new Player(scene);

//INICIALIZAÇÃO DAS CÂMERAS
let camera = new Camera(renderer, scene, player);

//INICIALIZAÇÃO DA EDIFICAÇÃO
const building = new Building();

//INICIALIZAÇÃO DO MUNDO
const resources = new ResourceManager();
await resources.loadTreeModels();
const world = new World(resources, player, building);
world.build();
scene.add(world);

//INICIALIZAÇÃO DA FÍSICA
const physics = new Physics(scene);

//FUNÇÃO PARA INICIALIZAÇÃO DAS LUZES
let shadowHelper;
let light;
function setupLights() {
  //Inicialização da luz direcional
  let lightPosition = new THREE.Vector3(0, 30, 130);
  let lightColor = "rgb(255,255,255)";
  light = new THREE.DirectionalLight(lightColor, 0.8);
  light.position.copy(lightPosition);
  light.intensity = 2;
  light.castShadow = true;

  //Parâmetros da sombra
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 130;
  light.shadow.camera.left = -100;
  light.shadow.camera.right = 100;
  light.shadow.camera.bottom = -100;
  light.shadow.camera.top = 100;
  light.shadow.bias = -0.0001;
  light.shadow.radius = 4;
  scene.add(light);
  scene.add(light.target);

  //Cria o helper de sombra para a luz direcional
  shadowHelper = new THREE.CameraHelper(light.shadow.camera);
  shadowHelper.visible = false;
  scene.add(shadowHelper);

  //Inicialização da luz ambiente
  const ambientLight = new THREE.AmbientLight();
  ambientLight.intensity = 0.2;
  scene.add(ambientLight);
}

//FUNÇÃO QUE REMOVE AS LUZES
function removeLights() {
  scene.children.forEach((child) => {
    if (child.isLight) {
      scene.remove(child);
    }
  });
}

//FUNÇÃO QUE GERA O MUNDO
function rebuildWorld() {
  removeLights();

  scene.remove(world);

  world.build();

  setupLights();

  scene.add(world);
}

rebuildWorld();

//FUNÇÃO QUE SINCRONIZA OS VALORES DA CAIXA DE SOMBRAS COM O VALOR DO FAR DO FOG PARA ECONOMIZAR MEMÓRIA
function syncShadowWithFog() {
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.left = -scene.fog.far / 10;
  light.shadow.camera.right = scene.fog.far / 10;
  light.shadow.camera.bottom = -scene.fog.far / 10;
  light.shadow.camera.top = scene.fog.far / 10;
  light.shadow.camera.updateProjectionMatrix();
  shadowHelper.update();
}

//EVENTO PARA HABILITAR E DESABILITAR A VIZUALIZAÇÃO DO HELPER DE SOMBRA NA CENA
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "h") {
    event.preventDefault();
    shadowHelper.visible = !shadowHelper.visible;
    gui.domElement.style.display = "block";
  }
});

//CROSSHAIR
const crosshairTexture = new THREE.TextureLoader().load(
  "../textures/crosshair.png"
);
const crosshairMaterial = new THREE.SpriteMaterial({
  map: crosshairTexture,
  color: 0xffffff
});
const crosshair = new THREE.Sprite(crosshairMaterial);
crosshair.scale.set(0.006, 0.006, 1);
scene.add(crosshair);
function updateCrosshair() {
  if (camera.currentCamera == player.camera) {
    const vector = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.currentCamera.quaternion
    );
    crosshair.position
      .copy(camera.currentCamera.position)
      .add(vector.multiplyScalar(0.1));
  }
}

//SKY BOX
const textureLoader = new THREE.TextureLoader();
let textureEquirec = textureLoader.load("../textures/skybox3.png");
textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
scene.background = textureEquirec;

//ÁUDIO
const listener = new THREE.AudioListener();
camera.currentCamera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load("../sounds/backgroundSound.mp3", function (buffer) {
  alert("Para ativar a música tecle 'Q'");
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.1);
});
// Evento para ativar/desativar a música
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "q") {
    event.preventDefault();
    if (sound.isPlaying) {
      sound.pause();
    } else {
      sound.play();
    }
  }
});

function onMouseDown(event) {
  if (player.pointerLockControls.isLocked && player.selectedCoords) {
    world.removeBlock(
      player.selectedCoords.x,
      player.selectedCoords.y,
      player.selectedCoords.z
    );
  }
}
document.addEventListener("mousedown", onMouseDown);

//RENDER LOOP
let previousTime = performance.now();
function animate() {
  light.position.set(
    player.camera.position.x,
    player.camera.position.y + 30,
    player.camera.position.z + 30
  );
  light.target.position.copy(player.camera.position);
  light.target.updateMatrixWorld();

  const currentTime = performance.now();
  const dt = (currentTime - previousTime) / 1000;

  physics.update(dt, player, world);
  player.update(dt, world);

  updateCrosshair();

  renderer.render(scene, camera.currentCamera);

  scene.fog = fog;
  scene.fog.update();
  syncShadowWithFog();
  stats.update();
  world.update();
  previousTime = currentTime;
  requestAnimationFrame(animate);
}

showInformation();
const gui = setupUI(world, rebuildWorld);
animate();

//INFORMAÇÕES NA TELA:
function showInformation() {
  var controls = new InfoBox();
  controls.add("Instructions");
  controls.addParagraph();
  controls.add("Move: WASD or Arrows");
  controls.add("Jump: space or right button");
  controls.add("Reset position: R");
  controls.add("Disable pointerLock: Esc");
  controls.add("Activate pointerLock: P");
  controls.add("Remove voxel: click");
  controls.add("ShadowBox: H");
  controls.add("Toggle cameras: C");
  controls.add("TurnOn/TurnOff Fog: F");
  controls.add("TurnOn/TurnOff Music: Q");
  controls.show();
}
