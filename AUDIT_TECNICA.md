# Pixel Sprite Studio — Auditoría Técnica para Retomar el Proyecto

> Generado: 2026-09-22
> Complementa a `AUDIT.md` (auditoría estratégica de producto, 2026-04-08). Esta cubre código, backend, seguridad, deuda y documentación.
> Último commit funcional antes de esta auditoría: `a59fc97` (2026-05-07). El proyecto estuvo 4 meses y medio sin actividad.

---

## 0. Resumen ejecutivo

El proyecto está en buen estado para retomarse: compila, los 87 tests pasan, el stack local corre completo en Docker y la arquitectura de Zustand por slices es sólida. Los problemas reales son cuatro:

1. **Dos Edge Functions gastan créditos de fal.ai sin autenticar al usuario.** Cualquiera con la URL puede generar imágenes a tu costo. Es lo primero a arreglar.
2. **El límite diario de IA se puede eludir** con llamadas concurrentes (read-then-write sin atomicidad).
3. **La documentación describe una arquitectura que ya no existe.** `CLAUDE.md` habla de 7 sub-hooks y de un editor modal; el código tiene 9 slices de Zustand y una página `SpriteStudio`. Cualquier asistente de IA que lea la doc va a trabajar contra un modelo mental equivocado.
4. **Duplicación estructural**: dos headers de editor, dos clientes de Supabase, dos hooks de generación de sprites, tres lockfiles. Nada de eso se comparte, todo diverge.

| Métrica | Valor |
|:---|:---|
| Líneas TS/TSX (sin tests ni `ui/`) | ~24.000 en 224 archivos |
| Archivos de test | 13 (87 tests, todos pasan) |
| Errores de tipos (`tsc`, strict off) | 2 |
| Problemas de ESLint | 187 (161 errores, 26 warnings). 246 usos de `any` en todo el repo |
| Violaciones de `rules-of-hooks` (bugs reales) | 3 en 2 archivos |
| Dependencias declaradas | 59 (4 sin ningún uso, 38 solo por shadcn) |
| Dependencias con major nuevo | 27 (React 19, Vite 8, Tailwind 4, Router 7, Vitest 5, TS 7) |
| `npm audit` | 27 vulnerabilidades: 2 críticas, 17 altas. Todas con fix disponible |
| CI | No existe |
| Versión en `package.json` | `0.0.0`, nombre `vite_react_shadcn_ts` |

---

## 1. Por qué hay dos menús de EXPORTAR

### Cronología

| Fecha | Commit | Qué pasó |
|:---|:---|:---|
| 2026-04-07 | `eeebfdc` | Se modulariza el modal: nace `EditorHeader.tsx` con el menú de exportación. |
| 2026-04-08 | `6e18cff` | Se consolida el dropdown (PNG, PNG con etiquetas, GIF) en `EditorHeader`. |
| **2026-04-21** | **`1b0e1b8`** | **Migración a página dedicada `SpriteStudio.tsx`.** Se copia el header entero por copy-paste y se agrega el flag `hideHeader` a `EditorLayout` para apagar el original. |
| 2026-04-21 → 05-07 | 10 commits | Todos tocan `SpriteStudio.tsx`. Ninguno toca `EditorHeader.tsx`, congelado desde el 15 de abril. |

No fue una extracción a componente compartido: fue una copia literal más un flag para silenciar el original. Desde entonces los dos headers divergieron:

| Feature | `EditorHeader` (modal) | `StudioHeader` (página) |
|:---|:---|:---|
| Guardar | `handleSave` | `createCheckpoint` + `handleSave` |
| Renombrar | click simple, estado en el store | doble click, estado local |
| Debug: copiar JSON | sí (localhost) | no |
| Modo icono / Regenerar con prompt | sí | no |
| Indicador de cambios | punto ámbar | "Autoguardando / Sincronizado" |

### ¿El modal está muerto?

Casi. `ProjectWorkspace.tsx:533` dice textualmente que el modal ya no se usa y redirige al Studio. `App.tsx` no lo monta en ninguna ruta. El único consumidor es `src/pages/IconPreview.tsx`, una herramienta interna limitada a localhost para editar los iconos del sistema. `EditorHeader.tsx` existe solo para eso.

### Recomendación

Extraer un `ExportMenu` compartido que reciba el store, y unificar el header en un solo `EditorHeader` con props para las variantes (modo icono, prompt). Después, decidir si `IconPreview` justifica mantener el modal o si puede usar `SpriteStudio` con un flag. Hasta que eso pase, cada feature nueva de exportación hay que agregarla dos veces, como pasó hoy con "PNG layer actual".

