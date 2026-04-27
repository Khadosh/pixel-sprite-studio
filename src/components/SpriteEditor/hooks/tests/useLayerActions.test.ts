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
  palette: { 1: '#ffffff', 4: '#00ff00', 5: '#0000ff' },
  colorNames: { 1: 'White', 4: 'Green', 5: 'Blue' },
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

// Mock PROP_LIBRARY
vi.mock('@/lib/assets/props', () => ({
  PROP_LIBRARY: [
    {
      id: 'staff',
      name: 'Staff',
      category: 'weapon',
      palette: { 4: '#00ff00', 5: '#0000ff' },
      data16: [
        [4, 5, 0],
        [0, 4, 0]
      ]
    }
  ]
}));

describe('SpriteEditorStore - Layer Actions', () => {
  let store: any;

  beforeEach(() => {
    store = createSpriteEditorStore({
      initialAsset: JSON.parse(JSON.stringify(mockAsset)),
      onSave: vi.fn(),
      onOpenChange: vi.fn(),
      previewPanelRef: { current: null } as React.RefObject<any>,
    });
  });

  it('adds a new empty layer', () => {
    store.getState().addLayer();
    const state = store.getState();
    expect(state.editedAsset.layers).toHaveLength(2);
    expect(state.editedAsset.layers[1].name).toBe('Layer 2');
    expect(state.activeLayerId).toBe(state.editedAsset.layers[1].id);
  });

  it('removes a layer', () => {
    // Add a second layer first
    store.getState().addLayer();
    const l2Id = store.getState().editedAsset.layers[1].id;
    
    store.getState().removeLayer(l2Id);
    expect(store.getState().editedAsset.layers).toHaveLength(1);
    expect(store.getState().editedAsset.layers[0].id).toBe('l1');
  });

  it('toggles visibility', () => {
    store.getState().toggleLayerVisibility('l1');
    expect(store.getState().editedAsset.layers[0].isVisible).toBe(false);
  });

  it('adds a prop layer and detects palette colors', () => {
    store.getState().addPropLayer('staff');
    const state = store.getState();
    const newLayer = state.editedAsset.layers[state.editedAsset.layers.length - 1];
    expect(newLayer.name).toBe('Staff');
    // Staff mocked data uses colors 4 and 5
    expect(newLayer.paletteIds).toContain(4);
    expect(newLayer.paletteIds).toContain(5);
  });
});
