// @vitest-environment node
// Round trip of every real drawing of The Unwritten Dao (copied to fixtures/dibujos):
// text → asset → text must be the same text, glyphs and all.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fromAscii, toAscii, resolveBeside } from './ascii';
import { DRAWINGS_DIR as FIXTURES, drawingFixtures } from './fixtures/drawings';

describe('ascii round trip on the real drawings', () => {
  const files = drawingFixtures();

  it('has the drawings', () => {
    expect(files.length).toBeGreaterThanOrEqual(79);
  });

  it.each(files.map(f => [f.slice(FIXTURES.length + 1), f]))('%s comes back exactly', (_name, file) => {
    const text = readFileSync(file, 'utf8');
    const { asset, layout } = fromAscii(text, { sourcePath: file });
    expect(toAscii(asset, { layout }).text).toBe(text);
  });
});

describe('ascii layout', () => {
  it('keeps glyphs, declared anims and fit; new colors get free glyphs', () => {
    const text = [
      'id: x', 'name: X', 'category: prop', 'size: 2x1', 'fit: ../paleta.pss.json', 'anim: b fps=2', '',
      'k = #000000 tinta', 'z = #ff0000', '',
      '== a 0', 'kz', '', '== b 0', 'zk', '',
    ].join('\n');
    const { asset, layout, fit } = fromAscii(text, { sourcePath: '/juego/dibujos/x.txt' });
    expect(fit).toBe('/juego/paleta.pss.json');
    expect(layout).toEqual({ glyphs: { 1: 'k', 2: 'z' }, declared: ['b'], fit: '../paleta.pss.json', comments: 0 });
    // fromAscii orders declared first: b then a. Written back, a gets no line but the order holds.
    expect(asset.animations.map(a => a.name)).toEqual(['b', 'a']);
    expect(toAscii(asset, { layout }).text).toBe(text);
    asset.palette[3] = '#00ff00';
    asset.layers![0].frames[0][0][0] = 3;
    const out = toAscii(asset, { layout }).text;
    expect(out).toContain('3 = #00ff00');
    expect(out).toContain('== a 0\n3z');
  });

  it('writes an anim line for an undeclared animation when the order needs it', () => {
    const { asset, layout } = fromAscii('k = #000\n== a 0\nk\n== b 0\nk\n');
    asset.animations.reverse(); // b first now, but a appears first in the frames
    const back = fromAscii(toAscii(asset, { layout }).text).asset;
    expect(back.animations.map(a => a.name)).toEqual(['b', 'a']);
  });

  it('counts comments', () => {
    expect(fromAscii('# hola\nk = #000\n==\n# chau\nk\n').layout.comments).toBe(2);
  });

  it('resolves fit beside the source without node:path', () => {
    expect(resolveBeside('/a/b/c.txt', '../d.json')).toBe('/a/d.json');
    expect(resolveBeside('a/c.txt', './d.json')).toBe('a/d.json');
    expect(resolveBeside('/a/c.txt', '/abs.json')).toBe('/abs.json');
  });
});
