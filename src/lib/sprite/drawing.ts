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


/**
 * Draws a lightning bolt: a jagged path from (r0,c0) to (r1,c1) with a few
 * branches, core in `shades.light`, body in colorIdx, halo in `shades.dark`.
 * intensity 0..1 scales thickness and branches; rng makes it reproducible.
 */
export function drawBolt(
  frame: Frame,
  r0: number,
  c0: number,
  r1: number,
  c1: number,
  intensity: number,
  colorIdx: number,
  shades: { light: number; dark: number },
  rng: () => number = Math.random
): Frame {
  const rows = frame.length;
  const cols = frame[0]?.length ?? rows;
  const out = cloneFrame(frame);
  if (intensity <= 0) return out;
  const put = (r: number, c: number, idx: number, onlyEmpty = false) => {
    const rr = Math.round(r), cc = Math.round(c);
    if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) return;
    if (onlyEmpty && out[rr][cc] !== 0) return;
    out[rr][cc] = idx;
  };
  const path = (ra: number, ca: number, rb: number, cb: number, jitter: number, width: number) => {
    const steps = Math.max(2, Math.round(Math.hypot(rb - ra, cb - ca)));
    let r = ra, c = ca;
    const pts: [number, number][] = [[r, c]];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const tr = ra + (rb - ra) * t, tc = ca + (cb - ca) * t;
      r = tr + (rng() - 0.5) * jitter * (1 - Math.abs(t - 0.5) * 2 * 0.3);
      c = tc + (rng() - 0.5) * jitter;
      if (i === steps) { r = rb; c = cb; }
      pts.push([r, c]);
    }
    for (let i = 1; i < pts.length; i++) {
      const [pr, pc] = pts[i - 1], [qr, qc] = pts[i];
      const n = Math.max(1, Math.round(Math.hypot(qr - pr, qc - pc) * 2));
      for (let k = 0; k <= n; k++) {
        const t = k / n, rr = pr + (qr - pr) * t, cc = pc + (qc - pc) * t;
        for (let w = -width; w <= width; w++) {
          put(rr, cc + w, Math.abs(w) === 0 ? shades.light : colorIdx, Math.abs(w) > 0);
        }
        put(rr, cc - width - 1, shades.dark, true);
        put(rr, cc + width + 1, shades.dark, true);
      }
    }
    return pts;
  };
  const width = intensity > 0.66 ? 1 : 0;
  const main = path(r0, c0, r1, c1, 3 * intensity + 1, width);
  const branches = Math.round(intensity * 3);
  for (let b = 0; b < branches; b++) {
    const [br, bc] = main[Math.floor(rng() * (main.length - 2)) + 1];
    const len = (rows / 4) * intensity;
    const dir = rng() < 0.5 ? -1 : 1;
    path(br, bc, br + len * 0.8, bc + dir * len * (0.5 + rng() * 0.5), 2, 0);
  }
  return out;
}
