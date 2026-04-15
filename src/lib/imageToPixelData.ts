import { Frame } from './types';
import { getColorName } from './colorUtils';

// ─── Types ────────────────────────────────────────────────────────────

interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface PixelizeOptions {
  /** Target grid size (e.g. 16 or 32) */
  targetSize: number;
  /** Maximum number of colors in the output palette (4–32). Default: 16. Ignored if fixedPalette is provided. */
  maxColors?: number;
  /** Alpha value below which a pixel is treated as transparent (0–255). Default: 128 */
  alphaThreshold?: number;
  /** Optional pre-defined palette to map colors to. If provided, medianCut is skipped. Map index -> hex. */
  fixedPalette?: Record<number, string>;
}

export interface PixelizeResult {
  frame: Frame;
  palette: Record<number, string>;
  colorNames: Record<number, string>;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Converts raw RGBA ImageData into a pixel art Frame with a quantized palette.
 */
export function imageToPixelData(
  imageData: ImageData,
  options: PixelizeOptions
): PixelizeResult {
  const { targetSize, maxColors = 16, alphaThreshold = 128, fixedPalette } = options;
  const { data, width, height } = imageData;

  // --- Step 1: Sample pixels from ImageData into an NxN grid ---
  const grid: (RGB | null)[][] = [];

  for (let row = 0; row < targetSize; row++) {
    const gridRow: (RGB | null)[] = [];
    for (let col = 0; col < targetSize; col++) {
      const srcX = Math.floor((col / targetSize) * width);
      const srcY = Math.floor((row / targetSize) * height);
      const idx = (srcY * width + srcX) * 4;

      const a = data[idx + 3];

      if (a < alphaThreshold) {
        gridRow.push(null);
      } else {
        gridRow.push({ r: data[idx], g: data[idx+1], b: data[idx+2] });
      }
    }
    grid.push(gridRow);
  }

  // --- Step 2: Determine working palette ---
  let finalPalette: Record<number, string>;
  let finalColorNames: Record<number, string>;
  let paletteRgbList: RGB[];

  if (fixedPalette) {
    // USE FIXED PALETTE
    finalPalette = { ...fixedPalette };
    finalColorNames = {};
    paletteRgbList = [];
    
    // Convert hex palette to RGB list for distance calculation
    // Ensure index 0 is always transparent
    finalPalette[0] = 'transparent'; 
    
    Object.entries(fixedPalette).forEach(([idxStr, hex]) => {
      const idx = Number(idxStr);
      if (idx === 0) return;
      
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      // Store RGB and track which index it maps to
      paletteRgbList.push({ r, g, b });
      finalColorNames[idx] = getColorName(hex);
    });
    
    // If fixedPalette doesn't have names, we built them. If it dose, we could use them.
    finalColorNames[0] = 'Transparent';
  } else {
    // GENERATE PALETTE VIA MEDIAN CUT
    const opaqueColors: RGB[] = [];
    for (const row of grid) {
      for (const pixel of row) {
        if (pixel !== null) opaqueColors.push(pixel);
      }
    }

    if (opaqueColors.length === 0) {
      return {
        frame: Array.from({ length: targetSize }, () => Array(targetSize).fill(0)),
        palette: { 0: 'transparent' },
        colorNames: { 0: 'Transparent' },
      };
    }

    paletteRgbList = medianCut(opaqueColors, maxColors);
    finalPalette = { 0: 'transparent' };
    finalColorNames = { 0: 'Transparent' };

    paletteRgbList.forEach((color, i) => {
      const hex = rgbToHex(color.r, color.g, color.b);
      finalPalette[i + 1] = hex;
      finalColorNames[i + 1] = getColorName(hex);
    });
  }

  // --- Step 3: Map grid cells to palette indices ---
  const frame: Frame = grid.map(row =>
    row.map(pixel => {
      if (pixel === null) return 0;
      
      // Find nearest color in paletteRgbList
      const bestIdxInList = nearestPaletteIndex(pixel, paletteRgbList);
      
      if (fixedPalette) {
        // Find which original index this RGB maps to
        const hex = rgbToHex(paletteRgbList[bestIdxInList].r, paletteRgbList[bestIdxInList].g, paletteRgbList[bestIdxInList].b);
        const entries = Object.entries(fixedPalette);
        const match = entries.find(([_, val]) => val.toLowerCase() === hex.toLowerCase());
        return match ? Number(match[0]) : 0;
      }
      
      return bestIdxInList + 1; // 1-indexed for generated palette
    })
  );

  return { frame, palette: finalPalette, colorNames: finalColorNames };
}

// ─── Median Cut Color Quantization ───────────────────────────────────

/**
 * Reduces a list of RGB colors to at most `maxColors` representative colors
 * using the Median Cut algorithm.
 */
export function medianCut(colors: RGB[], maxColors: number): RGB[] {
  if (colors.length === 0) return [];
  if (maxColors <= 1) return [averageColor(colors)];

  // Deduplicate to avoid wasted buckets on identical colors
  const uniqueMap = new Map<string, { color: RGB; count: number }>();
  for (const c of colors) {
    const key = `${c.r},${c.g},${c.b}`;
    const existing = uniqueMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      uniqueMap.set(key, { color: c, count: 1 });
    }
  }

