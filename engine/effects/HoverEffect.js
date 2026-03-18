import * as THREE from 'three';
import { HOVER_EFFECT_DEFAULTS } from '../utils/EngineDefaults.js';
import { ensureVector3, mergeOptions, toFiniteNumber } from '../utils/ValidationUtils.js';

/**
 * Tracks pointer movement over a configurable interaction plane and forwards the hit position
 * to the renderer so nearby particles can react on the GPU without re-uploading geometry.
 */
export class HoverEffect {
  constructor(renderer, camera, domElement, options = {}) {
    this.renderer = renderer ?? null;
    this.camera = camera ?? null;
    this.domElement = domElement ?? null;
    this.options = mergeOptions(HOVER_EFFECT_DEFAULTS, options);
    this.enabled = this.options.enabled !== false;
    this.disposed = false;
    this.pointer = new THREE.Vector2();
    this.hoverPoint = new THREE.Vector3(999999, 999999, 999999);
    this.raycaster = this.camera ? new THREE.Raycaster() : null;
    this.planeNormal = ensureVector3(this.options.planeNormal, HOVER_EFFECT_DEFAULTS.planeNormal, 'hover.planeNormal').normalize();
    this.planeHeight = toFiniteNumber(this.options.planeHeight, HOVER_EFFECT_DEFAULTS.planeHeight, 'hover.planeHeight');
    this.plane = new THREE.Plane(this.planeNormal, -this.planeHeight);
    this.isBound = false;

    this.#handlePointerMove = this.#handlePointerMove.bind(this);
    this.#handlePointerLeave = this.#handlePointerLeave.bind(this);

    this.bind();
  }

  bind() {
    if (this.isBound || !this.domElement?.addEventListener) {
      return false;
    }

    this.domElement.addEventListener('pointermove', this.#handlePointerMove);
    this.domElement.addEventListener('pointerleave', this.#handlePointerLeave);
    this.isBound = true;
    return true;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);

    if (!this.enabled) {
      this.hoverPoint.set(999999, 999999, 999999);
      this.renderer?.resetHoverPoint?.();
    }
  }

  setPlaneHeight(height) {
    this.planeHeight = toFiniteNumber(height, this.planeHeight, 'hover.planeHeight');
    this.plane.constant = -this.planeHeight;
  }

  setCamera(camera) {
    this.camera = camera ?? null;
    this.raycaster = this.camera ? this.raycaster ?? new THREE.Raycaster() : null;
  }

  update() {
    if (this.disposed || typeof this.renderer?.setHoverPoint !== 'function') {
      return false;
    }

    this.renderer.setHoverPoint(this.hoverPoint);
    return true;
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    if (this.isBound && this.domElement?.removeEventListener) {
      this.domElement.removeEventListener('pointermove', this.#handlePointerMove);
      this.domElement.removeEventListener('pointerleave', this.#handlePointerLeave);
    }

    this.renderer?.resetHoverPoint?.();
    this.isBound = false;
    this.disposed = true;
  }

  #handlePointerMove(event) {
    if (!this.enabled || !this.camera || !this.raycaster || !this.domElement?.getBoundingClientRect) {
      return;
    }

    const rect = this.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.plane, this.hoverPoint);

    if (!hit) {
      this.hoverPoint.set(999999, 999999, 999999);
    }
  }

  #handlePointerLeave() {
    this.hoverPoint.set(999999, 999999, 999999);
  }
}
