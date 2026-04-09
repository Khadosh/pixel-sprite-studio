import React from 'react';
import { 
  Pencil, Eraser, PaintBucket, Pipette, 
  Minus, Square, Circle, LucideIcon 
} from 'lucide-react';
import type { EditorTool } from '@/hooks/usePixelEditor';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DrawingToolbarProps {
  tool: EditorTool;
  onToolChange: (t: EditorTool) => void;
}

const DRAWING_TOOLS: { id: EditorTool; icon: LucideIcon; tooltip: string }[] = [
  { id: 'pencil', icon: Pencil, tooltip: 'Lápiz (B)' },
  { id: 'eraser', icon: Eraser, tooltip: 'Borrador (E)' },
  { id: 'fill', icon: PaintBucket, tooltip: 'Relleno (G)' },
  { id: 'picker', icon: Pipette, tooltip: 'Cuentagotas (I)' },
  { id: 'line', icon: Minus, tooltip: 'Línea' },
  { id: 'rect', icon: Square, tooltip: 'Rectángulo' },
  { id: 'circle', icon: Circle, tooltip: 'Círculo' },
];

export function DrawingToolbar({ tool, onToolChange }: DrawingToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 p-2 bg-secondary/20 rounded-lg border border-border h-fit self-center shadow-inner">
        {DRAWING_TOOLS.map(({ id, icon: Icon, tooltip }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant={tool === id ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  "h-10 w-10 transition-all duration-200",
                  tool === id ? "shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "hover:bg-secondary/50"
                )}
                onClick={() => onToolChange(id)}
              >
                <Icon className={cn("h-5 w-5", tool === id ? "scale-110" : "opacity-70")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
