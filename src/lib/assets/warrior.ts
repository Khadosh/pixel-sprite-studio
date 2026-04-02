import type { Frame, SpriteAsset } from '@/lib/types';

// Shorthand aliases for readability in frame grids
const E = 0, O = 1, S = 2, H = 3, T = 4, P = 5, B = 6, W = 7, Y = 8, R = 9;

// ---- IDLE frames ----
const idle1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,E,O,S,O,T,O,S,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,B,E,B,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
];

const idle2: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,E,O,S,O,T,O,S,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,B,E,B,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
];

// ---- WALK frames ----
const walk1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,E,O,S,O,T,O,S,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,P,P,E,P,P,O,E,E,E,E,E],
  [E,E,E,O,B,O,E,E,E,O,B,O,E,E,E,E],
  [E,E,E,O,O,E,E,E,E,E,O,O,E,E,E,E],
];

const walk2: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,S,O,T,T,T,O,S,O,E,E,E,E],
  [E,E,E,E,E,E,O,T,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,E,P,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,B,E,B,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
];

const walk3: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,E,O,S,O,T,O,S,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,P,O,E,O,P,E,E,E,E,E,E],
  [E,E,E,E,O,B,E,E,E,B,O,E,E,E,E,E],
  [E,E,E,E,O,O,E,E,E,O,O,E,E,E,E,E],
];

// ---- ATTACK frames ----
const attack1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,W,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,W,E,E,E],
  [E,E,E,E,O,S,O,T,O,S,O,W,E,E,E,E],
  [E,E,E,E,E,E,O,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,B,E,B,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
];

const attack2: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,O,T,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,O,S,O,T,T,T,T,T,T,O,W,W,W,O],
  [E,E,E,E,E,O,O,T,O,S,O,E,E,E,E,E],
  [E,E,E,E,E,E,O,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,B,E,B,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,O,O,E,E,E,E,E,E],
];

const attack3: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,O,T,T,T,T,T,T,T,T,T,O,E,E,E],
  [E,E,O,S,O,T,T,T,T,T,T,O,W,W,W,O],
  [E,E,E,E,E,O,O,T,O,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,P,P,E,P,P,O,E,E,E,E,E],
  [E,E,E,O,B,O,E,E,E,O,B,O,E,E,E,E],
  [E,E,E,O,O,E,E,E,E,E,O,O,E,E,E,E],
];

// ---- HURT frames ----
const hurt1: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,O,O,O,O,E,E,E,E,E],
  [E,E,E,E,E,O,H,H,H,H,H,O,E,E,E,E],
  [E,E,E,E,E,O,H,H,H,H,H,O,E,E,E,E],
  [E,E,E,E,E,O,S,R,S,R,S,O,E,E,E,E],
  [E,E,E,E,E,E,O,S,S,S,O,E,E,E,E,E],
  [E,E,E,E,E,E,E,O,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,T,T,T,T,T,O,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,T,T,O,E,E,E],
  [E,E,E,O,S,O,T,T,T,T,T,O,S,O,E,E],
  [E,E,E,E,E,E,O,T,T,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,P,O,E,E,E,E,E],
  [E,E,E,E,E,O,B,E,E,B,O,E,E,E,E,E],
  [E,E,E,E,E,O,O,E,E,O,O,E,E,E,E,E],
];

const hurt2: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,R,S,R,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,O,S,O,T,T,T,T,T,O,S,O,E,E,E],
  [E,E,E,E,E,O,T,T,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,P,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,O,B,E,E,B,O,E,E,E,E,E,E],
  [E,E,E,E,O,O,E,E,O,O,E,E,E,E,E,E],
];

// ---- DEATH frames ----
const death2: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,R,S,R,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,S,T,T,T,T,T,S,O,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,O,B,E,E,E,B,O,E,E,E,E,E],
  [E,E,E,E,O,O,E,E,E,O,O,E,E,E,E,E],
];

