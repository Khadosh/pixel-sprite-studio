import { 
  Pencil, Eraser, Undo2, Layers, PaintBucket, Pipette, 
  Minus, Square, Circle, SplitSquareHorizontal,
  Copy, ClipboardList, FlipHorizontal, FlipVertical, RotateCw, Monitor,
  Move, Scan, LucideIcon
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

const PAINT_TOOLS: { id: EditorTool; icon: LucideIcon; tooltip: string }[] = [
  { id: 'pencil', icon: Pencil, tooltip: 'Lápiz (B)' },
  { id: 'eraser', icon: Eraser, tooltip: 'Borrador (E)' },
  { id: 'fill', icon: PaintBucket, tooltip: 'Relleno (G)' },
  { id: 'picker', icon: Pipette, tooltip: 'Cuentagotas (I)' },
];

const SHAPE_TOOLS: { id: EditorTool; icon: LucideIcon; tooltip: string }[] = [
  { id: 'line', icon: Minus, tooltip: 'Línea' },
  { id: 'rect', icon: Square, tooltip: 'Rectángulo' },
  { id: 'circle', icon: Circle, tooltip: 'Círculo' },
  { id: 'select', icon: Scan, tooltip: 'Selección (S)' },
];

const TRANSFORM_TOOLS: { id: EditorTool; icon: LucideIcon; tooltip: string }[] = [
  { id: 'move', icon: Move, tooltip: 'Mover (V)' },
  { id: 'rotate', icon: RotateCw, tooltip: 'Rotación Libre (R)' },
];

export default React.memo(function EditorToolbar({ 
  tool, onToolChange, 
  brushSize, onBrushSizeChange, 
  canUndo, onUndo, 
  onionSkin, onToggleOnionSkin,
  mirrorX, onToggleMirrorX,
  scope, onScopeChange,
  onCopy, onPaste, onFlipH, onFlipV, onRotate
}: EditorToolbarProps) {
  const btnBase = 'p-2 rounded border transition-all';
  const btnActive = 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(34,197,94,0.2)]';
  const btnInactive = 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground';
  const sizeBtn = 'px-2 py-1 rounded border text-[10px] font-mono transition-all';

  const ToolButton = ({ t, currentTool, onToolChange }: { 
    t: { id: EditorTool; icon: LucideIcon; tooltip: string }, 
    currentTool: EditorTool, 
    onToolChange: (t: EditorTool) => void 
  }) => (
    <Tooltip key={t.id}>
      <TooltipTrigger asChild>
        <button 
          onClick={() => onToolChange(t.id)} 
          className={`${btnBase} ${currentTool === t.id ? btnActive : btnInactive}`}
        >
          <t.icon size={16} strokeWidth={2.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[10px] font-pixel border-border">
        {t.tooltip}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
        
        <div className="flex items-center gap-1">
          <ToolButton t={{ id: 'select', icon: Scan, tooltip: 'Selección (S)' }} currentTool={tool} onToolChange={onToolChange} />
          <div className="w-px h-6 bg-border mx-1 shrink-0" />
          {TRANSFORM_TOOLS.map(t => (
            <ToolButton key={t.id} t={t} currentTool={tool} onToolChange={onToolChange} />
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        {/* Global Actions Group */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onCopy} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <Copy size={15} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">COPIAR ({scope})</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onPaste} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <ClipboardList size={15} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">PEGAR ({scope})</TooltipContent>
          </Tooltip>

          <div className="w-px h-3 bg-border/40 mx-0.5" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onFlipH} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <FlipHorizontal size={15} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">FLIP H ({scope})</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onFlipV} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <FlipVertical size={15} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">FLIP V ({scope})</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onRotate} className={`${btnBase} ${btnInactive} border-none p-1.5`}>
                <RotateCw size={15} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">ROTAR 90° ({scope})</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        {/* Brush Settings Group */}
        <div className="flex items-center gap-1">
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

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleMirrorX}
                className={`${btnBase} ${mirrorX ? btnActive : btnInactive}`}
              >
                <SplitSquareHorizontal size={16} strokeWidth={2.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel border-border">
              Simetría (M)
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        {/* Global Utilities Group */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => onScopeChange(scope === 'layer' ? 'frame' : 'layer')}
                className={`${btnBase} flex items-center gap-1.5 px-2 bg-secondary/30 border-border text-muted-foreground hover:text-foreground`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scope === 'layer' ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }} />
                <span className="text-[8px] font-pixel uppercase tracking-tighter">
                  {scope}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-pixel">
              Alcance: {scope === 'layer' ? 'SÓLO CAPA' : 'TODO EL FRAME'}
            </TooltipContent>
          </Tooltip>

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
              Deshacer (Ctrl+Z)
            </TooltipContent>
          </Tooltip>

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
              Onion Skin
            </TooltipContent>
          </Tooltip>
        </div>

      </div>
    </TooltipProvider>
  );
});
