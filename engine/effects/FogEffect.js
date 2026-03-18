import { FOG_EFFECT_DEFAULTS } from '../utils/EngineDefaults.js';
import { mergeOptions } from '../utils/ValidationUtils.js';

/**
 * Thin fog controller that safely forwards updates to the particle renderer.
 */
export class FogEffect {
  constructor(renderer, options = {}) {
    this.renderer = renderer ?? null;
    this.options = mergeOptions(FOG_EFFECT_DEFAULTS, options);
    this.enabled = this.options.enabled !== false;
    this.disposed = false;

    if (this.enabled) {
      this.update(this.options);
    }
  }

  update(options = {}) {
    if (this.disposed || !this.enabled || typeof this.renderer?.setFogOptions !== 'function') {
      return false;
    }

    this.options = mergeOptions(this.options, options);
    this.renderer.setFogOptions(this.options);
    return true;
  }

  dispose() {
    this.disposed = true;
  }
}
