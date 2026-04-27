import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpriteEditorStore } from '../../store/useSpriteEditorStore';
import { selectFrameLabels } from '../../store/derived';
import { SpriteAsset } from '@/lib/types';
import React from 'react';

const mockAsset: SpriteAsset = {
  id: 'test',
  name: 'Test',
  description: '',
  category: 'character',
  size: 16,
  palette: { 1: '#ffffff' },
  colorNames: { 1: 'White' },
  layers: [
    {
      id: 'l1',
      name: 'Layer 1',
      isVisible: true,
      isLocked: false,
      opacity: 1,
      frames: [Array(16).fill(0).map(() => Array(16).fill(0))],
    }
  ],
  animations: [
    { name: 'walk', label: 'WALK', frameIndices: [0], fps: 5 }
  ]
};

describe('SpriteEditorStore - Frame Actions', () => {
  let store: any;

  beforeEach(() => {
    store = createSpriteEditorStore({
      initialAsset: JSON.parse(JSON.stringify(mockAsset)),
      onSave: vi.fn(),
      onOpenChange: vi.fn(),
      previewPanelRef: { current: null } as React.RefObject<any>,
    });
  });

  it('generates frame labels based on animations', () => {
    const labels = selectFrameLabels(store.getState());
    expect(labels[0]).toBe('WALK 1');
  });

  it('duplicates a frame', () => {
    // Initial state has 4 canonical frames
    store.getState().duplicateFrame(0);
    const state = store.getState();
    expect(state.editedAsset.layers[0].frames).toHaveLength(5);
  });

  it('inserts an empty frame', () => {
    store.getState().insertEmptyFrame(0);
    const state = store.getState();
    expect(state.editedAsset.layers[0].frames).toHaveLength(5);
  });

  it('deletes a frame', () => {
    // Start with 5 frames (4 base + 1 duplicate)
    store.getState().duplicateFrame(0);
    expect(store.getState().editedAsset.layers[0].frames).toHaveLength(5);
    
    // Set active frame to 1
    store.getState().setEditingFrameIndex(1);
    
    store.getState().deleteFrame(1);
    const state = store.getState();
    expect(state.editedAsset.layers[0].frames).toHaveLength(4);
    expect(state.editingFrameIndex).toBe(0);
  });
});
