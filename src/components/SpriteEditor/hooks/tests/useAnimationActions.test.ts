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
    }
  ],
  animations: []
};

describe('SpriteEditorStore - Animation Actions', () => {
  let store: any;

  beforeEach(() => {
    store = createSpriteEditorStore({
      initialAsset: JSON.parse(JSON.stringify(mockAsset)),
      onSave: vi.fn(),
      onOpenChange: vi.fn(),
      previewPanelRef: { current: { setIsPlaying: vi.fn() } } as any,
    });
  });

  it('generates an animation with sequential naming', () => {
    store.getState().generateAnimations('idle');
    
    let state = store.getState();
    expect(state.editedAsset.animations).toHaveLength(1);
    expect(state.editedAsset.animations[0].name).toBe('idle');
    expect(state.editedAsset.animations[0].label).toBe('IDLE');

    // Generate again
    store.getState().generateAnimations('idle');
    state = store.getState();
    expect(state.editedAsset.animations).toHaveLength(2);
    expect(state.editedAsset.animations[1].name).toBe('idle_1');
    expect(state.editedAsset.animations[1].label).toBe('IDLE 1');
  });

  it('renames an animation', () => {
    // Add one first
    store.getState().generateAnimations('idle');
    
    store.getState().renameAnimation('idle', 'STANCE');
    expect(store.getState().editedAsset.animations[0].label).toBe('STANCE');
  });

  it('removes an animation and resets viewing if active', () => {
    store.getState().generateAnimations('idle');
    store.getState().setViewingAnimation('idle');
    
    store.getState().removeAnimation('idle');
    const state = store.getState();
    expect(state.editedAsset.animations).toHaveLength(0);
    expect(state.viewingAnimation).toBe('base');
  });
});
