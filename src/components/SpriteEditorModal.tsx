import { useState, useCallback, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Save, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import type { SpriteAsset } from '@/lib/types';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import SpritePixelEditor from '@/components/SpritePixelEditor';
import PaletteBar from '@/components/PaletteBar';
import EditorToolbar from '@/components/EditorToolbar';
import SpritePreview from '@/components/SpritePreview';
import { PaletteProvider } from '@/hooks/usePalette';
import { generateAnimationsClientSide } from '@/lib/spriteAnimations';
import { useGenerateAnimation } from '@/hooks/useGenerateAnimation';

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
  generatePrompt?: string;
  onRegenerate?: () => void;
  isGenerating?: boolean;
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
  open, onOpenChange, initialAsset, onSave, generatePrompt, onRegenerate, isGenerating
}: SpriteEditorModalProps) {
  const [editedAsset, setEditedAsset] = useState<SpriteAsset>(initialAsset);
  const [selectedAnims, setSelectedAnims] = useState<string[]>(() => {
    return initialAsset.animations.map(a => a.name);
  });
  const [editingFrameIndex, setEditingFrameIndex] = useState(0);
  const [viewingAnimation, setViewingAnimation] = useState<string>('base');
  const [assetName, setAssetName] = useState(initialAsset.name);
  const [isEditingName, setIsEditingName] = useState(false);

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
  }, [editedAsset.frames, editingFrameIndex]);

  // Sync state if initialAsset changes (e.g. from regeneration)
  useEffect(() => {
    setEditedAsset(initialAsset);
    setAssetName(initialAsset.name);
    setSelectedAnims(initialAsset.animations.map(a => a.name));
    setEditingFrameIndex(0);
    setViewingAnimation('base');
  }, [initialAsset]);

  const { isGenerating: isAnimGenerating, currentAnimation, error: animError, generateAnimationsSequence } = useGenerateAnimation();

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

  const handleGenerateAnimationsAI = async () => {
    if (selectedAnims.length === 0) return;
    await generateAnimationsSequence(editedAsset, selectedAnims, (updatedAsset) => {
      setEditedAsset(updatedAsset);
      if (updatedAsset.animations.length > 0) {
        setViewingAnimation(updatedAsset.animations[updatedAsset.animations.length - 1].name);
        setEditingFrameIndex(updatedAsset.animations[updatedAsset.animations.length - 1].frameIndices[0]);
      }
    });
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
        frames: newFrames,
      };
    });
    if (activeColorKey === key) setActiveColorKey(1);
  }, [activeColorKey, setActiveColorKey]);

  const handleExportPNG = () => {
    const asset = editedAsset;
    const hasAnims = asset.animations.length > 0;
    let exportRows: { frameIndices: number[] }[];

    if (hasAnims) {
      exportRows = asset.animations.map(a => ({ frameIndices: a.frameIndices }));
    } else {
      exportRows = [{ frameIndices: asset.frames.map((_, i) => i) }];
    }

    const cellSize = asset.size * PIXEL_SCALE;
    const maxCols = Math.max(...exportRows.map(r => r.frameIndices.length));
    const w = maxCols * cellSize;
    const h = exportRows.length * cellSize;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    exportRows.forEach((row, rowIdx) => {
      const y = rowIdx * cellSize;
      row.frameIndices.forEach((frameIdx, colIdx) => {
        const x = colIdx * cellSize;
        const frame = asset.frames[frameIdx];
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

  const handleSave = () => {
    onSave({ ...editedAsset, name: assetName });
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
      <DialogContent className="w-[95vw] max-w-none h-[95vh] max-h-none flex flex-col bg-card border-border p-4 gap-4 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                autoFocus
                type="text"
                value={assetName}
                onChange={e => setAssetName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
                className="bg-background border border-purple-500 rounded px-2 py-1 text-sm font-pixel text-primary outline-none"
              />
            ) : (
              <DialogTitle
                className="font-pixel text-sm text-primary tracking-wider flex items-center gap-2 cursor-pointer hover:text-purple-400 transition-colors"
                onClick={() => setIsEditingName(true)}
                title="Click para editar nombre"
              >
                {assetName.toUpperCase()} — EDITOR
                <Edit2 size={12} className="opacity-50" />
              </DialogTitle>
            )}
          </div>
          {generatePrompt && onRegenerate && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline-block max-w-[300px] truncate">
                Prompt: "{generatePrompt}"
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={onRegenerate}
                disabled={isGenerating || isAnimGenerating}
                className="font-pixel text-[10px] border-purple-500 text-purple-400 hover:bg-purple-600/20"
              >
                {isGenerating ? 'GENERANDO...' : 'REGENERAR'}
                {!isGenerating && <Sparkles size={12} className="ml-1" />}
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* MAIN BODY: 3 Columns */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
          
          {/* LEFT: Target only Palette now */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
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
          </div>

          {/* CENTER: Canvas */}
          <div className="flex-1 min-w-0 bg-black/40 rounded-lg border border-border flex flex-col overflow-hidden relative">
            {/* TOOLBAR HEADER */}
            <div className="flex-shrink-0 border-b border-border bg-secondary/30 p-2 flex justify-center">
              <EditorToolbar
                tool={tool}
                onToolChange={setTool}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                canUndo={canUndo}
                onUndo={undo}
              />
            </div>
            {/* CANVAS AREA */}
            <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
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
            </div>
          </div>

          {/* RIGHT: Preview & Animation Controls */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pl-1 custom-scrollbar">
            {editedAsset.animations.length > 0 && (
              <div className="bg-secondary/30 rounded-lg border border-border p-4">
                <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block mb-3">PREVIEW</span>
                <PaletteProvider defaultPalette={editedAsset.palette}>
                  <SpritePreview asset={editedAsset} animationName={viewingAnimation} />
                </PaletteProvider>
              </div>
            )}
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
              <div className="flex flex-col gap-2 w-full pt-1">
                <Button
                  onClick={handleGenerateAnimations}
                  disabled={selectedAnims.length === 0 || isAnimGenerating}
                  className="w-full font-pixel text-[8px] bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                  title="Generación instantánea por matemática"
                >
                  QUICK MATCH (ALGORITHMIC)
                </Button>
                <Button
                  onClick={handleGenerateAnimationsAI}
                  disabled={selectedAnims.length === 0 || isAnimGenerating}
                  className="w-full font-pixel text-[8px] bg-purple-600 text-white hover:bg-purple-500 border border-purple-500"
                  title="Generación de alta calidad usando IA (consume tokens)"
                >
                  <Sparkles size={12} className="mr-1" />
                  {isAnimGenerating ? `GENERANDO... ${currentAnimation?.substring(0, 4).toUpperCase()}` : 'GENERAR CON IA'}
                </Button>
              </div>
              {animError && (
                <div className="text-red-400 text-[10px] mt-1 break-words">{animError}</div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER: Timeline + Save Actions */}
        <div className="flex flex-col xl:flex-row items-end justify-between pt-3 border-t border-border gap-4 flex-shrink-0">
          {/* Timeline Strip */}
          <div className="flex-1 min-w-0 max-w-full overflow-hidden flex flex-col bg-secondary/20 p-2 rounded-lg border border-border">
            {editedAsset.frames.length > 0 ? (
              <div className="flex flex-col gap-2 w-full">
                {editedAsset.animations.length > 0 && (
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <span className="font-pixel text-[8px] text-muted-foreground shrink-0">ANIMACIONES:</span>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 pb-1">
                      <button
                        onClick={() => { setViewingAnimation('base'); setEditingFrameIndex(0); }}
                        className={`text-[8px] font-pixel px-2 py-1 rounded transition-colors ${viewingAnimation === 'base' ? 'bg-purple-600 border border-purple-500 text-white' : 'bg-background border border-border text-muted-foreground hover:border-purple-500/50 hover:text-foreground'}`}
                      >
                        BASE
                      </button>
                      {editedAsset.animations.map(a => (
                        <button
                          key={a.name}
                          onClick={() => { setViewingAnimation(a.name); setEditingFrameIndex(a.frameIndices[0]); }}
                          className={`text-[8px] font-pixel px-2 py-1 rounded transition-colors ${viewingAnimation === a.name ? 'bg-purple-600 border border-purple-500 text-white' : 'bg-background border border-border text-muted-foreground hover:border-purple-500/50 hover:text-foreground'}`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 pb-1">
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
            ) : (
              <span className="font-pixel text-[10px] text-muted-foreground">SIN FRAMES</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 shrink-0">
            <Button onClick={handleExportPNG} variant="outline" className="font-pixel text-[10px]">
              <Download size={14} className="mr-2" />
              EXPORTAR
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="font-pixel text-[10px]">
                CERRAR
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
