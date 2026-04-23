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

    // Use asset name or category for a better prompt than just "character"
    const charDesc = editedAsset.name || editedAsset.category || 'character';
    const prompt = `Professional pixel art sprite of ${perspectiveName} of the ${charDesc} from the reference image, matching exactly the same design, style and outfit.`;

    state.setIsAnimGenerating(true);
    state.setAnimError(null);

    try {
      // Pass size and reference image with a balanced strength for perspective shifts
      // 0.65 is usually the "sweet spot" for rotating pixel art characters
      const result = await generate(prompt, editedAsset.size, referenceImageUrl, {
        strength: 0.65,
        maxColors: 32
      });
      
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

          // --- COLOR SNAPING LOGIC ---
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
          };

          const colorDistance = (c1: {r: number, g: number, b: number}, c2: {r: number, g: number, b: number}) => {
            return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
          };

          const findBestMatch = (hex: string) => {
            const rgb = hexToRgb(hex);
            let bestMatchIdx: number | null = null;
            let minDistance = 25; // Tolerance for "near" colors (about 10% diff)

            Object.entries(updatedPalette).forEach(([idx, color]) => {
              if (color === 'transparent') return;
              const d = colorDistance(rgb, hexToRgb(color));
              if (d < minDistance) {
                minDistance = d;
                bestMatchIdx = Number(idx);
              }
            });
            return bestMatchIdx;
          };
          // ---------------------------

          // 1. Process the generated frame and remap indices
          const remappedFrame = aiFrame.map(row => 
            row.map(aiIdx => {
              if (aiIdx === 0) return 0;
              if (indexMap[aiIdx] !== undefined) return indexMap[aiIdx];

              const aiHex = aiPalette[aiIdx];
              // Auto-treat white OR lime green as transparent
              const isWhite = aiHex.toLowerCase() === '#ffffff';
              const isGreen = aiHex.toLowerCase() === '#00ff00';
              if (!aiHex || isWhite || isGreen) return 0; 

              // Try to snap to an existing color first
              const snappedIdx = findBestMatch(aiHex);
              if (snappedIdx !== null) {
                indexMap[aiIdx] = snappedIdx;
                return snappedIdx;
              }

              // Only if it's very different, add as new
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
