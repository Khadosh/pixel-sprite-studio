import type { Frame } from '../types';
import { cloneFrame } from './transforms';

/** Infers the most common color in a frame. */
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
  const rows = frame.length;
  const cols = frame[0]?.length ?? rows;
  const out = cloneFrame(frame);
  const r2 = radius * radius;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
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
  const rows = frame.length;
  const cols = frame[0]?.length ?? rows;
  const size = Math.min(rows, cols);
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
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
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
  const rows = frame.length;
  const cols = frame[0]?.length ?? rows;
  const out = cloneFrame(frame);
  if (intensity <= 0) return out;

  const length = cols * intensity;
  const width = Math.max(1, 4 * intensity);

  for (let step = 0; step < length; step++) {
    const c = Math.round(cc + step);
    if (c < 0 || c >= cols) continue;

    for (let w = -Math.floor(width/2); w <= Math.ceil(width/2); w++) {
      const r = Math.round(cr + w);
      if (r >= 0 && r < rows) {
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
  shades: { light: number; dark: number },
  rng: () => number = Math.random
): Frame {
  const rows = frame.length;
  const cols = frame[0]?.length ?? rows;
  const out = cloneFrame(frame);
  if (intensity <= 0) return out;

  // Calibrated on a 16px canvas; bigger canvases get proportionally more sparks.
  const unit = Math.min(rows, cols) / 16;
  const count = Math.floor((10 + 20 * intensity) * unit * unit);
  const spread = 6 * intensity * unit;

  for (let i = 0; i < count; i++) {
    // Polar sampling: a round cloud, denser near the center.
    const angle = rng() * Math.PI * 2;
    const dist = Math.sqrt(rng()) * spread;
    const r = Math.round(cr + Math.sin(angle) * dist);
    const c = Math.round(cc + Math.cos(angle) * dist);
    
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      const rand = rng();
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
  const rows = frame.length;
  const cols = frame[0]?.length ?? rows;
  const out = cloneFrame(frame);
  if (intensity <= 0) return out;

  const radius = (Math.min(rows, cols) / 2) * intensity;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dist = Math.sqrt(Math.pow(r - cr, 2) + Math.pow(c - cc, 2));
      if (Math.abs(dist - radius) < 1) {
        out[r][c] = colorIdx;
      } else if (Math.abs(dist - radius * 0.7) < 0.8) {
        out[r][c] = shades.light;
      } else if (Math.abs(dist - radius * 1.3) < 0.8) {
         out[r][c] = shades.dark;
      }
    }
  }
  return out;
}

/** Adds a glow effect to a frame. */
export function addGlow(frame: Frame, colorIndex: number): Frame {
  const rows = frame.length;
  const cols = frame[0]?.length ?? rows;
  const out = cloneFrame(frame);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (frame[r][c] === 0) {
        const hasNeighbor = 
          (r > 0 && frame[r-1][c] !== 0) ||
          (r < rows-1 && frame[r+1][c] !== 0) ||
          (c > 0 && frame[r][c-1] !== 0) ||
          (c < cols-1 && frame[r][c+1] !== 0);
        if (hasNeighbor) out[r][c] = colorIndex;
      }
    }
  }
  return out;
}
