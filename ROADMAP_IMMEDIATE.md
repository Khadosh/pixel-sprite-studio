# ROADMAP INMEDIATO (Táctico) ⚡

> **Foco actual**: Estabilización de IA, Animaciones Direccionales y Evolución del Sistema de Huesos.

---

## 1. Estabilización: Generar desde Front 🟢
*Objetivo alcanzado: Diagnóstico mediante Debug Export y mejora de fidelidad con Flux Pro Kontext.*

- [x] **Debug Export Button**: Implementado. Permite verificar la calidad de la referencia enviada a la IA.
- [x] **Upscale de Referencia (16x)**: Implementado. Enviamos imágenes de 512px para evitar borrosidad.
- [x] **Prompt Fine-tuning**: Refinados los prompts para rotación de 90 grados y anatomía consistente.
- [ ] **Auto-Background Removal**: Refinar la lógica de limpieza de croma verde en el cliente.

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
