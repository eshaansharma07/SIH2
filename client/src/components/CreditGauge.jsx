import React from 'react';
import { Badge } from './ui';

/**
 * Authentic Folk & Health inspired Alternative Credit Score Dial
 * Renders a warm, high-contrast arc (300 to 850) with rural color tokens.
 */
export function CreditGauge({ 
  score = null, 
  maxScore = 850, 
  minScore = 300, 
  ratingLabel = null, 
  compact = false 
}) {
  const hasScore = score !== null && score !== undefined;
  const clampedScore = hasScore ? Math.min(maxScore, Math.max(minScore, score)) : minScore;
  const percentage = hasScore ? (clampedScore - minScore) / (maxScore - minScore) : 0;
  
  // Angle for 180-degree arc: -180deg (left) to 0deg (right)
  const angle = -180 + percentage * 180;
  
  const radius = compact ? 65 : 85;
  const cx = compact ? 85 : 110;
  const cy = compact ? 78 : 98;
  
  const needleRad = (angle * Math.PI) / 180;
  const dotX = cx + radius * Math.cos(needleRad);
  const dotY = cy + radius * Math.sin(needleRad);

  const displayRating = ratingLabel || (
    clampedScore >= 750 ? "Prime PSL Tier-1" :
    clampedScore >= 650 ? "Good Bankable (Kishor)" :
    clampedScore >= 550 ? "Moderate (Shishu)" :
    "Emerging Credit"
  );

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
            <linearGradient id="saathiCreditGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DE8361" />    {/* Terracotta */}
              <stop offset="35%" stopColor="#F59E0B" />   {/* Ochre */}
              <stop offset="70%" stopColor="#276749" />   {/* ForestRural */}
              <stop offset="100%" stopColor="#163E2C" />  {/* Deep ForestRural */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#276749" floodOpacity="0.25"/>
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#ECE4D4"
            strokeWidth={compact ? "10" : "14"}
            strokeLinecap="round"
          />

          {/* Colored Value Arc */}
          {hasScore && (
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="url(#saathiCreditGrad)"
              strokeWidth={compact ? "10" : "14"}
              strokeLinecap="round"
              strokeDasharray={`${radius * Math.PI}`}
              strokeDashoffset={`${radius * Math.PI * (1 - percentage)}`}
              filter="url(#glow)"
              className="transition-all duration-300 ease-out will-change-transform"
            />
          )}

          {/* Active Dot Marker */}
          {hasScore && (
            <circle 
              cx={dotX} 
              cy={dotY} 
              r={compact ? "5" : "6"} 
              fill="#FFFFFF" 
              stroke="#1A2742"
              strokeWidth="3"
              className="transition-all duration-300 ease-out drop-shadow-md will-change-transform"
            />
          )}

          {/* Scale Labels */}
          <text x={cx - radius} y={cy + 16} fontSize="10" fontWeight="700" fill="#94A3B8" textAnchor="middle">300</text>
          <text x={cx} y={cy - radius - 6} fontSize="9" fontWeight="700" fill="#94A3B8" textAnchor="middle">600</text>
          <text x={cx + radius} y={cy + 16} fontSize="10" fontWeight="700" fill="#94A3B8" textAnchor="middle">850</text>
        </svg>
      </div>

      {/* Score Number & Badge */}
      <div className="mt-0.5 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className={`${compact ? 'text-3xl' : 'text-4xl'} font-black text-indigoRural-900 tracking-tight tabular-nums font-display`}>
            {hasScore ? clampedScore : '—'}
          </span>
          <span className="text-xs font-semibold text-indigoRural-400">/ {maxScore}</span>
        </div>

        <div className="mt-1">
          {hasScore ? (
            <Badge 
              variant={clampedScore >= 750 ? 'positive' : clampedScore >= 650 ? 'brand' : clampedScore >= 550 ? 'attention' : 'neutral'}
              size="sm"
              dot
            >
              <span>{displayRating}</span>
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              <span>Calculating alternative score...</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
