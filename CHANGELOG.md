# CHANGELOG - Pixel Sprite Studio

El registro histórico completo de la evolución del proyecto, desde su concepción hasta hoy.

---

## 2026-09-22 (Hoy)
**7 commits realizados**

- **Seguridad**: **Edge Functions con autenticación obligatoria y cuota atómica**. Nuevo `supabase/functions/_shared/` (auth, cuota, validación, CORS configurable, timeouts, parseo de LLM). Las tres funciones vivas (`generate-sprite-fal`, `generate-perspective-fal`, `generate-animation`) verifican el JWT antes de cualquier llamada externa, validan el input, consumen la cuota diaria mediante el RPC `increment_ai_usage` (atómico, verificado con 15 llamadas concurrentes) y responden errores sin filtrar detalles internos. Se eliminó `generate-sprite` (Gemini), que ningún cliente invocaba. 17 tests con `deno test`.
- **DB**: **Migración de robustez**. Slug de proyecto único por usuario (`UNIQUE (user_id, slug)`), `updated_at` con trigger en `projects` y `project_sprites`, límite de 2 MB en `asset_data`, políticas RLS reescritas con `(select auth.uid())` y `EXISTS`. Verificado aislamiento entre usuarios con psql.
- **Refactor**: **Header único del editor**. `EditorHeader` con props `variant`, `backTo` y `syncStatus` reemplaza al header duplicado de `SpriteStudio`. `ExportMenu` e `ImportButton` compartidos: una sola fuente para exportar e importar. Renombrado con doble click y estado en el store; guardar crea checkpoint en ambos contextos.
- **Refactor**: **Cliente Supabase único y tipado**. `src/lib/supabase.ts` usa `createClient<Database>` y deriva `Project`/`ProjectSprite` del esquema; `toJson`/`fromJson` son la única frontera JSONB. Eliminado el cliente huérfano de `integrations/`. Los cuatro hooks de IA pasan por `invokeAiFunction`, que exige sesión.
- **Fix**: **Sesión expirada, snapshot local y listados**. Manejo global de 401/JWT expirado en `QueryClient` con signOut y toast; el snapshot de localStorage lleva un hash del asset origen y se descarta si la DB es más nueva; el listado de sprites ya no descarga `versions`; la purga de historial avisa con un toast en vez de ser silenciosa. Slug de proyecto con reintento ante 23505.
- **Fix**: Corregidas 3 violaciones de `rules-of-hooks` (`useGenerateSpriteFal`, `IconPreview`) y los 2 errores de `tsc` preexistentes.
- **Chore**: **Limpieza**. Borrados 5 archivos muertos de `src/`, 30 componentes shadcn sin uso, 25 dependencias huérfanas (59 → 34), `scratch/`, `.lovable/` y los lockfiles de bun. `npm audit fix` reduce las vulnerabilidades de 27 a 6 sin cambios breaking. `package.json` pasa a `pixel-sprite-studio@0.1.0` con `packageManager: npm`.
- **Infra**: **CI en GitHub Actions**: lint, `tsc`, tests, build y `deno check` de las Edge Functions en cada push y PR. ESLint con `no-unused-vars` activo y `no-explicit-any`/`ban-ts-comment` como warnings (deuda visible: 183 warnings).
- **Docs**: **`AGENTS.md` reescrito contra el código real** (slices de Zustand, `SpriteStudio` como editor principal, fal.ai + Gemini, cliente único, contratos de las Edge Functions). README con proveedores de IA correctos y estructura actualizada.

- **Docs**: **Auditoría técnica para retomar el proyecto** (`AUDIT_TECNICA.md`). Cronología de la duplicación del header del editor (commit `1b0e1b8`), inventario de código muerto y dependencias sin uso, hallazgos de seguridad en Edge Functions (dos funciones de fal.ai sin autenticación, límite diario eludible por concurrencia), desincronización de `CLAUDE.md` con la arquitectura real de slices, y plan de retoma en 5 fases.
- **Fix**: **`.dockerignore` con `**/.env`**. La imagen de Docker incluía `supabase/functions/.env` porque el patrón `.env` solo matchea en la raíz del contexto.

