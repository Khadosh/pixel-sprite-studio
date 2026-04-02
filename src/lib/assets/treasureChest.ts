import type { Frame, SpriteAsset } from '@/lib/types';

// 0=transparent, 1=outline, 2=dark-wood, 3=wood, 4=light-wood, 5=metal, 6=gold, 7=sparkle
const E = 0, O = 1, D = 2, W = 3, L = 4, M = 5, G = 6, S = 7;

// Frame 0: Closed chest
const closed: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,O,D,W,W,W,W,W,W,W,W,D,O,E,E],
  [E,E,O,W,W,W,W,M,M,W,W,W,W,O,E,E],
  [E,E,O,D,W,W,W,G,G,W,W,W,D,O,E,E],
  [E,E,O,M,O,O,O,O,O,O,O,O,M,O,E,E],
  [E,E,O,D,L,W,W,W,W,W,W,L,D,O,E,E],
  [E,E,O,D,L,W,W,W,W,W,W,L,D,O,E,E],
  [E,E,O,D,L,W,W,W,W,W,W,L,D,O,E,E],
  [E,E,O,D,D,D,D,D,D,D,D,D,D,O,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// Frame 1: Lid cracking open
const opening: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,O,D,W,W,W,W,W,W,W,W,D,O,E,E],
  [E,E,O,W,W,W,W,M,M,W,W,W,W,O,E,E],
  [E,E,O,D,W,W,W,G,G,W,W,W,D,O,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,O,M,O,O,O,O,O,O,O,O,M,O,E,E],
  [E,E,O,D,L,W,W,G,G,W,W,L,D,O,E,E],
  [E,E,O,D,L,W,W,W,W,W,W,L,D,O,E,E],
  [E,E,O,D,L,W,W,W,W,W,W,L,D,O,E,E],
  [E,E,O,D,D,D,D,D,D,D,D,D,D,O,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// Frame 2: Open with gold visible
const open: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,O,D,W,W,W,W,W,W,W,W,W,W,D,O,E],
  [E,O,W,W,W,W,W,M,M,W,W,W,W,W,O,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,E,O,D,O,O,O,O,O,O,O,O,D,O,E,E],
  [E,E,O,D,L,G,G,G,G,G,G,L,D,O,E,E],
  [E,E,O,D,L,G,G,S,G,G,G,L,D,O,E,E],
  [E,E,O,D,L,G,G,G,G,S,G,L,D,O,E,E],
  [E,E,O,D,L,G,S,G,G,G,G,L,D,O,E,E],
  [E,E,O,D,L,G,G,G,G,G,G,L,D,O,E,E],
  [E,E,O,D,L,W,W,W,W,W,W,L,D,O,E,E],
  [E,E,O,D,D,D,D,D,D,D,D,D,D,O,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// Frame 3: Open with sparkles
const sparkle: Frame = [
  [E,E,E,E,E,S,E,E,E,E,S,E,E,E,E,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,O,D,W,W,W,W,W,W,W,W,W,W,D,O,E],
  [E,O,W,W,W,W,W,M,M,W,W,W,W,W,O,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,E,O,D,O,O,O,O,O,O,O,O,D,O,E,E],
  [E,S,O,D,L,G,G,G,G,G,G,L,D,O,S,E],
  [E,E,O,D,L,G,S,G,S,G,S,L,D,O,E,E],
  [E,E,O,D,L,G,G,S,G,S,G,L,D,O,E,E],
  [E,E,O,D,L,G,S,G,G,G,S,L,D,O,E,E],
  [E,E,O,D,L,G,G,G,G,G,G,L,D,O,E,E],
  [E,E,O,D,L,W,W,W,W,W,W,L,D,O,E,E],
  [E,E,O,D,D,D,D,D,D,D,D,D,D,O,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,E,E,E,E,E,E,E,S,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

export const treasureChest: SpriteAsset = {
  id: 'treasure-chest',
  name: 'Treasure Chest',
  description: 'An animated treasure chest that opens to reveal golden loot with sparkle effects.',
  category: 'prop',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#0d1117',   // outline
    2: '#5c3a1e',   // dark wood
    3: '#8b5e34',   // wood
    4: '#c49a6c',   // light wood
    5: '#7a7a8a',   // metal
    6: '#ffd700',   // gold
    7: '#fffbe6',   // sparkle
  },
  colorNames: {
    1: 'Outline',
    2: 'Dark Wood',
    3: 'Wood',
    4: 'Light Wood',
    5: 'Metal',
    6: 'Gold',
    7: 'Sparkle',
  },
  frames: [closed, opening, open, sparkle],
  animations: [
    { name: 'open', label: 'OPEN', frameIndices: [0, 1, 2, 3], fps: 3 },
  ],
  tags: ['prop', 'loot', 'rpg', 'interactive'],
};
