import { SpriteEditorState, StoreSlice } from '../types';
import { addNewLayer, removeLayer, reorderLayers, renameLayer, toggleLayerVisibility, toggleLayerLock, upscale2x, mergeLayerDown } from '@/lib/layerUtils';
import { PROP_LIBRARY } from '@/lib/assets/props';

export const createLayerSlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  addLayer: () => {
    get().pushUndo();
    set(state => {
      const updated = addNewLayer(state.editedAsset, `Layer ${state.editedAsset.layers!.length + 1}`);
      return {
        editedAsset: updated,
        activeLayerId: updated.layers![updated.layers!.length - 1].id,
      };
    });
  },

  removeLayer: (layerId) => {
    if (get().editedAsset.layers!.length <= 1) return;
    get().pushUndo();
    set(state => {
      const updated = removeLayer(state.editedAsset, layerId);
      return {
        editedAsset: updated,
        activeLayerId: state.activeLayerId === layerId 
          ? updated.layers![updated.layers!.length - 1].id 
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

  mergeLayerDown: (layerId) => {
    const state = get();
    const index = state.editedAsset.layers!.findIndex(l => l.id === layerId);
    if (index <= 0) return;

    state.pushUndo();
    set(state => {
      const updated = mergeLayerDown(state.editedAsset, layerId);
      const resultLayer = updated.layers![index - 1];
      return {
        editedAsset: updated,
        activeLayerId: resultLayer?.id || state.activeLayerId,
      };
    });
  },

  moveLayer: (fromIdx, direction) => {
    const state = get();
    const toIdx = direction === 'up' ? fromIdx + 1 : fromIdx - 1;
    if (toIdx < 0 || toIdx >= state.editedAsset.layers!.length) return;
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
    const frameCount = state.editedAsset.layers![0]?.frames.length || 1;
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
          ...state.editedAsset.layers!,
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
});
