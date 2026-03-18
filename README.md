# ParticleLandscapeEngine

ParticleLandscapeEngine is a polished downloadable starter kit for building GPU-rendered particle terrains with Three.js. It takes the core heightmap-to-particles idea from the original study project and packages it as a reusable engine, demo suite, docs set, and terrain tooling that feels ready for client work, internal prototyping, or creative product launches.

## Project overview

### What this starter kit includes

- A modular engine under `engine/` for particle terrain orchestration, rendering, effects, loading, and utilities
- Four runnable demos under `demos/` showing baseline terrain, infinite tiling, fog, and stylized world-building
- A heightmap CLI under `terrain-tools/` for quick terrain generation workflows
- Vite for local development and multi-page demo builds
- Documentation, changelog, and asset conventions for teams adapting the toolkit to their own products

### Who this is for

- Front-end teams building immersive landing pages or interactive 3D storytelling
- Creative developers who want a reusable terrain foundation instead of a one-off experiment
- Agencies, studios, and product teams packaging a premium visual starter kit for repeatable project delivery

### Good use cases

- Hero background terrains for product marketing sites
- Infinite flyover environments and sci-fi scene explorations
- Procedural world concepts driven by heightmaps or generated noise
- Internal prototyping for shaders, camera systems, and point-cloud terrain interaction

## Quick start

```bash
npm install
npm run dev
```

Then open one of the included demo routes:

- `/demos/basic-terrain/index.html`
- `/demos/infinite-terrain/index.html`
- `/demos/fog-landscape/index.html`
- `/demos/alien-world/index.html`

### Handy local scripts

```bash
npm run demo:basic
npm run demo:infinite
npm run demo:fog
npm run demo:alien
npm run build
```

## Why this repo feels like a starter kit

Unlike a bare rendering experiment, this repository is structured so teams can clone it, replace the terrain content, and keep shipping from the same foundation.

- **Engine-first architecture** keeps rendering logic separate from demos.
- **Docs-first onboarding** helps teams understand where to put assets, how to extend the engine, and how to keep imports clean.
- **Demo-driven exploration** makes it easy to evaluate visual direction before integrating into a production app.

## Usage

### Lifecycle

`ParticleLandscape` exposes a safe reusable lifecycle for app integrators:

- `await terrain.init()` loads and validates the heightmap once. Repeated calls are safe.
- `terrain.update()` is a no-op until initialization completes and after disposal.
- `terrain.resize(width, height, pixelRatio)` safely updates the camera and renderer when available.
- `terrain.dispose()` is idempotent and cleans up listeners, scene nodes, and GPU resources.

### Minimal example

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
  heightmap: '/assets/heightmaps/mountains.png',
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

window.addEventListener('resize', () => {
  terrain.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio);
});

animate();
```

### Examples

#### Basic terrain

Use this for a stable baseline scene with hover response and atmospheric depth.

```js
const terrain = new ParticleLandscape({
  scene,
  camera,
  renderer,
  heightmap: '/assets/heightmaps/ridges.png',
  particleSize: 2.2,
  density: 1,
  fog: true,
  hover: true
});
```

#### Infinite flyover

Use this when you want the terrain to feel endless without building a streaming world system.

```js
const terrain = new ParticleLandscape({
  scene,
  camera,
  renderer,
  heightmap: '/assets/heightmaps/plateau.png',
  infiniteTiling: true,
  tileRadius: 1,
  fog: true
});
```

#### Mask-driven reveal scene

Use this for product reveals, ambient spotlights, or interactive discovery moments.

```js
const terrain = new ParticleLandscape({
  scene,
  camera,
  renderer,
  heightmap: '/assets/heightmaps/crater.png',
  mask: true,
  hover: true,
  fog: true,
  maskOptions: {
    radius: 220,
    softness: 70
  }
});
```

### Config reference

| Option | Description | Default |
| --- | --- | --- |
| `heightmap` | Image URL or `ImageData` object | `null` |
| `particleSize` | GPU point sprite size | `2` |
| `density` | Sample rate where `1` = every pixel | `1` |
| `heightScale` | Converts grayscale pixels into world-space elevation | `0.35` |
| `positionScale` | Scales x/z particle spacing | `1` |
| `baseColor` | Primary particle color tint | `#7dd3fc` |
| `highlightColor` | Secondary particle tint mixed by height and hover | `#f8fafc` |
| `fog` | Enables atmospheric fog uniforms | `true` |
| `hover` | Enables pointer-driven particle displacement | `true` |
| `mask` | Enables circular reveal masking | `false` |
| `infiniteTiling` | Repeats the terrain chunk around the camera | `false` |
| `tileRadius` | Number of chunks rendered in each direction | `1` |

