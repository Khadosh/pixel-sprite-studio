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
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState<number>(5);

  const currentAnimation = animationName === 'base'
    ? null
    : animationName
      ? asset.animations.find(a => a.name === animationName) || null
      : asset.animations.length > 0 ? asset.animations[0] : null;

  // Sync FPS with animation's default when it changes, unless overridden
  useEffect(() => {
    if (currentAnimation && currentAnimation.fps) {
      setFps(currentAnimation.fps);
    } else {
      setFps(5);
    }
  }, [currentAnimation]);

  // Reset frame step when animation changes
  useEffect(() => {
    setFrameStep(0);
  }, [animationName]);

  // Auto-cycle frames for animated assets
  useEffect(() => {
    if (!currentAnimation || !isPlaying) return;

    const interval = setInterval(() => {
      setFrameStep(prev => (prev + 1) % currentAnimation.frameIndices.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [currentAnimation, isPlaying, fps]);

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
    isPlaying,
    setIsPlaying,
    fps,
    setFps,
  };
}
