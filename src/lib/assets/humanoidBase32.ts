import type { SpriteAsset } from '@/lib/types';
import { upscale2x } from '@/lib/layerUtils';
import { humanoidBase } from './humanoidBase';

// We upscale the frames from the 16x16 template to generate a quick 32x32 base template
const front32 = upscale2x(humanoidBase.layers![0].frames[0]);
const side32 = upscale2x(humanoidBase.layers![0].frames[1]);
const back32 = upscale2x(humanoidBase.layers![0].frames[2]);

export const humanoidBase32: SpriteAsset = {
  id: 'humanoid-template-32',
  name: 'Base Human 32x32 (Template)',
  description: 'A structural start with Front, Side, and Back canonical bases, upscaled to 32x32.',
  category: 'character',
  size: 32,
  palette: humanoidBase.palette,
  colorNames: humanoidBase.colorNames,
  layers: [{
    id: 'base-layer',
    name: 'Base',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: [front32, side32, back32] // Index 0: Front, Index 1: Side, Index 2: Back
  }],
  animations: [],
  tags: ['template', 'humanoid', 'base', '32px'],
};
