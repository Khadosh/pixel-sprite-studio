// Headless asset model from Node: the pure model (assetModel.ts) plus loading
// and saving asset JSON on disk. The web editor keeps working on the same JSON.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { SpriteAsset } from '../lib/types';
import { normalizeAsset } from './assetModel';

export * from './assetModel';

/** Reads an asset JSON from disk and makes sure it has layers. */
export function loadAsset(path: string): SpriteAsset {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as SpriteAsset;
  return normalizeAsset(raw);
}

export function saveAsset(path: string, asset: SpriteAsset): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(asset, null, 1) + '\n');
}
