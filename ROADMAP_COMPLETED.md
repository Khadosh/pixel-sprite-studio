# Pixel Sprite Studio — Historial Completado ✅

> Archivo histórico de todas las fases y features implementadas.
> Para la visión a futuro, ver [ROADMAP_NEXT.md](./ROADMAP_NEXT.md)
> Para el sprint actual, ver [ROADMAP_IMMEDIATE.md](./ROADMAP_IMMEDIATE.md)

---

## Fase 0 — Limpieza: Remover V2 Image-Based ✅
*Completada 2026-04-05*

- [x] Remover campos V2 de `SpriteAsset`: `isImageBased`, `resolution`, `gridSize`, `elements`, `SpriteElement`
- [x] Simplificar `SpritePixelEditor`: eliminar branching `isImageBased`
- [x] Simplificar `SpritePreview`: eliminar code path de image elements
- [x] Simplificar `SpriteEditorModal`: eliminar panel "Elements (Layers)" V2
- [x] Refactorear `generate-sprite` Edge Function: Gemini 2.5 Pro, JSON directo
- [x] Limpiar `SpriteSheetCanvas` y `AssetCard` de referencias V2

---

## Fase 1 — IA: Separar Character vs Animaciones ✅
*Completada 2026-04-05*

### 1.1 — Generación del character base
- [x] Prompt engineering mejorado (composición, anatomía, técnica de color)
- [x] Validación del JSON devuelto (32x32)
- [x] Edge function con Gemini 2.5 Pro + `responseMimeType: "application/json"`
- [x] Subir a 32x32 para mejor detalle
- [x] Hacer transforms dinámicos (soporta cualquier tamaño de frame)
- [x] Preview rápido inline antes de abrir editor (Integrado con Regenerar in-editor)
- [x] Botón "Regenerar" sin perder el prompt

### 1.2 — Generación de animaciones separada
- [x] Generar una animación a la vez (Idle, Walk, Attack, etc.)
- [x] Opción batch (llamadas secuenciales a la API de IA)
- [x] AI-assisted: Gemini genera variaciones (3 frames nuevos + base)
- [x] Mantener transforms client-side como opción "QUICK MATCH" algorítmico

---

## Fase 2 — Editor Manual: Frame Operations ✅
*Completada 2026-04-05*

### 2.1 — Operaciones de frame
- [x] Context Menu (Click derecho en timeline)
- [x] Duplicate frame
- [x] Add empty frame (Insertar vacío)
- [x] Delete frame
- [x] Swap frames (Reordenar vía Drag & Drop)
- [x] Duplicar a partir de cualquier frame de la animación

### 2.2 — Timeline mejorada
- [x] Strip de frames con **dnd-kit** (Drag & Drop sorting)
- [x] Indicador visual de nombre de animación por frame (labels)
- [x] Refactor a Layout "Holy Grail" (Herramientas arriba, Palette izquierda, Canvas centro, Preview derecha)

### 2.3 — Onion Skinning
- [x] Toggle Onion Skin (Hotkeys: O)
- [x] Renderizado de frames anterior/siguiente con opacidad reducida

---

## Quick Wins — Herramientas de Edición ✅
*Completada 2026-04-05*

- [x] **Flood Fill** (Bucket tool)
- [x] **Eyedropper** (Picker tool)
- [x] **Shapes**: Line, Rectangle, Circle (con Draft Preview)
- [x] **Symmetry Mode**: MirrorX toggle (Hotkey: M)
- [x] **Keyboard Shortcuts**: B, E, I, G, M, Z, O, V/S, R
- [x] **Brush Sizes**: 1x1, 2x2, 4x4

---

## Fase 3 — Layer System ✅
*Completada 2026-04-05*

- [x] Tipo `SpriteLayer` con frames propios, visibilidad, lock, opacity
- [x] Layer panel: lista, toggle, reorder
- [x] Agregar/eliminar/duplicar capa
- [x] Dibujar solo en capa activa (Scope selector: Layer vs Frame)
- [x] Merge capas (Flatten)

---

## Fase 6 — Gestión Pro & Librería de Assets ✅
*Completada 2026-04-08*

### 6.1 — Refactor del Animation Library
- [x] Eliminar checkboxes confusos
- [x] Lista real de animaciones guardadas
- [x] Panel de generación dedicado
- [x] Eliminar/Renombrar animación individualmente

### 6.2 — Librería de Assets
- [x] Sistema de `Props` inyectables como capas
- [x] **Smart Importing**: Soporte para encajar 16px en 32px (centering)
- [x] Browser de assets con preview real-time (Integrado en Studio)

---

## Fase A — Paridad Competitiva ✅
*Completada 2026-04-24*

