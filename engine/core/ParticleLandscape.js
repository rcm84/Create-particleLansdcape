import * as THREE from 'three';
import { HeightmapLoader } from '../loaders/HeightmapLoader.js';
import { HeightmapUtils } from '../utils/HeightmapUtils.js';
import { ParticleRenderer } from './ParticleRenderer.js';
import { TerrainManager } from './TerrainManager.js';
import { FogEffect } from '../effects/FogEffect.js';
import { HoverEffect } from '../effects/HoverEffect.js';
import { MaskEffect } from '../effects/MaskEffect.js';

/**
 * High-level engine facade. It loads heightmaps, builds particle geometry, wires interaction
 * effects, and exposes a compact configuration object for application developers.
 */
export class ParticleLandscape {
  constructor(options = {}) {
    this.options = {
      heightmap: null,
      particleSize: 2,
      density: 1,
      heightScale: 0.35,
      positionScale: 1,
      fog: true,
      baseColor: '#7dd3fc',
      highlightColor: '#f8fafc',
      fogOptions: {},
      hover: true,
      hoverOptions: {},
      mask: false,
      maskOptions: {},
      infiniteTiling: false,
      tileRadius: 1,
      scene: null,
      camera: null,
      renderer: null,
      ...options
    };

    this.scene = this.options.scene;
    this.camera = this.options.camera;
    this.webglRenderer = this.options.renderer;
    this.clock = new THREE.Clock();
    this.loader = new HeightmapLoader();
    this.particleRenderer = new ParticleRenderer({
      particleSize: this.options.particleSize,
      baseColor: this.options.baseColor,
      highlightColor: this.options.highlightColor,
      ...this.options.fogOptions,
      ...this.options.hoverOptions
    });
    this.terrainManager = new TerrainManager(this.particleRenderer, {
      enabled: this.options.infiniteTiling,
      tileRadius: this.options.tileRadius
    });
    this.fogEffect = new FogEffect(this.particleRenderer, this.options.fogOptions);
    this.hoverEffect = null;
    this.maskEffect = new MaskEffect(this.particleRenderer, this.options.maskOptions);
    this.heightmap = null;
    this.data = null;
  }

  async init() {
    if (!this.scene) {
      throw new Error('ParticleLandscape requires a THREE.Scene instance.');
    }

    if (!this.options.heightmap) {
      throw new Error('ParticleLandscape requires a heightmap URL or ImageData input.');
    }

    this.heightmap = typeof this.options.heightmap === 'string'
      ? await this.loader.load(this.options.heightmap)
      : await this.loader.fromImageData(this.options.heightmap);

    this.data = HeightmapUtils.createParticleData(this.heightmap, {
      density: this.options.density,
      heightScale: this.options.heightScale,
      positionScale: this.options.positionScale
    });

    this.particleRenderer.setParticleData(this.data);

    this.terrainManager.options.chunkSize.set(this.data.bounds.width, this.data.bounds.depth);
    this.terrainManager.initialize(this.particleRenderer.points);
    this.scene.add(this.terrainManager.group);

    if (this.options.hover && this.camera && this.webglRenderer) {
      this.hoverEffect = new HoverEffect(
        this.particleRenderer,
        this.camera,
        this.webglRenderer.domElement,
        this.options.hoverOptions
      );
      this.particleRenderer.setHoverOptions(this.options.hoverOptions);
    }

    if (this.options.mask) {
      this.maskEffect.update();
    }

    if (this.options.fog) {
      this.fogEffect.update(this.options.fogOptions);
    }

    return this;
  }

  update() {
    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;
    this.particleRenderer.update(delta, elapsed);
    this.terrainManager.update(this.camera);

    if (this.hoverEffect) {
      this.hoverEffect.update();
    }
  }

  setMask(center, radius, softness = this.maskEffect.softness) {
    this.maskEffect.center.copy(center);
    this.maskEffect.radius = radius;
    this.maskEffect.softness = softness;
    this.maskEffect.update();
  }

  dispose() {
    this.hoverEffect?.dispose();
    this.scene?.remove(this.terrainManager.group);
    this.particleRenderer.dispose();
  }
}
