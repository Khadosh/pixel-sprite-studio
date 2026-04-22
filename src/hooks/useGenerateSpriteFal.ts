import { useState } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { ensureLayerSupport } from '@/lib/layerUtils';
import { useAuth } from '@/hooks/useAuth';
import { imageToPixelData } from '@/lib/imageToPixelData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface GenerateState {
  isGenerating: boolean;
  error: string | null;
  result: SpriteAsset | null;
}

export function useGenerateSpriteFal() {
  const { session } = useAuth();
  const [state, setState] = useState<GenerateState>({
    isGenerating: false,
    error: null,
    result: null,
  });

  const generate = async (prompt: string, size: number = 64, referenceImageUrl?: string) => {
    setState({ isGenerating: true, error: null, result: null });

    try {
      const token = session?.access_token || SUPABASE_KEY;
      
      // Step 1: Call Edge Function to get the Image URL from Fal.ai
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-sprite-fal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          prompt, 
          size,
          image_url: referenceImageUrl 
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
      }

      const { imageUrl } = data;

      // Step 2: Load the image and pixelize it
      const pixelizedData = await pixelizeImageUrl(imageUrl, size);

      const sprite: SpriteAsset = {
        id: crypto.randomUUID(),
        name: prompt.slice(0, 20) || 'AI Generated',
        description: prompt,
        category: 'character',
        size,
        palette: pixelizedData.palette,
        colorNames: pixelizedData.colorNames,
        frames: [pixelizedData.frame],
        animations: [],
      };

      const finalSprite = ensureLayerSupport(sprite);
      setState({ isGenerating: false, error: null, result: finalSprite });
      return finalSprite;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error generating sprite with Fal';
      setState({ isGenerating: false, error: message, result: null });
      return null;
    }
  };

  const clear = () => {
    setState({ isGenerating: false, error: null, result: null });
  };

  return { ...state, generate, clear };
}

/** Helper to load a URL and convert it to pixel data */
async function pixelizeImageUrl(url: string, targetSize: number) {
  return new Promise<any>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // We use a reasonably large internal canvas to sample from
      const internalSize = 512;
      canvas.width = internalSize;
      canvas.height = internalSize;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }
      
      // Draw image centered and covering the square
      ctx.drawImage(img, 0, 0, internalSize, internalSize);
      
      const imageData = ctx.getImageData(0, 0, internalSize, internalSize);
      const result = imageToPixelData(imageData, {
        targetSize,
        maxColors: 24, // Use a generous palette for high resolution 64x64
        alphaThreshold: 200, // Be aggressive with transparency for clean silhouettes
      });
      
      resolve(result);
    };
    img.onerror = () => reject(new Error("Failed to load generated image"));
    img.src = url;
  });
}