- [x] **Zoom del canvas** — Scroll para zoom, middle-click pan, hotkeys `+`/`-`, indicador de nivel
- [x] **Herramienta de selección avanzada** — Rect select, move, rotation (free drag), resizing (handles), copy/paste, delete region
- [x] **Undo/Redo global** — Stack deshacer para todas las operaciones del editor
- [x] **Merge de capas** — Flattenear capas seleccionadas
- [x] **Rate limiting en Edge Functions** — Límite diario por usuario para llamadas IA
- [x] **TypeScript strict mode** — `strict: true` habilitado y resuelto
- [x] **Nombres canónicos de animación** — idle, walk, walk_left/right/up/down, attack, hurt, die, jump, cast

---

## Fase 8.1 — Humanoides Multidireccionales y Motor de Desmembramiento ✅
*Completada 2026-04-24*

- [x] **Motor de Desmembramiento**: `AnatomyConfig` con soporte para miembros jerárquicos (`MemberConfig`)
- [x] **Orientaciones de Anatomía**: Configuraciones anatómicas únicas por vista (Front, Side, Back)
- [x] **Selector Libre de Píxeles**: Herramienta interactiva para delimitar áreas de miembros con precisión de píxel
- [x] **Pincel de Miembros**: Soporte para pintado por arrastre de selección anatómica
- [x] **Jerarquías de Pivote**: Sistema de pivots funcionales (hombros, caderas, rodillas)
- [x] **Bases Pro**: 3 direcciones principales (Frontal, Lateral, Espalda) + Side Left via mirror
- [x] **Auto-Mirror Lateral**: Botón para espejar Side Right → Side Left automáticamente
- [x] **Rejilla Isométrica**: Guías visuales de diamante (2:1) opcionales en el canvas
- [x] **Animaciones Top-Down**: `generateWalkTopDown`, `generateAttackTopDown` para perspectiva cenital

---

## Features Sueltas Completadas ✅

- [x] **Paletas históricas** — GameBoy, PICO-8, NES, ramps de Slynyrd (Librería de Temas)
- [x] **Import PNG/JPG** — Motor de pixelización con Median Cut, box sampling, remapeo de paletas
- [x] **Chroma Key HSL** — Eliminación de fondos verde IA sin halos
- [x] **Exportación PNG Spritesheet** — Con y sin etiquetas
- [x] **Exportación GIF** — Animación seleccionada como GIF
- [x] **Master Sheet Preview** — Vista completa de todas las animaciones del sprite
- [x] **Autosave Cloud** — Sincronización automática con Supabase (3s debounce)
- [x] **URLs Amigables (Slugs)** — Formato `/project/id-nombre`
- [x] **Sprite Studio Full Display** — Editor como página dedicada (no modal)
- [x] **Borrador Masivo (Magic Eraser)** — Eliminar todas las instancias de un color
- [x] **Iconografía Pixel-Art** — Sistema completo de iconos PxBone, PxUpload, etc.
- [x] **Memoria de Paneles** — Persistencia de estado de UI entre sesiones
- [x] **Generación de Perspectivas IA** — Img2Img para vistas laterales/traseras desde frontal
- [x] **Motor de Compresión por Hashing** — Deduplicación para localStorage
- [x] **Animaciones Procedurales 8-Frame** — Walk cycles estilo Richard Williams
- [x] **Física de Rodillas** — Knee flexion y estabilidad de torso en animaciones
- [x] **Cast Avanzado** — 6 frames con elementos (fire, water, ice, electric, nature) y formas (burst, circle, beam, spark, pulse)
- [x] **Procedural FX Panel** — Herramienta para aplicar transformaciones (Mover, Rotar, Squash/Stretch) a miembros específicos usando máscaras de anatomía.
- [x] **Custom Animation Mode** — Flujo para crear animaciones personalizadas con nombrado manual e inicialización desde el frame actual.

---

## Notas de Arquitectura (Referencia)

### Contrato de datos — Nombres de animación canónicos

| Nombre | Descripción |
|--------|-------------|
| `idle` | Sin input |
| `walk` | Movimiento genérico |
| `walk_left` / `walk_right` | Animaciones direccionales laterales |
| `walk_up` / `walk_down` | Para top-down |
| `attack` / `attack_up` / `attack_down` | Acción principal |
| `hurt` | Recibir daño |
| `die` | Muerte |
| `jump` | Para platformers |
| `cast` | Magia/habilidad especial |

### Stack Técnico

- React 18 + TypeScript (strict) + Vite 5 + Tailwind 3
- Zustand (estado del editor) + TanStack Query (datos async)
- Supabase (Auth, Postgres, Edge Functions)
- Gemini 2.5 Flash (generación IA server-side)
- omggif (export GIF) + dnd-kit (drag & drop)
