# ParticleLandscapeEngine

ParticleLandscapeEngine is a production-ready starter kit for building GPU-driven particle terrains with Three.js. It takes the core idea from the original study project—turning a heightmap into a particle landscape—and packages it into a reusable engine, effect modules, demos, and terrain tooling.

## Features

- Modular engine architecture under `engine/`
- Heightmap image loading with typed-array conversion
- GPU particle rendering via `THREE.Points` and `BufferGeometry`
- Configurable particle size, density, terrain scale, fog, hover, and masks
- Infinite terrain tiling for endless-world scenes
- Procedural heightmap generation with Perlin/fractal noise
- Vite-powered local development and production builds
- Demos covering baseline terrain, fog, infinite tiling, and stylised alien worlds

## Installation

```bash
npm install
npm run dev
```

Open the Vite server in your browser and visit any of the demo routes:

- `/demos/basic-terrain/index.html`
- `/demos/infinite-terrain/index.html`
- `/demos/fog-landscape/index.html`
- `/demos/alien-world/index.html`

Create a production build with:

```bash
npm run build
```

## Usage

```js
import * as THREE from 'three';
import { ParticleLandscape } from './engine/index.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const terrain = new ParticleLandscape({
  scene,
  camera,
  renderer,
  heightmap: 'mountains.png',
  particleSize: 2,
  density: 1,
  fog: true,
  infiniteTiling: true,
  tileRadius: 1
});

await terrain.init();

function animate() {
  requestAnimationFrame(animate);
  terrain.update();
  renderer.render(scene, camera);
}

animate();
```

### Config Reference

| Option | Description | Default |
| --- | --- | --- |
| `heightmap` | Image URL or `ImageData` object | `null` |
| `particleSize` | GPU point sprite size | `2` |
| `density` | Sample rate where `1` = every pixel | `1` |
| `heightScale` | Converts grayscale pixels into world-space elevation | `0.35` |
| `positionScale` | Scales the x/z particle spacing | `1` |
| `baseColor` | Primary particle color tint | `#7dd3fc` |
| `highlightColor` | Secondary color mixed by height and hover | `#f8fafc` |
| `fog` | Enables atmospheric fog uniforms | `true` |
| `hover` | Enables pointer-driven particle displacement | `true` |
| `mask` | Enables a circular reveal mask | `false` |
| `infiniteTiling` | Repeats the terrain chunk around the camera | `false` |
| `tileRadius` | Number of chunks rendered around the camera in each direction | `1` |

## Architecture

```text
engine/
  core/
    ParticleLandscape.js
    ParticleRenderer.js
    TerrainManager.js
  loaders/
    HeightmapLoader.js
  shaders/
    particle.vert
    particle.frag
    fog.frag
  effects/
    FogEffect.js
    HoverEffect.js
    MaskEffect.js
  utils/
    HeightmapUtils.js
    NoiseGenerator.js
```

### Core Modules

- `ParticleLandscape`: public engine facade that loads heightmaps and wires the renderer/effects.
- `ParticleRenderer`: owns the `BufferGeometry`, GLSL shaders, and high-volume point rendering.
- `TerrainManager`: duplicates or re-centers terrain chunks to simulate infinite worlds.
- `HeightmapLoader`: reads image pixels into a browser-friendly buffer.
- `HeightmapUtils`: converts grayscale pixels into point positions using `x = pixel x`, `y = height value`, `z = pixel y`.
- `FogEffect`, `HoverEffect`, `MaskEffect`: small effect controllers for common scene interactions.
- `NoiseGenerator`: deterministic Perlin/fractal noise implementation shared by demos and tools.

## Creating Terrains

### 1. Use an image heightmap

Drop a grayscale image into `public/` and reference it from the engine config:

```js
const terrain = new ParticleLandscape({
  scene,
  camera,
  renderer,
  heightmap: '/mountains.png',
  particleSize: 1.8,
  density: 1,
  heightScale: 0.4
});
```

### 2. Generate a new heightmap procedurally

```bash
npm run generate:heightmap -- --width=1024 --height=1024 --seed=99 --output=public/mountains.png
```

The generator lives at `terrain-tools/heightmap-generator.js` and outputs a grayscale PNG created from layered Perlin noise.

### 3. Tune the look

- Increase `heightScale` for dramatic mountains.
- Lower `density` (for example `0.5`) to sample fewer pixels and reduce load.
- Raise `particleSize` to create a chunkier point-cloud aesthetic.
- Adjust `fogOptions` and `hoverOptions` per demo or scene.

## Performance Tips

The engine is designed to handle 300k+ particles in WebGL, and the included infinite-terrain demo renders over 300k visible particles by tiling a 560×560 point chunk.

- Use `BufferGeometry` attributes only once during initialization; the engine animates using uniforms instead of rebuilding arrays every frame.
- Clamp the renderer pixel ratio to `2` or lower on high-DPI displays.
- When targeting weaker GPUs, reduce `density`, `particleSize`, or `tileRadius`.
- Keep `depthWrite` disabled for additive particles to reduce sorting artifacts and overdraw cost.
- Prefer lower-resolution heightmaps for mobile while keeping the same visual style with fog.

## Demos

- `demos/basic-terrain`: baseline terrain and hover response.
- `demos/infinite-terrain`: endless landscape using terrain chunk recentering.
- `demos/fog-landscape`: atmospheric fog and animated reveal mask.
- `demos/alien-world`: stylised scene showing custom color grading.

## Extending the Engine

- Swap in alternate shaders under `engine/shaders/`.
- Add more effect controllers in `engine/effects/`.
- Integrate custom noise or terrain post-processing in `engine/utils/` and `terrain-tools/`.
- Feed live `ImageData` into `ParticleLandscape` for fully procedural runtime worlds.
