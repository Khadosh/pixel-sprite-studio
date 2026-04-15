import type { SpriteAsset, AnimationDef, SpriteLayer, Frame, AdvancedCastSettings, CastElement, CastShape } from '@/lib/types';
import { ensureLayerSupport } from '@/lib/layerUtils';
import {
  generateIdle,
  generateWalk,
  generateCast,
  generateAttack,
  generateHurt,
  generateJump,
  analyzeBodySegments,
  leanBody,
  squash,
  shiftDown,
  shiftRight,
  findBounds,
  getCenterOfMass,
  drawCircle,
  drawBurst,
  drawBeam,
  drawSparks,
  drawPulse,
  inferMainColorIndex,
} from '@/lib/spriteTransforms';

/**
 * Takes a SpriteAsset and generates animation frames client-side.
 */
export function generateAnimationsClientSide(
  asset: SpriteAsset,
  animationNames: string[],
  castSettings?: AdvancedCastSettings,
): SpriteAsset {
  let currentAsset = ensureLayerSupport(asset);

  for (const animName of animationNames) {
    if (animName === 'cast' && castSettings) {
      currentAsset = generateAdvancedCastSequence(currentAsset, castSettings);
      continue;
    }

    // Existing simple generation...
    const newLayers: SpriteLayer[] = currentAsset.layers!.map(layer => ({
      ...layer,
      frames: layer.frames.map(f => f.map(r => [...r]))
    }));
    
    const paletteKeys = Object.keys(currentAsset.palette).map(Number).filter(k => k > 0);
    const glowColor = Math.max(...paletteKeys);

    const startIndex = newLayers[0].frames.length;
    newLayers.forEach(layer => {
      const [f0, f1] = generateFramePair(layer.frames[0], animName, glowColor, currentAsset.anatomy);
      layer.frames.push(f0, f1);
    });

    const fps = animName === 'idle' ? 3 : animName === 'cast' ? 4 : 5;
    const newAnimDef: AnimationDef = {
      name: animName,
      label: animName.toUpperCase(),
      frameIndices: [startIndex, startIndex + 1, startIndex, startIndex + 1],
      fps,
    };

    const existingIdx = currentAsset.animations.findIndex(a => a.name === animName);
    const newAnimations = [...currentAsset.animations];
    if (existingIdx >= 0) {
      newAnimations[existingIdx] = newAnimDef;
    } else {
      newAnimations.push(newAnimDef);
    }

    currentAsset = { ...currentAsset, layers: newLayers, animations: newAnimations };
  }

  return currentAsset;
}

/**
 * Creates an advanced 6-frame cast animation with buildup, impact, and dissipation.
 */
