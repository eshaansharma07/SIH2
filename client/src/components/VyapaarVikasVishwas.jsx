import React from 'react';
import { TricolorBrush } from './TricolorBrush';

/**
 * Handcrafted Vyapaar Vikas Vishwas Artistic Motif
 * Combines minimalist rural tree/village line art, Devanagari typography,
 * and the signature Indian tricolor brush stroke.
 */
export function VyapaarVikasVishwas({ className = '' }) {
  return (
    <div className={`flex flex-col items-center select-none pointer-events-none ${className}`}>
      {/* Delicate rural village & banyan tree line art */}
      <svg 
        viewBox="0 0 160 36" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-28 h-6 text-[#0F3E2E] opacity-75"
        aria-hidden="true"
      >
        {/* Distant gentle hill line */}
        <path d="M10 28 Q 45 18 80 26 Q 115 20 150 28" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1 2" opacity="0.5" />
        
        {/* Center Banyan Tree */}
        <path d="M80 30 L80 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M78 24 Q 72 26 74 30" stroke="currentColor" strokeWidth="0.8" />
        <path d="M82 24 Q 88 26 86 30" stroke="currentColor" strokeWidth="0.8" />
        <path d="M80 18 C 70 18 64 10 74 6 C 78 2 82 2 86 6 C 96 10 90 18 80 18 Z" fill="#0F3E2E" fillOpacity="0.18" stroke="currentColor" strokeWidth="1" />
        
        {/* Left Small Hut */}
        <path d="M42 28 L42 22 L52 22 L52 28 Z" stroke="currentColor" strokeWidth="0.9" fill="#FAF8F5" />
        <path d="M40 22 L47 16 L54 22 Z" stroke="currentColor" strokeWidth="1" fill="#0F3E2E" fillOpacity="0.25" />

        {/* Right Small Hut */}
        <path d="M108 28 L108 23 L116 23 L116 28 Z" stroke="currentColor" strokeWidth="0.9" fill="#FAF8F5" />
        <path d="M106 23 L112 18 L118 23 Z" stroke="currentColor" strokeWidth="1" fill="#0F3E2E" fillOpacity="0.25" />

        {/* Flying birds */}
        <path d="M60 8 Q 63 6 66 8 Q 69 6 72 8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M92 7 Q 94 5 96 7 Q 98 5 100 7" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        
        {/* Ground baseline */}
        <line x1="20" y1="30" x2="140" y2="30" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>

      {/* Calligraphic Hindi Motto */}
      <span className="font-serif font-bold text-[11px] text-[#0F3E2E] tracking-wider mt-0.5 text-center">
        व्यापार • विकास • विश्वास
      </span>

      {/* Tricolor brush stroke accent */}
      <div className="mt-1">
        <TricolorBrush className="w-20 h-2.5" />
      </div>
    </div>
  );
}

export default VyapaarVikasVishwas;
