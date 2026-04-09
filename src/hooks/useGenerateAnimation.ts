import { useState } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { addExternalAnimation } from '@/lib/spriteAnimations';
import { compositeFrame } from '@/lib/layerUtils';
import { useAuth } from '@/hooks/useAuth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface GenerateAnimState {
  isGenerating: boolean;
  currentAnimation: string | null;
  error: string | null;
}

export function useGenerateAnimation() {
  const { session } = useAuth();
  const [state, setState] = useState<GenerateAnimState>({
    isGenerating: false,
    currentAnimation: null,
    error: null,
  });

  const generateAnimationsSequence = async (
    asset: SpriteAsset,
    animationNames: string[],
    onProgress: (updatedAsset: SpriteAsset) => void,
    targetLayerId?: string | null,
  ) => {
    setState({ isGenerating: true, currentAnimation: null, error: null });
    let currentAsset = { ...asset };

    try {
      const token = session?.access_token || SUPABASE_KEY;
      const baseFrame = compositeFrame(currentAsset, 0);
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
            'Authorization': `Bearer ${token}`
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
        currentAsset = addExternalAnimation(currentAsset, animName, data.frames, targetLayerId);
        
        // Callback to update UI incrementally
        onProgress(currentAsset);
      }

      setState({ isGenerating: false, currentAnimation: null, error: null });
      return currentAsset;
    } catch (err: unknown) {
      console.error("Animation generation failed:", err);
      const message = err instanceof Error ? err.message : 'Error generating animation';
      setState({ isGenerating: false, currentAnimation: null, error: message });
      return currentAsset;
    }
  };

  const clear = () => {
    setState({ isGenerating: false, currentAnimation: null, error: null });
  };

  return { ...state, generateAnimationsSequence, clear };
}
