import { SpriteAsset, AdvancedCastSettings } from '@/lib/types';
import { EditorScope, BrushSize } from '@/components/EditorToolbar';
import { EditorTool } from '@/hooks/usePixelEditor';
import { DragEndEvent } from '@dnd-kit/core';
import type { AnimationPreviewPanelHandle } from '../components/AnimationPreviewPanel';

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
}

export interface SpriteEditorContextValue {
  // Asset State
  editedAsset: SpriteAsset;
  setEditedAsset: React.Dispatch<React.SetStateAction<SpriteAsset>>;
  assetName: string;
  setAssetName: React.Dispatch<React.SetStateAction<string>>;
  isEditingName: boolean;
  setIsEditingName: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Layer State
  activeLayerId: string | null;
  setActiveLayerId: (id: string | null) => void;
  activeLayer: any; // Keep any for dynamic layer object, or define Layer type
  
  // Frame/Animation State
  editingFrameIndex: number;
  setEditingFrameIndex: (idx: number) => void;
  viewingAnimation: string;
  setViewingAnimation: (name: string) => void;
  selectedAnims: string[];
  setSelectedAnims: React.Dispatch<React.SetStateAction<string[]>>;
  castSettings: AdvancedCastSettings;
  setCastSettings: React.Dispatch<React.SetStateAction<AdvancedCastSettings>>;
  visibleFramesIndices: number[];
  frameLabels: string[];
  
  // Editor Config
  onionSkin: boolean;
  setOnionSkin: (on: boolean) => void;
  onionGhostFrames: { prev?: number[][]; next?: number[][] };
  showAllColors: boolean;
  setShowAllColors: (on: boolean) => void;
  scope: EditorScope;
  setScope: (scope: EditorScope) => void;
  
  // Handlers & Actions
  handleExportPNG: (options?: { includeLabels?: boolean }) => void;
  handleExportGIF: () => Promise<void>;
  handleSave: () => void;
  undo: () => void;
  canUndo: boolean;
  tool: EditorTool;
  setTool: (tool: EditorTool) => void;
  brushSize: BrushSize;
  setBrushSize: (size: BrushSize) => void;
  mirrorX: boolean;
  setMirrorX: (on: boolean | ((p: boolean) => boolean)) => void;
  
  // Palette
  activeColorKey: number;
  setActiveColorKey: (key: number) => void;
  filteredPalette: Record<number, string>;
  handleChangeColor: (key: number, color: string) => void;
  handleAddColor: () => void;
  handleRemoveColor: (key: number) => void;
  handleRenameColor: (key: number, name: string) => void;

  // Layer Actions
  handleAddLayer: () => void;
  handleRemoveLayer: (id: string) => void;
  handleToggleLayerVisibility: (id: string) => void;
  handleToggleLayerLock: (id: string) => void;
  handleRenameLayer: (id: string, name: string) => void;
  handleMoveLayer: (idx: number, dir: 'up' | 'down') => void;

  // Frame Actions
  handleDuplicateFrame: (idx: number) => void;
  handleDeleteFrame: (idx: number) => void;
  handleInsertEmptyFrame: (idx: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;

  // Clipboard & Transform
  handleCopy: () => void;
  handlePaste: () => void;
  handleFlipH: () => void;
  handleFlipV: () => void;
  handleRotate: () => void;

  // Animation Generation
  handleGenerateAnimations: () => void;
  handleGenerateAnimationsAI: () => Promise<void>;
  selectAllAnims: () => void;
  clearSelection: () => void;
  toggleAnim: (name: string) => void;
  isAnimGenerating: boolean;
  animError: string | null;
  previewPanelRef: React.RefObject<AnimationPreviewPanelHandle>;

  // Meta
  isGenerating?: boolean; // From props
  onRegenerate?: () => void; // From props
  generatePrompt?: string; // From props

  // Drawing Props (for SpritePixelEditor)
  draftFrame: number[][] | null;
  handlePointerDown: (row: number, col: number) => void;
  handlePointerMove: (row: number, col: number) => void;
  handlePointerUp: () => void;
  moveOffset?: { dr: number; dc: number; activeLayerId?: string | null } | null;
  rotationAngle: number;
  rotationCenter?: { r: number; c: number; activeLayerId?: string | null } | null;
}
