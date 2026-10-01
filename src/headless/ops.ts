// Drawing and transform operations on frames, addressed with x = column and
// y = row. Thin wrappers over src/lib/sprite so the editor and the tools share
// the same pixels.

import type { Frame, SpriteAsset } from '../lib/types';
import type { Rgba } from './png';
import {
  addGlow, drawBeam, drawBolt, drawBurst, drawCircle, drawPulse, drawSparks,
} from '../lib/sprite/drawing';
import { cloneFrame } from '../lib/sprite/transforms';
import { addFrame, colorIndex, dims, getFrame, setAnimation, setFrame } from './asset';

export type Color = string | number;

function inBounds(frame: Frame, x: number, y: number): boolean {
  return y >= 0 && y < frame.length && x >= 0 && x < (frame[0]?.length ?? 0);
}

export function plot(frame: Frame, x: number, y: number, idx: number): void {
  if (inBounds(frame, x, y)) frame[y][x] = idx;
}

/** Bresenham line, inclusive. */
export function line(frame: Frame, x0: number, y0: number, x1: number, y1: number, idx: number): void {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0, y = y0;
  for (;;) {
    plot(frame, x, y, idx);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

export function rect(frame: Frame, x: number, y: number, w: number, h: number, idx: number, fill = false): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const edge = yy === y || yy === y + h - 1 || xx === x || xx === x + w - 1;
      if (fill || edge) plot(frame, xx, yy, idx);
    }
  }
}

/** Midpoint circle outline. */
export function circleOutline(frame: Frame, cx: number, cy: number, radius: number, idx: number): void {
  let x = radius, y = 0, err = 1 - radius;
  while (x >= y) {
    for (const [px, py] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) {
      plot(frame, cx + px, cy + py, idx);
    }
    y++;
    if (err < 0) err += 2 * y + 1;
    else { x--; err += 2 * (y - x) + 1; }
  }
}

/** Flood fill of the contiguous region (4-neighbour) under (x, y). */
export function floodFill(frame: Frame, x: number, y: number, idx: number): number {
  if (!inBounds(frame, x, y)) return 0;
  const target = frame[y][x];
  if (target === idx) return 0;
  const stack: [number, number][] = [[x, y]];
  let painted = 0;
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (!inBounds(frame, cx, cy) || frame[cy][cx] !== target) continue;
    frame[cy][cx] = idx;
    painted++;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return painted;
}

export function replaceIndex(frame: Frame, from: number, to: number): number {
  let n = 0;
  for (const row of frame) {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === from) { row[c] = to; n++; }
    }
  }
  return n;
}

export function flipH(frame: Frame): Frame {
  return frame.map(row => [...row].reverse());
}

export function flipV(frame: Frame): Frame {
  return [...frame].reverse().map(row => [...row]);
}

/** Moves the picture by (dx, dy); what leaves the canvas is lost. */
export function shift(frame: Frame, dx: number, dy: number): Frame {
  const h = frame.length, w = frame[0]?.length ?? 0;
  const out: Frame = Array.from({ length: h }, () => Array<number>(w).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = frame[y][x];
      if (!v) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) out[ny][nx] = v;
    }
  }
  return out;
}

/**
 * Majority filter for the noise a pixelized render leaves behind: a pixel
 * with fewer than `strength` neighbours of its own index (out of 8, the
 * outside counting as transparent) takes the index most of its neighbours
 * share, if at least `majority` of them agree. strength 1 removes only lone
 * pixels (and fills lone holes); 2 also eats the ends of dashes. Lines and
 * outlines survive: every pixel on a line has two neighbours like itself.
 * Returns how many pixels changed.
 */
export function despeckle(frame: Frame, strength = 1, majority = 5): number {
  const h = frame.length, w = frame[0]?.length ?? 0;
  const src = frame.map(row => [...row]);
  let changed = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const own = src[y][x];
      const counts = new Map<number, number>();
      let same = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          const v = nx >= 0 && ny >= 0 && nx < w && ny < h ? src[ny][nx] : 0;
          if (v === own) same++;
          else counts.set(v, (counts.get(v) ?? 0) + 1);
        }
      }
      if (same >= strength) continue;
      let best = own, bestN = 0;
      for (const [v, n] of counts) if (n > bestN) { best = v; bestN = n; }
      if (bestN >= majority && best !== own) { frame[y][x] = best; changed++; }
    }
  }
  return changed;
}

