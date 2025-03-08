import * as THREE from "three";
import WorldParams from "./worldParams.js";
import Chunk from "./chunk.js";
import { SimplexNoise } from "../../../build/jsm/math/SimplexNoise.js"
import blockTypeDictionary from "../../blocks/blocks.js";
// import { SimplexNoise } from "../../../build/jsm/math/SimplexNoise.js";

const params = WorldParams.instance;
export default class World extends THREE.Group {
  /**
   *
   */
  constructor(resourcesClass, player, building) {
    super();
    this.simplex = new SimplexNoise();
    this.loadedChunks = [];

    this.resources = resourcesClass;
    this.player = player;
    this.lastHeight = 0;
    this.building = building;
    this.chunkCounter = 0;

    this.utils = {
      airId: blockTypeDictionary.get("empty").id,
      waterId: blockTypeDictionary.get("water").id,
      saplingId: blockTypeDictionary.get("sapling").id
    };
    //this.build();
  }

  build() {
    this.clear();
    for (let worldX = -params.distance; worldX <= params.distance; worldX++) {
      for (let worldZ = -params.distance; worldZ <= params.distance; worldZ++) {
        this.generateChunk(worldX, worldZ);
      }
    }
  }

  async update() {
    var target = this.player.getWorldPosition();
    params.playerX = Math.floor(target.x);
    params.playerZ = Math.floor(target.z);

    const chunks = this.getNearChunksPositions(target);

    // **First, ensure new chunks are generated**
    await this.generateChunks(chunks);

    // **Then remove old ones**
    this.removeChunks(chunks);

    this.loadedChunks = chunks;

    // **Update player position to the correct height**
    //this.updatePlayerHeight();
  }

  removeChunks(visibleChunks) {
    const visibleSet = new Set(visibleChunks.map(({ x, z }) => `${x},${z}`));
    const notVisible = this.loadedChunks.filter(
      ({ x, z }) => !visibleSet.has(`${x},${z}`)
    );

    const objs = this.children.filter((chunkObj) => {
      const pos = { x: chunkObj.worldX, z: chunkObj.worldZ };
      return notVisible.find(({ x, z }) => x == pos.x && z == pos.z);
    });

    for (const chunk of objs) {
      if (chunk.disposeInstances) chunk.disposeInstances();
      this.remove(chunk);
    }
  }

  async generateChunks(visibleChunks) {
    const loadedSet = new Set(this.loadedChunks.map(({ x, z }) => `${x},${z}`));
    const notLoaded = visibleChunks.filter(
      ({ x, z }) => !loadedSet.has(`${x},${z}`)
    );

    for (const { x, z } of notLoaded) {
      console.log("Generating chunk: " + x, z);
      await this.generateChunk(x, z); // Wait for each chunk to load
    }
  }

  getNearChunksPositions({ x, z }) {
    const pos = this.worldToChunk(x, z);
    var positions = [];

    for (
      let worldX = pos.chunkX;
      worldX <= pos.chunkX + params.distance * 2;
      worldX++
    ) {
      for (
        let worldZ = pos.chunkZ;
        worldZ <= pos.chunkZ + params.distance * 2;
        worldZ++
      ) {
        positions.push({
          x: worldX,
          z: worldZ
        });
      }
    }

    return positions;
  }

  updatePlayerHeight() {
    const height = this.getWorldHeight(
      this.player.position.x,
      this.player.position.z
    );

    if (height > 0) {
      // If a valid height is found
      this.player.position.y = height;
    } else {
      console.warn("Player height not found, setting default height.");
      this.player.position.y = 16; // Default safety height
    }
  }

