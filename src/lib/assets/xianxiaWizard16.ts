import type { Frame, SpriteAsset } from '@/lib/types';

// Palette mapping: 0=trans, 1=outline, 2=dark-robe, 3=mid, 4=light, 5=skin, 6=staff, 7=glow
const E = 0, O = 1, D = 2, M = 3, L = 4, S = 5, W = 6, G = 7;

const idle0: Frame = [
  [E,E,E,E,E,E,E,E,O,G,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,G,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,O,E,E,E,W,O,E],
  [E,E,E,O,L,D,D,D,D,L,O,E,E,W,O,E],
  [E,E,O,L,L,D,D,D,D,L,L,O,O,W,E,E],
  [E,E,O,L,L,M,M,M,M,L,L,O,E,W,E,E],
  [E,E,O,M,M,M,M,M,M,M,M,O,W,O,E,E],
  [E,E,O,D,D,D,D,D,D,D,D,O,W,O,E,E],
  [E,E,O,D,L,L,L,L,L,L,D,O,O,O,E,E],
  [E,E,E,O,M,M,M,M,M,M,O,E,E,E,E,E],
  [E,E,E,O,M,M,M,M,M,M,O,E,E,E,E,E],
  [E,E,E,O,D,O,E,E,O,D,O,E,E,E,E,E],
  [E,E,E,O,O,E,E,E,E,O,O,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

const walk0: Frame = [
  [E,E,E,E,E,E,E,E,O,G,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,G,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,O,E,E,E,W,O,E],
  [E,E,E,O,L,D,D,D,D,L,O,E,E,W,O,E],
  [E,E,O,L,L,D,D,D,D,L,L,O,O,W,E,E],
  [E,E,O,L,L,M,M,M,M,L,L,O,E,W,E,E],
  [E,E,O,M,M,M,M,M,M,M,M,O,W,O,E,E],
  [E,E,E,O,D,D,D,D,D,D,O,E,W,O,E,E],
  [E,O,O,D,L,L,L,L,L,L,D,O,O,O,E,E],
  [E,O,M,M,M,M,M,M,M,M,O,E,E,E,E,E],
  [E,E,O,D,E,O,M,M,D,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

export const xianxiaWizard16: SpriteAsset = {
  id: 'xianxiaWizard16',
  name: 'Xianxia Wizard (16px)',
  description: 'Original 16x16 elder cultivator with flowing robes and spirit staff.',
  category: 'character',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#1a1a2e',
    2: '#2d1b4e',
    3: '#6b4fa0',
    4: '#9b7fd4',
    5: '#e8dcc8',
    6: '#8b6914',
    7: '#5ce8ff',
  },
  colorNames: {
    1: 'Outline',
    2: 'Dark Robe',
    3: 'Mid Robe',
    4: 'Light Robe',
    5: 'Skin / Beard',
    6: 'Staff Wood',
    7: 'Spirit Energy',
  },
  layers: [{
    id: 'base-layer',
    name: 'Base',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: [idle0, walk0]
  }],
  animations: [
    { name: 'idle', label: 'IDLE',   frameIndices: [0], fps: 3 },
    { name: 'walk', label: 'WALK',   frameIndices: [1, 0], fps: 5 },
  ],
  tags: ['character', 'wizard', 'xianxia', 'elder', 'magic', '16px'],
};
