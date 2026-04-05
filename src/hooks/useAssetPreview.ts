import { useState, useEffect } from 'react';
import type { Frame, SpriteAsset } from '@/lib/types';
import { compositeFrame } from '@/lib/layerUtils';

/**
 * Hook for animating asset previews.
 * Handles frame cycling based on the selected animation.
 * For static assets (no animations), returns the first frame.
 */
export function useAssetPreview(asset: SpriteAsset, animationName: string | null = null) {
  const [frameStep, setFrameStep] = useState(0);

  const currentAnimation = animationName === 'base'
    ? null
    : animationName
      ? asset.animations.find(a => a.name === animationName) || null
      : asset.animations.length > 0 ? asset.animations[0] : null;

  // Reset frame step when animation changes
  useEffect(() => {
    setFrameStep(0);
  }, [animationName]);

  // Auto-cycle frames for animated assets
  useEffect(() => {
    if (!currentAnimation) return;

    const fps = currentAnimation.fps ?? 5;
    const interval = setInterval(() => {
      setFrameStep(prev => (prev + 1) % currentAnimation.frameIndices.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [currentAnimation]);

  // Determine current frame
  let currentFrame: Frame;
  if (currentAnimation) {
    const frameIdx = currentAnimation.frameIndices[frameStep];
    currentFrame = asset.layers && asset.layers.length > 0 
      ? compositeFrame(asset, frameIdx) 
      : (asset.frames?.[frameIdx] || (asset.size ? Array.from({ length: asset.size }, () => Array(asset.size).fill(0)) : []));
  } else {
    currentFrame = asset.layers && asset.layers.length > 0 
      ? compositeFrame(asset, 0) 
      : (asset.frames?.[0] || (asset.size ? Array.from({ length: asset.size }, () => Array(asset.size).fill(0)) : []));
  }

  return {
    currentFrame,
    currentAnimation,
    hasAnimations: asset.animations.length > 0,
  };
}
