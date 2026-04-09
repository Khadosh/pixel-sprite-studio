import { createStore } from 'zustand/vanilla';
import { SpriteAsset, AdvancedCastSettings } from '@/lib/types';
import { AVAILABLE_ANIMS } from '../types';
import { EditorScope } from '@/components/EditorToolbar';
import { EditorTool } from '@/hooks/usePixelEditor';
import type { Frame } from '@/lib/types';
import type { BrushSize } from '@/components/EditorToolbar';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ensureLayerSupport, compositeFrame, addNewLayer, removeLayer, reorderLayers, renameLayer, toggleLayerVisibility, toggleLayerLock, upscale2x } from '@/lib/layerUtils';
import { duplicateFrameInAllLayers, removeFrameFromAllLayers, addEmptyFrameToAllLayers, generateAnimationsClientSide } from '@/lib/spriteAnimations';
import { flipHorizontal, flipVertical, rotate90 } from '@/lib/spriteTransforms';
import { PROP_LIBRARY } from '@/lib/assets/props';
import { exportAsPNG, exportAsGIF } from '../utils/exportUtils';
import type { AnimationPreviewPanelHandle } from '../components/AnimationPreviewPanel';

// ─── Helpers ───

const getNextAnimationName = (existing: { name: string }[], type: string) => {
  const baseName = type.toLowerCase();
  const baseLabel = type.toUpperCase();
  const existingNames = existing.map(a => a.name);
  if (!existingNames.includes(baseName)) {
    return { name: baseName, label: baseLabel };
  }
  let i = 1;
  while (existingNames.includes(`${baseName}_${i}`)) i++;
  return { name: `${baseName}_${i}`, label: `${baseLabel} ${i}` };
};

// ─── State type ───

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
  layerClipboard: number[][] | null;
  frameClipboard: Record<string, number[][]> | null;

  // Animation generation state
  selectedAnims: string[];
  isAnimGenerating: boolean;
  animError: string | null;

  // Props from parent (read-only, set once)
  _onSave: (asset: SpriteAsset) => void;
  _onOpenChange: (open: boolean) => void;
  _previewPanelRef: React.RefObject<AnimationPreviewPanelHandle>;
  _generatePrompt?: string;
  _onRegenerate?: () => void;
  _isGenerating?: boolean;

  // Pixel editor bridge (set by SpriteEditor.tsx after usePixelEditor)
  _pixelEditorBridge: {
    tool: EditorTool;
    setTool: (t: EditorTool) => void;
    activeColorKey: number;
    setActiveColorKey: (k: number) => void;
    brushSize: BrushSize;
    setBrushSize: (s: BrushSize) => void;
    mirrorX: boolean;
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
  } | null;

  // --- Setters ---
  setEditedAsset: (asset: SpriteAsset | ((prev: SpriteAsset) => SpriteAsset)) => void;
  setActiveLayerId: (id: string | null) => void;
  setEditingFrameIndex: (idx: number) => void;
  setViewingAnimation: (name: string) => void;
  setAssetName: (name: string) => void;
  setIsEditingName: (editing: boolean) => void;
  setOnionSkin: (on: boolean) => void;
  setShowAllColors: (on: boolean) => void;
  setScope: (scope: EditorScope) => void;
  setCastSettings: (settings: AdvancedCastSettings | ((prev: AdvancedCastSettings) => AdvancedCastSettings)) => void;
  setZoom: (z: number | ((prev: number) => number)) => void;
  setSelectedAnims: (anims: string[] | ((prev: string[]) => string[])) => void;
  setIsAnimGenerating: (g: boolean) => void;
  setAnimError: (e: string | null) => void;
  setPixelEditorBridge: (bridge: SpriteEditorState['_pixelEditorBridge']) => void;

  // --- Frame Actions ---
  duplicateFrame: (idx: number) => void;
  deleteFrame: (idx: number) => void;
  insertEmptyFrame: (idx: number) => void;

  // --- Layer Actions ---
  addLayer: () => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  moveLayer: (idx: number, dir: 'up' | 'down') => void;
  addPropLayer: (propId: string) => void;

  // --- Palette Actions ---
  changeColor: (key: number, color: string) => void;
  addColor: () => void;
  removeColor: (key: number) => void;
  renameColor: (key: number, name: string) => void;

  // --- Animation Actions ---
  toggleAnim: (anim: string) => void;
  selectAllAnims: () => void;
  clearSelection: () => void;
  generateAnimations: (type?: string) => void;
  renameAnimation: (name: string, newLabel: string) => void;
  removeAnimation: (name: string) => void;

  // --- Transform Actions ---
  handleCopy: () => void;
  handlePaste: () => void;
  handleFlipH: () => void;
  handleFlipV: () => void;
  handleRotate: () => void;
  handleDragEnd: (event: DragEndEvent) => void;

  // --- Export Actions ---
  handleExportPNG: (options?: { includeLabels?: boolean }) => void;
  handleExportGIF: () => Promise<void>;

  // --- Meta Actions ---
  handleSave: () => void;
  handleClose: () => void;
  initFromAsset: (asset: SpriteAsset) => void;
  // --- History Actions ---
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  past: SpriteAsset[];
  future: SpriteAsset[];
}

