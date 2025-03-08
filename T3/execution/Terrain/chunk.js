import * as THREE from "three";
import blockTypeDictionary from "../../blocks/blocks.js";
import WorldParams from "./worldParams.js";

class BlockData {
  constructor(typeId, instanceId = null) {
    this.id = typeId;
    this.instanceId = instanceId;
  }
}

const params = WorldParams.instance;

export default class Chunk extends THREE.Group {
  constructor(worldX, worldZ, worldSimplex, worldResources, building, hasBuilding) {
    super();
    this.data = [];
    this.instancedMeshes = {};
    this.simplex = worldSimplex;
    this.resources = worldResources;
    this.building = building;
    this.hasBuilding = hasBuilding;

    //O nome esta errado
    this.worldX = worldX;
    this.worldZ = worldZ;

    this.chunkX = worldX;
    this.chunkZ = worldZ;

    this.trees = [];
    this.setThisPosition(worldX, worldZ);

    this.utils = {
      airId: blockTypeDictionary.get("empty").id,
      waterId: blockTypeDictionary.get("water").id,
      saplingId: blockTypeDictionary.get("sapling").id
    };
    //this.generate();
  }

  setThisPosition(worldX, worldZ) {
    this.position.set(
      worldX * params.chunkSize.w,
      0,
      worldZ * params.chunkSize.w
    );
  }

  update() {}

  generate() {
    this.initializeTerrain();
    this.generateTerrain();
    this.initializeMashes();
    this.generateMeshes();

    this.generateTrees();

    this.loaded = true;
    return this;
  }

