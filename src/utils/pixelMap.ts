export class PixelMap {
  width: number;
  height: number;
  data: Uint8Array;

  constructor(width: number, height: number, existingData?: Uint8Array) {
    this.width = width;
    this.height = height;
    if (existingData && existingData.length === width * height * 4) {
      this.data = new Uint8Array(existingData);
    } else {
      this.data = new Uint8Array(width * height * 4);
    }
  }

  setPixel(x: number, y: number, r: number, g: number, b: number, a: number = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.data[idx] = r;
    this.data[idx + 1] = g;
    this.data[idx + 2] = b;
    this.data[idx + 3] = a;
  }

  getPixel(x: number, y: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    const idx = (y * this.width + x) * 4;
    return {
      r: this.data[idx],
      g: this.data[idx + 1],
      b: this.data[idx + 2],
      a: this.data[idx + 3],
    };
  }

  clone() {
    return new PixelMap(this.width, this.height, this.data);
  }
}
