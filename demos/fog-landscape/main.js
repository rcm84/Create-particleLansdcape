import * as THREE from 'three';
import { ParticleLandscape } from '../../engine/index.js';
import { createDemoShell, addOverlay } from '../shared-demo.js';
import { createHeightmapImageData } from '../shared-heightmap.js';

async function bootstrap() {

  const { scene, camera, renderer } = createDemoShell({ background: '#01030d', cameraPosition: [60, 90, 210] });
  addOverlay('Fog Landscape', 'Atmospheric fog + circular mask • pointer interaction reveals the valley');

  const terrain = new ParticleLandscape({
    scene,
    camera,
    renderer,
    heightmap: createHeightmapImageData({ width: 512, height: 512, seed: 42, scale: 0.007, octaves: 6, ridge: 0.55 }),
    particleSize: 2.6,
    density: 1,
    heightScale: 0.45,
    fog: true,
    hover: true,
    mask: true,
    fogOptions: {
      color: '#7c3aed',
      near: 80,
      far: 320,
      fadeNear: 160,
      fadeFar: 520
    },
    hoverOptions: {
      radius: 34,
      strength: 14
    },
    maskOptions: {
      center: new THREE.Vector3(0, 0, 0),
      radius: 210,
      softness: 70
    }
  });

  await terrain.init();

  function animate() {
    requestAnimationFrame(animate);
    const t = performance.now() * 0.001;
    terrain.setMask(new THREE.Vector3(Math.sin(t * 0.5) * 40, 0, Math.cos(t * 0.5) * 80), 205, 78);
    terrain.update();
    renderer.render(scene, camera);
  }

  animate();
}

bootstrap();
