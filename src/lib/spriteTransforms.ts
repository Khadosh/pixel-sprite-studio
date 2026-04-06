import type { Frame } from '@/lib/types';

type Row = number[];

/** Deep clone a frame */
function cloneFrame(frame: Frame): Frame {
  return frame.map(row => [...row]);
}

/** Shift all non-zero pixels down by `px` rows. Top rows become transparent. */
export function shiftDown(frame: Frame, px: number): Frame {
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
  const out = cloneFrame(frame);
  // Work bottom-up to avoid overwriting
  for (let r = size - 1; r >= 0; r--) {
    for (let c = 0; c < size; c++) {
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
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
  const out = cloneFrame(frame);
  for (let r = 0; r < size; r++) {
    for (let c = size - 1; c >= 0; c--) {
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
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
  const out = cloneFrame(frame);
  for (let r = startRow; r <= Math.min(endRow, size - 1); r++) {
    const newRow: Row = new Array(size).fill(0);
    for (let c = 0; c < size; c++) {
      const srcC = c - px;
      if (srcC >= 0 && srcC < size) {
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
  const size = frame.length;
  let top = size, bottom = -1, left = size, right = -1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
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
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
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
    if (gr >= 0 && gr < size && gc >= 0 && gc < size && out[gr][gc] === 0) {
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

/** Walk: shift only the bottom 2 rows (feet) left/right for a subtle step */
export function generateWalk(base: Frame): [Frame, Frame] {
  const bounds = findBounds(base);
  if (!bounds) return [cloneFrame(base), cloneFrame(base)];

  // The last part of the sprite depends on size. We assume bottom 2-3 rows are feet.
  // For 16px it's 2 rows, for 32px it might be 3-4. We use ~15% of size.
  const feetRows = Math.max(2, Math.floor(base.length * 0.15));
  const feetStart = Math.max(bounds.bottom - (feetRows - 1), bounds.top);

  return [
    shiftRowsHorizontal(base, feetStart, bounds.bottom, -1),
    shiftRowsHorizontal(base, feetStart, bounds.bottom, 1),
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
/** Flip horizontal */
export function flipHorizontal(frame: Frame): Frame {
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
  const out = cloneFrame(frame);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      out[r][c] = frame[r][size - 1 - c];
    }
  }
  return out;
}

/** Flip vertical */
export function flipVertical(frame: Frame): Frame {
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
  const out = cloneFrame(frame);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      out[r][c] = frame[size - 1 - r][c];
    }
  }
  return out;
}

/** Rotate 90 degrees clockwise */
export function rotate90(frame: Frame): Frame {
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
  const out = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      out[c][size - 1 - r] = frame[r][c];
    }
  }
  return out;
}

/** Shift/Translate a frame by delta row/col. Clips at edges. */
export function shiftFrame(frame: Frame, dr: number, dc: number): Frame {
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
  const out = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const srcR = r - dr;
      const srcC = c - dc;
      if (srcR >= 0 && srcR < size && srcC >= 0 && srcC < size) {
        out[r][c] = frame[srcR][srcC];
      }
    }
  }
  return out;
}
