import { HttpError } from "./http.ts";

export const MODEL_TIMEOUT_MS = 90_000;
export const TIMEOUT_MESSAGE = "El servicio de IA tardó demasiado en responder. Intenta de nuevo.";
export const UPSTREAM_MESSAGE = "No se pudo contactar al servicio de IA. Intenta de nuevo más tarde.";
export const INVALID_JSON_MESSAGE = "La IA devolvió una respuesta inválida. Intenta de nuevo.";

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function isTimeoutError(err: unknown, signal: AbortSignal): boolean {
  if (signal.aborted) return true;
  return typeof err === "object" && err !== null && (err as { name?: string }).name === "TimeoutError";
}

/**
 * fetch con `AbortSignal.timeout(ms)`. Un timeout se convierte en HttpError 504
 * y cualquier otro fallo de red en HttpError 502; el detalle queda en `cause`.
 */
export async function fetchWithTimeout(
  url: string | URL,
  init: RequestInit = {},
  timeoutMs: number = MODEL_TIMEOUT_MS,
  fetchImpl: FetchLike = fetch,
): Promise<Response> {
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal });
  } catch (err) {
    if (isTimeoutError(err, signal)) throw new HttpError(504, TIMEOUT_MESSAGE, { cause: err });
    throw new HttpError(502, UPSTREAM_MESSAGE, { cause: err });
  }
}

export interface UpstreamResult {
  ok: boolean;
  status: number;
  /** Cuerpo crudo (quien lo loguee debe recortarlo). */
  text: string;
  /** JSON parseado si el cuerpo era JSON válido; null en caso contrario. */
  json: unknown;
}

/**
 * fetch + lectura del cuerpo, ambos dentro del mismo timeout (la señal también
 * aborta la lectura del stream). Nunca lanza por status HTTP: el llamador decide.
 */
export async function fetchJsonWithTimeout(
  url: string | URL,
  init: RequestInit = {},
  timeoutMs: number = MODEL_TIMEOUT_MS,
  fetchImpl: FetchLike = fetch,
): Promise<UpstreamResult> {
  const signal = AbortSignal.timeout(timeoutMs);
  let res: Response;
  let text: string;
  try {
    res = await fetchImpl(url, { ...init, signal });
    text = await res.text();
  } catch (err) {
    if (isTimeoutError(err, signal)) throw new HttpError(504, TIMEOUT_MESSAGE, { cause: err });
    throw new HttpError(502, UPSTREAM_MESSAGE, { cause: err });
  }
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json };
}

/** Quita fences ```json ... ``` (y ``` sueltos) que los modelos suelen agregar. */
export function stripJsonFences(raw: string): string {
  let text = raw.trim();
  const fenced = /^```[a-zA-Z0-9_-]*[ \t]*\r?\n?([\s\S]*?)\r?\n?```$/.exec(text);
  if (fenced) text = fenced[1];
  return text.replace(/```(?:json)?/gi, "").trim();
}

/** Limpia fences y parsea. Lanza HttpError 502 si no es JSON válido. */
export function parseLlmJson<T = unknown>(raw: string): T {
  const cleaned = stripJsonFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (cause) {
    throw new HttpError(502, INVALID_JSON_MESSAGE, {
      cause: { cause, preview: cleaned.slice(0, 300) },
    });
  }
}

/** Extrae el texto del primer candidato de una respuesta de Gemini generateContent. */
export function extractGeminiText(data: unknown): string | null {
  const parts = (data as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })
    ?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");
  return text.length > 0 ? text : null;
}
