import * as THREE from 'three';
import { MASK_EFFECT_DEFAULTS } from '../utils/EngineDefaults.js';
import { ensurePositiveNumber, ensureVector3, mergeOptions } from '../utils/ValidationUtils.js';

/**
 * Controls the circular reveal mask used for spotlight-style interactions.
 */
export class MaskEffect {
  constructor(renderer, options = {}) {
    this.renderer = renderer ?? null;
    this.options = mergeOptions(MASK_EFFECT_DEFAULTS, options);
    this.center = ensureVector3(this.options.center, new THREE.Vector3(), 'mask.center');
    this.radius = ensurePositiveNumber(this.options.radius, MASK_EFFECT_DEFAULTS.radius, 'mask.radius', { allowZero: true });
    this.softness = ensurePositiveNumber(this.options.softness, MASK_EFFECT_DEFAULTS.softness, 'mask.softness', { allowZero: true });
    this.disposed = false;
    this.update();
  }

  setCenter(center) {
    if (this.disposed) {
      return false;
    }

    this.center.copy(ensureVector3(center, this.center, 'mask.center'));
    return this.update();
  }

  setRadius(radius) {
    if (this.disposed) {
      return false;
    }

    this.radius = ensurePositiveNumber(radius, this.radius, 'mask.radius', { allowZero: true });
    return this.update();
  }

  setSoftness(softness) {
    if (this.disposed) {
      return false;
    }

    this.softness = ensurePositiveNumber(softness, this.softness, 'mask.softness', { allowZero: true });
    return this.update();
  }

  update() {
    if (this.disposed || typeof this.renderer?.setMaskOptions !== 'function') {
      return false;
    }

    this.renderer.setMaskOptions({
      center: this.center,
      radius: this.radius,
      softness: this.softness
    });

    return true;
  }

  dispose() {
    this.disposed = true;
  }
}
