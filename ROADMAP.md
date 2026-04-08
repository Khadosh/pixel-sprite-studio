# Pixel Sprite Studio — Roadmap

> Última actualización: 2026-04-08 (Revisado tras auditoría estratégica)

## Visión

Un editor de pixel art sprite sheets enfocado, pulido, y con asistencia de IA para generar characters y animaciones. Formato único: **palette-based `number[][]`**.

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

### 1.1 — Mejorar generación del character base
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
- [x] Renderizado de frames anterior/siguiente con opacidad reducida en el canvas principal

---

## Quick Wins — Herramientas de Edición ✅
*Completada 2026-04-05*

- [x] **Flood Fill** (Bucket tool)
- [x] **Eyedropper** (Picker tool)
- [x] **Shapes**: Line, Rectangle, Circle (con Draft Preview)
- [x] **Symmetry Mode**: MirrorX toggle (Hotkey: M)
- [x] **Keyboard Shortcuts**: B (Brush), E (Eraser), I (Picker), G (Fill), M (Mirror), Z (Undo), O (Onion)
- [x] **Brush Sizes**: 1x1, 2x2, 4x4

---

## Fase 3 — Layer System ✅
*Completada 2026-04-05*

- [x] Tipo `SpriteLayer` con frames propios, visibilidad, lock, opacity
- [x] Layer panel: lista, toggle, reorder
- [x] Agregar/eliminar/duplicar capa
- [x] Dibujar solo en capa activa (Scope selector: Layer vs Frame)
- [ ] Merge capas (Flatten)

---

## Fase 4 — Canvas Ops & More 🛠️
*Prioridad: MEDIA*

- [ ] Resize canvas (crop/padding con anchor configurable)
- [ ] Scale sprite (nearest-neighbor 2×, 3×)
- [ ] Presets: 8×8, 16×16, 32×32, 64×64
- [ ] Export formats extra (GIF, SpriteSheet metadata JSON)

---

## Fase 5 — Color & Palettes 🎨
*Prioridad: MEDIA*

- [ ] Auto-shade: genera N variantes claras/oscuras de un color
- [ ] HSL Color Picker visual
- [ ] Palette Templates (NES, Game Boy, etc.)
- [ ] Import palette (.pal, .gpl)

---

## Fase 6 — Gestión Pro & Librería de Props ⚔️ ✅
*Completada 2026-04-08*

### 6.1 — Refactor del Animation Library
- [x] Eliminar checkboxes confusos
- [x] Lista real de animaciones guardadas (soporte para duplicados: Attack 1, Attack 2)
- [x] Panel de generación dedicado: elegir tipo → generar → agregar a la lista
- [x] Eliminar/Renombrar animación individualmente

### 6.2 — Librería de Props (Permanent Layers)
- [x] Crear sistema de `Props`: Espadas, Báculos, Escudos pre-definidos
- [x] Inyectar Props como nuevas capas automáticas (ajustadas a 16px/32px)

### 6.3 — Operaciones de Proyecto
- [x] Clonar Sprite existente (Duplicar asset completo con nuevo ID)


---

---

## Fase A — Paridad Competitiva 🔴
*Prioridad: CRÍTICA — bloqueante para monetización*

- [ ] **Zoom del canvas** — Scroll para zoom, hotkeys `+`/`-`, indicador de nivel
- [ ] **Herramienta de selección rectangular** — Select, move, copy/paste, delete región
- [ ] **Undo para operaciones de alto nivel** — Stack deshacer para: borrar frame, mover capa, eliminar animación
- [ ] **Merge de capas** — Flattenear capas seleccionadas (pendiente de Fase 3)
- [ ] **Rate limiting en Edge Functions** — Límite diario por usuario para llamadas IA
- [ ] **TypeScript strict mode** — Habilitar `strict: true` en tsconfig y resolver warnings

---

## Fase B — Diferenciación y Monetización 💰
*Prioridad: ALTA — features que justifican el pago*

- [ ] **Import PNG** — Cargar imagen externa como referencia o sprite base
- [ ] **Resize / crop canvas** — Anchor configurable, presets 8×8 / 16×16 / 32×32 / 64×64
- [ ] **Paletas históricas** — NES, Game Boy, CGA, EGA, Pico-8 como templates
- [ ] **HSL Color Picker visual** — Reemplazar el picker nativo HTML
- [ ] **Auto-shade** — Generar N variantes claras/oscuras de un color seleccionado
- [ ] **Export Spritesheet JSON** — Formato Texture Packer compatible con rect coordinates
- [ ] **Tiling preview** — Ver sprite repetido en grid configurable (útil para tiles)
- [ ] **Sistema de créditos IA + Stripe** — Integración de pagos, planes Free/Pro, cobro por generación
- [ ] **Onboarding interactivo** — Tutorial paso a paso para nuevos usuarios
- [ ] **Changelog público en la app** — Mostrar últimas updates; builds confianza

---

## Fase C — Plataforma y Comunidad 🌐
*Prioridad: MEDIA — construir el moat*

- [ ] **Galería pública de sprites** — Feed de creaciones de usuarios con likes y filtros
- [ ] **Share link de solo lectura** — URL pública para compartir un sprite sin cuenta
- [ ] **Marketplace** — Venta de packs de sprites con revenue share (70/30)
- [ ] **Colaboración básica** — Compartir proyecto editable con otros usuarios registrados
- [ ] **Export a Godot** — Recurso `.tres` con spritesheet embebido
- [ ] **Export a Unity** — Atlas PNG + JSON con rect coordinates por frame
- [ ] **Import palette (.pal / .gpl)** — Cargar paletas de herramientas externas
- [ ] **Sprite sheet import** — Cargar PNG y dividirlo en frames automáticamente
- [ ] **API pública** — Docs, autenticación con API keys, rate limits por tier

---

## Fase D — Escala 🚀
*Prioridad: BAJA — si hay traction*

- [ ] **Colaboración real-time** — Co-edición con cursors compartidos (Supabase Realtime)
- [ ] **AI in-painting** — Seleccionar área del canvas y regenerar parcialmente con prompt
- [ ] **Batch AI generation** — Generar set completo de 8 animaciones en un solo click
- [ ] **Referencia de imagen overlay** — Cargar imagen semitransparente como guía de dibujo
- [ ] **Smart Multi-layer AI Splitting** — IA detecta y separa colores/posiciones en capas
- [ ] **Mobile / tablet (PWA)** — Touch events, soporte stylus, layout adaptado
- [ ] **Plugins / scripting** — API para automatizar workflows con scripts de usuario

---

## Backlog / Ideas Futuras

| Feature | Complejidad | Impacto |
|:--------|:-----------|:--------|
| Bezier curve drawing | 🔵 Alta | Bajo |
| Gradient tool | 🟡 Media | Bajo |
| Color modes (Indexed, Grayscale) | 🔵 Alta | Medio |
| Animation easing curves | 🔵 Alta | Medio |
| CLI / batch export headless | 🔵 Alta | Medio |
| Tilemap editor | 🔵 Alta | Alto |
