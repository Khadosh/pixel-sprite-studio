import "@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert pixel art sprite designer specializing in 16×16 retro game assets. You create detailed, recognizable sprites that make efficient use of every pixel.

CANVAS RULES:
- Frame: 16×16 2D array of integers. 0 = transparent.
- Palette: integer keys (1, 2, 3...) → hex color strings. Key 0 is always transparent (NOT in palette).
- Use 5-8 colors. Include a dark outline/shadow color, mid-tones, and highlights.
- colorNames: human-readable name for each color.

COMPOSITION RULES:
- Use the FULL 16×16 canvas. The sprite should occupy roughly 12-14 rows vertically and 10-14 columns horizontally.
- Leave 1-2 rows of transparency at top and bottom for padding return, no more.
- Characters should be recognizable by their SILHOUETTE alone.
- Use 1px dark outlines to define shapes clearly.
- Reserve 1-2 pixels for highlights/shine to add depth.

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

    const userPrompt = `Generate a 16×16 pixel art sprite of: ${prompt.trim().slice(0, 300)}`;

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
          maxOutputTokens: 4000,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
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
    if (!Array.isArray(parsed.frame) || parsed.frame.length !== 16 ||
        !parsed.frame.every(row => Array.isArray(row) && row.length === 16)) {
      return new Response(
        JSON.stringify({ error: "LLM returned invalid frame dimensions (expected 16×16)" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build SpriteAsset
    const spriteData = {
      id: "generated-sprite-" + Date.now(),
      name: prompt.slice(0, 20),
      description: prompt,
      category: "character",
      size: 16,
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