- **Export**: **PNG del layer actual**. Nueva opción en el menú EXPORTAR que descarga solo el layer activo en el frame que se está editando como imagen estática, sin componer con el resto de los layers y a opacidad completa. El nombre del archivo incluye el asset, el layer y el índice de frame.

- **Infra**: **Stack local completo con Docker + Supabase CLI**. Añadidos `Dockerfile`, `docker-compose.yml` y `.dockerignore` para correr el frontend en un contenedor con hot reload. `supabase/config.toml` ahora define puertos propios (54421-54429) para convivir con otros proyectos Supabase locales, y habilita las cuatro Edge Functions en local.
- **Seguridad**: **Higiene de secrets**. `.env` dejó de estar versionado (solo se commitean los `.env.example`), se eliminó el prefijo `VITE_` del connection string de Postgres (Vite lo habría expuesto al browser) y el cliente de Supabase generado por Lovable ya no tiene URL ni anon key hardcodeadas: lee `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` como el resto del código, lo que permite apuntar a local o nube cambiando solo `.env.local`.
- **Docs**: Sección "Local stack" en el README con comandos, tabla de puertos y modelo de secrets (frontend vs Edge Functions, local vs nube).

---

## 2026-05-07
**1 commit realizado**

- **Proyecto**: **Sistema de Configuración de Proyectos (ProjectConfig)**. Implementado flujo de trabajo basado en reglas globales de proyecto. Ahora, al crear un "Nuevo Mundo", se define la direccionalidad (1-Way vs 4-Way) y la estética (8-Bit, Fantasy, Gameboy, etc.). Estas reglas persisten en la base de datos y gobiernan dinámicamente todo el estudio.
- **IA**: **Generación Condicionada por Contexto**. Las Edge Functions (`generate-sprite-fal`, `generate-animation`, `generate-perspective-fal`) ahora reciben la configuración del proyecto. Se inyectan reglas rígidas en los prompts técnicos para asegurar que los sprites y animaciones generados respeten la perspectiva y el estilo visual del juego automáticamente.
- **UI/UX**: **Interfaz Adaptativa Pro**. El editor ahora oculta controles irrelevantes (como perspectivas frontales/traseras en juegos de scroll lateral) y pre-configura el motor de anatomía en la orientación correcta.
- **IA**: **Wizard de Creación Inmersivo**. Rediseñado el flujo de creación de proyectos en el Dashboard con un asistente de 3 pasos ("Nuevo Mundo") con estética pixel-art y selección visual de reglas.
- **Fix**: **Sincronización de Perspectiva Post-Caché**. Corregido el bug donde el LocalStorage mantenía perspectivas de proyectos anteriores; ahora se fuerza el estado correcto basado en la configuración del proyecto al abrir cualquier asset.

---

## 2026-05-06
**3 commits realizados**

- **Animación**: **Procedural FX Panel**. Implementado un nuevo panel de control para aplicar transformaciones procedurales (mover, rotar, expandir, colapsar) a miembros específicos basados en el motor de anatomía. Permite manipular directamente píxeles de cabeza, torso, brazos y piernas con parámetros de offset y ángulo.
- **Animación**: **Custom Animation Flow**. Añadida la posibilidad de crear animaciones personalizadas ("Custom") desde cero. El flujo permite definir un nombre y clona automáticamente el frame actual para inicializar la secuencia, facilitando la creación manual asistida por FX.
- **UI/UX**: **Navegación FX y Tooltips**. Integrada una nueva pestaña en el sidebar con el icono `PxSparkles` etiquetada como "FX" para el acceso rápido a herramientas procedurales. Se mejoraron los tooltips de navegación para mayor claridad.

---

## 2026-04-27
**4 commits realizados**

