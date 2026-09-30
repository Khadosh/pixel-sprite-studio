// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAsset, composite, dims, frameCount, loadAsset, saveAsset, setAnimation, removeFrame, colorIndex } from './asset';
import { readPng, writePng, getPixel } from './png';
import { renderAscii, renderFrame, hexToRgba, rgbaToHex } from './render';
import { exportSheet, importSheet, importSheetImage } from './sheet';
import { applyDrawOps, generateFxAnimation, seededRandom, applyFx, floodFill, fitPalette } from './ops';
import { runCommand, commands } from './commands';
import { main as cliMain } from './cli';
import { importCharacter } from './character';
import { animateAsset } from './animate';
import { cropToContent, generateImage, loadFalKey, pixelize } from './ai';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'pss-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('asset model', () => {
  it('creates a non-square canvas and keeps size as the larger side', () => {
    const a = createAsset({ id: 'x', width: 20, height: 28, palette: ['#ff0000'] });
    expect(dims(a)).toEqual({ width: 20, height: 28 });
    expect(a.size).toBe(28);
    expect(a.layers![0].frames[0].length).toBe(28);
    expect(a.layers![0].frames[0][0].length).toBe(20);
  });

  it('square canvases do not carry width/height', () => {
    const a = createAsset({ id: 'x', width: 16 });
    expect(a.width).toBeUndefined();
    expect(dims(a)).toEqual({ width: 16, height: 16 });
  });

  it('round-trips through disk', () => {
    const a = createAsset({ id: 'x', width: 8, palette: ['#123456'] });
    a.layers![0].frames[0][2][3] = 1;
    const p = join(dir, 'x.pss.json');
    saveAsset(p, a);
    const b = loadAsset(p);
    expect(b.layers![0].frames[0][2][3]).toBe(1);
    expect(b.palette[1]).toBe('#123456');
  });

  it('colorIndex reuses existing colors and appends new ones', () => {
    const a = createAsset({ id: 'x', width: 4, palette: ['#ff0000'] });
    expect(colorIndex(a, '#FF0000')).toBe(1);
    expect(colorIndex(a, '#00ff00')).toBe(2);
    expect(a.palette[2]).toBe('#00ff00');
    expect(colorIndex(a, 'transparent')).toBe(0);
    expect(() => colorIndex(a, 9)).toThrow();
  });

  it('removing a frame re-indexes animations', () => {
    const a = createAsset({ id: 'x', width: 4, frames: 4 });
    setAnimation(a, { name: 'walk', frameIndices: [0, 1, 2, 3], durations: [100, 100, 100, 100] });
    removeFrame(a, 1);
    expect(frameCount(a)).toBe(3);
    expect(a.animations[0].frameIndices).toEqual([0, 1, 2]);
    expect(a.animations[0].durations).toHaveLength(3);
  });

  it('refuses animations that point outside the frames', () => {
    const a = createAsset({ id: 'x', width: 4 });
    expect(() => setAnimation(a, { name: 'bad', frameIndices: [3] })).toThrow();
  });
});

