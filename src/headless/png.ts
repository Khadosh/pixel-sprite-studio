// PNG in and out for Node, on top of pngjs. RGBA8 only.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';

export interface Rgba {
  width: number;
  height: number;
  /** RGBA8, row-major, length = width * height * 4 */
  data: Uint8Array;
}

export function blankImage(width: number, height: number, fill: [number, number, number, number] = [0, 0, 0, 0]): Rgba {
  const data = new Uint8Array(width * height * 4);
  if (fill.some(v => v !== 0)) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
      data[i + 3] = fill[3];
    }
  }
  return { width, height, data };
}

export function readPng(path: string): Rgba {
  const png = PNG.sync.read(readFileSync(path));
  return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
}

export function encodePng(img: Rgba): Buffer {
  const png = new PNG({ width: img.width, height: img.height });
  png.data = Buffer.from(img.data);
  return PNG.sync.write(png);
}

export function writePng(path: string, img: Rgba): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(img));
}

export function getPixel(img: Rgba, x: number, y: number): [number, number, number, number] {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

export function setPixel(img: Rgba, x: number, y: number, rgba: [number, number, number, number]): void {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  img.data[i] = rgba[0];
  img.data[i + 1] = rgba[1];
  img.data[i + 2] = rgba[2];
  img.data[i + 3] = rgba[3];
}

/** Copies src onto dst at (x, y). Pixels with alpha 0 are skipped. */
export function blit(dst: Rgba, src: Rgba, x: number, y: number): void {
  for (let sy = 0; sy < src.height; sy++) {
    for (let sx = 0; sx < src.width; sx++) {
      const p = getPixel(src, sx, sy);
      if (p[3] === 0) continue;
      setPixel(dst, x + sx, y + sy, p);
    }
  }
}
