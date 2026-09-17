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
    0: 'shadow-none border border-paper-200',
    1: 'shadow-elevation-1 border border-paper-300/80 hover:border-terracotta-200/80 transition-all duration-200',
    2: 'shadow-elevation-2 border border-paper-300',
    3: 'shadow-elevation-3 border border-paper-300'
  };

  const variantStyles = {
    default: 'bg-white',
    hero: 'bg-white relative overflow-hidden shadow-elevation-2 border border-paper-300',
    accent: 'bg-terracotta-50/50 border border-terracotta-200/80',
    paper: 'bg-paper-100/90 border border-paper-300/90'
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
