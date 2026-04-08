import type { Frame, SpriteAsset } from '@/lib/types';

// Palette mapping: 0=transparent, 1=outline, 2=wood, 3=gold, 4=iron, 5=highlight
const E = 0, O = 1, W = 2, G = 3, I = 4, L = 5;

const closed: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,O,W,W,G,G,W,W,W,W,G,G,W,W,O,E],
  [O,W,W,W,G,G,W,W,W,W,G,G,W,W,W,O],
  [O,W,W,W,W,W,W,W,W,W,W,W,W,W,W,O],
  [O,G,G,G,G,O,O,O,O,O,O,G,G,G,G,O],
  [O,G,G,G,G,O,G,I,I,G,O,G,G,G,G,O],
  [O,O,O,O,O,O,I,I,I,I,O,O,O,O,O,O],
  [O,W,W,W,W,W,I,I,I,I,W,W,W,W,W,O],
  [O,W,W,W,W,W,O,O,O,O,W,W,W,W,W,O],
  [O,W,W,W,W,W,W,W,W,W,W,W,W,W,W,O],
  [O,W,W,W,W,W,W,W,W,W,W,W,W,W,W,O],
  [E,O,W,W,W,W,W,W,W,W,W,W,W,W,O,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

const opening1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,O,W,W,G,G,W,W,W,W,G,G,W,W,O,E],
  [O,W,W,W,G,G,W,E,E,W,G,G,W,W,W,O],
  [O,W,W,W,W,W,E,G,G,E,W,W,W,W,W,O],
  [O,G,G,G,G,O,E,G,G,E,O,G,G,G,G,O],
  [E,O,O,O,O,O,E,E,E,E,O,O,O,O,O,E],
  [E,E,E,E,E,E,G,I,I,G,E,E,E,E,E,E],
  [O,O,O,O,O,O,I,I,I,I,O,O,O,O,O,O],
  [O,W,W,W,W,W,I,I,I,I,W,W,W,W,W,O],
  [O,W,W,W,W,W,O,O,O,O,W,W,W,W,W,O],
  [O,W,W,W,W,W,W,W,W,W,W,W,W,W,W,O],
  [O,W,W,W,W,W,W,W,W,W,W,W,W,W,W,O],
  [E,O,W,W,W,W,W,W,W,W,W,W,W,W,O,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

const open: Frame = [
  [E,O,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [O,W,W,G,G,W,W,W,W,G,G,W,W,O,E,E],
  [O,W,W,G,G,W,W,W,W,G,G,W,W,O,E,E],
  [O,G,G,G,G,O,O,O,O,O,O,G,G,G,O,E],
  [E,O,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,E,E,E,G,G,L,L,L,L,G,G,E,E,E,E],
  [E,E,G,G,L,L,L,L,L,L,L,L,G,G,E,E],
  [E,E,G,I,I,L,L,L,L,L,L,I,I,G,E,E],
  [O,O,O,O,O,O,I,I,I,I,O,O,O,O,O,O],
  [O,W,W,W,W,W,I,I,I,I,W,W,W,W,W,O],
  [O,W,W,W,W,W,O,O,O,O,W,W,W,W,W,O],
  [O,W,W,W,W,W,W,W,W,W,W,W,W,W,W,O],
  [O,W,W,W,W,W,W,W,W,W,W,W,W,W,W,O],
  [E,O,W,W,W,W,W,W,W,W,W,W,W,W,O,E],
  [E,E,O,O,O,O,O,O,O,O,O,O,O,O,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

export const treasureChest16: SpriteAsset = {
  id: 'treasureChest16',
  name: 'Treasure Chest (16px)',
  description: 'Original 16x16 wooden chest with gold trim and opening animation.',
  category: 'prop',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#1a1a2e', // Outline
    2: '#8b4513', // Wood
    3: '#ffd700', // Gold
    4: '#c0c0c0', // Iron / Lock
    5: '#fffbe6', // Treasure glow
  },
  colorNames: {
    1: 'Outline',
    2: 'Wood',
    3: 'Gold',
    4: 'Iron/Lock',
    5: 'Treasure Glow',
  },
  layers: [{
    id: 'base-layer',
    name: 'Base',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: [closed, opening1, open, open]
  }],
  animations: [
    { name: 'open', label: 'OPEN', frameIndices: [0, 1, 2], fps: 4 },
  ],
  tags: ['environment', 'prop', 'treasure', 'chest', '16px'],
};
