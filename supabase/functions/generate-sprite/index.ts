import "@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert pixel art sprite designer specializing in 32×32 retro game assets. You create detailed, recognizable sprites that make efficient use of every pixel.

CANVAS RULES:
- Frame: 32×32 2D array of integers. 0 = transparent.
- Palette: integer keys (1, 2, 3...) → hex color strings. Key 0 is always transparent (NOT in palette).
- Use 8-12 colors. Include a dark outline/shadow color, mid-tones, and highlights.
- colorNames: human-readable name for each color.

COMPOSITION RULES:
- Use the FULL 32×32 canvas. The sprite should occupy roughly 24-28 rows vertically and 20-28 columns horizontally.
- Leave 2-4 rows of transparency at top and bottom for padding return, no more.
- Characters should be recognizable by their SILHOUETTE alone.
- Use 1px dark outlines to define shapes clearly.
- Reserve 1-3 pixels for highlights/shine to add depth.

CHARACTER DESIGN (for creatures, humanoids, monsters):
- Include ALL key anatomical features that define the subject: head, body, limbs.
- For creatures: wings, tail, horns, claws — whatever makes them identifiable.
- For humanoids: head (2-3px), torso (4-5px), legs (3-4px), arms visible.
- Proportions: the head should be roughly 25-30% of height (chibi/retro style).
- Face: at minimum eyes (1-2px each). Mouth optional but recommended for expressive characters.
- Side or 3/4 view is preferred over front-facing — it gives more visual detail.

OBJECTS & PROPS:
- Fill at least 60% of the canvas with the object.
- Add shadow/depth with darker shades on one side.
- Include recognizable details (e.g., a chest needs a lock/clasp, a potion needs liquid color and a cork).

COLOR TECHNIQUE:
- Use adjacent palette values for shading: light → base → dark of the same hue.
- Outline color should be darker than the darkest fill color.
- Avoid pure black (#000000) for outlines — use very dark versions of the main hue instead.

CRITICAL INSTRUCTION:
- YOU MUST DRAW THE SPRITE USING THE PALETTE KEYS (1, 2, 3...). 
- DO NOT RETURN AN EMPTY FRAME OF ALL 0s. A blank frame is considered a complete failure. Fill the array to form the shape of the requested character.

OUTPUT (respond ONLY with this JSON):
{
  "palette": { "1": "#hex", "2": "#hex", ... },
  "colorNames": { "1": "Dark Outline", "2": "Base Color", ... },
  "frame": [[0,0,...], [0,0,...], ...]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!GEMINI_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "A text prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userPrompt = `Generate a 32×32 pixel art sprite of: ${prompt.trim().slice(0, 300)}`;

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Gemini API error:", res.status, errBody);
      return new Response(
        JSON.stringify({ error: "LLM generation failed", detail: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty response from Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse the JSON (Gemini with responseMimeType should return clean JSON, but strip fences just in case)
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    let parsed: { palette: Record<string, string>; colorNames: Record<string, string>; frame: number[][] };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Gemini JSON:", content);
      return new Response(
        JSON.stringify({ error: "Invalid JSON from LLM", detail: content.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate frame dimensions
    if (!Array.isArray(parsed.frame) || parsed.frame.length !== 32 ||
        !parsed.frame.every(row => Array.isArray(row) && row.length === 32)) {
      return new Response(
        JSON.stringify({ error: "LLM returned invalid frame dimensions (expected 32×32)" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate that the frame is not completely empty
    let hasPixels = false;
    for (let r = 0; r < 32; r++) {
      for (let c = 0; c < 32; c++) {
        if (parsed.frame[r][c] !== 0) {
          hasPixels = true;
          break;
        }
      }
      if (hasPixels) break;
    }

    if (!hasPixels) {
      return new Response(
        JSON.stringify({ error: "La IA generó una grilla vacía (sin píxeles). Por favor, intenta regenerar o cambiar el prompt." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build SpriteAsset
    const spriteData = {
      id: "generated-sprite-" + Date.now(),
      name: prompt.slice(0, 20),
      description: prompt,
      category: "character",
      size: 32,
      palette: parsed.palette,
      colorNames: parsed.colorNames || {},
      frames: [parsed.frame],
      animations: [],
    };

    return new Response(JSON.stringify(spriteData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
