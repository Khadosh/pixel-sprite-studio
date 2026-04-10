import { SpriteEditorState, StoreSlice } from '../types';

export const createBaseSlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  // Setters
  setEditedAsset: (assetOrFn) => set(state => ({
    editedAsset: typeof assetOrFn === 'function' ? assetOrFn(state.editedAsset) : assetOrFn,
  })),
  setActiveLayerId: (id) => set({ activeLayerId: id }),
  setEditingFrameIndex: (idx) => set({ editingFrameIndex: idx }),
  setViewingAnimation: (name) => set({ viewingAnimation: name }),
  setAssetName: (name) => set({ assetName: name, isDirty: true }),
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
  setLeftSidebarTab: (tab) => set((s) => ({ 
    leftSidebarTab: s.leftSidebarTab === tab ? null : tab 
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
      viewingAnimation: 'base',
      isDirty: false,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },
});
