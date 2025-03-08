export default class WorldParams {
  static instance = new WorldParams();
  constructor() {

    // Usado para cálculos de alcance da neblina
    this.distance = 4;

    this.startX = 0;
    this.startZ = 0;

    this.cameraX = 0;
    this.cameraZ = 0;

    this.chunkSize = {
      w: 35,
      h: 20
    };
    this.terrain = {
      maxHeight: 20,
      seed: 0,
      scale: 100,
      magnitude: 8,
      offset: 6,
      waterLevel: 4
    };
    this.fog = {
      near: 100,
      far: 500,
      showFog: true,
      calculated: false, //Define se a neblina deve ser calculada dinamicamente.
    };
    this.trees = {
      factor: 1000,
      threshold: 0.9,
      minDistance: 5
    };
  }

  //Esse método recalcula a distância da neblina (near e far) com base na distância e tamanho do terreno
  calculateFog() {
    return {
      near: this.chunkSize.w * this.distance - this.chunkSize.w * 1,
      far: this.chunkSize.w * this.distance - this.chunkSize.w * 0.5
    };
  }
}
