import type { Frame, SpriteAsset } from '@/lib/types';
import { generateIdle, generateWalk, generateCast, generateHurt } from '@/lib/spriteTransforms';

// Same base frame as the hand-crafted xianxia wizard idle0
// 0=transparent  1=outline  2=dark-robe  3=mid-robe  4=light-robe
// 5=skin/beard   6=staff-wood  7=magic-glow
const E = 0, O = 1, D = 2, M = 3, L = 4, S = 5, W = 6, G = 7;

const baseFrame: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,O,S,O,E,O,S,O,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,O,O,D,M,M,M,D,O,O,E,E,E,E],
  [E,E,O,D,M,M,L,L,L,M,M,D,O,W,E,E],
  [E,E,O,D,M,L,M,M,M,L,M,D,O,W,E,E],
  [E,E,E,O,D,M,M,M,M,M,D,O,E,W,E,E],
  [E,E,E,O,D,M,M,M,M,M,D,O,E,W,E,E],
  [E,E,E,E,O,D,D,D,D,D,O,E,E,G,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// Generate all animation frames from the single base
const [idle0, idle1] = generateIdle(baseFrame);
const [walk0, walk1] = generateWalk(baseFrame);
const [cast0, cast1] = generateCast(baseFrame, G); // G = glow color index
const [hurt0, hurt1] = generateHurt(baseFrame);

export const xianxiaWizardAuto: SpriteAsset = {
  id: 'xianxia-wizard-auto',
  name: 'Xianxia Elder (Auto-Anim)',
  description: 'Same base frame as the hand-crafted version, but all animations are generated via pixel transforms.',
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
  frames: [idle0, idle1, walk0, walk1, cast0, cast1, hurt0, hurt1],
  animations: [
    { name: 'idle', label: 'IDLE',   frameIndices: [0, 1, 0, 1], fps: 3 },
    { name: 'walk', label: 'WALK',   frameIndices: [2, 3, 2, 3], fps: 5 },
    { name: 'cast', label: 'CAST',   frameIndices: [4, 5, 4, 5], fps: 4 },
    { name: 'hurt', label: 'HURT',   frameIndices: [6, 7, 6, 7], fps: 5 },
  ],
  tags: ['character', 'wizard', 'xianxia', 'auto-animated'],
};
