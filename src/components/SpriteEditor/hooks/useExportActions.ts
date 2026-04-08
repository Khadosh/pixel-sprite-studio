import { SpriteAsset } from '@/lib/types';
import { exportAsPNG, exportAsGIF } from '../utils/exportUtils';

export function useExportActions(editedAsset: SpriteAsset) {
  const handleExportPNG = (options?: { includeLabels?: boolean }) => {
    exportAsPNG(editedAsset, options);
  };

  const handleExportGIF = async (viewingAnimation: string) => {
    const anim = editedAsset.animations.find(a => a.name === viewingAnimation);
    const fps = anim?.fps || 10;
    await exportAsGIF(editedAsset, viewingAnimation, fps);
  };

  return {
    handleExportPNG,
    handleExportGIF
  };
}
