/**
 * Convenience wrapper around atmospheric fog uniforms so demos can toggle the effect declaratively.
 */
export class FogEffect {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.update(options);
  }

  update(options = {}) {
    this.renderer.setFogOptions(options);
  }
}
