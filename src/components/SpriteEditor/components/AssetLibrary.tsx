import React from 'react';
import { Button } from '@/components/ui/button';
import { Sword } from 'lucide-react';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';
import { PROP_LIBRARY } from '@/lib/assets/props';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AssetLibrary = () => {
  const handleAddPropLayer = useSpriteEditorStore(s => s.addPropLayer);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border bg-secondary/10 shrink-0">
        <h3 className="font-pixel text-[10px] text-primary flex items-center gap-2">
          <Sword size={12} /> LIBRERÍA DE ASSETS
        </h3>
        <p className="text-[7px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider leading-tight">
          Pociones, Armas y Equipo
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {['weapon', 'shield', 'accessory'].map(category => {
            const items = PROP_LIBRARY.filter(p => p.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="space-y-1.5">
                <h4 className="font-pixel text-[7px] text-muted-foreground/60 uppercase tracking-widest pl-1">
                  {category}s
                </h4>
                <div className="grid gap-1.5">
                  {items.map(prop => (
                    <button
                      key={prop.id}
                      onClick={() => handleAddPropLayer(prop.id)}
                      className="w-full text-left p-2 rounded-md border border-border bg-background/40 hover:border-primary/40 hover:bg-primary/5 text-[9px] font-pixel text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors flex-shrink-0" />
                      <span className="truncate">{prop.name.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
