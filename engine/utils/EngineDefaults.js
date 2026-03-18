import * as THREE from 'three';

export const PARTICLE_LANDSCAPE_DEFAULTS = Object.freeze({
  heightmap: null,
  particleSize: 2,
  density: 1,
  heightScale: 0.35,
  positionScale: 1,
  fog: true,
  baseColor: '#7dd3fc',
  highlightColor: '#f8fafc',
  fogOptions: Object.freeze({}),
  hover: true,
  hoverOptions: Object.freeze({}),
  mask: false,
  maskOptions: Object.freeze({}),
  infiniteTiling: false,
  tileRadius: 1,
  scene: null,
  camera: null,
  renderer: null,
  autoInit: false
});

export const PARTICLE_RENDERER_DEFAULTS = Object.freeze({
  particleSize: 2,
  opacity: 0.95,
  baseColor: '#7dd3fc',
  highlightColor: '#f8fafc',
  fogColor: '#020617',
  fogNear: 120,
  fogFar: 420,
  fadeNear: 200,
  fadeFar: 600,
  hoverRadius: 24,
  hoverStrength: 8,
  pixelRatio: undefined,
  maskRadius: 999999,
  maskSoftness: 30
});

export const TERRAIN_MANAGER_DEFAULTS = Object.freeze({
  enabled: false,
  tileRadius: 1,
  chunkSize: Object.freeze({ x: 256, y: 256 })
});

export const HEIGHTMAP_LOADER_DEFAULTS = Object.freeze({
  crossOrigin: 'anonymous',
  normalizeHeights: true,
  minDimension: 1
});

export const HOVER_EFFECT_DEFAULTS = Object.freeze({
  enabled: true,
  planeHeight: 0,
  planeNormal: Object.freeze(new THREE.Vector3(0, 1, 0)),
  radius: 24,
  strength: 8
});

export const FOG_EFFECT_DEFAULTS = Object.freeze({
  enabled: true,
  color: '#020617',
  near: 120,
  far: 420,
  fadeNear: 200,
  fadeFar: 600
});

export const MASK_EFFECT_DEFAULTS = Object.freeze({
  center: Object.freeze(new THREE.Vector3()),
  radius: 999999,
  softness: 30
});