## Export strategy

For now, the cleanest public import path is the root engine barrel:

```js
import { ParticleLandscape, HeightmapLoader, HeightmapUtils } from './engine/index.js';
```

### Why this is the recommended strategy

- It keeps app code insulated from future internal file moves.
- It makes the starter kit easier to document and hand off.
- It preserves a clear distinction between supported entry points and internal implementation details.

The repository is **not being positioned as a published npm package yet**, so the export strategy is intentionally minimal and starter-kit focused.

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
    EngineDefaults.js
    HeightmapUtils.js
    NoiseGenerator.js
    ValidationUtils.js
```

### Core modules

- `ParticleLandscape`: high-level terrain facade and lifecycle owner
- `ParticleRenderer`: `BufferGeometry` + shader-backed particle renderer
- `TerrainManager`: tiling and chunk positioning logic for endless-scene behavior
- `HeightmapLoader`: safe browser-side heightmap parsing
- `HeightmapUtils`: pixel-to-particle conversion helper
- `NoiseGenerator`: deterministic procedural noise utility
- `FogEffect`, `HoverEffect`, `MaskEffect`: reusable effect wrappers for common interactions

## Assets convention

Use `assets/` for source-of-truth project media that should travel with the starter kit.

```text
assets/
  heightmaps/
  textures/
  screenshots/
```

### Practical rule of thumb

- Put **source assets** in `assets/`
- Put **served demo files** in `public/`
- Put **temporary generated outputs** in `public/` only when the demos need them

## Docs

A lightweight docs structure is included for teams that want a more premium handoff package:

- [`docs/README.md`](./docs/README.md) — docs hub
- [`docs/project-overview.md`](./docs/project-overview.md) — overview, audience, and product framing
- [`docs/examples.md`](./docs/examples.md) — example integration patterns
- [`docs/assets-convention.md`](./docs/assets-convention.md) — asset organization guidance

## Creating terrains

### Use an image heightmap

Drop a grayscale image into `public/` or follow the `assets/heightmaps/` convention and then expose it from your app build.

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

### Generate a new heightmap procedurally

```bash
npm run generate:heightmap -- --width=1024 --height=1024 --seed=99 --output=public/mountains.png
```

The generator lives at `terrain-tools/heightmap-generator.js` and outputs a grayscale PNG created from layered Perlin noise.

## Demos

- `demos/basic-terrain` — baseline terrain and hover response
- `demos/infinite-terrain` — endless landscape using terrain chunk recentering
- `demos/fog-landscape` — atmospheric fog and animated reveal mask
- `demos/alien-world` — stylized scene showing custom color grading

## Performance tips

The engine is designed to handle 300k+ particles in WebGL, and the included infinite-terrain demo renders over 300k visible particles by tiling a 560×560 point chunk.

- Use `BufferGeometry` attributes only once during initialization.
- Clamp renderer pixel ratio to `2` or lower on high-DPI displays.
- Reduce `density`, `particleSize`, or `tileRadius` for weaker GPUs.
- Keep `depthWrite` disabled for additive particles to reduce sorting artifacts.
- Prefer smaller heightmaps on mobile and recover style with fog and color grading.

## Extending the engine

- Swap in alternate shaders under `engine/shaders/`
- Add more effect controllers in `engine/effects/`
- Integrate custom noise or terrain post-processing in `engine/utils/` and `terrain-tools/`
- Feed live `ImageData` into `ParticleLandscape` for fully procedural runtime worlds

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a lightweight running history of major starter-kit changes and known risks.
