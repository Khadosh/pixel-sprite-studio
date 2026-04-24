import { SpriteEditorState, StoreSlice } from '../types';
import { AnatomyConfig, MemberConfig } from '@/lib/types';

export const createAnatomySlice: StoreSlice<Partial<SpriteEditorState>> = (set, get) => ({
  anatomyActiveMemberId: null,
  anatomySelectedOrientation: 0,
  anatomyIsSelectionMode: false,

  setAnatomyActiveMemberId: (id) => set({ anatomyActiveMemberId: id }),
  setAnatomyIsSelectionMode: (on) => set({ anatomyIsSelectionMode: on }),

  toggleMemberPixel: (r, c, force) => set(state => {
    const { anatomyActiveMemberId, anatomySelectedOrientation, editedAsset } = state;
    if (!anatomyActiveMemberId) return state;

    const anatomy = editedAsset.anatomy || {};
    const orientations = anatomy.orientations || {};
    const orientation = orientations[anatomySelectedOrientation] || { members: [] };
    
    const memberIdx = orientation.members.findIndex(m => m.id === anatomyActiveMemberId);
    if (memberIdx === -1) return state;

    const member = orientation.members[memberIdx];
    const pixels = [...(member.pixels || [])];
    const pixelIdx = pixels.findIndex(p => p.r === r && p.c === c);

    const shouldAdd = force !== undefined ? force : pixelIdx === -1;

    if (shouldAdd && pixelIdx === -1) {
      pixels.push({ r, c });
    } else if (!shouldAdd && pixelIdx >= 0) {
      pixels.splice(pixelIdx, 1);
    } else if (force === undefined) {
      // Toggle case handled by the initial shouldAdd calculation
    } else {
      // Force match existing state, no change
      return state;
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
