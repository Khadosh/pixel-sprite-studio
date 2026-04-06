# Pixel Sprite Studio — Roadmap

> Última actualización: 2026-04-05 (Revisado tras Phase 2 Completion)

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

## Backlog / Ideas Futuras

| Feature | Complejidad | Impacto |
|:--------|:-----------|:--------|
| Selection tool (mover, copiar, rotar área) | 🟡 Media | Alto |
| Move & Rotate tools (interactivo) | ✅ Hecho | Medio |
| Tiling preview (ver sprite repetido) | 🟡 Media | Medio |
| Reference image overlay | 🟡 Media | Medio |
| Sprite sheet import (PNG → frames) | 🟡 Media | Alto |