- **Animación**: **Anatomy Builder API (Walk, Run, Jump)**. Refactorización masiva del motor de animaciones procedimentales mediante un patrón Fluent Builder (`animate_body`). Se reescribieron los ciclos completos de Walk (8 frames), Run (con suspensión aérea) y Jump. El código es ahora 100% declarativo, reduciendo drásticamente el boilerplate y garantizando una sincronización perfecta (squash/stretch) entre todas las extremidades y el torso.
- **Animación**: **IDLE & BREATH (Anatomy Engine)**. Implementado el ciclo completo de animación IDLE con sistema de respiración y flexión de rodillas basado en anatomía. Se actualizaron las funciones de transformación para soportar desplazamientos con rotación y se solucionaron errores de ghosting y desconexiones de cintura.
- **UI/UX**: **Previsualización Dinámica Pro**. Rediseñado el panel de previsualización de animaciones para soportar dinámicamente assets de 64x64 y 128x128. Las escalas ahora se ajustan automáticamente y el panel utiliza un sistema de "hug content" para eliminar espacios vacíos alrededor del sprite.
- **Mejora**: **Nombrado Inteligente de Colores**. Implementado un sistema de resolución de nombres que añade automáticamente matices (shades) estilo Tailwind (50-950) cuando hay duplicados en la paleta. Ahora las importaciones y rampas de color son mucho más fáciles de navegar (ej. "Charcoal Gray 600", "Charcoal Gray 700").
- **Fix**: **Blindaje de Persistencia (QuotaExceededError)**. Migrado el sistema de caché local (localStorage) al motor de serialización RLE+Delta. Esto reduce el uso de disco hasta en un 97% para assets de 128px. Además, se ha implementado una estrategia de "Auto-Purge" que libera espacio de otros proyectos antiguos si el almacenamiento del navegador está al límite, priorizando siempre el trabajo actual.
- **Rendimiento**: **Motor de Compresión RLE+Delta**. Implementado un nuevo sistema de serialización tipado (`spriteDto`) que combina Run-Length Encoding con codificación Delta. Logra ahorros de hasta **-97%** en animaciones complejas y evita la expansión en frames con dithering.
- **Optimización**: **Hashing FNV-1a**. Reemplazado `JSON.stringify` por un hash numérico ultra-rápido en el deduplicador de `localStorage`, reduciendo el tiempo de procesamiento en un 500% para sprites de 64x64+.
- **QA**: **Cobertura de Almacenamiento**. Añadida suite de 26 tests específicos para el ciclo de vida de los datos, cubriendo todos los tamaños soportados (16 a 128px) y garantizando retrocompatibilidad.

---

## 2026-04-26
**17 commits realizados**

- **Novedad**: **GIF Reverse Engineering Wizard**. Implementado motor de ingeniería inversa que permite desglosar archivos GIF, seleccionar rangos de frames y mapearlos automáticamente a orientaciones (Front/Side/Back) y animaciones.
- **Fidelidad**: **Control de Fondo en Importación**. Añadido toggle para desactivar la eliminación automática de fondo, evitando la pérdida de píxeles en assets con colores similares al fondo.
- **Backend**: **Sincronización de Slugs**. Estabilizada la creación de sprites desde cero mediante el uso de la columna física `slug` en Postgres, eliminando errores de restricción NOT NULL.
- **UI/UX**: **Reactividad de Paleta**. Promocionado el estado de `activeColorKey`, `tool`, `brushSize` y `mirrorX` al store global. **Solucionado el problema del primer clic en la paleta**.
- **Refactor**: **usePixelEditor Controlado**. Convertido el motor de dibujo en un hook controlado para garantizar sincronización perfecta con la UI y atajos de teclado.
- **QA**: **Blindaje de Tests Unitarios**. Implementada limpieza automática de `localStorage` y mock de `crypto.randomUUID`, estabilizando la suite de 43 tests.
- **Animación**: **Caminata Pro (Richard Williams)**. Restaurado el ciclo de 4 fases con ritmo vertical preciso y corregida la coordinación cruzada brazo-pierna.
- **UI**: **Cursores Dinámicos**. Implementado soporte para cursores contextuales (`row-resize`, `col-resize`) al interactuar con el esqueleto anatómico.
- **Fix**: **Interacción de Anatomía**. Corregido el bug donde se dibujaban píxeles accidentalmente al arrastrar las líneas guía.

