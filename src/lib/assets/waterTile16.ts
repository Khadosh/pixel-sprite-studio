import type { Frame, SpriteAsset } from '@/lib/types';

// Palette mapping: 0=transparent, 1=out, 2=base, 3=wave, 4=foam, 5=sparkle
const E = 0, O = 1, B = 2, W = 3, F = 4, S = 5;

const f1: Frame = [
  [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
  [B,B,B,S,B,B,B,B,B,B,W,B,B,B,B,B],
  [W,W,W,B,B,B,B,B,W,W,W,W,B,B,B,B],
  [F,F,W,W,B,B,B,W,W,F,F,W,W,B,S,B],
  [B,F,F,W,W,B,W,W,F,F,B,W,W,W,B,B],
  [B,B,F,F,W,W,W,F,F,B,B,B,W,W,W,B],
  [B,S,B,F,F,F,F,F,B,B,B,B,B,W,W,W],
  [B,B,B,B,F,F,F,B,B,S,B,B,B,B,W,W],
  [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
  [B,B,B,B,B,B,W,W,W,W,B,B,B,B,S,B],
  [W,W,W,B,W,W,W,F,F,W,W,B,B,B,B,B],
  [F,F,W,W,W,F,F,B,B,F,F,W,W,B,B,B],
  [B,F,F,F,F,F,B,S,B,B,F,F,W,W,W,B],
  [B,B,F,F,F,B,B,B,B,B,B,F,F,F,W,W],
  [S,B,B,B,B,B,B,B,B,B,B,B,F,F,F,F],
  [B,B,B,B,B,B,B,B,B,B,B,B,B,F,F,F],
];

const f2: Frame = [
  [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
  [B,B,W,W,B,B,B,B,B,B,S,B,B,B,B,B],
  [W,W,F,F,W,W,B,B,B,B,B,W,W,B,B,B],
  [F,F,B,F,F,W,W,B,B,B,W,W,F,F,W,W],
  [B,B,B,B,F,F,W,W,B,W,W,F,F,B,W,W],
  [S,B,B,B,B,F,F,W,W,W,F,F,B,B,B,W],
  [B,B,B,B,B,B,F,F,F,F,F,B,B,B,B,B],
  [B,B,W,W,B,B,B,F,F,F,B,B,B,S,B,B],
  [W,W,W,W,B,B,B,B,B,B,B,B,B,B,B,B],
  [F,F,W,W,B,B,S,B,B,B,B,B,W,W,W,W],
  [B,F,F,W,W,W,B,B,B,B,W,W,W,F,F,W],
  [B,B,F,F,F,W,W,B,B,F,F,W,W,B,F,F],
  [B,B,B,F,F,F,W,W,W,F,F,B,B,B,B,F],
  [S,B,B,B,F,F,F,F,F,F,B,B,B,B,B,B],
  [B,B,B,B,B,F,F,F,B,S,B,B,B,B,B,B],
  [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
];

export const waterTile16: SpriteAsset = {
  id: 'waterTile16',
  name: 'Water Tile (16px)',
  description: 'Original 16x16 seamless water tile with foam and sparkle animation.',
  category: 'terrain',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#000000',
    2: '#1d5699', // base water
    3: '#2671cc', // light water / wave
    4: '#429aff', // foam
    5: '#ffffff', // sparkle
  },
  colorNames: {
    1: 'Outline',
    2: 'Base Water',
    3: 'Wave',
    4: 'Foam',
    5: 'Sparkle',
  },
  layers: [{
    id: 'base-layer',
    name: 'Base',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: [f1, f2]
  }],
  animations: [
    { name: 'idle', label: 'FLOW', frameIndices: [0, 1], fps: 2 },
  ],
  tags: ['environment', 'nature', 'water', 'tile', '16px'],
};