---

## 2. Hallazgos por severidad

### CRÍTICO

**C1. `generate-sprite-fal` no valida el JWT.** `supabase/functions/generate-sprite-fal/index.ts:20-31` decodifica el token con `atob` sin verificar la firma y, si falla, sigue con `userId = "anonymous"`. Con `verify_jwt = false` en `config.toml`, el endpoint es público. No aplica `DAILY_LIMIT`, y el `upsert` de uso no incrementa `call_count`. Verificado en código.
→ Reemplazar por `supabaseAdmin.auth.getUser(token)` y el chequeo de límite que ya tiene `generate-sprite/index.ts:30-63`. Rechazar con 401 si no hay usuario.

**C2. `generate-perspective-fal` no tiene autenticación ni tracking.** `generate-perspective-fal/index.ts:12-18` lee el body y llama a fal directamente. No lee `Authorization`, no toca `user_ai_usage`, usa `serve` de `std@0.168.0` (deprecado) y responde 400 a cualquier error. Verificado en código.
→ Misma corrección que C1. Migrar a `Deno.serve`.

### ALTO

**A1. Límite diario eludible por concurrencia.** `generate-sprite/index.ts:50-63,200-212` y `generate-animation/index.ts:49-62,196-208`: leen `call_count`, llaman al modelo, y recién después hacen upsert con `usage+1`. Veinte requests en paralelo pasan todas.
→ Función SQL atómica `increment_ai_usage(p_limit)` con `INSERT ... ON CONFLICT DO UPDATE ... RETURNING call_count`, invocada por RPC **antes** de llamar al modelo.

**A2. Inputs sin acotar.** `size` sin validar en `generate-sprite:66`; `baseFrame` completo interpolado al prompt en `generate-animation:65-97`; `image_url` sin validar en `generate-sprite-fal:47`.
→ Whitelist `size ∈ {16,32,64,128}`, `prompt ≤ 300`, `animationName` contra enum, `image_url` con `new URL()` y host permitido.

**A3. Sin timeouts.** Ningún `fetch` a Gemini o fal tiene `AbortSignal`. Gemini 2.5 Pro con 8000 tokens de salida puede superar el wall-clock del runtime y devolver un error opaco.
→ `AbortSignal.timeout(90_000)` y mapear a 504.

**A4. No existe `supabase/functions/_shared`.** CORS, auth, límite, limpieza de JSON y validación de píxeles están copiados entre `generate-sprite` y `generate-animation`, y las funciones de fal tienen versiones divergentes. C1 y C2 son consecuencia directa.
→ `_shared/cors.ts`, `_shared/auth.ts` (`requireUser`), `_shared/usage.ts` (`consumeQuota`), `_shared/validate.ts`.

**A5. Bugs de hooks condicionales.** `src/hooks/useGenerateSpriteFal.ts:23` llama a `useSpriteEditorStoreApi()` dentro de un `try/catch`, y `src/pages/IconPreview.tsx:26-27` llama a `useState` después de un `return` condicional. Viola las reglas de hooks; funciona por accidente.
→ Pasar el store como parámetro opcional al hook, y mover el early return de `IconPreview` debajo de los hooks.

**A6. Vulnerabilidades en dependencias.** 2 críticas (`tar`, `vitest`) y 17 altas (`vite`, `react-router-dom`, `postcss`, `rollup`, `ws`...). Todas con fix disponible, varias requieren major.
→ `npm audit fix` para las que no rompen semver; el resto entra en el plan de upgrade (sección 5).

### MEDIO

**M1. `.dockerignore` no excluía `supabase/functions/.env`.** Corregido hoy en esta auditoría: `**/.env` y `**/.env.*`. Verificado construyendo la imagen.

**M2. Slug de `projects` único global.** `projects_slug_key UNIQUE (slug)` en `20260421162500_add_slugs.sql:20`. El chequeo del cliente corre bajo RLS y solo ve proyectos propios: si otro usuario ya tiene `mi-juego`, el insert falla con 23505 sin manejo.
→ `UNIQUE (user_id, slug)` y capturar 23505 con sufijo.

**M3. Estado local pisa a la base de datos.** `useSpriteEditorStore.ts:120-179`: el snapshot en `localStorage` rehidrata sobre el asset recién cargado sin comparar timestamps. Ediciones desde otro dispositivo se sobreescriben en el próximo autosave. Todos los sprites nuevos comparten la clave `pps-editor-new`.
→ Guardar `updated_at` o hash en el snapshot y descartar si la DB es más nueva. Incluir `projectId` en la clave.

