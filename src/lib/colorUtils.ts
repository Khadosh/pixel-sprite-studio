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
export function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

// Helper to convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

/**
 * Calculates a Tailwind-style shade value (50-950) based on perceived brightness.
 */
export function getShade(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  // Perceived brightness (standard YIQ formula weights)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  // Map brightness 255 (white) to 50, and 0 (black) to 950
  const shade = Math.round((1 - brightness / 255) * 900 + 50);
  // Round to nearest 50 for a clean Tailwind-like look
  return Math.round(shade / 50) * 50;
}

/**
 * Returns a generic hue name based on HSL.
 */
export function getHueName(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  if (l < 0.12) return 'Black';
  if (l > 0.92) return 'White';
  if (s < 0.12) return 'Gray';

  if (h < 15 || h >= 345) return 'Red';
  if (h < 45) return l < 0.4 ? 'Brown' : 'Orange';
  if (h < 75) return 'Yellow';
  if (h < 155) return 'Green';
  if (h < 195) return 'Cyan';
  if (h < 265) return 'Blue';
  if (h < 305) return 'Purple';
  return 'Pink';
}

// Euclidean distance between two colors
function colorDistance(c1: { r: number, g: number, b: number }, c2: { r: number, g: number, b: number }) {
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
export function getColorName(hex: string, includeShade: boolean = false): string {
  if (!hex || hex === 'transparent' || hex === 'rgba(0,0,0,0)') return 'Transparent';

  // Clean hex
  const cleanHex = hex.toLowerCase().startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`;

  // Find closest curated name
  const targetRgb = hexToRgb(cleanHex);
  let minDistance = Infinity;
  let closestName = '';

  // Check exact match first
  if (COLOR_NAMES[cleanHex]) {
    closestName = COLOR_NAMES[cleanHex];
    minDistance = 0;
  } else {
    for (const [refHex, name] of Object.entries(COLOR_NAMES)) {
      const refRgb = hexToRgb(refHex);
      const dist = colorDistance(targetRgb, refRgb);
      if (dist < minDistance) {
        minDistance = dist;
        closestName = name;
      }
    }
  }

  // If the distance is very large, fallback to Hue-Shade naming
  if (minDistance > 60 && !COLOR_NAMES[cleanHex]) {
    return `${getHueName(cleanHex)} ${getShade(cleanHex)}`;
  }

  if (includeShade) {
    return `${closestName} ${getShade(cleanHex)}`;
  }

  return closestName || 'Custom Color';
}

/**
 * Takes a list of hex colors and returns a list of unique descriptive names.
 * If multiple colors map to the same name, they are differentiated by shade.
 */
export function generateUniqueNames(hexes: string[]): string[] {
  const initialNames = hexes.map(hex => getColorName(hex));
  const nameCounts = new Map<string, number>();
  initialNames.forEach(name => nameCounts.set(name, (nameCounts.get(name) || 0) + 1));

  return hexes.map((hex, i) => {
    const name = initialNames[i];
    return nameCounts.get(name)! > 1 ? getColorName(hex, true) : name;
  });
}