export function generateAdvancedCastSequence(
  asset: SpriteAsset,
  settings: AdvancedCastSettings
): SpriteAsset {
  const size = asset.size;
  const layers = [...asset.layers!];
  
  // 1. Ensure/Find the "Cast Effect" layer
  let effectLayerIdx = layers.findIndex(l => l.name.toLowerCase().includes('effect'));
  if (effectLayerIdx === -1) {
    const newLayer: SpriteLayer = {
      id: `layer-effect-${Date.now()}`,
      name: 'Cast Effect',
      isVisible: true,
      isLocked: false,
      opacity: 1,
      frames: Array.from({ length: layers[0].frames.length }, () => 
        Array.from({ length: size }, () => Array(size).fill(0))
      ),
    };
    layers.push(newLayer);
    effectLayerIdx = layers.length - 1;
  }

  const baseLayerIdx = layers.findIndex(l => l.name.toLowerCase().includes('base')) || 0;
  const baseFrame = layers[baseLayerIdx].frames[0];
  const startIndex = layers[0].frames.length;
  
  // 2. Identify colors (Triplet: { main, light, dark })
  const { updatedAsset, colors } = getElementalColors(asset, settings.element);
  const { main, light, dark } = colors;
  
  const bounds = findBounds(baseFrame);
  const com = getCenterOfMass(baseFrame) || { r: size / 2, c: size / 2 };

  // 3. Finalize Effect Layer Palette
  if (layers[effectLayerIdx]) {
    layers[effectLayerIdx] = {
      ...layers[effectLayerIdx],
      paletteIds: [main, light, dark] // Only these colors in the effect layer
    };
  }

  // 4. Randomization (if selected)
  let shape = settings.shape;
  let randomizedOrigin = { r: com.r - 2, c: com.c + 4 };
  if (shape === 'random') {
    const shapes: CastShape[] = ['circle', 'burst', 'beam', 'spark', 'pulse'];
    shape = shapes[Math.floor(Math.random() * shapes.length)];
    // Slight shift in origin
    randomizedOrigin.r += (Math.random() - 0.5) * 4;
    randomizedOrigin.c += (Math.random() - 0.5) * 4;
  }
  
  // Define 6 frames for all layers
  for (let i = 0; i < 6; i++) {
    layers.forEach((layer, lIdx) => {
      const isBase = lIdx === baseLayerIdx;
      const isEffect = lIdx === effectLayerIdx;
      
      let nextFrame: Frame;
      
      if (isBase) {
        // Character recoil logic using anatomical segments
        const { neckRow, waistRow } = analyzeBodySegments(baseFrame);
        
        if (i < 2) { // Buildup: anticipation lean
           nextFrame = leanBody(baseFrame, waistRow, neckRow, -1);
        } else if (i < 4) { // Impact: lunge & thrust
           let f = leanBody(baseFrame, waistRow, neckRow, 2);
           f = shiftDown(f, -1); // slight lift
           nextFrame = f;
        } else { // Recovery: return/settle
           nextFrame = squash(baseFrame, [waistRow], undefined, neckRow);
        }
      } else if (isEffect) {
        // Spell effect logic
        nextFrame = Array.from({ length: size }, () => Array(size).fill(0));
        const effectOrigin = randomizedOrigin;

        if (i > 0) { // No effect on frame 0
          const intensity = i < 4 ? i / 3 : Math.max(0, (6 - i) / 3);
          
          switch (shape) {
            case 'circle': {
              const radius = i < 4 ? i * 1.5 : Math.max(0, (6 - i) * 1.5);
              nextFrame = drawCircle(nextFrame, effectOrigin.r, effectOrigin.c, radius, main, { light, dark });
              break;
            }
            case 'burst':
              nextFrame = drawBurst(nextFrame, effectOrigin.r, effectOrigin.c, intensity, main, { light, dark });
              break;
            case 'beam':
              nextFrame = drawBeam(nextFrame, effectOrigin.r, effectOrigin.c, intensity, main, { light, dark });
              break;
            case 'spark':
              nextFrame = drawSparks(nextFrame, effectOrigin.r, effectOrigin.c, intensity, main, { light, dark });
              break;
            case 'pulse':
              nextFrame = drawPulse(nextFrame, effectOrigin.r, effectOrigin.c, intensity, main, { light, dark });
              break;
          }
        }
      } else {
        // PRESERVE OTHER LAYERS (Eyes, Clothes, etc.)
        const layerBaseFrame = layer.frames[0] || Array.from({ length: size }, () => Array(size).fill(0));
        if (i < 2) {
          nextFrame = generateIdle(layerBaseFrame)[1];
        } else if (i < 4) {
          nextFrame = shiftDown(layerBaseFrame, -1);
        } else {
          nextFrame = layerBaseFrame.map(r => [...r]);
        }
      }
      
      layer.frames = [...layer.frames, nextFrame];
    });
  }

  const newAnimDef: AnimationDef = {
    name: 'cast',
    label: 'CAST',
    frameIndices: Array.from({ length: 6 }, (_, i) => startIndex + i),
    fps: 8,
  };

  const animations = [...updatedAsset.animations];
  const existingIdx = animations.findIndex(a => a.name === 'cast');
  if (existingIdx >= 0) animations[existingIdx] = newAnimDef;
  else animations.push(newAnimDef);

  return { ...updatedAsset, layers, animations };
}

const ELEMENT_PALETTES: Record<Exclude<CastElement, 'generic'>, string[]> = {
  fire: ['#662200', '#ff4d00', '#ffcc00'], // Dark Brown-Red, Orange, Yellow
  water: ['#003366', '#0099ff', '#99ffff'], // Dark Blue, Blue, Cyan
  electric: ['#4b0082', '#ffff00', '#ffffff'], // Purple, Yellow, White
  nature: ['#003300', '#33cc33', '#ccffcc'], // Dark Green, Green, Light Green
  ice: ['#006666', '#99ffff', '#ffffff'], // Dark Cyan, Cyan, White
};