// ── Draw ops as data (what the "draw" command receives) ─────────────────

export type DrawOp =
  | { op: 'pixel'; x: number; y: number; color: Color }
  | { op: 'pixels'; points: [number, number][]; color: Color }
  | { op: 'line'; x0: number; y0: number; x1: number; y1: number; color: Color }
  | { op: 'rect'; x: number; y: number; w: number; h: number; color: Color; fill?: boolean }
  | { op: 'circle'; x: number; y: number; radius: number; color: Color; fill?: boolean }
  | { op: 'fill'; x: number; y: number; color: Color }
  | { op: 'replace'; from: Color; to: Color }
  | { op: 'clear' };

export function applyDrawOps(asset: SpriteAsset, frameIndex: number, ops: DrawOp[], layer = 0): void {
  const frame = cloneFrame(getFrame(asset, frameIndex, layer));
  for (const o of ops) {
    switch (o.op) {
      case 'pixel': plot(frame, o.x, o.y, colorIndex(asset, o.color)); break;
      case 'pixels': {
        const idx = colorIndex(asset, o.color);
        for (const [x, y] of o.points) plot(frame, x, y, idx);
        break;
      }
      case 'line': line(frame, o.x0, o.y0, o.x1, o.y1, colorIndex(asset, o.color)); break;
      case 'rect': rect(frame, o.x, o.y, o.w, o.h, colorIndex(asset, o.color), o.fill ?? false); break;
      case 'circle': {
        const idx = colorIndex(asset, o.color);
        if (o.fill) {
          const filled = drawCircle(frame, o.y, o.x, o.radius, idx);
          frame.splice(0, frame.length, ...filled);
        } else {
          circleOutline(frame, o.x, o.y, o.radius, idx);
        }
        break;
      }
      case 'fill': floodFill(frame, o.x, o.y, colorIndex(asset, o.color)); break;
      case 'replace': replaceIndex(frame, colorIndex(asset, o.from), colorIndex(asset, o.to)); break;
      case 'clear': for (const row of frame) row.fill(0); break;
    }
  }
  setFrame(asset, frameIndex, frame, layer);
}

// ── Procedural FX ──────────────────────────────────────────────────────

export type FxShape = 'burst' | 'beam' | 'sparks' | 'pulse' | 'circle' | 'glow' | 'bolt';

export interface FxOptions {
  shape: FxShape;
  /** Center, in pixels. Defaults to the canvas center. */
  x?: number;
  y?: number;
  /** 0..1 */
  intensity: number;
  color: Color;
  light?: Color;
  dark?: Color;
  /** Radius for 'circle'. Default: intensity * min(w,h)/2 */
  radius?: number;
  /** Seed for 'sparks' and 'bolt'; same seed, same picture. */
  seed?: number;
  /** End point for 'bolt' (defaults: from top center to bottom center). */
  x2?: number;
  y2?: number;
}

/** Small deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function applyFx(asset: SpriteAsset, frame: Frame, fx: FxOptions): Frame {
  const { width, height } = dims(asset);
  const cx = fx.x ?? Math.floor(width / 2);
  const cy = fx.y ?? Math.floor(height / 2);
  const main = colorIndex(asset, fx.color);
  const shades = {
    light: fx.light !== undefined ? colorIndex(asset, fx.light) : main,
    dark: fx.dark !== undefined ? colorIndex(asset, fx.dark) : main,
  };
  switch (fx.shape) {
    case 'burst': return drawBurst(frame, cy, cx, fx.intensity, main, shades);
    case 'beam': return drawBeam(frame, cy, cx, fx.intensity, main, shades);
    case 'sparks': return drawSparks(frame, cy, cx, fx.intensity, main, shades, seededRandom(fx.seed ?? 1));
    case 'pulse': return drawPulse(frame, cy, cx, fx.intensity, main, shades);
    case 'circle': {
      const radius = fx.radius ?? Math.max(1, (Math.min(width, height) / 2) * fx.intensity);
      return drawCircle(frame, cy, cx, radius, main, fx.light !== undefined || fx.dark !== undefined ? shades : undefined);
    }
    case 'glow': return addGlow(frame, main);
    case 'bolt': {
      const fromY = fx.y ?? 0, fromX = fx.x ?? Math.floor(width / 2);
      const toY = fx.y2 ?? height - 1, toX = fx.x2 ?? Math.floor(width / 2);
      return drawBolt(frame, fromY, fromX, toY, toX, fx.intensity, main, shades, seededRandom(fx.seed ?? 1));
    }
  }
}

export type FxCurve = 'grow' | 'fade' | 'grow_fade' | 'flat';

export interface FxAnimationOptions extends Omit<FxOptions, 'intensity'> {
  name: string;
  /** How many frames to generate. */
  frames: number;
  /** How intensity moves across the frames. Default grow_fade. */
  curve?: FxCurve;
  /** Peak intensity, 0..1. Default 1. */
  peak?: number;
  fps?: number;
  loop?: boolean;
}

