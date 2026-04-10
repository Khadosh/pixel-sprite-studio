import React, { useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import EditorToolbar from '@/components/EditorToolbar';
import SpritePixelEditor from '@/components/SpritePixelEditor';
import { SpriteEditorStoreProvider } from './context/SpriteEditorContext';
import { createSpriteEditorStore } from './store/useSpriteEditorStore';
import { selectVisibleFramesIndices, selectOnionGhostFrames } from './store/derived';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import { useEditorEffects } from './hooks/useEditorEffects';
import { useAnimationGenerationBridge } from './hooks/useAnimationGeneration';
import { EditorHeader } from './components/EditorHeader';
import { LayersList } from './components/LayersList';
import { PaletteSection } from './components/PaletteSection';
import { AnimationLibrary } from './components/AnimationLibrary';
import { TimelineStrip } from './components/Timeline/TimelineStrip';
import { AnimationPreviewPanel, AnimationPreviewPanelHandle } from './components/AnimationPreviewPanel';
import { ZoomControl } from './components/ZoomControl';
import { SpriteEditorModalProps } from './types';
import { PaletteProvider } from '@/hooks/usePalette';
import { DrawingToolbar } from '@/components/DrawingToolbar';

import { EditorSidebarNavigator } from './components/EditorSidebarNavigator';
import { PaletteLibrary } from './components/PaletteLibrary';
import { AssetLibrary } from './components/AssetLibrary';
import { CloseConfirmationDialog } from './components/CloseConfirmationDialog';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

export const SpriteEditor: React.FC<SpriteEditorModalProps> = (props) => {
  const { open, onOpenChange, initialAsset, onSave, generatePrompt, onRegenerate, isGenerating } = props;
  const previewPanelRef = useRef<AnimationPreviewPanelHandle>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Create Zustand store (stable reference per mount)
  const store = useMemo(() => createSpriteEditorStore({
    initialAsset,
    onSave,
    onOpenChange,
    previewPanelRef,
    generatePrompt,
    onRegenerate,
    isGenerating,
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // AI generation bridge
  const { handleGenerateAnimationsAI } = useAnimationGenerationBridge(store);

  // Keep props in sync with store
  useEffect(() => {
    store.setState({
      _onSave: onSave,
      _onOpenChange: onOpenChange,
      _generatePrompt: generatePrompt,
      _onRegenerate: onRegenerate,
      _isGenerating: isGenerating,
      _previewPanelRef: previewPanelRef,
    });
  }, [store, onSave, onOpenChange, generatePrompt, onRegenerate, isGenerating]);

  // Handle asset ID change (different project opened)
  useEffect(() => {
    const state = store.getState();
    if (initialAsset.id !== state.editedAsset.id || !state.editedAsset.layers || state.editedAsset.layers.length === 0) {
      state.initFromAsset(initialAsset);
    }
  }, [initialAsset.id, store]);

  // Subscribe to store values needed by usePixelEditor
  const editedAsset = useStore(store, s => s.editedAsset);
  const editingFrameIndex = useStore(store, s => s.editingFrameIndex);
  const activeLayerId = useStore(store, s => s.activeLayerId);
  const scope = useStore(store, s => s.scope);
  const { pushUndo, undo, redo, canUndo, canRedo } = useStore(store, useShallow(s => ({
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
  // Memoized bridge to avoid re-render loops
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
    // AI generation bridge
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
  const zoom = useStore(store, s => s.zoom);
  const setZoom = useStore(store, s => s.setZoom);
  const onionSkin = useStore(store, s => s.onionSkin);
  const setOnionSkin = useStore(store, s => s.setOnionSkin);
  const handleCopy = useStore(store, s => s.handleCopy);
  const handlePaste = useStore(store, s => s.handlePaste);
  const handleFlipH = useStore(store, s => s.handleFlipH);
  const handleFlipV = useStore(store, s => s.handleFlipV);
  const handleRotate = useStore(store, s => s.handleRotate);
  const canvasBg = useStore(store, s => s.canvasBg);
  const setCanvasBg = useStore(store, s => s.setCanvasBg);

  const leftSidebarTab = useStore(store, s => s.leftSidebarTab);
  const onionGhostFrames = useStore(store, useShallow(selectOnionGhostFrames));

  // Effects (keyboard shortcuts, side-effects)
  useEditorEffects(store);



  // Close confirmation logic
  const isDirty = useStore(store, s => s.isDirty);
  const handleSave = useStore(store, s => s.handleSave);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);

  const handleRequestClose = React.useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onOpenChange(false);
    }
  }, [isDirty, onOpenChange]);

  // Sync handleClose in store
  useEffect(() => {
    store.setState({ handleClose: handleRequestClose });
  }, [store, handleRequestClose]);

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleRequestClose(); }}>
      <SpriteEditorStoreProvider store={store}>
        <PaletteProvider defaultPalette={editedAsset.palette}>
          <DialogContent
            aria-describedby={undefined}
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            className="fixed inset-0 w-screen h-screen max-w-none max-h-none flex flex-col bg-background p-4 gap-4 overflow-hidden border-none rounded-none translate-x-0 translate-y-0 [&>button]:hidden"
          >
            <EditorHeader />

            {/* MAIN BODY: 3 Columns */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">

              {/* LEFT SIDEBAR: Active Palette (Drawing Context) */}
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
                  />
                </div>
                <div className="flex-1 flex flex-row overflow-hidden relative">
                  {/* Drawing Tools Toolbar */}
                  <div className="flex-shrink-0 flex items-center p-2">
                    <DrawingToolbar
                      tool={pixelEditor.tool}
                      onToolChange={pixelEditor.setTool}
                    />
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
                    />
                    <ZoomControl />
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR: Utility Navigator + Dynamic Panel */}
              <div className="w-[350px] min-w-[350px] flex-shrink-0 flex bg-secondary/10 rounded-lg border border-border overflow-hidden">

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  {leftSidebarTab && (
                    <div className="flex-1 overflow-hidden flex flex-col p-3">
                      {leftSidebarTab === 'layers' && (
                        <LayersList />
                      )}
                      {leftSidebarTab === 'animations' && (
                        <AnimationLibrary />
                      )}
                      {leftSidebarTab === 'themes' && (
                        <PaletteLibrary />
                      )}
                      {leftSidebarTab === 'assets' && (
                        <AssetLibrary />
                      )}
                    </div>
                  )}
                </div>

                <EditorSidebarNavigator />
              </div>
            </div>

            {/* FOOTER: Timeline + Preview */}
            <div className="flex flex-row items-center justify-between pt-3 border-t border-border gap-4 flex-shrink-0">
              <TimelineStrip sensors={sensors} />
              <AnimationPreviewPanel ref={previewPanelRef} />
            </div>
          </DialogContent>

          <CloseConfirmationDialog
            open={showCloseConfirm}
            onOpenChange={setShowCloseConfirm}
            onConfirmSave={() => {
              handleSave();
              setShowCloseConfirm(false);
            }}
            onConfirmDiscard={() => {
              setShowCloseConfirm(false);
              onOpenChange(false);
            }}
          />
        </PaletteProvider>
      </SpriteEditorStoreProvider>
    </Dialog>
  );
};
