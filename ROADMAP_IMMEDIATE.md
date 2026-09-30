# ROADMAP INMEDIATO (Táctico) ⚡

> **Foco actual**: 🦴 **Anatomy-Driven Animation Engine**. 
> Integrar el sistema de desmembramiento para que las animaciones entiendan píxeles reales, no solo rectángulos.
> Última actualización: 2026-05-06

---

## 🦴 1. Core Anatomy Engine (Cimientos)
*Hacer que el motor "entienda" los píxeles seleccionados por el usuario.*

- [x] **Unificador de Miembros**: Crear un "Resolver" que entregue un mapa de píxeles para cada parte del cuerpo, usando la selección manual si existe o infiriendo el área si no (Fallback Inteligente).
- [x] **Transformaciones por Máscara**: Implementar `shiftPixels` y `rotatePixels` que operen sobre los `MemberConfig.pixels` para permitir movimientos sin distorsionar el resto del cuerpo.

## 🎬 2. The Core 8 Suite (Fase 1)
*Implementar las 8 animaciones base con soporte total de anatomía y direcciones.*

- [x] **1. IDLE & BREATH**: Animación sutil usando squash/stretch basado en el pivot de la cintura.
- [x] **2. WALK (Front/Side/Back)**: Ciclo de 8 frames con flexión de rodillas real (usando píxeles de piernas).
- [x] **3. RUN**: Variación del walk con mayor inclinación de torso y zancada más larga.
- [x] **4. JUMP**: Anticipación (squash), salto (stretch + lift) y caída.
- [ ] **5. ATTACK**: Thrust/Slash usando el pivot del hombro detectado/marcado.
- [ ] **6. HURT**: Recoil físico con rotación de cabeza y torso.
- [ ] **7. CAST (Advanced)**: El sistema actual mejorado para usar los brazos marcados.
- [ ] **8. DIE**: Colapso físico real (caída de rodillas y desplome).

---

## 🖥️ 3. Headless (CLI + MCP) — para alimentar juegos desde un agente
*Ver "Headless" en AGENTS.md. Primer consumidor: The Unwritten Dao (Godot).*

- [x] **Núcleo headless**: `src/headless/` con registro de comandos, CLI (`bin/pss`) y MCP (`bin/pss-mcp`).
- [x] **Import de hojas 1:1** (grilla, margen, espaciado, colores exactos, tags por fila/columna).
- [x] **Export hoja 1:1 + JSON estilo Aseprite** (rects, duración por cuadro, frameTags con loop).
- [x] **FX procedurales por comando** (`fx`, `fx_anim`) con semilla reproducible.
- [x] **Animación de anatomía por comando** (`animate` + `anatomy`).
- [ ] **El motor sobre chibis de 16 px**: con piernas de 1–2 px la caminata casi no se mueve y `die` rota la cabeza en fragmentos. Hace falta un modo "chibi" (mover bloques enteros, sin rotar) o pasos mínimos de 1 px garantizados.
- [ ] **Que el editor honre `width/height`, `durations` y `loop`** (hoy sólo el lado headless).
- [ ] **Import de hojas desde la UI** reutilizando `importSheetImage`.

## ⏳ Futuro Cercano (Post-Anatomy)
- [ ] **Auto-Shade Generator** (Herramientas de Paleta)
- [ ] **HSL Color Picker Pro**
- [x] **Export Texture Packer JSON** (hecho en headless: `export_sheet`)
- [x] **Duración por Frame** (modelo: `AnimationDef.durations`; falta la UI)

---

## ✅ Completados Recientemente
- [x] **Perspectivas y Grillas Pro**: Auto-Mirror, Rejilla Isométrica, Modo Top-Down
- [x] **Nombres Canónicos**: Sistema estándar implementado
- [x] **Dismemberment Tool (UI)**: Capacidad de marcar píxeles por miembro
- [x] **Previsualización Dinámica**: Soporte auto-escalable para 64x64 y 128x128 sin overflow.
- [x] **Procedural FX Tool**: Panel de manipulación de miembros basado en anatomía (FX tab).
- [x] **Custom Creation Flow**: Modo de creación de animaciones manuales desde el frame base.

---

*Para la visión a largo plazo, ver [ROADMAP_NEXT.md](./ROADMAP_NEXT.md)*
*Para el historial completo, ver [ROADMAP_COMPLETED.md](./ROADMAP_COMPLETED.md)*