export function intensityAt(curve: FxCurve, i: number, n: number, peak: number): number {
  if (n <= 1) return peak;
  const t = i / (n - 1);
  switch (curve) {
    case 'grow': return peak * (0.2 + 0.8 * t);
    case 'fade': return peak * (1 - 0.8 * t);
    case 'flat': return peak;
    case 'grow_fade': {
      // Fast rise, slower fall, peaking around a third of the way.
      const p = 0.35;
      return peak * (t <= p ? 0.25 + 0.75 * (t / p) : 1 - 0.85 * ((t - p) / (1 - p)));
    }
  }
}

/**
 * Appends N frames drawn with the FX at a moving intensity and tags them as
 * an animation. Returns the new frame indices.
 */
export function generateFxAnimation(asset: SpriteAsset, opts: FxAnimationOptions): number[] {
  const { width, height } = dims(asset);
  const indices: number[] = [];
  const curve = opts.curve ?? 'grow_fade';
  const peak = opts.peak ?? 1;
  for (let i = 0; i < opts.frames; i++) {
    const blank: Frame = Array.from({ length: height }, () => Array<number>(width).fill(0));
    const drawn = applyFx(asset, blank, {
      ...opts,
      intensity: intensityAt(curve, i, opts.frames, peak),
      seed: (opts.seed ?? 1) + i * 7919,
    });
    indices.push(addFrame(asset, drawn));
  }
  setAnimation(asset, { name: opts.name, frameIndices: indices, fps: opts.fps ?? 12, loop: opts.loop ?? false });
  return indices;
}


// ── Palettes ───────────────────────────────────────────────────────────

/** Perceptual-ish distance between two hex colors (weighted RGB). */
export function colorDistance(a: string, b: string): number {
  const pa = hexToRgbaTuple(a), pb = hexToRgbaTuple(b);
  const dr = pa[0] - pb[0], dg = pa[1] - pb[1], db = pa[2] - pb[2];
  const rm = (pa[0] + pb[0]) / 2;
  // Classic "redmean" weighting: closer to how eyes rank differences than plain RGB.
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

function hexToRgbaTuple(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), n.length === 8 ? parseInt(n.slice(6, 8), 16) : 255];
}

export interface FitEntry {
  index: number;
  from: string;
  to: string;
  distance: number;
  forced: boolean;
}

/**
 * Maps every palette color of the asset to the nearest color of `target`
 * (a list of hex), honoring explicit `overrides` (fromHex → toHex). Alpha
 * is preserved from the source color. Returns the table of what went where.
 */
export function fitPalette(asset: SpriteAsset, target: string[], overrides: Record<string, string> = {}): FitEntry[] {
  const table: FitEntry[] = [];
  const normalizedOverrides = new Map(Object.entries(overrides).map(([k, v]) => [normalizeHexLocal(k), normalizeHexLocal(v)]));
  const candidates = target.map(normalizeHexLocal);
  for (const [k, hex] of Object.entries(asset.palette)) {
    const from = normalizeHexLocal(hex);
    if (from === 'transparent') continue;
    const opaque = from.slice(0, 7);
    const alpha = from.length === 9 ? from.slice(7) : '';
    let to: string;
    let forced = false;
    const override = normalizedOverrides.get(opaque) ?? normalizedOverrides.get(from);
    if (override) {
      to = override;
      forced = true;
    } else {
      let best = candidates[0], bestD = Infinity;
      for (const c of candidates) {
        const d = colorDistance(opaque, c.slice(0, 7));
        if (d < bestD) { bestD = d; best = c; }
      }
      to = best.slice(0, 7) + alpha;
    }
    asset.palette[Number(k)] = to;
    table.push({ index: Number(k), from, to, distance: Math.round(colorDistance(opaque, to.slice(0, 7))), forced });
  }
  return table;
}

