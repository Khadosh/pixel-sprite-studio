import { SpriteEditorState, StoreSlice } from '../types';
import { generateAnimationsClientSide } from '@/lib/spriteAnimations';
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

  renameAnimation: (name: string, newLabel: string) => set(state => ({
    editedAsset: {
      ...state.editedAsset,
      animations: state.editedAsset.animations.map(a =>
        a.name === name ? { ...a, label: newLabel } : a
      ),
    },
  })),

  removeAnimation: (name: string) => {
    get().pushUndo();
    set(state => ({
      editedAsset: {
        ...state.editedAsset,
        animations: state.editedAsset.animations.filter(a => a.name !== name),
      },
      viewingAnimation: state.viewingAnimation === name ? 'base' : state.viewingAnimation,
    }));
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
