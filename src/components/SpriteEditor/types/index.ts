import { SpriteAsset } from '@/lib/types';
import { SpriteEditorState, CreateSpriteEditorStoreOptions } from '../store/types';

export const THUMB_SCALE = 4;
export const THUMB_SIZE = 16 * THUMB_SCALE;

export const AVAILABLE_ANIMS = [
  { value: 'idle', label: 'Idle' },
  { value: 'walk_right', label: 'Walk (R)' },
  { value: 'walk_left', label: 'Walk (L)' },
  { value: 'attack_right', label: 'Attack (R)' },
  { value: 'attack_left', label: 'Attack (L)' },
  { value: 'hurt', label: 'Hurt' },
  { value: 'die', label: 'Die' },
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
  isIconMode?: boolean;
  iconId?: string;
}

// Re-export store types for UI components
export type { SpriteEditorState, CreateSpriteEditorStoreOptions };
