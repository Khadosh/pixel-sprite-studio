import { useCallback } from 'react';
import { useGenerateAnimation } from '@/hooks/useGenerateAnimation';
import type { SpriteEditorStore } from '../store/useSpriteEditorStore';

const getNextAnimationName = (existing: { name: string }[], type: string) => {
  const baseName = type.toLowerCase();
  const baseLabel = type.toUpperCase();
  const existingNames = existing.map(a => a.name);
  if (!existingNames.includes(baseName)) {
    return { name: baseName, label: baseLabel };
  }
  let i = 1;
  while (existingNames.includes(`${baseName}_${i}`)) i++;
  return { name: `${baseName}_${i}`, label: `${baseLabel} ${i}` };
};

/**
 * Bridge hook that connects TanStack Query AI generation with the Zustand store.
 * This must live as a React hook because useGenerateAnimation uses TanStack Query internally.
 */
export function useAnimationGenerationBridge(store: SpriteEditorStore) {
  const { generateAnimationsSequence } = useGenerateAnimation();

  const handleGenerateAnimationsAI = useCallback(async (type?: string) => {
    const state = store.getState();
    const animsToGen = type ? [type] : state.selectedAnims;
    if (animsToGen.length === 0) return;

    store.getState().setIsAnimGenerating(true);
    store.getState().setAnimError(null);

    try {
      await generateAnimationsSequence(state.editedAsset, animsToGen, (updatedAsset) => {
        const currentState = store.getState();
        const newAnims = updatedAsset.animations.filter(
          ua => !currentState.editedAsset.animations.some(ea => ea.name === ua.name)
        );

        store.getState().setEditedAsset(prev => ({
          ...updatedAsset,
          animations: [...prev.animations, ...newAnims.map(a => {
            const { name, label } = getNextAnimationName(prev.animations, a.name);
            return { ...a, name, label };
          })],
        }));
      }, state.activeLayerId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error generating animation';
      store.getState().setAnimError(message);
    } finally {
      store.getState().setIsAnimGenerating(false);
    }
  }, [store, generateAnimationsSequence]);

  return { handleGenerateAnimationsAI };
}