describe('drawing', () => {
  it('draws lines, rects and fills with x = column, y = row', () => {
    const a = createAsset({ id: 'x', width: 5, height: 3, palette: ['#ffffff', '#000000'] });
    applyDrawOps(a, 0, [
      { op: 'line', x0: 0, y0: 0, x1: 4, y1: 0, color: 1 },
      { op: 'pixel', x: 2, y: 2, color: '#000000' },
    ]);
    expect(renderAscii(composite(a, 0))).toBe('11111\n.....\n..2..');
  });

  it('flood fill stops at other colors', () => {
    const a = createAsset({ id: 'x', width: 4, height: 2, palette: ['#ffffff', '#000000'] });
    const f = a.layers![0].frames[0];
    f[0][2] = 1; f[1][2] = 1;
    expect(floodFill(f, 0, 0, 2)).toBe(4);
    expect(renderAscii(f)).toBe('221.\n221.');
  });

  it('fx are deterministic with a seed and honor non-square canvases', () => {
    const a = createAsset({ id: 'x', width: 24, height: 12, palette: ['#fff', '#f80', '#800'] });
    const blank = () => a.layers![0].frames[0].map(r => [...r]);
    const one = applyFx(a, blank(), { shape: 'sparks', intensity: 1, color: 2, light: 1, dark: 3, seed: 42 });
    const two = applyFx(a, blank(), { shape: 'sparks', intensity: 1, color: 2, light: 1, dark: 3, seed: 42 });
    expect(one).toEqual(two);
    expect(one.length).toBe(12);
    expect(one[0].length).toBe(24);
    const rng = seededRandom(3);
    expect(rng()).toBe(seededRandom(3)());
  });

  it('bolt draws a connected jagged path from top to bottom, reproducibly', () => {
    const a = createAsset({ id: 'x', width: 16, height: 32, palette: ['#fff', '#88f', '#448'] });
    const blank = () => a.layers![0].frames[0].map(r => [...r]);
    const one = applyFx(a, blank(), { shape: 'bolt', intensity: 1, color: 2, light: 1, dark: 3, seed: 5 });
    const two = applyFx(a, blank(), { shape: 'bolt', intensity: 1, color: 2, light: 1, dark: 3, seed: 5 });
    expect(one).toEqual(two);
    // Every row between the ends has at least one painted pixel: no gaps.
    for (let r = 0; r < 32; r++) expect(one[r].some(v => v !== 0)).toBe(true);
    expect(one[0][8]).toBe(1);
    expect(one[31][8]).toBe(1);
  });

  it('fx_anim appends tagged frames whose intensity rises and falls', () => {
    const a = createAsset({ id: 'x', width: 16, palette: ['#fff', '#f80', '#800'] });
    const idx = generateFxAnimation(a, { name: 'technique', shape: 'circle', frames: 5, color: 2, light: 1, dark: 3 });
    expect(idx).toEqual([1, 2, 3, 4, 5]);
    const painted = idx.map(i => composite(a, i).flat().filter(v => v).length);
    const peak = painted.indexOf(Math.max(...painted));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(4);
    expect(a.animations[0]).toMatchObject({ name: 'technique', loop: false, fps: 12 });
  });
});

describe('sheets', () => {
  it('exports 1:1 with an Aseprite-style meta and imports back exactly', () => {
    const a = createAsset({ id: 'hero', width: 6, height: 4, palette: ['#ff0000', '#00ff0080'], frames: 3 });
    a.layers![0].frames[0][1][1] = 1;
    a.layers![0].frames[1][2][2] = 2;
    a.layers![0].frames[2][3][5] = 1;
    setAnimation(a, { name: 'idle', frameIndices: [0], fps: 1 });
    setAnimation(a, { name: 'walk', frameIndices: [1, 2], durations: [80, 120], loop: true });
    const { image, meta } = exportSheet(a, { imageName: 'hero.png' });
    expect(image.width).toBe(12);
    expect(image.height).toBe(8);
    expect(meta.meta.frameTags).toEqual([
      { name: 'idle', from: 0, to: 0, direction: 'forward', loop: true },
      { name: 'walk', from: 1, to: 2, direction: 'forward', loop: true },
    ]);
    expect(meta.frames[0].duration).toBe(1000);
    expect(meta.frames[1]).toMatchObject({ frame: { x: 0, y: 4, w: 6, h: 4 }, duration: 80 });
    expect(meta.frames[2]).toMatchObject({ frame: { x: 6, y: 4, w: 6, h: 4 }, duration: 120 });
    expect(getPixel(image, 1, 1)).toEqual([255, 0, 0, 255]);
    expect(getPixel(image, 2, 6)).toEqual([0, 255, 0, 128]);

    const png = join(dir, 'hero.png');
    writePng(png, image);
    const back = importSheet({ png, frameWidth: 6, frameHeight: 4, tags: [{ name: 'walk', frames: 'row:1' }] });
    expect(back.columns).toBe(2);
    expect(back.rows).toBe(2);
    expect(back.asset.palette[1]).toBe('#ff0000');
    expect(back.asset.palette[2]).toBe('#00ff0080');
    expect(composite(back.asset, 0)).toEqual(composite(a, 0));
    expect(composite(back.asset, 2)).toEqual(composite(a, 1));
    expect(back.asset.animations[0].frameIndices).toEqual([2, 3]);
  });

  it('supports margin, spacing and col: tags', () => {
    const img = { width: 2 + 3 * 2 + 2 * 1, height: 2 + 2 * 2 + 1, data: new Uint8Array((2 + 3 * 2 + 2 * 1) * (2 + 2 * 2 + 1) * 4) };
    // paint frame (col 1, row 1) at its top-left pixel
    const x = 1 + 1 * (2 + 1), y = 1 + 1 * (2 + 1);
    const i = (y * img.width + x) * 4;
    img.data[i] = 10; img.data[i + 1] = 20; img.data[i + 2] = 30; img.data[i + 3] = 255;
    const r = importSheetImage(img, { frameWidth: 2, frameHeight: 2, margin: 1, spacing: 1, tags: [{ name: 'c1', frames: 'col:1' }] });
    expect(r.columns).toBe(3);
    expect(r.rows).toBe(2);
    expect(r.asset.animations[0].frameIndices).toEqual([1, 4]);
    expect(composite(r.asset, 4)[0][0]).toBe(1);
    expect(r.asset.palette[1]).toBe('#0a141e');
  });

  it('appends a second sheet into an existing asset, merging the palette and offsetting tags', () => {
    const a = createAsset({ id: 'hero', width: 2, height: 2, palette: ['#ff0000'], frames: 2 });
    a.layers![0].frames[0][0][0] = 1;
    const img = { width: 4, height: 2, data: new Uint8Array(4 * 2 * 4) };
    const paint = (x: number, y: number, rgb: number[]) => { const i = (y * 4 + x) * 4; img.data.set([...rgb, 255], i); };
    paint(0, 0, [255, 0, 0]);   // same red as the asset
    paint(2, 1, [0, 0, 255]);   // new blue
    const r = importSheetImage(img, { into: a, frameWidth: 2, frameHeight: 2, tags: [{ name: 'walk', frames: 'row:0' }] });
    expect(r.asset).toBe(a);
    expect(frameCount(a)).toBe(4);
    expect(a.palette).toEqual({ 1: '#ff0000', 2: '#0000ff' });
    expect(a.layers![0].frames[2][0][0]).toBe(1);
    expect(a.layers![0].frames[3][1][0]).toBe(2);
    expect(a.animations[0].frameIndices).toEqual([2, 3]);
    expect(() => importSheetImage(img, { into: a, frameWidth: 4, frameHeight: 2 })).toThrow(/cannot append/);
  });

  it('strip layout refuses non-contiguous animations', () => {
    const a = createAsset({ id: 'x', width: 2, frames: 3 });
    setAnimation(a, { name: 'odd', frameIndices: [0, 2] });
    expect(() => exportSheet(a, { imageName: 'x.png', layout: 'strip' })).toThrow(/contiguous/);
  });
});

