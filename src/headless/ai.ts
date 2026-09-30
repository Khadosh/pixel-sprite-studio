// AI as raw material, headless: a prompt becomes a PNG through fal.ai, and a
// PNG becomes a pixel-art asset through the same quantizer the editor uses.
//
// The models mirror supabase/functions/generate-sprite-fal (owner's decision,
// do not change without asking). The key comes from FAL_AI_KEY in the
// environment or from supabase/functions/.env (git-ignored), never from a
// command argument, so it never lands in a shell history or a transcript.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SpriteAsset } from '../lib/types';
import { imageToPixelData } from '../lib/imageToPixelData';
import { createAsset } from './asset';
import type { Rgba } from './png';

export const TXT2IMG_MODEL = 'fal-ai/flux/schnell';
export const IMG2IMG_MODEL = 'fal-ai/bytedance/seedream/v4/edit';
export const FAL_BASE_URL = 'https://fal.run';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function repoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/** FAL_AI_KEY from the environment, else from supabase/functions/.env. */
export function loadFalKey(envFile = join(repoRoot(), 'supabase', 'functions', '.env')): string {
  const fromEnv = process.env.FAL_AI_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*FAL_AI_KEY\s*=\s*(.+?)\s*$/);
      if (m && m[1]) return m[1].replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('no FAL_AI_KEY: export it or put it in supabase/functions/.env');
}

export interface GenerateOptions {
  prompt: string;
  /** Optional reference image (public URL) for image-to-image. */
  imageUrl?: string;
  /** Hex colors to ask for. */
  palette?: string[];
  /** Perspective hint appended to the prompt, e.g. "top-down". */
  perspective?: string;
  /** Skip the pixel-art wrapper and send the prompt as is. */
  raw?: boolean;
}

/** The same technical prompt the edge function builds. */
export function technicalPrompt(o: GenerateOptions): string {
  if (o.raw) return o.prompt;
  const palette = o.palette && o.palette.length > 1 ? `Use strictly this color palette: ${o.palette.join(', ')}. ` : '';
  const perspective = o.perspective ? ` The character must strictly adhere to a ${o.perspective} game perspective.` : '';
  return `Professional pixel art sprite of ${o.prompt}. ${palette}${perspective} Isolated character on a solid flat LIME GREEN background (#00FF00). Full body, centered, clean retro pixel art.`;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  bytes: Buffer;
}

