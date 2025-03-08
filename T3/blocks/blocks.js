import * as THREE from "three";

const blockTypeDictionary = new Map();
const textureLoader = new THREE.TextureLoader();

export const textures = {
  //tipo 1
  grass: textureLoader.load("./T3/textures/grass.png"),
  grass_side: textureLoader.load("./T3/textures/grass_side.png"),
  //tipo 2
  dirt: textureLoader.load("./T3/textures/dirt.png"),
  //tipo 3
  stone: textureLoader.load("./T3/textures/stone.png"),
  //tipo 4
  tree_side: textureLoader.load("./T3/textures/tree_side.png"),
  //tipo 5
  leaves: textureLoader.load("./T3/textures/leaves.png"),
  //tipo 7
  sand: textureLoader.load("./T3/textures/sand.png"),
  //tipo 8
  azalea_leaves: textureLoader.load("./T3/textures/azalea_leaves.png"),
  //tipo 9
  jungle_tree_side: textureLoader.load("./T3/textures/jungle_tree_side.png"),
  //tipo 10
  water: textureLoader.load("./T3/textures/water.png")
};

class MapData {
  constructor(id, type, geometry, material) {
    this.id = id;
    this.type = type;
    this.geometry = geometry;
    this.material = material;
  }
}

blockTypeDictionary.set("empty", new MapData(0, "empty", null, null));

// Bloco de Grama (Grass) - Textura diferente para topo, laterais e base
blockTypeDictionary.set(
  "grass",
  new MapData(
    1,
    "grass",
    new THREE.BoxGeometry(),
    [
      new THREE.MeshLambertMaterial({ map: textures.grass_side }), // Frente
      new THREE.MeshLambertMaterial({ map: textures.grass_side }), // Trás
      new THREE.MeshLambertMaterial({ map: textures.grass }),      // Topo
      new THREE.MeshLambertMaterial({ map: textures.dirt }),       // Base
      new THREE.MeshLambertMaterial({ map: textures.grass_side }), // Direita
      new THREE.MeshLambertMaterial({ map: textures.grass_side })  // Esquerda
    ]
  )
);

blockTypeDictionary.set(
  "dirt",
  new MapData(
    2,
    "dirt",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({ map: textures.dirt })
  )
);

blockTypeDictionary.set(
  "stone",
  new MapData(
    3,
    "stone",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({ map: textures.stone })
  )
);

blockTypeDictionary.set(
  "tree_side",
  new MapData(
    4,
    "tree_side",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({ map: textures.tree_side })
  )
);

blockTypeDictionary.set(
  "leaves",
  new MapData(
    5,
    "leaves",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({ 
      map: textures.leaves,
    transparent: true })
  )
);

blockTypeDictionary.set(
  "sapling",
  new MapData(
    6,
    "sapling",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({ map: textures.grass })
  )
);

blockTypeDictionary.set(
  "sand",
  new MapData(
    7,
    "sand",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({ map: textures.sand })
  )
);

blockTypeDictionary.set(
  "azalea_leaves",
  new MapData(
    8,
    "azalea_leaves",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({
      map: textures.azalea_leaves,
      transparent: true,
      alphaTest: 0.1
    })
  )
);

blockTypeDictionary.set(
  "jungle_tree_side",
  new MapData(
    9,
    "jumgle_tree_side",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({ map: textures.jungle_tree_side })
  )
);

blockTypeDictionary.set(
  "water",
  new MapData(
    10,
    "water",
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial({
      map: textures.water,
      transparent: true,
      opacity: 0.5
    })
  )
);

export default blockTypeDictionary;

