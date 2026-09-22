import type { Session } from '@supabase/supabase-js';
import { imageToPixelData } from '@/lib/imageToPixelData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const AI_LOGIN_REQUIRED = 'Iniciá sesión para usar la IA';

/**
 * Llama a una Edge Function de IA con el JWT del usuario.
 * Sin sesión no se hace la llamada: las funciones de IA nunca se invocan con el anon key.
 */
export async function invokeAiFunction<T>(fnName: string, body: unknown, session: Session | null): Promise<T> {
  if (!session?.access_token) {
    throw new Error(AI_LOGIN_REQUIRED);
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data: { error?: string; detail?: string } | null = await res.json().catch(() => null);

  if (!res.ok || data?.error) {
    throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
  }

  return data as T;
}

/** Carga una imagen por URL y la convierte a datos de píxeles (frame + paleta). */
export function pixelizeImageUrl(
  url: string,
  targetSize: number,
  maxColors: number = 24,
  fixedPalette?: Record<number, string>,
): Promise<ReturnType<typeof imageToPixelData>> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const internalSize = 512;
      canvas.width = internalSize;
      canvas.height = internalSize;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      // Sin suavizado para mantener la referencia pixel-perfect
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, internalSize, internalSize);

      const imageData = ctx.getImageData(0, 0, internalSize, internalSize);
      resolve(imageToPixelData(imageData, { targetSize, maxColors, fixedPalette, alphaThreshold: 200 }));
    };
    img.onerror = () => reject(new Error('Failed to load generated image'));
    img.src = url;
  });
}
