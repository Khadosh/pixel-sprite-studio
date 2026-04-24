# Pixel Sprite Studio — Roadmap

> **Visión Estratégica**: Para tareas inmediatas y el sprint actual, consultar [ROADMAP_IMMEDIATE.md](./ROADMAP_IMMEDIATE.md)
> Última actualización: 2026-04-22 (Reorganización Dual)

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
- [x] **Keyboard Shortcuts**: B (Brush), E (Eraser), I (Picker), G (Fill), M (Mirror), Z (Undo), O (Onion), V/S (Select), R (Rotate)
- [x] **Brush Sizes**: 1x1, 2x2, 4x4

---

## Fase 3 — Layer System ✅
*Completada 2026-04-05*

- [x] Tipo `SpriteLayer` con frames propios, visibilidad, lock, opacity
- [x] Layer panel: lista, toggle, reorder
- [x] Agregar/eliminar/duplicar capa
- [x] Dibujar solo en capa activa (Scope selector: Layer vs Frame)
- [ ] Merge capas (Flatten) ← pasa a Fase A

---

## Fase 6 — Gestión Pro & Librería de Assets ✅
*Completada 2026-04-08 (Fase Base)*

### 6.1 — Refactor del Animation Library ✅
- [x] Eliminar checkboxes confusos
- [x] Lista real de animaciones guardadas
- [x] Panel de generación dedicado
- [x] Eliminar/Renombrar animación individualmente

### 6.2 — Librería de Assets (Evolución) ⚔️
- [x] Sistema de `Props` inyectables como capas
- [x] **Smart Importing**: Soporte para encajar 16px en 32px (centering)
- [ ] Creación masiva de assets por categorías (objetos, consumibles, equipo)
- [x] Browser de assets con preview real-time (Integrado en Studio)

---

## Fase 8 — Studio Pro: Personalización y Creación Avanzada 🚀
*Prioridad: MÁXIMA — Enfoque en generación de assets listos para producción*

### 8.1 — Humanoides Multidireccionales y Motor de Desmembramiento ✅
*Completado 2026-04-24*
- [x] **Motor de Desmembramiento**: Implementación de `AnatomyConfig` con soporte para miembros jerárquicos (`MemberConfig`).
- [x] **Orientaciones de Anatomía**: Soporte para configuraciones anatómicas únicas por vista (Front, Side, Back).
- [x] **Selector Libre de Píxeles**: Herramienta interactiva para delimitar áreas de miembros con precisión de píxel.
- [x] **Bases Pro**: Implementación de bases con 3 direcciones principales (Frontal, Lateral, Espalda).
- [ ] **Auto-Mirror**: Lógica de espejado automática para vistas laterales y diagonales.
- [ ] **Perspectivas**: Selector de modo Top-down e Isométrico.
- [ ] **Rejilla Isométrica**: Guías visuales de diamante (30º) opcionales para dibujo en perspectiva.

### 8.2 — Galería de Equipamiento (Clothing/Props)
- [ ] **Ropa Inyectable**: Capas de equipo (cascos, abrigos, armaduras) pre-alineadas a las bases estándar.
- [ ] **Categorización**: Filtros específicos para "HEADWEAR", "CHEST", "ACCESSORY".

### 8.3 — Wizard de Creación
- [ ] **Flujo Guiado**: Asistente por pasos (Categoría -> Perspectiva -> Plantilla -> Configuración).
- [ ] **Filtros Inteligentes**: Ocultar animaciones/herramientas no válidas según la categoría del asset.

### 8.4 — Motor IA Híbrido (HQ Image-to-Pixel)
- [ ] **HQ Generation**: Prompt -> Imagen RAW de alta calidad (vía Gemini).
- [ ] **Auto-Import Pipeline**: Puente automático entre la imagen generada y el motor de pixelización/cuantización del Studio.

---

## Fase 7 — Expansión de Contenido y Composición 🎨
*Prioridad: ALTA — Enfoque en crear escenas y personajes ricos*

- [x] **Smart Importing**: Lógica para importar 16x16 dentro de 32x32 sin reescalar (centrado).
- [ ] **Librería Esencial (16x16)**: Pociones, naturaleza, cofres y items listos para usar.
- [ ] **Tilemap Support**: Generación de tiles de terreno (pasto, agua, muros) compatibles entre sí.
- [ ] **Composición Multicapa**: Herramientas para alinear assets importados rápidamente.

---

## Fase A — Paridad Competitiva 🔴
*Prioridad: CRÍTICA — bloqueante para monetización*

- [x] **Zoom del canvas** — Scroll para zoom, middle-click pan, hotkeys `+`/`-`, indicador de nivel
- [x] **Herramienta de selección avanzada** — Rect select, move, rotation (free drag), resizing (handles), copy/paste, delete region, deselect on click.
- [x] **Undo para operaciones de alto nivel** — Stack deshacer para: borrar frame, mover capa, eliminar animación
- [x] **Merge de capas** — Flattenear capas seleccionadas (pendiente de Fase 3)
- [x] **Rate limiting en Edge Functions** — Límite diario por usuario para llamadas IA
- [x] **TypeScript strict mode** — Habilitar `strict: true` en tsconfig y resolver warnings
- [ ] **Estandarización de nombres de animación** — Contrato fijo de nombres canónicos (`idle`, `walk`, `walk_left`, `walk_right`, `attack`, `hurt`, `die`); requerido por Fase B.2 y Fase B.3

