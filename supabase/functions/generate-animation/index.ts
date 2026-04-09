import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import "@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DAILY_LIMIT = 10;

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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "No se proporcionó token de autorización" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Authenticate user
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "No autorizado", details: authError }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check rate limit
  const today = new Date().toISOString().split("T")[0];
  const { data: usage } = await supabaseAdmin
    .from("user_ai_usage")
    .select("call_count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .single();

  if (usage && usage.call_count >= DAILY_LIMIT) {
    return new Response(
      JSON.stringify({ error: `Límite diario de IA alcanzado (${DAILY_LIMIT}/${DAILY_LIMIT}). Vuelve mañana para seguir creando.` }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { baseFrame, palette, colorNames, size = 32, animationName } = await req.json();

    if (!baseFrame || !animationName || !palette) {
      return new Response(
        JSON.stringify({ error: "Missing required properties" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SYSTEM_PROMPT = `You are a master pixel art animator specializing in ${size}x${size} retro game sprites.
Your task is to take a provided base frame of a character and its palette, and generate exactly 3 NEW sequential frames that animate the character performing a '${animationName}' action.

RULES:
1. Output format: You must return a JSON object with a single property 'frames', which is an array of exactly 3 frames. Each frame must be a 2D array of integers (${size}x${size}).
2. Zero is transparent. The other integers map to the provided palette.
3. Use the EXACT same color keys as the base frame. Do not invent new keys.
4. The requested animation is: ${animationName}.
5. Frame 1, Frame 2, and Frame 3 should represent the progression of the animation.
6. DO NOT output empty arrays (all 0s). Fill the arrays to correctly represent the moving character.

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

Please generate the next 3 frames (Frame 1, Frame 2, Frame 3) for the animation: ${animationName.toUpperCase()}
Make sure the characters limbs/body parts move contextually to the action.
`;

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
          temperature: 0.4,
          maxOutputTokens: 8192,
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

    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    let parsed: { frames: number[][][] };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON from LLM" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validation
    if (!parsed.frames || !Array.isArray(parsed.frames) || parsed.frames.length !== 3) {
      return new Response(
        JSON.stringify({ error: "LLM did not return exactly 3 frames." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    for (let f = 0; f < 3; f++) {
      const frame = parsed.frames[f];
      if (!Array.isArray(frame) || frame.length !== size || !frame.every(r => Array.isArray(r) && r.length === size)) {
        return new Response(
          JSON.stringify({ error: `Frame ${f + 1} has invalid dimensions. Expected ${size}x${size}.` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      
      let hasPixels = false;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (frame[r][c] !== 0) {
            hasPixels = true;
            break;
          }
        }
        if (hasPixels) break;
      }
      if (!hasPixels) {
        return new Response(
          JSON.stringify({ error: `LLM returned a completely empty array for Frame ${f + 1}.` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Increment usage
    try {
      await supabaseAdmin
        .from("user_ai_usage")
        .upsert({ 
          user_id: user.id, 
          usage_date: today, 
          call_count: (usage?.call_count || 0) + 1,
          updated_at: new Date().toISOString()
        });
    } catch (upsertErr) {
      console.error("Failed to increment usage:", upsertErr);
    }

    return new Response(JSON.stringify({ frames: parsed.frames }), {
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
