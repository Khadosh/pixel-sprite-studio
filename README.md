# 🎮 Pixel Sprite Studio

Pixel Sprite Studio is a browser-based pixel art editor with AI-assisted sprite and animation generation. Create, animate, and export pixel art sprites (16×16 or 32×32) with a full layer system, multi-frame timeline, and persistent cloud storage.

## ✨ Features

- **AI Generation** — Create base characters and professional animation frames via Google Gemini 2.5 Flash.
- **Layer System** — Full layer management with visibility, lock, and opacity controls.
- **Advanced Selection** — Rectangular selection with move, free rotation, and nearest-neighbor resizing.
- **Procedural Animations** — Generate FX layers (Fire, Water, Electric) and base animations (Idle, Walk, Attack) procedurally.
- **Props Library** — Inject weapons and accessories as new layers from a pre-defined catalog.
- **Professional Export** — Export as transparent PNG (spritesheet) or animated GIF.
- **Interactive Preview** — Watch animations play in real time at multiple resolutions.
- **Onion Skinning** — Visual reference of adjacent frames for smooth animation.
- **Cloud Persistence** — Save and manage projects via Supabase.

## 🛠 Tech Stack

| Layer | Technology |
|:---|:---|
| **Framework** | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) + [TanStack Query v5](https://tanstack.com/query) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| **Backend** | [Supabase](https://supabase.com) (Auth, DB, Edge Functions) |
| **AI Engine** | [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) |
| **Drag & Drop** | [dnd-kit](https://dndkit.com) |
| **GIF Export** | [omggif](https://github.com/deanm/omggif) |
| **Testing** | [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **bun**

### Installation

```bash
git clone https://github.com/Khadosh/pixel-sprite-studio.git
cd pixel-sprite-studio
npm install
```

### Development

```bash
npm run dev
```

The app will start on port **8080**.

### Local stack (Docker + Supabase)

Everything runs locally: the frontend in a Docker container and the full Supabase stack (Postgres, Auth, Studio, Edge Functions) via the Supabase CLI, which manages its own containers.

**Prerequisites:** Docker Desktop and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
# 1. Backend: starts Postgres, Auth, Studio and Edge Functions, applies supabase/migrations/
supabase start

# 2. Frontend env: copy the API URL and anon key printed by `supabase status` into .env.local
cp .env.example .env.local

# 3. Edge Function secrets (Gemini / fal.ai keys, never committed)
cp supabase/functions/.env.example supabase/functions/.env

# 4. Frontend with hot reload
docker compose up --build
```

| Service | URL |
|:---|:---|
| App | http://localhost:8080 |
| Supabase API | http://127.0.0.1:54421 |
| Supabase Studio | http://127.0.0.1:54423 |
| Mail inbox (auth emails) | http://127.0.0.1:54424 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54422/postgres` |

Ports are offset by +100 from the Supabase defaults (see `supabase/config.toml`) so this project can coexist with other local Supabase projects.

**Secrets model**

- `.env` / `.env.local` hold only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Both ship to the browser and are public by design. Never put a `VITE_`-prefixed secret in these files: Vite exposes every `VITE_*` variable to the client bundle.
- `.env.local` overrides `.env`, so the convention is `.env` for the cloud project and `.env.local` for the local stack. Rename `.env.local` to switch back to the cloud.
- Edge Function secrets (`GEMINI_API_KEY`, `FAL_AI_KEY`) live in `supabase/functions/.env` locally and are loaded automatically by `supabase start`. In the cloud they are set with `supabase secrets set KEY=value`. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform.
- All `.env` files are git-ignored; only the `.env.example` templates are committed.

Stop everything with `docker compose down` and `supabase stop`.

## 📁 Project Structure

```
src/
├── components/
│   ├── SpriteEditor/       # Main editor root and logic
│   │   ├── components/     # Specialized UI (Layers, Timeline, Palette)
│   │   ├── store/          # Zustand store (Global Editor State)
│   │   └── hooks/          # Modular action hooks
│   ├── ui/                 # shadcn/ui shared components
│   └── ...                 # Other shared components (Toolbar, Preview)
├── hooks/
│   ├── use-pixel-editor.ts # Drawing logic (brush, fill, transforms)
│   └── use-project-queries.ts # CRUD logic via TanStack Query
├── lib/
│   ├── types.ts            # Core data contracts (SpriteAsset, Frame)
│   ├── layerUtils.ts       # Compositing and layer manipulation
│   └── spriteAnimations.ts # Procedural animation logic
├── pages/                  # Route level components
└── integrations/           # External service configurations (Supabase)
```

## 🎨 Sprite Data Format

Sprites are stored as a palette-based `number[][]` grid:

- **Frames**: 2D array where each number is a palette index (`0` is transparent).
- **Layers**: Multiple frames with visibility and opacity metadata.
- **Animations**: Sequences of frame indices defined per asset.

## 📄 License

MIT
