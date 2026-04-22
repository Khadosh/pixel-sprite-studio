/** 
 * Optimized Matrix-to-SVG-Path Converter
 * Converts 16x16 grids into Lucide-style path strings.
 * Grouping horizontal pixels into 'h' commands for minimal size and crisp rendering.
 */

export interface IconPaths {
  primary: string;
  light: string;
  dark: string;
  black: string;
  accent: string;
}

export type IconMatrix = number[][];

export const matrixToSvgPaths = (matrix: IconMatrix): IconPaths => {
  const paths: Record<string, string[]> = {
    '1': [], // Primary
    '2': [], // Light
    '3': [], // Dark
    '4': [], // Black
    '5': [], // Accent/White
  };

  const getPathKey = (val: number): string | null => {
    if (val === 1) return '1';
    if (val === 2) return '2';
    if (val === 3) return '3';
    if (val === 4) return '4';
    if (val === 5) return '5';
    return null;
  };

  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    let startX: number | null = null;
    let currentColor: string | null = null;

    for (let x = 0; x <= row.length; x++) {
      const val = x < row.length ? row[x] : -1;
      const key = getPathKey(val);

      if (key !== currentColor) {
        // End existing segment
        if (currentColor && startX !== null) {
          const width = x - startX;
          paths[currentColor].push(`M${startX} ${y}h${width}v1h-${width}z`);
        }
        // Start new segment
        startX = key ? x : null;
        currentColor = key;
      }
    }
  }

  return {
    primary: paths['1'].join(''),
    light: paths['2'].join(''),
    dark: paths['3'].join(''),
    black: paths['4'].join(''),
    accent: paths['5'].join(''),
  };
};
