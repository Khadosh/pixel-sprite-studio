import { SpriteEditorState, StoreSlice } from '../types';
import { getColorName } from '@/lib/colorUtils';

export const createPaletteSlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  changeColor: (key, color) => set(state => ({
    editedAsset: { ...state.editedAsset, palette: { ...state.editedAsset.palette, [key]: color } },
  })),

  addColor: () => {
    get().pushUndo();
    set(state => {
      const keys = Object.keys(state.editedAsset.palette).map(Number).filter(k => k > 0);
      const newKey = keys.length > 0 ? Math.max(...keys) + 1 : 1;
      const updatedPalette = { ...state.editedAsset.palette, [newKey]: '#888888' };
      const updatedColorNames = { ...state.editedAsset.colorNames, [newKey]: getColorName('#888888') };

      const newLayers = state.editedAsset.layers!.map(layer => {
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
        layers: state.editedAsset.layers!.map(layer => ({
          ...layer,
          paletteIds: layer.paletteIds?.filter(id => id !== key),
          frames: layer.frames.map(f =>
            f.map(r => r.map(c => c === key ? 0 : c))
          ),
        })),
      },
    });

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

  applyPalettePreset: (colors) => {
    const state = get();
    state.pushUndo();
    
    const newPalette: Record<number, string> = { 0: 'transparent' };
    const newColorNames: Record<number, string> = { 0: 'Transparent' };
    
    colors.forEach((color, i) => {
      const key = i + 1;
      newPalette[key] = color;
      newColorNames[key] = getColorName(color);
    });

    set({
      editedAsset: {
        ...state.editedAsset,
        palette: newPalette,
        colorNames: newColorNames,
        layers: state.editedAsset.layers!.map(layer => ({
          ...layer,
          paletteIds: Object.keys(newPalette).map(Number).filter(k => k > 0)
        }))
      }
    });
  },

  addColorRamp: (colors) => {
    const state = get();
    state.pushUndo();
    
    const currentKeys = Object.keys(state.editedAsset.palette).map(Number).filter(k => k > 0);
    let nextKey = currentKeys.length > 0 ? Math.max(...currentKeys) + 1 : 1;
    
    const updatedPalette = { ...state.editedAsset.palette };
    const updatedColorNames = { ...state.editedAsset.colorNames };
    const addedKeys: number[] = [];

    colors.forEach(color => {
      updatedPalette[nextKey] = color;
      updatedColorNames[nextKey] = getColorName(color);
      addedKeys.push(nextKey);
      nextKey++;
    });

    set({
      editedAsset: {
        ...state.editedAsset,
        palette: updatedPalette,
        colorNames: updatedColorNames,
        layers: state.editedAsset.layers!.map(layer => {
          if (layer.id === state.activeLayerId) {
             return { ...layer, paletteIds: [...(layer.paletteIds || []), ...addedKeys] };
          }
          return layer;
        })
      }
    });
  },
});
