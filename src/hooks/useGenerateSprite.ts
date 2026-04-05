import { useState } from 'react';
import type { SpriteAsset } from '@/lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface GenerateState {
  isGenerating: boolean;
  error: string | null;
  result: SpriteAsset | null;
}

export function useGenerateSprite() {
  const [state, setState] = useState<GenerateState>({
    isGenerating: false,
    error: null,
    result: null,
  });

  /** Generate a single base frame (no animations — those are added client-side). */
  const generate = async (prompt: string) => {
    setState({ isGenerating: true, error: null, result: null });

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-sprite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
      }

      const sprite = data as SpriteAsset;
      setState({ isGenerating: false, error: null, result: sprite });
      return sprite;
    } catch (err: any) {
      const message = err.message || 'Error generating sprite';
      setState({ isGenerating: false, error: message, result: null });
      return null;
    }
  };

  const clear = () => {
    setState({ isGenerating: false, error: null, result: null });
  };

  return { ...state, generate, clear };
}
