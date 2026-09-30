// The command registry: one place that defines what the headless tools can do.
// The CLI (cli.ts) and the MCP server (mcp.ts) are thin adapters over this.
//
// Every command takes a plain object validated by a zod schema and returns a
// JSON-serializable result. Commands that touch an asset on disk take `path`
// (the asset JSON, by convention *.pss.json) and save it back when they change it.

import { dirname, resolve, basename } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import type { SpriteAsset } from '../lib/types';
import {
  addFrame, colorIndex, composite, createAsset, dims, duplicateFrame, findAnimation, frameCount,
  getFrame, loadAsset, normalizeHex, removeAnimation, removeFrame, saveAsset, setAnimation, setFrame, summarize,
} from './asset';
import { encodePng, writePng } from './png';
import { fitPalette } from './ops';
import { asciiLegend, contactSheet, paletteSheet, renderAscii, renderFrame } from './render';
import { exportSheet, importSheet } from './sheet';
import { importCharacter } from './character';
import { ANIMATION_KINDS, animateAsset } from './animate';
import { generateImage, loadFalKey, pixelize } from './ai';
import { readPng } from './png';
import {
  applyDrawOps, applyFx, flipH, flipV, generateFxAnimation, replaceIndex, shift, type DrawOp,
} from './ops';

export interface CommandResult {
  /** JSON payload. */
  data: unknown;
  /** Optional PNG to show (MCP returns it as an image). */
  png?: Buffer;
  /** Optional plain text to show instead of JSON (ascii renders). */
  text?: string;
}

export interface Command<S extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>> {
  name: string;
  description: string;
  schema: S;
  run: (args: z.infer<S>) => CommandResult | Promise<CommandResult>;
}

/** Keeps `args` typed from the schema inside each definition, erased in the list. */
function define<S extends z.ZodObject<z.ZodRawShape>>(cmd: Command<S>): Command {
  return cmd as unknown as Command;
}

const color = z.union([z.string(), z.number().int()]).describe('hex color ("#rrggbb", added to the palette if new) or palette index');
const category = z.enum(['character', 'terrain', 'prop', 'nature', 'ui']);
const pathArg = z.string().describe('asset JSON path (*.pss.json)');

function withAsset(path: string, fn: (asset: SpriteAsset) => unknown): CommandResult {
  const asset = loadAsset(path);
  const extra = fn(asset);
  saveAsset(path, asset);
  const data = summarize(asset);
  return { data: extra === undefined ? data : { ...(typeof extra === 'object' && extra ? extra : { result: extra }), asset: data } };
}

const drawOpSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('pixel'), x: z.number().int(), y: z.number().int(), color }),
  z.object({ op: z.literal('pixels'), points: z.array(z.tuple([z.number().int(), z.number().int()])), color }),
  z.object({ op: z.literal('line'), x0: z.number().int(), y0: z.number().int(), x1: z.number().int(), y1: z.number().int(), color }),
  z.object({ op: z.literal('rect'), x: z.number().int(), y: z.number().int(), w: z.number().int(), h: z.number().int(), color, fill: z.boolean().optional() }),
  z.object({ op: z.literal('circle'), x: z.number().int(), y: z.number().int(), radius: z.number(), color, fill: z.boolean().optional() }),
  z.object({ op: z.literal('fill'), x: z.number().int(), y: z.number().int(), color }),
  z.object({ op: z.literal('replace'), from: color, to: color }),
  z.object({ op: z.literal('clear') }),
]);

const fxShape = z.enum(['burst', 'beam', 'sparks', 'pulse', 'circle', 'glow', 'bolt']);

