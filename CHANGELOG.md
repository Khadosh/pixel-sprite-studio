# CHANGELOG - Pixel Sprite Studio

El registro histórico completo de la evolución del proyecto, desde su concepción hasta hoy.

---

## 2026-04-15 (Hoy)
**1 commit realizado**

- **Novedad**: Sistema de **Importación de Imágenes**. Permite convertir cualquier archivo (PNG, JPG, WebP) en pixel art editable directamente en el editor.
- **Mejoras**: Motor de pixelización híbrido con algoritmos de mapeo a paletas fijas (Sprite/Librería) y generación automática via **Median Cut**.
- **Interfaz**: Nuevo modal de importación con previsualización interactiva (drag/zoom), detector de frames vacíos y advertencias de seguridad.
- **Iconografía**: Agregado icono de **Upload** (`PxUpload`) al sistema de iconos pixel-art.

---

## 2026-04-11
**8 commits realizados**

- **Fix**: Corregido bug que causaba que el Icon Studio se abriera con el canvas vacío debido a colisiones de persistencia en el `localStorage`.
- **Novedad**: Implementación de **Icon Studio**. Ahora puedes editar cualquier icono del sistema directamente en el editor de sprites desde `/icon-preview`.
- **Mejoras**: Refinamiento geométrico de iconos circulares (**Undo**, **Redo**, **Rotate**, **Moon**) basado en grillas de píxeles manuales.
- **Mejoras**: Fase 3 de rediseño de iconos: Metáfora de **Espejo** para Flips, **Engranaje 3D** premium y **Caja de Suministros**.
- **Mejoras**: Rediseño de iconos críticos (**Themes**, **Layers**, **Config**, **Fill**) para mayor claridad semántica.
- **Mejoras**: Fase 2 de rediseño de iconos con detalles mecánicos y texturas avanzadas.
- **Agregado**: Laboratorio de Iconos (`/icon-preview`) para previsualización y desarrollo en tiempo real (solo en localhost).
- **Utilitario**: Agregada función "DEBUG: COPIAR JSON" en el menú de exportación (visible solo en localhost).

---

## 2026-04-10
**7 commits realizados**

- **Agregado**: Navegador de Assets universal con búsqueda por nombre/tags y soporte para importar creaciones propias ("Mis Sprites").
- **Agregado**: Sistema de composición inteligente con remapeo automático de paletas y aplanado de capas al importar assets multi-capa.
- **Agregado**: Etiquetas (Tags) con normalización y sugerencias inteligentes por categoría.
- **Agregado**: Panel de metadatos (Categoría y Descripción) para una organización profesional.
- **Agregado**: Filtrado avanzado multi-select en la galería (soporta combinaciones como `#warrior #fire`).
- **Mejoras de interfaz**: Restricciones de tamaño en tiempo real (solo 16x16 dentro de 32x32) para facilitar la composición coherente.
- **Mejoras de interfaz**: Consistencia visual en miniaturas con fondo de canvas pixel-art y alineación perfecta.
- **Mejoras de interfaz**: Rediseño de diálogos de confirmación con iconos pixel-art personalizados.
- **Corregido**: Bug crítico de recursión infinita al cambiar de herramienta con una selección activa.
- **Utilitario**: Implementación de persistencia robusta en LocalStorage y detección de cambios sin guardar.
- **Utilitario**: Creación del registro histórico completo (**CHANGELOG.md**) desde el origen del proyecto.

---

## 2026-04-09
**10 commits realizados**

- **Agregado**: Sistema global de **Undo / Redo** para todas las acciones del editor (capas, colores, frames).
- **Agregado**: Funcionalidad "Merge Layer Down" para combinar capas.
- **Agregado**: Rate limiting preventivo (10 llamadas/día) para el uso de IA.
- **Mejoras de interfaz**: Implementación del **"Studio Layout"** (Palette a la izquierda, Configuración a la derecha).
- **Mejoras de interfaz**: Nomenclatura de colores profesional (Basada en distancias cromáticas).
- **Corregido**: Habilitado **TS Strict Mode** en todo el proyecto; resueltos más de 50 errores de nulabilidad.
- **Utilitario**: Migración completa del estado del editor de React Context a **Zustand** para mayor estabilidad.