---

## 2026-04-25
**5 commits realizados**

- **Animación**: **Sistema basado en Máscaras de Anatomía**. Migrado el motor de animación para utilizar un sistema de máscaras aditivas, corrigiendo errores de piezas desaparecidas y eliminando el efecto de "smearing" en los bordes durante las transformaciones.
- **Refactor**: **Modularización de UI**. Desglosado el componente monolítico `SpritePixelEditor` en hooks y sub-componentes especializados, facilitando la escalabilidad del lienzo de dibujo.
- **Roadmap**: **Reestructuración Estratégica**. Dividido el roadmap oficial en tres archivos (`ROADMAP_COMPLETED.md`, `ROADMAP_NEXT.md`, `ROADMAP_IMMEDIATE.md`) para separar historial, visión a futuro y ejecución inmediata.

---

## 2026-04-24
**10 commits realizados**

- **Estructura**: **Ecosistema de Proyecto**. Agregada al roadmap la Fase 9 que evoluciona la herramienta de un editor de sprites sueltos a una suite completa de Game Assets, incluyendo soporte planeado para tipografía por IA.
- **Workflow**: **Sincronización Total de Perspectivas**. Rediseñado el sistema de navegación para que el canvas, las miniaturas, la previsualización de animación y el panel de anatomía operen sobre una base de datos unificada (Front, Side R/L, Back).
- **Animación**: **Asociación Contextual y Auto-Selección**. Implementado filtrado dinámico de la biblioteca de animaciones según la vista activa y sistema de pre-selección automática de `Idle` al cambiar de perspectiva.
- **Fix**: **Persistencia de Base en Orientación**. Corregido el bug que reseteaba la vista al Frente al interactuar con el botón BASE; ahora respeta el frame base de la orientación actual (Side/Back).
- **IA**: **Cableado de Perspectiva Back**. Integrado el frame de espalda (idx 2) como destino oficial para la generación por IA y sincronizado con el motor de anatomía.
- **Herramienta**: **Estabilización de Selección y Resize**. Rediseño total del motor de transformación usando deltas absolutos y sistema de **Auto-Lift**, eliminando el "drift" de redondeo y permitiendo redimensionar o borrar selecciones al instante sin necesidad de moverlas primero.
- **Rendimiento**: **Optimización del Pincel Pro**. Implementada detección de cambios por celda y suspensión de cálculos anatómicos durante el trazo, restaurando la sensación de respuesta instantánea y eliminando el delay en sprites de alta resolución.
- **Persistencia**: **Motor de Compresión por Hashing**. Implementado sistema de deduplicación estructural para `localStorage` que reduce drásticamente el tamaño de los datos al reutilizar frames idénticos, permitiendo restaurar el historial completo de versiones (Checkpoints) sin superar el límite de 5MB del navegador.
- **Arquitectura**: **Modularización de Utilidades**. Extraída la lógica de compresión a un helper independiente con cobertura total de tests unitarios.
- **Fix**: **Estabilidad en Animación 32x32**. Corregidos errores de acceso a arrays mediante el forzado de redondeo de coordenadas anatómicas en todo el flujo de generación.
- **Anatomía**: **Motor de Desmembramiento (Dismemberment)**. Evolución radical del sistema de límites a un motor de miembros funcional con soporte para configuraciones específicas por orientación (Frente, Perfil, Espalda).
- **IA**: **Chroma Key Inteligente (HSL)**. Reemplazada la detección de fondo verde por un motor basado en HSL que elimina halos con mayor precisión y suprime la filtración de color verde en los bordes del sprite.
- **UI/UX**: **Memoria de Paneles**. El panel de previsualización de animación ahora persiste su estado expandido/colapsado entre sesiones.
- **UI/UX**: **Optimización de Espaciado**. Reducidos gaps y paddings del layout para maximizar el área de canvas disponible.
- **Iconografía**: **Consistencia PxBone**. Creado icono pixel-art de hueso (`PxBone`) y reemplazado el ícono Lucide en el sidebar y panel de anatomía para unificar la identidad visual.
- **Anatomía**: **Pincel de Miembros**. Implementado soporte para "pintar" la selección de píxeles en el motor de anatomía, permitiendo arrastrar el puntero para añadir/eliminar regiones de miembros de forma fluida.
- **Fix**: **Bloqueo de Guías**. Deshabilitada la interacción con las líneas guía (huesos) mientras se están editando los píxeles de un miembro, evitando arrastres accidentales.
- **Fix**: **Posicionamiento de Icono**. Ajustada la posición del icono `PxBone` para evitar overflow lateral en contenedores estrechos.