**M4. Purga silenciosa de historial y sobre-fetch.** `useProjectQueries.ts:216-219,264,343` vacían `versions` si el JSON supera 1 MB / 500 KB sin avisar. `useProjectSprites:165-181` trae `asset_data` completo para un listado. Sin paginación.
→ Select parcial para listados, columna `updated_at` con trigger, aviso al usuario antes de purgar.

**M5. Esquema.** Sin índice en `projects.user_id`, sin trigger de `updated_at`, sin `CHECK` de tamaño en `asset_data`. Verificado contra el Postgres local.

**M6. Sesión expirada sin manejo global.** `useAuth.tsx` solo escucha `PASSWORD_RECOVERY`; el `QueryClient` no tiene `onError` para 401 y reintenta 3 veces.
→ `QueryCache.onError` que detecte `PGRST301`/401 y haga `signOut()`.

**M7. Modelo de IA desalineado con la doc y el costo.** El código usa `gemini-2.5-pro` (`generate-sprite:5`, `generate-animation:4`); README y CLAUDE.md dicen "2.5 Flash". Pro es varias veces más caro y su presupuesto de thinking consume `maxOutputTokens`, causa probable del error "Invalid JSON from LLM".
→ Decidir Flash vs Pro explícitamente y actualizar docs.

### BAJO

- **B1. RLS correcto.** Políticas completas para `projects` y `project_sprites`. Mejora: `(select auth.uid())` y `EXISTS` para performance.
- **B2. Fuga de detalle en errores.** `details: authError`, cuerpos de error de Gemini y fal van al cliente.
- **B3. CORS `*`** en las cuatro funciones. Aceptable con JWT obligatorio; restringir a `site_url` cuando C1/C2 estén resueltos.
- **B4. `.env` estuvo trackeado** hasta `2e47aad`. Solo contenía la anon key (pública). No requiere rotación.
- **B5. Sin CI.** `.github/` solo tiene `copilot-instructions.md`. Hay `@playwright/test` y config pero cero specs. ESLint tiene `no-unused-vars` apagado.
- **B6. Tres lockfiles** (`bun.lockb` binario obsoleto, `bun.lock`, `package-lock.json`) y sin campo `packageManager`.

---

## 3. Código muerto y duplicado

Calculado por alcanzabilidad transitiva desde `src/main.tsx`: 144 de 196 archivos son alcanzables.

**Código de aplicación muerto (borrar):**

| Archivo | Motivo |
|:---|:---|
| `src/hooks/useGenerateSprite.ts` + `supabase/functions/generate-sprite/` | Reemplazados por la variante fal el 2026-04-09. Nadie los invoca. Es el bloque de código muerto más grande. |
| `src/integrations/supabase/client.ts` + `types.ts` | Cliente tipado de Lovable, 0 importadores. Todo usa `src/lib/supabase.ts` (sin tipar). Paradoja: el bueno es el que nadie usa. |
| `src/pages/Index.tsx` | Sin ruta. Residuo del scaffold. |
| `src/components/NavLink.tsx` | Del template original, nunca usado. |
| `src/lib/pixelCharacter.ts` | Datos hardcodeados sin consumidor. |
| `src/components/ui/use-toast.ts`, `src/hooks/use-mobile.tsx` | Duplicados de shadcn sin uso. |
| `scratch/test_limb_detection.ts`, `.lovable/plan.md`, `bun.lockb` | No deberían estar versionados. |

**Scaffold de shadcn sin uso:** 29 de 48 componentes en `src/components/ui/` no los importa nadie fuera de `ui/`: `accordion`, `aspect-ratio`, `avatar`, `breadcrumb`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `drawer`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `progress`, `radio-group`, `resizable`, `separator`, `sheet`, `sidebar`, `skeleton`, `switch`, `table`, `toggle-group`, `toggle`. Arrastran 38 dependencias de npm que solo existen para ellos (`recharts`, `embla-carousel`, `react-day-picker`, `cmdk`, `vaul`, `input-otp`...). Cuatro dependencias no tienen ningún import: `@hookform/resolvers`, `@types/file-saver` (debería ser devDependency), `events`, `zod`.

**Duplicaciones vivas (unificar):**
- Dos headers de editor (sección 1).
- Dos clientes de Supabase. Unificar en el tipado y derivar `Project`/`ProjectSprite` de `Database` en vez de escribirlos a mano.
- `AGENTS.md` y `CLAUDE.md` son byte a byte idénticos. `CLAUDE.md` debería ser un symlink (en el checkout actual lo es, pero git lo trackea como archivo).
- Los cuatro hooks de IA hacen `fetch` manual a `/functions/v1/...` en vez de `supabase.functions.invoke`.

