// Importing a whole character from a pack's sheets in one go, with the
// standard directional tags the game contract expects (idle/walk/attack/hurt
// per direction, plus technique and die).
//
// Layouts describe how a pack lays out its sheets. The first one is the
// Ninja Adventure convention: separate PNGs, 4 columns = down, up, left,
// right; Walk has 4 rows of steps; Special1 and Dead are single frames.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SpriteAsset } from '../lib/types';
import { importSheet, type TagInput } from './sheet';

export const DIRECTIONS = ['down', 'up', 'left', 'right'] as const;

export type CharacterLayout = 'ninja_separate' | 'ninja_sheet';

export interface ImportCharacterOptions {
  /** Directory holding the pack's PNGs. */
  dir: string;
  layout: CharacterLayout;
  id: string;
  name?: string;
  frameSize?: number;
  /** ms for attack / hurt / technique / die single frames. */
  attackMs?: number;
  hurtMs?: number;
  techniqueMs?: number;
  dieMs?: number;
  walkFps?: number;
}

interface SheetStep {
  file: string;
  tags: TagInput[];
  optional?: boolean;
}

function perDirection(prefix: string, make: (d: string, i: number) => Omit<TagInput, 'name'>): TagInput[] {
  return DIRECTIONS.map((d, i) => ({ name: `${prefix}_${d}`, ...make(d, i) }));
}

function ninjaSeparate(o: Required<Pick<ImportCharacterOptions, 'attackMs' | 'hurtMs' | 'techniqueMs' | 'dieMs' | 'walkFps'>>): SheetStep[] {
  return [
    { file: 'Idle.png', tags: [
      ...perDirection('idle', (_d, i) => ({ frames: [i], fps: 1 })),
      ...perDirection('hurt', (_d, i) => ({ frames: [i], durations: [o.hurtMs], loop: false })),
    ] },
    { file: 'Walk.png', tags: perDirection('walk', (_d, i) => ({ frames: `col:${i}`, fps: o.walkFps })) },
    { file: 'Attack.png', tags: perDirection('attack', (_d, i) => ({ frames: [i], durations: [o.attackMs], loop: false })) },
    { file: 'Special1.png', tags: [{ name: 'technique', frames: [0], durations: [o.techniqueMs], loop: false }], optional: true },
    { file: 'Dead.png', tags: [{ name: 'die', frames: [0], durations: [o.dieMs], loop: false }], optional: true },
  ];
}

/** One sheet: 4 columns (directions) × N rows (steps). Attack uses the middle step. */
function ninjaSheet(o: Required<Pick<ImportCharacterOptions, 'attackMs' | 'hurtMs' | 'techniqueMs' | 'dieMs' | 'walkFps'>>, rows: number): SheetStep[] {
  const mid = Math.min(2, rows - 1);
  return [
    { file: 'SpriteSheet.png', tags: [
      ...perDirection('idle', (_d, i) => ({ frames: [i], fps: 1 })),
      ...perDirection('hurt', (_d, i) => ({ frames: [i], durations: [o.hurtMs], loop: false })),
      ...perDirection('walk', (_d, i) => ({ frames: `col:${i}`, fps: o.walkFps })),
      ...perDirection('attack', (_d, i) => ({ frames: [mid * 4 + i, i], durations: [o.attackMs, o.attackMs], loop: false })),
      { name: 'technique', frames: [mid * 4, (rows - 1) * 4], durations: [o.techniqueMs, o.techniqueMs], loop: false },
      { name: 'die', frames: [0], durations: [o.dieMs], loop: false },
    ] },
  ];
}

export function importCharacter(opts: ImportCharacterOptions): { asset: SpriteAsset; sheets: string[] } {
  const size = opts.frameSize ?? 16;
  const timing = {
    attackMs: opts.attackMs ?? 330, hurtMs: opts.hurtMs ?? 250,
    techniqueMs: opts.techniqueMs ?? 500, dieMs: opts.dieMs ?? 1000, walkFps: opts.walkFps ?? 8,
  };
  let steps: SheetStep[];
  if (opts.layout === 'ninja_separate') {
    steps = ninjaSeparate(timing);
  } else {
    // Rows of the single sheet decide the walk length.
    const probe = importSheet({ png: join(opts.dir, 'SpriteSheet.png'), frameWidth: size, frameHeight: size });
    steps = ninjaSheet(timing, probe.rows);
  }
  let asset: SpriteAsset | undefined;
  const used: string[] = [];
  for (const step of steps) {
    const png = join(opts.dir, step.file);
    if (!existsSync(png)) {
      if (step.optional) continue;
      throw new Error(`missing ${png}`);
    }
    const r = importSheet({
      png, into: asset, frameWidth: size, frameHeight: size,
      id: opts.id, name: opts.name ?? opts.id, category: 'character', tags: step.tags,
    });
    asset = r.asset;
    used.push(step.file);
  }
  if (!asset) throw new Error('no sheets found');
  return { asset, sheets: used };
}
