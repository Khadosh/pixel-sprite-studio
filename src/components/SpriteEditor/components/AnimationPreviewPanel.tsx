import React, { forwardRef, useImperativeHandle } from 'react';
import { PxPlay, PxPause, PxPlus, PxMinus } from '@/components/icons/PixelIcon';
import { useAssetPreview } from '@/hooks/useAssetPreview';
import SpritePreview from '@/components/SpritePreview';
import { PaletteProvider } from '@/hooks/usePalette';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';

export interface AnimationPreviewPanelHandle {
  setIsPlaying: (playing: boolean) => void;
}

export const AnimationPreviewPanel = React.memo(forwardRef<AnimationPreviewPanelHandle, {}>(
  (_, ref) => {
    const editedAsset = useSpriteEditorStore(s => s.editedAsset);
    const viewingAnimation = useSpriteEditorStore(s => s.viewingAnimation);
    const editingFrameIndex = useSpriteEditorStore(s => s.editingFrameIndex);
    const { currentFrame, isPlaying, setIsPlaying, fps, setFps } = useAssetPreview(editedAsset, viewingAnimation, editingFrameIndex);
    const [isExpanded, setIsExpanded] = React.useState(false);

    useImperativeHandle(ref, () => ({
      setIsPlaying,
    }), [setIsPlaying]);

    const baseSize = isExpanded ? 290 : 190;
    const scale = Math.max(2, Math.floor(baseSize / (editedAsset.size || 16)));
    const panelWidth = (editedAsset.size * scale) + 16; // 16px for padding/borders

    return (
      <div 
        className="flex flex-col gap-2 transition-all duration-300 bg-black/90 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ width: `${panelWidth}px` }}
      >
        {/* FLOAT PREVIEW AREA - Tighter padding */}
        <div className="flex items-center justify-center bg-black/40 rounded-lg p-1 border border-white/5 relative overflow-hidden aspect-square group">
          <PaletteProvider defaultPalette={editedAsset.palette}>
            <SpritePreview
              asset={editedAsset}
              animationName={viewingAnimation}
              scale={scale}
              showLabel={false}
              currentFrameOverride={currentFrame}
            />
          </PaletteProvider>
          
          <div className="absolute top-1 left-1 flex items-center gap-1 px-1 py-0.5 rounded bg-black/80 border border-white/10">
            <span className="font-mono text-[8px] text-primary/80">{scale}x</span>
          </div>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute top-1 right-1 p-1 rounded-md bg-black/80 border border-white/10 text-white/40 hover:text-primary hover:border-primary/50 transition-all opacity-0 group-hover:opacity-100"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <PxMinus size={12} /> : <PxPlus size={12} />}
          </button>
        </div>

        {/* COMPACT CONTROLS */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex-1 flex items-center justify-center h-8 rounded-lg border transition-all active:scale-95 ${
              isPlaying 
                ? 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
            }`}
          >
            {isPlaying ? <PxPause size={14} /> : <PxPlay size={14} />}
            {isExpanded && <span className="ml-1.5 font-pixel text-[7px] uppercase tracking-widest">{isPlaying ? 'Pause' : 'Play'}</span>}
          </button>

          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2 h-8 border border-white/5">
            <div className="flex flex-col items-center leading-none">
              <span className="font-mono text-[10px] font-bold text-primary">{fps}</span>
              <span className="font-pixel text-[5px] text-muted-foreground uppercase opacity-30">fps</span>
            </div>
            <div className="flex flex-col -gap-1">
              <button onClick={() => setFps(Math.min(24, fps + 1))} className="text-muted-foreground hover:text-primary transition-colors p-0.5"><PxPlus size={6} /></button>
              <button onClick={() => setFps(Math.max(1, fps - 1))} className="text-muted-foreground hover:text-primary transition-colors p-0.5"><PxMinus size={6} /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }
));

AnimationPreviewPanel.displayName = 'AnimationPreviewPanel';
