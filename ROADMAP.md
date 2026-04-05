# Pixel Sprite Studio — Roadmap

> Última actualización: 2026-04-05

## Visión

Un editor de pixel art sprite sheets enfocado, pulido, y con asistencia de IA para generar characters y animaciones. Formato único: **palette-based `number[][]`**.

---

## Fase 0 — Limpieza: Remover V2 Image-Based ✅
*Completada 2026-04-05*

- [x] Remover campos V2 de `SpriteAsset`: `isImageBased`, `resolution`, `gridSize`, `elements`, `SpriteElement`
- [x] Simplificar `SpritePixelEditor`: eliminar branching `isImageBased`
- [x] Simplificar `SpritePreview`: eliminar code path de image elements
- [x] Simplificar `SpriteEditorModal`: eliminar panel "Elements (Layers)" V2
- [x] Refactorear `generate-sprite` Edge Function: Gemini 2.5 Flash, JSON directo
- [x] Limpiar `SpriteSheetCanvas` y `AssetCard` de referencias V2

---

## Fase 1 — IA: Separar Character vs Animaciones
*Prioridad: ALTA — en progreso*

### 1.1 — Mejorar generación del character base
- [x] Prompt engineering mejorado (composición, anatomía, técnica de color)
- [x] Validación del JSON devuelto (dimensiones de frame)
- [x] Edge function con Gemini 2.5 Flash + `responseMimeType: "application/json"`
- [x] Subir a 32×32 para mejor detalle (en progreso)
- [x] Hacer transforms dinámicos (no hardcodear tamaño 16)
- [x] Preview rápido inline antes de abrir editor (Resuelto con Regenerar in-editor)
- [x] Botón "Regenerar" sin perder el prompt

### 1.2 — Generación de animaciones separada
- [x] Generar una animación a la vez (Idle, Walk, Attack, etc.)
- [x] Opción batch (llamadas independientes)
- [x] AI-assisted: LLM genera variaciones del frame base
- [x] Mantener transforms client-side como opción "Quick"

---

## Fase 2 — Editor Manual: Frame Operations
*Prioridad: ALTA*

### 2.1 — Operaciones de frame
- [ ] Copy/Paste frame entre slots
- [ ] Duplicate frame
- [ ] Swap frames
- [ ] Delete frame
- [ ] Agregar frame vacío

### 2.2 — Timeline mejorada
- [ ] Strip de frames con drag & drop
- [ ] Menú contextual (click derecho)
- [ ] Indicador visual de animación por frame

### 2.3 — Onion Skinning
- [ ] Toggle on/off
- [ ] Opacity slider
- [ ] Anterior, siguiente, o ambos

---

## Quick Wins — Herramientas de Edición Básicas
*Prioridad: ALTA — se pueden hacer en paralelo con Fase 2*

- [ ] Flood Fill (bucket tool)
- [ ] Eyedropper (color picker del canvas)
- [ ] Keyboard shortcuts (B=brush, E=eraser, G=fill, I=eyedropper, Z=undo)
- [ ] Line tool
- [ ] Rectangle/Circle tool
- [ ] Mirror/Symmetry mode

---

## Fase 3 — Layer System
*Prioridad: MEDIA — hacer después de Fase 2*

- [ ] Tipo `SpriteLayer` con frames propios, visibilidad, lock, opacity
- [ ] Layer panel: lista, toggle, reorder
- [ ] Agregar/eliminar/duplicar capa
- [ ] Flatten (merge capas visibles)
- [ ] Dibujar solo en capa activa
- [ ] Solo layer view

---

## Fase 4 — Canvas Resizing
*Prioridad: MEDIA*

- [ ] Resize canvas (crop/padding con anchor configurable)
- [ ] Scale sprite (nearest-neighbor 2×, 3×)
- [ ] Presets: 8×8, 16×16, 32×32, 64×64
- [ ] Custom width × height
- [ ] Migrar `asset.size` → `asset.width` + `asset.height`

---

## Fase 5 — Color Tools
*Prioridad: MEDIA*

### 5.1 — Shade Generator
- [ ] Auto-shade: genera N variantes claras/oscuras de un color
- [ ] Agregar shades a la paleta
- [ ] Visualización de rampa en palette bar

### 5.2 — HSL Color Picker
- [ ] Reemplazar input hex con picker HSL visual
- [ ] Preview en tiempo real

### 5.3 — Palette Templates
- [ ] Paletas predefinidas (NES, Game Boy, Pico-8, Endesga-32, etc.)
- [ ] Import palette (.pal, .gpl, imagen)
- [ ] Extract palette from image

---

## Backlog / Ideas Futuras

| Feature | Complejidad | Impacto |
|:--------|:-----------|:--------|
| Selection tool (mover, copiar, rotar área) | 🟡 Media | Alto |
| Move tool (mover contenido sin cambiar canvas) | 🟡 Media | Medio |
| Tiling preview (ver sprite repetido) | 🟡 Media | Medio |
| Reference image overlay | 🟡 Media | Medio |
| Sprite sheet import (PNG → frames) | 🟡 Media | Alto |
| GIF export | 🟡 Media | Alto |
| Image-based generation (Fal.ai) — re-evaluar | 🔴 Alta | Alto |
