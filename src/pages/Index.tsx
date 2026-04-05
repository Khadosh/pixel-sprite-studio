import { useCallback, useRef } from 'react';
import SpriteSheetCanvas from '@/components/SpriteSheetCanvas';
import SpritePreview from '@/components/SpritePreview';
import { PIXEL_WARRIOR_ASSET } from '@/lib/pixelCharacterAsset';
import { usePalette } from '@/hooks/usePalette';
import { Download, RotateCcw } from 'lucide-react';

const PIXEL_SCALE = 4;
const GRID_GAP = 1;

export default function Index() {
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { palette, setPaletteColor, resetPalette } = usePalette();
  const asset = PIXEL_WARRIOR_ASSET;
  const CELL_SIZE = asset.size * PIXEL_SCALE;

  const handleExportPNG = useCallback(() => {
    const rows = asset.animations.length > 0
      ? asset.animations.map(a => a.frameIndices)
      : [asset.frames.map((_, i) => i)];

    const maxCols = Math.max(...rows.map(r => r.length));
    const w = maxCols * (CELL_SIZE + GRID_GAP) - GRID_GAP;
    const h = rows.length * (CELL_SIZE + GRID_GAP) - GRID_GAP;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    rows.forEach((frameIndices, rowIdx) => {
      const y = rowIdx * (CELL_SIZE + GRID_GAP);
      frameIndices.forEach((frameIdx, colIdx) => {
        const x = colIdx * (CELL_SIZE + GRID_GAP);
        const frame = asset.frames[frameIdx];
        if (!frame) return;
        for (let row = 0; row < asset.size; row++) {
          for (let col = 0; col < asset.size; col++) {
            const val = frame[row][col];
            if (val === 0) continue;
            const color = palette[val];
            if (!color || color === 'transparent') continue;
            ctx.fillStyle = color;
            ctx.fillRect(
              x + col * PIXEL_SCALE,
              y + row * PIXEL_SCALE,
              PIXEL_SCALE,
              PIXEL_SCALE
            );
          }
        }
      });
    });

    const link = document.createElement('a');
    link.download = 'spritesheet.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [palette, asset, CELL_SIZE]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="font-pixel text-primary text-lg md:text-xl tracking-wider">
            PIXEL SPRITE SHEET
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            Character animation grid • {asset.size}×{asset.size} px • Transparent export
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 overflow-x-auto">
            <div className="bg-card rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[10px] text-muted-foreground tracking-wider">
                  SPRITE GRID
                </span>
                <button
                  onClick={handleExportPNG}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-pixel bg-primary text-primary-foreground rounded border border-primary hover:brightness-110 transition-all"
                >
                  <Download size={14} />
                  EXPORT PNG
                </button>
              </div>
              <div className="overflow-x-auto">
                <SpriteSheetCanvas asset={asset} onCanvasReady={(c) => { exportCanvasRef.current = c; }} />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-64">
            <div className="bg-card rounded-lg border border-border p-4">
              <SpritePreview asset={asset} />
            </div>
          </div>
        </div>

        {/* Palette Editor */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-pixel text-[10px] text-muted-foreground tracking-wider">
              PALETTE
            </span>
            <button
              onClick={resetPalette}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-pixel text-muted-foreground bg-secondary rounded border border-border hover:border-primary/50 transition-colors"
            >
              <RotateCcw size={10} />
              RESET
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(palette).filter(([k]) => k !== '0').map(([key, color]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <div
                    className="w-6 h-6 rounded-sm border border-border group-hover:border-primary/60 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setPaletteColor(Number(key), e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono group-hover:text-foreground transition-colors">
                  {asset.colorNames[Number(key)] || key}
                </span>
              </label>
            ))}
          </div>
        </div>

        <footer className="text-center text-[10px] text-muted-foreground font-mono pb-4">
          {asset.animations.length} states • {asset.frames.length} frames • {asset.size}×{asset.size} px • transparent PNG export
        </footer>
      </div>
    </div>
  );
}