// ─── Store options ───

export interface CreateSpriteEditorStoreOptions {
  initialAsset: SpriteAsset;
  onSave: (asset: SpriteAsset) => void;
  onOpenChange: (open: boolean) => void;
  previewPanelRef: React.RefObject<AnimationPreviewPanelHandle>;
  generatePrompt?: string;
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

// ─── Store factory ───

export function createSpriteEditorStore(options: CreateSpriteEditorStoreOptions) {
  const migrated = ensureLayerSupport(options.initialAsset);

  return createStore<SpriteEditorState>((set, get) => ({
    // --- Initial State ---
    editedAsset: migrated,
    activeLayerId: migrated.layers[0]?.id || null,
    editingFrameIndex: 0,
    viewingAnimation: 'base',
    assetName: options.initialAsset.name,
    isEditingName: false,
    onionSkin: false,
    showAllColors: false,
    scope: 'layer' as EditorScope,
    castSettings: { shape: 'burst', element: 'generic' } as AdvancedCastSettings,
    zoom: 1.0,
    layerClipboard: null,
    frameClipboard: null,
    selectedAnims: [],
    isAnimGenerating: false,
    animError: null,
    
    // History stacks
    past: [] as SpriteAsset[],
    future: [] as SpriteAsset[],
    canUndo: false,
    canRedo: false,

    // Props
    _onSave: options.onSave,
    _onOpenChange: options.onOpenChange,
    _previewPanelRef: options.previewPanelRef,
    _generatePrompt: options.generatePrompt,
    _onRegenerate: options.onRegenerate,
    _isGenerating: options.isGenerating,

    // Pixel editor bridge (set later)
    _pixelEditorBridge: null,

    // --- Setters ---
    setEditedAsset: (assetOrFn) => set(state => ({
      editedAsset: typeof assetOrFn === 'function' ? assetOrFn(state.editedAsset) : assetOrFn,
    })),
    setActiveLayerId: (id) => set({ activeLayerId: id }),
    setEditingFrameIndex: (idx) => set({ editingFrameIndex: idx }),
    setViewingAnimation: (name) => set({ viewingAnimation: name }),
    setAssetName: (name) => set({ assetName: name }),
    setIsEditingName: (editing) => set({ isEditingName: editing }),
    setOnionSkin: (on) => set({ onionSkin: on }),
    setShowAllColors: (on) => set({ showAllColors: on }),
    setScope: (scope) => set({ scope }),
    setCastSettings: (settingsOrFn) => set(state => ({
      castSettings: typeof settingsOrFn === 'function' ? settingsOrFn(state.castSettings) : settingsOrFn,
    })),
    setZoom: (zOrFn) => set(state => ({
      zoom: typeof zOrFn === 'function' ? zOrFn(state.zoom) : zOrFn,
    })),
    setSelectedAnims: (animsOrFn) => set(state => ({
      selectedAnims: typeof animsOrFn === 'function' ? animsOrFn(state.selectedAnims) : animsOrFn,
    })),
    setIsAnimGenerating: (g) => set({ isAnimGenerating: g }),
    setAnimError: (e) => set({ animError: e }),
    setPixelEditorBridge: (bridge) => set({ _pixelEditorBridge: bridge }),

    // --- History Internal Helper ---
    pushUndo: () => set(state => {
      // Deep clone only the asset to save in history
      const snapshot = JSON.parse(JSON.stringify(state.editedAsset));
      const newPast = [snapshot, ...state.past].slice(0, 50);
      return { 
        past: newPast, 
        future: [],
        canUndo: true,
        canRedo: false
      };
    }),

    undo: () => set(state => {
      if (state.past.length === 0) return state;
      const [previous, ...rest] = state.past;
      const current = JSON.parse(JSON.stringify(state.editedAsset));
      
      return {
        editedAsset: previous,
        past: rest,
        future: [current, ...state.future],
        canUndo: rest.length > 0,
        canRedo: true
      };
    }),

    redo: () => set(state => {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      const current = JSON.parse(JSON.stringify(state.editedAsset));
      
      return {
        editedAsset: next,
        future: rest,
        past: [current, ...state.past],
        canUndo: true,
        canRedo: rest.length > 0
      };
    }),

    // --- Frame Actions ---
    duplicateFrame: (idx) => {
      get().pushUndo();
      set(state => ({
        editedAsset: duplicateFrameInAllLayers(state.editedAsset, idx),
      }));
    },

    deleteFrame: (idx) => {
      get().pushUndo();
      set(state => {
        let newEditingIdx = state.editingFrameIndex;
        if (newEditingIdx === idx) newEditingIdx = Math.max(0, idx - 1);
        else if (newEditingIdx > idx) newEditingIdx = newEditingIdx - 1;
        return {
          editedAsset: removeFrameFromAllLayers(state.editedAsset, idx),
          editingFrameIndex: newEditingIdx,
        };
      });
    },

    insertEmptyFrame: (idx) => {
      get().pushUndo();
      set(state => ({
        editedAsset: addEmptyFrameToAllLayers(state.editedAsset, idx),
      }));
    },

    // --- Layer Actions ---
    addLayer: () => {
      get().pushUndo();
      set(state => {
        const updated = addNewLayer(state.editedAsset, `Layer ${state.editedAsset.layers.length + 1}`);
        return {
          editedAsset: updated,
          activeLayerId: updated.layers[updated.layers.length - 1].id,
        };
      });
    },

    removeLayer: (layerId) => {
      if (get().editedAsset.layers.length <= 1) return;
      get().pushUndo();
      set(state => {
        const updated = removeLayer(state.editedAsset, layerId);
        return {
          editedAsset: updated,
          activeLayerId: state.activeLayerId === layerId 
            ? updated.layers[updated.layers.length - 1].id 
            : state.activeLayerId,
        };
      });
    },

    toggleLayerVisibility: (layerId) => set(state => ({
      editedAsset: toggleLayerVisibility(state.editedAsset, layerId),
    })),

    toggleLayerLock: (layerId) => set(state => ({
      editedAsset: toggleLayerLock(state.editedAsset, layerId),
    })),

    renameLayer: (layerId, name) => set(state => ({
      editedAsset: renameLayer(state.editedAsset, layerId, name),
    })),

    moveLayer: (fromIdx, direction) => {
      const state = get();
      const toIdx = direction === 'up' ? fromIdx + 1 : fromIdx - 1;
      if (toIdx < 0 || toIdx >= state.editedAsset.layers.length) return;
      state.pushUndo();
      set({ editedAsset: reorderLayers(state.editedAsset, fromIdx, toIdx) });
    },

    addPropLayer: (propId) => {
      const state = get();
      const prop = PROP_LIBRARY.find(p => p.id === propId);
      if (!prop) return;

      const size = state.editedAsset.size || 16;
      let propData = size === 32 ? prop.data32 : prop.data16;
      if (!propData && size === 32 && prop.data16) {
        propData = upscale2x(prop.data16);
      }
      if (!propData) return;

      state.pushUndo();

      const newLayerId = crypto.randomUUID();
      const frameCount = state.editedAsset.layers[0]?.frames.length || 1;
      const newFrames = Array.from({ length: frameCount }, () =>
        propData.map(row => [...row])
      );

      const uniqueColors = new Set<number>();
      propData.forEach(row => {
        row.forEach(pixel => { if (pixel > 0) uniqueColors.add(pixel); });
      });

      set({
        editedAsset: {
          ...state.editedAsset,
          layers: [
            ...state.editedAsset.layers,
            {
              id: newLayerId,
              name: prop.name,
              frames: newFrames,
              isVisible: true,
              isLocked: false,
              opacity: 1,
              paletteIds: Array.from(uniqueColors),
            },
          ],
        },
        activeLayerId: newLayerId,
      });
    },

    // --- Palette Actions ---
    changeColor: (key, color) => set(state => ({
      editedAsset: { ...state.editedAsset, palette: { ...state.editedAsset.palette, [key]: color } },
    })),

    addColor: () => {
      get().pushUndo();
      set(state => {
      const keys = Object.keys(state.editedAsset.palette).map(Number).filter(k => k > 0);
      const newKey = keys.length > 0 ? Math.max(...keys) + 1 : 1;
      const updatedPalette = { ...state.editedAsset.palette, [newKey]: '#888888' };
      const updatedColorNames = { ...state.editedAsset.colorNames, [newKey]: `Color ${newKey}` };

      const newLayers = state.editedAsset.layers.map(layer => {
        if (layer.id === state.activeLayerId) {
          const pIds = layer.paletteIds || [];
          if (!pIds.includes(newKey)) {
            return { ...layer, paletteIds: [...pIds, newKey] };
          }
        }
        return layer;
      });

      return {
        editedAsset: {
          ...state.editedAsset,
          palette: updatedPalette,
          colorNames: updatedColorNames,
          layers: newLayers,
        },
      };
      });
    },

    removeColor: (key) => {
      const state = get();
      state.pushUndo();
      const newPalette = { ...state.editedAsset.palette };
      delete newPalette[key];
      const newColorNames = { ...state.editedAsset.colorNames };
      delete newColorNames[key];

      set({
        editedAsset: {
          ...state.editedAsset,
          palette: newPalette,
          colorNames: newColorNames,
          layers: state.editedAsset.layers.map(layer => ({
            ...layer,
            paletteIds: layer.paletteIds?.filter(id => id !== key),
            frames: layer.frames.map(f =>
              f.map(r => r.map(c => c === key ? 0 : c))
            ),
          })),
        },
      });

      // Reset active color if the removed one was active
      const bridge = get()._pixelEditorBridge;
      if (bridge && bridge.activeColorKey === key) {
        bridge.setActiveColorKey(1);
      }
    },

    renameColor: (key, name) => set(state => ({
      editedAsset: {
        ...state.editedAsset,
        colorNames: { ...state.editedAsset.colorNames, [key]: name },
      },
    })),

    // --- Animation Actions ---
    toggleAnim: (anim) => set(state => ({
      selectedAnims: state.selectedAnims.includes(anim)
        ? state.selectedAnims.filter(a => a !== anim)
        : [...state.selectedAnims, anim],
    })),

    selectAllAnims: () => {
      set({ selectedAnims: AVAILABLE_ANIMS.map((a: any) => a.value) });
    },

    clearSelection: () => set({ selectedAnims: [] }),

    generateAnimations: (type) => {
      const state = get();
      state.pushUndo();
      const typeToGen = type || state.selectedAnims[0] || 'idle';
      const withAnims = generateAnimationsClientSide(state.editedAsset, [typeToGen], state.castSettings);

      const newAnims = [...withAnims.animations];
      const generated = newAnims[newAnims.length - 1];

      const { name, label } = getNextAnimationName(state.editedAsset.animations, generated.name);
      generated.name = name;
      generated.label = label;

      const updatedAsset = {
        ...withAnims,
        animations: [...state.editedAsset.animations, generated],
      };

      set({
        editedAsset: updatedAsset,
        viewingAnimation: generated.name,
        editingFrameIndex: generated.frameIndices[0],
      });

      state._previewPanelRef.current?.setIsPlaying(true);
    },

    renameAnimation: (name, newLabel) => set(state => ({
      editedAsset: {
        ...state.editedAsset,
        animations: state.editedAsset.animations.map(a =>
          a.name === name ? { ...a, label: newLabel } : a
        ),
      },
    })),

    removeAnimation: (name) => {
      get().pushUndo();
      set(state => ({
        editedAsset: {
          ...state.editedAsset,
          animations: state.editedAsset.animations.filter(a => a.name !== name),
        },
        viewingAnimation: state.viewingAnimation === name ? 'base' : state.viewingAnimation,
      }));
    },

    // --- Transform Actions ---
    handleCopy: () => {
      const state = get();
      const bridge = state._pixelEditorBridge;
      const selectionRect = bridge?.selectionRect || null;

      if (state.scope === 'layer') {
        const frame = state.editedAsset.layers.find(l => l.id === state.activeLayerId)?.frames[state.editingFrameIndex];
        if (frame) {
          if (selectionRect) {
            const clip: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
            for (let ir = 0; ir < selectionRect.h; ir++) {
              for (let ic = 0; ic < selectionRect.w; ic++) {
                const r = selectionRect.r + ir;
                const c = selectionRect.c + ic;
                if (r >= 0 && r < state.editedAsset.size && c >= 0 && c < state.editedAsset.size) {
                  clip[ir][ic] = frame[r][c];
                }
              }
            }
            set({ layerClipboard: clip });
          } else {
            set({ layerClipboard: frame.map(r => [...r]) });
          }
        }
      } else {
        const clipboard: Record<string, number[][]> = {};
        state.editedAsset.layers.forEach(l => {
          const f = l.frames[state.editingFrameIndex];
          if (selectionRect) {
            const clip: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
            for (let ir = 0; ir < selectionRect.h; ir++) {
              for (let ic = 0; ic < selectionRect.w; ic++) {
                const r = selectionRect.r + ir;
                const c = selectionRect.c + ic;
                if (r >= 0 && r < state.editedAsset.size && c >= 0 && c < state.editedAsset.size) {
                  clip[ir][ic] = f[r][c];
                }
              }
            }
            clipboard[l.id] = clip;
          } else {
            clipboard[l.id] = f.map(r => [...r]);
          }
        });
        set({ frameClipboard: clipboard });
      }
    },

    handlePaste: () => {
      const state = get();
      const bridge = state._pixelEditorBridge;
      const selectionRect = bridge?.selectionRect || null;
      const size = state.editedAsset.size;
      const destR = selectionRect?.r || 0;
      const destC = selectionRect?.c || 0;

      if (state.scope === 'layer') {
        if (state.layerClipboard) {
          const baseFrame = state.editedAsset.layers.find(l => l.id === state.activeLayerId)?.frames[state.editingFrameIndex];
          if (baseFrame && bridge) {
            const newFrame = baseFrame.map(row => [...row]);
            const clipH = state.layerClipboard.length;
            const clipW = state.layerClipboard[0].length;
            for (let r = 0; r < clipH; r++) {
              for (let c = 0; c < clipW; c++) {
                const tr = destR + r;
                const tc = destC + c;
                if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
                  const val = state.layerClipboard[r][c];
                  if (val !== 0) newFrame[tr][tc] = val;
                }
              }
            }
            bridge.overwriteLayerFrame(newFrame);
          }
        }
      } else {
        if (state.frameClipboard) {
          set(s => ({
            editedAsset: {
              ...s.editedAsset,
              layers: s.editedAsset.layers.map(l => {
                const clip = s.frameClipboard![l.id];
                if (clip) {
                  const newFrames = [...l.frames];
                  const baseF = l.frames[s.editingFrameIndex];
                  const newF = baseF.map(row => [...row]);
                  const clipH = clip.length;
                  const clipW = clip[0].length;
                  for (let r = 0; r < clipH; r++) {
                    for (let c = 0; c < clipW; c++) {
                      const tr = destR + r;
                      const tc = destC + c;
                      if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
                        const val = clip[r][c];
                        if (val !== 0) newF[tr][tc] = val;
                      }
                    }
                  }
                  newFrames[s.editingFrameIndex] = newF;
                  return { ...l, frames: newFrames };
                }
                return l;
              }),
            },
          }));
        }
      }
    },

    handleFlipH: () => {
      const state = get();
      const bridge = state._pixelEditorBridge;
      const selectionRect = bridge?.selectionRect || null;

      if (state.scope === 'layer') {
        const frame = state.editedAsset.layers.find(l => l.id === state.activeLayerId)?.frames[state.editingFrameIndex];
        if (!frame || !bridge) return;

        if (selectionRect) {
          const newFrame = frame.map(row => [...row]);
          const snippet: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
          for (let r = 0; r < selectionRect.h; r++) {
            for (let c = 0; c < selectionRect.w; c++) {
              snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
            }
          }
          const flipped = snippet.map(row => [...row].reverse());
          for (let r = 0; r < selectionRect.h; r++) {
            for (let c = 0; c < selectionRect.w; c++) {
              newFrame[selectionRect.r + r][selectionRect.c + c] = flipped[r][c];
            }
          }
          bridge.overwriteLayerFrame(newFrame);
        } else {
          bridge.overwriteLayerFrame(flipHorizontal(frame));
        }
      } else {
        set(s => ({
          editedAsset: {
            ...s.editedAsset,
            layers: s.editedAsset.layers.map(l => {
              const frame = l.frames[s.editingFrameIndex];
              const newFrames = [...l.frames];
              if (selectionRect) {
                const newF = frame.map(row => [...row]);
                const snippet = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
                for (let r = 0; r < selectionRect.h; r++) {
                  for (let c = 0; c < selectionRect.w; c++) snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
                }
                const flipped = snippet.map(row => [...row].reverse());
                for (let r = 0; r < selectionRect.h; r++) {
                  for (let c = 0; c < selectionRect.w; c++) newF[selectionRect.r + r][selectionRect.c + c] = flipped[r][c];
                }
                newFrames[s.editingFrameIndex] = newF;
              } else {
                newFrames[s.editingFrameIndex] = flipHorizontal(frame);
              }
              return { ...l, frames: newFrames };
            }),
          },
        }));
      }
    },

    handleFlipV: () => {
      const state = get();
      const bridge = state._pixelEditorBridge;
      const selectionRect = bridge?.selectionRect || null;

      if (state.scope === 'layer') {
        const frame = state.editedAsset.layers.find(l => l.id === state.activeLayerId)?.frames[state.editingFrameIndex];
        if (!frame || !bridge) return;

        if (selectionRect) {
          const newFrame = frame.map(row => [...row]);
          const snippet: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
          for (let r = 0; r < selectionRect.h; r++) {
            for (let c = 0; c < selectionRect.w; c++) {
              snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
            }
          }
          const flipped = [...snippet].reverse();
          for (let r = 0; r < selectionRect.h; r++) {
            for (let c = 0; c < selectionRect.w; c++) {
              newFrame[selectionRect.r + r][selectionRect.c + c] = flipped[r][c];
            }
          }
          bridge.overwriteLayerFrame(newFrame);
        } else {
          bridge.overwriteLayerFrame(flipVertical(frame));
        }
      } else {
        set(s => ({
          editedAsset: {
            ...s.editedAsset,
            layers: s.editedAsset.layers.map(l => {
              const frame = l.frames[s.editingFrameIndex];
              const newFrames = [...l.frames];
              if (selectionRect) {
                const newF = frame.map(row => [...row]);
                const snippet = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
                for (let r = 0; r < selectionRect.h; r++) {
                  for (let c = 0; c < selectionRect.w; c++) snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
                }
                const flipped = [...snippet].reverse();
                for (let r = 0; r < selectionRect.h; r++) {
                  for (let c = 0; c < selectionRect.w; c++) newF[selectionRect.r + r][selectionRect.c + c] = flipped[r][c];
                }
                newFrames[s.editingFrameIndex] = newF;
              } else {
                newFrames[s.editingFrameIndex] = flipVertical(frame);
              }
              return { ...l, frames: newFrames };
            }),
          },
        }));
      }
    },

    handleRotate: () => {
      const state = get();
      const bridge = state._pixelEditorBridge;
      const selectionRect = bridge?.selectionRect || null;

      if (state.scope === 'layer') {
        const frame = state.editedAsset.layers.find(l => l.id === state.activeLayerId)?.frames[state.editingFrameIndex];
        if (!frame || !bridge) return;

        if (selectionRect) {
          const snippet: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
          for (let r = 0; r < selectionRect.h; r++) {
            for (let c = 0; c < selectionRect.w; c++) {
              snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
            }
          }
          const rotated = rotate90(snippet);
          const newFrame = frame.map(row => [...row]);
          for (let r = 0; r < selectionRect.h; r++) {
            for (let c = 0; c < selectionRect.w; c++) {
              newFrame[selectionRect.r + r][selectionRect.c + c] = 0;
            }
          }
          const newH = rotated.length;
          const newW = rotated[0].length;
          for (let r = 0; r < newH; r++) {
            for (let c = 0; c < newW; c++) {
              const tr = selectionRect.r + r;
              const tc = selectionRect.c + c;
              if (tr >= 0 && tr < state.editedAsset.size && tc >= 0 && tc < state.editedAsset.size) {
                newFrame[tr][tc] = rotated[r][c];
              }
            }
          }
          bridge.overwriteLayerFrame(newFrame);
        } else {
          bridge.overwriteLayerFrame(rotate90(frame));
        }
      } else {
        set(s => ({
          editedAsset: {
            ...s.editedAsset,
            layers: s.editedAsset.layers.map(l => {
              const frame = l.frames[s.editingFrameIndex];
              const newFrames = [...l.frames];
              if (selectionRect) {
                const newF = frame.map(row => [...row]);
                const snippet = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
                for (let r = 0; r < selectionRect.h; r++) {
                  for (let c = 0; c < selectionRect.w; c++) snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
                }
                const rotated = rotate90(snippet);
                for (let r = 0; r < selectionRect.h; r++) {
                  for (let c = 0; c < selectionRect.w; c++) newF[selectionRect.r + r][selectionRect.c + c] = 0;
                }
                const newH = rotated.length;
                const newW = rotated[0].length;
                for (let r = 0; r < newH; r++) {
                  for (let c = 0; c < newW; c++) {
                    const tr = selectionRect.r + r;
                    const tc = selectionRect.c + c;
                    if (tr >= 0 && tr < s.editedAsset.size && tc >= 0 && tc < s.editedAsset.size) newF[tr][tc] = rotated[r][c];
                  }
                }
                newFrames[s.editingFrameIndex] = newF;
              } else {
                newFrames[s.editingFrameIndex] = rotate90(frame);
              }
              return { ...l, frames: newFrames };
            }),
          },
        }));
      }
    },

    handleDragEnd: (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const activeId = parseInt(active.id as string);
      const overId = parseInt(over.id as string);
      if (isNaN(activeId) || isNaN(overId)) return;

      const state = get();
      if (state.viewingAnimation === 'base') return;

      state.pushUndo();
      set(s => {
        const animIndex = s.editedAsset.animations.findIndex(a => a.name === s.viewingAnimation);
        if (animIndex === -1) return s;
        const anim = s.editedAsset.animations[animIndex];
        const oldTimelineIndex = anim.frameIndices.indexOf(activeId);
        const newTimelineIndex = anim.frameIndices.indexOf(overId);

        if (oldTimelineIndex !== -1 && newTimelineIndex !== -1) {
          const newFrameIndices = arrayMove(anim.frameIndices, oldTimelineIndex, newTimelineIndex);
          const newAnimations = [...s.editedAsset.animations];
          newAnimations[animIndex] = { ...anim, frameIndices: newFrameIndices };
          return { editedAsset: { ...s.editedAsset, animations: newAnimations } };
        }
        return s;
      });
    },

    // --- Export Actions ---
    handleExportPNG: (options) => {
      const state = get();
      exportAsPNG(state.editedAsset, options);
    },

    handleExportGIF: async () => {
      const state = get();
      const anim = state.editedAsset.animations.find(a => a.name === state.viewingAnimation);
      const fps = anim?.fps || 10;
      await exportAsGIF(state.editedAsset, state.viewingAnimation, fps);
    },

    // --- Meta Actions ---
    handleSave: () => {
      const state = get();
      state._onSave({ ...state.editedAsset, name: state.assetName });
      state._onOpenChange(false);
    },

    handleClose: () => {
      const state = get();
      state._onOpenChange(false);
    },

    initFromAsset: (asset) => {
      const migrated = ensureLayerSupport(asset);
      set({
        editedAsset: migrated,
        assetName: asset.name,
        editingFrameIndex: 0,
        viewingAnimation: 'base',
        activeLayerId: migrated.layers[0]?.id || null,
      });
    },
  }));
}

export type SpriteEditorStore = ReturnType<typeof createSpriteEditorStore>;