---

## 2026-04-23
**8 commits realizados**

- **IA**: **Migración a Seedream V4 Edit**. Actualizado el motor de Img2Img para usar el modelo de Bytedance (`fal-ai/bytedance/seedream/v4/edit`), optimizando la consistencia visual en la generación de perspectivas laterales.
- **Anatomía**: **Sistema de Pivotes Óseos**. Implementada detección automática de hombros, caderas y rodillas en `analyzeBodySegments`, permitiendo animaciones basadas en rotación real de miembros.
- **Mejora**: **Ataque con Rotación**. Rediseñada la animación de ataque para usar arcos de rotación desde el hombro, logrando un movimiento mucho más dinámico y natural.
- **Arquitectura**: **Refactor Modular de Animación**. Migrado todo el motor de transformación y generación procedural a una nueva librería especializada en `src/lib/sprite/`. Separada la lógica de anatomía, transformaciones atómicas y generadores por tipo (`walk`, `idle`, `combat`, `movement`).
- **Mejora**: **Ciclos de 8 Frames (High Fidelity)**. Actualizados los algoritmos de caminata para seguir el estándar de 8 frames (estilo Richard Williams), logrando un movimiento mucho más fluido y profesional.
- **Mejora**: **Física de Rodillas (Knee Flexion)**. Implementada lógica de flexión de rodillas y estabilidad de torso en todo el catálogo de animaciones procedurales, eliminando la rigidez y el "jitter" vertical excesivo.
- **Novedad**: **Depurador de Generación IA**. Implementado botón de exportación de referencia (debug) que permite descargar la imagen exacta enviada a la IA para diagnóstico.
- **Mejora**: **Referencia HD (16x Upscale)**. Optimizado el envío de imágenes a la IA con un escalado pixel-perfect de 16x (512px) que elimina la borrosidad y mejora drásticamente el reconocimiento anatómico.
- **Arquitectura**: **Especialización de Edge Functions**. Separada la lógica de generación en dos funciones independientes: `generate-sprite` (Txt2Img/Schnell) y `generate-perspective` (Img2Img/Kontext).
- **Mejora**: **Fidelidad de Rotación (Kontext)**. Migrada la generación de perspectivas al modelo Flux Pro Kontext, optimizado para mantener la consistencia del personaje en giros de 90 grados.
- **Mejora**: **Prompting Imperativo**. Refinados los prompts de rotación para forzar vistas de perfil y evitar el sesgo de "frente" del modelo original.
- **Fix**: **Estabilidad de Tipos**. Resueltos errores de sintaxis y tipado en los hooks de generación y el bridge del editor, asegurando compatibilidad con el nuevo flujo de trabajo.

---

## 2026-04-22
**6 commits realizados**

