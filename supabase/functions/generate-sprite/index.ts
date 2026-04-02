import "@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are an expert pixel artist specializing in 16x16 retro game sprites (NES/SNES era: Final Fantasy, Zelda, Mega Man).

You generate EXACTLY 1 static frame. Animations will be handled separately. Output ONLY valid JSON.

JSON SCHEMA:
{"name":"string","description":"string","category":"character|terrain|prop|nature|ui","size":16,"palette":{"0":"transparent","1":"#hex","2":"#hex",...},"colorNames":{"1":"Name","2":"Name",...},"frames":[[[16 ints],[16 ints],...16 rows]],"animations":[],"tags":["string"]}

PIXEL ART RULES:
1. PALETTE: 5-7 colors.
   - Key 1: Dark outline (near-black like #1a1a2e). EVERY sprite needs this.
   - Keys 2-3: Dark/mid base tones (thematic to the subject).
   - Keys 4-5: Lighter tones, skin, accents.
   - Keys 6-7: Highlights, special features (weapon metal, magic glow, etc.)

2. OUTLINE: Complete 1px dark outline (key 1) around the entire silhouette. No gaps. This is critical.

3. RECOGNIZABLE FEATURES: Think — what 3 features make this subject instantly recognizable at 16x16?
   - Wizard: pointy hat, beard, staff/wand
   - Knight: helmet, armor, sword/shield
   - Dragon: wings, tail, horns
   - Slime: round blob, eyes, highlights

4. PROPORTIONS (characters): Chibi style.
   - Head: rows 1-6 (~5px tall, 4-5px wide)
   - Body: rows 7-12 (~6px tall, 5-8px wide)
   - Feet: rows 13-14
   - Leave 3-4 columns padding on sides. Rows 0 and 15 transparent.

5. SHADING: Light from top-left. Lighter on top/left, darker on bottom/right.

6. NO scattered pixels. Every colored pixel connects to the sprite body.

7. Generate EXACTLY 1 frame. Set animations to [].

Output raw JSON only.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { prompt, animations = [] } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "A text prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userPrompt = prompt.trim().slice(0, 500);
    const animList = Array.isArray(animations) ? animations as string[] : [];

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          { role: "user", parts: [{ text: `Generate a 16x16 pixel art sprite of: ${userPrompt}` }] },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 1.0,
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingBudget: 8192 },
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "LLM generation failed", detail: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiRes.json();

    let rawText = "";
    const parts = geminiData?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.text) rawText = part.text;
    }

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Empty response from LLM" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let spriteData;
    try {
      spriteData = JSON.parse(rawText);
    } catch {
      console.error("Failed to parse LLM output:", rawText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "LLM returned invalid JSON", raw: rawText.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    normalizeFrames(spriteData);

    // Validate the single base frame
    const validation = validateSprite(spriteData);
    if (!validation.ok) {
      const frameSnippet = JSON.stringify(spriteData?.frames?.[0]?.slice(0, 2))?.slice(0, 300);
      return new Response(
        JSON.stringify({ error: "Generated sprite failed validation", detail: validation.reason, frameSnippet }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Post-process: generate animation frames from the base ──
    const baseFrame = spriteData.frames[0] as number[][];

    // Find the highest palette key that could be a "glow/accent" color
    const paletteKeys = Object.keys(spriteData.palette).map(Number).filter(k => k > 0);
    const glowColor = Math.max(...paletteKeys);

    if (animList.length > 0) {
      const allFrames: number[][][] = [];
      const animDefs: { name: string; label: string; frameIndices: number[]; fps: number }[] = [];

      for (const anim of animList) {
        const fi = allFrames.length;
        const [f0, f1] = generateAnimFrames(baseFrame, anim, glowColor);
        allFrames.push(f0, f1);

        const fps = anim === "idle" ? 3 : anim === "cast" ? 4 : 5;
        animDefs.push({
          name: anim,
          label: anim.toUpperCase(),
          frameIndices: [fi, fi + 1, fi, fi + 1],
          fps,
        });
      }

      spriteData.frames = allFrames;
      spriteData.animations = animDefs;
    }

    spriteData.id = slugify(spriteData.name || "generated-sprite");
    spriteData.size = 16;

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

// ═══════════════════════════════════════════════
// Frame transformation functions
// ═══════════════════════════════════════════════

type Frame = number[][];

function cloneFrame(frame: Frame): Frame {
  return frame.map(row => [...row]);
}

function shiftDown(frame: Frame, px: number): Frame {
  const out: Frame = Array.from({ length: 16 }, () => new Array(16).fill(0));
  for (let r = px; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      out[r][c] = frame[r - px][c];
    }
  }
  return out;
}

function shiftRight(frame: Frame, px: number): Frame {
  const out: Frame = Array.from({ length: 16 }, () => new Array(16).fill(0));
  for (let r = 0; r < 16; r++) {
    for (let c = px; c < 16; c++) {
      out[r][c] = frame[r][c - px];
    }
  }
  return out;
}

function shiftRowsHorizontal(frame: Frame, startRow: number, endRow: number, px: number): Frame {
  const out = cloneFrame(frame);
  for (let r = startRow; r <= Math.min(endRow, 15); r++) {
    const newRow = new Array(16).fill(0);
    for (let c = 0; c < 16; c++) {
      const srcC = c - px;
      if (srcC >= 0 && srcC < 16) newRow[c] = frame[r][srcC];
    }
    out[r] = newRow;
  }
  return out;
}

function findBounds(frame: Frame) {
  let top = 16, bottom = -1, left = 16, right = -1;
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if (frame[r][c] !== 0) {
        if (r < top) top = r;
        if (r > bottom) bottom = r;
        if (c < left) left = c;
        if (c > right) right = c;
      }
    }
  }
  return bottom === -1 ? null : { top, bottom, left, right };
}

function addGlow(frame: Frame, glowColor: number): Frame {
  const out = cloneFrame(frame);
  const bounds = findBounds(frame);
  if (!bounds) return out;

  const midCol = Math.floor((bounds.left + bounds.right) / 2);
  let tipR = bounds.bottom, tipC = bounds.right;

  for (let r = bounds.top; r <= bounds.bottom; r++) {
    for (let c = bounds.right; c >= midCol; c--) {
      if (frame[r][c] !== 0) {
        tipR = r; tipC = c;
        r = bounds.bottom + 1;
        break;
      }
    }
  }

  const offsets = [
    [-2, 0], [-1, -1], [-1, 0], [-1, 1],
    [0, -2], [0, -1], [0, 1], [0, 2],
    [1, -1], [1, 0], [1, 1], [2, 0],
  ];

  for (const [dr, dc] of offsets) {
    const gr = tipR + dr, gc = tipC + dc;
    if (gr >= 0 && gr < 16 && gc >= 0 && gc < 16 && out[gr][gc] === 0) {
      out[gr][gc] = glowColor;
    }
  }

  return out;
}

function generateAnimFrames(base: Frame, anim: string, glowColor: number): [Frame, Frame] {
  const bounds = findBounds(base);

  switch (anim) {
    case "idle":
      return [cloneFrame(base), shiftDown(base, 1)];

    case "walk": {
      if (!bounds) return [cloneFrame(base), cloneFrame(base)];
      const legStart = Math.floor(bounds.top + (bounds.bottom - bounds.top) * 0.7);
      return [
        shiftRowsHorizontal(base, legStart, bounds.bottom, -1),
        shiftRowsHorizontal(base, legStart, bounds.bottom, 1),
      ];
    }

    case "attack": {
      // Wind up (shift weapon area left) + strike (shift right)
      if (!bounds) return [cloneFrame(base), cloneFrame(base)];
      const armStart = Math.floor(bounds.top + (bounds.bottom - bounds.top) * 0.4);
      const armEnd = Math.floor(bounds.top + (bounds.bottom - bounds.top) * 0.7);
      return [
        cloneFrame(base),
        shiftRowsHorizontal(base, armStart, armEnd, 1),
      ];
    }

    case "cast":
      return [cloneFrame(base), addGlow(base, glowColor)];

    case "hurt":
      return [shiftRight(base, 1), shiftRight(base, 2)];

    case "jump":
      return [cloneFrame(base), shiftDown(base, -1)]; // shift UP

    default:
      return [cloneFrame(base), shiftDown(base, 1)];
  }
}

// ═══════════════════════════════════════════════
// Validation & normalization
// ═══════════════════════════════════════════════

function normalizeFrames(data: Record<string, unknown>): void {
  if (!Array.isArray(data.frames)) return;
  data.frames = (data.frames as unknown[]).map((frame) => {
    if (!Array.isArray(frame)) return frame;
    return (frame as unknown[]).map((row) => {
      if (Array.isArray(row) && row.length === 1) row = row[0];
      if (typeof row === "string") {
        return row.includes(",") ? row.split(",").map(Number) : row.split("").map(Number);
      }
      return row;
    });
  });
}

interface ValidationResult { ok: boolean; reason?: string }

function validateSprite(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") return { ok: false, reason: "Not an object" };
  const d = data as Record<string, unknown>;
  if (typeof d.name !== "string" || !d.name.length) return { ok: false, reason: "Missing name" };
  if (!d.palette || typeof d.palette !== "object") return { ok: false, reason: "Missing palette" };

  const paletteKeys = Object.keys(d.palette as object).map(Number);
  if (!Array.isArray(d.frames) || !d.frames.length) return { ok: false, reason: "Missing frames" };

  for (let fi = 0; fi < (d.frames as unknown[][]).length; fi++) {
    const frame = (d.frames as number[][][])[fi];
    if (!Array.isArray(frame) || frame.length !== 16)
      return { ok: false, reason: `Frame ${fi}: expected 16 rows, got ${frame?.length}` };
    for (let ri = 0; ri < 16; ri++) {
      const row = frame[ri];
      if (!Array.isArray(row) || row.length !== 16)
        return { ok: false, reason: `Frame ${fi} row ${ri}: expected 16 cols, got ${row?.length}` };
      for (let ci = 0; ci < 16; ci++) {
        const v = row[ci];
        if (typeof v !== "number" || !Number.isInteger(v) || v < 0)
          return { ok: false, reason: `Frame ${fi} [${ri}][${ci}]: invalid ${v}` };
        if (!paletteKeys.includes(v))
          return { ok: false, reason: `Frame ${fi} [${ri}][${ci}]: palette ${v} undefined` };
      }
    }
  }
  return { ok: true };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "generated-sprite";
}
