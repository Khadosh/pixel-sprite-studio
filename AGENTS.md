# AGENTS.md — Pixel Sprite Studio

> This file provides project context for AI coding assistants.
> It is tool-agnostic and designed to be read by any AI agent.

## Project Overview

Pixel Sprite Studio is a browser-based pixel art editor with AI-assisted sprite and animation generation. Users can create, animate, and export pixel art sprites (16×16 or 32×32) with a full layer system, multi-frame timeline, and persistent cloud storage.

Key capabilities:
- Pixel-by-pixel canvas editor (brush, eraser, fill, shapes, symmetry, onion skin, zoom & middle-click pan)
- Layer system with visibility, lock, and opacity
- Multi-frame animation timeline with drag-and-drop reordering
- AI generation via Google Gemini 2.5 Flash (sprites + animations)
- Props library (weapons, accessories injected as layers)
- PNG and GIF export
- Authentication and cloud persistence via Supabase

## Tech Stack

- **React 18** + **TypeScript** (non-strict — `strict: false` in tsconfig)
- **Vite 5** with SWC plugin (dev server on port **8080**)
- **Tailwind CSS 3** for styling (utility-first, no vanilla CSS)
- **shadcn/ui** component library (Radix primitives, located in `src/components/ui/`)
- **TanStack Query v5** for async state and server cache
- **React Router 6** for routing
- **Supabase** — Auth, Postgres DB (JSONB storage), Edge Functions
- **Google Gemini 2.5 Flash** — called from Supabase Edge Functions
- **dnd-kit** — drag-and-drop for timeline and layers
- **omggif** — GIF encoding for animation export
- **Vitest** for unit tests, **Playwright** for E2E tests
- Path aliases: `@/` maps to `src/`

## Key Files

| File | Purpose |
|:---|:---|
| `src/lib/types.ts` | Core types: `Frame`, `SpriteLayer`, `AnimationDef`, `SpriteAsset` |
| `src/lib/layerUtils.ts` | Layer compositing: `compositeFrame`, `upscale2x`, `ensureLayerSupport` |
| `src/lib/spriteAnimations.ts` | Client-side animation generation helpers |
| `src/lib/spriteTransforms.ts` | Pixel-level transforms: flip, rotate, draw shapes |
| `src/lib/assets/` | Pre-loaded asset catalog (`ASSET_CATALOG` export) |
| `src/components/SpriteEditor/` | Main editor modal — root component + context + sub-hooks + sub-components |
| `src/components/SpriteEditor/store/useSpriteEditorStore.ts` | Global editor state via Zustand |
| `src/components/SpriteEditor/context/SpriteEditorContext.tsx` | Store provider and selector hooks (Context wrapper) |
| `src/components/SpriteEditor/hooks/useSpriteEditor.ts` | Orchestrator hook — composes 7 specialized sub-hooks |
| `src/components/SpriteEditor/components/` | Editor UI: LayersList, PaletteSection, AnimationLibrary, Timeline |
| `src/components/SpritePixelEditor.tsx` | Canvas rendering + drawing input (pixel-by-pixel, 20× scale) |
| `src/components/SpritePreview.tsx` | Animated playback panel (6× scale) |
| `src/components/EditorToolbar.tsx` | Tool selector, brush size, undo, transform buttons |
| `src/hooks/usePixelEditor.ts` | Canvas drawing logic: brush, fill, shapes, symmetry, undo stack |
| `src/hooks/useAuth.tsx` | Supabase auth context (session, signOut, recovery mode) |
| `src/hooks/useProjectQueries.ts` | TanStack Query hooks for CRUD on projects and sprites |
| `src/hooks/useGenerateSprite.ts` | Calls `generate-sprite` Edge Function |
| `src/hooks/useGenerateAnimation.ts` | Calls `generate-animation` Edge Function |
| `src/pages/ProjectWorkspace.tsx` | Main editor page — loads project, renders SpriteEditor |
| `src/pages/Dashboard.tsx` | Project management (create, list, delete) |
| `src/pages/Catalog.tsx` | Public sprite catalog with category filtering |
| `src/pages/Landing.tsx` | Public landing page |
| `src/pages/Auth.tsx` | Login / signup (Supabase) |
| `src/integrations/supabase/types.ts` | Auto-generated DB schema types |
| `src/components/ui/` | shadcn/ui components — do NOT edit manually, use shadcn CLI |

## Roadmap Duality

El proyecto utiliza dos archivos de roadmap para separar la visión de la ejecución:
- **`ROADMAP.md`**: Roadmap Estratégico. Contiene la visión a largo plazo, hitos de alto nivel y el histórico de fases completadas. Consultar para entender el "norte" del proyecto.
- **`ROADMAP_IMMEDIATE.md`**: Roadmap Táctico. Contiene las tareas críticas, bugs inmediatos y prioridades del sprint actual. **Consultar siempre antes de empezar nuevas tareas** para asegurar alineación con las prioridades del usuario.

