# AGENTS.md — Pixel Sprite Studio

> This file provides project context for AI coding assistants. `CLAUDE.md` is a symlink to it.
> Last verified against the code: 2026-09-22. If you find a discrepancy, fix this file in the same change.

## Project Overview

Pixel Sprite Studio is a browser-based pixel art editor with AI-assisted sprite and animation generation. Users create, animate, and export pixel art sprites (16, 32, 64 or 128 px) with a layer system, multi-frame timeline, anatomy-driven procedural animations, and persistent cloud storage.

Key capabilities:
- Pixel-by-pixel canvas editor (brush, eraser, fill, shapes, selection with move/rotate/resize, symmetry, onion skin, zoom & pan)
- Layer system with visibility, lock, and opacity
- Multi-frame animation timeline with drag-and-drop reordering, per-animation FPS
- Anatomy engine: mark pixels per body part and generate procedural animations (idle, walk, run, jump) and FX
- AI generation through Supabase Edge Functions: sprites and perspectives via **fal.ai**, animation frames via **Gemini**
- Image and GIF import (with palette quantization), props library (weapons, accessories as layers)
- PNG sprite sheet, single-layer PNG, and GIF export
- Authentication and cloud persistence via Supabase, with compressed local snapshots

## Tech Stack

- **React 18** + **TypeScript** (non-strict — `strict: false` in tsconfig)
- **Vite 5** with SWC plugin (dev server on port **8080**)
- **Tailwind CSS 3** + **shadcn/ui** (Radix primitives in `src/components/ui/`, generated code)
- **Zustand** for editor state (store split into slices), **TanStack Query v5** for server state
- **React Router 6**
- **Supabase**: Auth, Postgres (JSONB storage, RLS), Edge Functions (Deno)
- **fal.ai** (`fal-ai/flux/schnell`, `fal-ai/bytedance/seedream/v4/edit`) and **Google Gemini** (`gemini-2.5-pro`), called only from Edge Functions
- **dnd-kit** (timeline and layers), **omggif** (GIF encoding), **file-saver**
- **Vitest** + Testing Library for unit tests (`src/test/setup.ts`), Deno test for Edge Function helpers
- Package manager: **npm** (`package-lock.json` is the only lockfile)
- Path alias: `@/` maps to `src/`

## Key Files

