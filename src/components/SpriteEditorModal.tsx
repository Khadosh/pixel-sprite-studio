import { useState, useCallback, useMemo, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Save, ChevronLeft, ChevronRight, Edit2, Plus, Trash2, Eye, EyeOff, Lock, Unlock, Layers, ChevronUp, ChevronDown, CheckSquare, Square, Info, Play, Pause, Plus as PlusIcon, Minus as MinusIcon } from 'lucide-react';
import { useAssetPreview } from '@/hooks/useAssetPreview';
import { Checkbox } from '@/components/ui/checkbox';
import type { SpriteAsset } from '@/lib/types';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import SpritePixelEditor from '@/components/SpritePixelEditor';
import PaletteBar from '@/components/PaletteBar';
import EditorToolbar, { EditorScope } from '@/components/EditorToolbar';
import SpritePreview from '@/components/SpritePreview';
import { PaletteProvider } from '@/hooks/usePalette';
import { 
  compositeFrame, ensureLayerSupport, addNewLayer, removeLayer, 
  reorderLayers, renameLayer, toggleLayerVisibility, toggleLayerLock 
} from '@/lib/layerUtils';
import { 
  generateAnimationsClientSide, 
  duplicateFrameInAllLayers, removeFrameFromAllLayers, addEmptyFrameToAllLayers, moveFrame 
} from '@/lib/spriteAnimations';
import { flipHorizontal, flipVertical, rotate90 } from '@/lib/spriteTransforms';
import { useGenerateAnimation } from '@/hooks/useGenerateAnimation';
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
  
  const [selectedAnims, setSelectedAnims] = useState<string[]>([]);
  const [editingFrameIndex, setEditingFrameIndex] = useState(0);
  const [viewingAnimation, setViewingAnimation] = useState<string>('base');
  const [assetName, setAssetName] = useState(initialAsset.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [onionSkin, setOnionSkin] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [scope, setScope] = useState<EditorScope>('layer');
  const [layerClipboard, setLayerClipboard] = useState<number[][] | null>(null);
  const [frameClipboard, setFrameClipboard] = useState<Record<string, number[][]> | null>(null);

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

  const activeLayer = useMemo(() => 
    editedAsset.layers.find(l => l.id === activeLayerId),
    [editedAsset.layers, activeLayerId]
  );

  const filteredPalette = useMemo(() => {
    if (showAllColors || !activeLayer || !activeLayer.paletteIds) return editedAsset.palette;
    
    const filtered: Record<number, string> = { 0: 'transparent' };
    const ids = activeLayer.paletteIds || [];
    ids.forEach(id => {
      if (editedAsset.palette[id]) filtered[id] = editedAsset.palette[id];
    });
    return filtered;
  }, [editedAsset.palette, activeLayer, showAllColors]);

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

  const { isGenerating: isAnimGenerating, currentAnimation: genAnim, error: animError, generateAnimationsSequence } = useGenerateAnimation();

  const previewState = useAssetPreview(editedAsset, viewingAnimation);
  const { isPlaying, setIsPlaying, fps, setFps } = previewState;

  const {
    tool, setTool,
    activeColorKey, setActiveColorKey: setEditorColorKey,
    brushSize, setBrushSize,
    mirrorX, setMirrorX, draftFrame,
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, pushUndo, canUndo,
    overwriteLayerFrame,
    moveOffset,
    rotationAngle,
    rotationCenter,
  } = usePixelEditor(editedAsset, editingFrameIndex, activeLayerId, (updated) => {
    setEditedAsset(updated);
  }, scope);

  const handleCopy = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) setLayerClipboard(frame.map(r => [...r]));
    } else {
      const clipboard: Record<string, number[][]> = {};
      editedAsset.layers.forEach(l => {
        clipboard[l.id] = l.frames[editingFrameIndex].map(r => [...r]);
      });
      setFrameClipboard(clipboard);
    }
  }, [scope, editedAsset, activeLayerId, editingFrameIndex]);

  const handlePaste = useCallback(() => {
    if (scope === 'layer') {
      if (layerClipboard) overwriteLayerFrame(layerClipboard.map(r => [...r]));
    } else {
      if (frameClipboard) {
        setEditedAsset(prev => {
          const newLayers = prev.layers.map(l => {
            if (frameClipboard[l.id]) {
              const newFrames = [...l.frames];
              newFrames[editingFrameIndex] = frameClipboard[l.id].map(r => [...r]);
              return { ...l, frames: newFrames };
            }
            return l;
          });
          return { ...prev, layers: newLayers };
        });
      }
    }
  }, [scope, layerClipboard, frameClipboard, overwriteLayerFrame, editingFrameIndex]);

  const handleFlipH = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(flipHorizontal(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = flipHorizontal(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset, activeLayerId, editingFrameIndex, overwriteLayerFrame]);

  const handleFlipV = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(flipVertical(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = flipVertical(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset, activeLayerId, editingFrameIndex, overwriteLayerFrame]);

  const handleRotate = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(rotate90(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = rotate90(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset, activeLayerId, editingFrameIndex, overwriteLayerFrame]);

  const setActiveColorKey = useCallback((key: number) => {
    setEditorColorKey(key);
    // Auto-assign to layer if in "Show All" mode and we select a global color
    if (showAllColors && activeLayerId) {
      setEditedAsset(prev => {
        const layerIdx = prev.layers.findIndex(l => l.id === activeLayerId);
        if (layerIdx === -1) return prev;
        const layer = prev.layers[layerIdx];
        const pIds = layer.paletteIds || [];
        if (!pIds.includes(key)) {
          const newLayers = [...prev.layers];
          newLayers[layerIdx] = { ...layer, paletteIds: [...pIds, key] };
          return { ...prev, layers: newLayers };
        }
        return prev;
      });
    }
  }, [setEditorColorKey, showAllColors, activeLayerId]);

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
        case 'v': setTool('move'); break;
        case 'r': setTool('rotate'); break;
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

  const selectAllAnims = () => {
    setSelectedAnims(AVAILABLE_ANIMS.map(a => a.value));
  };

  const clearSelection = () => {
    setSelectedAnims([]);
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
    }, activeLayerId);
  };

  const handleChangeColor = useCallback((key: number, color: string) => {
    setEditedAsset(prev => ({
      ...prev,
      palette: { ...prev.palette, [key]: color },
    }));
  }, []);

  const handleRenameColor = useCallback((key: number, name: string) => {
    setEditedAsset(prev => ({
      ...prev,
      colorNames: { ...prev.colorNames, [key]: name },
    }));
  }, []);

  const handleAddColor = useCallback(() => {
    setEditedAsset(prev => {
      const keys = Object.keys(prev.palette).map(Number).filter(k => k > 0);
      const newKey = keys.length > 0 ? Math.max(...keys) + 1 : 1;
      const updatedPalette = { ...prev.palette, [newKey]: '#888888' };
      const updatedColorNames = { ...prev.colorNames, [newKey]: `Color ${newKey}` };
      
      const newLayers = prev.layers.map(layer => {
        if (layer.id === activeLayerId) {
          const pIds = layer.paletteIds || [];
          if (!pIds.includes(newKey)) {
            return { ...layer, paletteIds: [...pIds, newKey] };
          }
        }
        return layer;
      });

      return {
        ...prev,
        palette: updatedPalette,
        colorNames: updatedColorNames,
        layers: newLayers,
      };
    });
  }, [activeLayerId]);

  const handleRemoveColor = useCallback((key: number) => {
    setEditedAsset(prev => {
      const newPalette = { ...prev.palette };
      delete newPalette[key];
      const newColorNames = { ...prev.colorNames };
      delete newColorNames[key];

      return {
        ...prev,
        palette: newPalette,
        colorNames: newColorNames,
        layers: prev.layers.map(layer => ({
          ...layer,
          paletteIds: layer.paletteIds?.filter(id => id !== key),
          frames: layer.frames.map(f =>
            f.map(r => r.map(c => c === key ? 0 : c))
          )
        })),
      };
    });
    if (activeColorKey === key) setActiveColorKey(1);
  }, [activeColorKey, setActiveColorKey]);

  const handleAddLayer = useCallback(() => {
    setEditedAsset(prev => {
      const updated = addNewLayer(prev, `Layer ${prev.layers.length + 1}`);
      setActiveLayerId(updated.layers[updated.layers.length - 1].id);
      return updated;
    });
  }, []);

  const handleRemoveLayer = useCallback((layerId: string) => {
    setEditedAsset(prev => {
      if (prev.layers.length <= 1) return prev;
      const updated = removeLayer(prev, layerId);
      if (activeLayerId === layerId) {
        setActiveLayerId(updated.layers[updated.layers.length - 1].id);
      }
      return updated;
    });
  }, [activeLayerId]);

  const handleToggleLayerVisibility = useCallback((layerId: string) => {
    setEditedAsset(prev => toggleLayerVisibility(prev, layerId));
  }, []);

  const handleToggleLayerLock = useCallback((layerId: string) => {
    setEditedAsset(prev => toggleLayerLock(prev, layerId));
  }, []);

  const handleRenameLayer = useCallback((layerId: string, name: string) => {
    setEditedAsset(prev => renameLayer(prev, layerId, name));
  }, []);

  const handleMoveLayer = useCallback((fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx + 1 : fromIdx - 1;
    if (toIdx < 0 || toIdx >= editedAsset.layers.length) return;
    setEditedAsset(prev => reorderLayers(prev, fromIdx, toIdx));
  }, [editedAsset.layers.length]);

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

          <div className="flex items-center gap-4">
            {generatePrompt && onRegenerate && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline-block max-w-[200px] truncate">
                  Prompt: "{generatePrompt}"
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRegenerate}
                  disabled={isGenerating || isAnimGenerating}
                  className="font-pixel text-[10px] border-purple-500/50 text-purple-400 hover:bg-purple-600/20"
                >
                  {isGenerating ? 'GENERANDO...' : 'REGENERAR'}
                  {!isGenerating && <Sparkles size={12} className="ml-1" />}
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleExportPNG} 
                variant="outline" 
                size="sm"
                className="font-pixel text-[9px] h-8 border-purple-500/30 text-purple-300 hover:bg-purple-600/10"
              >
                <Download size={14} className="mr-2" />
                EXPORTAR
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="font-pixel text-[9px] h-8 bg-green-600 text-white hover:bg-green-500 border border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
              >
                <Save size={14} className="mr-2" />
                GUARDAR
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* MAIN BODY: 3 Columns */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
          
          {/* LEFT: Layers & Palette */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4 overflow-hidden pr-1">
            {/* LAYERS */}
            <div className="bg-secondary/30 rounded-lg border border-border p-4 flex flex-col min-h-0 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="font-pixel text-[10px] text-muted-foreground tracking-wider uppercase">LAYERS</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 text-purple-400 hover:text-purple-300 hover:bg-purple-600/20"
                  onClick={handleAddLayer}
                >
                  <Plus size={14} />
                </Button>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                {[...editedAsset.layers].reverse().map((layer, revIdx) => {
                  const idx = editedAsset.layers.length - 1 - revIdx;
                  const isActive = layer.id === activeLayerId;

                  return (
                    <div 
                      key={layer.id}
                      onClick={() => setActiveLayerId(layer.id)}
                      className={`group flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-purple-600/20 border-purple-500/50 text-foreground' 
                          : 'bg-background/20 border-transparent hover:bg-secondary/40 text-muted-foreground'
                      }`}
                    >
                      <button 
                        className={`hover:text-primary transition-colors ${!layer.isVisible && 'text-muted-foreground/30'}`}
                        onClick={(e) => { e.stopPropagation(); handleToggleLayerVisibility(layer.id); }}
                      >
                        {layer.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <Layers size={10} className="shrink-0 opacity-40" />
                        <span className="truncate font-pixel text-[10px]">
                          {layer.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newName = prompt('Enter new layer name:', layer.name);
                            if (newName) handleRenameLayer(layer.id, newName);
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); handleMoveLayer(idx, 'up'); }}
                          disabled={idx === editedAsset.layers.length - 1}
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); handleMoveLayer(idx, 'down'); }}
                          disabled={idx === 0}
                        >
                          <ChevronDown size={12} />
                        </button>
                        <button 
                          className="text-red-500/70 hover:text-red-400"
                          onClick={(e) => { e.stopPropagation(); handleRemoveLayer(layer.id); }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PALETTE */}
            <div className="bg-secondary/30 rounded-lg border border-border p-4 flex flex-col min-h-0 overflow-hidden flex-1 mb-2">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block uppercase">Palette</span>
                <button 
                  onClick={() => setShowAllColors(!showAllColors)}
                  className={`text-[8px] font-pixel px-2 py-0.5 rounded border transition-colors ${showAllColors ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-border text-muted-foreground font-mono'}`}
                >
                  {showAllColors ? 'ALL' : 'LAYER SCOPED'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <PaletteBar
                  palette={filteredPalette}
                  colorNames={editedAsset.colorNames}
                  activeColorKey={activeColorKey}
                  onSelectColor={setActiveColorKey}
                  onChangeColor={handleChangeColor}
                  onAddColor={handleAddColor}
                  onRemoveColor={handleRemoveColor}
                  onRenameColor={handleRenameColor}
                />
              </div>
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
                onToggleOnionSkin={() => setOnionSkin(!onionSkin)}
                mirrorX={mirrorX}
                onToggleMirrorX={() => setMirrorX(!mirrorX)}
                scope={scope}
                onScopeChange={setScope}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onFlipH={handleFlipH}
                onFlipV={handleFlipV}
                onRotate={handleRotate}
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
                moveOffset={moveOffset}
                rotationAngle={rotationAngle}
                rotationCenter={rotationCenter}
                onionSkinPrevFrame={onionGhostFrames.prev}
                onionSkinNextFrame={onionGhostFrames.next}
              />
            </div>
          </div>

          {/* RIGHT: Preview & Animation Controls */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pl-1 custom-scrollbar">
            <div className="bg-secondary/30 rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block">LIBRERIA DE ANIMACIONES</span>
                <div className="flex gap-2">
                  <button onClick={selectAllAnims} className="text-[7px] font-pixel text-purple-400 hover:text-purple-300">TODO</button>
                  <button onClick={clearSelection} className="text-[7px] font-pixel text-muted-foreground hover:text-foreground">NADA</button>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {/* Special case for BASE frame */}
                <button
                  type="button"
                  onClick={() => { setViewingAnimation('base'); setEditingFrameIndex(0); }}
                  className={`px-3 py-2 text-[10px] font-pixel rounded border transition-all flex items-center justify-between ${viewingAnimation === 'base'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-secondary/10 border-border text-muted-foreground hover:border-purple-500/30'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
                    <span>BASE (ESTATICO)</span>
                  </div>
                </button>

                {AVAILABLE_ANIMS.map(anim => {
                  const isViewing = viewingAnimation === anim.value;
                  const isSelectedForGen = selectedAnims.includes(anim.value);
                  const exists = editedAsset.animations.some(a => a.name === anim.value);
                  
                  return (
                    <div 
                      key={anim.value}
                      className={`group flex items-center gap-2 px-3 py-2 rounded border transition-all cursor-pointer ${isViewing 
                        ? 'bg-purple-600/30 border-purple-500' 
                        : 'bg-secondary/10 border-border hover:border-purple-500/30'
                      }`}
                      onClick={() => {
                        setViewingAnimation(anim.value);
                        const animDef = editedAsset.animations.find(a => a.name === anim.value);
                        if (animDef) setEditingFrameIndex(animDef.frameIndices[0]);
                      }}
                    >
                      <div className="flex-1 flex items-center gap-2 overflow-hidden">
                        {exists ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)] shrink-0" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full border border-muted-foreground/50 shrink-0" />
                        )}
                        <span className={`text-[10px] font-pixel truncate ${isViewing ? 'text-purple-200' : 'text-muted-foreground'}`}>
                          {anim.label.toUpperCase()}
                        </span>
                      </div>
                      
                  <div 
                        className="flex items-center justify-center p-1 hover:bg-white/5 rounded transition-colors group-hover:bg-white/10"
                        onClick={(e) => { e.stopPropagation(); toggleAnim(anim.value); }}
                        title="Seleccionar para generación"
                      >
                        <Checkbox 
                          checked={isSelectedForGen}
                          className={`h-4 w-4 border-muted-foreground/30 rounded-sm ${isSelectedForGen ? 'bg-purple-500 border-purple-500' : 'bg-transparent'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 w-full pt-1">
                <Button
                  onClick={handleGenerateAnimations}
                  disabled={selectedAnims.length === 0 || isAnimGenerating}
                  className="w-full font-pixel text-[8px] bg-secondary text-foreground hover:bg-secondary/80 border border-border h-8"
                  title="Generación instantánea por matemática"
                >
                  QUICK MATCH
                </Button>
                <Button
                  onClick={handleGenerateAnimationsAI}
                  disabled={selectedAnims.length === 0 || isAnimGenerating}
                  className="w-full font-pixel text-[8px] bg-purple-600 text-white hover:bg-purple-500 border border-purple-500 h-8"
                  title="Generación de alta calidad usando IA"
                >
                  <Sparkles size={12} className="mr-1" />
                  {isAnimGenerating ? `GENERANDO...` : 'GENERAR CON IA'}
                </Button>
              </div>
              {animError && (
                <div className="text-red-400 text-[10px] mt-1 break-words font-mono">{animError}</div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER: Timeline + Save Actions */}
        <div className="flex flex-row items-center justify-between pt-3 border-t border-border gap-4 flex-shrink-0">
          {/* Timeline Strip */}
          <div className="flex-1 min-w-0 max-w-full overflow-hidden flex flex-col bg-secondary/20 p-2 rounded-lg border border-border">
            {frameCount > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={visibleFramesIndices.map(i => i.toString())} strategy={horizontalListSortingStrategy}>
                  <div className="flex gap-4 overflow-x-auto custom-scrollbar flex-1 pb-1 px-2 items-center min-h-[90px]">
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
            ) : (
              <span className="font-pixel text-[10px] text-muted-foreground">SIN FRAMES</span>
            )}
          </div>

          {/* Right: Integrated Animation Preview + Controls */}
          <div className="flex-shrink-0 bg-secondary/30 p-2 rounded-lg border border-border flex items-center gap-4 h-[90px]">
            <div className="flex flex-col gap-1 items-center justify-center pt-1">
              <div className="flex items-center justify-center bg-black/20 rounded-md p-1.5 border border-border/50 shadow-inner">
                <PaletteProvider defaultPalette={editedAsset.palette}>
                  <SpritePreview 
                    asset={editedAsset} 
                    animationName={viewingAnimation} 
                    scale={4} 
                    showLabel={false} 
                    currentFrameOverride={previewState.currentFrame}
                  />
                </PaletteProvider>
              </div>
              {/* Spacer to match FrameThumb label height */}
              <div className="h-[12px] w-full" />
            </div>
            
            <div className="flex flex-col gap-2 border-l border-border/50 pl-4 py-1">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:scale-105 ${isPlaying ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'bg-background text-muted-foreground border-border'}`}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              
              <div className="flex items-center gap-3 bg-black/40 rounded-lg p-2 border border-border/50 h-10">
                <div className="flex flex-col leading-none">
                  <span className="font-mono text-[10px] font-bold text-primary">{fps}</span>
                  <span className="font-pixel text-[6px] text-muted-foreground uppercase opacity-50">fps</span>
                </div>
                <div className="flex flex-col">
                  <button onClick={() => setFps(Math.min(24, fps + 1))} className="text-muted-foreground hover:text-foreground transition-colors"><PlusIcon size={12} /></button>
                  <button onClick={() => setFps(Math.max(1, fps - 1))} className="text-muted-foreground hover:text-foreground transition-colors"><MinusIcon size={12} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
