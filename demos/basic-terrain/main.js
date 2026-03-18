import { ParticleLandscape } from '../../engine/index.js';
import { createDemoShell, addOverlay } from '../shared-demo.js';
import { createHeightmapImageData } from '../shared-heightmap.js';

async function bootstrap() {

  const { scene, camera, renderer } = createDemoShell();
  addOverlay('Basic Terrain', '262k particles • drag to orbit • move cursor to hover the terrain');

  const terrain = new ParticleLandscape({
    scene,
    camera,
    renderer,
    heightmap: createHeightmapImageData({ width: 512, height: 512, seed: 12, ridge: 0.25 }),
    particleSize: 2.35,
    density: 1,
    heightScale: 0.38,
    fog: true,
    hover: true,
    fogOptions: {
      color: '#020617',
      near: 160,
      far: 440,
      fadeNear: 220,
      fadeFar: 620
    }
  });

  await terrain.init();

  function animate() {
    requestAnimationFrame(animate);
    terrain.update();
    renderer.render(scene, camera);
  }

  animate();
}

bootstrap();
