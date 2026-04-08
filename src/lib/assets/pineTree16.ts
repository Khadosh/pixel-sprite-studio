import type { Frame, SpriteAsset } from '@/lib/types';

// Palette mapping: 0=transparent, 1=outline, 2=dark-bark, 3=bark, 4=dark-needle, 5=needle, 6=light-needle
const E = 0, O = 1, D = 2, B = 3, N = 4, G = 5, L = 6;

const full: Frame = [
  [E,E,E,E,E,E,E,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,G,L,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,O,N,G,L,G,G,O,E,E,E,E,E],
  [E,E,E,O,G,G,G,G,G,G,G,O,E,E,E,E],
  [E,E,O,N,G,G,G,L,G,G,G,G,O,E,E,E],
  [E,O,G,G,G,G,G,G,G,G,G,G,G,O,E,E],
  [O,N,G,G,L,G,G,G,N,G,G,G,G,O,E,E],
  [O,G,G,G,G,G,G,G,G,G,G,G,G,O,E,E],
  [E,O,O,N,G,G,O,O,O,N,G,G,O,O,E,E],
  [E,E,E,O,G,O,E,E,E,O,G,O,E,E,E,E],
  [E,E,E,E,O,E,E,E,E,E,O,E,E,E,E,E],
  [E,E,E,E,O,B,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,O,D,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,O,B,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,E,E,E,E,E,E,E,E],
];

const sway1: Frame = [
  [E,E,E,E,E,E,E,E,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,O,G,L,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,G,G,G,G,O,E,E,E,E],
  [E,E,E,E,E,O,N,G,L,G,G,O,E,E,E,E],
  [E,E,E,E,O,G,G,G,G,G,G,G,O,E,E,E],
  [E,E,E,O,N,G,G,G,L,G,G,G,G,O,E,E],
  [E,E,O,G,G,G,G,G,G,G,G,G,G,G,O,E],
  [E,O,N,G,G,L,G,G,G,N,G,G,G,G,O,E],
  [E,O,G,G,G,G,G,G,G,G,G,G,G,G,O,E],
  [E,E,O,O,N,G,G,O,O,O,N,G,G,O,O,E],
  [E,E,E,E,O,G,O,E,E,E,O,G,O,E,E,E],
  [E,E,E,E,E,O,E,E,E,E,E,O,E,E,E,E],
  [E,E,E,E,O,B,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,O,D,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,O,B,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,E,E,E,E,E,E,E,E],
];

const sway2: Frame = [
  [E,E,E,E,E,E,O,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,G,L,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,G,G,G,G,O,E,E,E,E,E,E],
  [E,E,E,O,N,G,L,G,G,O,E,E,E,E,E,E],
  [E,E,O,G,G,G,G,G,G,G,O,E,E,E,E,E],
  [E,O,N,G,G,G,L,G,G,G,G,O,E,E,E,E],
  [O,G,G,G,G,G,G,G,G,G,G,G,O,E,E,E],
  [O,N,G,G,L,G,G,G,N,G,G,G,G,O,E,E],
  [O,G,G,G,G,G,G,G,G,G,G,G,G,O,E,E],
  [E,O,O,N,G,G,O,O,O,N,G,G,O,O,E,E],
  [E,E,E,O,G,O,E,E,E,O,G,O,E,E,E,E],
  [E,E,E,E,O,E,E,E,E,E,O,E,E,E,E,E],
  [E,E,E,E,O,B,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,O,D,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,O,B,B,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,E,E,E,E,E,E,E,E],
];

export const pineTree16: SpriteAsset = {
  id: 'pineTree16',
  name: 'Pine Tree (16px)',
  description: 'Original 16x16 evergreen pine tree with wind sway animation.',
  category: 'nature',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#1a1c2c', // Outline
    2: '#3e2731', // Dark bark
    3: '#733e39', // Bark
    4: '#225af6', // Dark needle (blue-ish for contrast)
    5: '#3eb82a', // Needle green
    6: '#7ed44d', // Light needle
  },
  colorNames: {
    1: 'Outline',
    2: 'Dark Bark',
    3: 'Bark',
    4: 'Dark Needle',
    5: 'Needle Green',
    6: 'Light Needle',
  },
  layers: [{
    id: 'base-layer',
    name: 'Base',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: [full, sway1, full, sway2]
  }],
  animations: [
    { name: 'idle', label: 'SWAY', frameIndices: [0, 1, 0, 3], fps: 3 },
  ],
  tags: ['environment', 'nature', 'tree', 'forest', '16px'],
};
