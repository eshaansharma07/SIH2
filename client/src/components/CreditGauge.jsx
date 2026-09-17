import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Badge } from './ui';

/**
 * Authentic Folk & Ledger-inspired Alternative Credit Score Dial
 * Renders a warm, high-contrast arc (300 to 850) with rural/ledger color tokens.
 * Features synchronized count-up sweep and turmeric leading edge marker.
 */
export function CreditGauge({ 
  score = null, 
  maxScore = 850, 
  minScore = 300, 
  ratingLabel = null, 
  compact = false 
}) {
  const shouldReduceMotion = useReducedMotion();
  const hasScore = score !== null && score !== undefined;
  const targetScore = hasScore ? Math.min(maxScore, Math.max(minScore, Math.round(score))) : minScore;
  
  // Animated score counter synchronized with sweep
  const [animatedScore, setAnimatedScore] = useState(shouldReduceMotion ? targetScore : minScore);

  useEffect(() => {
    if (!hasScore || shouldReduceMotion) {
      setAnimatedScore(targetScore);
      return;
    }

    let startTimestamp = null;
    const duration = 650; // ms
    const initialScore = animatedScore;
    const scoreDiff = targetScore - initialScore;

    let frameId;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(initialScore + scoreDiff * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetScore, hasScore, shouldReduceMotion]);

  const currentScoreForDisplay = shouldReduceMotion ? targetScore : animatedScore;
  const percentage = hasScore ? (currentScoreForDisplay - minScore) / (maxScore - minScore) : 0;
  
  // Angle for 180-degree arc: -180deg (left) to 0deg (right)
  const angle = -180 + percentage * 180;
  
  const radius = compact ? 65 : 85;
  const cx = compact ? 85 : 110;
  const cy = compact ? 78 : 98;
  
  const needleRad = (angle * Math.PI) / 180;
  const dotX = cx + radius * Math.cos(needleRad);
  const dotY = cy + radius * Math.sin(needleRad);

  const displayRating = ratingLabel || (
    targetScore >= 750 ? "Prime PSL Tier-1" :
    targetScore >= 650 ? "Good Bankable (Kishor)" :
    targetScore >= 550 ? "Moderate (Shishu)" :
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
            <linearGradient id="setuCreditGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B91C1C" />    {/* Vermillion */}
              <stop offset="35%" stopColor="#D97706" />   {/* Turmeric Gold */}
              <stop offset="70%" stopColor="#15803D" />   {/* Reserve Green */}
              <stop offset="100%" stopColor="#047857" />  {/* Deep Emerald */}
            </linearGradient>
            <filter id="turmericGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#D97706" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#E7DFD5"
            strokeWidth={compact ? "10" : "14"}
            strokeLinecap="round"
          />

          {/* Colored Value Arc */}
          {hasScore && (
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="url(#setuCreditGrad)"
              strokeWidth={compact ? "10" : "14"}
              strokeLinecap="round"
              strokeDasharray={`${radius * Math.PI}`}
              strokeDashoffset={`${radius * Math.PI * (1 - percentage)}`}
              filter="url(#turmericGlow)"
              className="transition-all duration-150 ease-out will-change-transform"
            />
          )}

          {/* Turmeric Active Needle / Leading Edge Marker */}
          {hasScore && (
            <g className="transition-all duration-150 ease-out will-change-transform">
              {/* Outer Turmeric Ink Halo */}
              <circle 
                cx={dotX} 
                cy={dotY} 
                r={compact ? "7" : "8.5"} 
                fill="#D97706" 
                opacity="0.3"
              />
              {/* Core Solid Needle Point */}
              <circle 
                cx={dotX} 
                cy={dotY} 
                r={compact ? "4.5" : "5.5"} 
                fill="#FAF8F5" 
                stroke="#1C1917"
                strokeWidth="2.5"
                className="drop-shadow-sm"
              />
            </g>
          )}

          {/* Scale Labels in warm stone tones */}
          <text x={cx - radius} y={cy + 16} fontSize="10" fontWeight="700" fill="#78716C" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">300</text>
          <text x={cx} y={cy - radius - 6} fontSize="9" fontWeight="700" fill="#78716C" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">600</text>
          <text x={cx + radius} y={cy + 16} fontSize="10" fontWeight="700" fill="#78716C" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">850</text>
        </svg>
      </div>

      {/* Score Number & Badge */}
      <div className="mt-0.5 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className={`${compact ? 'text-3xl' : 'text-4xl'} font-black text-stone-900 tracking-tight tabular-nums font-serif`}>
            {hasScore ? currentScoreForDisplay : '—'}
          </span>
          <span className="text-xs font-semibold text-stone-400 font-sans">/ {maxScore}</span>
        </div>

        <div className="mt-1">
          {hasScore ? (
            <Badge 
              variant={targetScore >= 750 ? 'positive' : targetScore >= 650 ? 'brand' : targetScore >= 550 ? 'attention' : 'neutral'}
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
export default CreditGauge;
