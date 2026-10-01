// The real text drawings of The Unwritten Dao (art/pss/dibujos), copied here so
// tests can check the round trip without the game repo. Node only (tests).
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const DRAWINGS_DIR = join(__dirname, 'dibujos');

/** Absolute paths of every .txt under fixtures/dibujos, sorted. */
export function drawingFixtures(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.txt')) out.push(p);
    }
  };
  walk(DRAWINGS_DIR);
  return out;
}