describe('characters', () => {
  it('imports a ninja_separate folder with the standard tags, skipping optional sheets', () => {
    const solid = (w: number, h: number, rgb: number[]) => {
      const img = { width: w, height: h, data: new Uint8Array(w * h * 4) };
      for (let i = 0; i < w * h; i++) img.data.set([...rgb, 255], i * 4);
      return img;
    };
    writePng(join(dir, 'Idle.png'), solid(8, 2, [10, 10, 10]));
    writePng(join(dir, 'Walk.png'), solid(8, 8, [20, 20, 20]));
    writePng(join(dir, 'Attack.png'), solid(8, 2, [30, 30, 30]));
    const { asset, sheets } = importCharacter({ dir, layout: 'ninja_separate', id: 'npc', frameSize: 2 });
    expect(sheets).toEqual(['Idle.png', 'Walk.png', 'Attack.png']);
    expect(frameCount(asset)).toBe(4 + 16 + 4);
    const names = asset.animations.map(a => a.name);
    for (const d of ['down', 'up', 'left', 'right']) {
      for (const p of ['idle', 'hurt', 'walk', 'attack']) expect(names).toContain(`${p}_${d}`);
    }
    expect(names).not.toContain('technique');
    expect(asset.animations.find(a => a.name === 'walk_left')!.frameIndices).toEqual([6, 10, 14, 18]);
    expect(asset.animations.find(a => a.name === 'attack_up')!.frameIndices).toEqual([21]);
    expect(Object.keys(asset.palette)).toHaveLength(3);
  });
});

describe('animate', () => {
  it('grows a walk cycle and an idle from one pose and tags them', () => {
    const a = createAsset({ id: 'x', width: 16, palette: ['#000', '#f00', '#0f0'] });
    // A crude humanoid: head rows 1-4, torso 5-10, legs 11-14.
    applyDrawOps(a, 0, [
      { op: 'rect', x: 6, y: 1, w: 4, h: 4, color: 2, fill: true },
      { op: 'rect', x: 5, y: 5, w: 6, h: 6, color: 3, fill: true },
      { op: 'rect', x: 3, y: 5, w: 2, h: 5, color: 1, fill: true },
      { op: 'rect', x: 11, y: 5, w: 2, h: 5, color: 1, fill: true },
      { op: 'rect', x: 5, y: 11, w: 2, h: 4, color: 1, fill: true },
      { op: 'rect', x: 9, y: 11, w: 2, h: 4, color: 1, fill: true },
    ]);
    const walk = animateAsset(a, { base: 0, anim: 'walk_down' });
    expect(walk.length).toBeGreaterThanOrEqual(4);
    const idle = animateAsset(a, { base: 0, anim: 'idle', anatomy: { neckRow: 4, waistRow: 10 } });
    expect(idle).toHaveLength(4);
    expect(a.animations.map(x => x.name)).toEqual(['walk_down', 'idle']);
    expect(a.animations[0].loop).toBe(true);
    const painted = (i: number) => composite(a, i).flat().filter(v => v).length;
    // Frames keep roughly the same amount of body: nothing vanished.
    for (const i of [...walk, ...idle]) expect(painted(i)).toBeGreaterThan(painted(0) * 0.6);
    expect(() => animateAsset(a, { base: 0, anim: 'fly' })).toThrow(/unknown animation/);
  });
});

