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
  const out = Array.from({ length: size }, () => Array(size).fill(0));
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const srcR = r - px;
      if (srcR >= 0 && srcR < size) {
        out[r][c] = frame[srcR][c];
      }
    }
  }
  return out;
}

/** Shift all non-zero pixels right by `px` cols. Left cols become transparent. */
export function shiftRight(frame: Frame, px: number): Frame {
  if (frame.length === 0) return cloneFrame(frame);
  const size = frame.length;
  const out = Array.from({ length: size }, () => Array(size).fill(0));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const srcC = c - px;
      if (srcC >= 0 && srcC < size) {
        out[r][c] = frame[r][srcC];
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
 * Compresses the frame by "removing" specific rows and shifting everything above them down.
 * @param frame The base frame
 * @param rowsToDrop Array of row indices to remove (should be sorted descending for easiest logic)
 * @param colRange Optional range of columns to restrict the effect to
 * @param topBoundary Optional row index above which NO shifting or clearing occurs
 */
function squash(frame: Frame, rowsToDrop: number[], colRange?: { start: number, end: number }, topBoundary: number = -1): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  
  // Sort rows to drop descending to process from bottom up
  const sortedDrops = [...rowsToDrop].sort((a, b) => b - a);

  for (const dropR of sortedDrops) {
    // Everything at dropR and below stays or is overwritten
    // Everything above dropR moves down by 1, but STOP at topBoundary
    for (let r = dropR; r > Math.max(0, topBoundary + 1); r--) {
      for (let c = 0; c < size; c++) {
        // If colRange is provided, only affect those columns
        if (colRange && (c < colRange.start || c > colRange.end)) continue;
        out[r][c] = out[r - 1][c];
      }
    }
    
    // Clear the row just above the compression IF it's not the top boundary
    // to avoid duplicating the boundary pixels
    const clearRow = Math.max(0, topBoundary + 1);
    if (dropR >= clearRow) {
      for (let c = 0; c < size; c++) {
        if (colRange && (c < colRange.start || c > colRange.end)) continue;
        // Only clear if we actually shifted something down from this row
        // If topBoundary is used, we are essentially "stretching" the boundary pixel
        // if we don't clear it. But if we do clear it, we get a gap.
        // The user suggested 3 parts horizontally, let's keep it connected.
        if (topBoundary === -1) {
          out[0][c] = 0;
        }
      }
    }
  }
  
  return out;
}

/**
 * Find the bounding box of all non-zero pixels.
 * Returns { top, bottom, left, right } or null if frame is empty.
 */
export function findBounds(frame: Frame) {
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

/** Idle: frame0 = base, frame1 = squashed bottom and middle (squash & stretch breathing) */
export function generateIdle(base: Frame): [Frame, Frame] {
  const bounds = findBounds(base);
  const com = getCenterOfMass(base);
  if (!bounds || !com) return [cloneFrame(base), cloneFrame(base)];

  // Bottom 3 rows: bounds.bottom, bounds.bottom-1, bounds.bottom-2. Drop middle one.
  const bottomDrop = bounds.bottom - 1;
  // Middle row: around center of mass r
  const midDrop = Math.floor(com.r);

  // Apply squash (order doesn't strictly matter as long as indices are unique)
  const rowsToDrop = [bottomDrop, midDrop].filter(r => r > bounds.top && r < bounds.bottom);
  
  return [cloneFrame(base), squash(base, rowsToDrop)];
}

/** Walk: squash torso and legs one side at a time, keeping the head fixed to avoid distortion */
export function generateWalk(base: Frame): [Frame, Frame] {
  const bounds = findBounds(base);
  const com = getCenterOfMass(base);
  if (!bounds || !com) return [cloneFrame(base), cloneFrame(base)];

  const centerCol = Math.floor(com.c);
  const bodyHeight = bounds.bottom - bounds.top + 1;
  
  // Divide into 3 vertical bands
  const headEndRow = Math.floor(bounds.top + bodyHeight * 0.35);
  const torsoEndRow = Math.floor(bounds.top + bodyHeight * 0.7);

  // Identify rows to drop: one in torso, one in legs
  const midDrop = Math.floor((headEndRow + torsoEndRow) / 2);
  const legDrop = Math.floor((torsoEndRow + bounds.bottom) / 2);
  
  // Ensure drops are unique and valid
  const rowsToDrop = [midDrop, legDrop].filter(r => r > headEndRow && r < bounds.bottom);
  
  // Split columns into vertical halves
  const leftHalfRange = { start: bounds.left, end: centerCol };
  const rightHalfRange = { start: centerCol + 1, end: bounds.right };

  // Frame 1: Squash left side torso/legs, anchor head
  // Frame 2: Squash right side torso/legs, anchor head
  return [
    squash(base, rowsToDrop, leftHalfRange, headEndRow),
    squash(base, rowsToDrop, rightHalfRange, headEndRow),
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

/** Calculate the center of mass of non-transparent pixels. Returns null if empty. */
export function getCenterOfMass(frame: Frame): { r: number, c: number } | null {
  const size = frame.length;
  let sumR = 0;
  let sumC = 0;
  let count = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (frame[r][c] !== 0) {
        sumR += r;
        sumC += c;
        count++;
      }
    }
  }

  if (count === 0) return null;
  return { r: sumR / count, c: sumC / count };
}

/** Rotate a frame by an arbitrary angle (degrees) around a specific center. */
export function rotateFrameFree(frame: Frame, angleDeg: number, center: { r: number, c: number }): Frame {
  const size = frame.length;
  const out = Array.from({ length: size }, () => Array(size).fill(0));
  const angleRad = (angleDeg * Math.PI) / 180;

  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Coordinates relative to center
      const dr = r - center.r;
      const dc = c - center.c;

      // Inverse rotation to find source pixels (Nearest Neighbor)
      const srcC = Math.round(center.c + (dc * cos + dr * sin));
      const srcR = Math.round(center.r + (-dc * sin + dr * cos));

      if (srcR >= 0 && srcR < size && srcC >= 0 && srcC < size) {
        out[r][c] = frame[srcR][srcC];
      }
    }
  }
  return out;
}

