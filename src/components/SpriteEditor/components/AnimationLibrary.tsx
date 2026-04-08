import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpriteEditorContext } from '../context/SpriteEditorContext';
import { AVAILABLE_ANIMS } from '../types';
import { CastElement, CastShape } from '@/lib/types';

export const AnimationLibrary = React.memo(() => {
  const {
    editedAsset,
    viewingAnimation,
    setViewingAnimation,
    setEditingFrameIndex,
    selectedAnims,
    toggleAnim,
    handleGenerateAnimations,
    handleGenerateAnimationsAI,
    isGenerating,
    isAnimGenerating,
    selectAllAnims,
    clearSelection,
    castSettings,
    setCastSettings,
    animError
  } = useSpriteEditorContext() as any; // Cast as any to access custom hook extensions for now

  return (
    <div className="bg-secondary/30 rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block">LIBRERIA DE ANIMACIONES</span>
        <div className="flex gap-2">
          <button onClick={selectAllAnims} className="text-[7px] font-pixel text-purple-400 hover:text-purple-300">TODO</button>
          <button onClick={clearSelection} className="text-[7px] font-pixel text-muted-foreground hover:text-foreground">NADA</button>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setViewingAnimation('base');
            setEditingFrameIndex(0);
          }}
          className={`px-3 py-2 text-[10px] font-pixel rounded border transition-all flex items-center justify-between ${viewingAnimation === 'base'
            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
            : 'bg-secondary/10 border-border text-muted-foreground hover:border-purple-500/30'
            }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
            <span>BASE (ESTATICO)</span>
          </div>
        </button>

        {AVAILABLE_ANIMS.map(anim => {
          const isViewing = viewingAnimation === anim.value;
          const isSelectedForGen = selectedAnims.includes(anim.value);
          const exists = editedAsset.animations.some(a => a.name === anim.value);
          
          return (
            <div 
              key={anim.value}
              className={`group flex items-center gap-2 px-3 py-2 rounded border transition-all cursor-pointer ${isViewing 
                ? 'bg-purple-600/30 border-purple-500' 
                : 'bg-secondary/10 border-border hover:border-purple-500/30'
              }`}
              onClick={() => {
                setViewingAnimation(anim.value);
                const animDef = editedAsset.animations.find(a => a.name === anim.value);
                if (animDef) setEditingFrameIndex(animDef.frameIndices[0]);
              }}
            >
              <div className="flex-1 flex items-center gap-2 overflow-hidden">
                {exists ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)] shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full border border-muted-foreground/50 shrink-0" />
                )}
                <span className={`text-[10px] font-pixel truncate ${isViewing ? 'text-purple-200' : 'text-muted-foreground'}`}>
                  {anim.label.toUpperCase()}
                </span>
                
                {anim.value === 'cast' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-white/10 rounded-full text-muted-foreground hover:text-purple-400 transition-colors"
                      >
                        <Settings size={12} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 bg-[#1a1a2e] border-purple-500/30 p-3 space-y-3" side="left" align="center" style={{ zIndex: 100 }}>
                      <div className="space-y-1">
                        <label className="text-[9px] font-pixel text-purple-400 uppercase tracking-tighter">Elemento</label>
                        <Select 
                          value={castSettings.element} 
                          onValueChange={(val: CastElement) => setCastSettings(prev => ({ ...prev, element: val }))}
                        >
                          <SelectTrigger className="h-8 text-[9px] font-pixel bg-black/40 border-purple-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-purple-500/40 z-[110]">
                            <SelectItem value="generic" className="text-[9px] font-pixel">GENERIC</SelectItem>
                            <SelectItem value="fire" className="text-[9px] font-pixel text-orange-400">FIRE</SelectItem>
                            <SelectItem value="water" className="text-[9px] font-pixel text-blue-400">WATER</SelectItem>
                            <SelectItem value="electric" className="text-[9px] font-pixel text-yellow-300">ELECTRIC</SelectItem>
                            <SelectItem value="nature" className="text-[9px] font-pixel text-green-400">NATURE</SelectItem>
                            <SelectItem value="ice" className="text-[9px] font-pixel text-cyan-200">ICE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-pixel text-purple-400 uppercase tracking-tighter">Forma</label>
                        <Select 
                          value={castSettings.shape} 
                          onValueChange={(val: CastShape) => setCastSettings(prev => ({ ...prev, shape: val }))}
                        >
                          <SelectTrigger className="h-8 text-[9px] font-pixel bg-black/40 border-purple-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-purple-500/40 z-[110]">
                            <SelectItem value="burst" className="text-[9px] font-pixel">BURST</SelectItem>
                            <SelectItem value="circle" className="text-[9px] font-pixel">CIRCLE</SelectItem>
                            <SelectItem value="beam" className="text-[9px] font-pixel">BEAM</SelectItem>
                            <SelectItem value="spark" className="text-[9px] font-pixel">SPARKS</SelectItem>
                            <SelectItem value="pulse" className="text-[9px] font-pixel">PULSE</SelectItem>
                            <SelectItem value="random" className="text-[9px] font-pixel">RANDOM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              
              <div 
                className="flex items-center justify-center p-1 hover:bg-white/5 rounded transition-colors group-hover:bg-white/10"
                onClick={(e) => { e.stopPropagation(); toggleAnim(anim.value); }}
              >
                <Checkbox 
                  checked={isSelectedForGen}
                  className={`h-4 w-4 border-muted-foreground/30 rounded-sm ${isSelectedForGen ? 'bg-purple-500 border-purple-500' : 'bg-transparent'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 w-full pt-1">
        <Button
          onClick={handleGenerateAnimations}
          disabled={selectedAnims.length === 0 || isGenerating || isAnimGenerating}
          className="w-full font-pixel text-[8px] bg-secondary text-foreground hover:bg-secondary/80 border border-border h-8"
        >
          QUICK MATCH
        </Button>
        <Button
          onClick={handleGenerateAnimationsAI}
          disabled={selectedAnims.length === 0 || isGenerating || isAnimGenerating}
          className="w-full font-pixel text-[8px] bg-purple-600 text-white hover:bg-purple-500 border border-purple-500 h-8"
        >
          <Sparkles size={12} className="mr-1" />
          {isAnimGenerating ? `GENERANDO...` : 'GENERAR CON IA'}
        </Button>
      </div>
      {animError && (
        <div className="text-red-400 text-[10px] mt-1 break-words font-mono">{animError}</div>
      )}
    </div>
  );
});

AnimationLibrary.displayName = 'AnimationLibrary';
