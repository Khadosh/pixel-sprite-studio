import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpriteEditorStore } from '../../store/useSpriteEditorStore';
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
      paletteIds: [1]
    }
  ],
  animations: []
};

describe('SpriteEditorStore - Palette Actions', () => {
  let store: any;

  beforeEach(() => {
    store = createSpriteEditorStore({
      initialAsset: JSON.parse(JSON.stringify(mockAsset)),
      onSave: vi.fn(),
      onOpenChange: vi.fn(),
      previewPanelRef: { current: null } as React.RefObject<any>,
    });
  });

  it('changes a color in the palette', () => {
    store.getState().changeColor(1, '#ff0000');
    expect(store.getState().editedAsset.palette[1]).toBe('#ff0000');
  });

  it('renames a color', () => {
    store.getState().renameColor(1, 'Red');
    expect(store.getState().editedAsset.colorNames[1]).toBe('Red');
  });

  it('adds a new color and adds it to the active layer paletteIds', () => {
    store.getState().addColor();
    const state = store.getState();
    const newKey = 17; // Initial 16 theory colors + this one
    expect(state.editedAsset.palette[newKey]).toBeDefined();
    expect(state.editedAsset.layers[0].paletteIds).toContain(newKey);
  });

  it('removes a color and cleans up layers', () => {
    // Add pixel with color 1
    const asset = store.getState().editedAsset;
    asset.layers[0].frames[0][0][0] = 1;
    store.setState({ editedAsset: asset });
    
    store.getState().removeColor(1);
    
    const state = store.getState();
    expect(state.editedAsset.palette[1]).toBeUndefined();
    expect(state.editedAsset.layers[0].paletteIds).not.toContain(1);
    expect(state.editedAsset.layers[0].frames[0][0][0]).toBe(0); // Pixel should become transparent
  });
});
