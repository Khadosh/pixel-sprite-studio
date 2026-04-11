import { SpriteEditorState, StoreSlice } from '../types';
import { addNewLayer, removeLayer, reorderLayers, renameLayer, toggleLayerVisibility, toggleLayerLock, upscale2x, mergeLayerDown, fitFrame } from '@/lib/layerUtils';
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
    
    if (!propData && prop.data16) {
      propData = fitFrame(prop.data16, size);
    }
    
    if (!propData) return;

    state.pushUndo();

    // -- SMART PALETTE REMAPPING --
    const currentPalette = { ...state.editedAsset.palette };
    const currentColorNames = { ...state.editedAsset.colorNames };
    
    // Reverse palette for hex lookup: hex -> index
    const hexToIndexIndex: Record<string, number> = {};
    Object.entries(currentPalette).forEach(([idx, hex]) => {
      hexToIndexIndex[hex.toLowerCase()] = Number(idx);
    });

    const indexMapping: Record<number, number> = { 0: 0 }; // 0 is always transparency

    // Find next available index
    let nextIdx = Math.max(0, ...Object.keys(currentPalette).map(Number)) + 1;

    // Build the mapping
    Object.entries(prop.palette).forEach(([propIdxStr, hex]) => {
      const propIdx = Number(propIdxStr);
      const lowerHex = hex.toLowerCase();
      
      if (hexToIndexIndex[lowerHex] !== undefined) {
        // Color already exists in palette, reuse index
        indexMapping[propIdx] = hexToIndexIndex[lowerHex];
      } else {
        // New color! Add to global palette
        currentPalette[nextIdx] = hex;
        currentColorNames[nextIdx] = `${prop.name} - ${prop.colorNames?.[propIdx] || `Color ${propIdx}`}`;
        indexMapping[propIdx] = nextIdx;
        hexToIndexIndex[lowerHex] = nextIdx;
        nextIdx++;
      }
    });

    // Remap frame data
    const newLayerId = crypto.randomUUID();
    const frameCount = state.editedAsset.layers![0]?.frames.length || 1;
    const newFrames = Array.from({ length: frameCount }, () =>
      propData!.map(row => 
        row.map(pixel => indexMapping[pixel] ?? 0)
      )
    );

    const usedIndices = new Set<number>();
    newFrames[0].forEach(row => row.forEach(p => { if (p > 0) usedIndices.add(p); }));

    set({
      editedAsset: {
        ...state.editedAsset,
        palette: currentPalette,
        colorNames: currentColorNames,
        layers: [
          ...state.editedAsset.layers!,
          {
            id: newLayerId,
            name: prop.name,
            frames: newFrames,
            isVisible: true,
            isLocked: false,
            opacity: 1,
            paletteIds: Array.from(usedIndices),
          },
        ],
      },
      activeLayerId: newLayerId,
    });
  },
});
