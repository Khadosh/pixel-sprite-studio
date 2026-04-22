import React, { useCallback } from 'react';
import { THUMB_SIZE, THUMB_SCALE } from '../../types';

interface FrameThumbProps {
  frame: number[][];
  palette: Record<number, string>;
  size: number;
  isActive: boolean;
  label: string;
  onClick: () => void;
}

export const FrameThumb: React.FC<FrameThumbProps> = ({
  frame, palette, size, isActive, label, onClick,
}) => {
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
      const scale = THUMB_SIZE / size;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const val = frame[r][c];
          if (val === 0) continue;
          const color = palette[val];
          if (!color || color === 'transparent') continue;
          ctx.fillStyle = color;
          ctx.fillRect(c * scale, r * scale, scale, scale);
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
};
