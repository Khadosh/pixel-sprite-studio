import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PALETTE as DEFAULT_PALETTE } from '@/lib/pixelCharacter';

type Palette = Record<number, string>;

interface PaletteContextType {
  palette: Palette;
  setPaletteColor: (key: number, color: string) => void;
  resetPalette: () => void;
}

const PaletteContext = createContext<PaletteContextType | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<Palette>({ ...DEFAULT_PALETTE });

  const setPaletteColor = useCallback((key: number, color: string) => {
    setPalette(prev => ({ ...prev, [key]: color }));
  }, []);

  const resetPalette = useCallback(() => {
    setPalette({ ...DEFAULT_PALETTE });
  }, []);

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