export const commands: Command[] = [
  define({
    name: 'new',
    description: 'Create an empty asset JSON with a canvas size and an optional palette.',
    schema: z.object({
      path: pathArg,
      id: z.string().optional().describe('defaults to the file name without .pss.json'),
      name: z.string().optional(),
      width: z.number().int().positive(),
      height: z.number().int().positive().optional().describe('defaults to width'),
      category: category.optional(),
      palette: z.array(z.string()).optional().describe('hex colors for indices 1..n'),
      frames: z.number().int().positive().optional().describe('blank frames to start with (default 1)'),
      description: z.string().optional(),
    }),
    run: (a) => {
      const id = a.id ?? basename(a.path).replace(/\.pss\.json$|\.json$/i, '');
      const asset = createAsset({ ...a, id });
      saveAsset(a.path, asset);
      return { data: summarize(asset) };
    },
  }),
  define({
    name: 'info',
    description: 'Summary of an asset: size, frames, palette, animations.',
    schema: z.object({ path: pathArg }),
    run: (a) => ({ data: summarize(loadAsset(a.path)) }),
  }),
  define({
    name: 'ascii',
    description: 'A frame as text ("." transparent, one glyph per palette index) with a legend. The cheapest way to look at pixels.',
    schema: z.object({
      path: pathArg,
      frame: z.number().int().nonnegative().optional().describe('default 0'),
      animation: z.string().optional().describe('render every frame of this animation instead'),
    }),
    run: (a) => {
      const asset = loadAsset(a.path);
      const legend = asciiLegend(asset);
      let text: string;
      if (a.animation) {
        const anim = findAnimation(asset, a.animation);
        if (!anim) throw new Error(`no animation "${a.animation}"`);
        text = anim.frameIndices
          .map((f, i) => `frame ${f} (${a.animation} #${i})\n${renderAscii(composite(asset, f))}`)
          .join('\n\n');
      } else {
        const f = a.frame ?? 0;
        text = `frame ${f}\n${renderAscii(composite(asset, f))}`;
      }
      return { data: { legend }, text: `${text}\n\n${legend}` };
    },
  }),
  define({
    name: 'render',
    description: 'Render to PNG at a scale: one frame, one animation, or a contact sheet with every animation (default). Returns the image.',
    schema: z.object({
      path: pathArg,
      out: z.string().optional().describe('PNG path; when omitted the image is only returned'),
      scale: z.number().int().positive().optional().describe('default 4'),
      frame: z.number().int().nonnegative().optional(),
      animation: z.string().optional(),
    }),
    run: (a) => {
      const asset = loadAsset(a.path);
      const scale = a.scale ?? 4;
      let png: Buffer;
      if (a.frame !== undefined) {
        png = encodePng(renderFrame(asset, composite(asset, a.frame), scale));
      } else if (a.animation) {
        const anim = findAnimation(asset, a.animation);
        if (!anim) throw new Error(`no animation "${a.animation}"`);
        const only: SpriteAsset = { ...asset, animations: [anim] };
        png = encodePng(contactSheet(only, { scale }));
      } else {
        png = encodePng(contactSheet(asset, { scale }));
      }
      if (a.out) {
        mkdirSync(dirname(a.out), { recursive: true });
        writeFileSync(a.out, png);
      }
      return { data: { out: a.out ?? null, scale, bytes: png.length }, png };
    },
  }),
  define({
    name: 'import_sheet',
    description: 'Cut a PNG sprite sheet on a grid into an asset, keeping every color exactly. Tags map grid frames to animations ("row:N", "col:N" or a list, row-major). With "into", the frames are appended to that existing asset (same frame size; palette merged by hex).',
    schema: z.object({
      png: z.string(),
      out: pathArg,
      into: pathArg.optional().describe('existing asset to append into; defaults to a new asset at out'),
      frame_width: z.number().int().positive(),
      frame_height: z.number().int().positive(),
      margin: z.number().int().nonnegative().optional(),
      spacing: z.number().int().nonnegative().optional(),
      alpha_threshold: z.number().int().min(1).max(255).optional(),
      id: z.string().optional(),
      name: z.string().optional(),
      category: category.optional(),
      skip_empty: z.boolean().optional(),
      tags: z.array(z.object({
        name: z.string(),
        frames: z.union([z.array(z.number().int().nonnegative()), z.string()]),
        fps: z.number().positive().optional(),
        durations: z.array(z.number().positive()).optional(),
        loop: z.boolean().optional(),
      })).optional(),
    }),
    run: (a) => {
      const { asset, columns, rows } = importSheet({
        png: a.png,
        into: a.into ? loadAsset(a.into) : undefined,
        frameWidth: a.frame_width,
        frameHeight: a.frame_height,
        margin: a.margin,
        spacing: a.spacing,
        alphaThreshold: a.alpha_threshold,
        id: a.id ?? basename(a.out).replace(/\.pss\.json$|\.json$/i, ''),
        name: a.name,
        category: a.category,
        skipEmpty: a.skip_empty,
        tags: a.tags,
      });
      saveAsset(a.out, asset);
      return { data: { grid: { columns, rows }, asset: summarize(asset) } };
    },
  }),
  define({
    name: 'import_character',
    description: 'Import a whole character from a pack folder in one go, with the standard tags (idle/walk/attack/hurt per direction: down, up, left, right; plus technique and die). Layout "ninja_separate": Idle/Walk/Attack/Special1/Dead PNGs. "ninja_sheet": one SpriteSheet.png, 4 columns × N step rows.',
    schema: z.object({
      dir: z.string().describe('folder with the PNGs'),
      out: pathArg,
      layout: z.enum(['ninja_separate', 'ninja_sheet']),
      id: z.string().optional(),
      name: z.string().optional(),
      frame_size: z.number().int().positive().optional().describe('default 16'),
      walk_fps: z.number().positive().optional(),
      attack_ms: z.number().positive().optional(),
      hurt_ms: z.number().positive().optional(),
      technique_ms: z.number().positive().optional(),
      die_ms: z.number().positive().optional(),
    }),
    run: (a) => {
      const id = a.id ?? basename(a.out).replace(/\.pss\.json$|\.json$/i, '');
      const { asset, sheets } = importCharacter({
        dir: a.dir, layout: a.layout, id, name: a.name, frameSize: a.frame_size,
        walkFps: a.walk_fps, attackMs: a.attack_ms, hurtMs: a.hurt_ms, techniqueMs: a.technique_ms, dieMs: a.die_ms,
      });
      saveAsset(a.out, asset);
      return { data: { sheets, asset: summarize(asset) } };
    },
  }),
  define({
    name: 'animate',
    description: `Generate an animation from one base pose with the anatomy engine (${ANIMATION_KINDS.join(', ')}), optionally with a direction suffix ("walk_down", "attack_left": left is generated as right and flipped). Appends the frames and tags them. Use "anatomy" (or the asset's) to fix where neck, waist, knees and ankles are when the automatic guess is off.`,
    schema: z.object({
      path: pathArg,
      base: z.number().int().nonnegative().describe('frame index of the base pose'),
      anim: z.string(),
      name: z.string().optional().describe('tag name (default: anim)'),
      fps: z.number().positive().optional(),
      loop: z.boolean().optional(),
      glow: color.optional().describe('glow color for cast'),
      anatomy: z.object({
        neckRow: z.number().int().optional(), waistRow: z.number().int().optional(),
        kneeRow: z.number().int().optional(), ankleRow: z.number().int().optional(),
      }).optional(),
    }),
    run: (a) => withAsset(a.path, asset => ({ frames: animateAsset(asset, a) })),
  }),
  define({
    name: 'anatomy',
    description: 'Store body rows on the asset (neck, waist, knee, ankle, in pixels from the top) so every "animate" call uses them.',
    schema: z.object({
      path: pathArg,
      neckRow: z.number().int().optional(), waistRow: z.number().int().optional(),
      kneeRow: z.number().int().optional(), ankleRow: z.number().int().optional(),
      clear: z.boolean().optional(),
    }),
    run: (a) => withAsset(a.path, asset => {
      if (a.clear) { delete asset.anatomy; return { anatomy: null }; }
      asset.anatomy = { ...(asset.anatomy ?? {}), mode: 'humanoid' };
      for (const k of ['neckRow', 'waistRow', 'kneeRow', 'ankleRow'] as const) if (a[k] !== undefined) asset.anatomy[k] = a[k];
      return { anatomy: asset.anatomy };
    }),
  }),
  define({
    name: 'pixelize',
    description: 'Turn any PNG (an AI render, a photo of a drawing) into a one-frame pixel-art asset: samples it on a square grid, removes a flat background (lime green or the dominant corner color) and quantizes the colors. "fit" maps the result onto another asset\'s palette afterwards.',
    schema: z.object({
      png: z.string(),
      out: pathArg,
      size: z.number().int().min(4).max(256).describe('output grid, e.g. 32'),
      id: z.string().optional(),
      name: z.string().optional(),
      max_colors: z.number().int().min(2).max(64).optional().describe('default 16'),
      alpha_threshold: z.number().int().min(0).max(255).optional(),
      remove_background: z.boolean().optional().describe('default true'),
      fit: pathArg.optional().describe('asset whose palette to fit the result to'),
      category: category.optional(),
    }),
    run: (a) => {
      const id = a.id ?? basename(a.out).replace(/\.pss\.json$|\.json$/i, '');
      const asset = pixelize(readPng(a.png), {
        id, name: a.name, size: a.size, maxColors: a.max_colors, alphaThreshold: a.alpha_threshold,
        removeBackground: a.remove_background, category: a.category,
      });
      let table: unknown = null;
      if (a.fit) table = fitPalette(asset, Object.values(loadAsset(a.fit).palette));
      saveAsset(a.out, asset);
      return { data: { fit: table, asset: summarize(asset) }, png: encodePng(renderFrame(asset, composite(asset, 0), 4)) };
    },
  }),
  define({
    name: 'generate',
    description: 'Ask fal.ai for an image from a prompt (the same pixel-art wrapper prompt the editor uses; "raw" sends the prompt untouched) and save it as PNG. Needs FAL_AI_KEY in the environment or in supabase/functions/.env. Chain with pixelize to get an asset.',
    schema: z.object({
      prompt: z.string().min(3),
      out: z.string().describe('PNG path'),
      image_url: z.string().url().optional().describe('reference image for image-to-image'),
      palette: z.array(z.string()).optional(),
      perspective: z.string().optional().describe('e.g. "top-down"'),
      raw: z.boolean().optional(),
    }),
    run: async (a) => {
      const key = loadFalKey();
      const img = await generateImage({ prompt: a.prompt, imageUrl: a.image_url, palette: a.palette, perspective: a.perspective, raw: a.raw }, key);
      mkdirSync(dirname(a.out), { recursive: true });
      writeFileSync(a.out, img.bytes);
      return { data: { out: resolve(a.out), model: img.model, prompt: img.prompt, bytes: img.bytes.length } };
    },
  }),
  define({
    name: 'export_sheet',
    description: 'Write a 1:1 PNG sheet plus an Aseprite-style JSON (frames with rects and durations, frameTags with loop). Layout "rows" puts one animation per row.',
    schema: z.object({
      path: pathArg,
      out: z.string().describe('PNG path'),
      meta: z.string().optional().describe('JSON path; default: same as out with .json'),
      scale: z.number().int().positive().optional(),
      spacing: z.number().int().nonnegative().optional(),
      layout: z.enum(['rows', 'strip']).optional(),
    }),
    run: (a) => {
      const asset = loadAsset(a.path);
      const metaPath = a.meta ?? a.out.replace(/\.png$/i, '') + '.json';
      const { image, meta } = exportSheet(asset, {
        imageName: basename(a.out), scale: a.scale, spacing: a.spacing, layout: a.layout,
      });
      writePng(a.out, image);
      mkdirSync(dirname(metaPath), { recursive: true });
      writeFileSync(metaPath, JSON.stringify(meta, null, 1) + '\n');
      return {
        data: {
          png: resolve(a.out), meta: resolve(metaPath),
          size: meta.meta.size, frames: meta.frames.length,
          tags: meta.meta.frameTags.map(t => `${t.name} ${t.from}-${t.to}${t.loop ? ' loop' : ''}`),
        },
      };
    },
  }),
  define({
    name: 'draw',
    description: 'Apply drawing ops (pixel, pixels, line, rect, circle, fill, replace, clear) to one frame. x = column, y = row, origin top-left.',
    schema: z.object({
      path: pathArg,
      frame: z.number().int().nonnegative(),
      layer: z.number().int().nonnegative().optional(),
      ops: z.array(drawOpSchema).min(1),
    }),
    run: (a) => withAsset(a.path, asset => {
      applyDrawOps(asset, a.frame, a.ops as DrawOp[], a.layer ?? 0);
      return { ascii: renderAscii(composite(asset, a.frame)) };
    }),
  }),
  define({
    name: 'fx',
    description: 'Stamp a procedural effect (burst, beam, sparks, pulse, circle, glow) on one frame.',
    schema: z.object({
      path: pathArg,
      frame: z.number().int().nonnegative(),
      shape: fxShape,
      x: z.number().int().optional(),
      y: z.number().int().optional(),
      intensity: z.number().min(0).max(1),
      color,
      light: color.optional(),
      dark: color.optional(),
      radius: z.number().positive().optional(),
      seed: z.number().int().optional(),
      x2: z.number().int().optional().describe('bolt end column'),
      y2: z.number().int().optional().describe('bolt end row'),
    }),
    run: (a) => withAsset(a.path, asset => {
      const frame = applyFx(asset, getFrame(asset, a.frame), a);
      setFrame(asset, a.frame, frame);
      return { ascii: renderAscii(composite(asset, a.frame)) };
    }),
  }),
  define({
    name: 'fx_anim',
    description: 'Generate a whole effect animation: N new frames with the shape at a moving intensity (grow, fade, grow_fade, flat), tagged by name.',
    schema: z.object({
      path: pathArg,
      name: z.string(),
      shape: fxShape,
      frames: z.number().int().min(1).max(64),
      curve: z.enum(['grow', 'fade', 'grow_fade', 'flat']).optional(),
      peak: z.number().min(0).max(1).optional(),
      x: z.number().int().optional(),
      y: z.number().int().optional(),
      color,
      light: color.optional(),
      dark: color.optional(),
      radius: z.number().positive().optional(),
      seed: z.number().int().optional(),
      x2: z.number().int().optional(),
      y2: z.number().int().optional(),
      fps: z.number().positive().optional(),
      loop: z.boolean().optional(),
    }),
    run: (a) => withAsset(a.path, asset => ({ frames: generateFxAnimation(asset, a) })),
  }),
  define({
    name: 'palette',
    description: 'Set, add or rename palette colors. Indices start at 1; 0 is transparent.',
    schema: z.object({
      path: pathArg,
      set: z.record(z.string(), z.string()).optional().describe('{index: hex} to change existing colors'),
      add: z.array(z.string()).optional().describe('hex colors to append'),
      names: z.record(z.string(), z.string()).optional().describe('{index: name}'),
      map: z.record(z.string(), z.string()).optional().describe('{fromHex: toHex}: recolor by value, e.g. to apply the same table to a sprite and its portrait'),
    }),
    run: (a) => withAsset(a.path, asset => {
      for (const [from, to] of Object.entries(a.map ?? {})) {
        const f = normalizeHex(from);
        for (const [k, hex] of Object.entries(asset.palette)) {
          if (normalizeHex(hex) === f) asset.palette[Number(k)] = normalizeHex(to);
        }
      }
      for (const [k, hex] of Object.entries(a.set ?? {})) {
        const idx = Number(k);
        if (!asset.palette[idx]) throw new Error(`no color at index ${idx}`);
        asset.palette[idx] = normalizeHex(hex);
      }
      const added = (a.add ?? []).map(hex => colorIndex(asset, hex));
      for (const [k, name] of Object.entries(a.names ?? {})) asset.colorNames[Number(k)] = name;
      return { added };
    }),
  }),
  define({
    name: 'palette_fit',
    description: 'Map every color of the asset to the nearest color of a target palette (another asset\'s palette, or a list of hex). "map" forces specific colors (fromHex → toHex). Returns the table of what went where; pixels are untouched, only the palette changes.',
    schema: z.object({
      path: pathArg,
      target: pathArg.optional().describe('asset whose palette is the target'),
      colors: z.array(z.string()).optional().describe('target colors as hex, instead of target'),
      map: z.record(z.string(), z.string()).optional().describe('{fromHex: toHex} forced mappings'),
    }),
    run: (a) => withAsset(a.path, asset => {
      let colors = a.colors ?? [];
      if (a.target) colors = colors.concat(Object.values(loadAsset(a.target).palette));
      if (colors.length === 0) throw new Error('palette_fit needs target or colors');
      const table = fitPalette(asset, colors, a.map ?? {});
      return { table, moved: table.filter(t => t.from !== t.to).length };
    }),
  }),
  define({
    name: 'palette_show',
    description: 'Render the palette of an asset as swatches (one white dot per index along the top of each cell). Returns the image.',
    schema: z.object({
      path: pathArg,
      out: z.string().optional(),
      cell: z.number().int().positive().optional().describe('swatch size in px (default 24)'),
    }),
    run: (a) => {
      const asset = loadAsset(a.path);
      const png = encodePng(paletteSheet(asset.palette, a.cell ?? 24));
      if (a.out) { mkdirSync(dirname(a.out), { recursive: true }); writeFileSync(a.out, png); }
      return { data: { palette: asset.palette, names: asset.colorNames, out: a.out ?? null }, png };
    },
  }),
  define({
    name: 'remap',
    description: 'Replace one palette index by another in the pixels of some or all frames.',
    schema: z.object({
      path: pathArg,
      from: color,
      to: color,
      frames: z.array(z.number().int().nonnegative()).optional().describe('default: all'),
    }),
    run: (a) => withAsset(a.path, asset => {
      const from = colorIndex(asset, a.from), to = colorIndex(asset, a.to);
      const targets = a.frames ?? Array.from({ length: frameCount(asset) }, (_, i) => i);
      let n = 0;
      for (const layer of asset.layers!) {
        for (const i of targets) if (layer.frames[i]) n += replaceIndex(layer.frames[i], from, to);
      }
      return { replaced: n };
    }),
  }),
  define({
    name: 'frames',
    description: 'Add blank frames, duplicate one, or remove one (animations are re-indexed).',
    schema: z.object({
      path: pathArg,
      action: z.enum(['add', 'duplicate', 'remove']),
      index: z.number().int().nonnegative().optional().describe('for duplicate/remove'),
      count: z.number().int().positive().optional().describe('for add (default 1)'),
    }),
    run: (a) => withAsset(a.path, asset => {
      switch (a.action) {
        case 'add': {
          const added: number[] = [];
          for (let i = 0; i < (a.count ?? 1); i++) added.push(addFrame(asset));
          return { added };
        }
        case 'duplicate':
          if (a.index === undefined) throw new Error('duplicate needs index');
          return { added: [duplicateFrame(asset, a.index)] };
        case 'remove':
          if (a.index === undefined) throw new Error('remove needs index');
          removeFrame(asset, a.index);
          return { removed: a.index };
      }
    }),
  }),
  define({
    name: 'anim',
    description: 'Create or replace an animation (a named list of frame indices with fps or per-frame durations), or remove it.',
    schema: z.object({
      path: pathArg,
      name: z.string(),
      frames: z.array(z.number().int().nonnegative()).optional(),
      fps: z.number().positive().optional(),
      durations: z.array(z.number().positive()).optional().describe('ms per frame'),
      loop: z.boolean().optional(),
      label: z.string().optional(),
      remove: z.boolean().optional(),
    }),
    run: (a) => withAsset(a.path, asset => {
      if (a.remove) return { removed: removeAnimation(asset, a.name) };
      if (!a.frames) throw new Error('anim needs frames (or remove: true)');
      setAnimation(asset, { name: a.name, frameIndices: a.frames, fps: a.fps, durations: a.durations, loop: a.loop, label: a.label });
      return undefined;
    }),
  }),
  define({
    name: 'transform',
    description: 'flip_h, flip_v or shift (dx, dy) one frame or every frame.',
    schema: z.object({
      path: pathArg,
      op: z.enum(['flip_h', 'flip_v', 'shift']),
      frame: z.number().int().nonnegative().optional().describe('default: every frame'),
      dx: z.number().int().optional(),
      dy: z.number().int().optional(),
      layer: z.number().int().nonnegative().optional(),
    }),
    run: (a) => withAsset(a.path, asset => {
      const targets = a.frame !== undefined ? [a.frame] : Array.from({ length: frameCount(asset) }, (_, i) => i);
      for (const i of targets) {
        const f = getFrame(asset, i, a.layer ?? 0);
        const out = a.op === 'flip_h' ? flipH(f) : a.op === 'flip_v' ? flipV(f) : shift(f, a.dx ?? 0, a.dy ?? 0);
        setFrame(asset, i, out, a.layer ?? 0);
      }
      return { frames: targets };
    }),
  }),
  define({
    name: 'resize',
    description: 'Change the canvas size, anchoring the current pixels (default top-left). Frames larger than the new canvas are cropped.',
    schema: z.object({
      path: pathArg,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      anchor: z.enum(['top_left', 'center']).optional(),
    }),
    run: (a) => withAsset(a.path, asset => {
      const old = dims(asset);
      const ox = a.anchor === 'center' ? Math.floor((a.width - old.width) / 2) : 0;
      const oy = a.anchor === 'center' ? Math.floor((a.height - old.height) / 2) : 0;
      for (const layer of asset.layers!) {
        layer.frames = layer.frames.map(frame => {
          const out = Array.from({ length: a.height }, () => Array<number>(a.width).fill(0));
          for (let y = 0; y < old.height; y++) {
            for (let x = 0; x < old.width; x++) {
              const v = frame[y]?.[x] ?? 0;
              const nx = x + ox, ny = y + oy;
              if (v && nx >= 0 && ny >= 0 && nx < a.width && ny < a.height) out[ny][nx] = v;
            }
          }
          return out;
        });
      }
      asset.size = Math.max(a.width, a.height);
      if (a.width === a.height) { delete asset.width; delete asset.height; }
      else { asset.width = a.width; asset.height = a.height; }
      return { from: old, to: { width: a.width, height: a.height } };
    }),
  }),
];

export function findCommand(name: string): Command | undefined {
  return commands.find(c => c.name === name);
}

export async function runCommand(name: string, rawArgs: unknown): Promise<CommandResult> {
  const cmd = findCommand(name);
  if (!cmd) throw new Error(`unknown command "${name}". Known: ${commands.map(c => c.name).join(', ')}`);
  const parsed = cmd.schema.safeParse(rawArgs);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    throw new Error(`invalid arguments for ${name}: ${issues}`);
  }
  return await cmd.run(parsed.data);
}
