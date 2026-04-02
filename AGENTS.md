# AGENTS.md — Pixel Sprite Studio

> This file provides project context for AI coding assistants.
> It is tool-agnostic and designed to be read by any AI agent.

## Project Overview

Pixel Sprite Studio is a browser-based pixel art sprite sheet viewer and exporter. It renders 16×16 pixel character animations on an HTML Canvas, provides a live animation preview, and supports PNG export with transparency.

This is a **single-page application** — there is no backend or API.

## Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite 5** (build tool and dev server)
- **Tailwind CSS 3** for styling (utility-first, no vanilla CSS)
- **shadcn/ui** component library (Radix primitives, located in `src/components/ui/`)
- **TanStack Query** for async state management
- **React Router 6** for routing
- **Vitest** for unit tests, **Playwright** for E2E tests
- Path aliases: `@/` maps to `src/`

## Key Files

| File | Purpose |
|:---|:---|
| `src/lib/pixelCharacter.ts` | Core sprite data: frame arrays, color palette, animation definitions |
| `src/components/SpriteSheetCanvas.tsx` | Renders the full sprite grid on a `<canvas>` element |
| `src/components/SpritePreview.tsx` | Animated preview panel with animation state selector |
| `src/pages/Index.tsx` | Main page: sprite grid, preview, export button, palette legend |
| `src/components/ui/` | shadcn/ui components — do NOT edit manually, use shadcn CLI |

## Architecture & Patterns

- **Canvas rendering**: Sprites are rendered pixel-by-pixel on HTML Canvas using `CanvasRenderingContext2D`, not DOM elements. Each pixel is scaled by `PIXEL_SCALE` (4x for the grid, 6x for the preview).
- **Sprite data format**: Each frame is a `number[][]` (16×16 grid). Each number maps to a color in the `PALETTE` constant. `0` = transparent.
- **Animation states**: Defined in the `ANIMATIONS` array — each entry has `name`, `label`, and `frames` (array of 4 frames).
- **Checkerboard pattern**: Used as background behind transparent pixels to visually indicate transparency.
- **Export**: Creates an offscreen canvas, draws all frames without labels, and triggers a download as PNG via `canvas.toDataURL()`.

## Coding Conventions

- Use **TypeScript** for all new files (`.ts` / `.tsx`)
- Use **functional components** with hooks — no class components
- Use **Tailwind CSS utilities** for styling — avoid inline styles except for dynamic values (e.g., `backgroundColor` from palette)
- Use **`@/` path alias** for imports from `src/`
- Keep components small and focused — extract logic into `src/lib/` or `src/hooks/`
- Palette colors are defined as hex strings in `PALETTE` — keep them centralized

## Commands

```bash
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # Production build
npm run lint        # ESLint
npm test            # Run unit tests (vitest)
npm run test:watch  # Unit tests in watch mode
```

## Do NOT

- Edit files in `src/components/ui/` manually — these are shadcn/ui generated components
- Use CSS-in-JS or styled-components — stick to Tailwind
- Add a backend or API calls — this is a purely client-side app
- Change the frame data format (16×16 `number[][]`) — downstream rendering depends on it
- Use `var` — always `const` or `let`
