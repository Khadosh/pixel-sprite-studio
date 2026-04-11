import { SpriteAsset, AdvancedCastSettings } from '@/lib/types';

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

export interface SpriteEditorState {
  editedAsset: SpriteAsset;
  initialAsset: SpriteAsset;
  projectId?: string;
  assetName: string;
  isDirty: boolean;
  activeLayerId: string | null;
  editingFrameIndex: number;
  zoom: number;
  canvasBg: 'light' | 'dark' | 'none';
  
  // Actions
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  
  importAssetLayer: (params: { 
    name: string; 
    frame: number[][]; 
    palette: Record<number, string>; 
    colorNames?: Record<number, string>;
  }) => void;
  
  addLayer: () => void;
  removeLayer: (id: string) => void;
  moveLayer: (idx: number, dir: 'up' | 'down') => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  mergeLayerDown: (id: string) => void;
  
  // Frame actions
  addFrame: () => void;
  duplicateFrame: (index: number) => void;
  deleteFrame: (index: number) => void;
  moveFrame: (from: number, to: number) => void;
  
  // Export actions
  exportPng: () => void;
  exportGif: () => void;

  projectId?: string;
  _projectId?: string; // Internal ref
  _onSave?: (asset: SpriteAsset) => void;
  _onOpenChange?: (open: boolean) => void;
  _generatePrompt?: string;
  _onRegenerate?: () => void;
  _isGenerating?: boolean;
  _previewPanelRef?: React.RefObject<HTMLDivElement>;
}

export type StoreSlice<T> = (
  set: (fn: (state: SpriteEditorState) => T) => void,
  get: () => SpriteEditorState
) => T;
