import * as THREE from "three";
import blockTypeDictionary from "../blocks/blocks.js";

export default class Building {
    constructor() {
        this.building = null;
    }

    async setBuilding() {
        this.building = await this.loadBuilding();
    }

    async loadBuilding() {
        try {
            const response = await fetch(`./T3/execution/builder.json`);
            if (!response.ok) throw new Error(`Erro ao carregar builder`);
        
            const data = await response.json();
            var normalized = await this.normalizeBuilding(data);
            var model = await this.normalizedToModel(normalized);
            return model;
        } catch (error) {
            console.error(`Erro ao carregar o builder:`, error);
            return null;
        }
    }

    normalizeBuilding(blockArray) {
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
        const building = new THREE.Group();

        normalized.forEach((block) => {
        const blockType = Array.from(blockTypeDictionary.values()).find(
            (b) => b.id === block.type
        );
        if (blockType) {
            const cube = new THREE.Mesh(blockType.geometry, blockType.material);
            cube.position.set(block.position.x, block.position.y, block.position.z);
            building.add(cube);
        }
        });

        return building;
    }

    getBuilding() {

    }
}