import * as THREE from 'three';
import { TERRAIN_MANAGER_DEFAULTS } from '../utils/EngineDefaults.js';
import { mergeOptions, toFiniteNumber } from '../utils/ValidationUtils.js';

/**
 * Handles terrain chunk instancing/cloning and keeps a square grid centered around the camera.
 */
export class TerrainManager {
  constructor(renderer, options = {}) {
    this.renderer = renderer ?? null;
    this.options = mergeOptions(TERRAIN_MANAGER_DEFAULTS, options);
    this.options.tileRadius = toFiniteNumber(this.options.tileRadius, TERRAIN_MANAGER_DEFAULTS.tileRadius, 'tileRadius', { min: 0, integer: true });
    this.options.chunkSize = new THREE.Vector2(
      toFiniteNumber(this.options.chunkSize?.x ?? this.options.chunkSize?.width ?? TERRAIN_MANAGER_DEFAULTS.chunkSize.x, TERRAIN_MANAGER_DEFAULTS.chunkSize.x, 'chunkSize.x', { min: 1 }),
      toFiniteNumber(this.options.chunkSize?.y ?? this.options.chunkSize?.depth ?? TERRAIN_MANAGER_DEFAULTS.chunkSize.y, TERRAIN_MANAGER_DEFAULTS.chunkSize.y, 'chunkSize.y', { min: 1 })
    );
    this.group = new THREE.Group();
    this.tiles = [];
    this.basePoints = null;
    this.ready = false;
  }

  setChunkSize(width, depth) {
    this.options.chunkSize.set(
      toFiniteNumber(width, this.options.chunkSize.x, 'chunkSize.width', { min: 1 }),
      toFiniteNumber(depth, this.options.chunkSize.y, 'chunkSize.depth', { min: 1 })
    );
  }

  initialize(basePoints) {
    this.disposeTiles();

    if (!basePoints?.isPoints) {
      this.basePoints = null;
      this.ready = false;
      return false;
    }

    this.basePoints = basePoints;

    if (!this.options.enabled) {
      this.group.add(basePoints);
      this.tiles.push(basePoints);
      this.ready = true;
      return true;
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

    this.ready = this.tiles.length > 0;
    return this.ready;
  }

  update(camera) {
    if (!this.options.enabled || !this.ready || !camera?.position || this.tiles.length === 0) {
      return false;
    }

    const chunkWidth = this.options.chunkSize.x;
    const chunkDepth = this.options.chunkSize.y;

    if (!Number.isFinite(chunkWidth) || !Number.isFinite(chunkDepth) || chunkWidth <= 0 || chunkDepth <= 0) {
      return false;
    }

    const centerX = Math.round(camera.position.x / chunkWidth);
    const centerZ = Math.round(camera.position.z / chunkDepth);
    const diameter = this.options.tileRadius * 2 + 1;

    this.tiles.forEach((tile, index) => {
      if (!tile) {
        return;
      }

      const localX = (index % diameter) - this.options.tileRadius;
      const localZ = Math.floor(index / diameter) - this.options.tileRadius;
      tile.position.set((centerX + localX) * chunkWidth, 0, (centerZ + localZ) * chunkDepth);
    });

    return true;
  }

  disposeTiles() {
    this.tiles.forEach((tile) => {
      if (tile && tile.parent === this.group) {
        this.group.remove(tile);
      }
    });
    this.tiles = [];
    this.ready = false;
  }

  dispose() {
    this.disposeTiles();
    this.basePoints = null;
  }
}
