import type { Frame, SpriteAsset } from '@/lib/types';

// 0=transparent  1=outline  2=dark-robe  3=mid-robe  4=light-robe
// 5=skin/beard   6=staff-wood  7=magic-glow
const E = 0, O = 1, D = 2, M = 3, L = 4, S = 5, W = 6, G = 7;

// ── IDLE frame 0 — standing neutral, staff right hand ──
const idle0: Frame = [
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

// ── IDLE frame 1 — subtle bob: body shifts 1px down ──
const idle1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,O,S,O,E,O,S,O,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,O,O,D,M,M,M,D,O,O,E,W,E,E],
  [E,E,O,D,M,M,L,L,L,M,M,D,O,W,E,E],
  [E,E,O,D,M,L,M,M,M,L,M,D,O,W,E,E],
  [E,E,E,O,D,M,M,M,M,M,D,O,E,W,E,E],
  [E,E,E,E,O,D,D,D,D,D,O,E,E,G,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// ── WALK frame 0 — left foot forward, robe sways left ──
const walk0: Frame = [
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
  [E,E,O,D,M,M,M,M,M,M,D,O,E,W,E,E],
  [E,E,E,O,D,M,M,M,M,D,O,E,E,W,E,E],
  [E,E,E,E,O,O,D,D,D,O,E,E,E,G,E,E],
  [E,E,E,E,O,O,E,E,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// ── WALK frame 1 — right foot forward, robe sways right ──
const walk1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,O,S,O,E,O,S,O,E,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,O,D,M,M,D,O,O,E,E,E,E],
  [E,E,E,O,D,M,M,L,L,L,M,M,O,W,E,E],
  [E,E,E,O,D,M,L,M,M,M,L,D,O,W,E,E],
  [E,E,E,O,D,M,M,M,M,M,D,O,E,W,E,E],
  [E,E,E,E,O,D,M,M,M,D,O,E,E,W,E,E],
  [E,E,E,E,E,O,D,D,D,O,O,E,E,G,E,E],
  [E,E,E,E,E,O,O,E,E,O,O,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// ── CAST frame 0 — raising staff above head ──
const cast0: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,G,E,E,E],
  [E,E,E,E,E,E,O,O,O,E,E,E,W,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,W,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,W,E,E,E],
  [E,E,E,E,O,S,O,E,O,S,O,W,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,O,O,D,M,M,M,D,O,O,E,E,E,E],
  [E,E,O,D,M,M,L,L,L,M,M,D,O,E,E,E],
  [E,E,O,D,M,L,M,M,M,L,M,D,O,E,E,E],
  [E,E,E,O,D,M,M,M,M,M,D,O,E,E,E,E],
  [E,E,E,O,D,M,M,M,M,M,D,O,E,E,E,E],
  [E,E,E,E,O,D,D,D,D,D,O,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// ── CAST frame 1 — magic burst! staff tip explodes with energy ──
const cast1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,G,G,G,G,G,E],
  [E,E,E,E,E,E,O,O,O,E,E,G,W,G,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,G,W,G,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,W,E,E,E],
  [E,E,E,E,O,S,O,E,O,S,O,W,E,E,E,E],
  [E,E,E,E,O,S,S,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,O,O,D,M,M,M,D,O,O,E,E,E,E],
  [E,E,O,D,M,M,L,L,L,M,M,D,O,E,E,E],
  [E,E,O,D,M,L,M,M,M,L,M,D,O,E,E,E],
  [E,E,E,O,D,M,M,M,M,M,D,O,E,E,E,E],
  [E,E,E,O,D,M,M,M,M,M,D,O,E,E,E,E],
  [E,E,E,E,O,D,D,D,D,D,O,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// ── HURT frame 0 — flinch, body shifts right ──
const hurt0: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,S,S,O,E,E,E,E],
  [E,E,E,E,E,O,S,O,E,O,S,O,E,E,E,E],
  [E,E,E,E,E,O,S,S,O,S,S,O,E,E,E,E],
  [E,E,E,E,E,E,O,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,O,O,D,M,M,M,D,O,O,E,E,E],
  [E,E,E,O,D,M,M,L,L,L,M,M,D,O,E,E],
  [E,E,E,O,D,M,L,M,M,M,L,M,D,O,W,E],
  [E,E,E,E,O,D,M,M,M,M,M,D,O,E,W,E],
  [E,E,E,E,O,D,M,M,M,M,M,D,O,E,W,E],
  [E,E,E,E,E,O,D,D,D,D,D,O,E,E,E,E],
  [E,E,E,E,E,E,O,O,E,O,O,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// ── HURT frame 1 — knocked back further, staff falling ──
const hurt1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,O,O,O,E,E,E,E,E],
  [E,E,E,E,E,E,E,O,S,S,S,O,E,E,E,E],
  [E,E,E,E,E,E,O,S,S,S,S,S,O,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,O,S,O,E,E,E],
  [E,E,E,E,E,E,O,S,S,O,S,S,O,E,E,E],
  [E,E,E,E,E,E,E,O,S,S,S,O,E,E,E,E],
  [E,E,E,E,E,E,E,O,S,S,S,O,E,E,E,E],
  [E,E,E,E,E,O,O,D,M,M,M,D,O,O,E,E],
  [E,E,E,E,O,D,M,M,L,L,L,M,M,D,O,E],
  [E,E,E,E,O,D,M,L,M,M,M,L,M,D,O,E],
  [E,E,E,E,E,O,D,M,M,M,M,M,D,O,W,E],
  [E,E,E,E,E,O,D,M,M,M,M,M,D,O,W,E],
  [E,E,E,E,E,E,O,D,D,D,D,D,O,E,W,E],
  [E,E,E,E,E,E,E,O,O,E,O,O,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

export const xianxiaWizard: SpriteAsset = {
  id: 'xianxia-wizard',
  name: 'Xianxia Elder',
  description: 'A venerable cultivation elder in flowing robes, wielding a spiritual wand. Xianxia-inspired pixel art.',
  category: 'character',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#1a1a2e',   // outline
    2: '#2d1b4e',   // dark robe (deep purple)
    3: '#6b4fa0',   // mid robe (violet)
    4: '#9b7fd4',   // light robe (lavender)
    5: '#e8dcc8',   // skin / beard
    6: '#8b6914',   // staff wood
    7: '#5ce8ff',   // spirit energy glow
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
  tags: ['character', 'wizard', 'xianxia', 'elder', 'magic', 'cultivation'],
};
