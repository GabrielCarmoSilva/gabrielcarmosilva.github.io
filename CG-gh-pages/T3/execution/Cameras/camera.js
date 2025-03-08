import * as THREE from "three";
import { OrbitControls } from "/build/jsm/controls/OrbitControls.js";

export class Camera {
  constructor(renderer, scene, player) {
    console.log("Inicializando câmera...");
    this.renderer = renderer;
    this.scene = scene;
    this.player = player;

    // Configurações para camera de inspeção
    this.fov = 75;
    this.aspect = window.innerWidth / window.innerHeight;
    this.near = 0.1;
    this.far = 500;

    // Câmera de inspeção (OrbitControls)
    this.inspectionCamera = new THREE.PerspectiveCamera(
      this.fov,
      this.aspect,
      this.near,
      this.far
    );
    this.inspectionCamera.position.set(0, 60, 240);
    this.orbitControls = new OrbitControls(
      this.inspectionCamera,
      this.renderer.domElement
    );
    this.orbitControls.enableDamping = true;

    //Clona as posições anteriores das câmeras para alternância entre as câmeras
    this.previousPosition = {
      inspection: this.inspectionCamera.position.clone(),
      firstPerson: this.player.camera.position.clone()
    };

    // Define a câmera atual e o modo inicial (inspeção)
    this.currentCamera = this.inspectionCamera;
    this.isInspectionMode = true;
    this.player.cameraHelper.visible = false;

    // Alternar câmeras com a tecla 'C'
    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "c") {
        this.toggleCamera();
      }
    });
  }

  toggleCamera() {
    if (this.isInspectionMode) {
      // Alterna para câmera de primeira pessoa
      this.previousPosition.inspection.copy(this.inspectionCamera.position);
      this.player.camera.position.copy(this.previousPosition.firstPerson);
      this.currentCamera = this.player.camera;
      if (!this.player.pointerLockControls.isLocked) {
        this.player.pointerLockControls.lock();
      }
      this.isInspectionMode = false;
      console.log("Modo: Primeira Pessoa");
    } else {
      // Alterna para câmera de inspeção
      this.previousPosition.firstPerson.copy(this.player.camera.position);
      this.inspectionCamera.position.copy(this.previousPosition.inspection);
      this.currentCamera = this.inspectionCamera;
      document.exitPointerLock();
      this.player.cameraHelper.visible = false;
      this.isInspectionMode = true;
      console.log("Modo: Inspeção");
    }
  }
}
