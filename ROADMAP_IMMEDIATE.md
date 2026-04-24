# ROADMAP INMEDIATO (Táctico) ⚡

> **Foco actual**: Estabilización de IA, Animaciones Direccionales y Evolución del Sistema de Huesos.

---

## 1. Estabilización: Generar desde Front 🟢
*Objetivo alcanzado: Diagnóstico mediante Debug Export y mejora de fidelidad con Flux Pro Kontext.*

- [x] **Debug Export Button**: Implementado. Permite verificar la calidad de la referencia enviada a la IA.
- [x] **Upscale de Referencia (16x)**: Implementado. Enviamos imágenes de 512px para evitar borrosidad.
- [x] **Prompt Fine-tuning**: Refinados los prompts para rotación de 90 grados y anatomía consistente.
- [x] **Auto-Background Removal**: Implementado motor HSL para detección robusta de chroma green con supresión de spillover en bordes.

## 2. Animaciones Procedurales Direccionales 🟢
*Hacer que el sistema de animación entienda la perspectiva.*

- [x] **Templates por Vista**: Implementadas lógicas para vistas laterales (`walk_side`) y frontales/top-down con 8 frames (Richard Williams style).
- [x] **Inercia Adaptativa**: Implementada flexión de rodillas (`knee flexion`) y estabilidad de torso en todos los generadores.
- [x] **Refactor Modular**: Migrado todo el motor a `src/lib/sprite/` para escalabilidad futura.

## 3. Evolución del Sistema de Huesos (Limb-based) 🟠
*Pasar de anatomía global a control por miembros.*

- [x] **Control de Miembros**: Implementado manejo independiente de cabeza, torso y extremidades.
- [x] **Jerarquías de Pivote**: Implementado sistema de pivots para Cabeza y Torso, además de hombros y caderas.
- [x] **UI de Selección**: Rediseñada la pestaña **BONES** (Anatomy Engine) con modos Auto/Humanoid/Custom y visualización de regiones en el canvas.

## 4. Refinamiento UI/UX Final 🟢
*Detalles premium y limpieza.*

- [x] **Memoria de Paneles**: Persistencia del estado (Expandido/Mini) del preview de animación via localStorage.
- [x] **Optimización de Gaps**: Reducidos paddings y gaps del layout principal para maximizar el protagonismo del canvas.
- [x] **Corrección de Iconos**: Reemplazado ícono Lucide `Bone` con `PxBone` pixel-art; consistencia total en la iconografía del sidebar y paneles.

---
*Para ver la visión a largo plazo del proyecto, consultar [ROADMAP.md](./ROADMAP.md)*

