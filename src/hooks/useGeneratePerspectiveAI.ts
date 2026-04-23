import { useState } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { imageToPixelData } from '@/lib/imageToPixelData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface GenerateState {
  isGenerating: boolean;
  error: string | null;
}

export function useGeneratePerspectiveAI() {
  const { session } = useAuth();
  const [state, setState] = useState<GenerateState>({
    isGenerating: false,
    error: null,
  });

  const generate = async (
    prompt: string, 
    size: number, 
    referenceImageUrl: string,
    options?: { strength?: number; maxColors?: number }
  ) => {
    setState({ isGenerating: true, error: null });
    
    try {
      const token = session?.access_token || SUPABASE_KEY;
      
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-perspective-fal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          prompt, 
          size,
          image_url: referenceImageUrl,
          strength: options?.strength ?? 0.55,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      const resultUrl = data.images?.[0]?.url || data.imageUrl;
      if (!resultUrl) throw new Error("No image URL returned from AI");

      // Load the image and pixelize it
      const pixelizedData = await pixelizeImageUrl(resultUrl, size, options?.maxColors ?? 24);

      setState({ isGenerating: false, error: null });
      return {
        frame: pixelizedData.frame,
        palette: pixelizedData.palette,
        colorNames: pixelizedData.colorNames
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error generating perspective';
      setState({ isGenerating: false, error: message });
      return null;
    }
  };

  return { ...state, generate };
}

/** Helper to load a URL and convert it to pixel data */
async function pixelizeImageUrl(url: string, targetSize: number, maxColors: number = 24) {
  return new Promise<any>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const internalSize = 512;
      canvas.width = internalSize;
      canvas.height = internalSize;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, internalSize, internalSize);
      
      const imageData = ctx.getImageData(0, 0, internalSize, internalSize);
      const result = imageToPixelData(imageData, {
        targetSize,
        maxColors,
        alphaThreshold: 200,
      });
      
      resolve(result);
    };
    img.onerror = () => reject(new Error("Failed to load generated image"));
    img.src = url;
  });
}
