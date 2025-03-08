import * as THREE from "three";
import blockTypeDictionary from "../blocks/blocks.js";

export default class ResourceManager {
  /**
   *
   */
  constructor() {
    this.treeModels = [];
    this.treeModelIsLoaded = false;
  }

  async loadTreeModels() {
    try {
      const response = await fetch("./T3/trees/index.json");
      if (!response.ok) throw new Error("Erro ao carregar index.json");

      const files = await response.json();
      for (const file of files) {
        const tree = await this.loadTree(file);
        this.treeModels.push(tree);
      }
    } catch (error) {
      console.error("Erro ao carregar as árvores:", error);
    }
  }

  async loadTree(fileName) {
    try {
      const response = await fetch(`./T3/trees/${fileName}`);
      if (!response.ok) throw new Error(`Erro ao carregar ${fileName}`);

      const data = await response.json();
      var normalized = await this.normalizeTree(data);
      var model = await this.normalizedToModel(normalized);
      return model;
    } catch (error) {
      console.error(`Erro ao carregar a árvore ${fileName}:`, error);
      return null;
    }
  }

  normalizeTree(blockArray) {
    const minY = Math.min(...blockArray.map((block) => block.position.y));
    const minX = Math.min(...blockArray.map((block) => block.position.x));
    const minZ = Math.min(...blockArray.map((block) => block.position.z));

    return blockArray.map((block) => ({
      ...block,
      position: {
        x: block.position.x - minX,
        y: block.position.y - minY,
        z: block.position.z - minZ
      }
    }));
  }

  normalizedToModel(normalized) {
    const tree = new THREE.Group();

    normalized.forEach((block) => {
      const blockType = Array.from(blockTypeDictionary.values()).find(
        (b) => b.id === block.type
      );
      if (blockType) {
        const cube = new THREE.Mesh(blockType.geometry, blockType.material);
        cube.position.set(block.position.x, block.position.y, block.position.z);
        tree.add(cube);
      }
    });

    return tree;
  }
  getRandomTree() {
    if (this.treeModels.length === 0) return null;
    const index = Math.floor(Math.random() * this.treeModels.length);
    var t = this.treeModels[index].clone(true);
    return t;
  }
}
