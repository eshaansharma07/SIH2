import React from 'react';

/**
 * Transparent Alternative Credit Score Gauge
 * Renders a warm, readable semi-circular dial (300 to 850)
 * with clear rural credit readiness tiers.
 */
export function CreditGauge({ score = 715, maxScore = 850, minScore = 300, ratingLabel = "सक्षम एवं सुरक्षित (Loan Ready)", compact = false }) {
  // Normalize score between 0 and 1
  const clampedScore = Math.min(maxScore, Math.max(minScore, score));
  const percentage = (clampedScore - minScore) / (maxScore - minScore);
  
  // Angle for 180-degree arc: -180deg (left) to 0deg (right)
  const angle = -180 + percentage * 180;
  
  // Needle coordinates
  const radius = compact ? 65 : 90;
  const cx = compact ? 85 : 120;
  const cy = compact ? 80 : 108;
  
  const needleRad = (angle * Math.PI) / 180;
  const needleLength = radius - 14;
  const nx = cx + needleLength * Math.cos(needleRad);
  const ny = cy + needleLength * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <svg 
        width={compact ? 170 : 240} 
        height={compact ? 100 : 128} 
        viewBox={compact ? "0 0 170 100" : "0 0 240 128"}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DE6936" />    {/* Terracotta/Red */}
            <stop offset="35%" stopColor="#D97706" />   {/* Ochre */}
            <stop offset="70%" stopColor="#2E7D32" />   {/* Green */}
            <stop offset="100%" stopColor="#1B5E20" />  {/* Deep Emerald */}
          </linearGradient>
        </defs>

        {/* Background Track Arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#EFE7DA"
          strokeWidth={compact ? "12" : "16"}
          strokeLinecap="round"
        />

        {/* Colored Value Arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={compact ? "12" : "16"}
          strokeLinecap="round"
          strokeDasharray={`${radius * Math.PI}`}
          strokeDashoffset={`${radius * Math.PI * (1 - percentage)}`}
          className="transition-all duration-1000 ease-out"
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#3E2723"
          strokeWidth={compact ? "3" : "4"}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Center Hub */}
        <circle cx={cx} cy={cy} r="6" fill="#3E2723" />
        <circle cx={cx} cy={cy} r="3" fill="#FAF7F2" />

        {/* Range boundary labels */}
        <text x={cx - radius} y={cy + 18} fontSize="11" fontWeight="700" fill="#8C7A6B" textAnchor="middle">300</text>
        <text x={cx} y={cy - radius + 8} fontSize="10" fontWeight="600" fill="#8C7A6B" textAnchor="middle">600</text>
        <text x={cx + radius} y={cy + 18} fontSize="11" fontWeight="700" fill="#8C7A6B" textAnchor="middle">850</text>
      </svg>

      {/* Score Number & Scale (Positioned cleanly below gauge with zero overlap) */}
      <div className="mt-1 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className={`${compact ? 'text-3xl' : 'text-4xl'} font-extrabold text-stone-900 font-sans tracking-tight leading-tight`}>
            {clampedScore}
          </span>
          <span className="text-xs font-semibold text-stone-400">/ {maxScore}</span>
        </div>

        {/* Friendly Rural Status Badge */}
        <div className="mt-1.5 text-center">
          <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
            clampedScore >= 750 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
            clampedScore >= 680 ? 'bg-forestRural-50 text-forestRural-700 border-forestRural-300' :
            clampedScore >= 580 ? 'bg-ochre-50 text-ochre-800 border-ochre-300' :
            'bg-terracotta-50 text-terracotta-800 border-terracotta-300'
          }`}>
            {ratingLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
