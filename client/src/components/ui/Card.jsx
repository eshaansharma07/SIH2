import React from 'react';

/**
 * Canonical Card component for SaakhSetu
 * Consistent border-radius (rounded-2xl for normal, rounded-3xl for hero),
 * warm paper palette border and subtle authentic shadow.
 *
 * Variants:
 * - 'default': Standard white card on warm paper background
 * - 'hero': Featured high-priority executive card (rounded-3xl)
 * - 'accent': Subtle terracotta-tinted background card
 * - 'paper': Off-white warm paper card (paper-100)
 */
export function Card({
  children,
  variant = 'default',
  elevation = 1,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) {
  const elevationClasses = {
    0: 'shadow-none border border-stone-200/60',
    1: 'shadow-apple-card border border-stone-200/70 hover:border-stone-300/80 transition-all duration-200',
    2: 'shadow-apple-elevated border border-stone-200/80',
    3: 'shadow-apple-floating border border-stone-200/90'
  };

  const variantStyles = {
    default: 'bg-white',
    hero: 'bg-white relative overflow-hidden shadow-apple-elevated border border-stone-200/80',
    accent: 'bg-amber-50/40 border border-amber-200/60',
    paper: 'bg-paper-50/90 border border-stone-200/70',
    glass: 'apple-glass-pill'
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const radiusStyles = variant === 'hero' ? 'rounded-3xl' : 'rounded-2xl';
  const chosenElevation = variant === 'hero' ? '' : (elevationClasses[elevation] || elevationClasses[1]);

  return (
    <div
      onClick={onClick}
      className={`${radiusStyles} ${variantStyles[variant] || variantStyles.default} ${chosenElevation} ${paddingStyles[padding] || paddingStyles.md} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