const death3: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,O,H,H,S,R,S,T,T,T,P,B,O,E,E],
  [E,E,O,H,H,S,S,S,T,T,T,P,B,O,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

const death4: Frame = [
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,O,H,H,S,R,S,T,T,T,P,B,O,E,E],
  [E,E,E,O,O,O,O,O,O,O,O,O,O,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// ---- JUMP frames ----
const jump1: Frame = [
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,O,S,O,T,T,T,T,T,O,S,O,E,E,E],
  [E,E,E,E,E,O,T,T,T,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,P,O,E,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,O,B,O,E,O,B,O,E,E,E,E,E],
  [E,E,E,E,O,O,E,E,E,O,O,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

const jump2: Frame = [
  [E,E,E,E,E,O,O,O,O,O,E,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,H,H,H,H,H,O,E,E,E,E,E],
  [E,E,E,E,O,S,Y,S,Y,S,O,E,E,E,E,E],
  [E,E,E,E,E,O,S,S,S,O,E,E,E,E,E,E],
  [E,E,E,E,E,E,O,S,O,E,E,E,E,E,E,E],
  [E,E,E,O,T,T,T,T,T,T,T,O,E,E,E,E],
  [E,E,O,S,T,T,T,T,T,T,T,S,O,E,E,E],
  [E,E,E,E,O,T,T,T,T,T,O,E,E,E,E,E],
  [E,E,E,E,E,O,T,T,T,O,E,E,E,E,E,E],
  [E,E,E,E,E,O,P,P,P,O,E,E,E,E,E,E],
  [E,E,E,E,O,P,E,E,E,P,O,E,E,E,E,E],
  [E,E,E,O,B,E,E,E,E,E,B,O,E,E,E,E],
  [E,E,E,O,O,E,E,E,E,E,O,O,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
  [E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E],
];

// All unique frames indexed for animation references
const allFrames: Frame[] = [
  idle1,    // 0
  idle2,    // 1
  walk1,    // 2
  walk2,    // 3
  walk3,    // 4
  attack1,  // 5
  attack2,  // 6
  attack3,  // 7
  hurt1,    // 8
  hurt2,    // 9
  death2,   // 10
  death3,   // 11
  death4,   // 12
  jump1,    // 13
  jump2,    // 14
];

export const warrior: SpriteAsset = {
  id: 'warrior',
  name: 'Warrior',
  description: 'A brave pixel warrior with sword — idle, walk, attack, hurt, death, and jump animations.',
  category: 'character',
  size: 16,
  palette: {
    0: 'transparent',
    1: '#1a1a2e',   // outline
    2: '#f0c38e',   // skin
    3: '#5c3a21',   // hair
    4: '#2d6a4f',   // shirt (green)
    5: '#3a3a5c',   // pants
    6: '#4a2c1a',   // shoes
    7: '#c0c0c0',   // sword
    8: '#1a1a2e',   // eyes
    9: '#e63946',   // hurt red
  },
  colorNames: {
    1: 'Outline',
    2: 'Skin',
    3: 'Hair',
    4: 'Shirt',
    5: 'Pants',
    6: 'Shoes',
    7: 'Sword',
    8: 'Eyes',
    9: 'Hurt',
  },
  frames: allFrames,
  animations: [
    { name: 'idle',   label: 'IDLE',   frameIndices: [0, 1, 0, 1] },
    { name: 'walk',   label: 'WALK',   frameIndices: [2, 3, 4, 3] },
    { name: 'attack', label: 'ATTACK', frameIndices: [5, 6, 7, 5] },
    { name: 'hurt',   label: 'HURT',   frameIndices: [8, 9, 8, 9] },
    { name: 'death',  label: 'DEATH',  frameIndices: [8, 10, 11, 12] },
    { name: 'jump',   label: 'JUMP',   frameIndices: [13, 14, 13, 14] },
  ],
  tags: ['character', 'humanoid', 'rpg', 'fighter'],
};
