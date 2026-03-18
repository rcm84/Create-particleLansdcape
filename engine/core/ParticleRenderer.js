import * as THREE from 'three';
import particleVertexShader from '../shaders/particle.vert?raw';
import particleFragmentShader from '../shaders/particle.frag?raw';
import fogFragmentShader from '../shaders/fog.frag?raw';
import { PARTICLE_RENDERER_DEFAULTS } from '../utils/EngineDefaults.js';
import {
  clamp,
  ensureColorString,
  ensurePositiveNumber,
  ensureTypedArray,
  mergeOptions,
  toFiniteNumber
} from '../utils/ValidationUtils.js';

/**
 * Renders large particle sets with a custom ShaderMaterial and validated BufferGeometry attributes.
 */
export class ParticleRenderer {
  constructor(options = {}) {
    this.options = mergeOptions(PARTICLE_RENDERER_DEFAULTS, options);
    this.disposed = false;
    this.hasParticleData = false;

    const safeParticleSize = ensurePositiveNumber(this.options.particleSize, PARTICLE_RENDERER_DEFAULTS.particleSize, 'particleSize');
    const safeOpacity = clamp(toFiniteNumber(this.options.opacity, PARTICLE_RENDERER_DEFAULTS.opacity, 'opacity', { min: 0, max: 1 }), 0, 1);

    this.geometry = new THREE.BufferGeometry();
    this.uniforms = {
      uParticleSize: { value: safeParticleSize },
      uPixelRatio: { value: this.#resolvePixelRatio(this.options.pixelRatio) },
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(ensureColorString(this.options.baseColor, PARTICLE_RENDERER_DEFAULTS.baseColor, 'baseColor')) },
      uHighlightColor: { value: new THREE.Color(ensureColorString(this.options.highlightColor, PARTICLE_RENDERER_DEFAULTS.highlightColor, 'highlightColor')) },
      uFogColor: { value: new THREE.Color(ensureColorString(this.options.fogColor, PARTICLE_RENDERER_DEFAULTS.fogColor, 'fogColor')) },
      uFogNear: { value: toFiniteNumber(this.options.fogNear, PARTICLE_RENDERER_DEFAULTS.fogNear, 'fogNear', { min: 0 }) },
      uFogFar: { value: toFiniteNumber(this.options.fogFar, PARTICLE_RENDERER_DEFAULTS.fogFar, 'fogFar', { min: 0 }) },
      uFadeNear: { value: toFiniteNumber(this.options.fadeNear, PARTICLE_RENDERER_DEFAULTS.fadeNear, 'fadeNear', { min: 0 }) },
      uFadeFar: { value: toFiniteNumber(this.options.fadeFar, PARTICLE_RENDERER_DEFAULTS.fadeFar, 'fadeFar', { min: 0 }) },
      uHoverPoint: { value: new THREE.Vector3(999999, 999999, 999999) },
      uHoverRadius: { value: ensurePositiveNumber(this.options.hoverRadius, PARTICLE_RENDERER_DEFAULTS.hoverRadius, 'hoverRadius', { allowZero: true }) },
      uHoverStrength: { value: toFiniteNumber(this.options.hoverStrength, PARTICLE_RENDERER_DEFAULTS.hoverStrength, 'hoverStrength') },
      uMaskCenter: { value: new THREE.Vector3() },
      uMaskRadius: { value: ensurePositiveNumber(this.options.maskRadius, PARTICLE_RENDERER_DEFAULTS.maskRadius, 'maskRadius', { allowZero: true }) },
      uMaskSoftness: { value: ensurePositiveNumber(this.options.maskSoftness, PARTICLE_RENDERER_DEFAULTS.maskSoftness, 'maskSoftness', { allowZero: true }) },
      uOpacity: { value: safeOpacity }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: particleVertexShader,
      fragmentShader: `${fogFragmentShader}\n${particleFragmentShader}`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  setParticleData({ positions, heights, uvs } = {}) {
    this.#assertActive();

    const safePositions = this.#toFloat32Array(ensureTypedArray(positions, 'positions'), 'positions');
    const safeHeights = this.#toFloat32Array(ensureTypedArray(heights, 'heights'), 'heights');
    const safeUvs = this.#toFloat32Array(ensureTypedArray(uvs, 'uvs'), 'uvs');

    if (safePositions.length === 0 || safePositions.length % 3 !== 0) {
      throw new RangeError('positions must contain a non-empty list of xyz triplets.');
    }

    if (safeHeights.length !== safePositions.length / 3) {
      throw new RangeError('heights length must equal positions.length / 3.');
    }

    if (safeUvs.length !== (safePositions.length / 3) * 2) {
      throw new RangeError('uvs length must equal particleCount * 2.');
    }

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(safePositions, 3));
    this.geometry.setAttribute('aHeight', new THREE.Float32BufferAttribute(safeHeights, 1));
    this.geometry.setAttribute('aUv', new THREE.Float32BufferAttribute(safeUvs, 2));
    this.geometry.computeBoundingSphere();
    this.hasParticleData = true;
  }

  setParticleSize(size) {
    this.#assertActive();
    this.uniforms.uParticleSize.value = ensurePositiveNumber(size, this.uniforms.uParticleSize.value, 'particleSize');
  }

  setPixelRatio(pixelRatio) {
    this.#assertActive();
    this.uniforms.uPixelRatio.value = this.#resolvePixelRatio(pixelRatio);
  }

  setFogOptions(options = {}) {
    this.#assertActive();
    if (options.color !== undefined) this.uniforms.uFogColor.value.set(ensureColorString(options.color, this.options.fogColor, 'fog.color'));
    if (options.near !== undefined) this.uniforms.uFogNear.value = toFiniteNumber(options.near, this.uniforms.uFogNear.value, 'fog.near', { min: 0 });
    if (options.far !== undefined) this.uniforms.uFogFar.value = toFiniteNumber(options.far, this.uniforms.uFogFar.value, 'fog.far', { min: 0 });
    if (options.fadeNear !== undefined) this.uniforms.uFadeNear.value = toFiniteNumber(options.fadeNear, this.uniforms.uFadeNear.value, 'fog.fadeNear', { min: 0 });
    if (options.fadeFar !== undefined) this.uniforms.uFadeFar.value = toFiniteNumber(options.fadeFar, this.uniforms.uFadeFar.value, 'fog.fadeFar', { min: 0 });
  }

  setHoverPoint(point) {
    this.#assertActive();
    if (point?.isVector3) {
      this.uniforms.uHoverPoint.value.copy(point);
    }
  }

  resetHoverPoint() {
    this.#assertActive();
    this.uniforms.uHoverPoint.value.set(999999, 999999, 999999);
  }

  setHoverOptions(options = {}) {
    this.#assertActive();
    if (options.radius !== undefined) this.uniforms.uHoverRadius.value = ensurePositiveNumber(options.radius, this.uniforms.uHoverRadius.value, 'hover.radius', { allowZero: true });
    if (options.strength !== undefined) this.uniforms.uHoverStrength.value = toFiniteNumber(options.strength, this.uniforms.uHoverStrength.value, 'hover.strength');
  }

  setMaskOptions(options = {}) {
    this.#assertActive();
    if (options.center?.isVector3) this.uniforms.uMaskCenter.value.copy(options.center);
    if (options.radius !== undefined) this.uniforms.uMaskRadius.value = ensurePositiveNumber(options.radius, this.uniforms.uMaskRadius.value, 'mask.radius', { allowZero: true });
    if (options.softness !== undefined) this.uniforms.uMaskSoftness.value = ensurePositiveNumber(options.softness, this.uniforms.uMaskSoftness.value, 'mask.softness', { allowZero: true });
  }

  update(_delta, elapsedTime = 0) {
    if (this.disposed) {
      return false;
    }

    this.uniforms.uTime.value = Number.isFinite(elapsedTime) ? elapsedTime : this.uniforms.uTime.value;
    return true;
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.geometry.dispose();
    this.material.dispose();
    this.points.removeFromParent();
    this.disposed = true;
    this.hasParticleData = false;
  }

  #resolvePixelRatio(value) {
    const fallback = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    return clamp(toFiniteNumber(value ?? fallback, fallback, 'pixelRatio', { min: 0.25, max: 2 }), 0.25, 2);
  }

  #toFloat32Array(value, name) {
    const safeArray = value instanceof Float32Array ? value : new Float32Array(value);

    for (let index = 0; index < safeArray.length; index += 1) {
      if (!Number.isFinite(safeArray[index])) {
        throw new TypeError(`${name} contains a non-finite value at index ${index}.`);
      }
    }

    return safeArray;
  }

  #assertActive() {
    if (this.disposed) {
      throw new Error('ParticleRenderer has been disposed and can no longer be used.');
    }
  }
}
