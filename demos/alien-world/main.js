import * as THREE from 'three';
import { ParticleLandscape } from '../../engine/index.js';
import { createDemoShell, addOverlay } from '../shared-demo.js';
import { createHeightmapImageData } from '../shared-heightmap.js';

const { scene, camera, renderer } = createDemoShell({ background: '#02030d', cameraPosition: [120, 100, 240] });
addOverlay('Alien World', 'Stylised colors • tall ridges • animated reveal mask for cinematic sweeps');

const terrain = new ParticleLandscape({
  scene,
  camera,
  renderer,
  heightmap: createHeightmapImageData({ width: 640, height: 512, seed: 84, scale: 0.011, octaves: 7, ridge: 0.8 }),
  particleSize: 2.1,
  density: 1,
  heightScale: 0.6,
  fog: true,
  baseColor: '#22d3ee',
  highlightColor: '#fef08a',
  hover: true,
  mask: true,
  fogOptions: {
    color: '#fb7185',
    near: 120,
    far: 420,
    fadeNear: 220,
    fadeFar: 650
  },
  hoverOptions: {
    radius: 28,
    strength: 20
  },
  maskOptions: {
    center: new THREE.Vector3(0, 0, 0),
    radius: 999999,
    softness: 80
  }
});

await terrain.init();

function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;
  terrain.setMask(new THREE.Vector3(Math.sin(t * 0.7) * 110, 0, Math.cos(t * 0.4) * 120), 180, 90);
  camera.position.x = Math.sin(t * 0.18) * 220;
  camera.position.z = Math.cos(t * 0.18) * 220;
  camera.lookAt(0, 25, 0);
  terrain.update();
  renderer.render(scene, camera);
}

animate();
