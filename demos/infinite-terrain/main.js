import { ParticleLandscape } from '../../engine/index.js';
import { createDemoShell, addOverlay } from '../shared-demo.js';
import { createHeightmapImageData } from '../shared-heightmap.js';

async function bootstrap() {

  const { scene, camera, renderer } = createDemoShell({ cameraPosition: [0, 80, 220] });
  addOverlay('Infinite Terrain', '300k+ visible particles • camera-centred tiling • scroll to change travel distance');

  const terrain = new ParticleLandscape({
    scene,
    camera,
    renderer,
    heightmap: createHeightmapImageData({ width: 560, height: 560, seed: 7, scale: 0.008, octaves: 6, ridge: 0.2 }),
    particleSize: 2,
    density: 1,
    heightScale: 0.3,
    fog: true,
    hover: true,
    infiniteTiling: true,
    tileRadius: 1,
    fogOptions: {
      color: '#020617',
      near: 140,
      far: 480,
      fadeNear: 250,
      fadeFar: 700
    },
    hoverOptions: {
      radius: 30,
      strength: 10
    }
  });

  await terrain.init();

  let drift = 0;
  function animate() {
    requestAnimationFrame(animate);
    drift += 0.3;
    camera.position.z -= 0.32;
    camera.lookAt(0, 20, -140 + drift * 0.05);
    terrain.update();
    renderer.render(scene, camera);
  }

  animate();
}

bootstrap();
