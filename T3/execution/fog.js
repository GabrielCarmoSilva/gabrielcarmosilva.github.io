import * as THREE from "three";
import WorldParams from "./Terrain/worldParams.js";

const param = WorldParams.instance;

//define um sistema de neblina (Fog) que é atualizado dinamicamente com base em parâmetros globais do mundo (WorldParams).
export default class Fog extends THREE.Fog {
  //Isso cria uma instancia estatica, garantindo que somente uma instância de Fog seja usada em todo o código.
  static instance = new Fog();
  constructor() {
    super(0x80a0e0, 100, 500);
  }

  update() {
    //Se calculated for true, ele recalcula os valores de neblina chamando calculateFog()
    if (param.fog.calculated) {
      const fog = param.calculateFog();

      this.near = fog.near;
      this.far = fog.far;
    }
    else {
      //Caso contrário, usa os valores fixos de param.fog.
      this.near = param.fog.near;
      this.far = param.fog.far;
    }

    //Isso permite que a neblina se adapte dinamicamente ao mundo conforme o jogador se move ou o terreno muda.
  }
}
