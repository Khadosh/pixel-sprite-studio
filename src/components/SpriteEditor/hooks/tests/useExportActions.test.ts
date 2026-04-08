import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExportActions } from '../useExportActions';
import { SpriteAsset } from '@/lib/types';
import * as exportUtils from '../../utils/exportUtils';

vi.mock('../../utils/exportUtils', () => ({
  exportAsPNG: vi.fn(),
  exportAsGIF: vi.fn(),
}));

const mockAsset: SpriteAsset = {
  id: 'test',
  name: 'Test',
  description: '',
  category: 'character',
  size: 16,
  palette: {},
  colorNames: {},
  layers: [],
  animations: [{ name: 'idle', label: 'IDLE', frameIndices: [0], fps: 5 }]
};

describe('useExportActions', () => {
  it('calls exportAsPNG with correct options', () => {
    const { result } = renderHook(() => useExportActions(mockAsset));
    
    result.current.handleExportPNG({ includeLabels: true });
    
    expect(exportUtils.exportAsPNG).toHaveBeenCalledWith(mockAsset, { includeLabels: true });
  });

  it('calls exportAsGIF with correct animation info', async () => {
    const { result } = renderHook(() => useExportActions(mockAsset));
    
    await result.current.handleExportGIF('idle');
    
    expect(exportUtils.exportAsGIF).toHaveBeenCalledWith(mockAsset, 'idle', 5);
  });
});