| File | Purpose |
|:---|:---|
| `src/lib/types.ts` | Core types: `Frame`, `SpriteLayer`, `AnimationDef`, `SpriteAsset` |
| `src/lib/supabase.ts` | **The only Supabase client** (typed with `Database`). Exports `Project`, `ProjectSprite`, `ProjectConfig`, `toJson`/`fromJson` |
| `src/integrations/supabase/types.ts` | DB schema types. Regenerate with `supabase gen types typescript --local` and re-apply the hand-written header |
| `src/lib/layerUtils.ts` | Layer compositing: `compositeFrame`, `upscale2x`, `ensureLayerSupport` |
| `src/lib/spriteDto.ts`, `src/lib/storageCompression.ts` | RLE + delta serialization of assets for DB and localStorage |
| `src/lib/sprite/` | Anatomy engine: `anatomy.ts`, `anatomyResolver.ts`, `anatomyTransforms.ts`, `generators/` (Fluent Builder for walk, run, jump, idle) |
| `src/lib/spriteAnimations.ts`, `src/lib/spriteTransforms.ts` | Procedural animation helpers and pixel transforms |
| `src/lib/aiFunctions.ts` | `invokeAiFunction`: the single way to call an Edge Function (requires a session) |
| `src/lib/authErrors.ts` | `isAuthError` used by the global query/mutation error handlers |
| `src/lib/assets/` | Pre-loaded catalog (`ASSET_CATALOG`), `PALETTE_LIBRARY`, `PROP_LIBRARY` |
| `src/pages/SpriteStudio.tsx` | **The editor page** (`/project/:projectSlug/editor/:spriteSlug`). Creates the store and renders `EditorLayout` |
| `src/pages/ProjectWorkspace.tsx` | Project page: sprite list, AI creator wizard, navigation to the editor |
| `src/pages/IconPreview.tsx` | Localhost-only tool that edits the app's pixel icons using `SpriteEditorModal` |
| `src/components/SpriteEditor/SpriteEditor.tsx` | Modal wrapper around `EditorLayout`. Only used by `IconPreview` |
| `src/components/SpriteEditor/store/useSpriteEditorStore.ts` | Store factory: composes the slices, persists a hashed snapshot to localStorage |
| `src/components/SpriteEditor/store/slices/` | `base`, `layer`, `frame`, `animation`, `palette`, `transform`, `export`, `history`, `anatomy` |
| `src/components/SpriteEditor/store/derived.ts` | Selectors: `selectActiveLayer`, `selectVisibleFramesIndices`, `selectFilteredPalette`, onion skin |
| `src/components/SpriteEditor/context/SpriteEditorContext.tsx` | Provider + `useSpriteEditorStore` / `useSpriteEditorStoreApi` / `useOptionalSpriteEditorStoreApi` |
| `src/components/SpriteEditor/hooks/` | Bridges between the store and AI hooks: `useAnimationGeneration`, `usePerspectiveGeneration`, `useEditorEffects` |
| `src/components/SpriteEditor/components/EditorLayout.tsx` | Editor shell: canvas, sidebar, timeline, preview |
| `src/components/SpriteEditor/components/EditorHeader.tsx` | **Single header** for both the Studio page and the modal (`variant`, `backTo`, `syncStatus` props) |
| `src/components/SpriteEditor/components/ExportMenu.tsx`, `ImportButton.tsx` | Shared export dropdown and import button. Add new export options here only |
| `src/components/SpriteEditor/components/` | Panels: LayersList, PaletteSection, AnimationLibrary, Timeline, AnatomyPanel, ProceduralAnimPanel, HistoryPanel, GifImportWizard, ImportImageModal |
| `src/components/SpritePixelEditor.tsx`, `src/hooks/usePixelEditor.ts` | Canvas rendering and drawing input |
| `src/hooks/useProjectQueries.ts` | TanStack Query hooks for projects and sprites (list select excludes `versions`) |
| `src/hooks/useAuth.tsx` | Supabase auth context |
| `src/hooks/useGenerateSpriteFal.ts`, `useGeneratePerspectiveAI.ts`, `useGenerateAnimation.ts` | AI hooks, one per Edge Function |
| `src/App.tsx` | Routes, `QueryClient` with global 401 handling |
| `supabase/functions/_shared/` | `auth` (`requireUser`), `usage` (`consumeQuota`), `validate`, `cors`, `http`, `llm` (`fetchWithTimeout`, JSON parsing) |
| `supabase/functions/generate-sprite-fal`, `generate-perspective-fal`, `generate-animation` | The three Edge Functions |
| `supabase/migrations/` | Schema. `increment_ai_usage` RPC enforces the daily AI quota atomically |
| `src/components/ui/` | shadcn/ui components — do NOT edit manually, use the shadcn CLI |

## Roadmap (3 archivos)

- **`ROADMAP_COMPLETED.md`**: historial de lo completado.
- **`ROADMAP_NEXT.md`**: visión a futuro y backlog estratégico.
- **`ROADMAP_IMMEDIATE.md`**: sprint actual. **Consultar siempre antes de empezar nuevas tareas.**
- **`AUDIT.md`** (producto, 2026-04) y **`AUDIT_TECNICA.md`** (código y seguridad, 2026-09): estado y plan de retoma.

## Architecture & Patterns

### Sprite Data Format
- A **frame** is `number[][]`, a square grid. Each number is a palette index; `0` = transparent.
- A **layer** (`SpriteLayer`) holds its own `frames[]`, plus `isVisible`, `isLocked`, `opacity`, optional `paletteIds`.
- Frames `[0]`, `[1]`, `[2]` of every layer are reserved for the Front, Side and Back canonical bases.
- An **animation** (`AnimationDef`) stores `frameIndices[]` referencing positions in `layers[0].frames[]`, plus optional `fps`.
- A **sprite** (`SpriteAsset`) has `palette: Record<number, string>`, `colorNames`, `layers[]`, `animations[]`, optional `anatomy` and `versions`.
- In the DB and in localStorage the asset is stored compressed (`spriteDto.ts`). `toJson`/`fromJson` in `src/lib/supabase.ts` are the only JSONB boundary.

### Editor State
- `createSpriteEditorStore()` builds one Zustand store per open sprite. `SpriteStudio` and `SpriteEditorModal` create it and provide it through `SpriteEditorStoreProvider`.
- State and actions live in `store/slices/*`. **New editor behavior goes in a slice**, exposed through `store/types.ts`, and consumed with `useSpriteEditorStore(selector)`.
- Cross-cutting derived data goes in `store/derived.ts`.
- The store persists a snapshot to localStorage keyed by sprite id (or `new-<projectId>`), tagged with a hash of the asset it came from. A snapshot whose hash does not match the freshly loaded asset is discarded.
- Undo/redo lives in `historySlice`; explicit checkpoints via `createCheckpoint`.