/**
 * Returns a shaded triplet of color indices for an element.
 * Automatically adds the colors to the asset's palette if they are missing.
 */
function getElementalColors(asset: SpriteAsset, element: CastElement): { updatedAsset: SpriteAsset, colors: { main: number, light: number, dark: number } } {
  const palette = { ...asset.palette };
  const entries = Object.entries(palette).map(([k, v]) => ({ key: Number(k), hex: v.toLowerCase() })).filter(e => e.key > 0);
  
  if (element === 'generic' || !ELEMENT_PALETTES[element]) {
    const main = Math.max(...entries.map(e => e.key), 1);
    return { updatedAsset: asset, colors: { main, light: main, dark: main } };
  }

  const shadeHexes = ELEMENT_PALETTES[element];
  const colorIndices: number[] = [];
  let currentAsset = { ...asset };

  shadeHexes.forEach(hex => {
    // Fuzzy match
    const found = entries.find(e => e.hex.startsWith(hex.substring(0, 4)));
    if (found) {
      colorIndices.push(found.key);
    } else {
      // Add to palette with NEW reference to trigger React updates
      const nextIdx = Math.max(0, ...Object.keys(currentAsset.palette).map(Number)) + 1;
      currentAsset = {
        ...currentAsset,
        palette: { ...currentAsset.palette, [nextIdx]: hex },
        colorNames: { ...currentAsset.colorNames, [nextIdx]: `${element.toUpperCase()} SHADE` }
      };
      colorIndices.push(nextIdx);
    }
  });

  return { 
    updatedAsset: currentAsset, 
    colors: { 
      dark: colorIndices[0],
      main: colorIndices[1],
      light: colorIndices[2],
    }
  };
}

function generateFramePair(
  base: number[][],
  anim: string,
  glowColor: number,
  anatomy?: { neckRow?: number; waistRow?: number }
): [number[][], number[][]] {
  switch (anim) {
    case 'idle':
      return generateIdle(base, anatomy);
    case 'walk':
      return generateWalk(base, anatomy);
    case 'attack':
      return generateAttack(base, anatomy);
    case 'cast':
      return generateCast(base, glowColor, anatomy);
    case 'hurt':
      return generateHurt(base, anatomy);
    case 'jump':
      return generateJump(base, anatomy);
    default:
      return generateIdle(base);
  }
}

/**
 * Injects 3 externally generated frames (e.g. from AI) into a SpriteAsset
 * to form a 4-frame animation (baseFrame + 3 new frames).
 * AI frames are injected ONLY into the first layer.
 */
export function addExternalAnimation(
  asset: SpriteAsset,
  animationName: string,
  newFrames: number[][][],
  targetLayerId?: string | null,
): SpriteAsset {
  if (newFrames.length !== 3) {
    throw new Error('addExternalAnimation expects exactly 3 new frames');
  }

  const layeredAsset = ensureLayerSupport(asset);
  
  // Find which layer to inject into
  let targetIdx = 0;
  if (targetLayerId) {
    const found = layeredAsset.layers!.findIndex(l => l.id === targetLayerId);
    if (found >= 0) targetIdx = found;
  } else {
    // Fallback: search for "Base" or "Main"
    const baseIdx = layeredAsset.layers!.findIndex(l => l.name.toLowerCase().includes('base') || l.name.toLowerCase().includes('main'));
    if (baseIdx >= 0) targetIdx = baseIdx;
  }

   const startIndex = layeredAsset.layers![0].frames.length;
   const newLayers = layeredAsset.layers!.map((layer, idx) => {
    const frames = [...layer.frames];
    if (idx === targetIdx) {
      frames.push(...newFrames);
    } else {
      // Add empty frames to other layers to maintain alignment
      for (let i = 0; i < 3; i++) {
        frames.push(Array.from({ length: layeredAsset.size }, () => Array(layeredAsset.size).fill(0)));
      }
    }
    return { ...layer, frames };
  });

  const fps = animationName === 'idle' ? 3 : animationName === 'cast' ? 4 : 5;
  const newAnimation: AnimationDef = {
    name: animationName,
    label: animationName.toUpperCase(),
    frameIndices: [0, startIndex, startIndex + 1, startIndex + 2],
    fps,
  };

  const animations = [...layeredAsset.animations];
  const existingIdx = animations.findIndex(a => a.name === animationName);
  
  if (existingIdx >= 0) {
    animations[existingIdx] = newAnimation;
  } else {
    animations.push(newAnimation);
  }

  return {
    ...layeredAsset,
    layers: newLayers,
    animations,
  };
}

