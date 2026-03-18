import { HEIGHTMAP_LOADER_DEFAULTS } from '../utils/EngineDefaults.js';
import { ensureBrowserApi, ensureTypedArray, mergeOptions, toFiniteNumber } from '../utils/ValidationUtils.js';

/**
 * @typedef {Object} HeightmapData
 * @property {number} width Width in pixels.
 * @property {number} height Height in pixels.
 * @property {Uint8ClampedArray} data RGBA pixel buffer.
 * @property {Float32Array} heights Per-pixel height values in the range 0..255.
 * @property {Float32Array|null} normalizedHeights Per-pixel normalized heights in the range 0..1.
 * @property {string} src Source identifier used for debugging.
 */

/**
 * Browser-side heightmap loader that converts an image or `ImageData` into a normalized pixel buffer.
 */
export class HeightmapLoader {
  constructor(options = {}) {
    this.options = mergeOptions(HEIGHTMAP_LOADER_DEFAULTS, options);
  }

  /**
   * Load a heightmap image from a URL.
   * @param {string} url
   * @returns {Promise<HeightmapData>}
   */
  async load(url) {
    ensureBrowserApi('HeightmapLoader', () => typeof document !== 'undefined' && typeof Image !== 'undefined');

    if (typeof url !== 'string' || !url.trim()) {
      throw new TypeError('HeightmapLoader.load(url) requires a non-empty image URL string.');
    }

    const image = await this.#loadImage(url);
    this.#validateDimensions(image.width, image.height, url);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      throw new Error('HeightmapLoader could not acquire a 2D canvas context.');
    }

    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, image.width, image.height);
    return this.#normalize(imageData.width, imageData.height, imageData.data, url);
  }

  /**
   * Normalize an existing `ImageData` instance into the heightmap output format.
   * @param {ImageData|{width:number,height:number,data:Uint8ClampedArray}} imageData
   * @returns {Promise<HeightmapData>}
   */
  async fromImageData(imageData) {
    if (!imageData || typeof imageData !== 'object') {
      throw new TypeError('HeightmapLoader.fromImageData(imageData) requires an ImageData-like object.');
    }

    const width = toFiniteNumber(imageData.width, undefined, 'imageData.width', { min: this.options.minDimension, integer: true });
    const height = toFiniteNumber(imageData.height, undefined, 'imageData.height', { min: this.options.minDimension, integer: true });
    const data = ensureTypedArray(imageData.data, 'imageData.data');

    this.#validateDimensions(width, height, 'ImageData');

    if (data.length < width * height * 4) {
      throw new RangeError('imageData.data must contain at least width * height * 4 entries.');
    }

    return this.#normalize(width, height, new Uint8ClampedArray(data), 'ImageData');
  }

  #normalize(width, height, rgba, src) {
    const typedPixels = rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba);
    const pixelCount = width * height;
    const heights = new Float32Array(pixelCount);
    const normalizedHeights = this.options.normalizeHeights ? new Float32Array(pixelCount) : null;

    for (let index = 0; index < pixelCount; index += 1) {
      const rgbaIndex = index * 4;
      const red = typedPixels[rgbaIndex] ?? 0;
      const green = typedPixels[rgbaIndex + 1] ?? red;
      const blue = typedPixels[rgbaIndex + 2] ?? red;
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
      const safeHeight = Math.max(0, Math.min(255, luminance));

      heights[index] = safeHeight;
      if (normalizedHeights) {
        normalizedHeights[index] = safeHeight / 255;
      }
    }

    return {
      width,
      height,
      data: typedPixels,
      heights,
      normalizedHeights,
      src
    };
  }

  #validateDimensions(width, height, src) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < this.options.minDimension || height < this.options.minDimension) {
      throw new Error(`Heightmap "${src}" must have integer dimensions >= ${this.options.minDimension}px.`);
    }
  }

  #loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = this.options.crossOrigin;
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load heightmap image from "${url}".`));
      image.src = url;
    });
  }
}
