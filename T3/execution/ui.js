// import { GUI } from "../../libs/util/dat.gui.module.js";
import { GUI } from "../../libs/util/dat.gui.module.js";
import WorldParams from "./Terrain/worldParams.js";

export function setupUI(world, rebuildWorld) {
  const gui = new GUI();
  gui.domElement.style.display = "fixed";

  const params = WorldParams.instance;
  const worldFolder = gui.addFolder("World");
  worldFolder
    .add(params, "distance", 0, 5, 1)
    .onChange((e) => rebuildWorld())
    .name("Draw Distance");

  worldFolder.add(params, "cameraX").name("X").listen();
  worldFolder.add(params, "cameraZ").name("Z").listen();

  worldFolder.add(params.fog, "near", 1, 200, 1).name("Fog Near");
  worldFolder.add(params.fog, "far", 1, 500, 1).name("Fog Far");

  return gui;

  // const terrainFolder = gui.addFolder("Terrain");
  // terrainFolder
  //   .add(params.terrain, "seed", 0, 10000, 1)
  //   .onChange((e) => rebuildWorld())
  //   .name("Seed");
  // terrainFolder
  //   .add(params.terrain, "scale", 10, 100)
  //   .onChange((e) => rebuildWorld())
  //   .name("Scale");
  // terrainFolder
  //   .add(params.terrain, "magnitude", 0, 1)
  //   .onChange((e) => rebuildWorld())
  //   .name("Magnitude");
  // terrainFolder
  //   .add(params.terrain, "offset", 0, 32, 1)
  //   .onChange((e) => rebuildWorld())
  //   .name("Offset");
}
