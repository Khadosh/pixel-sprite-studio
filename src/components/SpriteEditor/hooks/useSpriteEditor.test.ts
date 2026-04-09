import { describe, it, expect, vi } from 'vitest';
import { createSpriteEditorStore } from '../store/useSpriteEditorStore';
import { SpriteAsset } from '@/lib/types';
import React from 'react';

const mockAsset: SpriteAsset = {
  id: 'test-sprite',
  name: 'Test Sprite',
  description: 'Test sprite',
  category: 'character',
  size: 16,
  palette: { 1: '#ffffff' },
  colorNames: { 1: 'White' },
  layers: [
    {
      id: 'layer-1',
      name: 'Layer 1',
      isVisible: true,
      isLocked: false,
      opacity: 1,
      frames: [Array(16).fill(Array(16).fill(0))],
    }
  ],
  animations: [],
};

const createTestStore = () => createSpriteEditorStore({
  initialAsset: mockAsset,
  onSave: vi.fn(),
  onOpenChange: vi.fn(),
  previewPanelRef: { current: null } as React.RefObject<any>,
});

describe('SpriteEditorStore', () => {
  it('initializes with the correct asset name', () => {
    const store = createTestStore();
    expect(store.getState().assetName).toBe('Test Sprite');
  });

  it('toggles onion skin', () => {
    const store = createTestStore();
    expect(store.getState().onionSkin).toBe(false);
    
    store.getState().setOnionSkin(true);
    expect(store.getState().onionSkin).toBe(true);
  });

  it('updates asset name', () => {
    const store = createTestStore();
    
    store.getState().setAssetName('New Name');
    expect(store.getState().assetName).toBe('New Name');
  });
});
