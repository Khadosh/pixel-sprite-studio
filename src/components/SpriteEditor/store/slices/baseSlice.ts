import { SpriteAsset, Frame } from '@/lib/types';
import { normalizeTags, normalizeTag } from '@/lib/tagUtils';
import { SpriteEditorState, StoreSlice } from '../types';

export const createBaseSlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  // Setters
  setEditedAsset: (assetOrFn) => set(state => ({
    editedAsset: typeof assetOrFn === 'function' ? assetOrFn(state.editedAsset) : assetOrFn,
  })),
  setActiveLayerId: (id) => set({ activeLayerId: id }),
  setEditingFrameIndex: (idx) => set({ editingFrameIndex: idx }),
  setViewingAnimation: (name) => set({ viewingAnimation: name }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setAssetName: (name) => set({ assetName: name, isDirty: true }),
  setIsEditingName: (editing) => set({ isEditingName: editing }),
  setOnionSkin: (onOrFn) => set(s => ({ 
    onionSkin: typeof onOrFn === 'function' ? (onOrFn as Function)(s.onionSkin) : onOrFn 
  })),
  setShowAllColors: (onOrFn) => set(s => ({ 
    showAllColors: typeof onOrFn === 'function' ? (onOrFn as Function)(s.showAllColors) : onOrFn 
  })),
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
  setLeftSidebarTab: (tab) => set((s) => ({ 
    leftSidebarTab: s.leftSidebarTab === tab ? null : tab 
  })),
  setCanvasBg: (bgOrFn) => set(s => ({ 
    canvasBg: typeof bgOrFn === 'function' ? (bgOrFn as Function)(s.canvasBg) : bgOrFn 
  })),
  setActivePerspective: (p) => set(s => {
    let idx = 0;
    if (p === 'side') idx = s.activeSide === 'right' ? 1 : 3;
    else if (p === 'back') idx = 2;
    
    const layers = s.editedAsset.layers || [];
    const currentMaxIdx = (layers[0]?.frames.length || 0) - 1;
    
    if (idx > currentMaxIdx) {
      const size = s.editedAsset.size;
      const newLayers = layers.map(layer => {
        const newFrames = [...layer.frames];
        while (newFrames.length <= idx) {
          newFrames.push(Array.from({ length: size }, () => Array(size).fill(0)));
        }
        return { ...layer, frames: newFrames };
      });
      return { 
        activePerspective: p, 
        editingFrameIndex: idx,
        editedAsset: { ...s.editedAsset, layers: newLayers },
        isDirty: true
      };
    }
    
    return { activePerspective: p, editingFrameIndex: idx };
  }),
  setActiveSide: (side) => set(s => {
    const isSide = s.activePerspective === 'side';
    let targetIdx = s.editingFrameIndex;
    let newAsset = s.editedAsset;
    let dirty = s.isDirty;

    if (isSide) {
      targetIdx = side === 'right' ? 1 : 3;
      const layers = s.editedAsset.layers || [];
      const currentMaxIdx = (layers[0]?.frames.length || 0) - 1;
      
      if (targetIdx > currentMaxIdx) {
        const size = s.editedAsset.size;
        const newLayers = layers.map(layer => {
          const newFrames = [...layer.frames];
          while (newFrames.length <= targetIdx) {
            newFrames.push(Array.from({ length: size }, () => Array(size).fill(0)));
          }
          return { ...layer, frames: newFrames };
        });
        newAsset = { ...s.editedAsset, layers: newLayers };
        dirty = true;
      }
    }

    return { 
      activeSide: side, 
      editingFrameIndex: targetIdx,
      editedAsset: newAsset,
      isDirty: dirty
    };
  }),
  setShowIsometricGrid: (onOrFn) => set(s => ({ 
    showIsometricGrid: typeof onOrFn === 'function' ? (onOrFn as Function)(s.showIsometricGrid) : onOrFn 
  })),
  setSketchMode: (onOrFn) => set(s => ({ 
    sketchMode: typeof onOrFn === 'function' ? (onOrFn as Function)(s.sketchMode) : onOrFn 
  })),

  setCategory: (category) => set(state => ({
    editedAsset: { ...state.editedAsset, category },
    isDirty: true
  })),

  setDescription: (description) => set(state => ({
    editedAsset: { ...state.editedAsset, description },
    isDirty: true
  })),

  setTags: (tags) => set(state => ({
    editedAsset: { ...state.editedAsset, tags: normalizeTags(tags) },
    isDirty: true
  })),

  addTag: (tag) => set(state => {
    const newTag = normalizeTag(tag);
    if (!newTag) return state;
    const currentTags = state.editedAsset.tags || [];
    if (currentTags.includes(newTag)) return state;
    
    return {
      editedAsset: { ...state.editedAsset, tags: [...currentTags, newTag] },
      isDirty: true
    };
  }),

  removeTag: (tag) => set(state => ({
    editedAsset: {
      ...state.editedAsset,
      tags: (state.editedAsset.tags || []).filter(t => t !== tag)
    },
    isDirty: true
  })),

  // Meta actions
  handleSave: () => {
    const state = get();
    state._onSave({ ...state.editedAsset, name: state.assetName });
    state._onOpenChange(false);
    set({ isDirty: false });
  },

  handleClose: () => {
    const state = get();
    state._onOpenChange(false);
  },

  initFromAsset: (asset) => {
    // Note: ensureLayerSupport will be called in the composition factory
    set({
      assetName: asset.name,
      editingFrameIndex: 0,
      activePerspective: 'front',
      activeSide: 'right',
      showIsometricGrid: false,
      sketchMode: false,
      viewingAnimation: 'base',
      isDirty: false,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },

  createCheckpoint: (name?: string) => set(state => {
    const versions = state.editedAsset.versions || [];
    const newVersion = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      name: name || `Versión ${versions.length + 1}`,
      asset: JSON.parse(JSON.stringify(state.editedAsset))
    };
    
    const updatedVersions = [newVersion, ...versions].slice(0, 10);
    
    return {
      editedAsset: { ...state.editedAsset, versions: updatedVersions },
      isDirty: true
    };
  }),

  restoreCheckpoint: (versionId: string) => set(state => {
    const version = (state.editedAsset.versions || []).find((v: any) => v.id === versionId);
    if (!version) return state;
    
    return {
      editedAsset: { ...version.asset, versions: state.editedAsset.versions },
      isDirty: true,
      past: [],
      future: [],
    };
  }),

  clearHistory: () => set(state => ({
    editedAsset: { ...state.editedAsset, versions: [] },
    isDirty: true
  })),
});
