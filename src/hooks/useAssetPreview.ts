import { useState, useEffect, useCallback } from 'react';
import type { Frame, SpriteAsset } from '@/lib/types';

/**
 * Hook for animating asset previews.
 * Handles frame cycling based on the selected animation.
 * For static assets (no animations), returns the first frame.
 */
export function useAssetPreview(asset: SpriteAsset, initialAnimIndex = 0) {
  const [animationIndex, setAnimationIndex] = useState(initialAnimIndex);
  const [frameStep, setFrameStep] = useState(0);

  const hasAnimations = asset.animations.length > 0;
  const currentAnimation = hasAnimations ? asset.animations[animationIndex] : null;

  // Reset frame step when animation changes
  const setAnimationIndexSafe = useCallback((idx: number) => {
    setAnimationIndex(idx);
    setFrameStep(0);
  }, []);

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
    currentFrame = asset.frames[frameIdx];
  } else {
    currentFrame = asset.frames[0];
  }

  return {
    currentFrame,
    currentAnimation,
    animationIndex,
    setAnimationIndex: setAnimationIndexSafe,
    frameStep,
    hasAnimations,
  };
}
