import { SpriteAsset } from '@/lib/types';
import { compositeFrame } from '@/lib/layerUtils';

export const PIXEL_SCALE = 4;

/**
 * Handles exporting the sprite asset as a PNG sprite sheet.
 * Renders all animations or all frames into a grid on a canvas and triggers a download.
 */
export const exportAsPNG = (asset: SpriteAsset) => {
  const hasAnims = asset.animations.length > 0;
  let exportRows: { frameIndices: number[] }[];

  if (hasAnims) {
    exportRows = asset.animations.map(a => ({ frameIndices: a.frameIndices }));
  } else {
    exportRows = [{ frameIndices: asset.layers[0]?.frames.map((_, i) => i) || [0] }];
  }

  const cellSize = asset.size * PIXEL_SCALE;
  const maxCols = Math.max(...exportRows.map(r => r.frameIndices.length));
  const w = maxCols * cellSize;
  const h = exportRows.length * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  exportRows.forEach((row, rowIdx) => {
    const y = rowIdx * cellSize;
    row.frameIndices.forEach((frameIdx, colIdx) => {
      const x = colIdx * cellSize;
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
  link.download = `${asset.id || 'sprite'}-spritesheet.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
