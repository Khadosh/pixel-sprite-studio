import type { Frame } from '@/lib/types';

type Row = number[];
export type AnatomyConfig = {
  neckRow?: number;
  waistRow?: number;
  torsoLeft?: number;
  torsoRight?: number;
};

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
export function squash(frame: Frame, rowsToDrop: number[], colRange?: { start: number, end: number }, topBoundary: number = -1): Frame {
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
 * Shifts only a specific rectangular area of the frame by dr, dc.
 */
export function shiftArea(
  frame: Frame, 
  area: { startR: number; endR: number; startC: number; endC: number }, 
  dr: number, 
  dc: number
): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  const temp = Array.from({ length: size }, () => Array(size).fill(0));

  // Copy area to temp
  for (let r = area.startR; r <= area.endR; r++) {
    for (let c = area.startC; c <= area.endC; c++) {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        temp[r][c] = frame[r][c];
        out[r][c] = 0; // Clear in output
      }
    }
  }

  // Paste shifted area
  for (let r = area.startR; r <= area.endR; r++) {
    for (let c = area.startC; c <= area.endC; c++) {
      const targetR = r + dr;
      const targetC = c + dc;
      if (targetR >= 0 && targetR < size && targetC >= 0 && targetC < size) {
        if (temp[r][c] !== 0) {
          out[targetR][targetC] = temp[r][c];
        }
      }
    }
  }
  return out;
}

/**
 * Simulates a vertical "stretch" by duplicating a row.
 */
export function stretchBody(frame: Frame, rowToDuplicate: number, topBoundary: number = -1): Frame {
  const size = frame.length;
  const out = Array.from({ length: size }, () => Array(size).fill(0));
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let srcR = r;
      if (r < rowToDuplicate && r > topBoundary) {
        srcR = r + 1;
      }
      if (srcR >= 0 && srcR < size) {
        out[r][c] = frame[srcR][c];
      }
    }
  }
  return out;
}

/**
 * Leans the body by shifting rows horizontally in a tapered way.
 * Rows at the top (near neck) shift most, rows at the waist stay fixed.
 */
