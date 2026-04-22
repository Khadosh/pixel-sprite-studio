import React from 'react';
import { ICON_REGISTRY } from '@/lib/icons/iconRegistry';
import { matrixToSvgPaths } from '@/lib/icons/iconParser';

export interface PixelIconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number; // ignored, kept for Lucide compat
}

/** Base wrapper — all icons share this shell */
const Px: React.FC<PixelIconProps & { children: React.ReactNode }> = ({
  size = 16, color = 'currentColor', className = '', children
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ 
      shapeRendering: 'crispEdges',
      // @ts-ignore
      '--px-base': color,
      '--px-light': 'rgba(255, 255, 255, 0.25)',
      '--px-dark': 'rgba(0, 0, 0, 0.25)',
      '--px-black': 'rgba(0, 0, 0, 0.4)',
      '--px-accent': '#ffffff', // High contrast accent (for index 5)
    }}
  >
    {React.Children.map(children, child =>
      React.isValidElement(child)
        ? React.cloneElement(child as React.ReactElement<any>, { 
            fill: (child as React.ReactElement<any>).props.fill || 'var(--px-base)' 
          })
        : child
    )}
  </svg>
);

/** Dynamic Icon — Renders from the icon registry matrix */
export const DynamicPx: React.FC<PixelIconProps & { iconId: string }> = ({ iconId, ...p }) => {
  const matrix = ICON_REGISTRY[iconId];
  if (!matrix) return null;

  const paths = matrixToSvgPaths(matrix);

  return (
    <Px {...p}>
      {paths.primary && <path d={paths.primary} fill="var(--px-base)" />}
      {paths.light && <path d={paths.light} fill="var(--px-light)" />}
      {paths.dark && <path d={paths.dark} fill="var(--px-dark)" />}
      {paths.black && <path d={paths.black} fill="var(--px-black)" />}
      {paths.accent && <path d={paths.accent} fill="var(--px-accent)" />}
    </Px>
  );
};

// ─── Drawing Tools ───────────────────────────────────

export const PxPencil: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="pencil" />
);

export const PxEraser: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="eraser" />
);

export const PxFill: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="fill" />
);

export const PxPipette: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="pipette" />
);

export const PxLine: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="line" />
);

export const PxRect: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="rect" />
);

export const PxCircle: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="circle" />
);

export const PxSelect: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="select" />
);

export const PxTransform: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="transform" />
);

// ─── Transform Tools ─────────────────────────────────

export const PxRotateCw: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Clean Circular Logic */}
    <path d="M6 1h5v1H6V1zM11 2h2v1h1v1h1v2h-1V4h-1V3h-2V2zM14 6h1v4h-1V6zM11 13h1v-1h1v-1h1v-1H14zM6 13h5v1H6v-1zM3 11h2v1H4v1H3v-2zM2 10h1v1H2v-1z" />
    <path d="M1 5h2v6H1V5zM2 4h1v1H2V4zM3 3h1v1H3V3zM4 2h2v1H4V2z" />
    {/* Arrow Head */}
    <path d="M5 0h6v4H5V0z" />
    <path d="M6 1h4v1H6V1z" fill="var(--px-light)" opacity="0.4" />
  </Px>
);

export const PxFlipH: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Mirror Mirror Metaphor */}
    {/* Source Triangle */}
    <path d="M2 4h4v8H2V4z" />
    <path d="M3 5h2v6H3V5z" fill="var(--px-light)" opacity="0.3" />
    {/* Axis */}
    <path d="M8 1h1v14H8V1z" fill="var(--px-black)" />
    {/* Mirrored Outline Triangle */}
    <path d="M11 4h4v1h-4V4zM11 5h1v6h-1V5zM11 11h4v1h-4v-1zM14 5h1v6h-1V5z" fill="var(--px-base)" />
  </Px>
);

export const PxFlipV: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Mirror Mirror Metaphor */}
    {/* Source Triangle */}
    <path d="M4 2h8v4H4V2z" />
    <path d="M5 3h6v2H5V3z" fill="var(--px-light)" opacity="0.3" />
    {/* Axis */}
    <path d="M1 8h14v1H1V8z" fill="var(--px-black)" />
    {/* Mirrored Outline Triangle */}
    <path d="M4 11h8v1H4v-1zM4 12h1v3H4v-3zM4 14h8v1H4v-1zM11 12h1v3h-1v-3z" fill="var(--px-base)" />
  </Px>
);

