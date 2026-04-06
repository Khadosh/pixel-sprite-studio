import { 
  Pencil, Eraser, Undo2, Layers, PaintBucket, Pipette, 
  Minus, Square, Circle, SplitSquareHorizontal,
  Copy, ClipboardList, FlipHorizontal, FlipVertical, RotateCw, Monitor,
  Move, LucideIcon
} from 'lucide-react';
import type { EditorTool } from '@/hooks/usePixelEditor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';

export type BrushSize = 1 | 4 | 16;
export type EditorScope = 'layer' | 'frame';

interface EditorToolbarProps {
  tool: EditorTool;
  onToolChange: (t: EditorTool) => void;
  brushSize: BrushSize;
  onBrushSizeChange: (s: BrushSize) => void;
  canUndo: boolean;
  onUndo: () => void;
  onionSkin: boolean;
  onToggleOnionSkin: () => void;
  mirrorX: boolean;
  onToggleMirrorX: () => void;
  scope: EditorScope;
  onScopeChange: (s: EditorScope) => void;
  onCopy: () => void;
  onPaste: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onRotate: () => void;
}

const BRUSH_SIZES: { value: BrushSize; label: string; tooltip: string }[] = [
  { value: 1, label: '1px', tooltip: 'Pincel 1px' },
  { value: 4, label: '2x2', tooltip: 'Pincel 2px' },
  { value: 16, label: '4x4', tooltip: 'Pincel 4px' },
];

const TOOLS: { id: EditorTool; icon: LucideIcon; tooltip: string }[] = [
  { id: 'move', icon: Move, tooltip: 'Mover/Panear Diseño (V)' },
  { id: 'picker', icon: Pipette, tooltip: 'Cuentagotas (I)' },
  { id: 'pencil', icon: Pencil, tooltip: 'Lápiz (B)' },
  { id: 'eraser', icon: Eraser, tooltip: 'Borra Píxeles (E)' },
  { id: 'fill', icon: PaintBucket, tooltip: 'Balde de Pintura (G)' },
  { id: 'line', icon: Minus, tooltip: 'Línea Recta [Arrastrar]' },
  { id: 'rect', icon: Square, tooltip: 'Rectángulo Hueco [Arrastrar]' },
  { id: 'circle', icon: Circle, tooltip: 'Círculo Hueco [Arrastrar]' },
];

export default function EditorToolbar({ 
  tool, onToolChange, 
  brushSize, onBrushSizeChange, 
  canUndo, onUndo, 
  onionSkin, onToggleOnionSkin,
  mirrorX, onToggleMirrorX,
  scope, onScopeChange,
  onCopy, onPaste, onFlipH, onFlipV, onRotate
}: EditorToolbarProps) {
  const btnBase = 'p-2 rounded border transition-all';
  const btnActive = 'border-purple-500 bg-purple-600/30 text-purple-300';
  const btnInactive = 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground';
  const sizeBtn = 'px-2 py-1 rounded border text-[10px] font-mono transition-all';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
        
        {TOOLS.map(t => {
          const Icon = t.icon;
          return (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => onToolChange(t.id)} 
                  className={`${btnBase} ${tool === t.id ? btnActive : btnInactive}`}
                >
                  <Icon size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] font-pixel border-border">
                {t.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        {BRUSH_SIZES.map(s => (
          <Tooltip key={s.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onBrushSizeChange(s.value)}
                className={`${sizeBtn} ${brushSize === s.value ? btnActive : btnInactive}`}
              >
                {s.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel border-border">
              {s.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleMirrorX}
              className={`${btnBase} ${mirrorX ? btnActive : btnInactive}`}
            >
              <SplitSquareHorizontal size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] font-pixel border-border">
            Simetría Horizontal (M)
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => onScopeChange(scope === 'layer' ? 'frame' : 'layer')}
              className={`${btnBase} flex items-center gap-1.5 px-2 bg-secondary/50 border-border text-muted-foreground hover:text-foreground`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scope === 'layer' ? '#a855f7' : '#3b82f6' }} />
              <span className="text-[8px] font-pixel uppercase tracking-tighter">
                {scope}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] font-pixel">
            Alcance: {scope === 'layer' ? 'SÓLO CAPA' : 'TODO EL FRAME'}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-0.5 ml-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onCopy} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <Copy size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">COPIAR ({scope})</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onPaste} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <ClipboardList size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">PEGAR ({scope})</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-4 bg-border/50 mx-1" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onFlipH} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <FlipHorizontal size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">MIRROR H ({scope})</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onFlipV} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <FlipVertical size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">MIRROR V ({scope})</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onRotate} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <RotateCw size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">ROTATE 90° ({scope})</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`${btnBase} border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <Undo2 size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] font-pixel border-border">
            Deshacer Trázo (Ctrl+Z)
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleOnionSkin}
              className={`${btnBase} ${onionSkin ? btnActive : btnInactive}`}
            >
              <Layers size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] font-pixel border-border">
            Alternar Papel Cebolla
          </TooltipContent>
        </Tooltip>

      </div>
    </TooltipProvider>
  );
}
