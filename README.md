# 🎮 Pixel Sprite Studio

A browser-based pixel art sprite sheet viewer and exporter. Visualize 16×16 pixel character animations on a grid, preview them in real time, and export clean transparent PNGs ready for game engines.

## ✨ Features

- **Sprite Sheet Grid** — All animation states displayed in a labeled grid with checkerboard transparency
- **Live Animation Preview** — Select any animation state and watch it play in real time
- **PNG Export** — One-click export of the full sprite sheet as a transparent PNG
- **Color Palette Legend** — Visual reference for all character colors (outline, skin, hair, shirt, pants, shoes, sword, eyes, hurt)
- **6 Animation States** — Idle, Walk, Attack, Hurt, Death, Jump (4 frames each)
- **Pixel-Perfect Rendering** — Canvas-based rendering with `image-rendering: pixelated`

## 🛠 Tech Stack

| Layer | Technology |
|:---|:---|
| Framework | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build Tool | [Vite 5](https://vite.dev) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| UI Components | [shadcn/ui](https://ui.shadcn.com) (Radix primitives) |
| State | [TanStack Query](https://tanstack.com/query) |
| Routing | [React Router 6](https://reactrouter.com) |
| Testing | [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) |
| Package Manager | npm / bun |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **bun**

### Installation

```bash
git clone git@github.com:Khadosh/pixel-sprite-studio.git
cd pixel-sprite-studio
npm install
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build
```

### Testing

```bash
# Unit tests (one-shot)
npm test

# Unit tests (watch mode)
npm run test:watch
```

## 📁 Project Structure

```
pixel-sprite-studio/
├── src/
│   ├── components/
│   │   ├── SpriteSheetCanvas.tsx   # Main sprite grid (canvas rendering)
│   │   ├── SpritePreview.tsx       # Animated preview panel
│   │   ├── NavLink.tsx             # Navigation component
│   │   └── ui/                     # shadcn/ui primitives
│   ├── hooks/
│   │   ├── use-mobile.tsx          # Responsive breakpoint hook
│   │   └── use-toast.ts            # Toast notifications hook
│   ├── lib/
│   │   ├── pixelCharacter.ts       # Sprite data: frames, palette, animations
│   │   └── utils.ts                # Tailwind merge utility
│   ├── pages/
│   │   ├── Index.tsx               # Main page: grid + preview + export
│   │   └── NotFound.tsx            # 404 page
│   ├── test/                       # Test setup and specs
│   ├── App.tsx                     # Router and providers
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── AGENTS.md                       # AI assistant instructions
├── index.html                      # HTML shell
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind configuration
├── vitest.config.ts                # Vitest configuration
└── playwright.config.ts            # Playwright configuration
```

## 📜 Available Scripts

| Script | Description |
|:---|:---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |

## 🎨 Sprite Data

Character sprites are defined as 16×16 number grids in `src/lib/pixelCharacter.ts`:

- Each cell maps to a color via the `PALETTE` constant
- **0** = transparent, **1** = outline, **2** = skin, **3** = hair, **4** = shirt, **5** = pants, **6** = shoes, **7** = sword, **8** = eyes, **9** = hurt-red
- Animations are arrays of 4 frames each

To add or modify sprites, edit the frame arrays in that file.

## 📄 License

MIT
