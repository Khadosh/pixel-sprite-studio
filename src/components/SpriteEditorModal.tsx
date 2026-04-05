import { useState, useCallback, useMemo, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Save, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import type { SpriteAsset } from '@/lib/types';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import SpritePixelEditor from '@/components/SpritePixelEditor';
import PaletteBar from '@/components/PaletteBar';
import EditorToolbar from '@/components/EditorToolbar';
import SpritePreview from '@/components/SpritePreview';
import { PaletteProvider } from '@/hooks/usePalette';
import { generateAnimationsClientSide, moveFrame } from '@/lib/spriteAnimations';
import { useGenerateAnimation } from '@/hooks/useGenerateAnimation';
import { 
  ensureLayerSupport, 
  compositeFrame, 
  addEmptyFrameToAllLayers, 
  removeFrameFromAllLayers, 
  duplicateFrameInAllLayers 
} from '@/lib/layerUtils';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'scale-105' : 'opacity-60 hover:opacity-90'}`}
    >
      <canvas
        ref={canvasRef}
        width={THUMB_SIZE} height={THUMB_SIZE}
        className={`rounded border-2 ${isActive ? 'border-purple-500' : 'border-border'}`}
        style={{ imageRendering: 'pixelated', width: THUMB_SIZE, height: THUMB_SIZE }}
      />
      <span className="font-mono text-[8px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SortableFrameThumb({ frameIndex, children }: { frameIndex: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: frameIndex.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="shrink-0">
      {children}
    </div>
  );
}

export default function SpriteEditorModal({
  open, onOpenChange, initialAsset, onSave, generatePrompt, onRegenerate, isGenerating
}: SpriteEditorModalProps) {
  const [editedAsset, setEditedAsset] = useState<SpriteAsset>(() => ensureLayerSupport(initialAsset));
  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => editedAsset.layers[0]?.id || null);
  
  const [selectedAnims, setSelectedAnims] = useState<string[]>(() => {
    return initialAsset.animations.map(a => a.name);
  });
  const [editingFrameIndex, setEditingFrameIndex] = useState(0);
  const [viewingAnimation, setViewingAnimation] = useState<string>('base');
  const [assetName, setAssetName] = useState(initialAsset.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [onionSkin, setOnionSkin] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Start drag only after moving 5px
      },
    })
  );

  const visibleFramesIndices = useMemo(() => {
    if (viewingAnimation === 'base' || editedAsset.animations.length === 0) {
      return [0]; // base frame is always index 0
    }
    const anim = editedAsset.animations.find(a => a.name === viewingAnimation);
    if (!anim) return [0];
    return [...new Set(anim.frameIndices)];
  }, [editedAsset.animations, viewingAnimation]);

  const onionGhostFrames = useMemo(() => {
    if (!onionSkin) return { prev: undefined, next: undefined };
    const currentIndex = visibleFramesIndices.indexOf(editingFrameIndex);
    const prevIndex = currentIndex > 0 ? visibleFramesIndices[currentIndex - 1] : -1;
    const nextIndex = currentIndex < visibleFramesIndices.length - 1 ? visibleFramesIndices[currentIndex + 1] : -1;
    return {
      prev: prevIndex >= 0 ? compositeFrame(editedAsset, prevIndex) : undefined,
      next: nextIndex >= 0 ? compositeFrame(editedAsset, nextIndex) : undefined,
    };
  }, [onionSkin, visibleFramesIndices, editingFrameIndex, editedAsset]);

  const frameCount = editedAsset.layers[0]?.frames.length || editedAsset.frames?.length || 0;

  useEffect(() => {
    if (editingFrameIndex >= frameCount) {
      setEditingFrameIndex(0);
    }
  }, [frameCount, editingFrameIndex]);

  // Sync state if initialAsset changes (e.g. from regeneration)
  useEffect(() => {
    const migrated = ensureLayerSupport(initialAsset);
    setEditedAsset(migrated);
    setAssetName(initialAsset.name);
    setSelectedAnims(initialAsset.animations.map(a => a.name));
    setEditingFrameIndex(0);
    setViewingAnimation('base');
    if (migrated.layers[0]) setActiveLayerId(migrated.layers[0].id);
  }, [initialAsset]);

  const { isGenerating: isAnimGenerating, currentAnimation, error: animError, generateAnimationsSequence } = useGenerateAnimation();

  const {
    tool, setTool,
    activeColorKey, setActiveColorKey,
    brushSize, setBrushSize,
    mirrorX, setMirrorX, draftFrame,
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, pushUndo, canUndo,
  } = usePixelEditor(editedAsset, editingFrameIndex, activeLayerId, (updated) => {
    setEditedAsset(updated);
  });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case 'b': setTool('pencil'); break;
        case 'e': setTool('eraser'); break;
        case 'i': setTool('picker'); break;
        case 'g': setTool('fill'); break;
        case 'm': setMirrorX(prev => !prev); break;
        case 'z': 
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undo();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, setMirrorX, undo]);

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

  const handleDuplicateFrame = useCallback((idx: number) => {
    setEditedAsset(prev => duplicateFrameInAllLayers(prev, idx));
  }, []);

  const handleDeleteFrame = useCallback((idx: number) => {
    if (editingFrameIndex === idx) setEditingFrameIndex(Math.max(0, idx - 1));
    else if (editingFrameIndex > idx) setEditingFrameIndex(editingFrameIndex - 1);
    setEditedAsset(prev => removeFrameFromAllLayers(prev, idx));
  }, [editingFrameIndex]);

  const handleInsertEmptyFrame = useCallback((idx: number) => {
    setEditedAsset(prev => addEmptyFrameToAllLayers(prev, idx));
  }, []);

  const handleMoveFrame = useCallback((fromIdx: number, toIdx: number) => {
    if (editingFrameIndex === fromIdx) setEditingFrameIndex(toIdx);
    else if (editingFrameIndex === toIdx) setEditingFrameIndex(fromIdx);
    setEditedAsset(prev => moveFrame(prev, fromIdx, toIdx));
  }, [editingFrameIndex]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = parseInt(active.id as string);
      const overId = parseInt(over.id as string);

      if (!isNaN(activeId) && !isNaN(overId)) {
        if (viewingAnimation === 'base') return;

        setEditedAsset(prev => {
          const animIndex = prev.animations.findIndex(a => a.name === viewingAnimation);
          if (animIndex === -1) return prev;

          const anim = prev.animations[animIndex];
          
          // Reordenar estrictamente la secuencia visible de la animación sin tocar la memoria global
          const oldTimelineIndex = anim.frameIndices.indexOf(activeId);
          const newTimelineIndex = anim.frameIndices.indexOf(overId);

          if (oldTimelineIndex !== -1 && newTimelineIndex !== -1) {
            const newFrameIndices = arrayMove(anim.frameIndices, oldTimelineIndex, newTimelineIndex);
            const newAnimations = [...prev.animations];
            newAnimations[animIndex] = { ...anim, frameIndices: newFrameIndices };
            return { ...prev, animations: newAnimations };
          }
          return prev;
        });
      }
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

      const newLayers = prev.layers.map(layer => ({
        ...layer,
        frames: layer.frames.map(f =>
          f.map(r => r.map(c => c === key ? 0 : c))
        )
      }));

      return {
        ...prev,
        palette: newPalette,
        colorNames: newColorNames,
        layers: newLayers,
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

  const handleSave = () => {
    onSave({ ...editedAsset, name: assetName });
    onOpenChange(false);
  };

  const frameLabels = useMemo(() => {
    const labels: string[] = frameCount > 0 ? Array.from({ length: frameCount }, (_, i) => `F${i}`) : [];
    for (const anim of editedAsset.animations) {
      const uniqueIndices = [...new Set(anim.frameIndices)];
      uniqueIndices.forEach((fi, seq) => {
        if (fi < labels.length) {
          labels[fi] = `${anim.label} ${seq + 1}`;
        }
      });
    }
    return labels;
  }, [editedAsset.animations, frameCount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-none h-[95vh] max-h-none flex flex-col bg-card border-border p-4 gap-4 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0 pr-12">
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
                onionSkin={onionSkin}
                onToggleOnionSkin={() => setOnionSkin(p => !p)}
                mirrorX={mirrorX}
                onToggleMirrorX={() => setMirrorX(p => !p)}
              />
            </div>
            {/* CANVAS AREA */}
            <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
              <SpritePixelEditor
                asset={editedAsset}
                frameIndex={editingFrameIndex}
                activeColorKey={activeColorKey}
                activeLayerId={activeLayerId}
                tool={tool}
                brushSize={brushSize}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                draftFrame={draftFrame}
                onionSkinPrevFrame={onionGhostFrames.prev}
                onionSkinNextFrame={onionGhostFrames.next}
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
            {frameCount > 0 ? (
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

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={visibleFramesIndices.map(i => i.toString())} strategy={horizontalListSortingStrategy}>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 pb-1 px-1 items-end min-h-[50px]">
                      {visibleFramesIndices.map((frameIndex) => (
                        <SortableFrameThumb key={frameIndex} frameIndex={frameIndex}>
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <div>
                                  <FrameThumb
                                    frame={compositeFrame(editedAsset, frameIndex)}
                                    palette={editedAsset.palette}
                                    size={editedAsset.size}
                                    isActive={frameIndex === editingFrameIndex}
                                    label={frameLabels[frameIndex]}
                                    onClick={() => setEditingFrameIndex(frameIndex)}
                                  />
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={() => handleDuplicateFrame(frameIndex)}>
                                  Duplicar Frame
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleInsertEmptyFrame(frameIndex)}>
                                  Insertar Vacío (Después)
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem disabled={frameIndex === 0} onClick={() => handleDeleteFrame(frameIndex)} className="text-red-500 hover:text-red-400">
                                  Eliminar Frame
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                        </SortableFrameThumb>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
