// Pixel art character data - each frame is a 16x16 grid
// 0=transparent, 1=outline(dark), 2=skin, 3=hair, 4=shirt, 5=pants, 6=shoes, 7=sword, 8=eyes, 9=hurt-red

const PALETTE: Record<number, string> = {
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
};

export { PALETTE };

type Frame = number[][];

const E = 0, O = 1, S = 2, H = 3, T = 4, P = 5, B = 6, W = 7, Y = 8, R = 9;

// ---- IDLE (4 frames - subtle breathing) ----
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

// ---- WALK (4 frames) ----
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

const walk4 = walk2; // reuse

// ---- ATTACK (4 frames) ----
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

const attack4 = attack1;

// ---- HURT (2 frames) ----
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

// ---- DEATH (4 frames) ----
const death1 = hurt1;

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

// ---- JUMP (2 frames) ----
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

export interface AnimationState {
  name: string;
  frames: Frame[];
  label: string;
}

export const ANIMATIONS: AnimationState[] = [
  { name: 'idle',   label: 'IDLE',   frames: [idle1, idle2, idle1, idle2] },
  { name: 'walk',   label: 'WALK',   frames: [walk1, walk2, walk3, walk4] },
  { name: 'attack', label: 'ATTACK', frames: [attack1, attack2, attack3, attack4] },
  { name: 'hurt',   label: 'HURT',   frames: [hurt1, hurt2, hurt1, hurt2] },
  { name: 'death',  label: 'DEATH',  frames: [death1, death2, death3, death4] },
  { name: 'jump',   label: 'JUMP',   frames: [jump1, jump2, jump1, jump2] },
];

export const FRAME_SIZE = 16;
