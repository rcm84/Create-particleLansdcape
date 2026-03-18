import * as THREE from 'three';

/**
 * Controls the circular reveal mask used for spotlight-style interactions.
 */
export class MaskEffect {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.center = options.center ?? new THREE.Vector3();
    this.radius = options.radius ?? 999999;
    this.softness = options.softness ?? 30;
    this.update();
  }

  setCenter(center) {
    this.center.copy(center);
    this.update();
  }

  setRadius(radius) {
    this.radius = radius;
    this.update();
  }

  update() {
    this.renderer.setMaskOptions({
      center: this.center,
      radius: this.radius,
      softness: this.softness
    });
  }
}
