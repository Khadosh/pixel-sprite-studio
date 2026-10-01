// Text drawings through the real editor store: open, (maybe) touch, save.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { drawingFixtures, DRAWINGS_DIR } from '@/headless/fixtures/drawings';
import { createSpriteEditorStore } from '@/components/SpriteEditor/store/useSpriteEditorStore';
import type { SpriteAsset } from './types';
import { openTextDrawing, saveTextDrawing, toHexColor } from './textDrawing';

function editorFor(asset: SpriteAsset, onSave: (a: SpriteAsset) => unknown = () => {}) {
  return createSpriteEditorStore({
    initialAsset: asset,
    onSave: onSave as never,
    onOpenChange: () => {},
    previewPanelRef: { current: null },
    fromTextFile: true,
  });
}

const GUARDIAN = `${DRAWINGS_DIR}/bestias/guardian_de_piedra_pelea.txt`;

describe('text drawings in the editor', () => {
  const files = drawingFixtures();

  it.each(files.map(f => [f.slice(DRAWINGS_DIR.length + 1), f]))('%s opens and saves back unchanged', (_n, file) => {
    const text = readFileSync(file, 'utf8');
    const { asset, session } = openTextDrawing(text, file);
    const store = editorFor(asset);
    const saved = saveTextDrawing(store.getState().editedAsset, session);
    expect(saved.warnings).toEqual([]);
    expect(saved.text).toBe(text);
  });

  it('loads size, palette, frames and animations of the guardian', () => {
    const { asset } = openTextDrawing(readFileSync(GUARDIAN, 'utf8'), 'guardian_de_piedra_pelea.txt');
    const ed = editorFor(asset).getState().editedAsset;
    expect(ed.size).toBe(32);
    expect(ed.palette[1]).toBe('#15120f');
    expect(ed.colorNames[1]).toBe('tinta');
    expect(ed.animations.map(a => a.name)).toEqual(['idle', 'attack', 'technique', 'hurt', 'die']);
    expect(ed.animations[0].durations).toEqual([700, 250, 700, 250]);
    expect(ed.animations[1].loop).toBe(false);
  });

  it('a retouched pixel changes exactly that character', () => {
    const text = readFileSync(GUARDIAN, 'utf8');
    const { asset, session } = openTextDrawing(text, 'g.txt');
    const store = editorFor(asset);
    store.getState().setEditedAsset(prev => {
      const layers = prev.layers!.map(l => ({ ...l, frames: l.frames.map(f => f.map(r => [...r])) }));
      layers[0].frames[2][0][0] = 3; // "s" piedra, top-left of the third frame
      return { ...prev, layers };
    });
    const out = saveTextDrawing(store.getState().editedAsset, session).text;
    const a = text.split('\n'), b = out.split('\n');
    const diff = a.map((l, i) => [l, b[i]]).filter(([x, y]) => x !== y);
    expect(a.length).toBe(b.length);
    expect(diff).toEqual([['................................', 's...............................']]);
  });

  it('a new color in the editor gets a glyph and survives', () => {
    const { asset, session } = openTextDrawing('k = #000000\n== idle 0\nk.\n..\n', 'p.txt');
    const store = editorFor(asset);
    store.getState().addColor();
    const ed = store.getState().editedAsset;
    const key = Math.max(...Object.keys(ed.palette).map(Number));
    ed.layers![0].frames[0][1][1] = key;
    const out = saveTextDrawing(ed, session).text;
    const back = openTextDrawing(out, 'p.txt').asset;
    expect(back.palette[key]).toBe('#888888');
    expect(back.layers![0].frames[0][1][1]).toBe(key);
  });

  it('keeps a palette of two colors (no theory palette injected)', () => {
    const { asset } = openTextDrawing(readFileSync(`${DRAWINGS_DIR}/fx/sombra_chica.txt`, 'utf8'), 's.txt');
    const pal = editorFor(asset).getState().editedAsset.palette;
    expect(Object.values(pal)).toEqual(['transparent', '#15120f80', '#15120f48']);
  });

  it('a non-square drawing opens padded to a square and crops back, warning about pixels outside', () => {
    const text = 'size: 2x1\nk = #000000\n== \nkk\n';
    const { asset, session } = openTextDrawing(text, 'w.txt');
    expect(asset.size).toBe(2);
    expect(asset.layers![0].frames[0]).toEqual([[1, 1], [0, 0]]);
    expect(saveTextDrawing(asset, session).text).toContain('size: 2x1');
    asset.layers![0].frames[0][1][0] = 1;
    const saved = saveTextDrawing(asset, session);
    expect(saved.warnings).toEqual(['1 píxeles pintados fuera del lienzo de 2x1 no se guardan.']);
    expect(saved.text.trimEnd().endsWith('\nkk')).toBe(true);
  });

  it('warns about what the text cannot keep', () => {
    const { asset, session } = openTextDrawing('# nota\nk = #000000\n==\nk.\n..\n', 'c.txt');
    const base = asset.layers![0];
    asset.layers = [
      { ...base, opacity: 0.5 },
      { ...base, id: 'l2', name: 'Arriba', frames: [[[0, 1], [0, 0]]] },
      { ...base, id: 'l3', name: 'Oculta', isVisible: false, frames: [[[0, 0], [1, 0]]] },
    ];
    asset.animations = [{ name: 'idle', label: 'Quieto lento', frameIndices: [0] }];
    const saved = saveTextDrawing(asset, session);
    expect(saved.warnings).toEqual([
      'La capa «Oculta» está oculta: no se guarda.',
      'Las 2 capas visibles se aplanan en una: el texto guarda una sola capa.',
      'La capa «Base» tiene opacidad 50%: se guarda opaca (el texto sólo guarda alfa en los colores de la paleta).',
      'La etiqueta «Quieto lento» de idle tiene espacios: el texto no la guarda.',
      'El archivo tenía 1 línea(s) de comentario (#): no se vuelven a escribir.',
    ]);
    expect(saved.text).toContain('== idle 0\nkk\n..\n');
  });

  it('converts rgba() editor colors to hex with alpha', () => {
    expect(toHexColor('rgba(0,0,0,0.5)')).toBe('#00000080');
    expect(toHexColor('rgb(255, 0, 16)')).toBe('#ff0010');
    expect(toHexColor('#ABCDEF')).toBe('#abcdef');
  });

  it('handleSave keeps the changes marked when the save is cancelled', async () => {
    const { asset } = openTextDrawing('k = #000\n==\nk\n', 'x.txt');
    let answer = false;
    const onSave = vi.fn(async () => answer);
    const store = editorFor(asset, onSave);
    store.setState({ isDirty: true });
    store.getState().handleSave();
    await Promise.resolve(); await Promise.resolve();
    expect(store.getState().isDirty).toBe(true);
    answer = true;
    store.getState().handleSave();
    await Promise.resolve(); await Promise.resolve();
    expect(store.getState().isDirty).toBe(false);
  });
});