  const uniqueEntries = Array.from(uniqueMap.values());

  // If unique colors <= maxColors, just return them directly
  if (uniqueEntries.length <= maxColors) {
    return uniqueEntries.map(e => e.color);
  }

  // Build initial bucket with weighted entries
  type Bucket = { entries: { color: RGB; count: number }[] };
  let buckets: Bucket[] = [{ entries: uniqueEntries }];

  while (buckets.length < maxColors) {
    // Find bucket with the largest color range to split
    let bestIdx = 0;
    let bestRange = -1;

    for (let i = 0; i < buckets.length; i++) {
      const range = getMaxRange(buckets[i].entries.map(e => e.color));
      if (range > bestRange && buckets[i].entries.length > 1) {
        bestRange = range;
        bestIdx = i;
      }
    }

    const bucket = buckets[bestIdx];
    if (bucket.entries.length <= 1) break; // Can't split further

    const channel = getWidestChannel(bucket.entries.map(e => e.color));

    // Sort by the widest channel
    bucket.entries.sort((a, b) => a.color[channel] - b.color[channel]);

    // Split at the median (weighted by count)
    const totalCount = bucket.entries.reduce((sum, e) => sum + e.count, 0);
    let accumulated = 0;
    let splitIndex = 0;

    for (let i = 0; i < bucket.entries.length; i++) {
      accumulated += bucket.entries[i].count;
      if (accumulated >= totalCount / 2) {
        splitIndex = i + 1;
        break;
      }
    }

    // Ensure we actually split
    if (splitIndex === 0) splitIndex = 1;
    if (splitIndex >= bucket.entries.length) splitIndex = bucket.entries.length - 1;

    const left: Bucket = { entries: bucket.entries.slice(0, splitIndex) };
    const right: Bucket = { entries: bucket.entries.slice(splitIndex) };

    buckets.splice(bestIdx, 1, left, right);
  }

  // Average each bucket to get the final palette colors
  return buckets.map(bucket => {
    let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
    for (const entry of bucket.entries) {
      totalR += entry.color.r * entry.count;
      totalG += entry.color.g * entry.count;
      totalB += entry.color.b * entry.count;
      totalWeight += entry.count;
    }
    return {
      r: Math.round(totalR / totalWeight),
      g: Math.round(totalG / totalWeight),
      b: Math.round(totalB / totalWeight),
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Converts RGB values to a hex color string. */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Finds the palette index with the smallest euclidean distance to the given pixel. */
export function nearestPaletteIndex(pixel: RGB, palette: RGB[]): number {
  let minDist = Infinity;
  let bestIdx = 0;

  for (let i = 0; i < palette.length; i++) {
    const dr = pixel.r - palette[i].r;
    const dg = pixel.g - palette[i].g;
    const db = pixel.b - palette[i].b;
    const dist = dr * dr + dg * dg + db * db; // Skip sqrt for performance
    if (dist < minDist) {
      minDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

function averageColor(colors: RGB[]): RGB {
  if (colors.length === 0) return { r: 0, g: 0, b: 0 };
  let r = 0, g = 0, b = 0;
  for (const c of colors) {
    r += c.r;
    g += c.g;
    b += c.b;
  }
  const n = colors.length;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

function getWidestChannel(colors: RGB[]): 'r' | 'g' | 'b' {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (const c of colors) {
    if (c.r < minR) minR = c.r;
    if (c.r > maxR) maxR = c.r;
    if (c.g < minG) minG = c.g;
    if (c.g > maxG) maxG = c.g;
    if (c.b < minB) minB = c.b;
    if (c.b > maxB) maxB = c.b;
  }
  const rangeR = maxR - minR;
  const rangeG = maxG - minG;
  const rangeB = maxB - minB;
  if (rangeR >= rangeG && rangeR >= rangeB) return 'r';
  if (rangeG >= rangeR && rangeG >= rangeB) return 'g';
  return 'b';
}

function getMaxRange(colors: RGB[]): number {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (const c of colors) {
    if (c.r < minR) minR = c.r;
    if (c.r > maxR) maxR = c.r;
    if (c.g < minG) minG = c.g;
    if (c.g > maxG) maxG = c.g;
    if (c.b < minB) minB = c.b;
    if (c.b > maxB) maxB = c.b;
  }
  return Math.max(maxR - minR, maxG - minG, maxB - minB);
}
