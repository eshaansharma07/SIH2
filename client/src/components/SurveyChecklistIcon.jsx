import React from 'react';

/**
 * Bespoke Handcrafted Survey Checklist Illustration (SVG)
 * Replaces cropped screenshot icon with a sharp, Retina-crisp vector asset
 */
export function SurveyChecklistIcon({ className = 'w-28 h-28', ...props }) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none drop-shadow-xs ${className}`}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <filter id="survey-svg-drop" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(28,25,23,0.08)" />
        </filter>
      </defs>

      {/* Botanical Green Leaves behind clipboard */}
      <g opacity="0.85">
        <path d="M28 32 C 16 28, 12 18, 15 10 C 24 12, 30 18, 32 26 Z" fill="#2D6A4F" />
        <path d="M15 10 Q 24 22 30 28" stroke="#1B4332" strokeWidth="1" strokeLinecap="round" />
        <path d="M96 82 C 106 85, 112 94, 108 102 C 100 100, 94 94, 92 86 Z" fill="#40916C" />
      </g>

      {/* Main Wooden Clipboard Body */}
      <rect x="24" y="16" width="72" height="92" rx="10" fill="#E8DEC8" stroke="#C4B598" strokeWidth="1.5" filter="url(#survey-svg-drop)" />
      <rect x="26" y="18" width="68" height="88" rx="8" fill="#F4EDE0" />

      {/* Clipboard Top Metal Clip */}
      <rect x="44" y="12" width="32" height="10" rx="3" fill="#D5CAB4" stroke="#9E9076" strokeWidth="1.5" />
      <circle cx="60" cy="17" r="2.5" fill="#FAF8F5" stroke="#9E9076" strokeWidth="1" />

      {/* Warm Ivory Paper Sheet */}
      <rect x="30" y="26" width="60" height="74" rx="5" fill="#FAF8F5" stroke="#E2D7C3" strokeWidth="1" />

      {/* Checklist Item 1 */}
      <rect x="36" y="36" width="10" height="10" rx="2.5" fill="#E8F5E9" stroke="#2D6A4F" strokeWidth="1.2" />
      <path d="M38.5 41 L41 43.5 L46 38.5" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="41" x2="80" y2="41" stroke="#57534E" strokeWidth="2" strokeLinecap="round" />

      {/* Checklist Item 2 */}
      <rect x="36" y="52" width="10" height="10" rx="2.5" fill="#E8F5E9" stroke="#2D6A4F" strokeWidth="1.2" />
      <path d="M38.5 57 L41 59.5 L46 54.5" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="57" x2="76" y2="57" stroke="#57534E" strokeWidth="2" strokeLinecap="round" />

      {/* Checklist Item 3 */}
      <rect x="36" y="68" width="10" height="10" rx="2.5" fill="#E8F5E9" stroke="#2D6A4F" strokeWidth="1.2" />
      <path d="M38.5 73 L41 75.5 L46 70.5" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="73" x2="72" y2="73" stroke="#57534E" strokeWidth="2" strokeLinecap="round" />

      {/* Small Tilted Wooden Pencil */}
      <g transform="rotate(32 88 88)">
        <rect x="84" y="62" width="6" height="34" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1" />
        <path d="M84 96 L87 102 L90 96 Z" fill="#F5EBE1" stroke="#92400E" strokeWidth="1" />
        <polygon points="86,100 87,102 88,100" fill="#1C1917" />
        <rect x="84" y="58" width="6" height="6" rx="1.5" fill="#DC2626" />
        <rect x="84" y="61" width="6" height="2" fill="#D1D5DB" />
      </g>
    </svg>
  );
}

export default SurveyChecklistIcon;