export function leanBody(frame: Frame, pivotRow: number, topRow: number, deltaX: number): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  
  const height = Math.abs(pivotRow - topRow) || 1;
  const start = Math.min(pivotRow, topRow);
  const end = Math.max(pivotRow, topRow);
  
  for (let r = start; r <= end; r++) {
    const t = (pivotRow - r) / height;
    const shift = Math.round(t * deltaX);
    
    if (shift !== 0) {
      const newRow = new Array(size).fill(0);
      for (let c = 0; c < size; c++) {
        const srcC = c - shift;
        if (srcC >= 0 && srcC < size) {
          newRow[c] = frame[r][srcC];
        }
      }
      out[r] = newRow;
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

interface BodySegments {
  neckRow: number;
  waistRow: number;
  headEndRow: number;
  torsoEndRow: number;
  isHumanoid: boolean;
  torsoLeft: number;
  torsoRight: number;
  leftArmArea?: { startR: number; endR: number; startC: number; endC: number };
  rightArmArea?: { startR: number; endR: number; startC: number; endC: number };
}

/**
 * Analyzes a frame to find key anatomical landmarks (neck, waist, limbs).
 * Values are row indices in the frame grid.
 */
export function analyzeBodySegments(
  frame: Frame, 
  anatomy?: AnatomyConfig
): BodySegments {
  const size = frame.length;
  const bounds = findBounds(frame);
  const com = getCenterOfMass(frame);
  
  // Default values based on proportions (fallback)
  const bodyHeight = bounds ? (bounds.bottom - bounds.top + 1) : size;
  const defaultNeck = bounds ? Math.floor(bounds.top + bodyHeight * 0.35) : Math.floor(size * 0.35);
  const defaultWaist = bounds ? Math.floor(bounds.top + bodyHeight * 0.7) : Math.floor(size * 0.7);

  // Manual Overrides
  let neckRow = anatomy?.neckRow ?? defaultNeck;
  let waistRow = anatomy?.waistRow ?? defaultWaist;

  if (!bounds || !com) {
    return { 
      neckRow, 
      waistRow, 
      headEndRow: neckRow, 
      torsoEndRow: waistRow, 
      isHumanoid: false,
      torsoLeft: 0,
      torsoRight: size - 1
    };
  }

  // 1. Calculate horizontal profile (pixel count per row)
  const profile = frame.map(row => row.filter(p => p !== 0).length);
  let minWidth = size;

  // 2. Find Neck (only if not manually overridden)
  if (anatomy?.neckRow === undefined) {
    const searchStart = bounds.top + Math.floor(bodyHeight * 0.15);
    const searchEnd = Math.floor(com.r);
    
    for (let r = searchStart; r <= searchEnd; r++) {
      if (profile[r] > 0 && profile[r] <= minWidth) {
        minWidth = profile[r];
        neckRow = r;
      }
    }
  }

  // 3. Find Waist (only if not manually overridden)
  if (anatomy?.waistRow === undefined) {
    minWidth = size;
    for (let r = Math.floor(com.r); r < bounds.bottom; r++) {
      if (profile[r] > 0 && profile[r] <= minWidth) {
        minWidth = profile[r];
        waistRow = r;
      }
    }
  }

  // 4. Find Torso Horizontal Span (to identify arms)
  let leftLimit = anatomy?.torsoLeft;
  let rightLimit = anatomy?.torsoRight;

  if (leftLimit === undefined || rightLimit === undefined) {
    const torsoRows = frame.slice(neckRow, waistRow + 1);
    const verticalTorsoProfile = new Array(size).fill(0);
    
    torsoRows.forEach(row => {
      row.forEach((p, c) => { if (p !== 0) verticalTorsoProfile[c]++; });
    });

    const maxTorsoDensity = Math.max(...verticalTorsoProfile);
    const coreThreshold = Math.max(1, Math.floor(maxTorsoDensity * 0.5));

    // Find the WIDEST contiguous span of columns that meet the threshold
    let bestStart = 0;
    let bestEnd = 0;
    let currentStart = -1;

    for (let c = 0; c < size; c++) {
      if (verticalTorsoProfile[c] >= coreThreshold) {
        if (currentStart === -1) currentStart = c;
        if (c - currentStart > bestEnd - bestStart) {
          bestStart = currentStart;
          bestEnd = c;
        }
      } else {
        currentStart = -1;
      }
    }
    
    if (leftLimit === undefined) leftLimit = bestStart;
    if (rightLimit === undefined) rightLimit = bestEnd;
  }

  // 5. Identify Limbs (Arms are any pixels outside this high-density core)
  const hasLeftArm = bounds.left < leftLimit;
  const hasRightArm = bounds.right > rightLimit;

  const maxWidth = Math.max(...profile);

  return {
    neckRow,
    waistRow,
    headEndRow: neckRow,
    torsoEndRow: waistRow,
    isHumanoid: profile[neckRow] < maxWidth * 0.9,
    torsoLeft: leftLimit,
    torsoRight: rightLimit,
    leftArmArea: hasLeftArm ? { 
      startR: neckRow, 
      endR: bounds.bottom, 
      startC: bounds.left, 
      endC: leftLimit - 1 
    } : undefined,
    rightArmArea: hasRightArm ? { 
      startR: neckRow, 
      endR: bounds.bottom, 
      startC: rightLimit + 1, 
      endC: bounds.right 
    } : undefined
  };
}

// ─── Public animation generators ───

/** Idle: frame0 = base, frame1 = squashed body (breathing) */
export function generateIdle(
  base: Frame, 
  anatomy?: AnatomyConfig
): [Frame, Frame] {
  const bounds = findBounds(base);
  const com = getCenterOfMass(base);
  if (!bounds || !com) return [cloneFrame(base), cloneFrame(base)];

  const { neckRow, waistRow } = analyzeBodySegments(base, anatomy);

  // We squash a row in the torso to simulate breathing
  const midDrop = Math.floor((neckRow + waistRow) / 2);
  const rowsToDrop = [midDrop].filter(r => r > neckRow && r < waistRow);
  
  // squash only the torso area, leave head (above neckRow) and feet (below waistRow) stable
  const squashed = squash(base, rowsToDrop, undefined, neckRow);
  
  return [cloneFrame(base), squashed];
}

/** Walk: alternating feet and stabilized upper body with arm swing */
export function generateWalk(
  base: Frame, 
  anatomy?: AnatomyConfig
): [Frame, Frame] {
  const size = base.length;
  const bounds = findBounds(base);
  const com = getCenterOfMass(base);
  if (!bounds || !com) return [cloneFrame(base), cloneFrame(base)];

  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, leftArmArea, rightArmArea } = segments;
  const centerCol = Math.floor(com.c);
  
  const leftLegArea = { startR: waistRow, endR: bounds.bottom, startC: bounds.left, endC: centerCol };
  const rightLegArea = { startR: waistRow, endR: bounds.bottom, startC: centerCol + 1, endC: bounds.right };

  // Frame 1: Left foot stays, Right foot lifts 1px. 
  // Arm swing: Left arm lifts, Right arm drops (opposition)
  let f1 = shiftArea(base, rightLegArea, -1, 0);
  if (leftArmArea) f1 = shiftArea(f1, leftArmArea, -1, 0);
  if (rightArmArea) f1 = shiftArea(f1, rightArmArea, 1, 0);
  f1 = leanBody(f1, waistRow, neckRow, -1);

  // Frame 2: Right foot stays, Left foot lifts 1px.
  // Arm swing: Right arm lifts, Left arm drops
  let f2 = shiftArea(base, leftLegArea, -1, 0);
  if (rightArmArea) f2 = shiftArea(f2, rightArmArea, -1, 0);
  if (leftArmArea) f2 = shiftArea(f2, leftArmArea, 1, 0);
  f2 = leanBody(f2, waistRow, neckRow, 1);
  
  return [f1, f2];
}

/** Attack: forward lunge with arm extension */
export function generateAttack(
  base: Frame, 
  anatomy?: AnatomyConfig
): [Frame, Frame] {
  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, rightArmArea } = segments;
  
  // Frame 1: Anticipation (slight recoil)
  const f1 = leanBody(base, waistRow, neckRow, -1);
  
  // Frame 2: Lunge forward + Arm extension
  let f2 = leanBody(base, waistRow, neckRow, 2);
  // If we find a right arm, extend it specifically
  if (rightArmArea) {
    f2 = shiftArea(f2, rightArmArea, 0, 1);
  }
  // Shift whole body slightly forward
  f2 = shiftRight(f2, 1);
  
  return [f1, f2];
}

