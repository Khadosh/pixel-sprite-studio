import { SpriteAsset, Frame } from './types';

/**
 * Compresses a 2D number array (frame) into a compact RLE string.
 * Format: "count x value, count x value, ..."
 */
export function compressFrame(frame: any): string {
  if (typeof frame === 'string') return frame; // Already compressed
  if (!Array.isArray(frame)) return '';
  
  const flat = frame.flat();
  if (flat.length === 0) return '';
  
  const rle: string[] = [];
  let current = flat[0];
  let count = 0;

  for (const val of flat) {
    if (val === current) {
      count++;
    } else {
      rle.push(`${count}x${current}`);
      current = val;
      count = 1;
    }
  }
  rle.push(`${count}x${current}`);
  return rle.join(',');
}

/**
 * Decompresses an RLE string back into a 2D number array.
 */
export function decompressFrame(compressed: any, size: number): number[][] {
  if (Array.isArray(compressed)) return compressed; // Already decompressed or old format
  if (typeof compressed !== 'string') return Array.from({ length: size }, () => Array(size).fill(0));

  const parts = compressed.split(',');
  const flat: number[] = [];
  for (const part of parts) {
    const [countStr, valStr] = part.split('x');
    const count = parseInt(countStr);
    const val = parseInt(valStr);
    for (let i = 0; i < count; i++) flat.push(val);
  }
  
  const frame: number[][] = [];
  for (let i = 0; i < size; i++) {
    frame.push(flat.slice(i * size, (i + 1) * size));
  }
  return frame;
}

/**
 * Deeply compresses a SpriteAsset's frames.
 */
export function compressAsset(asset: SpriteAsset): any {
  const clone = JSON.parse(JSON.stringify(asset));
  
  // Compress main frames
  if (clone.layers) {
    clone.layers.forEach((layer: any) => {
      layer.frames = layer.frames.map((f: any) => compressFrame(f));
    });
  }

  // Compress versions
  if (clone.versions) {
    clone.versions.forEach((v: any) => {
      if (v.asset.layers) {
        v.asset.layers.forEach((layer: any) => {
          layer.frames = layer.frames.map((f: any) => compressFrame(f));
        });
      }
    });
  }

  return clone;
}

/**
 * Deeply decompresses a SpriteAsset's frames.
 */
export function decompressAsset(data: any): SpriteAsset {
  const clone = JSON.parse(JSON.stringify(data));
  const size = clone.size || 32;

  // Decompress main frames
  if (clone.layers) {
    clone.layers.forEach((layer: any) => {
      layer.frames = layer.frames.map((f: any) => decompressFrame(f, size));
    });
  }

  // Decompress versions
  if (clone.versions) {
    clone.versions.forEach((v: any) => {
      const vSize = v.asset.size || size;
      if (v.asset.layers) {
        v.asset.layers.forEach((layer: any) => {
          layer.frames = layer.frames.map((f: any) => decompressFrame(f, vSize));
        });
      }
    });
  }

  return clone as SpriteAsset;
}
