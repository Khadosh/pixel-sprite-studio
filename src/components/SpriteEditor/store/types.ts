import { SpriteAsset, AdvancedCastSettings, Frame } from '@/lib/types';
import { EditorScope } from '@/components/EditorToolbar';
import { EditorTool } from '@/hooks/usePixelEditor';
import { BrushSize } from '@/components/EditorToolbar';
import { DragEndEvent } from '@dnd-kit/core';
import { AnimationPreviewPanelHandle } from '../components/AnimationPreviewPanel';

export interface SpriteEditorState {
  // --- Core State ---
  editedAsset: SpriteAsset;
  activeLayerId: string | null;
  editingFrameIndex: number;
  viewingAnimation: string;
  assetName: string;
  isEditingName: boolean;
  onionSkin: boolean;
  showAllColors: boolean;
  scope: EditorScope;
  castSettings: AdvancedCastSettings;
  zoom: number;
  tool: EditorTool;
  activeColorKey: number;
  brushSize: BrushSize;
  mirrorX: boolean;
  layerClipboard: number[][] | null;
  frameClipboard: Record<string, number[][]> | null;
  leftSidebarTab: 'layers' | 'themes' | 'assets' | 'animations' | 'config' | 'anatomy' | 'history' | 'procedural' | null;
  isDirty: boolean;
  canvasBg: 'light' | 'dark';
  activePerspective: 'front' | 'side' | 'back';
  activeSide: 'left' | 'right';
  showIsometricGrid: boolean;
  sketchMode: boolean;
  projectId?: string;
  projectConfig?: import('@/lib/supabase').ProjectConfig;
  isIconMode?: boolean;
  iconId?: string;

  // Animation generation state
  selectedAnims: string[];
  isAnimGenerating: boolean;
  animError: string | null;

  // Props from parent
  _onSave: (asset: SpriteAsset) => void;
  _onOpenChange: (open: boolean) => void;
  _previewPanelRef: React.RefObject<AnimationPreviewPanelHandle>;
  _generatePrompt?: string;
  _onRegenerate?: () => void;
  _isGenerating?: boolean;

  // Pixel editor bridge
  _pixelEditorBridge: {
    setTool: (t: EditorTool) => void;
    setActiveColorKey: (k: number) => void;
    setBrushSize: (s: BrushSize) => void;
    setMirrorX: (on: boolean | ((p: boolean) => boolean)) => void;
    draftFrame: Frame | null;
    handlePointerDown: (r: number, c: number, forceTool?: EditorTool) => void;
    handlePointerMove: (r: number, c: number, forceTool?: EditorTool) => void;
    handlePointerUp: () => void;
    undo: () => void;
    canUndo: boolean;
    overwriteLayerFrame: (frame: Frame) => void;
    moveOffset?: { dr: number; dc: number; activeLayerId?: string | null } | null;
    rotationAngle: number | null;
    rotationCenter?: { r: number; c: number; activeLayerId?: string | null } | null;
    selectionRect: { r: number; c: number; w: number; h: number } | null;
    setSelectionRect: (rect: { r: number; c: number; w: number; h: number } | null) => void;
    movingSelectionPixels: Frame | null;
    stampSelection: () => void;
    clearFloatingPixels: () => void;
    _handleGenerateAnimationsAI: (type?: string) => Promise<void>;
    _handleGeneratePerspectiveAI: () => Promise<void>;
    _handleDownloadReferenceImage?: () => void;
  } | null;

  // --- Anatomy State ---
  anatomyActiveMemberId: string | null;
  anatomySelectedOrientation: number; // 0, 1, 2
  anatomyIsSelectionMode: boolean;
  anatomyShowAllMasks: boolean;