> **Nota:** La estandarización de nombres de animación es prerequisito para el Export JSON y el Character Preview. Definirla acá evita deuda en los pasos siguientes.

---

### B.3 — Color y paletas
- [ ] **Paletas históricas** — NES, Game Boy, CGA, EGA, Pico-8 como templates
- [ ] **HSL Color Picker visual** — Reemplazar el picker nativo HTML
- [ ] **Auto-shade** — Generar N variantes claras/oscuras de un color seleccionado

### B.4 — Monetización
- [ ] **Sistema de créditos IA + Stripe** — Integración de pagos, planes Free/Pro, cobro por generación
- [ ] **Onboarding interactivo** — Tutorial paso a paso para nuevos usuarios
- [ ] **Changelog público en la app** — Mostrar últimas updates; builds confianza

---

## Fase E — Integración y Exportación Pro 💰
*Prioridad: BAJA — Desplazada al final para priorizar el contenido creativo*

### E.1 — Export y contrato de datos
- [ ] **Export Spritesheet JSON (Texture Packer format)** — Spritesheet PNG plano + JSON con nombre de animación, índices de frames, duración por frame y rect coordinates. Importable directamente en Godot, Unity y Defold sin plugins.
- [ ] **Import PNG** — Cargar imagen externa como referencia o sprite base
- [ ] **Resize / crop canvas** — Anchor configurable, presets 8×8 / 16×16 / 32×32 / 64×64

### E.2 — Character Preview (mini-juego interactivo)
*El loop completo: generás → animás → jugás → exportás.*

- [ ] **Canvas de preview interactivo** — Canvas separado del editor, loop con `requestAnimationFrame`
- [ ] **Character controller mínimo** — Movimiento con teclado (WASD / flechas), sin física; colisión simple por celda
- [ ] **Tilemap fijo seleccionable** — 2-3 tilemaps de ejemplo (interior, exterior, dungeon); no es un editor de mapas
- [ ] **Mapeo animación-estado** — `idle` sin input · `walk`/`walk_left`/`walk_right` en movimiento · `attack` en tecla de acción · `hurt` / `die` si se expande
- [ ] **Driven por el mismo JSON de export** — El preview consume el Texture Packer JSON; lo que funciona acá funciona en Godot

---

## Fase C — Plataforma y Comunidad 🌐
*Prioridad: MEDIA — construir el moat*

- [ ] **Galería pública de sprites** — Feed de creaciones de usuarios con likes y filtros
- [ ] **Share link de solo lectura** — URL pública para compartir un sprite (+ preview interactivo embebible)
- [ ] **Marketplace** — Venta de packs de sprites con revenue share (70/30)
- [ ] **Colaboración básica** — Compartir proyecto editable con otros usuarios registrados
- [ ] **Export a Godot** — Recurso `.tres` con spritesheet embebido (la base ya está en el JSON de B.1)
- [ ] **Export a Unity** — Atlas PNG + JSON con rect coordinates por frame (ídem)
- [ ] **Import palette (.pal / .gpl)** — Cargar paletas de herramientas externas
- [ ] **Sprite sheet import** — Cargar PNG y dividirlo en frames automáticamente
- [ ] **API pública** — Docs, autenticación con API keys, rate limits por tier; expone `/generate-sprite`, `/generate-animation` y `/export-json`

---

## Fase D — Escala 🚀
*Prioridad: BAJA — si hay traction*

- [ ] **Colaboración real-time** — Co-edición con cursors compartidos (Supabase Realtime)
- [ ] **AI in-painting** — Seleccionar área del canvas y regenerar parcialmente con prompt
- [ ] **Batch AI generation** — Generar set completo de animaciones canónicas en un solo click
- [ ] **Referencia de imagen overlay** — Cargar imagen semitransparente como guía de dibujo
- [ ] **Smart Multi-layer AI Splitting** — IA detecta y separa colores/posiciones en capas
- [ ] **Tilemap editor básico** — Construir niveles con los tiles generados; conecta con el character preview
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
| Tilemap editor completo | 🔵 Alta | Alto |
| Sombreado Dinámico Procedural (Fuente de Luz) | 🔵 Alta | 🔥 Muy Alto |

---

## Notas de arquitectura

### Contrato de datos para integración con game engines

El JSON de export (Texture Packer format) es la fuente de verdad compartida entre el editor, el character preview y los exports a engines externos. La estructura mínima:

```json
{
  "meta": {
    "sprite": "my-character",
    "size": { "w": 256, "h": 32 },
    "frameSize": { "w": 32, "h": 32 }
  },
  "animations": {
    "idle":  { "frames": [0], "duration": 200 },
    "walk":  { "frames": [1, 2, 3, 4], "duration": 120 },
    "attack":{ "frames": [5, 6, 7], "duration": 80 }
  }
}
```

Godot, Unity y Defold aceptan este formato con importadores nativos o plugins estándar. No requiere soluciones por engine — resolvés el contrato una vez.

### Nombres de animación canónicos

| Nombre | Descripción |
|--------|-------------|
| `idle` | Sin input |
| `walk` | Movimiento genérico |
| `walk_left` / `walk_right` | Si hay animaciones direccionales |
| `walk_up` / `walk_down` | Para top-down |
| `attack` | Acción principal |
| `hurt` | Recibir daño |
| `die` | Muerte |
| `jump` / `fall` | Para platformers |

La IA ya genera estos nombres — estandarizarlos en el data model es principalmente validación y UI.