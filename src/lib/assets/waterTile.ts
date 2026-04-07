import type { Frame, SpriteAsset } from '@/lib/types';

// 0=transparent, 1=dark-blue, 2=mid-blue, 3=blue, 4=light-blue, 5=foam/white
const E = 0, D = 1, M = 2, B = 3, L = 4, F = 5;

/** Scales a 16×16 frame to 32×32 by duplicating each pixel into a 2×2 block. */
function upscale2x(frame: Frame): Frame {
  return frame.flatMap(row => {
    const doubled = row.flatMap(pixel => [pixel, pixel]);
    return [doubled, doubled];
  }) as Frame;
}

// Frame 0: Calm water (16×16 source)
const water1_16: Frame = [
  [B,B,B,L,B,B,B,B,B,B,L,B,B,B,B,B],
  [B,B,L,L,L,B,B,B,B,L,L,L,B,B,B,B],
  [B,L,L,B,L,L,B,B,L,L,B,L,L,B,B,B],
  [L,L,B,B,B,L,L,L,L,B,B,B,L,L,B,B],
  [M,B,B,B,B,B,M,M,B,B,B,B,B,M,B,B],
  [D,M,B,B,B,M,D,D,M,B,B,B,M,D,M,B],
  [D,D,M,M,M,D,D,D,D,M,M,M,D,D,D,M],
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  [B,B,B,B,B,L,B,B,B,B,B,L,B,B,B,B],
  [B,B,B,B,L,L,L,B,B,B,L,L,L,B,B,B],
  [B,B,B,L,L,B,L,L,B,L,L,B,L,L,B,B],
  [B,B,L,L,B,B,B,L,L,L,B,B,B,L,L,B],
  [B,M,M,B,B,B,B,B,M,B,B,B,B,B,M,M],
  [M,D,D,M,B,B,B,M,D,M,B,B,B,M,D,D],
  [D,D,D,D,M,M,M,D,D,D,M,M,M,D,D,D],
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
];

// Frame 1: Wave shift right (16×16 source)
const water2_16: Frame = [
  [B,B,B,B,B,L,B,B,B,B,B,L,B,B,B,B],
  [B,B,B,B,L,L,L,B,B,B,L,L,L,B,B,B],
  [B,B,B,L,L,B,L,L,B,L,L,B,L,L,B,B],
  [B,B,L,L,B,B,B,L,L,L,B,B,B,L,L,B],
  [B,M,M,B,B,B,B,B,M,B,B,B,B,B,M,M],
  [M,D,D,M,B,B,B,M,D,M,B,B,B,M,D,D],
  [D,D,D,D,M,M,M,D,D,D,M,M,M,D,D,D],
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  [B,B,L,B,B,B,B,B,B,L,B,B,B,B,B,B],
  [B,L,L,L,B,B,B,B,L,L,L,B,B,B,B,B],
  [L,L,B,L,L,B,B,L,L,B,L,L,B,B,B,B],
  [L,B,B,B,L,L,L,L,B,B,B,L,L,B,B,B],
  [B,B,B,B,B,M,M,B,B,B,B,B,M,B,B,B],
  [M,B,B,B,M,D,D,M,B,B,B,M,D,M,B,B],
  [D,M,M,M,D,D,D,D,M,M,M,D,D,D,M,M],
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
];

// Frame 2: Wave shift left (16×16 source)
const water3_16: Frame = [
  [B,B,B,B,B,B,L,B,B,B,B,B,B,L,B,B],
  [B,B,B,B,B,L,L,L,B,B,B,B,L,L,L,B],
  [B,B,B,B,L,L,B,L,L,B,B,L,L,B,L,L],
  [B,B,B,L,L,B,B,B,L,L,L,L,B,B,B,L],
  [B,B,M,M,B,B,B,B,B,M,M,B,B,B,B,B],
  [B,M,D,D,M,B,B,B,M,D,D,M,B,B,B,M],
  [M,D,D,D,D,M,M,M,D,D,D,D,M,M,M,D],
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  [B,B,B,B,L,B,B,B,B,B,B,B,L,B,B,B],
  [B,B,B,L,L,L,B,B,B,B,B,L,L,L,B,B],
  [B,B,L,L,B,L,L,B,B,B,L,L,B,L,L,B],
  [B,L,L,B,B,B,L,L,B,L,L,B,B,B,L,L],
  [M,M,B,B,B,B,B,M,M,M,B,B,B,B,B,M],
  [D,D,M,B,B,B,M,D,D,D,M,B,B,B,M,D],
  [D,D,D,M,M,M,D,D,D,D,D,M,M,M,D,D],
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
];

// 32×32 upscaled frames
const water1 = upscale2x(water1_16);
const water2 = upscale2x(water2_16);
const water3 = upscale2x(water3_16);

export const waterTile: SpriteAsset = {
  id: 'water-tile',
  name: 'Water Tile',
  description: 'An animated water tile with wave patterns — tileable for oceans, lakes, and rivers.',
  category: 'terrain',
  size: 32,
  palette: {
    0: 'transparent',
    1: '#0a2463',   // dark blue
    2: '#1e4d8c',   // mid blue
    3: '#3a7bd5',   // blue
    4: '#6db3f2',   // light blue
    5: '#e8f4fd',   // foam / white
  },
  colorNames: {
    1: 'Deep Water',
    2: 'Mid Water',
    3: 'Water',
    4: 'Light Water',
    5: 'Foam',
  },
  frames: [water1, water2, water3],
  animations: [
    { name: 'wave', label: 'WAVE', frameIndices: [0, 1, 2, 1], fps: 3 },
  ],
  tags: ['terrain', 'water', 'ocean', 'tileable'],
};
