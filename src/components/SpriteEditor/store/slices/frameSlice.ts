import { SpriteEditorState, StoreSlice } from '../types';
import { duplicateFrameInAllLayers, removeFrameFromAllLayers, addEmptyFrameToAllLayers } from '@/lib/spriteAnimations';
import { flipHorizontal } from '@/lib/spriteTransforms';

export const createFrameSlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
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

  handleMirrorSide: () => {
    const state = get();
    state.pushUndo();
    
    set(s => ({
      editedAsset: {
        ...s.editedAsset,
        layers: s.editedAsset.layers?.map(layer => {
          const newFrames = [...layer.frames];
          const sideFrame = layer.frames[1]; // Side (Right)
          if (sideFrame) {
            // Mirror it for index 3 (Side-Left)
            newFrames[3] = flipHorizontal(sideFrame);
          }
          return { ...layer, frames: newFrames };
        })
      },
      // Switch to the mirrored view correctly
      editingFrameIndex: 3,
      activePerspective: 'side',
      activeSide: 'left'
    }));
  },
});
