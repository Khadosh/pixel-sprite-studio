import { useState } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { addExternalAnimation } from '@/lib/spriteAnimations';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface GenerateAnimState {
  isGenerating: boolean;
  currentAnimation: string | null;
  error: string | null;
}

export function useGenerateAnimation() {
  const [state, setState] = useState<GenerateAnimState>({
    isGenerating: false,
    currentAnimation: null,
    error: null,
  });

  const generateAnimationsSequence = async (
    asset: SpriteAsset,
    animationNames: string[],
    onProgress: (updatedAsset: SpriteAsset) => void,
  ) => {
    setState({ isGenerating: true, currentAnimation: null, error: null });
    let currentAsset = { ...asset };

    try {
      const baseFrame = currentAsset.frames[0];
      const palette = currentAsset.palette;
      const colorNames = currentAsset.colorNames;
      const size = currentAsset.size;

      for (const animName of animationNames) {
        setState({ isGenerating: true, currentAnimation: animName, error: null });

        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-animation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
          },
          body: JSON.stringify({
            baseFrame,
            palette,
            colorNames,
            size,
            animationName: animName,
          }),
        });

        const data = await res.json();

        if (!res.ok || data?.error) {
          throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
        }

        if (!data.frames || data.frames.length !== 3) {
          throw new Error("Invalid response from API");
        }

        // Merge generated frames into asset
        currentAsset = addExternalAnimation(currentAsset, animName, data.frames);
        
        // Callback to update UI incrementally
        onProgress(currentAsset);
      }

      setState({ isGenerating: false, currentAnimation: null, error: null });
      return currentAsset;
    } catch (err: any) {
      console.error("Animation generation failed:", err);
      setState({ isGenerating: false, currentAnimation: null, error: err.message || 'Error generating animation' });
      return currentAsset;
    }
  };

  const clear = () => {
    setState({ isGenerating: false, currentAnimation: null, error: null });
  };

  return { ...state, generateAnimationsSequence, clear };
}