/** Calls fal.ai and downloads the first image. `fetchImpl` is injectable for tests. */
export async function generateImage(o: GenerateOptions, key: string, fetchImpl: FetchLike = fetch): Promise<GeneratedImage> {
  const prompt = technicalPrompt(o);
  const model = o.imageUrl ? IMG2IMG_MODEL : TXT2IMG_MODEL;
  // output_format png: flux answers jpeg by default, and pixelize reads PNG.
  const body: Record<string, unknown> = o.imageUrl
    ? { prompt, image_urls: [o.imageUrl], sync_mode: true, image_size: 'square_hd', enable_safety_checker: false, output_format: 'png' }
    : { prompt, image_size: 'square_hd', num_inference_steps: 4, enable_safety_checker: false, output_format: 'png' };
  const res = await fetchImpl(`${FAL_BASE_URL}/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { images?: { url?: string }[] };
  const url = json.images?.[0]?.url;
  if (!url) throw new Error('fal returned no image');
  const img = await fetchImpl(url);
  if (!img.ok) throw new Error(`could not download the image (${img.status})`);
  const bytes = Buffer.from(await img.arrayBuffer());
  const isPng = bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!isPng) {
    throw new Error(`the model returned something that is not a PNG (${bytes.slice(0, 4).toString('hex')}); check output_format`);
  }
  return { url, prompt, model, bytes };
}

/** Is this pixel part of a flat lime-green chroma background? */
function isChromaGreen(r: number, g: number, b: number): boolean {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return false;
  const d = max - min;
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  h *= 360;
  return h >= 60 && h <= 170 && sat > 0.4 && l > 0.3;
}

/** The flat background color: the color most corners agree on, if any. */
export function detectBackground(img: Rgba): [number, number, number] | null {
  const off = Math.min(5, img.width - 1, img.height - 1);
  const corners: [number, number][] = [[off, off], [img.width - 1 - off, off], [off, img.height - 1 - off], [img.width - 1 - off, img.height - 1 - off]];
  const colors = corners.map(([x, y]) => {
    const i = (y * img.width + x) * 4;
    return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]] as [number, number, number, number];
  });
  for (const c of colors) {
    if (c[3] < 8) continue;
    const agree = colors.filter(d => d[3] >= 8 && Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]) < 30).length;
    if (agree >= 2) return [c[0], c[1], c[2]];
  }
  return null;
}

function isBackgroundPixel(r: number, g: number, b: number, a: number, bg: [number, number, number] | null): boolean {
  if (a < 8) return true;
  if (!bg) return false;
  const dist = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
  if (isChromaGreen(bg[0], bg[1], bg[2])) return dist < 90 || isChromaGreen(r, g, b);
  return dist < 65;
}

export interface CropResult {
  image: Rgba;
  box: { x: number; y: number; w: number; h: number };
}

/**
 * Crops the image to the square around whatever is not background (chroma
 * green or transparent), with a margin, so a small figure in a big render
 * fills the grid instead of dissolving into a few cells.
 */
export function cropToContent(img: Rgba, marginFraction = 0.04, background?: [number, number, number] | null): CropResult {
  const bg = background === undefined ? detectBackground(img) : background;
  const pad: [number, number, number, number] = bg ? [bg[0], bg[1], bg[2], 255] : [0, 0, 0, 0];
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      if (isBackgroundPixel(img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3], bg)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return { image: img, box: { x: 0, y: 0, w: img.width, h: img.height } };
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const side = Math.round(Math.max(w, h) * (1 + 2 * marginFraction));
  const cx = Math.round((x0 + x1) / 2), cy = Math.round((y0 + y1) / 2);
  const sx = cx - Math.floor(side / 2), sy = cy - Math.floor(side / 2);
  const out: Rgba = { width: side, height: side, data: new Uint8Array(side * side * 4) };
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const px = sx + x, py = sy + y;
      const o = (y * side + x) * 4;
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) {
        out.data.set(pad, o); // outside: more of the same background
        continue;
      }
      const i = (py * img.width + px) * 4;
      out.data.set(img.data.subarray(i, i + 4), o);
    }
  }
  return { image: out, box: { x: sx, y: sy, w: side, h: side } };
}

export interface PixelizeOptions {
  id: string;
  name?: string;
  /** Output grid size (square). */
  size: number;
  maxColors?: number;
  alphaThreshold?: number;
  removeBackground?: boolean;
  /** Map to this palette instead of quantizing. */
  fixedPalette?: Record<number, string>;
  category?: SpriteAsset['category'];
  /** Crop to the non-background content first. Default true. */
  crop?: boolean;
}

/** RGBA image → one-frame asset with a quantized palette (the editor's importer, headless). */
/** Makes every background pixel transparent so cell averages do not bleed green into the edges. */
export function knockOutBackground(img: Rgba, background?: [number, number, number] | null): Rgba {
  const bg = background === undefined ? detectBackground(img) : background;
  if (!bg) return img;
  const out: Rgba = { width: img.width, height: img.height, data: new Uint8Array(img.data) };
  for (let i = 0; i < out.data.length; i += 4) {
    if (isBackgroundPixel(out.data[i], out.data[i + 1], out.data[i + 2], out.data[i + 3], bg)) {
      out.data[i + 3] = 0;
    }
  }
  return out;
}

export function pixelize(source: Rgba, o: PixelizeOptions): SpriteAsset {
  // The background is read once from the full render: after a tight crop the
  // corners may already be inside the figure.
  const bg = detectBackground(source);
  const cropped = (o.crop ?? true) ? cropToContent(source, 0.04, bg).image : source;
  const img = (o.removeBackground ?? true) ? knockOutBackground(cropped, bg) : cropped;
  const imageData = { data: new Uint8ClampedArray(img.data), width: img.width, height: img.height, colorSpace: 'srgb' } as unknown as ImageData;
  const result = imageToPixelData(imageData, {
    targetSize: o.size,
    maxColors: o.maxColors,
    alphaThreshold: o.alphaThreshold,
    // Already knocked out above; the quantizer's own corner sampling would
    // otherwise pick the figure itself as "background" on a tight crop.
    removeBackground: false,
    fixedPalette: o.fixedPalette,
  });
  const asset = createAsset({ id: o.id, name: o.name, width: o.size, category: o.category ?? 'character' });
  asset.layers![0].frames[0] = result.frame;
  asset.palette = { ...result.palette };
  asset.colorNames = { ...result.colorNames };
  // Index 0 is transparent by convention and never listed in the palette.
  delete asset.palette[0];
  delete asset.colorNames[0];
  return asset;
}
