import React, { useRef, useEffect, useMemo } from 'react';
import EditorToolbar from '@/components/EditorToolbar';
import SpritePixelEditor from '@/components/SpritePixelEditor';
import { useSpriteEditorStore, useSpriteEditorStoreApi } from '../context/SpriteEditorContext';
import { selectOnionGhostFrames } from '../store/derived';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import { useEditorEffects } from '../hooks/useEditorEffects';
import { useAnimationGenerationBridge } from '../hooks/useAnimationGeneration';
import { EditorHeader } from './EditorHeader';
import { LayersList } from './LayersList';
import { PaletteSection } from './PaletteSection';
import { MetadataPanel } from './MetadataPanel';
import { AnatomyPanel } from './AnatomyPanel';
import { AnimationLibrary } from './AnimationLibrary';
import { TimelineStrip } from './Timeline/TimelineStrip';
import { AnimationPreviewPanel, AnimationPreviewPanelHandle } from './AnimationPreviewPanel';
import { ZoomControl } from './ZoomControl';
import { PaletteProvider } from '@/hooks/usePalette';
import { DrawingToolbar } from '@/components/DrawingToolbar';
import { EditorSidebarNavigator } from './EditorSidebarNavigator';
import { PaletteLibrary } from './PaletteLibrary';
import { AssetLibrary } from './AssetLibrary';
import { StudioSheetModal } from './StudioSheetModal';
import { HistoryPanel } from './HistoryPanel';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

