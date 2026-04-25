# ROADMAP INMEDIATO (Táctico) ⚡

> **Foco actual**: Herramientas de paleta, export profesional y polish de animación.
> Última actualización: 2026-04-25

---

## 1. Herramientas de Paleta 🎨
*Mejorar el control artístico sobre el color — el recurso más usado después del pincel.*

- [ ] **Auto-Shade Generator**: Botón junto a cada color para generar una rampa de 3-5 tonos (highlight → base → shadow) usando HSL shifts. Se integra con `addColorRamp` existente.
- [ ] **HSL Color Picker Pro**: Reemplazar el `<input type="color">` nativo por un picker custom con sliders de Hue, Saturation, Lightness para mayor precisión artística.

## 2. Export Pipeline Pro 📦
*Cerrar el loop: lo que se crea en el Studio debe poder usarse directo en un engine.*

- [ ] **Export Texture Packer JSON**: Generar JSON companion junto al PNG spritesheet con rect coordinates, nombres canónicos de animación y duración por frame. Importable en Godot, Unity y Defold sin plugins.
- [ ] **Duración por Frame**: Agregar `frameDurations?: number[]` a `AnimationDef` y renderizar inputs editables sobre cada frame en el timeline. Esencial para anticipation/impact/recovery.

## 3. Polish de Animación 🎬
*Detalles que mejoran la calidad percibida de las animaciones generadas.*

- [ ] **FPS por animación editable en la librería**: Permitir ajustar el FPS directamente desde la lista de animaciones guardadas (actualmente solo se ajusta desde el preview panel).

---

## ✅ Completados Recientemente
- [x] **Perspectivas y Grillas Pro**: Auto-Mirror, Rejilla Isométrica, Modo Top-Down
- [x] **Nombres Canónicos**: Sistema estándar implementado en generación y librería
- [x] **Pincel de Miembros**: Pintado por arrastre en el motor de anatomía
- [x] **Jerarquías de Pivote**: Sistema de pivots funcionales
- [x] **Chroma Key Inteligente (HSL)**: Eliminación de fondos sin halos
- [x] **Memoria de Paneles**: Persistencia de estado de UI
- [x] **Iconografía PxBone**: Consistencia visual pixel-art total

---

*Para la visión a largo plazo, ver [ROADMAP_NEXT.md](./ROADMAP_NEXT.md)*
*Para el historial completo, ver [ROADMAP_COMPLETED.md](./ROADMAP_COMPLETED.md)*
