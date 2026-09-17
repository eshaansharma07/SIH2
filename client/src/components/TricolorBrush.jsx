import React from 'react';

/**
 * Reusable Indian Tricolor Brush Stroke SVG Component
 * Handcrafted organic watercolor stroke (Saffron, White, Green)
 */
export function TricolorBrush({ className = 'w-24 h-3', ...props }) {
  return (
    <svg 
      viewBox="0 0 160 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none pointer-events-none ${className}`}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <filter id="tricolor-brush-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="rgba(0,0,0,0.08)" />
        </filter>
      </defs>
      <g filter="url(#tricolor-brush-glow)">
        {/* Saffron Stroke */}
        <path 
          d="M4 4.2 C 28 3.3, 62 3.7, 95 3.9 C 122 4.1, 146 3.5, 156 4.6 C 158 4.8, 153 5.9, 144 5.8 C 114 5.4, 76 5.6, 38 5.5 C 19 5.4, 2 5.6, 4 4.2 Z" 
          fill="#E26A1B" 
        />
        {/* Soft White/Ivory Stroke */}
        <path 
          d="M12 7.2 C 40 6.8, 82 7.0, 118 6.9 C 136 6.8, 150 7.2, 148 7.9 C 134 8.2, 96 8.0, 56 8.1 C 32 8.2, 8 8.0, 12 7.2 Z" 
          fill="#FFFDF8" 
        />
        {/* Indian Forest Green Stroke */}
        <path 
          d="M6 10.2 C 32 9.6, 72 9.9, 108 9.8 C 134 9.7, 151 10.1, 154 11.1 C 147 11.8, 122 11.4, 88 11.6 C 52 11.8, 16 11.7, 8 11.3 C 4 11.0, 3 10.4, 6 10.2 Z" 
          fill="#13773B" 
        />
      </g>
    </svg>
  );
}

export default TricolorBrush;