- **Novedad**: **Consistencia de Perspectivas (IA)**. Implementado sistema Img2Img que permite generar vistas laterales y traseras basadas en la vista frontal, manteniendo coherencia de diseño.
- **Mejora**: **Preview de Animación Flotante**. Rediseñado el panel de previsualización como una ventana flotante (Picture-in-Picture) escalable y adaptable que optimiza el espacio de trabajo.
- **Mejora**: **Navegación de Sidebar Inteligente**. Implementado un sistema de pestañas dinámicas que solo expande la opción activa, eliminando la necesidad de scroll vertical.
- **Mejora**: **Fidelidad de IA (Nearest Neighbor)**. Optimizado el envío de referencias a la IA mediante escalado pixel-perfect, eliminando borrosidad y mejorando la coherencia en rotaciones.
- **Mejora**: **Remapeo Inteligente de Color**. Nuevo motor de sincronización de paletas que protege los índices originales del sprite al integrar resultados de la IA, evitando cambios de color no deseados.
- **Limpieza**: **Depuración de Interfaz**. Eliminada la pestaña redundante de Historial Cloud y corregidos iconos duplicados en el botón de generación IA.
- **Estructura**: **Dualidad de Roadmap**. Restructurada la planificación en dos niveles: Estratégico (Visión) y Táctico (Ejecución Inmediata) para mejorar el foco del desarrollo.
- **Fix**: **Tooltips Portaled**. Corregido error de clipping y scrollbars horizontales en los tooltips (especialmente Reset Zoom) mediante el uso de Portals de Radix UI.

---

## 2026-04-21
**9 commits realizados**

- **Novedad**: **URLs Amigables (Slugs)**. Migración a formato `/project/id-nombre` y `/editor/id-nombre` para mejorar el SEO y permitir compartir enlaces legibles.
- **Novedad**: **Sprite Studio (Full Display)**. Migración completa del editor de un modal a una página dedicada (`/project/:id/editor/:spriteId`) para máxima inmersión.
- **Novedad**: **Autosave Cloud**. Implementado sistema de sincronización automática y silenciosa con 3s de debounce e indicadores de estado en tiempo real.
- **Novedad**: **Borrador Masivo (Magic Eraser)**. Nueva herramienta para eliminar todas las instancias de un color en el frame activo con un solo click.
- **Mejora**: **Importación de Alta Fidelidad**. Nuevo motor de pixelización con promediado de bloque (Box Sampling) que elimina el ruido en imágenes fuente de alta resolución.
- **Mejora**: **Interfaz de Importación**. Rediseño estético total del modal con grilla de puntos de fondo, efectos de escaneo dinámico y esquineros pixel-art.
- **Fix**: **Estabilidad en Toolbar**. Corregido error de profundidad de renderizado ("Maximum update depth") relacionado con tooltips y re-definición de componentes.
- **Fix**: **Crash de Inicialización**. Resuelto error crítico de `subscribe is not a function` en el Studio mediante una refactorización estructural de la inyección del Store.
- **Fix**: **Iconografía Faltante**. Solucionados errores de referencia por iconos no importados tras la reorganización de la barra de herramientas.
- **Mejora**: **Jerarquía de Navegación**. Reordenadas las pestañas del editor (Anims, Layers, Bones, Themes, Config) para priorizar el flujo creativo sobre la configuración técnica.
- **Mejora**: **Encabezado Persistente**. Implementado campo de nombre de asset editable directamente en el breadcrumb superior para una gestión de metadatos más fluida.
- **Mejora**: **Herramientas de Transformación**. Refinado el feedback visual de la herramienta de selección con manejadores de redimensión y cursores contextuales.

---

## 2026-04-19
**1 commit realizado**

- **Novedad**: **Garbage Collector de Frames**. Implementado sistema automático de limpieza de frames huérfanos que ya no están asociados a ninguna animación o capa para optimizar el almacenamiento.

---

## 2026-04-15
**5 commits realizados**

- **Novedad**: Sistema de **Anatomía de 4 Segmentos**. Implementado control total de Cuello, Cintura y Ancho de Torso con guías visuales inteligentes que solo aparecen en la pestaña **BONES**.
- **Mejoras**: Sincronización de extremidades **"Limb-Aware"**. Balanceo de brazos dinámico basado en los límites laterales del torso definidos por el usuario.
- **Mejoras**: **Rediseño total de Animaciones Predefinidas**. Refactor de `Idle`, `Walk`, `Attack`, `Hurt`, `Jump` y `Cast` con inercia física y deformación anatómica.
- **Mejoras**: Nuevas primitivas de movimiento: `leanBody` (inclinación), `squash` (compresión rítmica) y `shiftArea` (desplazamientos localizados).
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
