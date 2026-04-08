import type { SpriteAsset } from '@/lib/types';
import { warrior } from './warrior';
import { warrior16 } from './warrior16';
import { pineTree } from './pineTree';
import { pineTree16 } from './pineTree16';
import { treasureChest } from './treasureChest';
import { treasureChest16 } from './treasureChest16';
import { waterTile } from './waterTile';
import { waterTile16 } from './waterTile16';
import { coin } from './coin';
import { coin16 } from './coin16';
import { xianxiaWizard } from './xianxiaWizard';
import { xianxiaWizard16 } from './xianxiaWizard16';
import { xianxiaWizardAuto } from './xianxiaWizardAuto';

/** All available assets in the catalog */
export const ASSET_CATALOG: SpriteAsset[] = [
  warrior,
  warrior16,
  pineTree,
  pineTree16,
  treasureChest,
  treasureChest16,
  waterTile,
  waterTile16,
  coin,
  coin16,
  xianxiaWizard,
  xianxiaWizard16,
  xianxiaWizardAuto,
];

/** Look up an asset by its unique ID */
export function getAssetById(id: string): SpriteAsset | undefined {
  return ASSET_CATALOG.find(a => a.id === id);
}

/** Get all assets matching a category (or all if category is 'all') and optional size */
export function getAssetsByCategory(category: string, size?: number): SpriteAsset[] {
  let assets = category === 'all' ? ASSET_CATALOG : ASSET_CATALOG.filter(a => a.category === category);
  if (size) {
    assets = assets.filter(a => a.size === size);
  }
  return assets;
}

// Re-export individual assets for direct import
export { 
  warrior, warrior16, 
  pineTree, pineTree16, 
  treasureChest, treasureChest16, 
  waterTile, waterTile16, 
  coin, coin16, 
  xianxiaWizard, xianxiaWizard16, 
  xianxiaWizardAuto 
};