  // actions
  setEditedAsset: (asset: SpriteAsset | ((prev: SpriteAsset) => SpriteAsset)) => void;
  setActiveLayerId: (id: string | null) => void;
  setEditingFrameIndex: (idx: number) => void;
  setViewingAnimation: (name: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setAssetName: (name: string) => void;
  setIsEditingName: (editing: boolean) => void;
  setOnionSkin: (on: boolean | ((prev: boolean) => boolean)) => void;
  setShowAllColors: (on: boolean | ((prev: boolean) => boolean)) => void;
  setScope: (scope: EditorScope) => void;
  setCastSettings: (settings: AdvancedCastSettings | ((prev: AdvancedCastSettings) => AdvancedCastSettings)) => void;
  setLeftSidebarTab: (tab: 'layers' | 'themes' | 'assets' | 'animations' | 'config' | 'anatomy' | 'history' | 'procedural' | null) => void;
  applyPalettePreset: (colors: string[]) => void;
  addColorRamp: (colors: string[]) => void;
  setZoom: (z: number | ((prev: number) => number)) => void;
  setSelectedAnims: (anims: string[] | ((prev: string[]) => string[])) => void;
  setIsAnimGenerating: (g: boolean) => void;
  setAnimError: (e: string | null) => void;
  setPixelEditorBridge: (bridge: SpriteEditorState['_pixelEditorBridge']) => void;
  setCanvasBg: (bg: 'light' | 'dark' | ((prev: 'light' | 'dark') => 'light' | 'dark')) => void;
  setActivePerspective: (perspective: 'front' | 'side' | 'back') => void;
  setActiveSide: (side: 'left' | 'right') => void;
  setShowIsometricGrid: (show: boolean | ((prev: boolean) => boolean)) => void;
  setSketchMode: (on: boolean | ((prev: boolean) => boolean)) => void;
  setMirrorX: (on: boolean | ((prev: boolean) => boolean)) => void;
  setBrushSize: (size: BrushSize) => void;
  setTool: (tool: EditorTool) => void;
  setActiveColorKey: (key: number) => void;
  setCategory: (cat: SpriteAsset['category']) => void;
  setDescription: (desc: string) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  setAnatomyActiveMemberId: (id: string | null) => void;
  setAnatomySelectedOrientation: (idx: number) => void;
  setAnatomyIsSelectionMode: (on: boolean) => void;
  setAnatomyShowAllMasks: (on: boolean) => void;
  toggleMemberPixel: (r: number, c: number, force?: boolean) => void;
  fillMemberGaps: () => void;

  duplicateFrame: (idx: number) => void;
  deleteFrame: (idx: number) => void;
  insertEmptyFrame: (idx: number) => void;
  
  // ... rest of actions

  addLayer: () => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  mergeLayerDown: (id: string) => void;
  moveLayer: (idx: number, dir: 'up' | 'down') => void;
  importAssetLayer: (params: { 
    name: string; 
    frame: Frame; 
    palette: Record<number, string>; 
    colorNames?: Record<number, string>;
  }) => void;

  changeColor: (key: number, color: string) => void;
  addColor: () => void;
  removeColor: (key: number) => void;
  renameColor: (key: number, name: string) => void;

  toggleAnim: (anim: string) => void;
  selectAllAnims: () => void;
  clearSelection: () => void;
  generateAnimations: (type?: string) => void;
  generateCustomAnimation: (name: string) => void;
  generatePerspectiveAI: () => void;
  renameAnimation: (name: string, newLabel: string) => void;
  removeAnimation: (name: string) => void;

  handleCopy: () => void;
  handlePaste: () => void;
  handleFlipH: () => void;
  handleFlipV: () => void;
  handleRotate: () => void;
  handleMirrorSide: () => void;
  handleDragEnd: (event: DragEndEvent) => void;

  handleExportPNG: (options?: { includeLabels?: boolean }) => void;
  handleExportGIF: () => Promise<void>;
  handleExportJSON: () => void;
  handleExportIcon: () => void;

  handleSave: () => void;
  handleClose: () => void;
  initFromAsset: (asset: SpriteAsset) => void;

  createCheckpoint: (name?: string) => void;
  restoreCheckpoint: (versionId: string) => void;
  clearHistory: () => void;

  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  past: SpriteAsset[];
  future: SpriteAsset[];
}

export interface CreateSpriteEditorStoreOptions {
  initialAsset: SpriteAsset;
  onSave: (asset: SpriteAsset) => void;
  onOpenChange: (open: boolean) => void;
  previewPanelRef: React.RefObject<AnimationPreviewPanelHandle>;
  generatePrompt?: string;
  onRegenerate?: () => void;
  isGenerating?: boolean;
  projectId?: string;
  projectConfig?: import('@/lib/supabase').ProjectConfig;
  isIconMode?: boolean;
  iconId?: string;
}

export type StoreSlice<T> = (
  set: (
    partial: Partial<SpriteEditorState> | ((state: SpriteEditorState) => Partial<SpriteEditorState>),
    replace?: boolean
  ) => void,
  get: () => SpriteEditorState
) => T;
