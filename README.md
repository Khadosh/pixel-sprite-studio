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
