import React from 'react';

/**
 * Modern Apple Health / Watch style Alternative Credit Score Dial
 * Renders an ultra-clean, ambient-glow arc (300 to 850) with high-contrast typography.
 */
export function CreditGauge({ 
  score = 755, 
  maxScore = 850, 
  minScore = 300, 
  ratingLabel = "Prime Bankable (ऋण के लिए पात्र)", 
  compact = false 
}) {
  const clampedScore = Math.min(maxScore, Math.max(minScore, score));
  const percentage = (clampedScore - minScore) / (maxScore - minScore);
  
  // Angle for 180-degree arc: -180deg (left) to 0deg (right)
  const angle = -180 + percentage * 180;
  
  const radius = compact ? 65 : 85;
  const cx = compact ? 85 : 110;
  const cy = compact ? 78 : 98;
  
  const needleRad = (angle * Math.PI) / 180;
  const dotX = cx + radius * Math.cos(needleRad);
  const dotY = cy + radius * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center justify-center select-none py-1">
      <div className="relative">
        <svg 
          width={compact ? 170 : 220} 
          height={compact ? 95 : 115} 
          viewBox={compact ? "0 0 170 95" : "0 0 220 115"}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="appleCreditGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F43F5E" />    {/* Rose */}
              <stop offset="30%" stopColor="#F59E0B" />   {/* Amber */}
              <stop offset="65%" stopColor="#10B981" />   {/* Emerald */}
              <stop offset="100%" stopColor="#059669" />  {/* Deep Emerald */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10B981" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={compact ? "10" : "14"}
            strokeLinecap="round"
          />

          {/* Colored Value Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#appleCreditGrad)"
            strokeWidth={compact ? "10" : "14"}
            strokeLinecap="round"
            strokeDasharray={`${radius * Math.PI}`}
            strokeDashoffset={`${radius * Math.PI * (1 - percentage)}`}
            filter="url(#glow)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Active Dot Marker */}
          <circle 
            cx={dotX} 
            cy={dotY} 
            r={compact ? "5" : "6"} 
            fill="#FFFFFF" 
            stroke="#0F172A"
            strokeWidth="3"
            className="transition-all duration-1000 ease-out drop-shadow-md"
          />

          {/* Scale Labels */}
          <text x={cx - radius} y={cy + 16} fontSize="10" fontWeight="700" fill="#94A3B8" textAnchor="middle">300</text>
          <text x={cx} y={cy - radius - 6} fontSize="9" fontWeight="700" fill="#94A3B8" textAnchor="middle">600</text>
          <text x={cx + radius} y={cy + 16} fontSize="10" fontWeight="700" fill="#94A3B8" textAnchor="middle">850</text>
        </svg>
      </div>

      {/* Score Number & Badge */}
      <div className="mt-0.5 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className={`${compact ? 'text-3xl' : 'text-4xl'} font-extrabold text-slate-900 tracking-tight tabular-nums`}>
            {clampedScore}
          </span>
          <span className="text-xs font-semibold text-slate-400">/ {maxScore}</span>
        </div>

        <div className="mt-1">
          <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold border transition ${
            clampedScore >= 750 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : clampedScore >= 650 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{ratingLabel}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
