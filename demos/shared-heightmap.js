import { NoiseGenerator } from '../engine/utils/NoiseGenerator.js';

export function createHeightmapImageData({ width = 512, height = 512, seed = 1337, scale = 0.009, octaves = 5, ridge = 0.4 } = {}) {
  const noise = new NoiseGenerator(seed);
  const data = new Uint8ClampedArray(width * height * 4);

  for (let z = 0; z < height; z += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (z * width + x) * 4;
      const nx = x * scale;
      const nz = z * scale;
      const base = noise.fractalNoise(nx, nz, 0, octaves, 0.5, 2.1);
      const ridged = 1 - Math.abs(base);
      const mixed = base * (1 - ridge) + ridged * ridge;
      const value = Math.round(((mixed + 1) * 0.5) * 255);
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }

  return new ImageData(data, width, height);
}
