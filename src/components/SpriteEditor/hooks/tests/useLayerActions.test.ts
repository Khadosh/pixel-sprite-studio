import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayerActions } from '../useLayerActions';
import { SpriteAsset } from '@/lib/types';

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
      data16: [
        [4, 5, 0],
        [0, 4, 0]
      ]
    }
  ]
}));

describe('useLayerActions', () => {
  let asset = { ...mockAsset };
  const setAsset = vi.fn((update) => {
    if (typeof update === 'function') asset = update(asset);
    else asset = update;
  });
  const setActiveId = vi.fn();

  beforeEach(() => {
    asset = { ...mockAsset, layers: [...mockAsset.layers] };
    vi.clearAllMocks();
  });

  it('adds a new empty layer', () => {
    const { result } = renderHook(() => useLayerActions(asset, setAsset, 'l1', setActiveId));

    act(() => {
      result.current.handleAddLayer();
    });

    expect(asset.layers).toHaveLength(2);
    expect(asset.layers[1].name).toBe('Layer 2');
    expect(setActiveId).toHaveBeenCalled();
  });

  it('removes a layer', () => {
    asset.layers.push({ ...mockAsset.layers[0], id: 'l2', name: 'Layer 2' });
    const { result } = renderHook(() => useLayerActions(asset, setAsset, 'l2', setActiveId));

    act(() => {
      result.current.handleRemoveLayer('l2');
    });

    expect(asset.layers).toHaveLength(1);
    expect(asset.layers[0].id).toBe('l1');
  });

  it('toggles visibility', () => {
    const { result } = renderHook(() => useLayerActions(asset, setAsset, 'l1', setActiveId));

    act(() => {
      result.current.handleToggleLayerVisibility('l1');
    });

    expect(asset.layers[0].isVisible).toBe(false);
  });

  it('adds a prop layer and DETECTS PALETTE COLORS', () => {
    const { result } = renderHook(() => useLayerActions(asset, setAsset, 'l1', setActiveId));

    act(() => {
      result.current.handleAddPropLayer('staff');
    });

    const newLayer = asset.layers[asset.layers.length - 1];
    expect(newLayer.name).toBe('Staff');
    // Staff mocked data uses colors 4 and 5
    expect(newLayer.paletteIds).toContain(4);
    expect(newLayer.paletteIds).toContain(5);
    expect(newLayer.paletteIds).not.toContain(0);
  });
});