---

## 2026-04-08
**25 commits realizados**

- **Agregado**: Herramienta de **Selección** con soporte para Mover, Copiar, Pegar y Eliminar fragmentos.
- **Agregado**: Soporte para exportación en formato **GIF** animado.
- **Agregado**: Funcionalidades de navegación pro: **Zoom**, Paneo (Mouse3) y Borrado rápido (Mouse2).
- **Agregado**: Panel de creación de sprites "Desde Cero" con soporte para múltiples tamaños (16x16, 32x32).
- **Mejoras de interfaz**: Rediseño premium del panel de IA y el catálogo de activos con filtros contextuales.
- **Corregido**: Sincronización de paletas al clonar o importar props.
- **Utilitario**: Refactorización técnica: Separación de lógica en **7 sub-hooks especializados** y suite de 21 tests unitarios.

---

## 2026-04-07
**11 commits realizados**

- **Agregado**: Generación de animaciones de **"Ataque Mágico" (Casting)** con efectos procedurales.
- **Agregado**: Sistema de upscale inteligente de assets de 16px a 32px preservando el estilo pixel-art.
- **Mejoras de interfaz**: Playback de animaciones integrado en el footer del editor para feedback en tiempo real.
- **Corregido**: Error de renderizado en `SpriteSheetCanvas` al mezclar frames de distintos tamaños.
- **Utilitario**: Adopción de **TanStack Query (React Query)** para la gestión de datos asíncronos con Supabase.

---

## 2026-04-06
**12 commits realizados**

- **Agregado**: Flujo completo de recuperación de contraseñas y correos de confirmación.
- **Corregido**: Normalización de la estructura de capas para que el sistema sea opcional y retrocompatible.
- **Utilitario**: Conexión base con **Supabase Auth & Database**; configuración de políticas RLS.

---

## 2026-04-05
**13 commits realizados**

- **Agregado**: Sistema de **Capas (Layering)** profesional con visibilidad, bloqueo y opacidad.
- **Agregado**: Generación de animaciones multi-capa asistida por IA (Gemini 2.5 Flash).
- **Agregado**: Herramientas avanzadas: Espejo (Mirror) y Rotación con cálculo de Centro de Masa.
- **Mejoras de interfaz**: Implementación de **Onion Skinning** para previsualizar frames adyacentes.
- **Corregido**: Estabilidad del motor de exportación PNG.

---

## 2026-04-04
**7 commits realizados**

- **Mejoras de interfaz**: Refactorización del editor a un layout más robusto (Holy Grail layout).
- **Agregado**: Soporte inicial para resoluciones de 32x32 en el motor de renderizado.
- **Corregido**: Sincronización de estado entre el editor y la base de datos asíncrona.

---

## 2026-04-03
**4 commits realizados**

- **Agregado**: Primer editor de píxeles funcional con herramientas de pincel básicas.
- **Agregado**: Sistema de gestión de frames inicial para animaciones.
- **Corregido**: Fallbacks de animación en previsualización de assets del catálogo.

---

## 2026-04-02
**18 commits realizados**

- **Agregado**: Integración completa con **Supabase** (Auth, Postgres, RLS).
- **Agregado**: Panel de **Dashboard** para gestión de proyectos y persistencia del usuario.
- **Agregado**: **Landing Page** interactiva con secciones de héroe y previews en vivo.
- **Agregado**: Motor inicial de IA (Gemini) para generación de sprites desde texto.
- **Agregado**: Catálogo de assets público con sistema de filtrado dinámico.
- **Utilitario**: Implementación de contexto de paleta de colores editable.

---

## 2026-04-01 (Genesis)
**6 commits realizados**

- **Utilitario**: Creación del repositorio y configuración inicial de **Vite, React y TypeScript**.
- **Mejoras de interfaz**: Definición de la estética base (Dark mode, fuentes pixel-art).
- **Agregado**: Prototipo inicial de la grilla de píxeles 16x16 y motor de dibujo básico.
