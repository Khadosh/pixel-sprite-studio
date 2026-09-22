import "@supabase/functions-js/edge-runtime.d.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { errorResponse, HttpError, jsonResponse, readJsonBody, requireEnv } from "../_shared/http.ts";
import { createAdminClient, requireUser } from "../_shared/auth.ts";
import { consumeQuota, DAILY_LIMIT } from "../_shared/usage.ts";
import { extractGeminiText, fetchJsonWithTimeout, MODEL_TIMEOUT_MS, parseLlmJson } from "../_shared/llm.ts";
import {
  frameHasPixels,
  isFrameMatrix,
  validateAnimationName,
  validateBaseFrame,
  validateColorNames,
  validatePalette,
  validateProjectConfig,
  validateSize,
} from "../_shared/validate.ts";

const FN = "generate-animation";
// Modelo: decisión del dueño del proyecto, no cambiar sin consultar.
const GEMINI_MODEL = "gemini-2.5-pro";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const FRAMES_PER_ANIMATION = 3;

/**
 * Contrato (usado por src/hooks/useGenerateAnimation.ts):
 *   POST { baseFrame, palette, colorNames?, size?, animationName, projectConfig? }
 *   200  { frames: number[][][] }  (exactamente 3 frames size×size)
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
    const size = validateSize(body.size, 32);
    const animationName = validateAnimationName(body.animationName);
    const baseFrame = validateBaseFrame(body.baseFrame, size);
    const palette = validatePalette(body.palette);
    if (!palette || Object.keys(palette).length === 0) throw new HttpError(400, "Se requiere la paleta del sprite.");
    const colorNames = validateColorNames(body.colorNames);
    const projectConfig = validateProjectConfig(body.projectConfig);
    const geminiKey = requireEnv("GEMINI_API_KEY");

    // 3. Cuota diaria atómica (antes de llamar al modelo).
    await consumeQuota(supabaseAdmin, user.id, DAILY_LIMIT);

    // 4. Prompts.
    const systemPrompt = `You are a master pixel art animator specializing in ${size}x${size} retro game sprites.
Your task is to take a provided base frame of a character and its palette, and generate exactly ${FRAMES_PER_ANIMATION} NEW sequential frames that animate the character performing a '${animationName}' action.

RULES:
1. Output format: You must return a JSON object with a single property 'frames', which is an array of exactly ${FRAMES_PER_ANIMATION} frames. Each frame must be a 2D array of integers (${size}x${size}).
2. Zero is transparent. The other integers map to the provided palette.
3. Use the EXACT same color keys as the base frame. Do not invent new keys.
4. The requested animation is: ${animationName}.
5. Frame 1, Frame 2, and Frame 3 should represent the progression of the animation.
6. DO NOT output empty arrays (all 0s). Fill the arrays to correctly represent the moving character.
${projectConfig.directionality ? `7. Note that the project uses a ${projectConfig.directionality} perspective. Ensure the movement makes sense for this perspective.` : ""}

OUTPUT JSON FORMAT:
{
  "frames": [
    [[...], [...], ...], // frame 1
    [[...], [...], ...], // frame 2
    [[...], [...], ...]  // frame 3
  ]
}`;

    const userPrompt = `
Here is the initial BASE FRAME (Frame 0):
${JSON.stringify(baseFrame)}

Here is the Palette mapping (Key to Hex):
${JSON.stringify(palette)}

Color Descriptions (Optional context):
${JSON.stringify(colorNames)}

Please generate the next ${FRAMES_PER_ANIMATION} frames (Frame 1, Frame 2, Frame 3) for the animation: ${animationName.toUpperCase()}
Make sure the characters limbs/body parts move contextually to the action.
`;

    console.log(`[${FN}] user=${user.id} model=${GEMINI_MODEL} size=${size} animation=${animationName}`);

    // 5. Llamada al modelo con timeout (la API key va por header, no en la URL).
    const upstream = await fetchJsonWithTimeout(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    }, MODEL_TIMEOUT_MS);

    if (!upstream.ok) {
      throw new HttpError(502, "El servicio de IA devolvió un error. Intenta de nuevo.", {
        cause: `gemini ${upstream.status}: ${upstream.text.slice(0, 500)}`,
      });
    }
    const content = extractGeminiText(upstream.json);
    if (!content) {
      throw new HttpError(502, "La IA devolvió una respuesta vacía. Intenta de nuevo.", {
        cause: `gemini body: ${upstream.text.slice(0, 500)}`,
      });
    }

    // 6. Validación de la salida del modelo.
    const parsed = parseLlmJson<{ frames?: unknown }>(content);
    const frames = parsed?.frames;
    if (!Array.isArray(frames) || frames.length !== FRAMES_PER_ANIMATION) {
      throw new HttpError(502, `La IA no devolvió exactamente ${FRAMES_PER_ANIMATION} frames. Intenta regenerar.`, {
        cause: `frames recibidos: ${Array.isArray(frames) ? frames.length : typeof frames}`,
      });
    }
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!isFrameMatrix(frame, size)) {
        throw new HttpError(502, `El frame ${i + 1} generado tiene dimensiones inválidas (esperado ${size}x${size}). Intenta regenerar.`);
      }
      if (!frameHasPixels(frame)) {
        throw new HttpError(502, `La IA generó el frame ${i + 1} vacío (sin píxeles). Intenta regenerar.`);
      }
    }

    return jsonResponse(200, { frames: frames as number[][][] }, req);
  } catch (err) {
    return errorResponse(err, FN, req);
  }
});
