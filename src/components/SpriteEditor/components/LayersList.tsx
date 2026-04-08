import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Eye, EyeOff, Layers, Edit2, ChevronUp, ChevronDown, Trash2, Sword } from 'lucide-react';
import { useSpriteEditorContext } from '../context/SpriteEditorContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PROP_LIBRARY } from '@/lib/assets/props';

export const LayersList = React.memo(() => {
  const {
    editedAsset,
    activeLayerId,
    setActiveLayerId,
    handleAddLayer,
    handleToggleLayerVisibility,
    handleRenameLayer,
    handleMoveLayer,
    handleRemoveLayer,
    handleAddPropLayer
  } = useSpriteEditorContext() as any;

  const layers = editedAsset.layers;

  return (
    <div className="bg-secondary/30 rounded-lg border border-border p-4 flex flex-col min-h-0 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <span className="font-pixel text-[10px] text-muted-foreground tracking-wider uppercase">LAYERS</span>
        <div className="flex gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 text-primary hover:text-green-300 hover:bg-primary/20"
                title="Añadir Equipamiento"
              >
                <Sword size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-[#0a0a0f] border-primary/30 p-2 shadow-2xl" side="bottom" align="end">
              <div className="space-y-1">
                <p className="font-pixel text-[8px] text-primary/60 px-2 py-1 uppercase">Librería de Props</p>
                {PROP_LIBRARY.map(prop => (
                  <button
                    key={prop.id}
                    onClick={() => handleAddPropLayer(prop.id)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-primary/20 text-[10px] font-pixel text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    {prop.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 text-primary hover:text-green-300 hover:bg-primary/20"
            onClick={handleAddLayer}
            title="Nueva Capa Vacía"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {[...layers].reverse().map((layer, revIdx) => {
          const idx = layers.length - 1 - revIdx;
          const isActive = layer.id === activeLayerId;

          return (
            <div 
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`group flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                isActive 
                  ? 'bg-primary/10 border-primary text-foreground' 
                  : 'bg-background/20 border-transparent hover:bg-secondary/40 text-muted-foreground'
              }`}
            >
              <button 
                className={`transition-colors ${isActive ? 'text-primary' : (layer.isVisible ? 'hover:text-primary' : 'text-muted-foreground/30')}`}
                onClick={(e) => { e.stopPropagation(); handleToggleLayerVisibility(layer.id); }}
              >
                {layer.isVisible ? <Eye size={12} strokeWidth={2.5} /> : <EyeOff size={12} strokeWidth={2} />}
              </button>
              
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <Layers size={10} className="shrink-0 opacity-40" />
                <span className="truncate font-pixel text-[10px]">
                  {layer.name}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const newName = prompt('Enter new layer name:', layer.name);
                    if (newName) handleRenameLayer(layer.id, newName);
                  }}
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); handleMoveLayer(idx, 'up'); }}
                  disabled={idx === layers.length - 1}
                >
                  <ChevronUp size={12} />
                </button>
                <button 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); handleMoveLayer(idx, 'down'); }}
                  disabled={idx === 0}
                >
                  <ChevronDown size={12} />
                </button>
                <button 
                  className="text-red-500/70 hover:text-red-400"
                  onClick={(e) => { e.stopPropagation(); handleRemoveLayer(layer.id); }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

LayersList.displayName = 'LayersList';
