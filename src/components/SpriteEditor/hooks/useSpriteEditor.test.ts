import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpriteEditor } from './useSpriteEditor';
import { SpriteAsset } from '@/lib/types';

// Mocking dependencies
vi.mock('@/hooks/usePixelEditor', () => ({
  usePixelEditor: () => ({
    tool: 'pencil',
    setTool: vi.fn(),
    activeColorKey: 1,
    setActiveColorKey: vi.fn(),
    brushSize: 1,
    setBrushSize: vi.fn(),
    mirrorX: false,
    setMirrorX: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
  }),
}));

vi.mock('@/hooks/useGenerateAnimation', () => ({
  useGenerateAnimation: () => ({
    isGenerating: false,
    error: null,
    generateAnimationsSequence: vi.fn(),
  }),
}));

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

describe('useSpriteEditor', () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    initialAsset: mockAsset,
    onSave: vi.fn(),
  };

  it('initializes with the correct asset name', () => {
    const { result } = renderHook(() => useSpriteEditor(mockProps));
    expect(result.current.assetName).toBe('Test Sprite');
  });

  it('toggles onion skin', () => {
    const { result } = renderHook(() => useSpriteEditor(mockProps));
    expect(result.current.onionSkin).toBe(false);
    
    act(() => {
      result.current.setOnionSkin(true);
    });
    
    expect(result.current.onionSkin).toBe(true);
  });

  it('updates asset name', () => {
    const { result } = renderHook(() => useSpriteEditor(mockProps));
    
    act(() => {
      result.current.setAssetName('New Name');
    });
    
    expect(result.current.assetName).toBe('New Name');
  });
});
