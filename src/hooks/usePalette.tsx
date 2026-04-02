import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Palette = Record<number, string>;

interface PaletteContextType {
  palette: Palette;
  setPaletteColor: (key: number, color: string) => void;
  resetPalette: () => void;
}

const PaletteContext = createContext<PaletteContextType | null>(null);

interface PaletteProviderProps {
  defaultPalette: Record<number, string>;
  children: ReactNode;
}

/**
 * Provides a per-asset palette context.
 * Place inside the asset detail page, scoped to that asset's palette.
 */
export function PaletteProvider({ defaultPalette, children }: PaletteProviderProps) {
  const [palette, setPalette] = useState<Palette>({ ...defaultPalette });

  const setPaletteColor = useCallback((key: number, color: string) => {
    setPalette(prev => ({ ...prev, [key]: color }));
  }, []);

  const resetPalette = useCallback(() => {
    setPalette({ ...defaultPalette });
  }, [defaultPalette]);

  return (
    <PaletteContext.Provider value={{ palette, setPaletteColor, resetPalette }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error('usePalette must be used within PaletteProvider');
  return ctx;
}
