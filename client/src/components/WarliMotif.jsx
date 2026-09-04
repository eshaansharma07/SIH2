import React from 'react';

/**
 * Traditional Warli Folk Art Line Motifs
 * Handcrafted geometric tribal figures: triangular bodies, circular heads,
 * rhythmic dancing circles, and agricultural celebration lines.
 */

export function WarliBorder({ className = "w-full h-8 text-terracotta-400 opacity-70" }) {
  return (
    <div className={`overflow-hidden flex items-center justify-center my-2 ${className}`}>
      <svg viewBox="0 0 800 24" className="w-full h-6 fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Repeating Warli border motif: dancing pairs & triangular trees */}
        <pattern id="warli-pattern" width="80" height="24" patternUnits="userSpaceOnUse">
          {/* Tree/sprout */}
          <line x1="10" y1="20" x2="10" y2="4" />
          <line x1="10" y1="12" x2="4" y2="7" />
          <line x1="10" y1="12" x2="16" y2="7" />
          <line x1="10" y1="7" x2="6" y2="3" />
          <line x1="10" y1="7" x2="14" y2="3" />
          {/* Villager 1 */}
          <circle cx="30" cy="5" r="2.5" />
          <polygon points="30,8 26,14 34,14" fill="currentColor" opacity="0.3" />
          <polygon points="30,17 26,13 34,13" fill="currentColor" opacity="0.3" />
          <line x1="26" y1="14" x2="30" y2="18" />
          <line x1="30" y1="18" x2="26" y2="23" />
          <line x1="30" y1="18" x2="34" y2="23" />
          <line x1="26" y1="11" x2="34" y2="11" />
          {/* Villager 2 with flute / hands held */}
          <circle cx="50" cy="5" r="2.5" />
          <polygon points="50,8 46,14 54,14" fill="currentColor" opacity="0.3" />
          <polygon points="50,17 46,13 54,13" fill="currentColor" opacity="0.3" />
          <line x1="50" y1="17" x2="46" y2="23" />
          <line x1="50" y1="17" x2="54" y2="23" />
          <line x1="46" y1="11" x2="54" y2="11" />
          {/* Hand connector */}
          <line x1="34" y1="11" x2="46" y2="11" strokeDasharray="1 1" />
          {/* Diamond sun/grain mark */}
          <polygon points="70,7 74,12 70,17 66,12" />
          <line x1="70" y1="4" x2="70" y2="20" />
        </pattern>
        <rect width="800" height="24" fill="url(#warli-pattern)" />
      </svg>
    </div>
  );
}

export function WarliCircle({ size = 120, className = "text-terracotta-600" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={`fill-none stroke-current ${className}`} strokeWidth="1.6" strokeLinecap="round">
      {/* Central folk celebration circle: sun/tree surrounded by dancing villagers */}
      <circle cx="60" cy="60" r="14" strokeWidth="1.2" strokeDasharray="3 2" />
      {/* Central Tree */}
      <line x1="60" y1="68" x2="60" y2="52" />
      <line x1="60" y1="58" x2="55" y2="54" />
      <line x1="60" y1="58" x2="65" y2="54" />
      <circle cx="60" cy="50" r="2" fill="currentColor" />

      {/* 8 Outer Dancing Figures */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 60 + Math.cos(rad) * 38;
        const cy = 60 + Math.sin(rad) * 38;
        return (
          <g key={i} transform={`rotate(${angle + 90} ${cx} ${cy})`}>
            <circle cx={cx} cy={cy - 6} r="2" fill="currentColor" />
            <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 4} strokeWidth="2" />
            <line x1={cx - 4} y1={cy - 1} x2={cx + 4} y2={cy - 1} />
            <line x1={cx} y1={cy + 4} x2={cx - 3} y2={cy + 9} />
            <line x1={cx} y1={cy + 4} x2={cx + 3} y2={cy + 9} />
          </g>
        );
      })}
      <circle cx="60" cy="60" r="48" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
    </svg>
  );
}

export function WarliSun({ size = 48, className = "text-ochre-500" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={`fill-none stroke-current ${className}`} strokeWidth="1.6">
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      {/* Radiating sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 24 + Math.cos(rad) * 12;
        const y1 = 24 + Math.sin(rad) * 12;
        const x2 = 24 + Math.cos(rad) * 18;
        const y2 = 24 + Math.sin(rad) * 18;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function WarliFarmer({ className = "text-terracotta-700 opacity-60 w-32 h-20" }) {
  return (
    <svg viewBox="0 0 160 80" className={`fill-none stroke-current ${className}`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* Bullock Pair */}
      {/* Bull 1 */}
      <circle cx="40" cy="35" r="3.5" />
      <line x1="43" y1="33" x2="48" y2="28" /> {/* Horn */}
      <line x1="39" y1="32" x2="43" y2="27" /> {/* Horn */}
      <line x1="40" y1="38" x2="22" y2="44" strokeWidth="2" /> {/* Body */}
      <line x1="22" y1="44" x2="16" y2="60" /> {/* Hind Leg */}
      <line x1="24" y1="44" x2="20" y2="60" />
      <line x1="38" y1="40" x2="34" y2="60" /> {/* Fore Leg */}
      <line x1="40" y1="40" x2="38" y2="60" />
      <line x1="22" y1="44" x2="18" y2="52" /> {/* Tail */}

      {/* Yoke & Plough Beam */}
      <line x1="40" y1="38" x2="100" y2="45" strokeDasharray="3 1" />
      <line x1="90" y1="44" x2="110" y2="64" strokeWidth="2" /> {/* Plough blade */}

      {/* Farmer behind plough */}
      <circle cx="120" cy="25" r="4" fill="currentColor" opacity="0.3" />
      {/* Triangular body */}
      <polygon points="120,29 114,42 126,42" fill="currentColor" opacity="0.2" />
      <polygon points="120,49 114,42 126,42" fill="currentColor" opacity="0.2" />
      <line x1="120" y1="49" x2="114" y2="65" />
      <line x1="120" y1="49" x2="124" y2="65" />
      <line x1="114" y1="36" x2="105" y2="44" /> {/* Hands holding plough handle */}
      <line x1="126" y1="36" x2="108" y2="44" />

      {/* Crop stalks */}
      <line x1="140" y1="65" x2="140" y2="50" />
      <line x1="140" y1="55" x2="135" y2="48" />
      <line x1="140" y1="52" x2="145" y2="46" />
      <line x1="150" y1="65" x2="150" y2="48" />
      <line x1="150" y1="54" x2="146" y2="48" />
      <line x1="150" y1="51" x2="155" y2="45" />
    </svg>
  );
}
