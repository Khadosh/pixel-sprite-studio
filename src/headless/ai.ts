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
  const body: Record<string, unknown> = o.imageUrl
    ? { prompt, image_urls: [o.imageUrl], sync_mode: true, image_size: 'square_hd', enable_safety_checker: false }
    : { prompt, image_size: 'square_hd', num_inference_steps: 4, enable_safety_checker: false };
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
  return { url, prompt, model, bytes: Buffer.from(await img.arrayBuffer()) };
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
}

/** RGBA image → one-frame asset with a quantized palette (the editor's importer, headless). */
export function pixelize(img: Rgba, o: PixelizeOptions): SpriteAsset {
  const imageData = { data: new Uint8ClampedArray(img.data), width: img.width, height: img.height, colorSpace: 'srgb' } as unknown as ImageData;
  const result = imageToPixelData(imageData, {
    targetSize: o.size,
    maxColors: o.maxColors,
    alphaThreshold: o.alphaThreshold,
    removeBackground: o.removeBackground,
    fixedPalette: o.fixedPalette,
  });
  const asset = createAsset({ id: o.id, name: o.name, width: o.size, category: o.category ?? 'character' });
  asset.layers![0].frames[0] = result.frame;
  asset.palette = result.palette;
  asset.colorNames = result.colorNames;
  return asset;
}