export const PxMirror: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Center dotted line */}
    <path d="M7 1h2v2H7V1zM7 5h2v2H7V5zM7 9h2v2H7V9zM7 13h2v2H7v-2z" />
    {/* Left shape */}
    <path d="M2 4h4v8H2V4z" />
    {/* Right shape */}
    <path d="M10 4h4v8h-4V4z" />
  </Px>
);

export const PxClock: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M5 1h6v1h2v1h1v2h1v6h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V5h1V3h1V2h2V1z" />
    <path d="M7 3h2v5H7V3zM7 8h4v2H7V8z" fill="var(--background, #000)" />
  </Px>
);

export const PxCopy: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M5 1h7v1h1v8h-1v1H5v-1H4V2h1V1zM5 2v8h7V2H5z" />
    <path d="M2 5h1v9h7v1H2V5z" />
  </Px>
);

export const PxPaste: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Clipboard */}
    <path d="M4 1h8v1h1v12H3V2h1V1zM4 2v11h8V2H4z" />
    {/* Clip */}
    <path d="M6 0h4v2H6V0z" />
    {/* Lines */}
    <path d="M6 5h4v1H6V5zM6 7h4v1H6V7zM6 9h3v1H6V9z" />
  </Px>
);

export const PxUndo: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="undo" />
);

export const PxRedo: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="redo" />
);

// ─── UI Icons ────────────────────────────────────────

export const PxPlus: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M7 3h2v4h4v2H9v4H7V9H3V7h4V3z" />
  </Px>
);

export const PxMinus: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M3 7h10v2H3V7z" />
  </Px>
);

export const PxX: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M3 3h2v1h1v1h1v1h2V5h1V4h1V3h2v2h-1v1h-1v1h-1v2h1v1h1v1h1v2h-2v-1h-1v-1H9v-1H7v1H6v1H5v1H3v-2h1v-1h1V9h1V7H5V6H4V5H3V3z" />
  </Px>
);

export const PxCheck: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M12 3h2v2h-1v1h-1v1h-1v1H10v1H9v1H8v1H6v-1H5V9H4V8H3V6h2v1h1v1h1v1h1V8h1V7h1V6h1V5h1V3z" />
  </Px>
);

export const PxTrash: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Lid */}
    <path d="M3 2h10v2H3V2z" />
    <path d="M6 1h4v1H6V1z" />
    {/* Body */}
    <path d="M4 5h8v9H4V5z" />
    {/* Lines inside */}
    <path d="M6 7h1v5H6V7zM9 7h1v5H9V7z" fill="var(--background, #000)" />
  </Px>
);

export const PxEye: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M5 4h6v1h2v1h1v4h-1v1h-2v1H5v-1H3v-1H2V6h1V5h2V4zM5 6H3v4h2v1h6v-1h2V6h-2V5H5v1z" />
    {/* Pupil */}
    <path d="M7 7h2v2H7V7z" />
  </Px>
);

export const PxEyeOff: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M5 4h6v1h2v1h1v4h-1v1h-2v1H5v-1H3v-1H2V6h1V5h2V4z" />
    {/* Diagonal slash */}
    <path d="M12 2h2v2h-1v1h-1v1h-1v1h-1v1H9v1H8v1H7v1H6v1H5v1H3v-2h1v-1h1v-1h1V9h1V8h1V7h1V6h1V5h1V4h1V2z" fill="var(--background, #000)" />
  </Px>
);

export const PxLayers: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Perspective Stack */}
    {/* Bottom Layer */}
    <path d="M1 9h6v6H1V9z" fill="var(--px-black)" />
    <path d="M2 10h4v4H2v-4z" />
    
    {/* Middle Layer */}
    <path d="M5 5h6v6H5V5z" fill="var(--px-black)" />
    <path d="M6 6h4v4H6V6z" />
    
    {/* Top Layer */}
    <path d="M9 1h6v6H9V1z" fill="var(--px-black)" />
    <path d="M10 2h4v4h-4V2z" />
    <path d="M10 2h4v1h-4V2z" fill="var(--px-light)" opacity="0.4" />
  </Px>
);

