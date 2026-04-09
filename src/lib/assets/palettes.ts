export interface PalettePreset {
  id: string;
  name: string;
  description: string;
  category: 'Retro' | 'Theory' | 'Ramps';
  colors: string[];
}

export const PALETTE_LIBRARY: PalettePreset[] = [
  // --- Retro ---
  {
    id: 'retro_gb',
    name: 'GameBoy',
    description: '4-color original monochrome green palette.',
    category: 'Retro',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
  },
  {
    id: 'retro_pico8',
    name: 'PICO-8',
    description: 'The classic 16-color fantasy console palette.',
    category: 'Retro',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751',
      '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436',
      '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ]
  },
  {
    id: 'retro_nes',
    name: 'NES Classic',
    description: 'Selection of iconic NES colors.',
    category: 'Retro',
    colors: [
      '#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020', '#A81000', '#881400',
      '#503000', '#007800', '#006800', '#005800', '#004058', '#000000', '#BCBCBC', '#0078F8'
    ]
  },

  // --- Slynyrd Ramps (Theory) ---
  {
    id: 'ramp_warm_hue',
    name: 'Warm Hue-Shifting',
    description: 'Ramp with yellow highlights and deep purple shadows.',
    category: 'Ramps',
    colors: ['#1a0c24', '#4c1e3d', '#9e3a39', '#e87e35', '#ffce5e', '#fff1c7']
  },
  {
    id: 'ramp_cold_hue',
    name: 'Cold Night',
    description: 'Blue-centered shadows with cyan highlights.',
    category: 'Ramps',
    colors: ['#0a1421', '#122d42', '#1e535f', '#388b8d', '#79c4a7', '#c0efc1']
  },
  {
    id: 'theory_high_contrast',
    name: 'High Contrast Primary',
    description: 'Vibrant primary shades for game protagonists.',
    category: 'Theory',
    colors: ['#141013', '#2b1b36', '#4e2d4d', '#7d4a41', '#b37748', '#e3a857', '#fee27d', '#ffffff']
  },
  {
    id: 'theory_earth_toned',
    name: 'Natural Earth',
    description: 'Muted browns and greens for environments.',
    category: 'Theory',
    colors: ['#2e222f', '#3e3546', '#473b78', '#44a362', '#91db69', '#fbff86']
  },
  {
    id: 'mono_silver',
    name: 'Silver Screen',
    description: '8-step grayscale for clean noir styles.',
    category: 'Theory',
    colors: ['#121212', '#2a2a2a', '#444444', '#666666', '#888888', '#aaaaaa', '#cccccc', '#eeeeee']
  }
];
