import { SpriteAsset } from "./types";

/**
 * Normalizes a tag string:
 * - Lowercase
 * - Trim whitespace
 * - Replace non-alphanumeric (except hyphens/underscores) with nothing
 * - Remove duplicates
 */
export const normalizeTag = (tag: string): string => {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '');
};

export const normalizeTags = (tags: string[]): string[] => {
  const normalized = tags.map(normalizeTag).filter(t => t.length > 0);
  return Array.from(new Set(normalized));
};

export const SUGGESTED_TAGS_BY_CATEGORY: Record<SpriteAsset['category'], string[]> = {
  character: ['hero', 'enemy', 'npc', 'boss', 'warrior', 'mage', 'rogue', 'human', 'monster', 'undead'],
  terrain: ['floor', 'wall', 'grass', 'water', 'lava', 'stone', 'dirt', 'platform', 'tile', 'isometric'],
  prop: ['weapon', 'shield', 'accessory', 'potion', 'loot', 'chest', 'item', 'gold', 'light', 'container'],
  nature: ['tree', 'bush', 'flower', 'rock', 'cloud', 'sky', 'animal', 'plant', 'environment'],
  ui: ['button', 'icon', 'frame', 'cursor', 'gauge', 'dialog', 'label', 'menu', 'inventory']
};

export const getSuggestedTags = (category: SpriteAsset['category'], currentTags: string[] = []): string[] => {
  const suggestions = SUGGESTED_TAGS_BY_CATEGORY[category] || [];
  const normalizedCurrent = currentTags.map(normalizeTag);
  return suggestions.filter(s => !normalizedCurrent.includes(s));
};