## Architecture & Patterns

### Sprite Data Format
- A **frame** is `number[][]` — a 2D grid (16×16 or 32×32). Each number is a palette index; `0` = transparent.
- A **layer** (`SpriteLayer`) holds its own `frames[]`, plus `isVisible`, `isLocked`, `opacity`.
- An **animation** (`AnimationDef`) stores `frameIndices[]` referencing positions in `layers[0].frames[]`, plus optional `fps`.
- A **sprite** (`SpriteAsset`) has `palette: Record<number, string>` (index → hex), `colorNames`, `layers[]`, and `animations[]`.

### Editor State
- `useSpriteEditorStore` (via `SpriteEditorStoreProvider`) holds the full mutable editor state.
- `useSpriteEditor` orchestrates 7 focused sub-hooks:
  - `useAnimationActions` — animation CRUD
  - `useFrameActions` — duplicate, insert, delete, reorder frames
  - `useLayerActions` — visibility, lock, opacity, reorder layers
  - `usePaletteActions` — add/edit/remove colors
  - `useTransformActions` — flip, rotate, mirror
  - `useExportActions` — PNG and GIF export
  - (undo stack lives in the orchestrator)

### Canvas Rendering
- Sprites are rendered pixel-by-pixel using `CanvasRenderingContext2D`.
- Editor canvas scales at 20×; preview at 6×.
- Layers are composited via `compositeFrame()` before rendering (respects visibility and opacity).
- Checkerboard background indicates transparent pixels.
- Onion skin renders adjacent frames at reduced opacity onto the same canvas.

### Backend
- **Supabase Postgres** stores projects and sprites. Sprite data is stored as JSONB in `asset_data`.
- **RLS policies** ensure users only access their own data.
- **Edge Functions** handle AI calls (Gemini 2.5 Flash) server-side to keep API keys off the client:
  - `generate-sprite` — returns `{ palette, colorNames, frame }` from a text prompt
  - `generate-animation` — returns `{ frames[] }` given a base frame and animation type

### Routing
```
/              → Landing (public)
/auth          → Login / signup
/dashboard     → Project list (protected)
/workspace/:id → Project editor (protected)
/catalog       → Public asset browser
/catalog/:id   → Asset detail
```

## Coding Conventions

- Use **TypeScript** for all new files (`.ts` / `.tsx`)
- Use **functional components** with hooks — no class components
- Use **Tailwind CSS utilities** for styling — avoid inline styles except for dynamic values (e.g., canvas pixel colors)
- Use **`@/` path alias** for imports from `src/`
- Extract canvas/drawing logic into `src/hooks/`, domain helpers into `src/lib/`
- Keep components focused — the sub-hook pattern in `SpriteEditor/hooks/` is the model to follow
- Colors live in `SpriteAsset.palette` as hex strings — never hardcode palette colors in components

## Commands

```bash
npm run dev          # Start dev server (http://localhost:8080)
npm run build        # Production build
npm run build:dev    # Development build (unminified)
npm run lint         # ESLint
npm test             # Run unit tests (vitest)
npm run test:watch   # Unit tests in watch mode
```

## Commit Conventions

One-liner commits in Spanish, grouping related files and functionality. Use the format:

```
type(scope): descripción corta en español
```

**Types:** `feat`, `fix`, `refactor`, `style`, `test`, `chore`, `docs`

**Examples:**
```
feat(sprite-editor): agregado soporte para exportar en formato PNG
fix(timeline): corregido orden incorrecto al duplicar frames
refactor(hooks): separado useSpriteEditor en sub-hooks especializados
style(ui): actualizado color scheme del editor a tema oscuro
test(palette): agregados tests unitarios para usePaletteActions
chore(deps): actualizado omggif y dnd-kit a últimas versiones
```

No usar descripciones largas, no listar archivos modificados, no usar bullet points en el mensaje. Un solo renglón siempre.

**Changelog:** Es mandatorio actualizar `CHANGELOG.md` con cada cambio significativo, incrementando el contador de commits del día y resumiendo las funcionalidades agregadas o corregidas.

## Do NOT

- Edit files in `src/components/ui/` manually — these are shadcn/ui generated components
- Use CSS-in-JS or styled-components — stick to Tailwind
- Change the `number[][]` frame format — all rendering, compositing, and export code depends on it
- Change the `SpriteLayer.frames[]` / `AnimationDef.frameIndices[]` relationship — animation playback depends on it
- Call Gemini or other AI APIs directly from the client — all AI calls must go through Supabase Edge Functions
- Use `var` — always `const` or `let`
- Add inline `style` tags or `<style>` blocks — use Tailwind classes
