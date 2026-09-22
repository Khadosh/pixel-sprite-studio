import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpriteEditorStore } from '../../store/useSpriteEditorStore';
import { SpriteAsset } from '@/lib/types';
import * as exportUtils from '../../utils/exportUtils';
import React from 'react';

vi.mock('../../utils/exportUtils', () => ({
  exportAsPNG: vi.fn(),
  exportAsGIF: vi.fn(),
  exportLayerAsPNG: vi.fn(),
}));

const mockAsset: SpriteAsset = {
  id: 'test',
  name: 'Test',
  description: '',
  category: 'character',
  size: 16,
  palette: {},
  colorNames: {},
  layers: [
    { id: 'l1', name: 'Body', isVisible: true, isLocked: false, opacity: 1, frames: [[[0]], [[1]]] },
    { id: 'l2', name: 'Hat', isVisible: true, isLocked: false, opacity: 1, frames: [[[0]], [[1]]] },
  ],
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

  it('exports only the active layer at the frame being edited', () => {
    store.setState({ activeLayerId: 'l2', editingFrameIndex: 1 });
    store.getState().handleExportLayerPNG();
    expect(exportUtils.exportLayerAsPNG).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test' }),
      expect.objectContaining({ id: 'l2', name: 'Hat' }),
      1
    );
  });

  it('does not export when there is no active layer', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    store.setState({ activeLayerId: null });
    store.getState().handleExportLayerPNG();
    expect(exportUtils.exportLayerAsPNG).not.toHaveBeenCalled();
  });
});
