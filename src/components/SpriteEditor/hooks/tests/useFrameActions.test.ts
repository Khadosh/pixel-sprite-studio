import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFrameActions } from '../useFrameActions';
import { SpriteAsset } from '@/lib/types';

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

describe('useFrameActions', () => {
  let asset = { ...mockAsset };
  const setAsset = vi.fn((update) => {
    if (typeof update === 'function') asset = update(asset);
    else asset = update;
  });
  const setFrameIndex = vi.fn();

  beforeEach(() => {
    asset = JSON.parse(JSON.stringify(mockAsset));
    vi.clearAllMocks();
  });

  it('generates frame labels based on animations', () => {
    const { result } = renderHook(() => useFrameActions(asset, setAsset, 0, setFrameIndex));
    
    expect(result.current.frameLabels[0]).toBe('WALK 1');
  });

  it('duplicates a frame', () => {
    const { result } = renderHook(() => useFrameActions(asset, setAsset, 0, setFrameIndex));

    act(() => {
      result.current.handleDuplicateFrame(0);
    });

    expect(asset.layers[0].frames).toHaveLength(2);
  });

  it('inserts an empty frame', () => {
    const { result } = renderHook(() => useFrameActions(asset, setAsset, 0, setFrameIndex));

    act(() => {
      result.current.handleInsertEmptyFrame(0);
    });

    expect(asset.layers[0].frames).toHaveLength(2);
  });

  it('deletes a frame', () => {
    // Start with 2 frames
    asset.layers[0].frames.push(Array(16).fill(0).map(() => Array(16).fill(0)));
    
    const { result } = renderHook(() => useFrameActions(asset, setAsset, 1, setFrameIndex));

    act(() => {
      result.current.handleDeleteFrame(1);
    });

    expect(asset.layers[0].frames).toHaveLength(1);
    expect(setFrameIndex).toHaveBeenCalledWith(0);
  });
});
