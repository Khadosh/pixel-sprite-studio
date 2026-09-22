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

const FN = "generate-perspective-fal";
// Modelo: decisión del dueño del proyecto, no cambiar sin consultar.
const IMG2IMG_MODEL = "fal-ai/bytedance/seedream/v4/edit";
const FAL_BASE_URL = "https://fal.run";

/**
 * Contrato (usado por src/hooks/useGeneratePerspectiveAI.ts):
 *   POST { prompt?, image_url, size?, strength?, palette?, projectConfig? }
 *   200  { imageUrl, images: [{ url }], prompt, originalPrompt, size }
 *        (el cliente lee images[0].url o imageUrl)
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
    const imageUrl = validateImageUrl(body.image_url, { required: true }) as string;
    const prompt = validatePrompt(body.prompt, { required: false });
    const size = validateSize(body.size, 32);
    const palette = validatePalette(body.palette);
    const projectConfig = validateProjectConfig(body.projectConfig);
    const falKey = requireEnv("FAL_AI_KEY");

    // 3. Cuota diaria atómica (antes de llamar al modelo).
    await consumeQuota(supabaseAdmin, user.id, DAILY_LIMIT);

    // 4. Prompt técnico: describe la perspectiva destino, no la fuente.
    const colors = palette ? Object.values(palette) : [];
    const paletteGuidance = colors.length > 1 ? `Use strictly this color palette: ${colors.join(", ")}. ` : "";
    let projectGuidance = "";
    if (projectConfig.aesthetics && projectConfig.aesthetics !== "custom") {
      projectGuidance += ` The aesthetic must strictly be ${projectConfig.aesthetics}.`;
    }
    const technicalPrompt = `
      Context: You receive a front image of a pixel art character
      Mission: Rotate 90deg to return a strict side profile view
      Expected result: High-quality pixel art of the character from the reference image shown from a complete side profile perspective. ${paletteGuidance}${projectGuidance} Exact same design, colors, and outfit. Precise 1:1 pixel scale, clean lines. Isolated character with NO background. Maintain exact height, proportions, and consistency. Professional sprite sheet style.
    `;

    console.log(`[${FN}] user=${user.id} model=${IMG2IMG_MODEL} size=${size}`);

    // 5. Llamada al modelo con timeout.
    const upstream = await fetchJsonWithTimeout(`${FAL_BASE_URL}/${IMG2IMG_MODEL}`, {
      method: "POST",
      headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: technicalPrompt,
        image_urls: [imageUrl],
        sync_mode: true,
        image_size: "square_hd",
        enable_safety_checker: false,
      }),
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

    return jsonResponse(200, {
      imageUrl: resultUrl,
      images: [{ url: resultUrl }],
      prompt: technicalPrompt,
      originalPrompt: prompt,
      size,
    }, req);
  } catch (err) {
    return errorResponse(err, FN, req);
  }
});
