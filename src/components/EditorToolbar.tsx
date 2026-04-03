import { Pencil, Eraser, Undo2 } from 'lucide-react';
import type { EditorTool } from '@/hooks/usePixelEditor';

export type BrushSize = 1 | 4 | 16;

interface EditorToolbarProps {
  tool: EditorTool;
  onToolChange: (t: EditorTool) => void;
  brushSize: BrushSize;
  onBrushSizeChange: (s: BrushSize) => void;
  canUndo: boolean;
  onUndo: () => void;
}

const BRUSH_SIZES: { value: BrushSize; label: string; icon: string }[] = [
  { value: 1, label: '1px', icon: '·' },
  { value: 4, label: '2x2', icon: '⊞' },
  { value: 16, label: '4x4', icon: '▣' },
];

export default function EditorToolbar({ tool, onToolChange, brushSize, onBrushSizeChange, canUndo, onUndo }: EditorToolbarProps) {
  const btnBase = 'p-2 rounded border transition-all';
  const btnActive = 'border-purple-500 bg-purple-600/30 text-purple-300';
  const btnInactive = 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground';
  const sizeBtn = 'px-2 py-1 rounded border text-[10px] font-mono transition-all';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onToolChange('pencil')}
        className={`${btnBase} ${tool === 'pencil' ? btnActive : btnInactive}`}
        title="Pencil (draw)"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => onToolChange('eraser')}
        className={`${btnBase} ${tool === 'eraser' ? btnActive : btnInactive}`}
        title="Eraser (transparent)"
      >
        <Eraser size={16} />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      {BRUSH_SIZES.map(s => (
        <button
          key={s.value}
          onClick={() => onBrushSizeChange(s.value)}
          className={`${sizeBtn} ${brushSize === s.value ? btnActive : btnInactive}`}
          title={s.label}
        >
          {s.label}
        </button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`${btnBase} border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed`}
        title="Undo"
      >
        <Undo2 size={16} />
      </button>
    </div>
  );
}
