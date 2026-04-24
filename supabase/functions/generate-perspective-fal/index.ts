// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore
const FAL_AI_KEY = Deno.env.get("FAL_AI_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, image_url, size = 32, palette = null } = await req.json()

    if (!image_url) {
      throw new Error("Reference image_url is required for perspective generation.")
    }

    // Construct palette guidance if provided
    let paletteGuidance = "";
    if (palette && Object.keys(palette).length > 1) {
      const colors = Object.values(palette).filter(c => c !== "transparent").join(", ");
      paletteGuidance = `Use strictly this color palette: ${colors}. `;
    }

    // Aggressive prompt for rotation - Focus on the TARGET perspective, not the source
    const technicalPrompt = `
      Context: You receive a front image of a pixel art character
      Mission: Rotate 90deg to return a strict side profile view
      Expected result: High-quality pixel art of the character from the reference image shown from a complete side profile perspective. ${paletteGuidance}Exact same design, colors, and outfit. Precise 1:1 pixel scale, clean lines. Isolated character with NO background. Maintain exact height, proportions, and consistency. Professional sprite sheet style.
    `;

    console.log(`[generate-perspective-fal] Calling Seedream V4 Edit for: ${prompt}`);

    const falRes = await fetch("https://fal.run/fal-ai/bytedance/seedream/v4/edit", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: technicalPrompt,
        image_urls: [image_url],
        sync_mode: true,
        image_size: "square_hd",
        enable_safety_checker: false,
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