interface EditorLayoutProps {
  onClose?: () => void;
  hideHeader?: boolean;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({ onClose, hideHeader = false }) => {
  const store = useSpriteEditorStoreApi();
  const previewPanelRef = useRef<AnimationPreviewPanelHandle>(null);
  const [showStudioSheet, setShowStudioSheet] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // AI generation bridge
  const { handleGenerateAnimationsAI } = useAnimationGenerationBridge(store);

  // Subscribe to store values needed by usePixelEditor
  const editedAsset = useSpriteEditorStore(s => s.editedAsset);
  const editingFrameIndex = useSpriteEditorStore(s => s.editingFrameIndex);
  const activeLayerId = useSpriteEditorStore(s => s.activeLayerId);
  const scope = useSpriteEditorStore(s => s.scope);
  const { pushUndo, undo, redo, canUndo, canRedo } = useSpriteEditorStore(useShallow(s => ({
    pushUndo: s.pushUndo,
    undo: s.undo,
    redo: s.redo,
    canUndo: s.canUndo,
    canRedo: s.canRedo
  })));

  // Pixel editor hook (local drawing state with refs)
  const pixelEditor = usePixelEditor(editedAsset, editingFrameIndex, activeLayerId, (updated) => {
    store.getState().setEditedAsset(updated);
  }, scope, pushUndo, undo, canUndo);

  // Sync pixel editor bridge to store
  const bridge = useMemo(() => ({
    tool: pixelEditor.tool,
    setTool: pixelEditor.setTool,
    activeColorKey: pixelEditor.activeColorKey,
    setActiveColorKey: pixelEditor.setActiveColorKey,
    brushSize: pixelEditor.brushSize,
    setBrushSize: pixelEditor.setBrushSize,
    mirrorX: pixelEditor.mirrorX,
    setMirrorX: pixelEditor.setMirrorX,
    draftFrame: pixelEditor.draftFrame,
    handlePointerDown: pixelEditor.handlePointerDown,
    handlePointerMove: pixelEditor.handlePointerMove,
    handlePointerUp: pixelEditor.handlePointerUp,
    undo: undo,
    redo: redo,
    canUndo: canUndo,
    canRedo: canRedo,
    overwriteLayerFrame: pixelEditor.overwriteLayerFrame,
    rotationAngle: pixelEditor.rotationAngle,
    rotationCenter: pixelEditor.rotationCenter,
    selectionRect: pixelEditor.selectionRect,
    setSelectionRect: pixelEditor.setSelectionRect,
    movingSelectionPixels: pixelEditor.movingSelectionPixels,
    stampSelection: pixelEditor.stampSelection,
    clearFloatingPixels: pixelEditor.clearFloatingPixels,
    _handleGenerateAnimationsAI: handleGenerateAnimationsAI,
  }), [
    pixelEditor.tool, pixelEditor.setTool,
    pixelEditor.activeColorKey, pixelEditor.setActiveColorKey,
    pixelEditor.brushSize, pixelEditor.setBrushSize,
    pixelEditor.mirrorX, pixelEditor.setMirrorX,
    pixelEditor.draftFrame,
    pixelEditor.handlePointerDown, pixelEditor.handlePointerMove, pixelEditor.handlePointerUp,
    pixelEditor.undo, pixelEditor.canUndo,
    pixelEditor.overwriteLayerFrame,
    pixelEditor.rotationAngle,
    pixelEditor.rotationCenter,
    pixelEditor.selectionRect,
    pixelEditor.setSelectionRect,
    pixelEditor.movingSelectionPixels,
    pixelEditor.stampSelection,
    pixelEditor.clearFloatingPixels,
    handleGenerateAnimationsAI
  ]);

  useEffect(() => {
    store.getState().setPixelEditorBridge(bridge);
  }, [store, bridge]);

  // Store-derived state for render
  const zoom = useSpriteEditorStore(s => s.zoom);
  const setZoom = useSpriteEditorStore(s => s.setZoom);
  const onionSkin = useSpriteEditorStore(s => s.onionSkin);
  const setOnionSkin = useSpriteEditorStore(s => s.setOnionSkin);
  const handleCopy = useSpriteEditorStore(s => s.handleCopy);
  const handlePaste = useSpriteEditorStore(s => s.handlePaste);
  const handleFlipH = useSpriteEditorStore(s => s.handleFlipH);
  const handleFlipV = useSpriteEditorStore(s => s.handleFlipV);
  const handleRotate = useSpriteEditorStore(s => s.handleRotate);
  const canvasBg = useSpriteEditorStore(s => s.canvasBg);
  const setCanvasBg = useSpriteEditorStore(s => s.setCanvasBg);
  const leftSidebarTab = useSpriteEditorStore(s => s.leftSidebarTab);
  const onionGhostFrames = useSpriteEditorStore(useShallow(selectOnionGhostFrames));

  // Effects (keyboard shortcuts, side-effects)
  useEditorEffects(store);

  const handleAnatomyChange = React.useCallback((updates: any) => {
    store.getState().setEditedAsset((prev: any) => ({
      ...prev,
      anatomy: { ...prev.anatomy, ...updates }
    }));
  }, [store]);

  return (
    <PaletteProvider defaultPalette={editedAsset.palette}>
      <div className="flex-1 flex flex-col min-h-0 bg-background p-4 gap-4 overflow-hidden relative">
        {!hideHeader && <EditorHeader />}

        {/* MAIN BODY: 3 Columns */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div className="w-[250px] min-w-[250px] flex-shrink-0 flex flex-col bg-secondary/10 rounded-lg border border-border p-4 overflow-hidden">
            <PaletteSection />
          </div>

          {/* CENTER: Canvas */}
          <div className="flex-1 min-w-0 bg-black/40 rounded-lg border border-border flex flex-col overflow-hidden relative">
            <div className="flex-shrink-0 border-b border-border bg-secondary/30 p-2 flex justify-center">
              <EditorToolbar
                tool={pixelEditor.tool}
                onToolChange={pixelEditor.setTool}
                brushSize={pixelEditor.brushSize}
                onBrushSizeChange={pixelEditor.setBrushSize}
                canUndo={canUndo}
                onUndo={undo}
                canRedo={canRedo}
                onRedo={redo}
                onionSkin={onionSkin}
                onToggleOnionSkin={() => setOnionSkin(!onionSkin)}
                mirrorX={pixelEditor.mirrorX}
                onToggleMirrorX={() => pixelEditor.setMirrorX((prev: boolean) => !prev)}
                scope={scope}
                onScopeChange={store.getState().setScope}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onFlipH={handleFlipH}
                onFlipV={handleFlipV}
                onRotate={handleRotate}
                canvasBg={canvasBg}
                onToggleCanvasBg={() => setCanvasBg(canvasBg === 'light' ? 'dark' : 'light')}
                onOpenStudioSheet={() => setShowStudioSheet(true)}
              />
            </div>
            <div className="flex-1 flex flex-row overflow-hidden relative">
              <div className="flex-shrink-0 flex items-center p-2">
                <DrawingToolbar tool={pixelEditor.tool} onToolChange={pixelEditor.setTool} />
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-4 relative">
                <SpritePixelEditor
                  asset={editedAsset}
                  frameIndex={editingFrameIndex}
                  activeColorKey={pixelEditor.activeColorKey}
                  activeLayerId={activeLayerId}
                  tool={pixelEditor.tool}
                  brushSize={pixelEditor.brushSize}
                  onPointerDown={pixelEditor.handlePointerDown}
                  onPointerMove={pixelEditor.handlePointerMove}
                  onPointerUp={pixelEditor.handlePointerUp}
                  draftFrame={pixelEditor.draftFrame}
                  rotationAngle={pixelEditor.rotationAngle}
                  rotationCenter={pixelEditor.rotationCenter}
                  onionSkinPrevFrame={onionGhostFrames.prev}
                  onionSkinNextFrame={onionGhostFrames.next}
                  zoom={zoom}
                  setZoom={setZoom}
                  selectionRect={pixelEditor.selectionRect}
                  movingSelectionPixels={pixelEditor.movingSelectionPixels}
                  canvasBg={canvasBg}
                  leftSidebarTab={leftSidebarTab}
                  onAnatomyChange={handleAnatomyChange}
                  onPushUndo={pushUndo}
                />
                <ZoomControl />
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-[350px] min-w-[350px] flex-shrink-0 flex bg-secondary/10 rounded-lg border border-border overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {leftSidebarTab && (
                <div className="flex-1 overflow-hidden flex flex-col p-3">
                  {leftSidebarTab === 'layers' && <LayersList />}
                  {leftSidebarTab === 'animations' && <AnimationLibrary />}
                  {leftSidebarTab === 'anatomy' && <AnatomyPanel />}
                  {leftSidebarTab === 'themes' && <PaletteLibrary />}
                  {leftSidebarTab === 'assets' && <AssetLibrary />}
                  {leftSidebarTab === 'config' && <MetadataPanel />}
                  {leftSidebarTab === 'history' && <HistoryPanel />}
                </div>
              )}
            </div>
            <EditorSidebarNavigator />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-row items-center justify-between pt-3 border-t border-border gap-4 flex-shrink-0">
          <TimelineStrip sensors={sensors} />
          <AnimationPreviewPanel ref={previewPanelRef} />
        </div>

        <StudioSheetModal open={showStudioSheet} onOpenChange={setShowStudioSheet} />
      </div>
    </PaletteProvider>
  );
};
