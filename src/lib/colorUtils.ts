/**
 * Curated list of colors for naming pixel art palettes.
 * Heavily weighted towards common game dev and retro console names.
 */
const COLOR_NAMES: Record<string, string> = {
  "#000000": "Pure Black",
  "#ffffff": "Pure White",
  "#1d2b53": "Midnight Blue",
  "#7e2553": "Deep Burgundy",
  "#008751": "Seaweed Green",
  "#ab5236": "Brick Red",
  "#5f574f": "Charcoal Gray",
  "#c2c3c7": "Light Gray",
  "#fff1e8": "Sandalwood",
  "#ff004d": "Ruby Red",
  "#ffa300": "Amber Orange",
  "#ffec27": "Lemon Yellow",
  "#00e436": "Lime Green",
  "#29adff": "Sky Blue",
  "#83769c": "Slate Lavender",
  "#ff77a8": "Bubblegum Pink",
  "#ffccaa": "Peach Fuzz",
  "#0f380f": "Forest Shadow",
  "#306230": "Moss Green",
  "#8bac0f": "Meadow Green",
  "#9bbc0f": "Pasture Green",
  "#1a0c24": "Void Purple",
  "#4c1e3d": "Plum Shadow",
  "#9e3a39": "Terracotta",
  "#e87e35": "Burning Orange",
  "#ffce5e": "Golden Glow",
  "#fff1c7": "Champagne",
  "#0a1421": "Deep Abyss",
  "#122d42": "Teal Shadow",
  "#1e535f": "Ocean Teal",
  "#388b8d": "Muted Cyan",
  "#79c4a7": "Mint Ice",
  "#c0efc1": "Pale Spring",
  "#141013": "Void Black",
  "#2b1b36": "Occult Purple",
  "#4e2d4d": "Dark Magenta",
  "#7d4a41": "Raw Umber",
  "#b37748": "Ochre Wood",
  "#e3a857": "Mustard Gold",
  "#fee27d": "Sunlight",
  "#2e222f": "Dusk Purple",
  "#3e3546": "Steel Gray",
  "#473b78": "Royal Indigo",
  "#44a362": "Jade Green",
  "#91db69": "Leaf Green",
  "#fbff86": "Acid Yellow",
  "#7c7c7c": "Silver Gray",
  "#0000fc": "Ultramarine",
  "#0000bc": "Deep Blue",
  "#4428bc": "Retro Purple",
  "#940084": "Classic Magenta",
  "#a80020": "Retro Red",
  "#a81000": "Burnt Sienna",
  "#881400": "Rust Brown",
  "#503000": "Deep Gold",
  "#007800": "NES Green",
  "#006800": "Dark Forest",
  "#005800": "Deep Jungle",
};

// Helper to convert hex to RGB
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// Euclidean distance between two colors
function colorDistance(c1: {r: number, g: number, b: number}, c2: {r: number, g: number, b: number}) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Returns a descriptive name for any hex color.
 * Uses Euclidean distance to find the closest curated color name.
 */
export function getColorName(hex: string): string {
  if (!hex || hex === 'transparent' || hex === 'rgba(0,0,0,0)') return 'Transparent';
  
  // Clean hex
  const cleanHex = hex.toLowerCase().startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`;
  
  // Exact match
  if (COLOR_NAMES[cleanHex]) return COLOR_NAMES[cleanHex];

  // Find closest
  const targetRgb = hexToRgb(cleanHex);
  let minDistance = Infinity;
  let closestName = 'Custom Color';

  for (const [refHex, name] of Object.entries(COLOR_NAMES)) {
    const refRgb = hexToRgb(refHex);
    const dist = colorDistance(targetRgb, refRgb);
    if (dist < minDistance) {
      minDistance = dist;
      closestName = name;
    }
  }

  return closestName;
}
