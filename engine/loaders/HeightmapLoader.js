/**
 * Browser-side heightmap loader that converts any image into a normalized pixel buffer.
 * The result is consumed by HeightmapUtils to build particle geometry.
 */
export class HeightmapLoader {
  async load(url) {
    const image = await this.#loadImage(url);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    const { data } = context.getImageData(0, 0, image.width, image.height);

    return {
      width: image.width,
      height: image.height,
      data,
      src: url
    };
  }

  async fromImageData(imageData) {
    return {
      width: imageData.width,
      height: imageData.height,
      data: imageData.data,
      src: 'ImageData'
    };
  }

  #loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(new Error(`Unable to load heightmap: ${url}`));
      image.src = url;
    });
  }
}
