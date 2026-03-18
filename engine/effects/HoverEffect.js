import * as THREE from 'three';

/**
 * Tracks pointer movement over a horizontal interaction plane and forwards the hit position
 * to the renderer so nearby particles can react on the GPU without re-uploading geometry.
 */
export class HoverEffect {
  constructor(renderer, camera, domElement, options = {}) {
    this.renderer = renderer;
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = options.enabled ?? true;
    this.pointer = new THREE.Vector2();
    this.hoverPoint = new THREE.Vector3(999999, 999999, 999999);
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.#handlePointerMove = this.#handlePointerMove.bind(this);
    this.#handlePointerLeave = this.#handlePointerLeave.bind(this);

    domElement.addEventListener('pointermove', this.#handlePointerMove);
    domElement.addEventListener('pointerleave', this.#handlePointerLeave);
  }

  update() {
    this.renderer.setHoverPoint(this.hoverPoint);
  }

  dispose() {
    this.domElement.removeEventListener('pointermove', this.#handlePointerMove);
    this.domElement.removeEventListener('pointerleave', this.#handlePointerLeave);
  }

  #handlePointerMove(event) {
    if (!this.enabled) {
      return;
    }

    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.ray.intersectPlane(this.plane, this.hoverPoint);
  }

  #handlePointerLeave() {
    this.hoverPoint.set(999999, 999999, 999999);
  }
}
