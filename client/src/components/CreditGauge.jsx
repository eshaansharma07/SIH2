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
  
  // Angle for 180-degree arc: -90deg (left) to +90deg (right)
  const angle = -180 + percentage * 180;
  
  // Needle coordinates
  const radius = compact ? 70 : 95;
  const cx = compact ? 90 : 120;
  const cy = compact ? 85 : 115;
  
  const needleRad = (angle * Math.PI) / 180;
  const needleLength = radius - 15;
  const nx = cx + needleLength * Math.cos(needleRad);
  const ny = cy + needleLength * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative">
        <svg 
          width={compact ? 180 : 240} 
          height={compact ? 110 : 145} 
          viewBox={compact ? "0 0 180 110" : "0 0 240 145"}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DE6936" />    {/* Terracotta/Red (Needs work) */}
              <stop offset="35%" stopColor="#D97706" />   {/* Ochre (Fair) */}
              <stop offset="70%" stopColor="#2E7D32" />   {/* Green (Loan Ready) */}
              <stop offset="100%" stopColor="#1B5E20" />  {/* Deep Emerald (Prime) */}
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#EFE7DA"
            strokeWidth={compact ? "14" : "18"}
            strokeLinecap="round"
          />

          {/* Colored Value Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={compact ? "14" : "18"}
            strokeLinecap="round"
            strokeDasharray={`${radius * Math.PI}`}
            strokeDashoffset={`${radius * Math.PI * (1 - percentage)}`}
            className="transition-all duration-1000 ease-out"
          />

          {/* Inner ticks for tiers */}
          <circle cx={cx} cy={cy} r="6" fill="#3E2723" />

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
          <circle cx={cx} cy={cy} r="3.5" fill="#FAF7F2" />

          {/* Range boundary labels */}
          <text x={cx - radius - 5} y={cy + 18} fontSize="11" fontWeight="600" fill="#8C7A6B" textAnchor="middle">300</text>
          <text x={cx} y={cy - radius + 10} fontSize="10" fill="#8C7A6B" textAnchor="middle">600</text>
          <text x={cx + radius + 5} y={cy + 18} fontSize="11" fontWeight="600" fill="#8C7A6B" textAnchor="middle">850</text>
        </svg>

        {/* Center Score Display */}
        <div className={`absolute left-0 right-0 ${compact ? 'top-14' : 'top-18'} flex flex-col items-center justify-center pointer-events-none`}>
          <div className="flex items-baseline gap-1">
            <span className={`${compact ? 'text-2xl' : 'text-4xl'} font-extrabold text-stone-800 font-sans tracking-tight`}>
              {clampedScore}
            </span>
            <span className="text-xs text-stone-600 font-medium">/ 850</span>
          </div>
        </div>
      </div>

      {/* Friendly Rural Status Badge */}
      <div className="mt-1 text-center">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
          clampedScore >= 750 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
          clampedScore >= 680 ? 'bg-forestRural-50 text-forestRural-700 border-forestRural-300' :
          clampedScore >= 580 ? 'bg-ochre-50 text-ochre-800 border-ochre-300' :
          'bg-terracotta-50 text-terracotta-800 border-terracotta-300'
        }`}>
          {ratingLabel}
        </span>
      </div>
    </div>
  );
}
