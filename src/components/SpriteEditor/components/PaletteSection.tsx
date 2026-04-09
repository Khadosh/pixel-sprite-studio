import React from 'react';
import { useShallow } from 'zustand/shallow';
import PaletteBar from '@/components/PaletteBar';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';
import { selectFilteredPalette } from '../store/derived';

export const PaletteSection = React.memo(() => {
  const editedAsset = useSpriteEditorStore(s => s.editedAsset);
  const showAllColors = useSpriteEditorStore(s => s.showAllColors);
  const setShowAllColors = useSpriteEditorStore(s => s.setShowAllColors);
  const filteredPalette = useSpriteEditorStore(useShallow(selectFilteredPalette));
  const activeColorKey = useSpriteEditorStore(s => s._pixelEditorBridge?.activeColorKey ?? 1);
  const setActiveColorKey = useSpriteEditorStore(s => s._pixelEditorBridge?.setActiveColorKey);
  const handleChangeColor = useSpriteEditorStore(s => s.changeColor);
  const handleAddColor = useSpriteEditorStore(s => s.addColor);
  const handleRemoveColor = useSpriteEditorStore(s => s.removeColor);
  const handleRenameColor = useSpriteEditorStore(s => s.renameColor);

  return (
    <div className="bg-secondary/30 rounded-lg border border-border p-4 flex flex-col min-h-0 overflow-hidden flex-1 mb-2">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block uppercase">Palette</span>
        <button
          onClick={() => setShowAllColors(!showAllColors)}
          className={`text-[8px] font-pixel px-2 py-0.5 rounded border transition-colors ${showAllColors ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground font-mono'}`}
        >
          {showAllColors ? 'ALL' : 'LAYER SCOPED'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <PaletteBar
          palette={filteredPalette}
          colorNames={editedAsset.colorNames}
          activeColorKey={activeColorKey}
          onSelectColor={setActiveColorKey || (() => { })}
          onChangeColor={handleChangeColor}
          onAddColor={handleAddColor}
          onRemoveColor={handleRemoveColor}
          onRenameColor={handleRenameColor}
        />
      </div>
    </div>
  );
});

PaletteSection.displayName = 'PaletteSection';