describe('ai', () => {
  it('pixelizes a lime-green-backed image into a small asset and fits it to a palette', async () => {
    // 64x64: green background, a red square in the middle with a blue dot.
    const w = 64, img = { width: w, height: w, data: new Uint8Array(w * w * 4) };
    for (let i = 0; i < w * w; i++) img.data.set([0, 255, 0, 255], i * 4);
    for (let y = 16; y < 48; y++) for (let x = 16; x < 48; x++) img.data.set([200, 30, 30, 255], (y * w + x) * 4);
    for (let y = 28; y < 36; y++) for (let x = 28; x < 36; x++) img.data.set([30, 30, 200, 255], (y * w + x) * 4);
    const crop = cropToContent(img);
    expect(crop.box.w).toBeGreaterThanOrEqual(32);
    expect(crop.box.w).toBeLessThan(40);
    const a = pixelize(img, { id: 'p', size: 16, maxColors: 4, crop: false });
    const f = composite(a, 0);
    expect(f[0][0]).toBe(0);
    expect(f[8][8]).not.toBe(0);
    expect(f[5][5]).not.toBe(0);
    expect(f[5][5]).not.toBe(f[8][8]);
    // Cropped: the square fills the grid (only the margin stays empty).
    const c = composite(pixelize(img, { id: 'c', size: 16, maxColors: 4 }), 0);
    expect(c[3][3]).not.toBe(0);
    expect(c[12][12]).not.toBe(0);
    expect(c[8][8]).not.toBe(c[3][3]);
    const table = fitPalette(a, ['#ff0000', '#0000ff']);
    expect(table.every(t => ['#ff0000', '#0000ff'].includes(t.to))).toBe(true);
  });

  it('generate builds the technical prompt and downloads the first image, with an injected fetch', async () => {
    const calls: string[] = [];
    const fake = (async (url: string, init?: RequestInit) => {
      calls.push(url);
      if (url.startsWith('https://fal.run/')) {
        const body = JSON.parse(String(init?.body));
        expect(body.prompt).toContain('LIME GREEN');
        expect(body.prompt).toContain('a monk');
        expect(init?.headers).toMatchObject({ Authorization: 'Key k' });
        expect(body.output_format).toBe('png');
        return new Response(JSON.stringify({ images: [{ url: 'https://img.test/1.png' }] }), { status: 200 });
      }
      return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]), { status: 200 });
    }) as unknown as typeof fetch;
    const out = await generateImage({ prompt: 'a monk' }, 'k', fake);
    expect(out.model).toBe('fal-ai/flux/schnell');
    expect(out.bytes.length).toBe(7);
    expect(calls).toEqual(['https://fal.run/fal-ai/flux/schnell', 'https://img.test/1.png']);
  });

  it('loadFalKey reads the env file without printing it', () => {
    const envFile = join(dir, '.env');
    writeFileSync(envFile, 'GEMINI_API_KEY=\nFAL_AI_KEY=abc:def\n');
    const prev = process.env.FAL_AI_KEY;
    delete process.env.FAL_AI_KEY;
    expect(loadFalKey(envFile)).toBe('abc:def');
    expect(() => loadFalKey(join(dir, 'nope'))).toThrow(/FAL_AI_KEY/);
    if (prev !== undefined) process.env.FAL_AI_KEY = prev;
  });
});

describe('render', () => {
  it('hex helpers cover short, long and alpha forms', () => {
    expect(hexToRgba('#f00')).toEqual([255, 0, 0, 255]);
    expect(hexToRgba('#00ff0080')).toEqual([0, 255, 0, 128]);
    expect(rgbaToHex([0, 255, 0, 128])).toBe('#00ff0080');
    expect(rgbaToHex([1, 2, 3, 255])).toBe('#010203');
  });

  it('scales frames by integer factors', () => {
    const a = createAsset({ id: 'x', width: 2, palette: ['#ffffff'] });
    a.layers![0].frames[0][0][0] = 1;
    const img = renderFrame(a, a.layers![0].frames[0], 3);
    expect(img.width).toBe(6);
    expect(getPixel(img, 2, 2)).toEqual([255, 255, 255, 255]);
    expect(getPixel(img, 3, 0)).toEqual([0, 0, 0, 0]);
  });
});

