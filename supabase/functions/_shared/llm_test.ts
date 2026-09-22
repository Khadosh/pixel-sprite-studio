import { assertEquals, assertRejects, assertThrows } from "jsr:@std/assert@^1";
import { HttpError } from "./http.ts";
import {
  extractGeminiText,
  fetchJsonWithTimeout,
  fetchWithTimeout,
  parseLlmJson,
  stripJsonFences,
  type FetchLike,
} from "./llm.ts";

/** fetch falso que nunca responde y solo rechaza cuando la señal se aborta. */
const hangingFetch: FetchLike = (_url, init) =>
  new Promise((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) return;
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });

const failingFetch: FetchLike = () => Promise.reject(new TypeError("connection refused"));

Deno.test("stripJsonFences quita fences con y sin lenguaje", () => {
  assertEquals(stripJsonFences('```json\n{"a":1}\n```'), '{"a":1}');
  assertEquals(stripJsonFences('```\n{"a":1}\n```'), '{"a":1}');
  assertEquals(stripJsonFences('  {"a":1}  '), '{"a":1}');
  assertEquals(stripJsonFences('texto ```json {"a":1} ``` fin'), 'texto  {"a":1}  fin');
});

Deno.test("parseLlmJson parsea y lanza 502 con JSON inválido", () => {
  assertEquals(parseLlmJson<{ frames: number[] }>('```json\n{"frames":[1,2,3]}\n```'), { frames: [1, 2, 3] });
  const err = assertThrows(() => parseLlmJson("esto no es json"), HttpError);
  assertEquals(err.status, 502);
  assertEquals(String(err.message).includes("json"), false);
});

Deno.test("extractGeminiText concatena las partes del primer candidato", () => {
  const data = { candidates: [{ content: { parts: [{ text: "{\"a\":" }, { text: "1}" }] } }] };
  assertEquals(extractGeminiText(data), '{"a":1}');
  assertEquals(extractGeminiText({}), null);
  assertEquals(extractGeminiText({ candidates: [{ content: { parts: [] } }] }), null);
  assertEquals(extractGeminiText(null), null);
});

Deno.test("fetchWithTimeout mapea el timeout a HttpError 504", async () => {
  const err = await assertRejects(() => fetchWithTimeout("https://example.invalid", {}, 20, hangingFetch), HttpError);
  assertEquals(err.status, 504);
});

Deno.test("fetchWithTimeout mapea errores de red a HttpError 502", async () => {
  const err = await assertRejects(() => fetchWithTimeout("https://example.invalid", {}, 1000, failingFetch), HttpError);
  assertEquals(err.status, 502);
});

Deno.test("fetchWithTimeout devuelve la Response cuando llega a tiempo y pasa la señal", async () => {
  let receivedSignal: AbortSignal | null | undefined;
  const okFetch: FetchLike = (_url, init) => {
    receivedSignal = init?.signal;
    return Promise.resolve(new Response("ok", { status: 200 }));
  };
  const res = await fetchWithTimeout("https://example.invalid", { method: "POST" }, 1000, okFetch);
  assertEquals(res.status, 200);
  assertEquals(receivedSignal instanceof AbortSignal, true);
});

Deno.test("fetchJsonWithTimeout devuelve status/json y aplica el timeout a la lectura del body", async () => {
  const jsonFetch: FetchLike = () => Promise.resolve(new Response('{"images":[{"url":"https://x/y.png"}]}', { status: 200 }));
  const ok = await fetchJsonWithTimeout("https://example.invalid", {}, 1000, jsonFetch);
  assertEquals(ok.ok, true);
  assertEquals((ok.json as { images: { url: string }[] }).images[0].url, "https://x/y.png");

  const badFetch: FetchLike = () => Promise.resolve(new Response("<html>oops</html>", { status: 500 }));
  const bad = await fetchJsonWithTimeout("https://example.invalid", {}, 1000, badFetch);
  assertEquals(bad.ok, false);
  assertEquals(bad.status, 500);
  assertEquals(bad.json, null);

  // Body que nunca termina: la misma señal debe abortar la lectura.
  const stalledBodyFetch: FetchLike = (_url, init) => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        init?.signal?.addEventListener("abort", () => controller.error(init.signal!.reason), { once: true });
      },
    });
    return Promise.resolve(new Response(stream, { status: 200 }));
  };
  const err = await assertRejects(() => fetchJsonWithTimeout("https://example.invalid", {}, 20, stalledBodyFetch), HttpError);
  assertEquals(err.status, 504);
});