export const PxSun: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Rays */}
    <path d="M7 0h2v2H7V0zM7 14h2v2H7v-2zM0 7h2v2H0V7zM14 7h2v2h-2V7z" />
    <path d="M2 2h2v2H2V2zM12 2h2v2h-2V2zM2 12h2v2H2v-2zM12 12h2v2h-2v-2z" fill="var(--px-light)" opacity="0.6" />
    {/* Center circle with volume */}
    <path d="M6 4h4v1h1v1h1v4h-1v1h-1v1H6v-1H5v-1H4V6h1V5h1V4z" />
    <path d="M6 5h3v1H6V5zM5 6h1v3H5V6z" fill="var(--px-light)" opacity="0.5" />
  </Px>
);

export const PxMoon: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Clean Crescent Logic */}
    <path d="M6 1h4v1h1v1h1v2h-1V4h-1V3H9v1H8v1H7v1H6v4h1v1h1v1h1v1h2v-1h1v-1h1v-1h1v2h-1v1h-1v1H6v-1H5v-1H4v-1H3V5h1V4h1V3h1V1z" />
    {/* Clean shading */}
    <path d="M6 2h3v1H6V2zM5 5h1v4H5V5z" fill="var(--px-light)" opacity="0.4" />
    {/* Small Crater */}
    <path d="M8 10h2v1H8v-1z" fill="var(--px-dark)" opacity="0.3" />
  </Px>
);

export const PxSave: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="save" />
);

export const PxDownload: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="download" />
);

export const PxSearch: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Lens */}
    <path d="M5 2h4v1h1v1h1v4h-1v1H9v1h1v1h1v1h1v1h1v2h-2v-1h-1v-1H9v-1H8V9H5V8H4V7H3V3h1V2h1V2zM5 4H4v3h1v1h4V7h1V4h-1V3H5v1z" />
  </Px>
);

export const PxSparkles: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Glows */}
    <path d="M3 0h3v1H3V0zM4 1h1v1H4V1zM4 3h1v1H4v1H3v1H2V4h2V0z" fill="var(--px-light)" opacity="0.3" />
    {/* Big star */}
    <path d="M4 0h1v3h1v1h1v1H5v3H4V5H3V4H2V3h2V0z" />
    {/* Medium star */}
    <path d="M11 4h1v2h1v1h1v1h-1v1h-1v2h-1V9h-1V8H9V7h1V6h1V4z" />
    <path d="M11 5h1v1h-1V5z" fill="var(--px-light)" opacity="0.5" />
    {/* Small star */}
    <path d="M4 10h1v1h1v1H5v1H4v-1H3v-1h1v-1z" />
  </Px>
);

export const PxArrowLeft: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M6 3h1v1H6v1H5v1H4v1H3v2h1v1h1v1h1v1h1v1H6v-1H5v-1H4V9H3V7h1V6h1V5h1V4h1V3zM7 7h7v2H7V7z" />
  </Px>
);

export const PxChevronLeft: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M9 2h2v1h-1v1H9v1H8v1H7v1H6v2h1v1h1v1h1v1h1v1h1v1H9v-1H8v-1H7v-1H6v-1H5V6h1V5h1V4h1V3h1V2z" />
  </Px>
);

export const PxChevronRight: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M5 2h2v1h1v1h1v1h1v1h1v1h1v2h-1v1h-1v1H9v1H8v1H7v1H5v-1h1v-1h1v-1h1V9h1V7H8V6H7V5H6V4H5V2z" />
  </Px>
);

export const PxChevronUp: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M7 4h2v1h1v1h1v1h1v1h1v2h-1V9h-1V8h-1V7H9V6H7v1H6v1H5v1H4v1H3V8h1V7h1V6h1V5h1V4z" />
  </Px>
);

export const PxChevronDown: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M3 5h1v1h1v1h1v1h1v1h2V8h1V7h1V6h1V5h1v2h-1v1h-1v1H9v1H7v-1H6V9H5V8H4V7H3V5z" />
  </Px>
);

export const PxPlay: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M4 2h2v1h1v1h1v1h1v1h1v2h-1v1H8v1H7v1H6v1H4V2z" />
  </Px>
);

export const PxPause: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M3 2h4v12H3V2zM9 2h4v12H9V2z" />
  </Px>
);

