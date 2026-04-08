import React from 'react';
import PaletteBar from '@/components/PaletteBar';
import { useSpriteEditorContext } from '../context/SpriteEditorContext';

export const PaletteSection = React.memo(() => {
  const {
    editedAsset,
    showAllColors,
    setShowAllColors,
    filteredPalette,
    activeColorKey,
    setActiveColorKey,
    handleChangeColor,
    handleAddColor,
    handleRemoveColor,
    handleRenameColor
  } = useSpriteEditorContext();

  return (
    <div className="bg-secondary/30 rounded-lg border border-border p-4 flex flex-col min-h-0 overflow-hidden flex-1 mb-2">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="font-pixel text-[10px] text-muted-foreground tracking-wider block uppercase">Palette</span>
        <button 
          onClick={() => setShowAllColors(!showAllColors)}
          className={`text-[8px] font-pixel px-2 py-0.5 rounded border transition-colors ${showAllColors ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-border text-muted-foreground font-mono'}`}
        >
          {showAllColors ? 'ALL' : 'LAYER SCOPED'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <PaletteBar
          palette={filteredPalette}
          colorNames={editedAsset.colorNames}
          activeColorKey={activeColorKey}
          onSelectColor={setActiveColorKey}
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
