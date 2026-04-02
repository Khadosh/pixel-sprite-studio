import type { Frame } from '@/lib/types';

type Row = number[];

/** Deep clone a frame */
function cloneFrame(frame: Frame): Frame {
  return frame.map(row => [...row]);
}

/** Shift all non-zero pixels down by `px` rows. Top rows become transparent. */
export function shiftDown(frame: Frame, px: number): Frame {
  const out = cloneFrame(frame);
  // Work bottom-up to avoid overwriting
  for (let r = 15; r >= 0; r--) {
    for (let c = 0; c < 16; c++) {
      if (r - px >= 0) {
        out[r][c] = frame[r - px][c];
      } else {
        out[r][c] = 0;
      }
    }
  }
  return out;
}

/** Shift all non-zero pixels right by `px` cols. Left cols become transparent. */
export function shiftRight(frame: Frame, px: number): Frame {
  const out = cloneFrame(frame);
  for (let r = 0; r < 16; r++) {
    for (let c = 15; c >= 0; c--) {
      if (c - px >= 0) {
        out[r][c] = frame[r][c - px];
      } else {
        out[r][c] = 0;
      }
    }
  }
  return out;
}

/** Shift only rows from `startRow` to `endRow` (inclusive) left/right by `px`. */
function shiftRowsHorizontal(frame: Frame, startRow: number, endRow: number, px: number): Frame {
  const out = cloneFrame(frame);
  for (let r = startRow; r <= Math.min(endRow, 15); r++) {
    const newRow: Row = new Array(16).fill(0);
    for (let c = 0; c < 16; c++) {
      const srcC = c - px;
      if (srcC >= 0 && srcC < 16) {
        newRow[c] = frame[r][srcC];
      }
    }
    out[r] = newRow;
  }
  return out;
}

/**
 * Find the bounding box of all non-zero pixels.
 * Returns { top, bottom, left, right } or null if frame is empty.
 */
function findBounds(frame: Frame) {
  let top = 16, bottom = -1, left = 16, right = -1;
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if (frame[r][c] !== 0) {
        if (r < top) top = r;
        if (r > bottom) bottom = r;
        if (c < left) left = c;
        if (c > right) right = c;
      }
    }
  }
  if (bottom === -1) return null;
  return { top, bottom, left, right };
}

/**
 * Add glow pixels (colorIndex) around the top-right area of the sprite.
 * Simulates a magic/energy effect emanating from a weapon or hand.
 */
function addGlow(frame: Frame, glowColor: number): Frame {
  const out = cloneFrame(frame);
  const bounds = findBounds(frame);
  if (!bounds) return out;

  // Find the topmost-rightmost cluster of non-zero pixels (likely the weapon/staff tip)
  // We scan the top-right quadrant for the highest non-zero pixel on the right side
  const midCol = Math.floor((bounds.left + bounds.right) / 2);
  let tipR = bounds.bottom, tipC = bounds.right;

  // Find the topmost pixel on the right half
  for (let r = bounds.top; r <= bounds.bottom; r++) {
    for (let c = bounds.right; c >= midCol; c--) {
      if (frame[r][c] !== 0) {
        tipR = r;
        tipC = c;
        // Found topmost-right pixel
        r = bounds.bottom + 1; // break outer
        break;
      }
    }
  }

  // Place glow pixels in a small cross/diamond around the tip
  const glowOffsets = [
    [-2, 0], [-1, -1], [-1, 0], [-1, 1],
    [0, -2], [0, -1], [0, 1], [0, 2],
    [1, -1], [1, 0], [1, 1], [2, 0],
  ];

  for (const [dr, dc] of glowOffsets) {
    const gr = tipR + dr;
    const gc = tipC + dc;
    if (gr >= 0 && gr < 16 && gc >= 0 && gc < 16 && out[gr][gc] === 0) {
      out[gr][gc] = glowColor;
    }
  }

  return out;
}

// ─── Public animation generators ───

/** Idle: frame0 = base, frame1 = shifted 1px down (breathing bob) */
export function generateIdle(base: Frame): [Frame, Frame] {
  return [cloneFrame(base), shiftDown(base, 1)];
}

/** Walk: shift bottom rows left/right to simulate feet alternating */
export function generateWalk(base: Frame): [Frame, Frame] {
  const bounds = findBounds(base);
  if (!bounds) return [cloneFrame(base), cloneFrame(base)];

  // Bottom third of the sprite = legs/feet area
  const legStart = Math.floor(bounds.top + (bounds.bottom - bounds.top) * 0.7);

  return [
    shiftRowsHorizontal(base, legStart, bounds.bottom, -1),
    shiftRowsHorizontal(base, legStart, bounds.bottom, 1),
  ];
}

/** Attack/Cast: frame0 = base, frame1 = base with glow effect at weapon tip */
export function generateCast(base: Frame, glowColor: number): [Frame, Frame] {
  return [cloneFrame(base), addGlow(base, glowColor)];
}

/** Hurt: frame0 = shifted 1px right, frame1 = shifted 2px right (knockback) */
export function generateHurt(base: Frame): [Frame, Frame] {
  return [shiftRight(base, 1), shiftRight(base, 2)];
}
