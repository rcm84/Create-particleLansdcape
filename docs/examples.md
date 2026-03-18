# Examples

These examples are intended to show how the starter kit should be consumed in real projects.

## 1. Minimal terrain

```js
import * as THREE from 'three';
import { ParticleLandscape } from '../engine/index.js';

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
  fog: true
});

await terrain.init();
```

## 2. Runtime-safe resize loop

```js
window.addEventListener('resize', () => {
  terrain.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio);
});
```

## 3. Infinite terrain scene

```js
const terrain = new ParticleLandscape({
  scene,
  camera,
  renderer,
  heightmap: '/assets/heightmaps/plateau.png',
  infiniteTiling: true,
  tileRadius: 1,
  hover: true,
  fog: true
});
```

## 4. Recommended export strategy

For this starter kit, keep imports centralized through `engine/index.js`:

```js
import {
  ParticleLandscape,
  ParticleLandscapeEngine,
  HeightmapLoader,
  HeightmapUtils,
  NoiseGenerator
} from '../engine/index.js';
```

Why this is recommended:

- it keeps demos and app code stable if internal files move later
- it makes future packaging simpler
- it reinforces a clean public-vs-internal API boundary
