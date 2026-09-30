// Procedural animation from one base frame, headless. Wraps the anatomy
// engine generators (src/lib/sprite/generators) that the editor uses, so a
// script can grow a walk cycle, an idle breath or an attack out of a single
// drawn pose.

import type { AnatomyConfig, Frame, SpriteAsset } from '../lib/types';
import { generateIdle } from '../lib/sprite/generators/idle';
import { generateWalk, generateWalkSide, generateWalkTopDown } from '../lib/sprite/generators/walk';
import { generateJump, generateRun } from '../lib/sprite/generators/movement';
import { generateAttack, generateAttackTopDown, generateCast } from '../lib/sprite/generators/combat';
import { generateDie, generateHurt } from '../lib/sprite/generators/life';
import { flipHorizontal } from '../lib/sprite/transforms';
import { addFrame, colorIndex, getFrame, setAnimation } from './asset';

/**
 * Same dispatch as generateFrameSequence in src/lib/spriteAnimations.ts, but
 * importing the generators directly: that module uses the "@/" alias, which
 * only the bundler and vitest resolve, and the CLI runs under tsx.
 */
export function generateSequence(base: Frame, anim: string, glow: number, anatomy?: AnatomyConfig): Frame[] {
  const dir = (anim.match(/_(down|up|left|right)$/)?.[1] ?? '') as '' | 'down' | 'up' | 'left' | 'right';
  const kind = kindOf(anim);
  const orientation = dir === 'up' ? 2 : dir === 'left' || dir === 'right' ? 1 : 0;
  const topDown = dir === 'up' || dir === 'down';
  const side = dir === 'left' || dir === 'right';
  let frames: Frame[];
  switch (kind) {
    case 'idle': frames = generateIdle(base, anatomy, orientation); break;
    case 'walk':
      frames = topDown ? generateWalkTopDown(base, anatomy, orientation)
        : side ? generateWalkSide(base, anatomy, orientation)
        : generateWalk(base, anatomy, orientation);
      break;
    case 'run': frames = generateRun(base, anatomy, orientation); break;
    case 'jump': frames = generateJump(base, anatomy, orientation); break;
    case 'attack': frames = topDown ? generateAttackTopDown(base, anatomy, orientation) : generateAttack(base, anatomy, orientation); break;
    case 'cast': frames = generateCast(base, glow, anatomy, orientation); break;
    case 'hurt': frames = generateHurt(base, anatomy, orientation); break;
    case 'die': frames = generateDie(base, anatomy, orientation); break;
    default: frames = [generateIdle(base, anatomy)[0]];
  }
  return dir === 'left' ? frames.map(f => flipHorizontal(f)) : frames;
}

export const ANIMATION_KINDS = [
  'idle', 'walk', 'run', 'jump', 'attack', 'cast', 'hurt', 'die',
] as const;

export interface AnimateOptions {
  /** Frame index of the base pose. */
  base: number;
  /**
   * What to generate, optionally with a direction suffix that picks the
   * orientation: "walk_down", "attack_up", "idle", "cast_left"…
   * Left variants are generated as right and flipped.
   */
  anim: string;
  /** Tag name for the result. Default: anim. */
  name?: string;
  fps?: number;
  loop?: boolean;
  /** Glow color for "cast". Default: the highest palette index. */
  glow?: string | number;
  /** Overrides for the automatic body segmentation (rows in pixels). */
  anatomy?: Partial<Pick<AnatomyConfig, 'neckRow' | 'waistRow' | 'kneeRow' | 'ankleRow'>>;
}

export function kindOf(anim: string): string {
  return anim.replace(/_(down|up|left|right)$/, '');
}

/** Appends the generated frames and tags them. Returns the new indices. */
export function animateAsset(asset: SpriteAsset, opts: AnimateOptions): number[] {
  const kind = kindOf(opts.anim);
  if (!(ANIMATION_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`unknown animation "${opts.anim}" (kinds: ${ANIMATION_KINDS.join(', ')})`);
  }
  const base = getFrame(asset, opts.base);
  const paletteKeys = Object.keys(asset.palette).map(Number).filter(k => k > 0);
  const glow = opts.glow !== undefined ? colorIndex(asset, opts.glow) : Math.max(1, ...paletteKeys);
  const anatomy: AnatomyConfig | undefined = opts.anatomy || asset.anatomy
    ? { ...(asset.anatomy ?? {}), ...(opts.anatomy ?? {}) }
    : undefined;
  const frames = generateSequence(base, opts.anim, glow, anatomy);
  const indices = frames.map(f => addFrame(asset, f));
  const isLoop = opts.loop ?? ['idle', 'walk', 'run'].includes(kind);
  const fps = opts.fps ?? (kind === 'walk' || kind === 'run' ? 10 : kind === 'idle' ? 3 : 6);
  setAnimation(asset, { name: opts.name ?? opts.anim, frameIndices: indices, fps, loop: isLoop });
  return indices;
}
