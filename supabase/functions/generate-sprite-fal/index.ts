import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const FAL_AI_KEY = Deno.env.get("FAL_AI_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** 
 * Manually decodes a JWT payload without verification.
 */
function getUserIdFromToken(authHeader: string | null): string {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return "anonymous";
  try {
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split('.');
    if (parts.length !== 3) return "anonymous";
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || "anonymous";
  } catch {
    return "anonymous";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!FAL_AI_KEY) throw new Error("FAL_AI_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const userId = getUserIdFromToken(authHeader);
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { prompt, size = 64, image_url = null, strength = 0.65 } = await req.json();

    if (!prompt) throw new Error("A text prompt is required");

    // Construct technical prompt
    const technicalPrompt = `Professional pixel art sprite of ${prompt}. Full body character, isolated on a solid flat white background. Clear silhouette, clean lines, vibrant retro colors. Centered in frame.`;

    // Choose endpoint based on whether we have a reference image
    const endpoint = image_url 
      ? "https://fal.run/fal-ai/flux/schnell/image-to-image" 
      : "https://fal.run/fal-ai/flux/schnell";

    const falRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: technicalPrompt,
        image_url: image_url, // Used in Img2Img
        strength: strength,   // Consistency factor (0.1 to 1.0)
        image_size: "square_hd",
        num_inference_steps: 4,
        enable_safety_checker: false,
      }),
    });

    if (!falRes.ok) {
      const errText = await falRes.text();
      throw new Error(`Fal.ai error: ${errText}`);
    }

    const falData = await falRes.json();
    const resultUrl = falData.images?.[0]?.url;

    if (!resultUrl) throw new Error("No image URL returned from Fal.ai");

    // Increment usage record
    const today = new Date().toISOString().split("T")[0];
    await supabaseAdmin
      .from("user_ai_usage")
      .upsert({ user_id: userId, usage_date: today, updated_at: new Date().toISOString() });

    return new Response(
      JSON.stringify({ imageUrl: resultUrl, prompt: technicalPrompt, originalPrompt: prompt, size }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Fal Generation Error:", err.message);
    return new Response(
      JSON.stringify({ error: "Generation failed", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