export const PxFilm: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M1 1h14v14H1V1z" />
    <path d="M2 2h12v1H2V2z" fill="var(--px-light)" opacity="0.3" />
    {/* Sprocket holes */}
    <path d="M2 3h2v2H2V3zM2 7h2v2H2V7zM2 11h2v2H2v-2zM12 3h2v2h-2V3zM12 7h2v2h-2V7zM12 11h2v2h-2v-2z" fill="var(--px-black)" />
    <path d="M2 5h2v1H2V5zM2 9h2v1H2V9zM2 13h2v1H2v-1zM12 5h2v1h-2V5zM12 9h2v1h-2V9zM12 13h2v1h-2v-1z" fill="var(--px-dark)" opacity="0.4" />
    {/* Center */}
    <path d="M5 3h6v10H5V3z" fill="var(--px-black)" />
  </Px>
);

export const PxPalette: React.FC<PixelIconProps> = (p) => (
  <DynamicPx {...p} iconId="palette" />
);

export const PxSword: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Blade */}
    <path d="M12 1h2v1h1v3h-1v1h-1v1h-1v1H11v1h-1v1H6V9H5V8H4V7H3V5h1v1h1v1h1v1h1V7h1V6h1V5h1V4h1V3h1V2h1V1z" />
    {/* Blade highlight & glint */}
    <path d="M12 2h1v1h1v1h-1V3h-1V2zM11 3h1v1H11V3zM10 4h1v1h-1V4z" fill="var(--px-light)" />
    <path d="M13 1h1v1h-1V1z" fill="white" opacity="0.4" />
    {/* Guard */}
    <path d="M4 9h1v1h1v1H4V9zM8 11h2v1h1v1H8v-2z" fill="var(--px-dark)" />
    {/* Handle */}
    <path d="M3 11h1v1h1v1H4v1H3v-1H2v-1h1v-1z" />
  </Px>
);

export const PxSettings: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* 12x12 Centered Premium Gear */}
    {/* Gear teeth */}
    <path d="M7 1h2v3H7V1zM7 12h2v3H7v-3zM1 7h3v2H1V7zM12 7h3v2h-3V7z" />
    <path d="M3 3h2v2H3V3zM11 3h2v2h-2V3zM3 11h2v2H3v-2zM11 11h2v2h-2v-2z" />
    {/* Gear base body */}
    <path d="M5 4h6v1h1v1h1v4h-1v1h-1v1H5v-1H4v-1H3V6h1V5h1V4z" />
    {/* Top bevel highlight */}
    <path d="M5 4h6v1H5V4zM4 5h1v4H4V5z" fill="var(--px-light)" opacity="0.4" />
    {/* Center hole */}
    <path d="M7 7h2v2H7V7z" fill="var(--px-black)" />
  </Px>
);

export const PxImage: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M1 2h14v12H1V2z" />
    {/* Sky Highlight */}
    <path d="M2 3h12v1H2V3z" fill="var(--px-light)" opacity="0.3" />
    {/* Mountains */}
    <path d="M4 10h1V9h1V8h1V7h1v1h1v1h1V7h1V6h1v1h1v5H2v-2h2z" fill="var(--px-black)" />
    {/* Mountain Shading & Highlights */}
    <path d="M5 10h1v1H5v-1zM7 8h1v3H7V8zM10 8h1v3h-1V8zM12 7h1v4h-1V7z" fill="var(--px-dark)" opacity="0.5" />
    <path d="M4 10h1v1H4v-1zM6 8h1v2H6V8zM11 7h1v2h-1V7z" fill="var(--px-light)" opacity="0.3" />
    {/* Sun with halo */}
    <path d="M3 3h4v4H3V3z" fill="var(--px-light)" opacity="0.2" />
    <path d="M4 4h2v2H4V4z" fill="var(--px-light)" />
  </Px>
);

export const PxFileVideo: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M2 1h8v1h1v1h1v1h1v10H3v-1H2V1z" />
    <path d="M3 2h7v1H3V2z" fill="var(--px-light)" opacity="0.3" />
    <path d="M10 1v3h3" />
    {/* Play button */}
    <path d="M6 7h1v1h1v1h1v1H8v1H7v1H6V7z" fill="var(--px-black)" />
    <path d="M6 7h1v1H6V7z" fill="var(--px-light)" opacity="0.4" />
  </Px>
);

