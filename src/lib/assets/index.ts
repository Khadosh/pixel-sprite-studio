import type { SpriteAsset } from '@/lib/types';
import { warrior } from './warrior';
import { pineTree } from './pineTree';
import { treasureChest } from './treasureChest';
import { waterTile } from './waterTile';
import { coin } from './coin';

/** All available assets in the catalog */
export const ASSET_CATALOG: SpriteAsset[] = [
  warrior,
  pineTree,
  treasureChest,
  waterTile,
  coin,
];

/** Look up an asset by its unique ID */
export function getAssetById(id: string): SpriteAsset | undefined {
  return ASSET_CATALOG.find(a => a.id === id);
}

/** Get all assets matching a category (or all if category is 'all') */
export function getAssetsByCategory(category: string): SpriteAsset[] {
  if (category === 'all') return ASSET_CATALOG;
  return ASSET_CATALOG.filter(a => a.category === category);
}

// Re-export individual assets for direct import
export { warrior, pineTree, treasureChest, waterTile, coin };
