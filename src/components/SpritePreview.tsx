import { useRef, useEffect, useState } from 'react';
import { ANIMATIONS, FRAME_SIZE, PALETTE } from '@/lib/pixelCharacter';

const PREVIEW_SCALE = 6;
const PREVIEW_SIZE = FRAME_SIZE * PREVIEW_SCALE;

export default function SpritePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animIdx, setAnimIdx] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0);

  const anim = ANIMATIONS[animIdx];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIdx(prev => (prev + 1) % anim.frames.length);
    }, 200);
    return () => clearInterval(interval);
  }, [anim]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // Checkerboard
    const cs = 12;
    for (let y = 0; y < PREVIEW_SIZE; y += cs) {
      for (let x = 0; x < PREVIEW_SIZE; x += cs) {
        const isEven = ((x / cs) + (y / cs)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1e1e2e' : '#252538';
        ctx.fillRect(x, y, cs, cs);
      }
    }

    // Draw frame
    const frame = anim.frames[frameIdx];
    for (let row = 0; row < FRAME_SIZE; row++) {
      for (let col = 0; col < FRAME_SIZE; col++) {
        const val = frame[row][col];
        if (val === 0) continue;
        const color = PALETTE[val];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(col * PREVIEW_SCALE, row * PREVIEW_SCALE, PREVIEW_SCALE, PREVIEW_SCALE);
      }
    }
  }, [anim, frameIdx]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-pixel text-primary tracking-wider">
        PREVIEW — {anim.label}
      </div>
      <canvas
        ref={canvasRef}
        width={PREVIEW_SIZE}
        height={PREVIEW_SIZE}
        className="rounded border border-border"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="flex flex-wrap gap-2">
        {ANIMATIONS.map((a, i) => (
          <button
            key={a.name}
            onClick={() => { setAnimIdx(i); setFrameIdx(0); }}
            className={`px-3 py-1.5 text-[10px] font-pixel rounded border transition-colors ${
              i === animIdx
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
