import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimationActions } from '../useAnimationActions';
import { SpriteAsset, AdvancedCastSettings } from '@/lib/types';

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

const mockCastSettings: AdvancedCastSettings = {
  shape: 'burst',
  element: 'generic'
};

describe('useAnimationActions', () => {
  let asset = { ...mockAsset };
  const setAsset = vi.fn((update) => {
    if (typeof update === 'function') asset = update(asset);
    else asset = update;
  });
  const setViewing = vi.fn();
  const setFrame = vi.fn();
  const previewRef = { current: { setIsPlaying: vi.fn() } };

  beforeEach(() => {
    asset = { ...mockAsset, animations: [] };
    vi.clearAllMocks();
  });

  it('generates an animation with sequential naming', () => {
    const { result, rerender } = renderHook(({ currentAsset }) => useAnimationActions(
      currentAsset, setAsset, 'base', setViewing, setFrame, previewRef as any, 'l1', mockCastSettings
    ), {
      initialProps: { currentAsset: asset }
    });

    act(() => {
      result.current.handleGenerateAnimations('idle');
    });

    expect(setAsset).toHaveBeenCalled();
    expect(asset.animations).toHaveLength(1);
    expect(asset.animations[0].name).toBe('idle');
    expect(asset.animations[0].label).toBe('IDLE');

    // Rerender with the updated asset
    rerender({ currentAsset: asset });

    // Generate again
    act(() => {
      result.current.handleGenerateAnimations('idle');
    });
    
    expect(asset.animations).toHaveLength(2);
    expect(asset.animations[1].name).toBe('idle_1');
    expect(asset.animations[1].label).toBe('IDLE 1');
  });

  it('renames an animation', () => {
    asset.animations = [{ name: 'idle', label: 'IDLE', frameIndices: [0], fps: 5 }];
    const { result } = renderHook(() => useAnimationActions(
      asset, setAsset, 'idle', setViewing, setFrame, previewRef as any, 'l1', mockCastSettings
    ));

    act(() => {
      result.current.handleRenameAnimation('idle', 'STANCE');
    });

    expect(asset.animations[0].label).toBe('STANCE');
  });

  it('removes an animation and resets viewing if active', () => {
    asset.animations = [{ name: 'idle', label: 'IDLE', frameIndices: [0], fps: 5 }];
    const { result } = renderHook(() => useAnimationActions(
      asset, setAsset, 'idle', setViewing, setFrame, previewRef as any, 'l1', mockCastSettings
    ));

    act(() => {
      result.current.handleRemoveAnimation('idle');
    });

    expect(asset.animations).toHaveLength(0);
    expect(setViewing).toHaveBeenCalledWith('base');
  });

  it('manages selection', () => {
    const { result } = renderHook(() => useAnimationActions(
      asset, setAsset, 'base', setViewing, setFrame, previewRef as any, 'l1', mockCastSettings
    ));

    act(() => {
      result.current.toggleAnim('walk');
    });
    expect(result.current.selectedAnims).toContain('walk');

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedAnims).toHaveLength(0);
  });
});
