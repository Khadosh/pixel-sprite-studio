import type { Frame, SpriteAsset } from '@/lib/types';

// 0=transparent, 1=outline, 2=dark-gold, 3=gold, 4=light-gold, 5=shine
const E = 0, O = 1, D = 2, G = 3, L = 4, S = 5;

// Frame 0: Front face
const front: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,O,G,L,G,G,G,G,O,E,E,E,E],
  [E,E,E,E,O,G,G,G,G,G,G,O,E,E,E,E],
  [E,E,E,E,O,G,G,L,G,G,G,O,E,E,E,E],
  [E,E,E,E,O,G,G,G,G,L,G,O,E,E,E,E],
  [E,E,E,E,O,G,G,G,G,G,G,O,E,E,E,E],
  [E,E,E,E,O,G,L,G,G,G,G,O,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// Frame 1: Turning (3/4 view)
const turning1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,L,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,L,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,L,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,L,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// Frame 2: Side (edge)
const side: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,D,G,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,D,G,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,D,G,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,D,G,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,D,G,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,D,G,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,D,G,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,D,G,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// Frame 3: Turning back (3/4 other side)
const turning2: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,L,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,L,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,L,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,L,O,E,E,E,E,E],
  [E,E,E,E,E,O,G,G,G,G,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

export const coin: SpriteAsset = {
  id: 'coin',
  name: 'Gold Coin',
  description: 'A spinning gold coin with highlight effects — ideal for collectibles and UI elements.',
  category: 'ui',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#1a1a2e',   // outline
    2: '#b8860b',   // dark gold
    3: '#ffd700',   // gold
    4: '#ffec80',   // light gold
    5: '#fffbe6',   // shine
  },
  colorNames: {
    1: 'Outline',
    2: 'Dark Gold',
    3: 'Gold',
    4: 'Light Gold',
    5: 'Shine',
  },
  frames: [front, turning1, side, turning2],
  animations: [
    { name: 'spin', label: 'SPIN', frameIndices: [0, 1, 2, 3], fps: 6 },
  ],
  tags: ['ui', 'collectible', 'currency', 'gold'],
};