  //FUNÇÃO QUE CRIA UMA ESTRUTURA VAZIA PARA ARMAZENAR OS BLOCOS DO CHUNK
  initializeTerrain() {
    this.data = [];
    for (let x = 0; x < params.chunkSize.w; x++) {
      const slice = [];
      for (let y = 0; y < params.chunkSize.h; y++) {
        const row = [];
        for (let z = 0; z < params.chunkSize.w; z++) {
          //preenche com blocos "vazios"
          row.push(new BlockData(blockTypeDictionary.get("empty").id));
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  //Gera o terreno usando ruído simplex.
  generateTerrain() {
    const maxHeight = params.terrain.maxHeight;
    const scale = params.terrain.scale;
    const minTreeDistance = params.trees.minDistance;
    const waterLevel = params.terrain.waterLevel;

    const treeThreshold = params.trees.threshold;
    const treeFactor = params.trees.factor;

    // const maxHeight = 20;
    // const scale = 100;

    // const minTreeDistance = 5;
    // const treeThreshold = 0.9;
    // const treeFactor = 1000;

    const saplingPositions = [];

    for (let x = 0; x < params.chunkSize.w; x++) {
      for (let z = 0; z < params.chunkSize.w; z++) {
        const gx = this.position.x + x;
        const gz = this.position.z + z;

        //ruído simplex
        const noise3D = this.simplex.noise(gx / scale, gz / scale);

        //Cálculo da altura do terreno
        const height = Math.floor(((noise3D + 1) * maxHeight) / 2);

        //Outro ruído simplex é gerado para criar variação nas camadas do solo (dirt, stone, etc...)
        const layerNoise = this.simplex.noise(
          gx / (scale * 2),
          gz / (scale * 2)
        );

        //Agora, a função itera verticalmente (eixo y), definindo o tipo de bloco para cada nível de altura:
        for (let y = 0; y < params.chunkSize.h; y++) {
          const gy = this.position.y + y;

          let type = 0;

          if (gy === height) {
            type = blockTypeDictionary.get("grass").id;

            //Um novo ruído simplex (treeNoise) é gerado para decidir onde plantar árvores
            const treeNoise = this.simplex.noise(
              (gx + treeFactor) / 10,
              (gz + treeFactor) / 10
            );

            if (y <= params.terrain.waterLevel && y <= height) {
              type = blockTypeDictionary.get("sand").id;
            } else if (treeNoise > treeThreshold) {
              let canPlaceSapling = true;
              for (const pos of saplingPositions) {
                const dx = pos.x - x;
                const dz = pos.z - z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance < minTreeDistance) {
                  canPlaceSapling = false;
                  break;
                }
              }

              if (canPlaceSapling) {
                type = blockTypeDictionary.get("sapling").id;
                saplingPositions.push({ x, z });
              }
            }
          } else if (
            gy < height &&
            gy >= height - 3 + Math.floor(layerNoise * 2)
          ) {
            type = blockTypeDictionary.get("dirt").id;
          } else if (gy < height - 3 + Math.floor(layerNoise * 2)) {
            type = blockTypeDictionary.get("stone").id;
          } else if (gy <= waterLevel) {
            type = blockTypeDictionary.get("water").id;
          }

          //O bloco gerado (grass, dirt, stone ou sapling) é armazenado na estrutura de dados do chunk.
          this.data[x][y][z] = new BlockData(type);
        }
      }
    }
  }

  //é responsável por inicializar malhas instanciadas (InstancedMesh) para renderização eficiente de blocos. Ela identifica quais tipos de blocos existem no chunk e cria uma malha instanciada para cada tipo.
  initializeMashes() {
    const maxCount =
      params.chunkSize.w * params.chunkSize.w * params.chunkSize.h;

    const uniqueValues = new Set();
    this.instancedMeshes = {};

    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data[i].length; j++) {
        for (let k = 0; k < this.data[i][j].length; k++) {
          if (this.data[i][j][k].id !== blockTypeDictionary.get("empty").id)
            uniqueValues.add(this.data[i][j][k].id);
        }
      }
    }

    const blockArray = Array.from(blockTypeDictionary.values());

    uniqueValues.forEach((blockId) => {
      const block = blockArray.filter((x) => x.id == blockId)[0];

      if (block != null && block.id != blockTypeDictionary.get("empty").id) {
        const mesh = new THREE.InstancedMesh(
          block.geometry,
          block.material,
          maxCount
        );

        mesh.name = blockId;
        mesh.chunkData = {
          x: this.chunkX,
          z: this.chunkZ
        };

        mesh.blockData = {
          name: block.type,
          id: block.id
        };

        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.instancedMeshes[blockId] = mesh;
      }
    });
  }

  //responsável por retornar um bloco localizado em uma posição específica dentro do chunk.
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  //gerar e atualizar as malhas (meshes) dos blocos do chunk
  generateMeshes() {
    this.clear();
    const matrix = new THREE.Matrix4();

    for (let x = 0; x < params.chunkSize.w; x++) {
      for (let y = 0; y < params.chunkSize.h; y++) {
        for (let z = 0; z < params.chunkSize.w; z++) {
          const blockId = this.getBlock(x, y, z).id;

          if (blockId === blockTypeDictionary.get("empty").id) continue;

          const mesh = this.instancedMeshes[blockId];
          const instanceId = mesh.count;

          if (!this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
      }
    }
    this.add(...Object.values(this.instancedMeshes));
  }

  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  inBounds(x, y, z) {
    if (
      x >= 0 &&
      x < params.chunkSize.w &&
      y >= 0 &&
      y < params.chunkSize.h &&
      z >= 0 &&
      z < params.chunkSize.w
    ) {
      return true;
    } else {
      return false;
    }
  }

  isBlockObscured(x, y, z) {
    var emptyID = blockTypeDictionary.get("empty").id;

    const up = this.getBlock(x, y + 1, z)?.id ?? emptyID;
    const down = this.getBlock(x, y - 1, z)?.id ?? emptyID;
    const left = this.getBlock(x + 1, y, z)?.id ?? emptyID;
    const right = this.getBlock(x - 1, y, z)?.id ?? emptyID;
    const forward = this.getBlock(x, y, z + 1)?.id ?? emptyID;
    const back = this.getBlock(x, y, z - 1)?.id ?? emptyID;

    if (
      up === emptyID ||
      down === emptyID ||
      left === emptyID ||
      right === emptyID ||
      forward === emptyID ||
      back === emptyID
    ) {
      return false;
    } else {
      return true;
    }
  }

  update() {}

  generateTrees() {
    for (let x = 0; x < params.chunkSize.w; x++) {
      for (let z = 0; z < params.chunkSize.w; z++) {
        for (let y = 0; y < params.chunkSize.h; y++) {
          if (this.data[x][y][z].id === blockTypeDictionary.get("sapling").id) {
            this.createTree(x, y, z);
            if (this.hasBuilding) {
              this.createBuilding(
                x + 5,
                y, 
                z + 7,
              );
            }
          }
        }
      }
    }
  }

  createTree(x, y, z) {
    const tree = this.resources.getRandomTree();
    tree.position.set(x, y + 1, z);

    tree.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.add(tree);
    this.trees.push(tree);
  }

  async createBuilding(x, y, z) {
    await this.building.setBuilding();
    if (y + 4 > 16) {
      y = 16;
    }
    else {
      y = y + 3;
    }
    this.building.building.position.set(x, y, z);

    this.add(this.building.building);
  }

  disposeInstances() {
    this.traverse((obj) => {
      if (obj.dispose) obj.dispose();
    });
    this.clear();
  }

  getSurfaceHeight(x, z) {
    const maxHeight = 20;
    const scale = params.terrain.scale;
    const gx = this.position.x / params.chunkSize.w + x;
    const gz = this.position.z / params.chunkSize.w + z;

    const noise3D = this.simplex.noise(gx / scale, gz / scale);

    const height = Math.floor(((noise3D + 1) * maxHeight) / 2);

    return height;
  }

  // removeBlock(x, y, z) {
  //   const block = this.getBlock(x, y, z);
  //   if (block && block.id !== blockTypeDictionary.get("empty").id) {
  //     this.deleteBlockInstance(x, y, z);
  //   }
  // }

  removeBlock(x, y, z, instanceId = null) {
    const { airId, saplingId, waterId } = this.utils;
    const block = this.getBlock(x, y, z);
    const blockId = block.id;

    var mesh;
    if (!instanceId) {
      mesh = this.instancedMeshes[blockId];
    }

    console.log("remove block chunk ", block);
    console.log("coords ", x, y, z);

    //debugger;

    if (block && blockId !== airId && blockId !== waterId) {
      this.deleteBlockInstance(x, y, z, instanceId);
      this.setBlockId(x, y, z, airId);
    }
  }

  revealIfObscured(x, y, z) {
    console.log("reveal cords", x, y, z);
    console.log(this.isBlockObscured(x, y, z));
    
    if (this.isBlockObscured(x, y, z)) {
      this.addBlockInstance(x, y, z);
    }
  }

  deleteBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (
      block.id === blockTypeDictionary.get("empty").id ||
      block.instanceId === null
    )
      return;

    const mesh = this.children.find(
      (instanceMesh) => instanceMesh.name === block.id
    );
    const instanceId = block.instanceId;

    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    const v = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    mesh.setMatrixAt(instanceId, lastMatrix);
    mesh.count--;

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    this.setBlockInstanceId(x, y, z, null);
    this.setBlockInstanceId(x, y, z, blockTypeDictionary.get("empty").id);
  }

  setBlockId(x, y, z, blockId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = blockId;
    }
  }
}
