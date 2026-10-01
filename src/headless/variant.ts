// Variants of an asset: the same drawing with a few pixels changed (a face
// that frowns, a sword with blood), kept on a layer of their own so the base
// is never touched. Rebuilding a variant after the base changes is running
// the same command again.

import type { SpriteAsset, SpriteLayer } from '../lib/types';
import { blankFrame, colorIndex, dims, frameCount } from './asset';
import { applyDrawOps, type DrawOp } from './ops';
import { fromAscii } from './ascii';

export interface VariantOptions {
  id: string;
  name?: string;
  /** Name of the layer that holds the changes (default "variante"). */
  layer?: string;
  /** First frame the overlay and the ops land on (default 0). */
  frame?: number;
  ops?: DrawOp[];
  /** A from_ascii drawing the size of the asset: every glyph but "." is laid over the base. */
  overlay?: string;
  overlaySource?: string;
}

export interface VariantResult {
  asset: SpriteAsset;
  /** Pixels the variant layer paints, over every frame. */
  painted: number;
  /** Of those, how many differ from the base underneath. */
  changed: number;
}

/** A deep copy of `base` with the changes on a new top layer. `base` is not modified. */
export function makeVariant(base: SpriteAsset, opts: VariantOptions): VariantResult {
  const asset: SpriteAsset = JSON.parse(JSON.stringify(base));
  asset.id = opts.id;
  asset.name = opts.name ?? opts.id;
  const { width, height } = dims(asset);
  const count = frameCount(asset);
  const start = opts.frame ?? 0;
  if (start < 0 || start >= count) throw new Error(`frame ${start} does not exist (the asset has ${count})`);

  const layer: SpriteLayer = {
    id: `layer-${opts.layer ?? 'variante'}`,
    name: opts.layer ?? 'variante',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: Array.from({ length: count }, () => blankFrame(width, height)),
  };
  asset.layers = [...asset.layers!, layer];
  const top = asset.layers.length - 1;

  if (opts.overlay !== undefined) {
    const over = fromAscii(opts.overlay, { sourcePath: opts.overlaySource, defaultId: opts.id }).asset;
    const od = dims(over);
    if (od.width !== width || od.height !== height) {
      throw new Error(`overlay is ${od.width}x${od.height}, the asset is ${width}x${height}`);
    }
    const frames = over.layers![0].frames;
    if (start + frames.length > count) {
      throw new Error(`overlay has ${frames.length} frames from ${start}, the asset has ${count}`);
    }
    frames.forEach((src, k) => {
      const dst = layer.frames[start + k];
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const v = src[r][c];
          if (v) dst[r][c] = colorIndex(asset, over.palette[v]);
        }
      }
    });
  }
  if (opts.ops && opts.ops.length > 0) applyDrawOps(asset, start, opts.ops, top);

  let painted = 0;
  let changed = 0;
  layer.frames.forEach((frame, f) => {
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const v = frame[r][c];
        if (!v) continue;
        painted++;
        let under = 0;
        for (let l = 0; l < top; l++) {
          const below = asset.layers![l];
          if (!below.isVisible || below.opacity === 0) continue;
          const u = below.frames[f]?.[r]?.[c];
          if (u) under = u;
        }
        if (asset.palette[under] !== asset.palette[v]) changed++;
      }
    }
  });
  return { asset, painted, changed };
}