// ─── Spell Effect Primitives ───

/** Scans a frame to find the most frequent non-zero palette index. */
export function inferMainColorIndex(frame: Frame): number {
  const counts: Record<number, number> = {};
  for (const row of frame) {
    for (const val of row) {
      if (val !== 0) {
        counts[val] = (counts[val] || 0) + 1;
      }
    }
  }
  let maxCount = 0;
  let mainIndex = 1;
  for (const [idx, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mainIndex = Number(idx);
    }
  }
  return mainIndex;
}

/** Draws a pixel circle with optional shading. */
export function drawCircle(
  frame: Frame, 
  cr: number, 
  cc: number, 
  radius: number, 
  colorIdx: number,
  shades?: { light: number; dark: number }
): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  const r2 = radius * radius;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const dist2 = Math.pow(r - cr, 2) + Math.pow(c - cc, 2);
      if (dist2 <= r2) {
        const dist = Math.sqrt(dist2);
        if (shades && dist < radius * 0.4) {
          out[r][c] = shades.light;
        } else if (shades && dist > radius * 0.8) {
          out[r][c] = shades.dark;
        } else {
          out[r][c] = colorIdx;
        }
      }
    }
  }
  return out;
}

/** Draws radiating lines with optional shading. intensity 0.0 to 1.0 */
export function drawBurst(
  frame: Frame, 
  cr: number, 
  cc: number, 
  intensity: number, 
  colorIdx: number,
  shades?: { light: number; dark: number }
): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  if (intensity <= 0) return out;

  const numLines = Math.floor(12 + intensity * 16);
  const maxLen = (size / 1.5) * intensity;

  for (let i = 0; i < numLines; i++) {
    const angle = (i / numLines) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    for (let step = 0; step < maxLen; step++) {
      const r = Math.round(cr + step * sin);
      const c = Math.round(cc + step * cos);
      if (r >= 0 && r < size && c >= 0 && c < size) {
        if (shades && step < maxLen * 0.3) {
          out[r][c] = shades.light;
        } else if (shades && step > maxLen * 0.7) {
          out[r][c] = shades.dark;
        } else {
          out[r][c] = colorIdx;
        }
      }
    }
  }
  return out;
}

/** Draws a shaded energy beam. */
export function drawBeam(
  frame: Frame,
  cr: number,
  cc: number,
  intensity: number,
  colorIdx: number,
  shades: { light: number; dark: number }
): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  if (intensity <= 0) return out;

  const length = size * intensity;
  const width = Math.max(1, 4 * intensity);

  for (let step = 0; step < length; step++) {
    const c = Math.round(cc + step);
    if (c < 0 || c >= size) continue;

    for (let w = -Math.floor(width/2); w <= Math.ceil(width/2); w++) {
      const r = Math.round(cr + w);
      if (r >= 0 && r < size) {
        const absW = Math.abs(w);
        if (absW === 0) out[r][c] = shades.light;
        else if (absW >= width/2 - 0.5) out[r][c] = shades.dark;
        else out[r][c] = colorIdx;
      }
    }
  }
  return out;
}

/** Draws random energy sparks. */
export function drawSparks(
  frame: Frame,
  cr: number,
  cc: number,
  intensity: number,
  colorIdx: number,
  shades: { light: number; dark: number }
): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  if (intensity <= 0) return out;

  const count = Math.floor(10 + 20 * intensity);
  const spread = 6 * intensity;

  // Use a simple deterministic-ish seeded random based on intensity to avoid flickering if needed,
  // but for sparks, random every frame is fine if callers handle sequence logic.
  for (let i = 0; i < count; i++) {
    const dr = (Math.random() - 0.5) * spread * 2;
    const dc = (Math.random() - 0.5) * spread * 2;
    const r = Math.round(cr + dr);
    const c = Math.round(cc + dc);
    
    if (r >= 0 && r < size && c >= 0 && c < size) {
      const rand = Math.random();
      if (rand > 0.7) out[r][c] = shades.light;
      else if (rand > 0.4) out[r][c] = colorIdx;
      else out[r][c] = shades.dark;
    }
  }
  return out;
}

/** Draws an expanding pulse wave. */
export function drawPulse(
  frame: Frame,
  cr: number,
  cc: number,
  intensity: number,
  colorIdx: number,
  shades: { light: number; dark: number }
): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  if (intensity <= 0) return out;

  const radius = (size / 2) * intensity;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Manhattan distance for diamond shape pulses, or Euclidian for circles
      const dist = Math.sqrt(Math.pow(r - cr, 2) + Math.pow(c - cc, 2));
      
      // Draw rings
      if (Math.abs(dist - radius) < 1) {
        out[r][c] = colorIdx;
      } else if (Math.abs(dist - radius * 0.7) < 0.8) {
        out[r][c] = shades.light;
      } else if (Math.abs(dist - radius * 1.3) < 0.8) {
         // outer faint ring
         out[r][c] = shades.dark;
      }
    }
  }
  return out;
}
