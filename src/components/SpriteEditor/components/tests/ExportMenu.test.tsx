import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createSpriteEditorStore, SpriteEditorStore } from '../../store/useSpriteEditorStore';
import { SpriteEditorStoreProvider } from '../../context/SpriteEditorContext';
import { ExportMenu } from '../ExportMenu';
import { SpriteAsset } from '@/lib/types';

// Radix DropdownMenu necesita estas APIs que jsdom no implementa.
beforeAll(() => {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const mockAsset: SpriteAsset = {
  id: 'test',
  name: 'Test',
  description: '',
  category: 'character',
  size: 16,
  palette: { 0: 'transparent', 1: '#ffffff' },
  colorNames: { 0: 'Transparent', 1: 'White' },
  layers: [
    { id: 'l1', name: 'Body', isVisible: true, isLocked: false, opacity: 1, frames: [[[0]]] },
  ],
  animations: [{ name: 'walk', label: 'WALK', frameIndices: [0], fps: 8 }],
};

function setup(overrides: Partial<ReturnType<SpriteEditorStore['getState']>> = {}) {
  const store = createSpriteEditorStore({
    initialAsset: JSON.parse(JSON.stringify(mockAsset)),
    onSave: vi.fn(),
    onOpenChange: vi.fn(),
    previewPanelRef: { current: null } as React.RefObject<never>,
  });
  const handleExportPNG = vi.fn();
  const handleExportLayerPNG = vi.fn();
  const handleExportGIF = vi.fn().mockResolvedValue(undefined);
  const handleExportJSON = vi.fn();
  store.setState({ handleExportPNG, handleExportLayerPNG, handleExportGIF, handleExportJSON, ...overrides });

  render(
    <SpriteEditorStoreProvider store={store}>
      <ExportMenu />
    </SpriteEditorStoreProvider>
  );

  const open = () => fireEvent.keyDown(screen.getByRole('button', { name: /exportar/i }), { key: 'Enter' });
  return { store, open, handleExportPNG, handleExportLayerPNG, handleExportGIF, handleExportJSON };
}

describe('ExportMenu', () => {
  it('renders every export option with the active layer and animation names', () => {
    const { open, store } = setup();
    act(() => store.getState().setViewingAnimation('walk'));
    open();

    expect(screen.getByText('PNG SPRITE SHEET')).toBeInTheDocument();
    expect(screen.getByText('PNG CON ETIQUETAS')).toBeInTheDocument();
    expect(screen.getByText('PNG LAYER ACTUAL (BODY)')).toBeInTheDocument();
    expect(screen.getByText('EXPORTAR GIF (WALK)')).toBeInTheDocument();
    // jsdom corre en "localhost": el ítem de debug tiene que estar
    expect(screen.getByText('DEBUG: COPIAR JSON')).toBeInTheDocument();
  });

  it('dispatches the store handlers with the right options', async () => {
    const { open, handleExportPNG, handleExportLayerPNG, handleExportGIF } = setup();

    open();
    fireEvent.click(screen.getByText('PNG CON ETIQUETAS'));
    expect(handleExportPNG).toHaveBeenCalledWith({ includeLabels: true });

    open();
    fireEvent.click(screen.getByText('PNG SPRITE SHEET'));
    expect(handleExportPNG).toHaveBeenLastCalledWith();

    open();
    fireEvent.click(screen.getByText(/PNG LAYER ACTUAL/));
    expect(handleExportLayerPNG).toHaveBeenCalledTimes(1);

    open();
    fireEvent.click(screen.getByText(/EXPORTAR GIF/));
    expect(handleExportGIF).toHaveBeenCalledTimes(1);
  });

  it('disables the layer export when there is no active layer', () => {
    const { open, handleExportLayerPNG } = setup({ activeLayerId: null });
    open();

    const item = screen.getByText('PNG LAYER ACTUAL').closest('[role="menuitem"]');
    expect(item).toHaveAttribute('data-disabled');

    fireEvent.click(screen.getByText('PNG LAYER ACTUAL'));
    expect(handleExportLayerPNG).not.toHaveBeenCalled();
  });
});
