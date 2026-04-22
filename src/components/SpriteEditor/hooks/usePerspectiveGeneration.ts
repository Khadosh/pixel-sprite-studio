import { useCallback } from 'react';
import { useGenerateSpriteFal } from '@/hooks/useGenerateSpriteFal';
import { frameToDataUrl } from '@/lib/layerUtils';
import { SpriteEditorStore } from '../store/useSpriteEditorStore';

export function usePerspectiveGenerationBridge(store: SpriteEditorStore) {
  const { generate, isGenerating, error } = useGenerateSpriteFal();

  const handleGeneratePerspectiveAI = useCallback(async () => {
    const state = store.getState();
    const { editedAsset, activePerspective, activeSide } = state;
    
    // 1. Get the Front Frame as reference
    // Index 0 is always Front in our canonical system
    const frontFrame = editedAsset.layers![0].frames[0];
    const referenceImageUrl = frameToDataUrl(frontFrame, editedAsset.palette, editedAsset.size);

    // 2. Determine target index and prompt based on perspective
    let perspectiveName = 'side view';
    if (activePerspective === 'back') perspectiveName = 'back view';
    else if (activePerspective === 'side' && activeSide === 'left') perspectiveName = 'left side view';
    else if (activePerspective === 'side') perspectiveName = 'right side view';

    const prompt = `${perspectiveName} of the character in the reference image, same colors, same armor design, professional pixel art`;

    state.setIsAnimGenerating(true);
    state.setAnimError(null);

    try {
      const result = await generate(prompt, editedAsset.size, referenceImageUrl);
      
      if (result && result.layers && result.layers[0].frames[0]) {
        const aiFrame = result.layers[0].frames[0];
        const aiPalette = result.palette;
        
        state.pushUndo();
        state.setEditedAsset(prev => {
          const currentPalette = { ...prev.palette };
          const nextIndex = Math.max(...Object.keys(currentPalette).map(Number), 0) + 1;
          
          // Map to keep track of AI index -> current palette index
          const indexMap: Record<number, number> = { 0: 0 }; // Transparency stays 0
          const updatedPalette = { ...currentPalette };
          let latestIndex = nextIndex;

          // Helper to find color in palette (case insensitive)
          const findColorIndex = (hex: string) => {
            const entry = Object.entries(updatedPalette).find(([_, color]) => 
              color.toLowerCase() === hex.toLowerCase()
            );
            return entry ? Number(entry[0]) : null;
          };

          // 1. Process the generated frame and remap indices
          const remappedFrame = aiFrame.map(row => 
            row.map(aiIdx => {
              if (aiIdx === 0) return 0;
              
              // If already mapped in this run, reuse
              if (indexMap[aiIdx] !== undefined) return indexMap[aiIdx];

              const aiHex = aiPalette[aiIdx];
              if (!aiHex) return 0;

              // Check if color already exists in current palette
              const existingIdx = findColorIndex(aiHex);
              if (existingIdx !== null) {
                indexMap[aiIdx] = existingIdx;
                return existingIdx;
              }

              // It's a new color! Add it to palette
              const newIdx = latestIndex++;
              updatedPalette[newIdx] = aiHex;
              indexMap[aiIdx] = newIdx;
              return newIdx;
            })
          );

          // 2. Update layers
          const newLayers = prev.layers!.map((layer, lIdx) => {
            const newFrames = [...layer.frames];
            if (lIdx === 0) {
              newFrames[state.editingFrameIndex] = remappedFrame;
            }
            return { ...layer, frames: newFrames };
          });
          
          return { 
            ...prev, 
            layers: newLayers, 
            palette: updatedPalette 
          };
        });
        
        state.setIsDirty(true);
      }
    } catch (err: any) {
      state.setAnimError(err.message);
    } finally {
      state.setIsAnimGenerating(false);
    }
  }, [store, generate]);

  return {
    handleGeneratePerspectiveAI,
    isGenerating,
    error
  };
}