export const PxHardDrive: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M2 3h12v10H2V3z" />
    {/* Top highlight */}
    <path d="M3 4h10v1H3V4z" fill="var(--px-light)" opacity="0.4" />
    {/* Mechanical Grill */}
    <path d="M4 6h8v1H4V6zM4 8h8v1H4V8z" fill="var(--px-dark)" opacity="0.3" />
    {/* Dark area */}
    <path d="M2 9h12v4H2V9z" fill="var(--px-black)" />
    <path d="M2 9h12v1H2V9z" fill="var(--px-dark)" />
    {/* Activity lights */}
    <path d="M11 11h2v1h-2v-1z" fill="var(--px-light)" />
    <path d="M9 11h1v1H9v-1z" fill="var(--px-light)" opacity="0.4" />
  </Px>
);

export const PxTag: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M2 1h6v1h1v1h1v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1H9v1H8v1H7V8H6V7H5V6H4V5H3V4H2V1z" />
    <path d="M4 3h2v2H4V3z" fill="var(--background, #000)" />
  </Px>
);

export const PxHash: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M5 1h2v3h2V1h2v3h3v2h-3v2h3v2h-3v3H9V9H7v3H5V9H2V7h3V5H2V3h3V1zM7 5v2h2V5H7z" />
  </Px>
);

export const PxUser: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Head */}
    <path d="M6 1h4v1h1v3h-1v1H6V5H5V2h1V1z" />
    {/* Body */}
    <path d="M4 8h8v1h1v5H3V9h1V8z" />
  </Px>
);

export const PxPackage: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Asset Crate / Supply box */}
    <path d="M2 3h12v11H2V3z" />
    {/* Lid detail */}
    <path d="M2 3h12v2H2V3zM6 1h4v3H6V1z" />
    {/* Highlights and wood planks */}
    <path d="M3 4h10v1H3V4z" fill="var(--px-light)" opacity="0.4" />
    {/* Planks & Reinforcement */}
    <path d="M2 7h12v1H2V7zM2 10h12v1H2v-1z" fill="var(--px-black)" opacity="0.4" />
    <path d="M7 5h2v9H7V5z" fill="var(--px-black)" />
    <path d="M7 5h2v1H7V5z" fill="var(--px-light)" opacity="0.3" />
  </Px>
);

export const PxGrid: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M1 1h6v6H1V1zM9 1h6v6H9V1zM1 9h6v6H1V9zM9 9h6v6H9V9z" />
    <path d="M2 2h4v4H2V2zM10 2h4v4h-4V2zM2 10h4v4H2v-4zM10 10h4v4h-4v-4z" fill="var(--background, #000)" />
  </Px>
);

export const PxEdit: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Pencil body */}
    <path d="M10 1h2v1h1v2h-1v1h-1v1H10v1H9v1H8v1H7v1H6v1H5v1H3v-1H2V9h1V8h1V7h1V6h1V5h1V4h1V3h1V2h1V1z" />
    {/* Pencil highlight */}
    <path d="M11 2h1v1h1v1h-1V3h-1V2zM10 3h1v1h-1V3zM9 4h1v1H9V4zM8 5h1v1H8V5z" fill="var(--px-light)" />
    {/* Pencil tip (wood) */}
    <path d="M3 11h2v1H3v-1z" fill="var(--px-light)" opacity="0.6" />
    {/* Graphite */}
    <path d="M2 12h1v1H2v-1z" fill="black" opacity="0.8" />
    {/* Bottom line */}
    <path d="M2 13h12v1H2v-1z" fill="var(--px-black)" />
  </Px>
);

export const PxArrowDownToLine: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M7 1h2v6h3v1h-1v1h-1v1H9v1H7v-1H6V9H5V8H4V7h3V1z" />
    <path d="M3 13h10v2H3v-2z" />
  </Px>
);

export const PxLoader: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M7 1h2v3H7V1z" />
    <path d="M11 3h2v2h-2V3z" />
    <path d="M13 7h2v2h-2V7z" />
    <path d="M11 11h2v2h-2v-2z" />
    <path d="M7 13h2v2H7v-2z" />
    <path d="M3 11h2v2H3v-2z" />
    <path d="M1 7h2v2H1V7z" />
    <path d="M3 3h2v2H3V3z" />
  </Px>
);

