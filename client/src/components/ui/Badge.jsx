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
    brand: 'bg-terracotta-50/90 text-terracotta-800 border-terracotta-200',
    positive: 'bg-forestRural-50/90 text-forestRural-800 border-forestRural-200',
    attention: 'bg-ochre-50/90 text-ochre-800 border-ochre-200',
    neutral: 'bg-paper-100 text-indigoRural-700 border-paper-300'
  };

  const dotColors = {
    brand: 'bg-terracotta-600',
    positive: 'bg-forestRural-600',
    attention: 'bg-ochre-600',
    neutral: 'bg-indigoRural-500'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold rounded-md',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-md'
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
