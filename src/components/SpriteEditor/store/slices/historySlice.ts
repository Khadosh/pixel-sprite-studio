import { SpriteEditorState, StoreSlice } from '../types';

export const createHistorySlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  pushUndo: () => set(state => {
    const snapshot = JSON.parse(JSON.stringify(state.editedAsset));
    const newPast = [snapshot, ...state.past].slice(0, 50);
    return { 
      past: newPast, 
      future: [],
      canUndo: true,
      canRedo: false,
      isDirty: true
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
});
