import { GifReader } from 'omggif';
import { Buffer } from 'buffer';

export interface DecodedGifFrame {
  imageData: ImageData;
  delay: number; // in centiseconds
}

export interface DecodedGif {
  width: number;
  height: number;
  frames: DecodedGifFrame[];
}

/**
 * Decodes a GIF file from an ArrayBuffer using omggif.
 */
export async function decodeGif(arrayBuffer: ArrayBuffer): Promise<DecodedGif> {
  const buffer = Buffer.from(arrayBuffer);
  const reader = new GifReader(buffer);

  const width = reader.width;
  const height = reader.height;
  const numFrames = reader.numFrames();
  const frames: DecodedGifFrame[] = [];

  // omggif decodes frames by blitting them onto a buffer.
  // We need an offscreen canvas to handle the "disposal method" (background vs previous frame)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Temporary buffer for each frame
  const framePixels = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < numFrames; i++) {
    const info = reader.frameInfo(i);
    
    // Decode frame pixels into RGBA
    reader.decodeAndBlitFrameRGBA(i, framePixels);

    // Create ImageData from decoded pixels
    const frameData = new ImageData(framePixels, width, height);
    
    // If we want to handle disposal methods correctly (GIFs can have complex transparency overlays),
    // we blit each frame onto a persistent canvas.
    // However, for pixel art sprites, frames are usually independent or simple.
    // Most spritesheets/GIFs use 'do not dispose' or 'restore to background'.
    
    // Let's create a fresh ImageData for this frame to avoid reference issues
    const finalImageData = new ImageData(new Uint8ClampedArray(framePixels), width, height);

    frames.push({
      imageData: finalImageData,
      delay: info.delay
    });
  }

  return {
    width,
    height,
    frames
  };
}
