import type { Frame, SpriteAsset } from '@/lib/types';

const E = 0, O = 1, S = 2, C = 3, H = 4;

// FRONT (Frames[0])
const front: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,O,O,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,O,O,C,C,C,C,O,O,E,E,E,E,E],
  [E,E,O,S,O,C,C,C,C,O,S,O,E,E,E,E],
  [E,E,O,S,O,C,C,C,C,O,S,O,E,E,E,E],
  [E,E,O,O,O,C,C,C,C,O,O,O,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,O,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,O,O,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,O,E,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// SIDE (Frames[1]) - Right-facing
const side: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,S,O,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,C,C,C,C,O,E,E,E,E,E,E],
  [E,E,E,O,S,O,C,C,O,O,E,E,E,E,E,E],
  [E,E,E,O,S,O,C,C,C,O,E,E,E,E,E,E],
  [E,E,E,O,O,E,O,C,C,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,O,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// BACK (Frames[2])
const back: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,O,E,E,E,E,E,E],
  [E,E,E,O,O,C,C,C,C,O,O,E,E,E,E,E],
  [E,E,O,S,O,C,C,C,C,O,S,O,E,E,E,E],
  [E,E,O,S,O,C,C,C,C,O,S,O,E,E,E,E],
  [E,E,O,O,O,C,C,C,C,O,O,O,E,E,E,E],
  [E,E,E,E,O,C,C,C,C,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,O,O,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,O,O,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,O,E,E,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

export const humanoidBase: SpriteAsset = {
  id: 'humanoid-template-16',
  name: 'Base Human (Template)',
  description: 'A structural start with Front, Side, and Back canonical bases.',
  category: 'character',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#222222',
    2: '#f6d6bd',
    3: '#7a8296',
    4: '#523a2a',
  },
  colorNames: {
    1: 'Outline',
    2: 'Skin',
    3: 'Clothes',
    4: 'Hair',
  },
  layers: [{
    id: 'base-layer',
    name: 'Base',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: [front, side, back] // Index 0: Front, Index 1: Side, Index 2: Back
  }],
  animations: [],
  tags: ['template', 'humanoid', 'base', '16px'],
};
