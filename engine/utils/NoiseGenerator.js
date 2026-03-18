/**
 * Lightweight Perlin noise generator used by the terrain tools and procedural demos.
 * The implementation is deterministic and can also produce fractal brownian motion noise.
 */
export class NoiseGenerator {
  constructor(seed = 1337) {
    this.seed = seed;
    this.permutation = this.#buildPermutationTable(seed);
  }

  noise(x, y = 0, z = 0) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.#fade(x);
    const v = this.#fade(y);
    const w = this.#fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.#lerp(
      w,
      this.#lerp(
        v,
        this.#lerp(u, this.#grad(this.permutation[AA], x, y, z), this.#grad(this.permutation[BA], x - 1, y, z)),
        this.#lerp(u, this.#grad(this.permutation[AB], x, y - 1, z), this.#grad(this.permutation[BB], x - 1, y - 1, z))
      ),
      this.#lerp(
        v,
        this.#lerp(u, this.#grad(this.permutation[AA + 1], x, y, z - 1), this.#grad(this.permutation[BA + 1], x - 1, y, z - 1)),
        this.#lerp(u, this.#grad(this.permutation[AB + 1], x, y - 1, z - 1), this.#grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }

  fractalNoise(x, y = 0, z = 0, octaves = 5, persistence = 0.5, lacunarity = 2) {
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    let total = 0;

    for (let octave = 0; octave < octaves; octave += 1) {
      total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  #buildPermutationTable(seed) {
    const table = Array.from({ length: 256 }, (_, index) => index);
    let state = seed >>> 0;

    for (let i = table.length - 1; i > 0; i -= 1) {
      state = (1664525 * state + 1013904223) >>> 0;
      const swapIndex = state % (i + 1);
      [table[i], table[swapIndex]] = [table[swapIndex], table[i]];
    }

    return [...table, ...table];
  }

  #fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  #lerp(t, a, b) {
    return a + t * (b - a);
  }

  #grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}
