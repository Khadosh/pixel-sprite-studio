import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransformActions } from '../useTransformActions';
import { SpriteAsset } from '@/lib/types';

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

describe('useTransformActions', () => {
  let asset = { ...mockAsset };
  const setAsset = vi.fn((update) => {
    if (typeof update === 'function') asset = update(asset);
    else asset = update;
  });
  const overwriteFrame = vi.fn((pixels) => {
    asset.layers[0].frames[0] = pixels;
  });

  beforeEach(() => {
    asset = JSON.parse(JSON.stringify(mockAsset));
    vi.clearAllMocks();
  });

  it('flips horizontally in layer scope', () => {
    const { result } = renderHook(() => useTransformActions(
      asset, setAsset, 0, 'l1', 'base', 'layer', overwriteFrame
    ));

    act(() => {
      result.current.handleFlipH();
    });

    expect(overwriteFrame).toHaveBeenCalled();
    // [[1, 0], [0, 0]] -> [[0, 1], [0, 0]]
    expect(asset.layers[0].frames[0][0][1]).toBe(1);
    expect(asset.layers[0].frames[0][0][0]).toBe(0);
  });

  it('rotates 90 degrees', () => {
    const { result } = renderHook(() => useTransformActions(
      asset, setAsset, 0, 'l1', 'base', 'layer', overwriteFrame
    ));

    act(() => {
      result.current.handleRotate();
    });

    // [[1, 0], [0, 0]] rotate 90 -> [[0, 1], [0, 0]]
    expect(asset.layers[0].frames[0][0][1]).toBe(1);
  });

  it('copies and pastes layer frame', () => {
    const setLClip = vi.fn();
    const setFClip = vi.fn();
    
    const { result } = renderHook(() => useTransformActions(
      asset, setAsset, 0, 'l1', 'base', 'layer', overwriteFrame
    ));

    act(() => {
      result.current.handleCopy(setLClip, setFClip);
    });

    expect(setLClip).toHaveBeenCalledWith([[1, 0], [0, 0]]);

    act(() => {
      result.current.handlePaste([[0, 1], [1, 0]], null);
    });

    expect(overwriteFrame).toHaveBeenCalled();
    expect(asset.layers[0].frames[0][0][1]).toBe(1);
    expect(asset.layers[0].frames[0][1][0]).toBe(1);
  });
});
