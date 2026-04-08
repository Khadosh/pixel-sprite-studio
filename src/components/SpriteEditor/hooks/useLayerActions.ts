import { useCallback } from 'react';
import { SpriteAsset } from '@/lib/types';
import { 
  addNewLayer, removeLayer, reorderLayers, renameLayer, 
  toggleLayerVisibility, toggleLayerLock, upscale2x 
} from '@/lib/layerUtils';
import { PROP_LIBRARY } from '@/lib/assets/props';

export function useLayerActions(
  editedAsset: SpriteAsset,
  setEditedAsset: React.Dispatch<React.SetStateAction<SpriteAsset>>,
  activeLayerId: string | null,
  setActiveLayerId: (id: string | null) => void
) {
  const handleAddLayer = useCallback(() => {
    setEditedAsset(prev => {
      const updated = addNewLayer(prev, `Layer ${prev.layers.length + 1}`);
      setActiveLayerId(updated.layers[updated.layers.length - 1].id);
      return updated;
    });
  }, [setEditedAsset, setActiveLayerId]);

  const handleRemoveLayer = useCallback((layerId: string) => {
    setEditedAsset(prev => {
      if (prev.layers.length <= 1) return prev;
      const updated = removeLayer(prev, layerId);
      if (activeLayerId === layerId) {
        setActiveLayerId(updated.layers[updated.layers.length - 1].id);
      }
      return updated;
    });
  }, [activeLayerId, setActiveLayerId, setEditedAsset]);

  const handleToggleLayerVisibility = useCallback((layerId: string) => {
    setEditedAsset(prev => toggleLayerVisibility(prev, layerId));
  }, [setEditedAsset]);

  const handleToggleLayerLock = useCallback((layerId: string) => {
    setEditedAsset(prev => toggleLayerLock(prev, layerId));
  }, [setEditedAsset]);

  const handleRenameLayer = useCallback((layerId: string, name: string) => {
    setEditedAsset(prev => renameLayer(prev, layerId, name));
  }, [setEditedAsset]);

  const handleMoveLayer = useCallback((fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx + 1 : fromIdx - 1;
    if (toIdx < 0 || toIdx >= editedAsset.layers.length) return;
    setEditedAsset(prev => reorderLayers(prev, fromIdx, toIdx));
  }, [editedAsset.layers.length, setEditedAsset]);

  const handleAddPropLayer = useCallback((propId: string) => {
    const prop = PROP_LIBRARY.find(p => p.id === propId);
    if (!prop) return;

    const size = editedAsset.size || 16;
    let propData = size === 32 ? prop.data32 : prop.data16;

    if (!propData && size === 32 && prop.data16) {
      propData = upscale2x(prop.data16);
    }

    if (!propData) return;

    const newLayerId = crypto.randomUUID();
    const frameCount = editedAsset.layers[0]?.frames.length || 1;
    
    const newFrames = Array.from({ length: frameCount }, () => 
      propData.map(row => [...row])
    );

    const uniqueColors = new Set<number>();
    propData.forEach(row => {
      row.forEach(pixel => {
        if (pixel > 0) uniqueColors.add(pixel);
      });
    });

    setEditedAsset(prev => ({
      ...prev,
      layers: [
        ...prev.layers,
        {
          id: newLayerId,
          name: prop.name,
          frames: newFrames,
          isVisible: true,
          isLocked: false,
          opacity: 1,
          paletteIds: Array.from(uniqueColors)
        }
      ]
    }));
    setActiveLayerId(newLayerId);
  }, [editedAsset.size, editedAsset.layers, setActiveLayerId, setEditedAsset]);

  return {
    handleAddLayer,
    handleRemoveLayer,
    handleToggleLayerVisibility,
    handleToggleLayerLock,
    handleRenameLayer,
    handleMoveLayer,
    handleAddPropLayer
  };
}
