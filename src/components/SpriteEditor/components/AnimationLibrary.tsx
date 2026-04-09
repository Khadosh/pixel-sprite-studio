import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Settings, Trash2, Edit3, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpriteEditorStore, useSpriteEditorStoreApi } from '../context/SpriteEditorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AVAILABLE_ANIMS } from '../types';
import { CastElement, CastShape, AnimationDef } from '@/lib/types';

export const AnimationLibrary = React.memo(() => {
  const editedAsset = useSpriteEditorStore(s => s.editedAsset);
  const viewingAnimation = useSpriteEditorStore(s => s.viewingAnimation);
  const setViewingAnimation = useSpriteEditorStore(s => s.setViewingAnimation);
  const setEditingFrameIndex = useSpriteEditorStore(s => s.setEditingFrameIndex);
  const handleGenerateAnimations = useSpriteEditorStore(s => s.generateAnimations);
  const handleRenameAnimation = useSpriteEditorStore(s => s.renameAnimation);
  const handleRemoveAnimation = useSpriteEditorStore(s => s.removeAnimation);
  const isGenerating = useSpriteEditorStore(s => s._isGenerating);
  const isAnimGenerating = useSpriteEditorStore(s => s.isAnimGenerating);
  const castSettings = useSpriteEditorStore(s => s.castSettings);
  const setCastSettings = useSpriteEditorStore(s => s.setCastSettings);
  const animError = useSpriteEditorStore(s => s.animError);
  const storeApi = useSpriteEditorStoreApi();

  const [genType, setGenType] = useState<string>('idle');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const startEditing = (name: string, label: string) => {
    setEditingName(name);
    setNewName(label);
  };

  const saveName = (name: string) => {
    if (newName.trim()) {
      handleRenameAnimation(name, newName);
    }
    setEditingName(null);
  };

  const handleGenerateAI = async (type: string) => {
    // Access the bridge function stored on the store by SpriteEditor.tsx
    const fn = storeApi.getState()._pixelEditorBridge?._handleGenerateAnimationsAI;
    if (fn) await fn(type);
  };

  return (
    <ScrollArea className="h-full pr-3">
      <div className="space-y-6">
      {/* SECTION: GENERATION PANEL - MOVED TO TOP */}
      <div className="space-y-3">
        <span className="font-pixel text-[9px] text-muted-foreground tracking-widest block opacity-50 uppercase">Generar Nueva</span>
        
        <div className="space-y-3 p-3 rounded-md bg-black/20 border border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger className="h-8 text-[9px] font-pixel bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-primary/40">
                  {AVAILABLE_ANIMS.map(a => (
                    <SelectItem key={a.value} value={a.value} className="text-[9px] font-pixel">{a.label.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {genType === 'cast' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary border border-white/5">
                    <Settings size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-[#0a0a0f] border-primary/30 p-3 space-y-3 shadow-2xl" side="left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-pixel text-primary uppercase tracking-tighter">Elemento</label>
                    <Select 
                      value={castSettings.element} 
                      onValueChange={(val: CastElement) => setCastSettings(prev => ({ ...prev, element: val }))}
                    >
                      <SelectTrigger className="h-7 text-[8px] font-pixel bg-black/40 border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0f] border-primary/40">
                        <SelectItem value="generic" className="text-[8px] font-pixel">GENERIC</SelectItem>
                        <SelectItem value="fire" className="text-[8px] font-pixel text-orange-400">FIRE</SelectItem>
                        <SelectItem value="water" className="text-[8px] font-pixel text-blue-400">WATER</SelectItem>
                        <SelectItem value="electric" className="text-[8px] font-pixel text-yellow-300">ELECTRIC</SelectItem>
                        <SelectItem value="nature" className="text-[8px] font-pixel text-green-400">NATURE</SelectItem>
                        <SelectItem value="ice" className="text-[8px] font-pixel text-cyan-200">ICE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-pixel text-primary uppercase tracking-tighter">Forma</label>
                    <Select 
                      value={castSettings.shape} 
                      onValueChange={(val: CastShape) => setCastSettings(prev => ({ ...prev, shape: val }))}
                    >
                      <SelectTrigger className="h-7 text-[8px] font-pixel bg-black/40 border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0f] border-primary/40">
                        <SelectItem value="burst" className="text-[8px] font-pixel">BURST</SelectItem>
                        <SelectItem value="circle" className="text-[8px] font-pixel">CIRCLE</SelectItem>
                        <SelectItem value="beam" className="text-[8px] font-pixel">BEAM</SelectItem>
                        <SelectItem value="spark" className="text-[8px] font-pixel">SPARKS</SelectItem>
                        <SelectItem value="pulse" className="text-[8px] font-pixel">PULSE</SelectItem>
                        <SelectItem value="random" className="text-[8px] font-pixel">RANDOM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="flex gap-1.5">
            <Button
              onClick={() => handleGenerateAnimations(genType)}
              disabled={isGenerating || isAnimGenerating}
              className="px-2 font-pixel text-[8px] bg-secondary/30 text-foreground hover:bg-secondary/50 border border-white/5 h-8 transition-all shrink-0"
            >
              QUICK
            </Button>
            <Button
              onClick={() => handleGenerateAI(genType)}
              disabled={isGenerating || isAnimGenerating}
              className="flex-1 font-pixel text-[8px] bg-primary text-primary-foreground hover:brightness-110 border border-primary h-8 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all overflow-hidden"
            >
              <Sparkles size={11} className="mr-1 shrink-0" />
              <span className="truncate">{isAnimGenerating ? '...' : 'IA GENERATE'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* SECTION: SAVED ANIMATIONS - MOVED TO BOTTOM */}
      <div className="space-y-3">
        <span className="font-pixel text-[9px] text-muted-foreground tracking-widest block opacity-50 uppercase">Animaciones Guardadas</span>
        
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => {
              setViewingAnimation('base');
              setEditingFrameIndex(0);
            }}
            className={`px-3 py-2 text-[10px] font-pixel rounded border transition-all flex items-center justify-between group ${viewingAnimation === 'base'
              ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(34,197,94,0.1)]'
              : 'bg-secondary/10 border-border text-muted-foreground hover:border-primary/30'
              }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)] shrink-0" />
              <span>BASE (ESTATICO)</span>
            </div>
          </button>

          {editedAsset.animations.map((anim: any) => {
            const isViewing = viewingAnimation === anim.name;
            const isEditing = editingName === anim.name;
            
            return (
              <div 
                key={anim.name}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded border transition-all cursor-pointer ${isViewing 
                  ? 'bg-primary/5 border-primary shadow-[inset_0_0_10px_rgba(34,197,94,0.05)]' 
                  : 'bg-secondary/5 border-border hover:border-primary/20'
                }`}
                onClick={() => {
                  setViewingAnimation(anim.name);
                  if (anim.frameIndices.length > 0) setEditingFrameIndex(anim.frameIndices[0]);
                }}
              >
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveName(anim.name);
                          if (e.key === 'Escape') setEditingName(null);
                        }}
                        className="bg-black/40 border-none outline-none text-[10px] font-pixel text-primary w-full p-0 h-4"
                      />
                      <button onClick={() => saveName(anim.name)} className="text-emerald-500"><Check size={10} /></button>
                      <button onClick={() => setEditingName(null)} className="text-red-400"><X size={10} /></button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-pixel truncate ${isViewing ? 'text-primary' : 'text-muted-foreground/80'}`}>
                      {anim.label.toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isEditing && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEditing(anim.name, anim.label); }}
                      className="p-1 hover:text-primary transition-colors text-muted-foreground/50"
                    >
                      <Edit3 size={10} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveAnimation(anim.name); }}
                    className="p-1 hover:text-destructive transition-colors text-muted-foreground/50"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {animError && (
        <div className="text-red-400 text-[10px] mt-2 p-2 rounded bg-red-400/5 border border-red-400/10 font-mono whitespace-pre-wrap">{animError}</div>
      )}
      </div>
    </ScrollArea>
  );
});

AnimationLibrary.displayName = 'AnimationLibrary';
