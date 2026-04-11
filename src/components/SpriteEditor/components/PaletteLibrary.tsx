import React from 'react';
import { Button } from '@/components/ui/button';
import { PALETTE_LIBRARY } from '@/lib/assets/palettes';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';
import { PxCheck, PxPlus, PxPalette } from '@/components/icons/PixelIcon';
import { ScrollArea } from '@/components/ui/scroll-area';

export const PaletteLibrary = () => {
  const applyPalettePreset = useSpriteEditorStore(s => s.applyPalettePreset);
  const addColorRamp = useSpriteEditorStore(s => s.addColorRamp);

  const categories = Array.from(new Set(PALETTE_LIBRARY.map(p => p.category)));

  return (
    <div className="flex flex-col h-full bg-background/40">
      <div className="p-3 border-b border-border bg-secondary/20 shrink-0">
        <h3 className="font-pixel text-[12px] text-primary flex items-center gap-2">
          <PxPalette size={14} /> LIBRERÍA DE TEMAS
        </h3>
        <p className="text-[8px] text-muted-foreground mt-1 font-mono uppercase tracking-wider leading-tight">
          Slynyrd Pixel Theory & Retro Consoles
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {categories.map(cat => (
            <div key={cat} className="space-y-2">
              <h4 className="font-pixel text-[8px] text-muted-foreground uppercase tracking-widest border-l-2 border-primary/30 pl-2">
                {cat}
              </h4>
              <div className="grid gap-2">
                {PALETTE_LIBRARY.filter(p => p.category === cat).map(preset => (
                  <div 
                    key={preset.id}
                    className="p-2 rounded-lg border border-border bg-background/60 hover:border-primary/40 transition-all group"
                  >
                    <div className="mb-2">
                      <span className="font-pixel text-[9px] text-foreground block truncate">{preset.name.toUpperCase()}</span>
                      <p className="text-[7px] text-muted-foreground font-mono leading-tight mt-0.5 opacity-70">
                        {preset.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-0.5 mb-3">
                      {preset.colors.map((c, i) => (
                        <div 
                          key={i}
                          className="w-4 h-4 rounded-sm border border-black/20"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyPalettePreset(preset.colors)}
                        className="h-6 w-full text-[7px] font-pixel border-primary/20 hover:bg-primary/20 flex items-center justify-center gap-1"
                      >
                        <PxCheck size={10} /> REEMPLAZAR
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addColorRamp(preset.colors)}
                        className="h-6 w-full text-[7px] font-pixel bg-secondary/30 hover:bg-secondary/50 flex items-center justify-center gap-1"
                      >
                        <PxPlus size={10} /> AÑADIR RAMPA
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
