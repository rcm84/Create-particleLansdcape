import * as THREE from 'three';
import { HeightmapLoader } from '../loaders/HeightmapLoader.js';
import { HeightmapUtils } from '../utils/HeightmapUtils.js';
import { ParticleRenderer } from './ParticleRenderer.js';
import { TerrainManager } from './TerrainManager.js';
import { FogEffect } from '../effects/FogEffect.js';
import { HoverEffect } from '../effects/HoverEffect.js';
import { MaskEffect } from '../effects/MaskEffect.js';
import { PARTICLE_LANDSCAPE_DEFAULTS } from '../utils/EngineDefaults.js';
import {
  ensureColorString,
  ensurePositiveNumber,
  isPlainObject,
  mergeOptions,
  toFiniteNumber
} from '../utils/ValidationUtils.js';

/**
 * @typedef {Object} ParticleLandscapeOptions
 * @property {string|ImageData|Object|null} [heightmap=null] Heightmap URL or ImageData-like object.
 * @property {number} [particleSize=2] GPU point size in world-scaled pixels.
 * @property {number} [density=1] Sampling density where 1 means every pixel becomes a particle.
 * @property {number} [heightScale=0.35] Multiplier applied to grayscale height values.
 * @property {number} [positionScale=1] Spacing multiplier for particle x/z placement.
 * @property {boolean} [fog=true] Enables atmospheric fog uniforms.
 * @property {string} [baseColor="#7dd3fc"] Base particle tint.
 * @property {string} [highlightColor="#f8fafc"] Highlight tint mixed by height and hover.
 * @property {Object} [fogOptions={}] Fog uniform overrides.
 * @property {boolean} [hover=true] Enables pointer interaction.
 * @property {Object} [hoverOptions={}] Hover configuration, including `planeHeight`.
 * @property {boolean} [mask=false] Enables circular reveal masking.
 * @property {Object} [maskOptions={}] Mask configuration.
 * @property {boolean} [infiniteTiling=false] Enables chunk tiling around the camera.
 * @property {number} [tileRadius=1] Number of chunks rendered in each direction when tiling.
 * @property {THREE.Scene|null} [scene=null] Target scene.
 * @property {THREE.Camera|null} [camera=null] Active camera used for hover/tiling.
 * @property {THREE.WebGLRenderer|null} [renderer=null] Renderer used for resize and hover bindings.
 * @property {boolean} [autoInit=false] If true, `init()` is triggered by the constructor.
 */

/**
 * High-level engine facade. It loads heightmaps, builds particle geometry, wires interaction
 * effects, and exposes a compact lifecycle for application developers.
 */
export class ParticleLandscape {
  /**
   * @param {ParticleLandscapeOptions} options
   */
  constructor(options = {}) {
    if (!isPlainObject(options)) {
      throw new TypeError('ParticleLandscape options must be provided as an object.');
    }

    this.options = this.#normalizeOptions(options);
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
    this.fogEffect = new FogEffect(this.particleRenderer, { enabled: this.options.fog, ...this.options.fogOptions });
    this.hoverEffect = null;
    this.maskEffect = new MaskEffect(this.particleRenderer, this.options.maskOptions);
    this.heightmap = null;
    this.data = null;
    this.elapsedTime = 0;
    this.initialized = false;
    this.disposed = false;
    this.initializing = null;

    if (this.options.autoInit) {
      this.initializing = this.init();
    }
  }

  async init() {
    if (this.disposed) {
      throw new Error('ParticleLandscape has been disposed and cannot be initialized again.');
    }

    if (this.initialized) {
      return this;
    }

    if (this.initializing) {
      return this.initializing;
    }

    this.initializing = this.#initialize();

    try {
      await this.initializing;
      this.initialized = true;
      return this;
    } finally {
      this.initializing = null;
    }
  }

  update(deltaTime) {
    if (this.disposed || !this.initialized) {
      return false;
    }

    const delta = Number.isFinite(deltaTime) ? deltaTime : this.clock.getDelta();
    this.elapsedTime = Number.isFinite(deltaTime) ? this.elapsedTime + delta : this.clock.elapsedTime;

    this.particleRenderer.update(delta, this.elapsedTime);
    this.terrainManager.update(this.camera);
    this.hoverEffect?.update();
    return true;
  }

