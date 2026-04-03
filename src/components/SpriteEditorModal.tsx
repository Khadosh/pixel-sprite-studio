import { useState, useCallback, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SpriteAsset } from '@/lib/types';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import SpritePixelEditor from '@/components/SpritePixelEditor';
import PaletteBar from '@/components/PaletteBar';
import EditorToolbar from '@/components/EditorToolbar';
import SpritePreview from '@/components/SpritePreview';
import { PaletteProvider } from '@/hooks/usePalette';
import { generateAnimationsClientSide } from '@/lib/spriteAnimations';

const PIXEL_SCALE = 4;
const THUMB_SCALE = 4;
const THUMB_SIZE = 16 * THUMB_SCALE;

const AVAILABLE_ANIMS = [
  { value: 'idle', label: 'Idle' },
  { value: 'walk', label: 'Walk' },
  { value: 'attack', label: 'Attack' },
  { value: 'cast', label: 'Cast' },
  { value: 'hurt', label: 'Hurt' },
  { value: 'jump', label: 'Jump' },
];

interface SpriteEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAsset: SpriteAsset;
  onSave: (asset: SpriteAsset) => void;
}

function FrameThumb({
  frame, palette, size, isActive, label, onClick,
}: {
  frame: number[][]; palette: Record<number, string>; size: number;
  isActive: boolean; label: string; onClick: () => void;
}) {
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE);
      for (let y = 0; y < THUMB_SIZE; y += 8) {
        for (let x = 0; x < THUMB_SIZE; x += 8) {
          ctx.fillStyle = ((x / 8 + y / 8) % 2 === 0) ? '#1a1a2e' : '#22223a';
          ctx.fillRect(x, y, 8, 8);
        }
      }
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const val = frame[r][c];
          if (val === 0) continue;
          const color = palette[val];
          if (!color || color === 'transparent') continue;
          ctx.fillStyle = color;
          ctx.fillRect(c * THUMB_SCALE, r * THUMB_SCALE, THUMB_SCALE, THUMB_SCALE);
        }
      }
    },
    [frame, palette, size],
  );

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'scale-105' : 'opacity-60 hover:opacity-90'}`}
    >
      <canvas
        ref={canvasRef}
        width={THUMB_SIZE} height={THUMB_SIZE}
        className={`rounded border-2 ${isActive ? 'border-purple-500' : 'border-border'}`}
        style={{ imageRendering: 'pixelated', width: THUMB_SIZE, height: THUMB_SIZE }}
      />
      <span className="font-mono text-[8px] text-muted-foreground">{label}</span>
    </button>
  );
}

export default function SpriteEditorModal({
  open, onOpenChange, initialAsset, onSave,
}: SpriteEditorModalProps) {
  const [editedAsset, setEditedAsset] = useState<SpriteAsset>(initialAsset);
  const [selectedAnims, setSelectedAnims] = useState<string[]>(() => {
    // Init from existing animations
    return initialAsset.animations.map(a => a.name);
  });
  const [editingFrameIndex, setEditingFrameIndex] = useState(0);
  const [viewingAnimation, setViewingAnimation] = useState<string>('base');

  const visibleFramesIndices = useMemo(() => {
    if (viewingAnimation === 'base' || editedAsset.animations.length === 0) {
      return [0]; // base frame is always index 0
    }
    const anim = editedAsset.animations.find(a => a.name === viewingAnimation);
    if (!anim) return [0];
    return [...new Set(anim.frameIndices)];
  }, [editedAsset.animations, viewingAnimation]);

  useEffect(() => {
    if (editingFrameIndex >= editedAsset.frames.length) {
      setEditingFrameIndex(0);
    }
  }, [editedAsset.frames.length, editingFrameIndex]);

  const {
    tool, setTool,
    activeColorKey, setActiveColorKey,
    brushSize, setBrushSize,
    paintPixel, erasePixel, pushUndo,
    undo, canUndo,
  } = usePixelEditor(editedAsset, editingFrameIndex, (updated) => {
    setEditedAsset(updated);
  });

  const toggleAnim = (anim: string) => {
    setSelectedAnims(prev =>
      prev.includes(anim) ? prev.filter(a => a !== anim) : [...prev, anim],
    );
  };

  const handleGenerateAnimations = () => {
    // Generate only the ones in selectedAnims and leave the others intact
    const withAnims = generateAnimationsClientSide(editedAsset, selectedAnims);
    setEditedAsset(withAnims);

    if (withAnims.animations.length > 0) {
      setViewingAnimation(withAnims.animations[0].name);
      setEditingFrameIndex(withAnims.animations[0].frameIndices[0]);
    } else {
      setViewingAnimation('base');
      setEditingFrameIndex(0);
    }
  };

  const handleChangeColor = useCallback((key: number, color: string) => {
    setEditedAsset(prev => ({
      ...prev,
      palette: { ...prev.palette, [key]: color },
    }));
  }, []);

  const handleAddColor = useCallback(() => {
    setEditedAsset(prev => {
      const keys = Object.keys(prev.palette).map(Number).filter(k => k > 0);
      const newKey = keys.length > 0 ? Math.max(...keys) + 1 : 1;
      return {
        ...prev,
        palette: { ...prev.palette, [newKey]: '#888888' },
        colorNames: { ...prev.colorNames, [newKey]: `Color ${newKey}` },
      };
    });
  }, []);

  const handleRemoveColor = useCallback((key: number) => {
    setEditedAsset(prev => {
      const newPalette = { ...prev.palette };
      delete newPalette[key];
      const newColorNames = { ...prev.colorNames };
      delete newColorNames[key];

      const newFrames = prev.frames.map(f =>
        f.map(r => r.map(c => c === key ? 0 : c))
      );

      return {
        ...prev,
        palette: newPalette,
        colorNames: newColorNames,
        frames: newFrames
      };
    });
    if (activeColorKey === key) setActiveColorKey(1);
  }, [activeColorKey, setActiveColorKey]);

  const handleExportPNG = () => {
    const asset = editedAsset;
    const hasAnims = asset.animations.length > 0;
    let rows: { frameIndices: number[] }[];

    if (hasAnims) {
      rows = asset.animations.map(a => ({ frameIndices: a.frameIndices }));
    } else {
      rows = [{ frameIndices: asset.frames.map((_, i) => i) }];
    }

    const cellSize = asset.size * PIXEL_SCALE;
    const maxCols = Math.max(...rows.map(r => r.frameIndices.length));
    const w = maxCols * cellSize;
    const h = rows.length * cellSize;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    rows.forEach((row, rowIdx) => {
      const y = rowIdx * cellSize;
      row.frameIndices.forEach((frameIdx, colIdx) => {
        const x = colIdx * cellSize;
        const frame = asset.frames[frameIdx];
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

  const handleSave = () => {
    onSave(editedAsset);
    onOpenChange(false);
  };

  const frameLabels = useMemo(() => {
    const labels: string[] = editedAsset.frames.map((_, i) => `F${i}`);
    for (const anim of editedAsset.animations) {
      const uniqueIndices = [...new Set(anim.frameIndices)];
      uniqueIndices.forEach((fi, seq) => {
        if (fi < labels.length) {
          labels[fi] = `${anim.label} ${seq + 1}`;
        }
      });
    }
    return labels;
  }, [editedAsset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-primary tracking-wider">
            {editedAsset.name.toUpperCase()} — EDITOR
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Pixel Editor + Frame selector */}
          <div className="space-y-4">
            <EditorToolbar
              tool={tool}
              onToolChange={setTool}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              canUndo={canUndo}
              onUndo={undo}
            />
            <SpritePixelEditor
              asset={editedAsset}
              frameIndex={editingFrameIndex}
              activeColorKey={activeColorKey}
              tool={tool}
              brushSize={brushSize}
              onPaintPixel={paintPixel}
              onErasePixel={erasePixel}
              onStrokeStart={pushUndo}
            />

            {/* Frame selector strip */}
            {editedAsset.frames.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {editedAsset.animations.length > 0 && (
                    <div className="flex gap-1 overflow-x-auto">
                      <button
                        onClick={() => { setViewingAnimation('base'); setEditingFrameIndex(0); }}
                        className={`text-[8px] font-pixel px-2 py-1 rounded border transition-colors ${viewingAnimation === 'base' ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'border-border text-muted-foreground hover:border-purple-500/50'}`}
                      >
                        BASE
                      </button>
                      {editedAsset.animations.map(a => (
                        <button
                          key={a.name}
                          onClick={() => { setViewingAnimation(a.name); setEditingFrameIndex(a.frameIndices[0]); }}
                          className={`text-[8px] font-pixel px-2 py-1 rounded border transition-colors ${viewingAnimation === a.name ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'border-border text-muted-foreground hover:border-purple-500/50'}`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const currentVisibleIdx = visibleFramesIndices.indexOf(editingFrameIndex);
                        if (currentVisibleIdx > 0) {
                          setEditingFrameIndex(visibleFramesIndices[currentVisibleIdx - 1]);
                        }
                      }}
                      disabled={visibleFramesIndices.indexOf(editingFrameIndex) <= 0}
                      className="p-1 rounded border border-border text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => {
                        const currentVisibleIdx = visibleFramesIndices.indexOf(editingFrameIndex);
                        if (currentVisibleIdx < visibleFramesIndices.length - 1) {
                          setEditingFrameIndex(visibleFramesIndices[currentVisibleIdx + 1]);
                        }
                      }}
                      disabled={visibleFramesIndices.indexOf(editingFrameIndex) >= visibleFramesIndices.length - 1 || visibleFramesIndices.indexOf(editingFrameIndex) === -1}
                      className="p-1 rounded border border-border text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {visibleFramesIndices.map((frameIndex) => {
                    const frame = editedAsset.frames[frameIndex];
                    if (!frame) return null;
                    return (
                      <FrameThumb
                        key={frameIndex}
                        frame={frame}
                        palette={editedAsset.palette}
                        size={editedAsset.size}
                        isActive={frameIndex === editingFrameIndex}
                        label={frameLabels[frameIndex]}
                        onClick={() => setEditingFrameIndex(frameIndex)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview + Palette + Animations */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Preview */}
            {editedAsset.animations.length > 0 && (
              <div className="bg-secondary/30 rounded-lg border border-border p-4">
                <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block mb-3">PREVIEW</span>
                <PaletteProvider defaultPalette={editedAsset.palette}>
                  <SpritePreview asset={editedAsset} animationName={viewingAnimation} />
                </PaletteProvider>
              </div>
            )}

            {/* Palette */}
            <div className="bg-secondary/30 rounded-lg border border-border p-4">
              <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block mb-3">PALETTE</span>
              <PaletteBar
                palette={editedAsset.palette}
                colorNames={editedAsset.colorNames}
                activeColorKey={activeColorKey}
                onSelectColor={setActiveColorKey}
                onChangeColor={handleChangeColor}
                onAddColor={handleAddColor}
                onRemoveColor={handleRemoveColor}
              />
            </div>

            {/* Animation Controls — always visible */}
            <div className="bg-secondary/30 rounded-lg border border-border p-4 space-y-3">
              <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block">ANIMACIONES</span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ANIMS.map(anim => {
                  const active = selectedAnims.includes(anim.value);
                  return (
                    <button
                      key={anim.value}
                      type="button"
                      onClick={() => toggleAnim(anim.value)}
                      className={`px-3 py-1.5 text-[10px] font-pixel rounded border transition-all ${active
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                        : 'bg-secondary/30 border-border text-muted-foreground hover:border-purple-500/50'
                        }`}
                    >
                      {anim.label.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={handleGenerateAnimations}
                disabled={selectedAnims.length === 0}
                className="w-full font-pixel text-[10px] bg-purple-600 text-white hover:bg-purple-500 border border-purple-500"
              >
                <Sparkles size={14} className="mr-2" />
                {editedAsset.animations.length > 0 ? 'REGENERAR ANIMACIONES' : 'GENERAR ANIMACIONES'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button onClick={handleExportPNG} variant="outline" className="font-pixel text-[10px]">
            <Download size={14} className="mr-2" />
            EXPORT PNG
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-pixel text-[10px]">
              CANCELAR
            </Button>
            <Button
              onClick={handleSave}
              className="font-pixel text-[10px] bg-primary text-primary-foreground hover:bg-primary/80 border border-primary"
            >
              <Save size={14} className="mr-2" />
              GUARDAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
