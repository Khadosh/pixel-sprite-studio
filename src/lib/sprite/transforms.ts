import type { Frame } from '../types';

/** Deep clone a frame grid */
export function cloneFrame(frame: Frame): Frame {
  return frame.map(row => [...row]);
}

/** Finds the bounding box of non-transparent pixels */
export function findBounds(frame: Frame) {
  let top = frame.length, bottom = 0, left = frame[0].length, right = 0;
  let hasPixels = false;
  for (let r = 0; r < frame.length; r++) {
    for (let c = 0; c < frame[r].length; c++) {
      if (frame[r][c] !== 0) {
        hasPixels = true;
        if (r < top) top = r;
        if (r > bottom) bottom = r;
        if (c < left) left = c;
        if (c > right) right = c;
      }
    }
  }
  return hasPixels ? { top, bottom, left, right } : null;
}

/** Calculates the center of mass for a frame */
export function getCenterOfMass(frame: Frame) {
  let sumR = 0, sumC = 0, count = 0;
  for (let r = 0; r < frame.length; r++) {
    for (let c = 0; c < frame[r].length; c++) {
      if (frame[r][c] !== 0) {
        sumR += r;
        sumC += c;
        count++;
      }
    }
  }
  return count > 0 ? { r: sumR / count, c: sumC / count } : null;
}

/** Shifts an area of a frame by (dr, dc) */
export function shiftArea(
  frame: Frame, 
  area: { startR: number; endR: number; startC: number; endC: number }, 
  dr: number, 
  dc: number
): Frame {
  const next = cloneFrame(frame);
  const size = frame.length;
  
  // Clear the original area in the NEW frame first
  for (let r = area.startR; r <= area.endR; r++) {
    for (let c = area.startC; c <= area.endC; c++) {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        next[r][c] = 0;
      }
    }
  }
  
  // Place pixels in new position
  for (let r = area.startR; r <= area.endR; r++) {
    for (let c = area.startC; c <= area.endC; c++) {
      if (frame[r][c] !== 0) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          next[nr][nc] = frame[r][c];
        }
      }
    }
  }
  return next;
}

/** Horizontal lean (skew) from a pivot row */
export function leanBody(frame: Frame, pivotRow: number, topRow: number, shift: number): Frame {
  const next = cloneFrame(frame);
  const size = frame.length;
  for (let r = 0; r <= pivotRow; r++) {
    const factor = (pivotRow - r) / (pivotRow - topRow || 1);
    const rowShift = Math.round(shift * factor);
    if (rowShift === 0) continue;
    
    const row = [...frame[r]];
    for (let c = 0; c < size; c++) next[r][c] = 0;
    for (let c = 0; c < size; c++) {
      if (row[c] !== 0) {
        const nc = c + rowShift;
        if (nc >= 0 && nc < size) next[r][nc] = row[c];
      }
    }
  }
  return next;
}

/** Vertically stretches the body at a specific row (e.g. neck) */
export function stretchBody(frame: Frame, pivotRow: number): Frame {
  const size = frame.length;
  const next = Array.from({ length: size }, () => Array(size).fill(0));
  const pr = Math.round(pivotRow);
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (frame[r][c] !== 0) {
        if (r <= pr) {
          if (r - 1 >= 0) next[r - 1][c] = frame[r][c];
        } else {
          next[r][c] = frame[r][c];
        }
      }
    }
  }
  // Fill neck gap
  for (let c = 0; c < size; c++) {
    if (frame[pr] && frame[pr][c] !== 0) {
      next[pr][c] = frame[pr][c];
    }
  }
  return next;
}

/** Vertically squashes the body by removing specific rows */
export function squash(frame: Frame, rowsToRemove: number[], keepBottom = true, pivotRow?: number): Frame {
  const size = frame.length;
  const next = Array.from({ length: size }, () => Array(size).fill(0));
  const removeSet = new Set(rowsToRemove.map(r => Math.round(r)));
  
  let targetR = keepBottom ? size - 1 : 0;
  const step = keepBottom ? -1 : 1;
  const start = keepBottom ? size - 1 : 0;
  const end = keepBottom ? -1 : size;

  for (let r = start; r !== end; r += step) {
    if (removeSet.has(r)) continue;
    for (let c = 0; c < size; c++) {
      if (frame[r][c] !== 0) {
        next[targetR][c] = frame[r][c];
      }
    }
    targetR += step;
  }
  return next;
}

/** Flips a frame horizontally */
export function flipHorizontal(frame: Frame): Frame {
  return frame.map(row => [...row].reverse());
}

/** Shifts/Translates a frame by delta row/col. Clips at edges. */
export function shiftFrame(frame: Frame, dr: number, dc: number): Frame {
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

/** Flip vertical */
export function flipVertical(frame: Frame): Frame {
  const size = frame.length;
  const out = cloneFrame(frame);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      out[r][c] = frame[size - 1 - r][c];
    }
  }
  return out;
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
      const dr = r - center.r;
      const dc = c - center.c;
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

