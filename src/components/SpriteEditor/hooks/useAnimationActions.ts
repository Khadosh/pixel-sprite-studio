import { useState, useCallback } from 'react';
import { SpriteAsset, AdvancedCastSettings } from '@/lib/types';
import { useGenerateAnimation } from '@/hooks/useGenerateAnimation';
import { generateAnimationsClientSide } from '@/lib/spriteAnimations';
import { AVAILABLE_ANIMS } from '../types';

const getNextAnimationName = (existing: { name: string }[], type: string) => {
  const baseName = type.toLowerCase();
  const baseLabel = type.toUpperCase();
  
  const existingNames = existing.map(a => a.name);
  if (!existingNames.includes(baseName)) {
    return { name: baseName, label: baseLabel };
  }
  
  let i = 1;
  while (existingNames.includes(`${baseName}_${i}`)) {
    i++;
  }
  return { name: `${baseName}_${i}`, label: `${baseLabel} ${i}` };
};

export function useAnimationActions(
  editedAsset: SpriteAsset,
  setEditedAsset: React.Dispatch<React.SetStateAction<SpriteAsset>>,
  viewingAnimation: string,
  setViewingAnimation: (name: string) => void,
  setEditingFrameIndex: (index: number) => void,
  previewPanelRef: React.RefObject<any>,
  activeLayerId: string | null,
  castSettings: AdvancedCastSettings
) {
  const [selectedAnims, setSelectedAnims] = useState<string[]>([]);
  const { isGenerating: isAnimGenerating, error: animError, generateAnimationsSequence } = useGenerateAnimation();

  const toggleAnim = (anim: string) => {
    setSelectedAnims(prev =>
      prev.includes(anim) ? prev.filter(a => a !== anim) : [...prev, anim],
    );
  };

  const selectAllAnims = () => {
    setSelectedAnims(AVAILABLE_ANIMS.map(a => a.value));
  };

  const clearSelection = () => {
    setSelectedAnims([]);
  };

  const handleGenerateAnimations = (type?: string) => {
    const typeToGen = type || selectedAnims[0] || 'idle';
    const withAnims = generateAnimationsClientSide(editedAsset, [typeToGen], castSettings);
    
    const newAnims = [...withAnims.animations];
    const generated = newAnims[newAnims.length - 1];
    
    const { name, label } = getNextAnimationName(editedAsset.animations, generated.name);
    generated.name = name;
    generated.label = label;

    setEditedAsset({
      ...withAnims,
      animations: [...editedAsset.animations, generated]
    });

    setViewingAnimation(generated.name);
    const targetFrame = generated.frameIndices[0];
    setEditingFrameIndex(targetFrame);
    previewPanelRef.current?.setIsPlaying(true);
  };

  const handleRenameAnimation = useCallback((name: string, newLabel: string) => {
    setEditedAsset(prev => ({
      ...prev,
      animations: prev.animations.map(a => a.name === name ? { ...a, label: newLabel } : a)
    }));
  }, [setEditedAsset]);

  const handleRemoveAnimation = useCallback((name: string) => {
    setEditedAsset(prev => ({
      ...prev,
      animations: prev.animations.filter(a => a.name !== name)
    }));
    if (viewingAnimation === name) setViewingAnimation('base');
  }, [viewingAnimation, setViewingAnimation, setEditedAsset]);

  const handleGenerateAnimationsAI = async (type?: string) => {
    const animsToGen = type ? [type] : selectedAnims;
    if (animsToGen.length === 0) return;
    
    await generateAnimationsSequence(editedAsset, animsToGen, (updatedAsset) => {
      const newAnims = updatedAsset.animations.filter(
        ua => !editedAsset.animations.some(ea => ea.name === ua.name)
      );
      
      setEditedAsset(prev => ({
        ...updatedAsset,
        animations: [...prev.animations, ...newAnims.map(a => {
          const { name, label } = getNextAnimationName(prev.animations, a.name);
          return { ...a, name, label };
        })]
      }));
    }, activeLayerId);
  };

  return {
    selectedAnims,
    setSelectedAnims,
    toggleAnim,
    selectAllAnims,
    clearSelection,
    handleGenerateAnimations,
    handleGenerateAnimationsAI,
    handleRenameAnimation,
    handleRemoveAnimation,
    isAnimGenerating,
    animError
  };
}
