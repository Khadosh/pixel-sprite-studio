import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpriteEditorStore } from '../../store/useSpriteEditorStore';
import { SpriteAsset } from '@/lib/types';
import React from 'react';

const mockAsset: SpriteAsset = {
  id: 'test',
  name: 'Test',
  description: '',
  category: 'character',
  size: 2, // 2x2 for easy testing
  palette: { 1: '#ffffff' },
  colorNames: { 1: 'White' },
  layers: [
    {
      id: 'l1',
      name: 'Layer 1',
      isVisible: true,
      isLocked: false,
      opacity: 1,
      frames: [
        [[1, 0], [0, 0]]
      ],
    }
  ],
  animations: []
};

describe('SpriteEditorStore - Transform Actions', () => {
  let store: any;
  const overwriteFrame = vi.fn((pixels) => {
    const asset = store.getState().editedAsset;
    asset.layers[0].frames[0] = pixels;
    store.setState({ editedAsset: { ...asset } });
  });

  beforeEach(() => {
    store = createSpriteEditorStore({
      initialAsset: JSON.parse(JSON.stringify(mockAsset)),
      onSave: vi.fn(),
      onOpenChange: vi.fn(),
      previewPanelRef: { current: null } as React.RefObject<any>,
    });
    
    // Inject bridge mock for overwrite
    store.getState().setPixelEditorBridge({
      overwriteLayerFrame: overwriteFrame,
      copySelection: vi.fn(),
      pasteSelection: vi.fn(),
    } as any);
  });

  it('flips horizontally in layer scope', () => {
    store.getState().handleFlipH();
    
    expect(overwriteFrame).toHaveBeenCalled();
    const state = store.getState();
    // [[1, 0], [0, 0]] -> [[0, 1], [0, 0]]
    expect(state.editedAsset.layers[0].frames[0][0][1]).toBe(1);
    expect(state.editedAsset.layers[0].frames[0][0][0]).toBe(0);
  });

  it('rotates 90 degrees', () => {
    store.getState().handleRotate();
    
    const state = store.getState();
    // [[1, 0], [0, 0]] rotate 90 -> [[0, 1], [0, 0]]
    expect(state.editedAsset.layers[0].frames[0][0][1]).toBe(1);
  });

  it('copies and pastes layer frame', () => {
    store.getState().handleCopy();
    
    const state = store.getState();
    expect(state.layerClipboard).toEqual([[1, 0], [0, 0]]);

    store.getState().handlePaste();
    expect(overwriteFrame).toHaveBeenCalled();
  });
});