/** Attack/Cast: frame0 = base, frame1 = base with lean, arm elevation, and glow */
export function generateCast(
  base: Frame, 
  glowColor: number, 
  anatomy?: AnatomyConfig
): [Frame, Frame] {
  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, leftArmArea, rightArmArea } = segments;
  
  // Lean back during charging
  let lean = leanBody(base, waistRow, neckRow, -1);
  
  // Lift arms during prep
  if (leftArmArea) lean = shiftArea(lean, leftArmArea, -1, 0);
  if (rightArmArea) lean = shiftArea(lean, rightArmArea, -1, 0);
  
  return [cloneFrame(base), addGlow(lean, glowColor)];
}

/** Hurt: recoil lean backward + squash */
export function generateHurt(
  base: Frame, 
  anatomy?: AnatomyConfig
): [Frame, Frame] {
  const { neckRow, waistRow } = analyzeBodySegments(base, anatomy);
  const bounds = findBounds(base);
  
  // Recoil
  let f1 = leanBody(base, waistRow, neckRow, -2);
  f1 = shiftRight(f1, 1);
  
  // Collapse impact
  let f2 = leanBody(base, waistRow, neckRow, -3);
  if (bounds) {
    f2 = squash(f2, [bounds.bottom - 1], undefined, waistRow);
  }
  
  return [f1, f2];
}

/** Jump: Frame 1 = Squash (prep), Frame 2 = Fly (whole body shift) */
export function generateJump(
  base: Frame, 
  anatomy?: AnatomyConfig
): [Frame, Frame] {
  const bounds = findBounds(base);
  const segments = analyzeBodySegments(base, anatomy);
  const { waistRow } = segments;
  
  if (!bounds) return [cloneFrame(base), cloneFrame(base)];

  // Frame 1: Prep (Squash lower half)
  const f1 = squash(base, [bounds.bottom - 1], undefined, waistRow);
  
  // Frame 2: In the air! Shift EVERYTHING above bottom 1-2px up.
  // We shift the whole character (core + limbs + head)
  const flyArea = { startR: bounds.top, endR: bounds.bottom, startC: 0, endC: base.length - 1 };
  const f2 = shiftArea(base, flyArea, -2, 0);
  
  return [f1, f2];
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

/** Resize a frame using nearest neighbor scaling. */
export function resizeFrameNearest(frame: Frame, newW: number, newH: number): Frame {
  const oldH = frame.length;
  if (oldH === 0) return [];
  const oldW = frame[0].length;
  
  const out = Array.from({ length: newH }, () => Array(newW).fill(0));
  
  for (let r = 0; r < newH; r++) {
    for (let c = 0; c < newW; c++) {
      const srcR = Math.floor((r * oldH) / newH);
      const srcC = Math.floor((c * oldW) / newW);
      out[r][c] = frame[srcR][srcC];
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