### Canvas Rendering
- Pixel-by-pixel with `CanvasRenderingContext2D`; layers composited via `compositeFrame()` (respects visibility and opacity).
- Checkerboard background for transparency; onion skin renders adjacent frames at reduced opacity.

### Backend
- **Postgres** tables `projects`, `project_sprites` (JSONB `asset_data`, max 2 MB, `UNIQUE (project_id, slug)`), `user_ai_usage`. `projects` has `UNIQUE (user_id, slug)`: clients must handle SQLSTATE `23505`. Both tables have `updated_at` maintained by trigger.
- **RLS** restricts every table to its owner. `user_ai_usage` is written only by the service role.
- **Edge Functions** (`verify_jwt = false` in `config.toml`; auth is enforced in code): every function calls `requireUser` before anything else, validates the body, then `consumeQuota` (RPC `increment_ai_usage`, 10 calls per user per day, atomic), then the model with a 90 s timeout. Errors return generic Spanish messages and log details server-side.
  - `generate-sprite-fal`: `{ prompt, size, palette?, image_url?, projectConfig? }` → `{ imageUrl, prompt, originalPrompt, size }`
  - `generate-perspective-fal`: `{ prompt, image_url, size, palette?, projectConfig? }` → `{ imageUrl, images }`
  - `generate-animation`: `{ baseFrame, animationName, size, palette, colorNames?, projectConfig? }` → `{ frames }`
- Secrets: `GEMINI_API_KEY`, `FAL_AI_KEY`, optional `ALLOWED_ORIGIN`. Locally in `supabase/functions/.env`; in the cloud via `supabase secrets set`. See README "Local stack".

### Routing
```
/                                        → Landing (public)
/auth                                    → Login / signup
/dashboard                               → Project list (protected)
/project/:projectSlug                    → Project workspace (protected)
/project/:projectSlug/editor/:spriteSlug → Sprite editor (protected)
/catalog, /asset/:assetSlug              → Public asset browser
/icon-preview                            → Icon tool (localhost only)
```

## Coding Conventions

- TypeScript for all new files; functional components with hooks
- Tailwind utilities for styling; inline styles only for dynamic values (canvas colors)
- `@/` alias for imports from `src/`
- Canvas/drawing logic in `src/hooks/`, domain helpers in `src/lib/`, editor state in `store/slices/`
- Header, export and import UI are shared components: never duplicate them per page
- Colors live in `SpriteAsset.palette`; never hardcode palette colors in components
- ESLint: `no-explicit-any`, `ban-ts-comment` and `no-unused-vars` are warnings. Do not add new ones; remove them when touching a file

## Commands

```bash
npm run dev          # Dev server (http://localhost:8080)
npm run build        # Production build
npm run lint         # ESLint (must pass with 0 errors; CI runs it)
npm test             # Unit tests (vitest)
npm run test:watch
supabase start       # Local backend (see README for ports and secrets)
deno test supabase/functions/_shared/   # Edge Function helper tests
```

CI (`.github/workflows/ci.yml`) runs lint, `tsc`, tests, build, and `deno check` of every function on every push and PR.

## Commit Conventions

One-liner commits in Spanish, grouping related files and functionality:

```
type(scope): descripción corta en español
```

**Types:** `feat`, `fix`, `refactor`, `style`, `test`, `chore`, `docs`

No usar descripciones largas, no listar archivos modificados, no usar bullet points en el mensaje. Un solo renglón siempre.

**Changelog:** Es mandatorio actualizar `CHANGELOG.md` con cada cambio significativo, incrementando el contador de commits del día y resumiendo las funcionalidades agregadas o corregidas.

## Do NOT

- Edit files in `src/components/ui/` manually — shadcn/ui generated components
- Use CSS-in-JS or styled-components — stick to Tailwind
- Change the `number[][]` frame format — rendering, compositing, compression and export depend on it
- Change the `SpriteLayer.frames[]` / `AnimationDef.frameIndices[]` relationship — playback depends on it
- Call fal.ai, Gemini or any AI API from the client — all AI calls go through Edge Functions via `invokeAiFunction`
- Create a second Supabase client — import `supabase` from `@/lib/supabase`
- Use `var` — always `const` or `let`
- Add inline `style` tags or `<style>` blocks — use Tailwind classes
- Put secrets in any `VITE_*` variable — Vite exposes them to the browser
- **NUNCA realizar commits o push de forma automática**. Siempre solicitar verificación del usuario y esperar a que pida explícitamente el commit.