describe('palettes', () => {
  it('fits colors to the nearest of a target palette, honoring forced maps and alpha', () => {
    const a = createAsset({ id: 'x', width: 2, palette: ['#ff0000', '#00ff0080', '#123456'] });
    const table = fitPalette(a, ['#ee0000', '#00cc00', '#ffffff'], { '#123456': '#ffffff' });
    expect(a.palette).toEqual({ 1: '#ee0000', 2: '#00cc0080', 3: '#ffffff' });
    expect(table.find(t => t.index === 3)!.forced).toBe(true);
    expect(table.find(t => t.index === 1)!.distance).toBeGreaterThan(0);
  });

  it('palette map recolors by value and palette_show renders swatches', async () => {
    const path = join(dir, 'p.pss.json');
    await runCommand('new', { path, width: 2, palette: ['#ff0000', '#ff0000', '#00ff00'] });
    await runCommand('palette', { path, map: { '#ff0000': '#0000ff' } });
    expect(loadAsset(path).palette).toEqual({ 1: '#0000ff', 2: '#0000ff', 3: '#00ff00' });
    const shown = await runCommand('palette_show', { path, cell: 8 });
    expect(shown.png!.length).toBeGreaterThan(50);
    const target = join(dir, 't.pss.json');
    await runCommand('new', { path: target, width: 1, palette: ['#000080', '#008000'] });
    const fit = (await runCommand('palette_fit', { path, target })).data as { moved: number; asset: { palette: Record<number, string> } };
    expect(fit.moved).toBe(3);
    expect(fit.asset.palette).toEqual({ 1: '#000080', 2: '#000080', 3: '#008000' });
  });
});

describe('commands', () => {
  it('every command has a unique name and a description', () => {
    const names = commands.map(c => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const c of commands) expect(c.description.length).toBeGreaterThan(10);
  });

  it('validates arguments and names the field', async () => {
    await expect(runCommand('new', { path: join(dir, 'x.pss.json') })).rejects.toThrow(/width/);
    await expect(runCommand('nope', {})).rejects.toThrow(/unknown command/);
  });

  it('chains new → fx_anim → export_sheet → import_sheet from the registry', async () => {
    const path = join(dir, 'golpe.pss.json');
    await runCommand('new', { path, width: 16, palette: ['#ffd27a', '#ff8a3d', '#a83a29'] });
    await runCommand('fx_anim', { path, name: 'technique', shape: 'burst', frames: 4, color: 2, light: 1, dark: 3 });
    const out = join(dir, 'golpe.png');
    const exported = (await runCommand('export_sheet', { path, out })).data as { frames: number; tags: string[] };
    expect(exported.frames).toBe(4);
    expect(exported.tags).toEqual(['technique 0-3']);
    expect(existsSync(join(dir, 'golpe.json'))).toBe(true);
    const meta = JSON.parse(readFileSync(join(dir, 'golpe.json'), 'utf8'));
    expect(meta.meta.image).toBe('golpe.png');
    expect(readPng(out).width).toBe(64);
    const back = (await runCommand('import_sheet', { png: out, out: join(dir, 'back.pss.json'), frame_width: 16, frame_height: 16 })).data as { grid: { columns: number } };
    expect(back.grid.columns).toBe(4);
    const render = await runCommand('render', { path, scale: 2 });
    expect(render.png!.length).toBeGreaterThan(100);
  });

  it('the real binary starts under tsx (catches "@/" alias imports that only vitest resolves)', () => {
    const out = execFileSync(join(process.cwd(), 'bin/pss'), ['help'], { encoding: 'utf8' });
    expect(out).toContain('animate');
  });

  it('the CLI parses key=value and JSON forms', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const path = join(dir, 'c.pss.json');
    expect(await cliMain(['new', `path=${path}`, 'width=4', 'palette=["#fff"]'])).toBe(0);
    expect(await cliMain(['draw', JSON.stringify({ path, frame: 0, ops: [{ op: 'pixel', x: 1, y: 1, color: 1 }] })])).toBe(0);
    expect(loadAsset(path).layers![0].frames[0][1][1]).toBe(1);
    expect(await cliMain(['draw', `path=${path}`])).toBe(1);
  });
});
