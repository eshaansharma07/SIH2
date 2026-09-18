import React from 'react';

/**
 * Clean Hairline Divider & Folk Geometric Accents for SaakhSetu
 * Designed with Apple-grade restraint: subtle hairline border with
 * a refined centered anchor, replacing intrusive clip-art lines.
 */

export function WarliBorder({ className = "w-full my-3" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="w-full border-t border-stone-200/80" />
      <div className="absolute px-2.5 bg-inherit">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 block" />
      </div>
    </div>
  );
}

export function WarliCircle({ size = 48, className = "text-amber-700/40" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={`fill-none stroke-current ${className}`} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="24" cy="24" r="18" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="24" cy="24" r="6" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}

export function WarliSun({ size = 32, className = "text-amber-600/60" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`fill-none stroke-current ${className}`} strokeWidth="1.4">
      <circle cx="16" cy="16" r="6" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 16 + Math.cos(rad) * 8;
        const y1 = 16 + Math.sin(rad) * 8;
        const x2 = 16 + Math.cos(rad) * 12;
        const y2 = 16 + Math.sin(rad) * 12;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function WarliFarmer({ className = "text-stone-400 opacity-40 w-24 h-14" }) {
  return (
    <svg viewBox="0 0 160 80" className={`fill-none stroke-current ${className}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="35" r="3.5" />
      <line x1="43" y1="33" x2="48" y2="28" />
      <line x1="39" y1="32" x2="43" y2="27" />
      <line x1="40" y1="38" x2="22" y2="44" strokeWidth="1.8" />
      <line x1="22" y1="44" x2="16" y2="60" />
      <line x1="24" y1="44" x2="20" y2="60" />
      <line x1="38" y1="40" x2="34" y2="60" />
      <line x1="40" y1="40" x2="38" y2="60" />
      <line x1="40" y1="38" x2="100" y2="45" strokeDasharray="3 1" />
      <line x1="90" y1="44" x2="110" y2="64" strokeWidth="1.8" />
      <circle cx="120" cy="25" r="3.5" fill="currentColor" opacity="0.2" />
      <line x1="120" y1="49" x2="114" y2="65" />
      <line x1="120" y1="49" x2="124" y2="65" />
    </svg>
  );
}
