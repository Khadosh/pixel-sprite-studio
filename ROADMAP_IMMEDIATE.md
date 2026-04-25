# ROADMAP INMEDIATO (Táctico) ⚡

> **Foco actual**: 🦴 **Anatomy-Driven Animation Engine**. 
> Integrar el sistema de desmembramiento para que las animaciones entiendan píxeles reales, no solo rectángulos.
> Última actualización: 2026-04-25

---

## 🦴 1. Core Anatomy Engine (Cimientos)
*Hacer que el motor "entienda" los píxeles seleccionados por el usuario.*

- [ ] **Unificador de Miembros**: Crear un "Resolver" que entregue un mapa de píxeles para cada parte del cuerpo, usando la selección manual si existe o infiriendo el área si no (Fallback Inteligente).
- [ ] **Transformaciones por Máscara**: Implementar `shiftPixels` y `rotatePixels` que operen sobre los `MemberConfig.pixels` para permitir movimientos sin distorsionar el resto del cuerpo.

## 🎬 2. The Core 8 Suite (Fase 1)
*Implementar las 8 animaciones base con soporte total de anatomía y direcciones.*

- [ ] **1. IDLE & BREATH**: Animación sutil usando squash/stretch basado en el pivot de la cintura.
- [ ] **2. WALK (Front/Side/Back)**: Ciclo de 8 frames con flexión de rodillas real (usando píxeles de piernas).
- [ ] **3. RUN**: Variación del walk con mayor inclinación de torso y zancada más larga.
- [ ] **4. JUMP**: Anticipación (squash), salto (stretch + lift) y caída.
- [ ] **5. ATTACK**: Thrust/Slash usando el pivot del hombro detectado/marcado.
- [ ] **6. HURT**: Recoil físico con rotación de cabeza y torso.
- [ ] **7. CAST (Advanced)**: El sistema actual mejorado para usar los brazos marcados.
- [ ] **8. DIE**: Colapso físico real (caída de rodillas y desplome).

---

## ⏳ Futuro Cercano (Post-Anatomy)
- [ ] **Auto-Shade Generator** (Herramientas de Paleta)
- [ ] **HSL Color Picker Pro**
- [ ] **Export Texture Packer JSON**
- [ ] **Duración por Frame editable**

---

## ✅ Completados Recientemente
- [x] **Perspectivas y Grillas Pro**: Auto-Mirror, Rejilla Isométrica, Modo Top-Down
- [x] **Nombres Canónicos**: Sistema estándar implementado
- [x] **Dismemberment Tool (UI)**: Capacidad de marcar píxeles por miembro

---

*Para la visión a largo plazo, ver [ROADMAP_NEXT.md](./ROADMAP_NEXT.md)*
*Para el historial completo, ver [ROADMAP_COMPLETED.md](./ROADMAP_COMPLETED.md)*