  resize(width, height, pixelRatio) {
    if (this.disposed) {
      return false;
    }

    const safeWidth = Number.isFinite(width) && width > 0 ? width : null;
    const safeHeight = Number.isFinite(height) && height > 0 ? height : null;

    if (safeWidth && safeHeight && this.camera?.isPerspectiveCamera) {
      this.camera.aspect = safeWidth / safeHeight;
      this.camera.updateProjectionMatrix();
    }

    if (safeWidth && safeHeight && typeof this.webglRenderer?.setSize === 'function') {
      this.webglRenderer.setSize(safeWidth, safeHeight);
    }

    const nextPixelRatio = Number.isFinite(pixelRatio)
      ? pixelRatio
      : this.webglRenderer?.getPixelRatio?.() ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

    this.particleRenderer.setPixelRatio(nextPixelRatio);
    return true;
  }

  setMask(center, radius, softness = this.maskEffect.softness) {
    if (this.disposed || !this.options.mask) {
      return false;
    }

    this.maskEffect.setCenter(center);
    this.maskEffect.setRadius(radius);
    this.maskEffect.setSoftness(softness);
    return this.maskEffect.update();
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.hoverEffect?.dispose();
    this.hoverEffect = null;
    this.fogEffect?.dispose();
    this.maskEffect?.dispose();
    this.scene?.remove?.(this.terrainManager.group);
    this.terrainManager.dispose();
    this.particleRenderer.dispose();
    this.heightmap = null;
    this.data = null;
    this.elapsedTime = 0;
    this.initialized = false;
    this.disposed = true;
  }

  async #initialize() {
    this.#assertScene();
    this.#assertHeightmapSource();

    this.heightmap = typeof this.options.heightmap === 'string'
      ? await this.loader.load(this.options.heightmap)
      : await this.loader.fromImageData(this.options.heightmap);

    this.data = HeightmapUtils.createParticleData(this.heightmap, {
      density: this.options.density,
      heightScale: this.options.heightScale,
      positionScale: this.options.positionScale
    });

    this.particleRenderer.setParticleData(this.data);
    this.terrainManager.setChunkSize(this.data.bounds.width, this.data.bounds.depth);
    this.terrainManager.initialize(this.particleRenderer.points);

    if (!this.scene.children.includes(this.terrainManager.group)) {
      this.scene.add(this.terrainManager.group);
    }

    if (this.options.hover && this.camera && this.webglRenderer?.domElement) {
      this.hoverEffect?.dispose();
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
  }

  #normalizeOptions(options) {
    const merged = mergeOptions(PARTICLE_LANDSCAPE_DEFAULTS, options);

    return {
      ...merged,
      particleSize: ensurePositiveNumber(merged.particleSize, PARTICLE_LANDSCAPE_DEFAULTS.particleSize, 'particleSize'),
      density: ensurePositiveNumber(merged.density, PARTICLE_LANDSCAPE_DEFAULTS.density, 'density'),
      heightScale: toFiniteNumber(merged.heightScale, PARTICLE_LANDSCAPE_DEFAULTS.heightScale, 'heightScale'),
      positionScale: ensurePositiveNumber(merged.positionScale, PARTICLE_LANDSCAPE_DEFAULTS.positionScale, 'positionScale'),
      tileRadius: toFiniteNumber(merged.tileRadius, PARTICLE_LANDSCAPE_DEFAULTS.tileRadius, 'tileRadius', { min: 0, integer: true }),
      fog: Boolean(merged.fog),
      hover: Boolean(merged.hover),
      mask: Boolean(merged.mask),
      infiniteTiling: Boolean(merged.infiniteTiling),
      autoInit: Boolean(merged.autoInit),
      baseColor: ensureColorString(merged.baseColor, PARTICLE_LANDSCAPE_DEFAULTS.baseColor, 'baseColor'),
      highlightColor: ensureColorString(merged.highlightColor, PARTICLE_LANDSCAPE_DEFAULTS.highlightColor, 'highlightColor')
    };
  }

  #assertScene() {
    if (!this.scene?.isScene) {
      throw new Error('ParticleLandscape.init() requires a valid THREE.Scene instance.');
    }
  }

  #assertHeightmapSource() {
    const source = this.options.heightmap;
    const isUrl = typeof source === 'string' && source.trim();
    const isImageDataLike = source && typeof source === 'object' && 'width' in source && 'height' in source && 'data' in source;

    if (!isUrl && !isImageDataLike) {
      throw new Error('ParticleLandscape requires `heightmap` to be a non-empty URL string or ImageData-like object.');
    }
  }
}
