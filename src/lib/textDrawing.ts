// Text drawings (the `from_ascii` / `to_ascii` format of src/headless/ascii.ts)
// in the web editor: open one as an editor asset and write it back.
//
// Opening keeps what the editor cannot hold in the asset (glyphs, "anim:"
// lines, "fit:", the real canvas size) in a session; saving uses it, so a
// drawing opened and saved untouched is the same text. What the text format
// cannot store (layers, hidden layers, layer opacity, pixels outside a
// non-square canvas...) is listed in `warnings` instead of being lost quietly.

import type { Frame, SpriteAsset, SpriteLayer } from './types';
import { fromAscii, toAscii, type AsciiLayout } from '@/headless/ascii';
import { normalizeHex } from '@/headless/assetModel';

export interface TextDrawingSession {
  /** File name the drawing came from (also names parse errors). */
  fileName: string;
  layout: AsciiLayout;
  /** The drawing's real canvas; the editor works on a size × size square. */
  width: number;
  height: number;
  /** Frames the text had: padding frames the editor adds past these are not written. */
  frameCount: number;
}

export interface OpenedTextDrawing {
  asset: SpriteAsset;
  session: TextDrawingSession;
}

/** Parses a text drawing into an editor asset (square canvas, palette with 0 = transparent). */
export function openTextDrawing(text: string, fileName: string): OpenedTextDrawing {
  const { asset, layout } = fromAscii(text, { sourcePath: fileName });
  const width = asset.width ?? asset.size;
  const height = asset.height ?? asset.size;
  const size = Math.max(width, height);
  const square = (f: Frame): Frame =>
    Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => f[r]?.[c] ?? 0));
  const layers = asset.layers!.map(l => ({ ...l, frames: l.frames.map(square) }));
  const frameCount = layers[0].frames.length;
  const editorAsset: SpriteAsset = {
    ...asset,
    size,
    palette: { 0: 'transparent', ...asset.palette },
    colorNames: { 0: 'Transparent', ...asset.colorNames },
    layers,
  };
  delete editorAsset.width;
  delete editorAsset.height;
  return { asset: editorAsset, session: { fileName, layout, width, height, frameCount } };
}

export interface SavedTextDrawing {
  text: string;
  /** What the text format could not keep, in Spanish, one line each. */
  warnings: string[];
}

/** `rgba(r,g,b,a)` / `rgb(...)` → `#rrggbb[aa]`; hex colors pass through normalized. */
export function toHexColor(color: string): string {
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color.trim());
  if (!m) return normalizeHex(color);
  const byte = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  const alpha = m[4] === undefined ? 1 : Number(m[4]);
  return normalizeHex(`#${byte(+m[1])}${byte(+m[2])}${byte(+m[3])}${alpha < 1 ? byte(alpha * 255) : ''}`);
}

function hasPixels(layer: SpriteLayer): boolean {
  return layer.frames.some(f => f.some(row => row.some(v => v)));
}

/** Writes the editor asset back as a text drawing, honoring the session it was opened with. */
export function saveTextDrawing(asset: SpriteAsset, session: TextDrawingSession): SavedTextDrawing {
  const warnings: string[] = [];
  const { width, height } = session;
  const all = asset.layers ?? [];
  const painted = all.filter(hasPixels);

  const hidden = painted.filter(l => !l.isVisible || l.opacity === 0);
  for (const l of hidden) warnings.push(`La capa «${l.name}» está oculta: no se guarda.`);
  const shown = all.filter(l => l.isVisible && l.opacity > 0);
  const shownPainted = shown.filter(hasPixels);
  if (shownPainted.length > 1) {
    warnings.push(`Las ${shownPainted.length} capas visibles se aplanan en una: el texto guarda una sola capa.`);
  }
  for (const l of shownPainted) {
    if (l.opacity < 1) warnings.push(`La capa «${l.name}» tiene opacidad ${Math.round(l.opacity * 100)}%: se guarda opaca (el texto sólo guarda alfa en los colores de la paleta).`);
  }

  // Frames: keep the text's frames, anything referenced or painted; drop the editor's empty padding.
  const total = all[0]?.frames.length ?? 0;
  let keep = session.frameCount;
  for (const a of asset.animations) for (const i of a.frameIndices) keep = Math.max(keep, i + 1);
  for (const l of all) l.frames.forEach((f, i) => { if (f.some(row => row.some(v => v))) keep = Math.max(keep, i + 1); });
  keep = Math.min(Math.max(keep, 1), total);

  let outside = 0;
  const frames: Frame[] = [];
  for (let i = 0; i < keep; i++) {
    const grid: Frame = Array.from({ length: height }, () => Array<number>(width).fill(0));
    for (const l of shown) {
      const src = l.frames[i];
      if (!src) continue;
      src.forEach((row, r) => row.forEach((v, c) => {
        if (!v) return;
        if (r < height && c < width) grid[r][c] = v;
        else outside++;
      }));
    }
    frames.push(grid);
  }
  if (outside > 0) {
    warnings.push(`${outside} píxeles pintados fuera del lienzo de ${width}x${height} no se guardan.`);
  }

  const palette: Record<number, string> = {};
  const colorNames: Record<number, string> = {};
  for (const [k, hex] of Object.entries(asset.palette)) {
    const i = Number(k);
    if (i === 0) continue;
    palette[i] = toHexColor(hex);
    if (asset.colorNames?.[i]) colorNames[i] = asset.colorNames[i];
  }

  const animations = asset.animations.map(a => {
    if (a.label !== undefined && /\s/.test(a.label) && a.label !== a.name.toUpperCase()) {
      warnings.push(`La etiqueta «${a.label}» de ${a.name} tiene espacios: el texto no la guarda.`);
      return { ...a, label: a.name.toUpperCase() };
    }
    return a;
  });

  if (session.layout.comments > 0) {
    warnings.push(`El archivo tenía ${session.layout.comments} línea(s) de comentario (#): no se vuelven a escribir.`);
  }
  if (asset.anatomy) warnings.push('La anatomía marcada no se guarda en el texto.');
  if (asset.tags?.length) warnings.push('Las etiquetas no se guardan en el texto.');

  const flat: SpriteAsset = {
    id: asset.id,
    name: asset.name,
    description: asset.description ?? '',
    category: asset.category,
    size: Math.max(width, height),
    palette,
    colorNames,
    layers: [{ id: 'layer-base', name: 'Base', isVisible: true, isLocked: false, opacity: 1, frames }],
    animations,
  };
  if (width !== height) { flat.width = width; flat.height = height; }

  const { text } = toAscii(flat, { layout: session.layout });
  return { text, warnings };
}
