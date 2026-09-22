import { useState } from 'react';
import type { ProjectConfig } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { invokeAiFunction, pixelizeImageUrl } from '@/lib/aiFunctions';

interface GenerateState {
  isGenerating: boolean;
  error: string | null;
}

interface PerspectiveResponse {
  images?: { url: string }[];
  imageUrl?: string;
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
    options?: { strength?: number; maxColors?: number; fixedPalette?: Record<number, string>; projectConfig?: ProjectConfig }
  ) => {
    setState({ isGenerating: true, error: null });

    try {
      const data = await invokeAiFunction<PerspectiveResponse>('generate-perspective-fal', {
        prompt,
        size,
        image_url: referenceImageUrl,
        strength: options?.strength ?? 0.55,
        palette: options?.fixedPalette,
        projectConfig: options?.projectConfig,
      }, session);

      const resultUrl = data.images?.[0]?.url || data.imageUrl;
      if (!resultUrl) throw new Error('No image URL returned from AI');

      // Load the image and pixelize it using the FIXED PALETTE if provided
      const pixelizedData = await pixelizeImageUrl(resultUrl, size, options?.maxColors ?? 24, options?.fixedPalette);

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
