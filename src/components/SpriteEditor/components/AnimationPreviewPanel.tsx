import React, { forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Plus as PlusIcon, Minus as MinusIcon } from 'lucide-react';
import { useAssetPreview } from '@/hooks/useAssetPreview';
import SpritePreview from '@/components/SpritePreview';
import { PaletteProvider } from '@/hooks/usePalette';
import { useSpriteEditorContext } from '../context/SpriteEditorContext';

export interface AnimationPreviewPanelHandle {
  setIsPlaying: (playing: boolean) => void;
}

export const AnimationPreviewPanel = React.memo(forwardRef<AnimationPreviewPanelHandle, {}>(
  (_, ref) => {
    const { editedAsset, viewingAnimation } = useSpriteEditorContext();
    const { currentFrame, isPlaying, setIsPlaying, fps, setFps } = useAssetPreview(editedAsset, viewingAnimation);

    useImperativeHandle(ref, () => ({
      setIsPlaying,
    }), [setIsPlaying]);

    return (
      <div className="flex-shrink-0 bg-secondary/30 p-2 rounded-lg border border-border flex items-center gap-4 h-[90px]">
        <div className="flex flex-col gap-1 items-center justify-center pt-1">
          <div className="flex items-center justify-center bg-black/20 rounded-md p-1.5 border border-border/50 shadow-inner">
            <PaletteProvider defaultPalette={editedAsset.palette}>
              <SpritePreview
                asset={editedAsset}
                animationName={viewingAnimation}
                scale={4}
                showLabel={false}
                currentFrameOverride={currentFrame}
              />
            </PaletteProvider>
          </div>
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
              <button 
                onClick={() => setFps(Math.min(24, fps + 1))} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Increase FPS"
              >
                <PlusIcon size={12} />
              </button>
              <button 
                onClick={() => setFps(Math.max(1, fps - 1))} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Decrease FPS"
              >
                <MinusIcon size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
));

AnimationPreviewPanel.displayName = 'AnimationPreviewPanel';