  async generateChunk(worldX, worldZ) {
    console.log(worldX, worldZ);
    return new Promise((resolve) => {
      this.chunkCounter++;
      const chunk = new Chunk(worldX, worldZ, this.simplex, this.resources, this.building, this.chunkCounter % 20 === 0);

      chunk.generate();

      this.loadedChunks.push({ x: worldX, z: worldZ });
      this.add(chunk);

      console.log(`Chunk (${worldX}, ${worldZ}) generated.`);
      resolve();
    });
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) {
        chunk.disposeInstances();
      }
    });
    this.clear();
  }

  chunkToWorld(chunkX, chunkZ) {
    return {
      worldX: chunkX * params.chunkSize.w,
      worldZ: chunkZ * params.chunkSize.w,
      chunkX: chunkX,
      chunkZ: chunkZ,
      blockX: 0,
      blockZ: 0
    };
  }

  worldToChunk(x, z) {
    // const chunkCoords = {
    //   x: Math.floor(x / params.chunkSize),
    //   z: Math.floor(z / params.chunkSize)
    // };
    // const blockCoords = {
    //   x: x - params.chunkSize * chunkCoords.x,
    //   z: z - params.chunkSize * chunkCoords.z
    // };
    // return {
    //   worldX: x,
    //   worldZ: z,
    //   chunkX: chunkCoords.x,
    //   chunkZ: chunkCoords.z,
    //   blockX: blockCoords.x,
    //   blockZ: blockCoords.z
    // };
  }

  worldToChunk(worldX, worldZ) {
    return {
      worldX: worldX,
      worldZ: worldZ,
      chunkX: Math.floor(worldX / params.chunkSize.w),
      chunkZ: Math.floor(worldZ / params.chunkSize.w),
      blockX: worldX % params.chunkSize.w,
      blockZ: worldZ % params.chunkSize.w
    };
  }

  getWorldHeight(playerX, playerZ) {
    // Converte as coordenadas do mundo para coordenadas do chunk
    const { chunkX, chunkZ, blockX, blockZ } = this.worldToChunk(
      playerX,
      playerZ
    );

    // Encontra o chunk correspondente
    const chunk = this.loadedChunks.find(
      (c) => c.x === chunkX && c.z === chunkZ
    );

    // Se o chunk não estiver carregado, retorne um valor padrão (por exemplo, 0)
    if (!chunk) {
      console.log("Chunk não carregado");
      return 0;
    }

    // encontrar um objeto da classe Chunk dentro da lista this.children já que cada chunk do mundo do jogo foi instanciado como um objeto e armazenado nessa lista this.children
    const chunkInstance = this.children.find(
      (c) => c.worldX === chunkX && c.worldZ === chunkZ
    );

    if (chunkInstance) {
      //calcula a altura do terreno naquele ponto específico do chunk.
      const worldHeight = chunkInstance.getSurfaceHeight(blockX, blockZ);
      this.lastHeight = worldHeight + 1.1;
      return worldHeight + 1.1;
    }
    console.log("Chunk não encontrado");
    return 0;
  }

  checkPlayerCollisionWithTrees(collisionBox) {
    let collisionDetected = false;
    for (const chunk of this.children) {
      // Verifica se o chunk tem árvores
      if (chunk.trees && chunk.trees.length > 0) {
        for (const tree of chunk.trees) {
          // Cria uma caixa de colisão para a árvore
          const treeCollisionBox = new THREE.Box3().setFromObject(tree);

          // Verifica se há interseção entre a caixa de colisão do jogador e a da árvore
          if (collisionBox.intersectsBox(treeCollisionBox)) {
            console.log("Colisão com árvore detectada.");
            collisionDetected = true;
          }
        }
      }
    }
    return collisionDetected;
  }

    checkPlayerCollisionWithBuilding(collisionBox) {
      let collisionDetected = false;
      for (const chunk of this.children) {
        if (chunk.building && chunk.building.building) {
          const buildingCollisionBox = new THREE.Box3().setFromObject(chunk.building.building);
  
          if (collisionBox.intersectsBox(buildingCollisionBox)) {
            console.log("Colisão com edificação detectada.");
            collisionDetected = true;
          }
        }
      }
      return collisionDetected;
    }

  getBlock(x, y, z) {
    const { chunkX, chunkZ, blockX, blockZ } = this.worldToChunk(x, z);

    const chunk = this.children.find(
      (c) => c.worldX === chunkX && c.worldZ === chunkZ
    );

    if (chunk) {
      return chunk.getBlock(blockX, y, blockZ);
    }

    return null;
  }

  // removeBlock(x, y, z) {
  //   const coords = this.worldToChunk(x, z);
  //   const chunk = new Chunk(
  //     coords.chunkX,
  //     coords.chunkZ,
  //     this.simplex,
  //     this.resources
  //   );

  //   if (chunk) {
  //     console.log(`Removing block at (${x}, ${y}, ${z})`);
  //     chunk.removeBlock(coords.blockX, y, coords.blockZ);
  //   } else {
  //     console.log(
  //       `Chunk not found for coordinates (${coords.chunkX}, ${coords.chunkZ})`
  //     );
  //   }
  // }

  removeBlock(x, y, z, instanceId = null) {
    const { chunkX, chunkZ, blockX, blockZ, worldX, worldZ } =
      this.worldToChunk(x, z);
    const chunk = this.getChunk(chunkX, chunkZ);

    if (y === 0) return;

    if (chunk) {
      //TODO::ALTERAR A VERIFICAÇAO DE BLOCOS OCULTADOS
      //meshes estão sendo adicionadas por cima de outras
      //primeiro revela os não exibidos
      this.revealBlock(x - 1, y, z);
      this.revealBlock(x + 1, y, z);
      this.revealBlock(x, y - 1, z);
      this.revealBlock(x, y + 1, z);
      this.revealBlock(x, y, z - 1);
      this.revealBlock(x, y, z + 1);

      //depois remove
      console.log("remove block ", x, y, z, instanceId);
      chunk.removeBlock(blockX, y, blockZ, instanceId);
    }
  }

  revealBlock(x, y, z) {
    const { chunkX, chunkZ, blockX, blockZ, worldX, worldZ } =
      this.worldToChunk(x, z);

    const chunk = this.getChunk(chunkX, chunkZ);

    if (chunk) {
      chunk.revealIfObscured(blockX, y, blockZ);
    }
  }

  getChunk(chunkX, chunkZ) {
    return this.children.find(
      // (chunk) => chunk.userData.x === chunkX && chunk.userData.z === chunkZ
      (chunk) => chunk.chunkX === chunkX && chunk.chunkZ === chunkZ
    );
  }
}