/**
 * Duplicates the frame index in all layers.
 */
export function duplicateFrameInAllLayers(asset: SpriteAsset, targetIdx: number): SpriteAsset {
   const newLayers = asset.layers!.map(layer => {
    const newFrames = [...layer.frames];
    const frameToCopy = newFrames[targetIdx].map(row => [...row]);
    newFrames.splice(targetIdx + 1, 0, frameToCopy);
    return { ...layer, frames: newFrames };
  });

  const newAnimations = asset.animations.map(anim => ({
    ...anim,
    frameIndices: anim.frameIndices.flatMap(oldIdx => {
      if (oldIdx === targetIdx) return [oldIdx, targetIdx + 1];
      return oldIdx > targetIdx ? oldIdx + 1 : oldIdx;
    })
  }));

  return { ...asset, layers: newLayers, animations: newAnimations };
}

/**
 * Adds an empty frame after the specified index in all layers.
 */
export function addEmptyFrameToAllLayers(asset: SpriteAsset, afterIdx: number): SpriteAsset {
  const size = asset.size;
   const newLayers = asset.layers!.map(layer => {
    const newFrames = [...layer.frames];
    const emptyFrame = Array.from({ length: size }, () => Array(size).fill(0));
    newFrames.splice(afterIdx + 1, 0, emptyFrame);
    return { ...layer, frames: newFrames };
  });

  const newAnimations = asset.animations.map(anim => ({
    ...anim,
    frameIndices: anim.frameIndices.flatMap(oldIdx => {
      if (oldIdx === afterIdx) return [oldIdx, afterIdx + 1];
      return oldIdx > afterIdx ? oldIdx + 1 : oldIdx;
    })
  }));

  return { ...asset, layers: newLayers, animations: newAnimations };
}

/**
 * Removes a frame index from all layers.
 */
export function removeFrameFromAllLayers(asset: SpriteAsset, targetIdx: number): SpriteAsset {
  const firstLayer = asset.layers![0];
  if (firstLayer.frames.length <= 1) return asset;

   const newLayers = asset.layers!.map(layer => {
    const newFrames = [...layer.frames];
    newFrames.splice(targetIdx, 1);
    return { ...layer, frames: newFrames };
  });

  const newAnimations = asset.animations.map(anim => {
    const validIndices = anim.frameIndices.filter(oldIdx => oldIdx !== targetIdx);
    return {
      ...anim,
      frameIndices: validIndices.map(oldIdx => oldIdx > targetIdx ? oldIdx - 1 : oldIdx)
    };
  });

  return { ...asset, layers: newLayers, animations: newAnimations };
}

/**
 * Moves a frame from one index to another, updating all layers.
 */
export function moveFrame(asset: SpriteAsset, fromIdx: number, toIdx: number): SpriteAsset {
  const frameCount = asset.layers![0]?.frames.length || 0;
  if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= frameCount || toIdx >= frameCount) {
    return asset;
  }

  const newLayers = asset.layers!.map(layer => {
    const newFrames = [...layer.frames];
    const [movedFrame] = newFrames.splice(fromIdx, 1);
    newFrames.splice(toIdx, 0, movedFrame);
    return { ...layer, frames: newFrames };
  });

  const newAnimations = asset.animations.map(anim => ({
    ...anim,
    frameIndices: anim.frameIndices.map(oldIdx => {
      if (oldIdx === fromIdx) return toIdx;
      if (fromIdx > toIdx) { // Moved left
        if (oldIdx >= toIdx && oldIdx < fromIdx) return oldIdx + 1;
      } else { // Moved right
        if (oldIdx > fromIdx && oldIdx <= toIdx) return oldIdx - 1;
      }
      return oldIdx;
    })
  }));

  return { ...asset, layers: newLayers, animations: newAnimations };
}
