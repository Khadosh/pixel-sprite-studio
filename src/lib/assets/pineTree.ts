import type { Frame, SpriteAsset } from '@/lib/types';

// 0=transparent, 1=outline(dark), 2=trunk, 3=dark-green, 4=mid-green, 5=light-green, 6=snow
const E = 0, O = 1, K = 2, D = 3, G = 4, L = 5, W = 6;

const tree: Frame = [
  // row 0 (x2): [E,E,E,E,E,E,E,L,L,E,E,E,E,E,E,E]
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,L,L,L,L,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,L,L,L,L,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  // row 1 (x2): [E,E,E,E,E,E,O,L,L,O,E,E,E,E,E,E]
  [E,E,E,E,E,E,E,E,E,E,E,E,O,O,L,L,L,L,O,O,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,O,O,L,L,L,L,O,O,E,E,E,E,E,E,E,E,E,E,E,E],
  // row 2 (x2): [E,E,E,E,E,O,D,G,G,D,O,E,E,E,E,E]
  [E,E,E,E,E,E,E,E,E,E,O,O,D,D,G,G,G,G,D,D,O,O,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,O,O,D,D,G,G,G,G,D,D,O,O,E,E,E,E,E,E,E,E,E,E],
  // row 3 (x2): [E,E,E,E,O,D,G,L,G,G,D,O,E,E,E,E]
  [E,E,E,E,E,E,E,E,O,O,D,D,G,G,L,L,G,G,G,G,D,D,O,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,O,O,D,D,G,G,L,L,G,G,G,G,D,D,O,O,E,E,E,E,E,E,E,E],
  // row 4 (x2): [E,E,E,O,D,G,G,G,L,G,G,D,O,E,E,E]
  [E,E,E,E,E,E,O,O,D,D,G,G,G,G,G,G,L,L,G,G,G,G,D,D,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,D,D,G,G,G,G,G,G,L,L,G,G,G,G,D,D,O,O,E,E,E,E,E,E],
  // row 5 (x2): [E,E,E,O,D,G,L,G,G,G,G,D,O,E,E,E]
  [E,E,E,E,E,E,O,O,D,D,G,G,L,L,G,G,G,G,G,G,G,G,D,D,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,D,D,G,G,L,L,G,G,G,G,G,G,G,G,D,D,O,O,E,E,E,E,E,E],
  // row 6 (x2): [E,E,O,D,G,G,G,G,G,L,G,G,D,O,E,E]
  [E,E,E,E,O,O,D,D,G,G,G,G,G,G,G,G,G,G,L,L,G,G,G,G,D,D,O,O,E,E,E,E],
  [E,E,E,E,O,O,D,D,G,G,G,G,G,G,G,G,G,G,L,L,G,G,G,G,D,D,O,O,E,E,E,E],
  // row 7 (x2): [E,E,E,O,D,D,G,G,G,G,D,D,O,E,E,E]
  [E,E,E,E,E,E,O,O,D,D,D,D,G,G,G,G,G,G,G,G,D,D,D,D,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,D,D,D,D,G,G,G,G,G,G,G,G,D,D,D,D,O,O,E,E,E,E,E,E],
  // row 8 (x2): [E,E,E,E,O,D,G,L,G,G,D,O,E,E,E,E]
  [E,E,E,E,E,E,E,E,O,O,D,D,G,G,L,L,G,G,G,G,D,D,O,O,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,O,O,D,D,G,G,L,L,G,G,G,G,D,D,O,O,E,E,E,E,E,E,E,E],
  // row 9 (x2): [E,E,E,O,D,G,G,G,G,L,G,D,O,E,E,E]
  [E,E,E,E,E,E,O,O,D,D,G,G,G,G,G,G,G,G,L,L,G,G,D,D,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,D,D,G,G,G,G,G,G,G,G,L,L,G,G,D,D,O,O,E,E,E,E,E,E],
  // row 10 (x2): [E,E,O,D,G,G,L,G,G,G,G,G,D,O,E,E]
  [E,E,E,E,O,O,D,D,G,G,G,G,L,L,G,G,G,G,G,G,G,G,G,G,D,D,O,O,E,E,E,E],
  [E,E,E,E,O,O,D,D,G,G,G,G,L,L,G,G,G,G,G,G,G,G,G,G,D,D,O,O,E,E,E,E],
  // row 11 (x2): [E,O,D,G,G,G,G,G,L,G,G,G,G,D,O,E]
  [E,E,O,O,D,D,G,G,G,G,G,G,G,G,G,G,L,L,G,G,G,G,G,G,G,G,D,D,O,O,E,E],
  [E,E,O,O,D,D,G,G,G,G,G,G,G,G,G,G,L,L,G,G,G,G,G,G,G,G,D,D,O,O,E,E],
  // row 12 (x2): [E,O,D,D,G,G,G,G,G,G,G,D,D,D,O,E]
  [E,E,O,O,D,D,D,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,D,D,D,D,D,D,O,O,E,E],
  [E,E,O,O,D,D,D,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,D,D,D,D,D,D,O,O,E,E],
  // row 13 (x2): [E,E,O,O,O,O,O,K,K,O,O,O,O,O,E,E]
  [E,E,E,E,O,O,O,O,O,O,O,O,O,O,K,K,K,K,O,O,O,O,O,O,O,O,O,O,E,E,E,E],
  [E,E,E,E,O,O,O,O,O,O,O,O,O,O,K,K,K,K,O,O,O,O,O,O,O,O,O,O,E,E,E,E],
  // row 14 (x2): [E,E,E,E,E,E,O,K,K,O,E,E,E,E,E,E]
  [E,E,E,E,E,E,E,E,E,E,E,E,O,O,K,K,K,K,O,O,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,O,O,K,K,K,K,O,O,E,E,E,E,E,E,E,E,E,E,E,E],
  // row 15 (x2): [E,E,E,E,E,O,K,K,K,K,O,E,E,E,E,E]
  [E,E,E,E,E,E,E,E,E,E,O,O,K,K,K,K,K,K,K,K,O,O,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,O,O,K,K,K,K,K,K,K,K,O,O,E,E,E,E,E,E,E,E,E,E],
];

export const pineTree: SpriteAsset = {
  id: 'pine-tree',
  name: 'Pine Tree',
  description: 'A classic pixel art pine tree — perfect for forest environments and nature scenes.',
  category: 'nature',
  size: 32,
  palette: {
    0: 'transparent',
    1: '#0d1117',   // outline
    2: '#6b3a2a',   // trunk
    3: '#1a5c2a',   // dark green
    4: '#2d8c4e',   // mid green
    5: '#5cdb6e',   // light green highlight
    6: '#e8f0fe',   // snow tip
  },
  colorNames: {
    1: 'Outline',
    2: 'Trunk',
    3: 'Dark Green',
    4: 'Mid Green',
    5: 'Highlight',
    6: 'Snow',
  },
  frames: [tree],
  animations: [],
  tags: ['nature', 'tree', 'forest', 'environment'],
};
