import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpriteEditorStore } from '../../store/useSpriteEditorStore';
import { SpriteAsset } from '@/lib/types';
import * as exportUtils from '../../utils/exportUtils';
import React from 'react';

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

describe('SpriteEditorStore - Export Actions', () => {
  let store: any;

  beforeEach(() => {
    store = createSpriteEditorStore({
      initialAsset: JSON.parse(JSON.stringify(mockAsset)),
      onSave: vi.fn(),
      onOpenChange: vi.fn(),
      previewPanelRef: { current: null } as React.RefObject<any>,
    });
  });

  it('calls exportAsPNG with correct options', () => {
    store.getState().handleExportPNG({ includeLabels: true });
    expect(exportUtils.exportAsPNG).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test' }),
      { includeLabels: true }
    );
  });

  it('calls exportAsGIF with correct animation info', async () => {
    store.getState().setViewingAnimation('idle');
    await store.getState().handleExportGIF();
    expect(exportUtils.exportAsGIF).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test' }),
      'idle',
      5
    );
  });
});