**Lo que sí se usa** (falsos positivos comunes): `src/lib/assets/` completo (catálogo, paletas, props), `SpritePixelEditor`, `SpritePreview`, `EditorToolbar`, `AssetCard`, `CategoryFilter`.

---

## 4. Documentación desincronizada

`CLAUDE.md` describe la arquitectura anterior al commit `c9394e4` (2026-04-10, "modularizado el store en slices"). Esto es grave porque es el archivo que lee cada asistente de IA al empezar.

| `CLAUDE.md` dice | Realidad |
|:---|:---|
| `useSpriteEditor.ts` orquesta 7 sub-hooks | El archivo no existe. Hay 9 slices en `store/slices/`: `anatomy`, `animation`, `base`, `export`, `frame`, `history`, `layer`, `palette`, `transform`. |
| "the sub-hook pattern in `SpriteEditor/hooks/` is the model to follow" | `SpriteEditor/hooks/` tiene 3 bridges de IA. El patrón a seguir son los slices. |
| `SpriteEditor/` es el "main editor modal" | El editor principal es `src/pages/SpriteStudio.tsx`, que no aparece en la tabla de archivos clave. |
| `ProjectWorkspace.tsx` renderiza `SpriteEditor` | Falso desde `1b0e1b8`. El propio código lo dice en la línea 533. |
| `useGenerateSprite.ts` llama a `generate-sprite` | Muerto. El vivo es `useGenerateSpriteFal.ts`, no documentado. |
| IA vía "Gemini 2.5 Flash" | Sprites y perspectivas usan fal.ai (Seedream v4, Flux Schnell). Animaciones usan Gemini 2.5 **Pro**. |
| `src/integrations/supabase/types.ts` como tipos de DB | Nadie lo importa. El cliente real, `src/lib/supabase.ts`, no figura. |

Los tests en `SpriteEditor/hooks/tests/` conservan los nombres viejos (`useLayerActions.test.ts`, etc.) pero todos testean el store. Son el último fósil de la arquitectura de hooks.

`README.md` repite el error de proveedor de IA y no menciona fal.ai. `AUDIT.md` no cubre ninguno de estos hallazgos.

---

## 5. Plan de retoma sugerido

Ordenado por riesgo y por lo que desbloquea lo siguiente. Cada fase es un PR chico y verificable.

**Fase 0 — Cerrar la puerta (1 día)**
1. C1 + C2 + A4: crear `_shared/` y aplicar auth obligatoria y límite diario a las 4 funciones. Un solo PR.
2. A1: RPC atómica de consumo de cuota.
3. Rotar `FAL_AI_KEY` en la nube después del deploy, por si alguien ya encontró el endpoint.

**Fase 1 — Recuperar el mapa (1 día)**
4. Reescribir `CLAUDE.md` contra el código real: slices, `SpriteStudio`, fal.ai, cliente de Supabase real. Hacer `AGENTS.md` un symlink real.
5. Borrar el código muerto de la sección 3 y los 29 componentes shadcn sin uso. Dejar un solo lockfile y declarar `packageManager`.
6. CI mínimo: `lint`, `test`, `build`, `deno check` de las funciones. Sin esto todo lo demás regresa.

**Fase 2 — Desduplicar (2-3 días)**
7. `ExportMenu` compartido y header unificado (sección 1).
8. Cliente de Supabase único y tipado.
9. Arreglar los 3 `rules-of-hooks` (A5) y activar `no-unused-vars`.

**Fase 3 — Robustez de datos (2-3 días)**
10. Migración: `UNIQUE (user_id, slug)`, índice en `projects.user_id`, trigger `updated_at`, `CHECK` de tamaño.
11. M3 y M4 en el cliente: snapshot con timestamp, listados con select parcial, aviso antes de purgar.
12. M6: manejo global de sesión expirada.

**Fase 4 — Modernizar (1 semana, opcional)**
13. `npm audit fix` y upgrade escalonado: primero Vite 8 + Vitest 5 (cierra las 2 críticas), después Router 7, y recién ahí evaluar React 19 y Tailwind 4, que son los que más rompen.
14. `strict: true` en tsconfig de forma incremental, empezando por `src/lib/`.
15. Versionado semántico y nombre real en `package.json`.

Recién después de la Fase 1 tiene sentido volver al `ROADMAP_IMMEDIATE.md` (ATTACK, HURT, CAST, DIE del motor de anatomía), porque cualquier asistente que ayude va a leer una doc correcta y trabajar sobre una base sin duplicados.
