// Core types for the Pixel Sprite Studio asset system.
// Designed to be JSON-serializable for future LLM generation.

/** A single frame of pixel art — a 2D grid where each number maps to a palette color. */
export type Frame = number[][];

/** A layer within a sprite asset. */
export interface SpriteLayer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number; // 0.0 to 1.0
  frames: Frame[]; // Frame content for this layer
  paletteIds?: number[]; // Added for layer-specific palette filtering
}

/** Defines a named animation as a sequence of frame indices. */
export interface AnimationDef {
  /** Machine-readable name, e.g. 'idle', 'walk' */
  name: string;
  /** Display label, e.g. 'IDLE', 'WALK' */
  label: string;
  /** Indices into SpriteAsset.layers[0].frames[] — allows frame reuse */
  frameIndices: number[];
  /** Playback speed in frames per second. Default: 5 (200ms per frame) */
  fps?: number;
}

/** A complete sprite asset with its own palette, layers, and optional animations. */
export interface SpriteAsset {
  /** Unique identifier, used in URLs */
  id: string;
  /** Display name */
  name: string;
  /** Short description of the asset */
  description: string;
  /** Asset category for catalog filtering */
  category: 'character' | 'terrain' | 'prop' | 'nature' | 'ui';

  /** Grid size in pixels (width = height). Typically 16 or 32. */
  size: number;
  /** Color palette: number → hex color string. 0 is always transparent. */
  palette: Record<number, string>;
  /** Human-readable names for each palette color (for the palette editor) */
  colorNames: Record<number, string>;
  
  /** [DEPRECATED] All unique frames for this asset. Moved to layers. */
  frames?: Frame[];
  
  /** All layers for this asset (auto-populated from frames if missing) */
  layers?: SpriteLayer[];

  /** Animation definitions. Empty array = static asset (single frame). */
  animations: AnimationDef[];
  /** Optional tags for search/filtering */
  tags?: string[];
}

/** Configuration for advanced procedural cast animations */
export type CastShape = 'circle' | 'burst' | 'beam' | 'random';
export type CastElement = 'fire' | 'water' | 'electric' | 'nature' | 'ice' | 'generic';

export interface AdvancedCastSettings {
  shape: CastShape;
  element: CastElement;
  color?: string; // Optional hex override
}

/** Category metadata for the catalog UI */
export interface CategoryInfo {
  id: SpriteAsset['category'] | 'all';
  label: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'all',       label: 'All',        icon: '✦' },
  { id: 'character',  label: 'Characters', icon: '⚔' },
  { id: 'terrain',    label: 'Terrain',    icon: '▦' },
  { id: 'prop',       label: 'Props',      icon: '◆' },
  { id: 'nature',     label: 'Nature',     icon: '♣' },
  { id: 'ui',         label: 'UI',         icon: '♥' },
];
