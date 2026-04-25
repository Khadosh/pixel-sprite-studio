import { useRef, useEffect } from 'react';

interface EditorCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function EditorCanvas({
  canvasRef,
  width,
  height,
  setZoom,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
  onMouseLeave,
}: EditorCanvasProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.1, Math.min(8, prev + delta)));
      }
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleNativeWheel);
  }, [canvasRef, setZoom]);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded border border-border cursor-crosshair shrink-0 shadow-lg touch-none"
        style={{ imageRendering: 'pixelated' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={onContextMenu}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
}
