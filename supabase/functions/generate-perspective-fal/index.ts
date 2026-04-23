import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FAL_AI_KEY = Deno.env.get("FAL_AI_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, image_url, size = 32, strength = 0.55 } = await req.json()

    if (!image_url) {
      throw new Error("Reference image_url is required for perspective generation.")
    }

    // Aggressive prompt for rotation - Focus on the TARGET perspective, not the source
    const technicalPrompt = `(Character reference sheet:1.3), STRICT SIDE PROFILE VIEW (90-DEGREE TURN). High-quality pixel art of the character from the reference image shown from a complete side profile perspective. Exact same design, colors, and outfit. Precise 1:1 pixel scale, clean lines. Isolated character on a solid flat LIME GREEN background (#00FF00). FULL BODY MUST BE CENTERED. Do not show the front; only the side profile. Maintaining exact height, proportions, and consistency. Professional sprite sheet style.`;

    console.log(`[generate-perspective-fal] Calling Flux Pro Kontext for: ${prompt}`);

    const falRes = await fetch("https://fal.run/fal-ai/flux-pro/kontext", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: technicalPrompt,
        image_url: image_url,
        sync_mode: true,
        strength: strength,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        enable_safety_checker: false,
        image_size: {
          width: 512,
          height: 512
        }
      }),
    })

    if (!falRes.ok) {
      const error = await falRes.text()
      console.error("[generate-perspective-fal] Fal.ai error:", error)
      throw new Error(`Fal.ai error: ${error}`)
    }

    const result = await falRes.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[generate-perspective-fal] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
