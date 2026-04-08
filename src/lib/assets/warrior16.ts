import type { Frame, SpriteAsset } from '@/lib/types';

// Palette mapping: 0=transparent, 1=outline, 2=skin, 3=hair, 4=shirt, 5=pants, 6=shoes, 7=sword
const E = 0, O = 1, S = 2, H = 3, C = 4, P = 5, B = 6, W = 7;

const idle: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,O,E,E,E,E,E,E,E],
  [E,E,E,O,O,C,C,C,O,O,E,E,E,E,E,E],
  [E,E,O,W,O,C,C,C,O,W,O,E,E,E,E,E],
  [E,E,O,W,O,C,C,C,O,W,O,E,E,E,E,E],
  [E,E,E,O,O,P,P,P,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,P,P,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,P,P,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,B,O,B,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,O,E,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

const walk1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,O,E,E,E,E,E,E,E],
  [E,E,E,O,O,C,C,C,O,O,E,E,E,E,E,E],
  [E,E,O,W,O,C,C,C,O,W,O,E,E,E,E,E],
  [E,E,O,W,O,C,C,C,O,W,O,E,E,E,E,E],
  [E,E,E,O,O,P,P,P,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,P,P,P,O,E,E,E,P,O,E,E],
  [E,E,E,E,O,P,P,P,O,E,E,B,O,E,E,E],
  [E,E,E,E,O,B,O,B,O,E,E,O,E,E,E,E],
  [E,E,E,E,O,O,E,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

const walk2: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,O,E,E,E,E,E,E,E],
  [E,E,E,O,O,C,C,C,O,O,E,E,E,E,E,E],
  [E,E,O,W,O,C,C,C,O,W,O,E,E,E,E,E],
  [E,E,O,W,O,C,C,C,O,W,O,E,E,E,E,E],
  [E,E,E,O,O,P,P,P,O,O,E,E,E,E,E,E],
  [E,E,O,P,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,O,B,E,E,O,P,P,O,E,E,E,E,E,E],
  [E,E,E,O,E,E,E,O,B,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

export const warrior16: SpriteAsset = {
  id: 'warrior16',
  name: 'Warrior (16px)',
  description: 'Original 16x16 classic fantasy warrior character.',
  category: 'character',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#1a1a2e',
    2: '#f0c38e',
    3: '#5c3a21',
    4: '#2d6a4f',
    5: '#3a3a5c',
    6: '#4a2c1a',
    7: '#c0c0c0',
  },
  colorNames: {
    1: 'Outline',
    2: 'Skin',
    3: 'Hair',
    4: 'Shirt',
    5: 'Pants',
    6: 'Shoes',
    7: 'Sword',
  },
  layers: [{
    id: 'base-layer',
    name: 'Base',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: [idle, walk1, walk2, walk1]
  }],
  animations: [
    { name: 'idle', label: 'IDLE', frameIndices: [0], fps: 1 },
    { name: 'walk', label: 'WALK', frameIndices: [1, 0, 2, 0], fps: 6 },
  ],
  tags: ['character', 'warrior', 'fantasy', 'human', '16px'],
};
