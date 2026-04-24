import { SpriteEditorState, StoreSlice } from '../types';
import { AnatomyConfig, MemberConfig } from '@/lib/types';

export const createAnatomySlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  anatomyActiveMemberId: null,
  anatomySelectedOrientation: 0,
  anatomyIsSelectionMode: false,

  setAnatomyActiveMemberId: (id) => set({ anatomyActiveMemberId: id }),
  setAnatomySelectedOrientation: (idx) => set({ anatomySelectedOrientation: idx, editingFrameIndex: idx }),
  setAnatomyIsSelectionMode: (on) => set({ anatomyIsSelectionMode: on }),

  toggleMemberPixel: (r, c) => set(state => {
    const { anatomyActiveMemberId, anatomySelectedOrientation, editedAsset } = state;
    if (!anatomyActiveMemberId) return state;

    const anatomy = editedAsset.anatomy || {};
    const orientations = anatomy.orientations || {};
    const orientation = orientations[anatomySelectedOrientation] || { members: [] };
    
    const memberIdx = orientation.members.findIndex(m => m.id === anatomyActiveMemberId);
    if (memberIdx === -1) {
      // Create member if missing from this orientation
      // We might want a default set of members
      return state;
    }

    const member = orientation.members[memberIdx];
    const pixels = [...(member.pixels || [])];
    const pixelIdx = pixels.findIndex(p => p.r === r && p.c === c);

    if (pixelIdx >= 0) {
      pixels.splice(pixelIdx, 1);
    } else {
      pixels.push({ r, c });
    }

    const updatedMembers = [...orientation.members];
    updatedMembers[memberIdx] = { ...member, pixels };

    const updatedOrientations = {
      ...orientations,
      [anatomySelectedOrientation]: { ...orientation, members: updatedMembers }
    };

    return {
      editedAsset: {
        ...editedAsset,
        anatomy: { ...anatomy, orientations: updatedOrientations }
      },
      isDirty: true
    };
  }),
});
