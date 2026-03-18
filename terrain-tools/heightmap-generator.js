import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { NoiseGenerator } from '../engine/utils/NoiseGenerator.js';

/**
 * CLI utility that outputs a grayscale PNG heightmap built from layered Perlin noise.
 * Example: npm run generate:heightmap -- --width=1024 --height=1024 --seed=99 --output=public/mountains.png
 */
const args = Object.fromEntries(
  process.argv.slice(2).map((entry) => {
    const [key, value] = entry.replace(/^--/, '').split('=');
    return [key, value];
  })
);

const width = Number(args.width ?? 1024);
const height = Number(args.height ?? 1024);
const seed = Number(args.seed ?? 1337);
const scale = Number(args.scale ?? 0.0075);
const octaves = Number(args.octaves ?? 6);
const persistence = Number(args.persistence ?? 0.5);
const lacunarity = Number(args.lacunarity ?? 2.1);
const output = resolve(process.cwd(), args.output ?? 'public/generated-heightmap.png');

const noise = new NoiseGenerator(seed);
const rgba = new Uint8Array(width * height * 4);

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const nx = x * scale;
    const ny = y * scale;
    const n = noise.fractalNoise(nx, ny, 0, octaves, persistence, lacunarity);
    const value = Math.max(0, Math.min(255, Math.round((n * 0.5 + 0.5) * 255)));
    const idx = (width * y + x) * 4;
    rgba[idx] = value;
    rgba[idx + 1] = value;
    rgba[idx + 2] = value;
    rgba[idx + 3] = 255;
  }
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, encodePng(width, height, rgba));
console.log(`Heightmap generated at ${output}`);

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type RGBA
  header[10] = 0; // compression
  header[11] = 0; // filter
  header[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, rowStart + 1);
  }

  const compressed = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    createChunk('IHDR', header),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
