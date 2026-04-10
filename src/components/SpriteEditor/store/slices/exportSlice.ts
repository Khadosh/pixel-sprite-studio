import { SpriteEditorState, StoreSlice } from '../types';
import { exportAsPNG, exportAsGIF } from '../../utils/exportUtils';

export const createExportSlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  handleExportPNG: (options) => {
    const state = get();
    exportAsPNG(state.editedAsset, options);
  },

  handleExportGIF: async () => {
    const state = get();
    const anim = (state.editedAsset.animations || []).find(a => a.name === state.viewingAnimation);
    const fps = anim?.fps || 10;
    await exportAsGIF(state.editedAsset, state.viewingAnimation, fps);
  },
});