/** Rotates a specific area around a pivot point */
export function rotateArea(
  frame: Frame,
  area: { startR: number; endR: number; startC: number; endC: number },
  pivot: { r: number; c: number },
  angleDeg: number
): Frame {
  const size = frame.length;
  const next = cloneFrame(frame);
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // 1. Clear original area
  for (let r = area.startR; r <= area.endR; r++) {
    for (let c = area.startC; c <= area.endC; c++) {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        next[r][c] = 0;
      }
    }
  }

  // 2. Map rotated pixels
  for (let r = area.startR; r <= area.endR; r++) {
    for (let c = area.startC; c <= area.endC; c++) {
      if (frame[r][c] !== 0) {
        const dr = r - pivot.r;
        const dc = c - pivot.c;
        const nr = Math.round(pivot.r + (dr * cos - dc * sin));
        const nc = Math.round(pivot.c + (dr * sin + dc * cos));
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          next[nr][nc] = frame[r][c];
        }
      }
    }
  }
  return next;
}

/** 
 * Shifts an area vertically but stretches the pixels to fill the gap.
 * Useful for limbs to maintain connection to the torso.
 */
export function stretchArea(
  source: Frame,
  target: Frame,
  area: { startR: number; endR: number; startC: number; endC: number },
  dr: number,
  pivotSide: 'top' | 'bottom' = 'top'
): Frame {
  const size = source.length;
  const next = cloneFrame(target);
  if (dr === 0) return next;

  // 1. Move pixels from SOURCE to TARGET (OVERWRITE)
  // We don't clear the target area first to allow for a "smear/stretch" effect
  // that maintains connectivity naturally.
  for (let r = area.startR; r <= area.endR; r++) {
    for (let c = area.startC; c <= area.endC; c++) {
      const nr = r + dr;
      if (source[r][c] !== 0 && nr >= 0 && nr < size) {
        next[nr][c] = source[r][c];
      }
    }
  }

  // 2. Handle Gaps if dr > 1 (fill the middle pixels)
  if (Math.abs(dr) > 1) {
    for (let r = area.startR; r <= area.endR; r++) {
      for (let c = area.startC; c <= area.endC; c++) {
        if (source[r][c] !== 0) {
          // Fill all pixels between r and r+dr
          const step = dr > 0 ? 1 : -1;
          for (let i = step; Math.abs(i) < Math.abs(dr); i += step) {
            const nr = r + i;
            if (nr >= 0 && nr < size) next[nr][c] = source[r][c];
          }
        }
      }
    }
  }

  return next;
}

/** 
 * Shifts a specific list of pixels by (dr, dc). 
 * Unlike shiftArea, this works on non-rectangular masks.
 */
export function shiftPixels(
  frame: Frame,
  pixels: { r: number; c: number }[],
  dr: number,
  dc: number
): Frame {
  const next = cloneFrame(frame);
  const size = frame.length;
  
  // 1. Clear original pixels
  pixels.forEach(p => {
    if (p.r >= 0 && p.r < size && p.c >= 0 && p.c < size) {
      next[p.r][p.c] = 0;
    }
  });
  
  // 2. Place in new position
  pixels.forEach(p => {
    const nr = p.r + dr;
    const nc = p.c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      // Get the color from the ORIGINAL frame
      next[nr][nc] = frame[p.r][p.c];
    }
  });
  
  return next;
}

/**
 * Rotates a specific list of pixels around a pivot.
 * Uses nearest-neighbor mapping.
 */
export function rotatePixels(
  frame: Frame,
  pixels: { r: number; c: number }[],
  pivot: { r: number; c: number },
  angleDeg: number
): Frame {
  const size = frame.length;
  const next = cloneFrame(frame);
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // 1. Clear original pixels
  pixels.forEach(p => {
    if (p.r >= 0 && p.r < size && p.c >= 0 && p.c < size) {
      next[p.r][p.c] = 0;
    }
  });

  // 2. Map rotated pixels
  pixels.forEach(p => {
    const dr = p.r - pivot.r;
    const dc = p.c - pivot.c;
    const nr = Math.round(pivot.r + (dr * cos - dc * sin));
    const nc = Math.round(pivot.c + (dr * sin + dc * cos));
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      next[nr][nc] = frame[p.r][p.c];
    }
  });
  
  return next;
}

/**
 * Shifts a pixel list but stretches them to fill the gap.
 */
export function stretchPixels(
  source: Frame,
  target: Frame,
  pixels: { r: number; c: number }[],
  dr: number
): Frame {
  const size = source.length;
  const next = cloneFrame(target);
  if (dr === 0 || pixels.length === 0) return next;

  // 1. Move pixels
  pixels.forEach(p => {
    const nr = p.r + dr;
    if (nr >= 0 && nr < size) {
      next[nr][p.c] = source[p.r][p.c];
    }
  });

  // 2. Fill gaps (stretch)
  if (Math.abs(dr) > 1) {
    pixels.forEach(p => {
      const step = dr > 0 ? 1 : -1;
      for (let i = step; Math.abs(i) < Math.abs(dr); i += step) {
        const nr = p.r + i;
        if (nr >= 0 && nr < size) next[nr][p.c] = source[p.r][p.c];
      }
    });
  }

  return next;
}

/** Rotates a frame 90 degrees */
export function rotate90(frame: Frame): Frame {
  const size = frame.length;
  const next = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      next[c][size - 1 - r] = frame[r][c];
    }
  }
  return next;
}

/** Shift all non-zero pixels down by `px` rows. Top rows become transparent. */
export function shiftDown(frame: Frame, px: number): Frame {
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

/** Shift all non-zero pixels right by `px` columns. Left columns become transparent. */
export function shiftRight(frame: Frame, px: number): Frame {
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
