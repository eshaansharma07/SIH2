import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Badge } from './ui';

/**
 * Authentic Folk & Ledger-inspired CIBIL & Alternative Credit Score Dial
 * Renders a warm, high-contrast arc (300 to 900) with rural/ledger color tokens.
 * Features synchronized count-up sweep and turmeric leading edge marker.
 */
export function CreditGauge({ 
  score = null, 
  maxScore = 900, 
  minScore = 300, 
  ratingLabel = null, 
  compact = false,
  variant = 'default',
  language = 'en'
}) {
  const shouldReduceMotion = useReducedMotion();
  const isEditorial = variant === 'editorial' || variant === 'reference';
  const effectiveMax = maxScore || 900;
  const effectiveMin = minScore;

  const hasScore = score !== null && score !== undefined;
  const targetScore = hasScore ? Math.min(effectiveMax, Math.max(effectiveMin, Math.round(score))) : effectiveMin;
  
  // Animated score counter synchronized with sweep
  const [animatedScore, setAnimatedScore] = useState(shouldReduceMotion ? targetScore : effectiveMin);

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
  const percentage = hasScore ? (currentScoreForDisplay - effectiveMin) / (effectiveMax - effectiveMin) : 0;
  
  // Angle for 180-degree arc: -180deg (left, 9 o'clock) to 0deg (right, 3 o'clock)
  const angle = -180 + percentage * 180;
  
  // Dimensions
  const radius = isEditorial ? 102 : (compact ? 65 : 85);
  const cx = isEditorial ? 140 : (compact ? 85 : 110);
  const cy = isEditorial ? 130 : (compact ? 78 : 98);
  
  const needleRad = (angle * Math.PI) / 180;
  const dotX = cx + radius * Math.cos(needleRad);
  const dotY = cy + radius * Math.sin(needleRad);

  const displayRating = ratingLabel || (
    targetScore >= 750 ? (language === 'hi' ? 'बहुत अच्छा' : 'Very Good') :
    targetScore >= 650 ? (language === 'hi' ? 'अच्छा' : 'Good') :
    targetScore >= 550 ? (language === 'hi' ? 'मध्यम' : 'Fair') :
    (language === 'hi' ? 'सुधार आवश्यक' : 'Needs Improvement')
  );

  if (isEditorial) {
    return (
      <div className="flex flex-col items-center justify-center select-none w-full max-w-[340px] mx-auto py-1">
        <div className="relative w-full flex justify-center">
          <svg 
            width="280" 
            height="150" 
            viewBox="0 0 280 150" 
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="editorialGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" />    {/* Orange/Coral (Needs Improvement) */}
                <stop offset="35%" stopColor="#D97706" />   {/* Amber (Fair) */}
                <stop offset="70%" stopColor="#65A30D" />   {/* Lime (Good) */}
                <stop offset="100%" stopColor="#0F3E2E" />  {/* Deep Forest Green (Excellent) */}
              </linearGradient>
              <linearGradient id="editorialScaleBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="35%" stopColor="#FBBF24" />
                <stop offset="70%" stopColor="#84CC16" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
            </defs>

            {/* Background Track Arc */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="#EFE8DD"
              strokeWidth="15"
              strokeLinecap="round"
            />

            {/* Colored Value Arc */}
            {hasScore && (
              <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                fill="none"
                stroke="url(#editorialGaugeGrad)"
                strokeWidth="15"
                strokeLinecap="round"
                strokeDasharray={`${radius * Math.PI}`}
                strokeDashoffset={`${radius * Math.PI * (1 - percentage)}`}
                className="transition-all duration-150 ease-out will-change-transform"
              />
            )}

            {/* Needle / Marker Dot on Arc */}
            {hasScore && (
              <g className="transition-all duration-150 ease-out will-change-transform">
                {/* Outer shadow / ring */}
                <circle 
                  cx={dotX} 
                  cy={dotY} 
                  r="8.5" 
                  fill="#FFFFFF" 
                  className="drop-shadow-md"
                />
                {/* Center Core Dot */}
                <circle 
                  cx={dotX} 
                  cy={dotY} 
                  r="4.5" 
                  fill="#1C1917" 
                />
              </g>
            )}

            {/* Center Text inside Arc */}
            <text 
              x={cx} 
              y={cy - 24} 
              textAnchor="middle" 
              className="font-serif font-black text-4xl sm:text-[42px] fill-stone-900 tracking-tight"
            >
              {hasScore ? currentScoreForDisplay : '—'}
            </text>
            <text 
              x={cx} 
              y={cy + 4} 
              textAnchor="middle" 
              className="font-sans font-bold text-sm fill-[#0F3E2E]"
            >
              {displayRating}
            </text>
          </svg>
        </div>

        {/* 4-Tier Scale Strip Below Gauge */}
        <div className="w-full mt-2 pt-2 border-t border-stone-100">
          {/* Subtle colored gradient indicator line */}
          <div className="w-full h-1 rounded-full bg-gradient-to-r from-[#EA580C] via-[#D97706] via-[#65A30D] to-[#0F3E2E] opacity-75 mb-2" />
          
          <div className="grid grid-cols-4 text-center text-stone-700">
            <div>
              <div className="text-[11px] font-bold text-stone-900 tabular-nums">300</div>
              <div className="text-[9px] text-stone-500 font-medium leading-tight mt-0.5">
                {language === 'hi' ? 'सुधार आवश्यक' : 'Needs Improvement'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-stone-900 tabular-nums">600</div>
              <div className="text-[9px] text-stone-500 font-medium leading-tight mt-0.5">
                {language === 'hi' ? 'सामान्य' : 'Fair'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-stone-900 tabular-nums">750</div>
              <div className="text-[9px] text-stone-500 font-medium leading-tight mt-0.5">
                {language === 'hi' ? 'अच्छा' : 'Good'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-stone-900 tabular-nums">900</div>
              <div className="text-[9px] text-stone-500 font-medium leading-tight mt-0.5">
                {language === 'hi' ? 'उत्कृष्ट' : 'Excellent'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <text x={cx + radius} y={cy + 16} fontSize="10" fontWeight="700" fill="#78716C" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">900</text>
        </svg>
      </div>

      {/* Score Number & Badge */}
      <div className="mt-0.5 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className={`${compact ? 'text-3xl' : 'text-4xl'} font-black text-stone-900 tracking-tight tabular-nums font-serif`}>
            {hasScore ? currentScoreForDisplay : '—'}
          </span>
          <span className="text-xs font-semibold text-stone-400 font-sans">/ {effectiveMax}</span>
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