export const PxXCircle: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M5 1h6v1h2v1h1v2h1v6h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V5h1V3h1V2h2V1z" />
    {/* X mark */}
    <path d="M5 5h1v1h1v1h2V6h1V5h1v1h-1v1h-1v2h1v1h1v1h-1v-1H9v-1H7v1H6v1H5v-1h1v-1h1V8H6V7H5V5z" fill="var(--background, #000)" />
  </Px>
);

export const PxMonitor: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M1 1h14v10H1V1z" />
    <path d="M2 2h12v1H2V2z" fill="var(--px-light)" opacity="0.4" />
    <path d="M2 3h12v7H2V3z" fill="var(--px-black)" />
    {/* Screen glow */}
    <path d="M3 3h2v1H3V3z" fill="var(--px-light)" opacity="0.1" />
    <path d="M6 12h4v1H6v-1zM5 13h6v1H5v-1z" />
  </Px>
);

export const PxResetRotate: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M4 2h1V1h2v2H6v1H5v1H4v1H3v4h1v1h1v1h5V9H6V8h5v3h-1v1H5v-1H4v-1H3v-1H2V5h1V4h1V3z" />
    <path d="M4 2H2v1h1v1h1V2z" />
  </Px>
);

// ─── Convenience map for dynamic lookup ──────────────

export const PIXEL_ICONS = {
  pencil: PxPencil,
  eraser: PxEraser,
  fill: PxFill,
  pipette: PxPipette,
  line: PxLine,
  rect: PxRect,
  circle: PxCircle,
  select: PxSelect,
  rotateCw: PxRotateCw,
  flipH: PxFlipH,
  flipV: PxFlipV,
  mirror: PxMirror,
  copy: PxCopy,
  paste: PxPaste,
  clock: PxClock,
  undo: PxUndo,
  redo: PxRedo,
  plus: PxPlus,
  minus: PxMinus,
  x: PxX,
  check: PxCheck,
  trash: PxTrash,
  eye: PxEye,
  eyeOff: PxEyeOff,
  layers: PxLayers,
  sun: PxSun,
  moon: PxMoon,
  save: PxSave,
  download: PxDownload,
  search: PxSearch,
  sparkles: PxSparkles,
  arrowLeft: PxArrowLeft,
  chevronLeft: PxChevronLeft,
  chevronRight: PxChevronRight,
  chevronUp: PxChevronUp,
  chevronDown: PxChevronDown,
  play: PxPlay,
  pause: PxPause,
  film: PxFilm,
  palette: PxPalette,
  sword: PxSword,
  settings: PxSettings,
  image: PxImage,
  fileVideo: PxFileVideo,
  hardDrive: PxHardDrive,
  tag: PxTag,
  hash: PxHash,
  user: PxUser,
  package: PxPackage,
  grid: PxGrid,
  edit: PxEdit,
  transform: PxTransform,
  arrowDownToLine: PxArrowDownToLine,
  loader: PxLoader,
  xCircle: PxXCircle,
  monitor: PxMonitor,
  resetRotate: PxResetRotate,
} as const;

export const PxFolder: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M1 3h5v1h1v1h7v1h1v7H1V3z" />
    <path d="M2 5h12v7H2V5z" fill="var(--background, #000)" />
  </Px>
);

export const PxLogOut: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    <path d="M2 2h6v2H4v8h4v2H2V2z" />
    <path d="M8 7h5V5h1v1h1v1h1v2h-1v1h-1v1h-1V9H8V7z" />
  </Px>
);

export const PxUpload: React.FC<PixelIconProps> = (p) => (
  <Px {...p}>
    {/* Arrow pointing up */}
    <path d="M7 4h2v6h3v1h-1v-1H9v-1H7v1H5v1H4v-1h3V4zM6 5H5V4H4v1h1v1h1V5zM10 5h1v1h1V5h-1V4h-1v1z" />
    <path d="M7 1h2v1h1v1h1v1h-1V3H9V2H7v1H6v1H5V3h1V2h1V1z" />
    {/* Base tray */}
    <path d="M3 13h10v2H3v-2z" />
  </Px>
);
