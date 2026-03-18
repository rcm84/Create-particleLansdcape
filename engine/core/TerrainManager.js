import * as THREE from 'three';

/**
 * Handles terrain chunk instancing/cloning and keeps a square grid centered around the camera.
 * This creates the illusion of an endless world while only drawing a configurable chunk count.
 */
export class TerrainManager {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.options = {
      enabled: false,
      tileRadius: 1,
      chunkSize: new THREE.Vector2(256, 256),
      ...options
    };
    this.group = new THREE.Group();
    this.tiles = [];
  }

  initialize(basePoints) {
    this.group.clear();
    this.tiles = [];

    if (!this.options.enabled) {
      this.group.add(basePoints);
      this.tiles.push(basePoints);
      return;
    }

    const { tileRadius, chunkSize } = this.options;

    for (let z = -tileRadius; z <= tileRadius; z += 1) {
      for (let x = -tileRadius; x <= tileRadius; x += 1) {
        const tile = x === 0 && z === 0 ? basePoints : basePoints.clone();
        tile.position.set(x * chunkSize.x, 0, z * chunkSize.y);
        this.group.add(tile);
        this.tiles.push(tile);
      }
    }
  }

  update(camera) {
    if (!this.options.enabled) {
      return;
    }

    const centerX = Math.round(camera.position.x / this.options.chunkSize.x);
    const centerZ = Math.round(camera.position.z / this.options.chunkSize.y);
    const diameter = this.options.tileRadius * 2 + 1;

    this.tiles.forEach((tile, index) => {
      const localX = (index % diameter) - this.options.tileRadius;
      const localZ = Math.floor(index / diameter) - this.options.tileRadius;
      tile.position.set(
        (centerX + localX) * this.options.chunkSize.x,
        0,
        (centerZ + localZ) * this.options.chunkSize.y
      );
    });
  }
}
