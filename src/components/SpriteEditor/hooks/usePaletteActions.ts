import { useCallback } from 'react';
import { SpriteAsset } from '@/lib/types';

export function usePaletteActions(
  editedAsset: SpriteAsset,
  setEditedAsset: React.Dispatch<React.SetStateAction<SpriteAsset>>,
  activeLayerId: string | null,
  activeColorKey: number,
  setActiveColorKey: (key: number) => void
) {
  const handleChangeColor = useCallback((key: number, color: string) => {
    setEditedAsset(prev => ({
      ...prev,
      palette: { ...prev.palette, [key]: color },
    }));
  }, [setEditedAsset]);

  const handleRenameColor = useCallback((key: number, name: string) => {
    setEditedAsset(prev => ({
      ...prev,
      colorNames: { ...prev.colorNames, [key]: name },
    }));
  }, [setEditedAsset]);

  const handleAddColor = useCallback(() => {
    setEditedAsset(prev => {
      const keys = Object.keys(prev.palette).map(Number).filter(k => k > 0);
      const newKey = keys.length > 0 ? Math.max(...keys) + 1 : 1;
      const updatedPalette = { ...prev.palette, [newKey]: '#888888' };
      const updatedColorNames = { ...prev.colorNames, [newKey]: `Color ${newKey}` };
      
      const newLayers = prev.layers.map(layer => {
        if (layer.id === activeLayerId) {
          const pIds = layer.paletteIds || [];
          if (!pIds.includes(newKey)) {
            return { ...layer, paletteIds: [...pIds, newKey] };
          }
        }
        return layer;
      });

      return {
        ...prev,
        palette: updatedPalette,
        colorNames: updatedColorNames,
        layers: newLayers,
      };
    });
  }, [activeLayerId, setEditedAsset]);

  const handleRemoveColor = useCallback((key: number) => {
    setEditedAsset(prev => {
      const newPalette = { ...prev.palette };
      delete newPalette[key];
      const newColorNames = { ...prev.colorNames };
      delete newColorNames[key];

      return {
        ...prev,
        palette: newPalette,
        colorNames: newColorNames,
        layers: prev.layers.map(layer => ({
          ...layer,
          paletteIds: layer.paletteIds?.filter(id => id !== key),
          frames: layer.frames.map(f =>
            f.map(r => r.map(c => c === key ? 0 : c))
          )
        })),
      };
    });
    if (activeColorKey === key) setActiveColorKey(1);
  }, [activeColorKey, setActiveColorKey, setEditedAsset]);

  return {
    handleChangeColor,
    handleRenameColor,
    handleAddColor,
    handleRemoveColor
  };
}
