import * as THREE from "three";
// import { PointerLockControls } from '../../../build/jsm/controls/PointerLockControls.js';
import { PointerLockControls } from "../../../build/jsm/controls/PointerLockControls.js";

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  radius = 0.5;
  height = 1.75;
  jumpSpeed = 10;
  onGround = false;

  maxSpeed = 3;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  worldVelocity = new THREE.Vector3();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  intersectedBlock = null;

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  pointerLockControls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(),
    0,
    4
  );
  selectedCoords = null;

  constructor(scene) {
    console.log("Inicializando player...");
    this.position.set(24, 20, 24);
    this.scene = scene;
    this.scene.add(this.camera);
    this.scene.add(this.cameraHelper);

    document.addEventListener("keydown", this.onkeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
    window.addEventListener("mousedown", this.onMouseDown.bind(this));

    this.boxHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({
        wireframe: false,
        transparent: true,
        opacity: 0
      })
    );
    scene.add(this.boxHelper);

    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa
    });
    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);
  }

  get worldVelocity() {
    this.worldVelocity.copy(this.velocity);
    this.worldVelocity.applyEuler(
      new THREE.Euler(0, this.camera.rotation.y, 0)
    );
    return this.worldVelocity;
  }

  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];

      const chunk = intersection.object.parent;

      const blockMatrix = new THREE.Matrix4();
      if (intersection.object.isInstancedMesh) {
        intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);
        // console.log("block name", intersection.object.blockData.name);
      } else {
        blockMatrix.identity(); // ou use a matriz de transformação do objeto
        blockMatrix.setPosition(intersection.object.position);
      }

      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }

    // if (this.selectedCoords)
    //   console.log("selectedCoords: ", this.selectedCoords);
  }

  updateWorldVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  addInputs(dt) {
    if (this.pointerLockControls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.pointerLockControls.moveRight(this.velocity.x * dt);
      this.pointerLockControls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;
    }
  }

  //FUNÇÃO QUE ATUALIZA A CAIXA DE COLISÃO DO PLAYER
  updateBoxHelper() {
    this.boxHelper.position.copy(this.position);
    this.boxHelper.position.y -= this.height / 2;
  }

  get position() {
    return this.camera.position;
  }

  //FUNÇÃO QUE RETORNA A POSIÇÃO DO PLAYER NO MUNDO
  getWorldPosition() {
    return { x: this.position.x, z: this.position.z };
  }

  update(dt, world) {
    this.addInputs(dt);
    this.updateBoxHelper();
    this.updateRaycaster(world);

    // Cria uma caixa de colisão para o player
    const playerCollisionBox = new THREE.Box3().setFromObject(this.boxHelper);

    // Verifica colisão com árvores
    if (world.checkPlayerCollisionWithTrees(playerCollisionBox) || world.checkPlayerCollisionWithBuilding(playerCollisionBox)) {
      const direction = new THREE.Vector3();
      direction.copy(this.velocity).normalize();
      this.position.add(direction.multiplyScalar(-0.5));
      this.velocity.set(0, this.velocity.y, 0);
    }
  }

  onkeyDown(event) {
    switch (event.code) {
      case "KeyW":
        this.input.z = this.maxSpeed;
        break;
      case "KeyS":
        this.input.z = -this.maxSpeed;
        break;
      case "KeyA":
        this.input.x = -this.maxSpeed;
        break;
      case "KeyD":
        this.input.x = this.maxSpeed;
        break;
      case "KeyR":
        this.position.set(32, 20, 32);
        break;
      case "KeyP":
        this.pointerLockControls.lock();
        break;

      case "ArrowUp":
        this.input.z = this.maxSpeed;
        break;
      case "ArrowDown":
        this.input.z = -this.maxSpeed;
        break;
      case "ArrowLeft":
        this.input.x = -this.maxSpeed;
        break;
      case "ArrowRight":
        this.input.x = this.maxSpeed;
        break;

      case "Space":
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        this.input.z = 0;
        break;
      case "KeyS":
        this.input.z = 0;
        break;
      case "KeyA":
        this.input.x = 0;
        break;
      case "KeyD":
        this.input.x = 0;
        break;

      case "ArrowUp":
        this.input.z = 0;
        break;
      case "ArrowDown":
        this.input.z = 0;
        break;
      case "ArrowLeft":
        this.input.x = 0;
        break;
      case "ArrowRight":
        this.input.x = 0;
        break;
    }
  }

  //EVENTO QUE FAZ O PLAYER PULAR AO APERTAR O BOTÃO DIREITO DO MOUSE
  onMouseDown(event) {
    if (event.button === 2) {
      // Botão direito do mouse
      if (this.onGround) {
        this.velocity.y += this.jumpSpeed;
      }
    }
  }
}
