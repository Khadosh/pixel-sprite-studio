import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import EditorToolbar from '@/components/EditorToolbar';
import SpritePixelEditor from '@/components/SpritePixelEditor';
import { SpriteEditorProvider } from './context/SpriteEditorContext';
import { useSpriteEditor } from './hooks/useSpriteEditor';
import { EditorHeader } from './components/EditorHeader';
import { LayersList } from './components/LayersList';
import { PaletteSection } from './components/PaletteSection';
import { AnimationLibrary } from './components/AnimationLibrary';
import { TimelineStrip } from './components/Timeline/TimelineStrip';
import { AnimationPreviewPanel } from './components/AnimationPreviewPanel';
import { SpriteEditorModalProps } from './types';
import { PaletteProvider } from '@/hooks/usePalette';

export const SpriteEditor: React.FC<SpriteEditorModalProps> = (props) => {
  const { open, onOpenChange } = props;
  const editor = useSpriteEditor(props);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SpriteEditorProvider value={editor}>
        <PaletteProvider defaultPalette={editor.editedAsset.palette}>
          <DialogContent className="w-[95vw] max-w-none h-[95vh] max-h-none flex flex-col bg-card border-border p-4 gap-4 overflow-hidden">
            <EditorHeader />

            {/* MAIN BODY: 3 Columns */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
              
              {/* LEFT: Layers & Palette */}
              <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4 overflow-hidden pr-1">
                <LayersList />
                <PaletteSection />
              </div>

              {/* CENTER: Canvas */}
              <div className="flex-1 min-w-0 bg-black/40 rounded-lg border border-border flex flex-col overflow-hidden relative">
                <div className="flex-shrink-0 border-b border-border bg-secondary/30 p-2 flex justify-center">
                  <EditorToolbar
                    tool={editor.tool}
                    onToolChange={editor.setTool}
                    brushSize={editor.brushSize}
                    onBrushSizeChange={editor.setBrushSize}
                    canUndo={editor.canUndo}
                    onUndo={editor.undo}
                    onionSkin={editor.onionSkin}
                    onToggleOnionSkin={() => editor.setOnionSkin(!editor.onionSkin)}
                    mirrorX={editor.mirrorX}
                    onToggleMirrorX={() => editor.setMirrorX((prev: boolean) => !prev)}
                    scope={editor.scope}
                    onScopeChange={editor.setScope}
                    onCopy={editor.handleCopy}
                    onPaste={editor.handlePaste}
                    onFlipH={editor.handleFlipH}
                    onFlipV={editor.handleFlipV}
                    onRotate={editor.handleRotate}
                  />
                </div>
                <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
                  <SpritePixelEditor
                    asset={editor.editedAsset}
                    frameIndex={editor.editingFrameIndex}
                    activeColorKey={editor.activeColorKey}
                    activeLayerId={editor.activeLayerId}
                    tool={editor.tool}
                    brushSize={editor.brushSize}
                    onPointerDown={editor.handlePointerDown}
                    onPointerMove={editor.handlePointerMove}
                    onPointerUp={editor.handlePointerUp}
                    draftFrame={editor.draftFrame}
                    moveOffset={editor.moveOffset}
                    rotationAngle={editor.rotationAngle}
                    rotationCenter={editor.rotationCenter}
                    onionSkinPrevFrame={editor.onionGhostFrames.prev}
                    onionSkinNextFrame={editor.onionGhostFrames.next}
                  />
                </div>
              </div>

              {/* RIGHT: Preview & Animation Controls */}
              <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pl-1 custom-scrollbar">
                <AnimationLibrary />
              </div>
            </div>

            {/* FOOTER: Timeline + Preview */}
            <div className="flex flex-row items-center justify-between pt-3 border-t border-border gap-4 flex-shrink-0">
              <TimelineStrip />
              <AnimationPreviewPanel ref={editor.previewPanelRef} />
            </div>
          </DialogContent>
        </PaletteProvider>
      </SpriteEditorProvider>
    </Dialog>
  );
};
