import { useEffect } from 'react';
import type { SpriteEditorStore } from '../store/useSpriteEditorStore';
import { selectFrameCount } from '../store/derived';

/**
 * Side-effects and keyboard shortcuts for the SpriteEditor.
 * Extracted from the old useSpriteEditor orchestrator hook.
 */
export function useEditorEffects(store: SpriteEditorStore) {
  // Clamp editingFrameIndex when frameCount changes
  useEffect(() => {
    const unsub = store.subscribe((state, prev) => {
      const frameCount = selectFrameCount(state);
      if (state.editingFrameIndex >= frameCount && frameCount > 0) {
        store.getState().setEditingFrameIndex(0);
      }
    });
    return unsub;
  }, [store]);

  // Reset state when a different asset is loaded (initialAsset.id changes)
  // This is handled by SpriteEditor.tsx via initFromAsset

  // Clear selection when switching away from select tool
  useEffect(() => {
    const unsub = store.subscribe((state) => {
      const bridge = state._pixelEditorBridge;
      if (!bridge) return;
      const tool = bridge.tool;
      if (tool !== 'select' && tool !== 'rotate') {
        if (bridge.movingSelectionPixels) bridge.stampSelection();
        bridge.setSelectionRect(null);
      }
    });
    return unsub;
  }, [store]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      const state = store.getState();
      const bridge = state._pixelEditorBridge;
      if (!bridge) return;

      switch (e.key.toLowerCase()) {
        case 'b': bridge.setTool('pencil'); break;
        case 'e': bridge.setTool('eraser'); break;
        case 'i': bridge.setTool('picker'); break;
        case 'g': bridge.setTool('fill'); break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            state.handlePaste();
          } else {
            bridge.setTool('select');
          }
          break;
        case 'r': bridge.setTool('rotate'); break;
        case 's': bridge.setTool('select'); break;
        case 'm': bridge.setMirrorX((prev: boolean) => !prev); break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            bridge.undo();
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            state.handleCopy();
          }
          break;
        case 'o':
          state.setOnionSkin(!state.onionSkin);
          break;
        case 'escape':
          bridge.setSelectionRect(null);
          break;
        case 'backspace':
        case 'delete':
          if (bridge.tool === 'select' && bridge.selectionRect) {
            e.preventDefault();
            if (bridge.movingSelectionPixels) {
              bridge.clearFloatingPixels();
            } else {
              const baseFrame = state.editedAsset.layers.find(l => l.id === state.activeLayerId)?.frames[state.editingFrameIndex];
              if (baseFrame) {
                const selRect = bridge.selectionRect;
                const newFrame = baseFrame.map(row => [...row]);
                for (let r = selRect.r; r < selRect.r + selRect.h; r++) {
                  for (let c = selRect.c; c < selRect.c + selRect.w; c++) {
                    if (r >= 0 && r < state.editedAsset.size && c >= 0 && c < state.editedAsset.size) {
                      newFrame[r][c] = 0;
                    }
                  }
                }
                bridge.overwriteLayerFrame(newFrame);
              }
            }
            bridge.setSelectionRect(null);
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            state.setZoom((prev: number) => Math.min(prev + 0.1, 8));
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            state.setZoom((prev: number) => Math.max(prev - 0.1, 0.1));
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            state.setZoom(1.0);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);
}
