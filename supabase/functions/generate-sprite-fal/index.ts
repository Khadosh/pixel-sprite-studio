import "@supabase/functions-js/edge-runtime.d.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { errorResponse, HttpError, jsonResponse, readJsonBody, requireEnv } from "../_shared/http.ts";
import { createAdminClient, requireUser } from "../_shared/auth.ts";
import { consumeQuota, DAILY_LIMIT } from "../_shared/usage.ts";
import { fetchJsonWithTimeout, MODEL_TIMEOUT_MS } from "../_shared/llm.ts";
import {
  validateImageUrl,
  validatePalette,
  validateProjectConfig,
  validatePrompt,
  validateSize,
} from "../_shared/validate.ts";

const FN = "generate-sprite-fal";
// Modelos: decisión del dueño del proyecto, no cambiar sin consultar.
const TXT2IMG_MODEL = "fal-ai/flux/schnell";
const IMG2IMG_MODEL = "fal-ai/bytedance/seedream/v4/edit";
const FAL_BASE_URL = "https://fal.run";

/**
 * Contrato (usado por src/hooks/useGenerateSpriteFal.ts):
 *   POST { prompt, size?, image_url?, palette?, strength?, maxColors?, projectConfig? }
 *   200  { imageUrl, prompt, originalPrompt, size }
 *   error { error }  con 400 / 401 / 413 / 429 / 500 / 502 / 504
 */
Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Método no permitido.");

    // 1. Autenticación (antes de cualquier llamada externa).
    const supabaseAdmin = createAdminClient();
    const user = await requireUser(req, supabaseAdmin);

    // 2. Validación de entrada (antes de consumir cuota).
    const body = await readJsonBody(req);
    const prompt = validatePrompt(body.prompt);
    const size = validateSize(body.size, 64);
    const imageUrl = validateImageUrl(body.image_url);
    const palette = validatePalette(body.palette);
    const projectConfig = validateProjectConfig(body.projectConfig);
    const falKey = requireEnv("FAL_AI_KEY");

    // 3. Cuota diaria atómica (antes de llamar al modelo).
    await consumeQuota(supabaseAdmin, user.id, DAILY_LIMIT);

    // 4. Prompt técnico.
    const colors = palette ? Object.values(palette) : [];
    const paletteGuidance = colors.length > 1 ? `Use strictly this color palette: ${colors.join(", ")}. ` : "";
    let projectGuidance = "";
    if (projectConfig.directionality) {
      projectGuidance += ` The character must strictly adhere to a ${projectConfig.directionality} game perspective.`;
    }
    if (projectConfig.aesthetics && projectConfig.aesthetics !== "custom") {
      projectGuidance += ` The aesthetic must strictly be ${projectConfig.aesthetics}.`;
    }
    const technicalPrompt =
      `Professional pixel art sprite of ${prompt}. ${paletteGuidance}${projectGuidance} Isolated character on a solid flat LIME GREEN background (#00FF00). Full body, centered, clean retro pixel art.`;

    let endpoint = `${FAL_BASE_URL}/${TXT2IMG_MODEL}`;
    let falBody: Record<string, unknown> = {
      prompt: technicalPrompt,
      image_size: "square_hd",
      num_inference_steps: 4,
      enable_safety_checker: false,
    };
    if (imageUrl) {
      endpoint = `${FAL_BASE_URL}/${IMG2IMG_MODEL}`;
      falBody = {
        prompt: technicalPrompt,
        image_urls: [imageUrl],
        sync_mode: true,
        image_size: "square_hd",
        enable_safety_checker: false,
      };
      console.log(`[${FN}] user=${user.id} img2img (${IMG2IMG_MODEL}) size=${size}`);
    } else {
      console.log(`[${FN}] user=${user.id} txt2img (${TXT2IMG_MODEL}) size=${size}`);
    }

    // 5. Llamada al modelo con timeout.
    const upstream = await fetchJsonWithTimeout(endpoint, {
      method: "POST",
      headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(falBody),
    }, MODEL_TIMEOUT_MS);

    if (!upstream.ok) {
      throw new HttpError(502, "El servicio de IA devolvió un error. Intenta de nuevo.", {
        cause: `fal ${upstream.status}: ${upstream.text.slice(0, 500)}`,
      });
    }
    const resultUrl = (upstream.json as { images?: { url?: unknown }[] } | null)?.images?.[0]?.url;
    if (typeof resultUrl !== "string" || resultUrl.length === 0) {
      throw new HttpError(502, "El servicio de IA no devolvió ninguna imagen. Intenta de nuevo.", {
        cause: `fal body: ${upstream.text.slice(0, 500)}`,
      });
    }

    return jsonResponse(200, { imageUrl: resultUrl, prompt: technicalPrompt, originalPrompt: prompt, size }, req);
  } catch (err) {
    return errorResponse(err, FN, req);
  }
});
