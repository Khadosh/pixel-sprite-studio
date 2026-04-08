import { SpriteAsset } from '@/lib/types';
import { compositeFrame } from '@/lib/layerUtils';
import { GifWriter } from 'omggif';
import { saveAs } from 'file-saver';

export const PIXEL_SCALE = 4;
const LABEL_WIDTH = 80;

/**
 * Handles exporting the sprite asset as a PNG sprite sheet.
 */
export const exportAsPNG = (asset: SpriteAsset, options: { includeLabels?: boolean } = {}) => {
  const { includeLabels } = options;
  const hasAnims = asset.animations.length > 0;
  let exportRows: { label: string; frameIndices: number[] }[];

  if (hasAnims) {
    exportRows = asset.animations.map(a => ({ label: a.label, frameIndices: a.frameIndices }));
  } else {
    exportRows = [{ label: 'Base', frameIndices: asset.layers[0]?.frames.map((_, i) => i) || [0] }];
  }

  const cellSize = asset.size * PIXEL_SCALE;
  const maxCols = Math.max(...exportRows.map(r => r.frameIndices.length));
  
  const labelOffset = includeLabels ? LABEL_WIDTH : 0;
  const w = maxCols * cellSize + labelOffset;
  const h = exportRows.length * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  if (includeLabels) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Courier New", monospace';
    ctx.textBaseline = 'middle';
  }

  exportRows.forEach((row, rowIdx) => {
    const y = rowIdx * cellSize;
    
    if (includeLabels) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(row.label.toUpperCase(), 5, y + cellSize / 2);
    }

    row.frameIndices.forEach((frameIdx, colIdx) => {
      const x = labelOffset + colIdx * cellSize;
      const frame = compositeFrame(asset, frameIdx);
      if (!frame) return;
      
      for (let fRow = 0; fRow < asset.size; fRow++) {
        for (let fCol = 0; fCol < asset.size; fCol++) {
          const val = frame[fRow][fCol];
          if (val === 0) continue;
          const color = asset.palette[val];
          if (!color || color === 'transparent') continue;
          ctx.fillStyle = color;
          ctx.fillRect(x + fCol * PIXEL_SCALE, y + fRow * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        }
      }
    });
  });

  const link = document.createElement('a');
  link.download = `${asset.id || 'sprite'}-spritesheet${includeLabels ? '-labeled' : ''}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/**
 * Handles exporting the selected animation as an animated GIF using omggif.
 */
export const exportAsGIF = async (asset: SpriteAsset, animationName: string, fps: number = 10) => {
  const anim = asset.animations.find(a => a.name === animationName);
  const frameIndices = anim ? anim.frameIndices : [0];
  
  const GIF_SCALE = 10;
  const size = asset.size * GIF_SCALE;
  
  // Prepare a large enough buffer for the GIF
  const buffer = new Uint8Array(size * size * frameIndices.length + 1024 * 1024);
  const gifWriter = new GifWriter(buffer, size, size, { loop: 0 });

  // Map palette to omggif colors (integers)
  // omggif expectations: palette is an array of colors
  // and each frame is an array of indices into that palette.
  const paletteKeys = Object.keys(asset.palette).map(Number).sort((a, b) => a - b);
  const colorMap = new Map<number, number>();
  const gifPalette: number[] = [];

  // Transparents handling: omggif has a transparent option in addFrame
  let transparentIndex = -1;

  paletteKeys.forEach((key, idx) => {
    const hex = asset.palette[key];
    if (hex === 'transparent') {
      transparentIndex = idx;
      gifPalette.push(0); // Placeholder
    } else {
      // Convert hex to integer
      const colorInt = parseInt(hex.replace('#', ''), 16);
      gifPalette.push(colorInt);
    }
    colorMap.set(key, idx);
  });

  // Ensure palette is a power of 2 for omggif
  while (gifPalette.length < 2 || (gifPalette.length & (gifPalette.length - 1)) !== 0) {
    gifPalette.push(0);
  }

  for (const frameIdx of frameIndices) {
    const frame = compositeFrame(asset, frameIdx);
    if (!frame) continue;

    const frameData = new Uint8Array(size * size);
    
    for (let r = 0; r < asset.size; r++) {
      for (let c = 0; c < asset.size; c++) {
        const val = frame[r][c];
        const paletteIdx = colorMap.has(val) ? colorMap.get(val)! : 0;
        
        // Scale the pixel
        for (let sr = 0; sr < GIF_SCALE; sr++) {
          for (let sc = 0; sc < GIF_SCALE; sc++) {
             frameData[(r * GIF_SCALE + sr) * size + (c * GIF_SCALE + sc)] = paletteIdx;
          }
        }
      }
    }

    gifWriter.addFrame(0, 0, size, size, frameData as any, {
      palette: gifPalette,
      delay: Math.round(100 / fps),
      transparent: transparentIndex >= 0 ? transparentIndex : undefined
    });
  }

  const gifLength = gifWriter.getOutputBufferPosition();
  const blob = new Blob([buffer.slice(0, gifLength)], { type: 'image/gif' });
  saveAs(blob, `${asset.id || 'sprite'}-${animationName}.gif`);
};
