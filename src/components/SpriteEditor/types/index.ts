import { SpriteAsset } from '@/lib/types';
import { SpriteEditorState, CreateSpriteEditorStoreOptions } from '../store/types';

export const THUMB_SCALE = 4;
export const THUMB_SIZE = 16 * THUMB_SCALE;

export const AVAILABLE_ANIMS = [
  { value: 'idle', label: 'Idle' },
  { value: 'walk', label: 'Walk' },
  { value: 'attack', label: 'Attack' },
  { value: 'cast', label: 'Cast' },
  { value: 'hurt', label: 'Hurt' },
  { value: 'jump', label: 'Jump' },
];

export interface SpriteEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAsset: SpriteAsset;
  onSave: (asset: SpriteAsset) => void;
  generatePrompt?: string;
  onRegenerate?: () => void;
  isGenerating?: boolean;
  projectId?: string;
}

// Re-export store types for UI components
export type { SpriteEditorState, CreateSpriteEditorStoreOptions };
