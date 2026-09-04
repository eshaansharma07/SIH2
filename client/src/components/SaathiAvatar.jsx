import React from 'react';

/**
 * Saathi AI Avatar: Warm Earthen Terracotta Diya with Folded Hands Greeting
 * Strictly adheres to human, rural-first aesthetic — NO robots, glowing neon or circuits.
 */
export function SaathiAvatar({ size = 'md', glowing = false, className = '' }) {
  const dimensions = {
    sm: { width: 36, height: 36 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 88, height: 88 },
  }[size] || { width: 48, height: 48 };

  return (
    <div className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-terracotta-100 via-paper-200 to-ochre-100 border border-terracotta-300 shadow-paper ${className}`}
         style={{ width: dimensions.width, height: dimensions.height }}>
      
      {glowing && (
        <div className="absolute inset-0 rounded-2xl bg-ochre-400/20 blur-sm animate-pulse -z-10" />
      )}

      <svg 
        viewBox="0 0 48 48" 
        className="w-4/5 h-4/5 fill-none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Glow halo behind flame */}
        <circle cx="24" cy="18" r="9" className="fill-ochre-200/60" />

        {/* Earthen Clay Diya Body (Terracotta) */}
        <path 
          d="M10 26 C10 35, 38 35, 38 26 C36 29, 28 32, 24 32 C20 32, 12 29, 10 26 Z" 
          className="fill-terracotta-500 stroke-terracotta-700" 
          strokeWidth="1.8" 
        />
        {/* Diya Base stand */}
        <ellipse cx="24" cy="34" rx="7" ry="2.5" className="fill-terracotta-600 stroke-terracotta-800" strokeWidth="1.2" />

        {/* Traditional Clay Diya Lip rim */}
        <path 
          d="M8 26 C14 28, 34 28, 40 26 C36 24, 12 24, 8 26 Z" 
          className="fill-terracotta-400 stroke-terracotta-600" 
          strokeWidth="1.4" 
        />

        {/* Flame Wick & Glowing Flame */}
        <path 
          d="M24 23 C22 20, 20 16, 24 10 C28 16, 26 20, 24 23 Z" 
          className="fill-ochre-400 stroke-ochre-600 animate-pulse" 
          strokeWidth="1.5" 
        />
        <circle cx="24" cy="16" r="2.2" className="fill-white" />

        {/* Small Namaste / Folded Hands motif below rim */}
        <path 
          d="M22 27 L24 25 L26 27" 
          className="stroke-terracotta-100" 
          strokeWidth="1.2" 
        />
      </svg>
    </div>
  );
}

export function SaathiBadge({ text = "व्यापार साथी", subtext = "AI Advisor" }) {
  return (
    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-terracotta-50 border border-terracotta-200 rounded-full shadow-sm">
      <SaathiAvatar size="sm" glowing={false} />
      <div className="flex flex-col text-left">
        <span className="text-xs font-bold text-terracotta-800 leading-tight">{text}</span>
        {subtext && <span className="text-[10px] text-stone-500 leading-tight">{subtext}</span>}
      </div>
    </div>
  );
}
