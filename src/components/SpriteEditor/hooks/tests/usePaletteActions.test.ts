import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaletteActions } from '../usePaletteActions';
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
      paletteIds: [1]
    }
  ],
  animations: []
};

describe('usePaletteActions', () => {
  let asset = { ...mockAsset };
  const setAsset = vi.fn((update) => {
    if (typeof update === 'function') asset = update(asset);
    else asset = update;
  });
  const setActiveKey = vi.fn();

  beforeEach(() => {
    asset = JSON.parse(JSON.stringify(mockAsset));
    vi.clearAllMocks();
  });

  it('changes a color in the palette', () => {
    const { result } = renderHook(() => usePaletteActions(asset, setAsset, 'l1', 1, setActiveKey));

    act(() => {
      result.current.handleChangeColor(1, '#ff0000');
    });

    expect(asset.palette[1]).toBe('#ff0000');
  });

  it('renames a color', () => {
    const { result } = renderHook(() => usePaletteActions(asset, setAsset, 'l1', 1, setActiveKey));

    act(() => {
      result.current.handleRenameColor(1, 'Red');
    });

    expect(asset.colorNames[1]).toBe('Red');
  });

  it('adds a new color and adds it to the active layer paletteIds', () => {
    const { result } = renderHook(() => usePaletteActions(asset, setAsset, 'l1', 1, setActiveKey));

    act(() => {
      result.current.handleAddColor();
    });

    const newKey = 2;
    expect(asset.palette[newKey]).toBeDefined();
    expect(asset.layers[0].paletteIds).toContain(newKey);
  });

  it('removes a color and cleans up layers', () => {
    // Add pixel with color 1
    asset.layers[0].frames[0][0][0] = 1;
    
    const { result } = renderHook(() => usePaletteActions(asset, setAsset, 'l1', 1, setActiveKey));

    act(() => {
      result.current.handleRemoveColor(1);
    });

    expect(asset.palette[1]).toBeUndefined();
    expect(asset.layers[0].paletteIds).not.toContain(1);
    expect(asset.layers[0].frames[0][0][0]).toBe(0); // Pixel should become transparent
  });
});
