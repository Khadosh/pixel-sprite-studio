# ROADMAP INMEDIATO (Táctico) ⚡

> **Foco actual**: Estabilización de IA, Animaciones Direccionales y Evolución del Sistema de Huesos.

---

## 1. Estabilización: Generar desde Front 🔴
*El objetivo es que la rotación (Front -> Side) sea nítida y coherente.*

- [ ] **Debug Export Button**: Implementar un botón temporal en el editor que permita descargar el `DataURL` exacto que se envía a Fal.ai. Queremos ver si la fuente llega pixel-perfect o si hay ruido.
- [ ] **Auto-Background Removal**: Pre-procesar la imagen de referencia para eliminar el fondo verde/transparente antes de enviarla a la IA.
- [ ] **Prompt Fine-tuning**: Refinar los prompts para Flux/Dev enfocados en mantener la anatomía vertical y proporciones exactas.

## 2. Animaciones Procedurales Direccionales 🟠
*Hacer que el sistema de animación entienda la perspectiva.*

- [ ] **Templates por Vista**: Crear lógicas de movimiento específicas para vistas laterales (`walk_right`, `walk_left`) y traseras (`walk_up`).
- [ ] **Inercia Adaptativa**: Ajustar `leanBody` y `squash` según el ángulo de visión.

## 3. Evolución del Sistema de Huesos (Limb-based) 🟡
*Pasar de anatomía global a control por miembros.*

- [ ] **Control de Miembros**: Implementar manejo independiente de brazos y piernas (L/R).
- [ ] **Jerarquías Básicas**: hombro -> brazo -> mano.
- [ ] **UI de Selección**: Rediseñar la pestaña **BONES** para interactuar con miembros específicos.

## 4. Refinamiento UI/UX Final 🟢
*Detalles premium y limpieza.*

- [ ] **Memoria de Paneles**: Persistencia del estado (Expandido/Mini) del preview de animación.
- [ ] **Optimización de Gaps**: Seguir puliendo el espacio en el editor para que el canvas sea el protagonista.
- [ ] **Corrección de Iconos**: Asegurar consistencia en toda la iconografía pixel-art.

---
*Para ver la visión a largo plazo del proyecto, consultar [ROADMAP.md](./ROADMAP.md)*
