import { SpriteEditorState, StoreSlice } from '../types';
import { generateAnimationsClientSide } from '@/lib/spriteAnimations';
import { duplicateFrameInAllLayers } from '@/lib/spriteAnimations';
import { cleanupOrphanedFrames } from '@/lib/layerUtils';
import { getNextAnimationName } from '../helpers';
import { AVAILABLE_ANIMS } from '../../types';
import { arrayMove } from '@dnd-kit/sortable';

export const createAnimationSlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  toggleAnim: (anim) => set(state => ({
    selectedAnims: state.selectedAnims.includes(anim)
      ? state.selectedAnims.filter(a => a !== anim)
      : [...state.selectedAnims, anim],
  })),

  selectAllAnims: () => {
    set({ selectedAnims: AVAILABLE_ANIMS.map((a: any) => a.value) });
  },

  clearSelection: () => set({ selectedAnims: [] }),

  generateAnimations: (type?: string) => {
    const state = get();
    state.pushUndo();
    const typeToGen = type || state.selectedAnims[0] || 'idle';
    
    // 1. Calculate the final unique name BEFORE generating frames
    const { name: uniqueName, label: uniqueLabel } = getNextAnimationName(state.editedAsset.animations, typeToGen);
    
    // 2. Generate with the base type but unique name metadata
    const baseIndex = state.editingFrameIndex;
    const withAnims = generateAnimationsClientSide(
      state.editedAsset, 
      [typeToGen], 
      state.castSettings,
      { customName: uniqueName, customLabel: uniqueLabel, baseIndex }
    );
    
    // 3. Since generateAnimationsClientSide already merges and adds to layers, 
    // we use the result directly
    const generatedAnim = withAnims.animations.find(a => a.name === uniqueName);
    if (!generatedAnim) return;
    
    set({
      editedAsset: withAnims,
      viewingAnimation: generatedAnim.name,
      editingFrameIndex: generatedAnim.frameIndices[0],
      isDirty: true
    });

    state._previewPanelRef.current?.setIsPlaying(true);
  },
  
  generateCustomAnimation: (name: string) => {
    const state = get();
    state.pushUndo();
    
    // Create a safe internal name and label
    const safeName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const { name: uniqueName, label: uniqueLabel } = getNextAnimationName(state.editedAsset.animations, safeName);
    
    // Duplicate the current frame to start the animation
    const baseIndex = state.editingFrameIndex;
    const duplicatedAsset = duplicateFrameInAllLayers(state.editedAsset, baseIndex);
    const newFrameIndex = baseIndex + 1;
    
    // Add the new animation definition
    const newAnimDef = {
      name: uniqueName,
      label: name.toUpperCase(), // use the original name as label
      frameIndices: [newFrameIndex],
      fps: 5,
    };
    
    set({
      editedAsset: {
        ...duplicatedAsset,
        animations: [...duplicatedAsset.animations, newAnimDef]
      },
      viewingAnimation: uniqueName,
      editingFrameIndex: newFrameIndex,
      isDirty: true
    });
  },

  generatePerspectiveAI: async () => {
    const state = get();
    const fn = state._pixelEditorBridge?._handleGeneratePerspectiveAI;
    if (fn) await fn();
  },

  renameAnimation: (name: string, newLabel: string) => set(state => ({
    editedAsset: {
      ...state.editedAsset,
      animations: state.editedAsset.animations.map(a =>
        a.name === name ? { ...a, label: newLabel } : a
      ),
    },
  })),

  removeAnimation: (name: string) => {
    const state = get();
    state.pushUndo();
    
    const filteredAsset = {
      ...state.editedAsset,
      animations: state.editedAsset.animations.filter(a => a.name !== name),
    };

    // Garbage Collection: Remove orphaned frames from layers
    const cleanedAsset = cleanupOrphanedFrames(filteredAsset);

    set({
      editedAsset: cleanedAsset,
      viewingAnimation: state.viewingAnimation === name ? 'base' : state.viewingAnimation,
      isDirty: true
    });
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
      const animIndex = (s.editedAsset.animations || []).findIndex(a => a.name === s.viewingAnimation);
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
});
