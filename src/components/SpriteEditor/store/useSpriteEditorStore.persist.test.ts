import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createSpriteEditorStore } from './useSpriteEditorStore';
import { SpriteAsset } from '@/lib/types';

const baseAsset: SpriteAsset = {
  id: 'sprite-1',
  name: 'Original',
  description: 'v1',
  category: 'character',
  size: 4,
  palette: { 0: 'transparent', 1: '#ffffff', 2: '#000000', 3: '#ff0000' },
  colorNames: { 0: 'Transparent', 1: 'White', 2: 'Black', 3: 'Red' },
  layers: [
    { id: 'l1', name: 'Body', isVisible: true, isLocked: false, opacity: 1, frames: [Array(4).fill(Array(4).fill(0))] },
  ],
  animations: [],
};

const makeStore = (asset: SpriteAsset, projectId?: string) => createSpriteEditorStore({
  initialAsset: JSON.parse(JSON.stringify(asset)),
  onSave: vi.fn(),
  onOpenChange: vi.fn(),
  previewPanelRef: { current: null } as React.RefObject<never>,
  projectId,
});

describe('SpriteEditorStore - snapshot local vs asset de la DB', () => {
  it('rehidrata el borrador local cuando el asset de origen es el mismo', () => {
    const first = makeStore(baseAsset);
    first.getState().setAssetName('Editado localmente');
    expect(localStorage.getItem('pps-editor-sprite-1')).not.toBeNull();

    const second = makeStore(baseAsset);
    expect(second.getState().assetName).toBe('Editado localmente');
    expect(second.getState().isDirty).toBe(true);
  });

  it('descarta el borrador local si el asset cambió en la DB', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const first = makeStore(baseAsset);
    first.getState().setAssetName('Editado localmente');

    const fromDb: SpriteAsset = { ...baseAsset, description: 'v2 guardada desde otro dispositivo' };
    const second = makeStore(fromDb);

    expect(second.getState().assetName).toBe('Original');
    expect(second.getState().editedAsset.description).toBe('v2 guardada desde otro dispositivo');
    expect(second.getState().isDirty).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pps-editor-sprite-1'));

    warn.mockRestore();
  });

  it('descarta snapshots viejos que no tienen huella de origen', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('pps-editor-sprite-1', JSON.stringify({
      version: 'dto-v2',
      state: { assetName: 'Snapshot legacy', isDirty: true, editedAsset: { ...baseAsset, name: 'Snapshot legacy' } },
    }));

    const store = makeStore(baseAsset);
    expect(store.getState().assetName).toBe('Original');
  });

  it('separa por proyecto la clave de los sprites nuevos (sin id)', () => {
    const untitled = { ...baseAsset, id: '' };
    makeStore(untitled, 'proj-a').getState().setAssetName('Nuevo en A');
    makeStore(untitled, 'proj-b').getState().setAssetName('Nuevo en B');

    expect(localStorage.getItem('pps-editor-new-proj-a')).not.toBeNull();
    expect(localStorage.getItem('pps-editor-new-proj-b')).not.toBeNull();
    expect(makeStore(untitled, 'proj-a').getState().assetName).toBe('Nuevo en A');
    expect(makeStore(untitled, 'proj-b').getState().assetName).toBe('Nuevo en B');
  });
});
