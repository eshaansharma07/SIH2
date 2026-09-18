import React from 'react';
import { Check } from 'lucide-react';

/**
 * Restrained, institutional Badge component
 * Designed for formal financial compliance & clarity (GIGW / DigiLocker aligned)
 * Variants:
 * - 'brand': Terracotta tone for platform indicators and main category tags
 * - 'positive': ForestRural green for surplus, active status, and verified state
 * - 'attention': Ochre warm tone for pending items, cautions, and limits
 * - 'neutral': Paper/slate tone for metadata, counts, and passive labels
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  verified = false,
  className = ''
}) {
  const variantStyles = {
    brand: 'bg-amber-50 text-amber-900 border-amber-200/80',
    positive: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    attention: 'bg-amber-50 text-amber-800 border-amber-300/80',
    neutral: 'bg-stone-100/80 text-stone-700 border-stone-200/80',
    vermillion: 'bg-red-50 text-red-800 border-red-200/80'
  };

  const dotColors = {
    brand: 'bg-amber-600',
    positive: 'bg-emerald-600',
    attention: 'bg-amber-600',
    neutral: 'bg-stone-400',
    vermillion: 'bg-red-600'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-bold rounded-full',
    md: 'text-xs px-2.5 py-0.5 font-bold rounded-full'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border leading-none transition-colors ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {verified && <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />}
      {dot && !verified && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.neutral}`} />
      )}
      {children}
    </span>
  );
}
