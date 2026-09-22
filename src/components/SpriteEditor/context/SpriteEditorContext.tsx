import React, { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { SpriteEditorStore, SpriteEditorState } from '../store/useSpriteEditorStore';

const SpriteEditorStoreContext = createContext<SpriteEditorStore | null>(null);

export const SpriteEditorStoreProvider: React.FC<{ store: SpriteEditorStore; children: React.ReactNode }> = ({ store, children }) => {
  return <SpriteEditorStoreContext.Provider value={store}>{children}</SpriteEditorStoreContext.Provider>;
};

/**
 * Hook to access the SpriteEditor Zustand store.
 * Use with a selector for optimal re-render performance:
 * 
 * const editedAsset = useSpriteEditorStore(s => s.editedAsset);
 * const { zoom, setZoom } = useSpriteEditorStore(s => ({ zoom: s.zoom, setZoom: s.setZoom }));
 */
export function useSpriteEditorStore<T>(selector: (state: SpriteEditorState) => T): T {
  const store = useContext(SpriteEditorStoreContext);
  if (!store) {
    throw new Error('useSpriteEditorStore must be used within a SpriteEditorStoreProvider');
  }
  return useStore(store, selector);
}

/** Get the raw store API (for imperative access, e.g. in effects) */
export function useSpriteEditorStoreApi(): SpriteEditorStore {
  const store = useContext(SpriteEditorStoreContext);
  if (!store) {
    throw new Error('useSpriteEditorStoreApi must be used within a SpriteEditorStoreProvider');
  }
  return store;
}

/**
 * Como `useSpriteEditorStoreApi`, pero devuelve `null` fuera del provider.
 * Para hooks que funcionan tanto dentro como fuera del editor (p. ej. generación de IA
 * desde el workspace), sin envolver un hook en try/catch.
 */
export function useOptionalSpriteEditorStoreApi(): SpriteEditorStore | null {
  return useContext(SpriteEditorStoreContext);
}
