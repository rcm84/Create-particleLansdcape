/**
 * Utility helpers for transforming image pixels into particle-ready typed arrays.
 * Each sampled pixel becomes a point where x = pixel x, y = height, z = pixel y.
 */
export class HeightmapUtils {
  static createParticleData(heightmap, options = {}) {
    const {
      density = 1,
      heightScale = 1,
      positionScale = 1,
      center = true
    } = options;

    const step = Math.max(1, Math.round(1 / Math.max(0.01, density)));
    const countX = Math.ceil(heightmap.width / step);
    const countY = Math.ceil(heightmap.height / step);
    const particleCount = countX * countY;

    const positions = new Float32Array(particleCount * 3);
    const heights = new Float32Array(particleCount);
    const uvs = new Float32Array(particleCount * 2);

    const offsetX = center ? (heightmap.width - 1) * 0.5 * positionScale : 0;
    const offsetZ = center ? (heightmap.height - 1) * 0.5 * positionScale : 0;

    let pointer = 0;

    for (let z = 0; z < heightmap.height; z += step) {
      for (let x = 0; x < heightmap.width; x += step) {
        const pixelIndex = (z * heightmap.width + x) * 4;
        const heightValue = heightmap.data[pixelIndex];
        const i3 = pointer * 3;
        const i2 = pointer * 2;

        positions[i3] = x * positionScale - offsetX;
        positions[i3 + 1] = heightValue * heightScale;
        positions[i3 + 2] = z * positionScale - offsetZ;

        heights[pointer] = heightValue;
        uvs[i2] = x / Math.max(1, heightmap.width - 1);
        uvs[i2 + 1] = z / Math.max(1, heightmap.height - 1);

        pointer += 1;
      }
    }

    return {
      positions: positions.subarray(0, pointer * 3),
      heights: heights.subarray(0, pointer),
      uvs: uvs.subarray(0, pointer * 2),
      particleCount: pointer,
      bounds: {
        width: heightmap.width * positionScale,
        depth: heightmap.height * positionScale
      }
    };
  }
}
