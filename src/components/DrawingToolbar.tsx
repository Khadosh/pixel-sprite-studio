import React from 'react';
import {
  PxPencil, PxEraser, PxFill, PxPipette,
  PxLine, PxRect, PxCircle,
  type PixelIconProps
} from '@/components/icons/PixelIcon';
import type { EditorTool } from '@/hooks/usePixelEditor';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DrawingToolbarProps {
  tool: EditorTool;
  onToolChange: (t: EditorTool) => void;
}

type PxIcon = React.FC<PixelIconProps>;

const DRAWING_TOOLS: { id: EditorTool; icon: PxIcon; tooltip: string }[] = [
  { id: 'pencil', icon: PxPencil, tooltip: 'Lápiz (B)' },
  { id: 'eraser', icon: PxEraser, tooltip: 'Borrador (E)' },
  { id: 'fill', icon: PxFill, tooltip: 'Relleno (G)' },
  { id: 'picker', icon: PxPipette, tooltip: 'Cuentagotas (I)' },
  { id: 'line', icon: PxLine, tooltip: 'Línea' },
  { id: 'rect', icon: PxRect, tooltip: 'Rectángulo' },
  { id: 'circle', icon: PxCircle, tooltip: 'Círculo' },
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
                <Icon className={cn("h-5 w-5", tool === id ? "scale-110" : "opacity-70")} size={20} />
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
