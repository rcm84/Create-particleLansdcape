import * as THREE from 'three';
import particleVertexShader from '../shaders/particle.vert?raw';
import particleFragmentShader from '../shaders/particle.frag?raw';
import fogFragmentShader from '../shaders/fog.frag?raw';

/**
 * Renders large particle sets with a custom ShaderMaterial.
 * BufferGeometry keeps memory predictable and performant enough for 300k+ particles.
 */
export class ParticleRenderer {
  constructor(options = {}) {
    this.options = {
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
      ...options
    };

    this.geometry = new THREE.BufferGeometry();
    this.uniforms = {
      uParticleSize: { value: this.options.particleSize },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(this.options.baseColor) },
      uHighlightColor: { value: new THREE.Color(this.options.highlightColor) },
      uFogColor: { value: new THREE.Color(this.options.fogColor) },
      uFogNear: { value: this.options.fogNear },
      uFogFar: { value: this.options.fogFar },
      uFadeNear: { value: this.options.fadeNear },
      uFadeFar: { value: this.options.fadeFar },
      uHoverPoint: { value: new THREE.Vector3(999999, 999999, 999999) },
      uHoverRadius: { value: this.options.hoverRadius },
      uHoverStrength: { value: this.options.hoverStrength },
      uMaskCenter: { value: new THREE.Vector3() },
      uMaskRadius: { value: 999999 },
      uMaskSoftness: { value: 30 },
      uOpacity: { value: this.options.opacity }
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

  setParticleData({ positions, heights, uvs }) {
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('aHeight', new THREE.Float32BufferAttribute(heights, 1));
    this.geometry.setAttribute('aUv', new THREE.Float32BufferAttribute(uvs, 2));
    this.geometry.computeBoundingSphere();
  }

  setParticleSize(size) {
    this.uniforms.uParticleSize.value = size;
  }

  setFogOptions(options = {}) {
    if (options.color) this.uniforms.uFogColor.value.set(options.color);
    if (options.near !== undefined) this.uniforms.uFogNear.value = options.near;
    if (options.far !== undefined) this.uniforms.uFogFar.value = options.far;
    if (options.fadeNear !== undefined) this.uniforms.uFadeNear.value = options.fadeNear;
    if (options.fadeFar !== undefined) this.uniforms.uFadeFar.value = options.fadeFar;
  }

  setHoverPoint(point) {
    this.uniforms.uHoverPoint.value.copy(point);
  }

  setHoverOptions(options = {}) {
    if (options.radius !== undefined) this.uniforms.uHoverRadius.value = options.radius;
    if (options.strength !== undefined) this.uniforms.uHoverStrength.value = options.strength;
  }

  setMaskOptions(options = {}) {
    if (options.center) this.uniforms.uMaskCenter.value.copy(options.center);
    if (options.radius !== undefined) this.uniforms.uMaskRadius.value = options.radius;
    if (options.softness !== undefined) this.uniforms.uMaskSoftness.value = options.softness;
  }

  update(delta, elapsedTime) {
    this.uniforms.uTime.value = elapsedTime;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