function normalizeHexLocal(hex: string): string {
  let h = hex.trim().toLowerCase();
  if (h === 'transparent') return h;
  if (!h.startsWith('#')) h = '#' + h;
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (h.length === 9 && h.endsWith('ff')) h = h.slice(0, 7);
  return h;
}


/**
 * Recolors an RGBA image in place of its palette: every distinct opaque color
 * goes to its forced mapping or to the nearest color of `target`. Alpha is
 * kept. Returns the table of what went where (one row per distinct color).
 */
export function fitImageColors(img: Rgba, target: string[], overrides: Record<string, string> = {}, regions?: KnockoutRegion[]): FitEntry[] {
  const candidates = target.map(normalizeHexLocal);
  const forced = new Map(Object.entries(overrides).map(([k, v]) => [normalizeHexLocal(k), normalizeHexLocal(v)]));
  const mapping = new Map<string, { to: string; entry: FitEntry }>();
  const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  const inRegions = (i: number) => {
    if (!regions || regions.length === 0) return true;
    const p = i / 4, x = p % img.width, y = Math.floor(p / img.width);
    return regions.some(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
  };
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0 || !inRegions(i)) continue;
    const from = hex(img.data[i], img.data[i + 1], img.data[i + 2]);
    let m = mapping.get(from);
    if (!m) {
      let to = forced.get(from);
      let isForced = true;
      if (!to) {
        isForced = false;
        let bestD = Infinity;
        to = candidates[0];
        for (const c of candidates) {
          const d = colorDistance(from, c.slice(0, 7));
          if (d < bestD) { bestD = d; to = c; }
        }
      }
      to = to.slice(0, 7);
      m = { to, entry: { index: mapping.size + 1, from, to, distance: Math.round(colorDistance(from, to)), forced: isForced } };
      mapping.set(from, m);
    }
    const rgb = hexToRgbLocal(m.to);
    img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2];
  }
  return [...mapping.values()].map(m => m.entry);
}

function hexToRgbLocal(h: string): [number, number, number] {
  const n = h.replace('#', '');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}


export interface KnockoutRegion { x: number; y: number; w: number; h: number }

/**
 * Makes transparent the pixels of `color` that touch the border of each
 * region (4-connected flood from the region's edges), leaving islands of the
 * same color inside untouched. That is how a tileset piece with grass baked
 * around it loses the grass but keeps the same green used as a fill.
 * Regions default to the whole image. Returns how many pixels went away.
 */
export function knockOutColor(img: Rgba, color: string, regions?: KnockoutRegion[]): number {
  const [tr, tg, tb] = hexToRgbLocal(normalizeHexLocal(color));
  // The flood walks through the color and through already-transparent pixels
  // (a region's border is often empty air around the piece); only the
  // colored ones are removed.
  const isColor = (x: number, y: number) => {
    const i = (y * img.width + x) * 4;
    return img.data[i + 3] !== 0 && img.data[i] === tr && img.data[i + 1] === tg && img.data[i + 2] === tb;
  };
  const same = (x: number, y: number) => img.data[(y * img.width + x) * 4 + 3] === 0 || isColor(x, y);
  const list = regions && regions.length ? regions : [{ x: 0, y: 0, w: img.width, h: img.height }];
  let removed = 0;
  for (const r of list) {
    const x0 = Math.max(0, r.x), y0 = Math.max(0, r.y);
    const x1 = Math.min(img.width, r.x + r.w), y1 = Math.min(img.height, r.y + r.h);
    const seen = new Uint8Array((x1 - x0) * (y1 - y0));
    const stack: [number, number][] = [];
    const push = (x: number, y: number) => {
      if (x < x0 || y < y0 || x >= x1 || y >= y1) return;
      const k = (y - y0) * (x1 - x0) + (x - x0);
      if (seen[k] || !same(x, y)) return;
      seen[k] = 1;
      stack.push([x, y]);
    };
    for (let x = x0; x < x1; x++) { push(x, y0); push(x, y1 - 1); }
    for (let y = y0; y < y1; y++) { push(x0, y); push(x1 - 1, y); }
    while (stack.length) {
      const [x, y] = stack.pop()!;
      if (isColor(x, y)) {
        img.data[(y * img.width + x) * 4 + 3] = 0;
        removed++;
      }
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
  }
  return removed;
}
