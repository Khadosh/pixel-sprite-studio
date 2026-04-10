import React from 'react';

interface PixelWarningIconProps {
  size?: number;
  className?: string;
  color?: string;
  markColor?: string;
}

export const PixelWarningIcon: React.FC<PixelWarningIconProps> = ({ 
  size = 64, 
  className = "",
  color = "currentColor",
  markColor = "white"
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ shapeRendering: 'crispEdges' }}
    >
      {/* Pixelated Triangle Background */}
      <path d="M7 1h2v1H7V1z" fill={color} />
      <path d="M6 2h4v1H6V2z" fill={color} />
      <path d="M5 3h6v1H5V3z" fill={color} />
      <path d="M4 4h8v1H4V4z" fill={color} />
      <path d="M3 5h10v1H3V5z" fill={color} />
      <path d="M2 6h12v1H2V6z" fill={color} />
      <path d="M1 7h14v1H1V7z" fill={color} />
      <path d="M0 8h16v1H0V8z" fill={color} />
      <path d="M0 9h16v1H0V9z" fill={color} />
      <path d="M1 10h14v1H1V10z" fill={color} />
      <path d="M2 11h12v1H2v-1z" fill={color} />
      <path d="M3 12h10v1H3v-1z" fill={color} />
      <path d="M4 13h8v1H4v-1z" fill={color} />
      <path d="M5 14h6v1H5v-1z" fill={color} />
      <path d="M6 15h4v1H6v-1z" fill={color} />

      {/* Exclamation Mark - Body */}
      <path d="M7 4h2v5H7V4z" fill={markColor} />
      {/* Exclamation Mark - Dot */}
      <path d="M7 10h2v2H7v-2z" fill={markColor} />
    </svg>
  );
};
