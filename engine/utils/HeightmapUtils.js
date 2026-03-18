import { ensurePositiveNumber, toFiniteNumber } from './ValidationUtils.js';

/**
 * Utility helpers for transforming image pixels into particle-ready typed arrays.
 * Each sampled pixel becomes a point where x = pixel x, y = height, z = pixel y.
 */
export class HeightmapUtils {
  static createParticleData(heightmap, options = {}) {
    if (!heightmap || typeof heightmap !== 'object') {
      throw new TypeError('HeightmapUtils.createParticleData(heightmap) requires a normalized heightmap object.');
    }

    const density = ensurePositiveNumber(options.density ?? 1, 1, 'density', { allowZero: false });
    const heightScale = toFiniteNumber(options.heightScale ?? 1, 1, 'heightScale');
    const positionScale = ensurePositiveNumber(options.positionScale ?? 1, 1, 'positionScale');
    const center = options.center !== false;
    const width = toFiniteNumber(heightmap.width, undefined, 'heightmap.width', { min: 1, integer: true });
    const height = toFiniteNumber(heightmap.height, undefined, 'heightmap.height', { min: 1, integer: true });
    const sampledHeights = heightmap.heights instanceof Float32Array ? heightmap.heights : null;

    if (!sampledHeights && (!ArrayBuffer.isView(heightmap.data) || heightmap.data.length < width * height * 4)) {
      throw new TypeError('heightmap.data must be a typed array containing at least width * height * 4 values.');
    }

    const step = Math.max(1, Math.round(1 / Math.max(0.01, density)));
    const countX = Math.ceil(width / step);
    const countY = Math.ceil(height / step);
    const particleCount = countX * countY;

    const positions = new Float32Array(particleCount * 3);
    const heights = new Float32Array(particleCount);
    const uvs = new Float32Array(particleCount * 2);

    const offsetX = center ? (width - 1) * 0.5 * positionScale : 0;
    const offsetZ = center ? (height - 1) * 0.5 * positionScale : 0;

    let pointer = 0;

    for (let z = 0; z < height; z += step) {
      for (let x = 0; x < width; x += step) {
        const pixelIndex = z * width + x;
        const rgbaIndex = pixelIndex * 4;
        const heightValue = sampledHeights ? sampledHeights[pixelIndex] : heightmap.data[rgbaIndex];
        const safeHeight = Number.isFinite(heightValue) ? heightValue : 0;
        const i3 = pointer * 3;
        const i2 = pointer * 2;

        positions[i3] = x * positionScale - offsetX;
        positions[i3 + 1] = safeHeight * heightScale;
        positions[i3 + 2] = z * positionScale - offsetZ;

        heights[pointer] = safeHeight;
        uvs[i2] = x / Math.max(1, width - 1);
        uvs[i2 + 1] = z / Math.max(1, height - 1);
        pointer += 1;
      }
    }

    return {
      positions,
      heights,
      uvs,
      particleCount: pointer,
      bounds: {
        width: width * positionScale,
        depth: height * positionScale
      }
    };
  }
}
