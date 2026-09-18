import React from 'react';

/**
 * Canonical Button component for SaakhSetu
 * Variants:
 * - 'primary': Terracotta solid button for main call-to-actions
 * - 'secondary': Paper/neutral button for secondary actions
 * - 'dark': Deep indigoRural solid button
 * - 'outline': Paper border with transparent background
 * - 'ghost': Clean hover-only button
 * - 'forest': ForestRural green solid button for positive actions
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const variantStyles = {
    primary: 'bg-stone-900 hover:bg-stone-800 active:bg-black text-white font-bold shadow-xs',
    secondary: 'bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-900 font-bold border border-stone-200/80 shadow-2xs',
    dark: 'bg-stone-950 hover:bg-stone-900 active:bg-black text-white font-bold shadow-xs',
    outline: 'bg-transparent hover:bg-stone-100/60 text-stone-800 font-bold border border-stone-300 active:scale-98',
    ghost: 'bg-transparent hover:bg-stone-100/70 active:bg-stone-200/70 text-stone-700 font-semibold',
    forest: 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold shadow-xs',
    turmeric: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold shadow-xs',
    vermillion: 'bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-bold shadow-xs'
  };

  const sizeStyles = {
    sm: 'px-3 py-2 min-h-[40px] sm:min-h-[36px] text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 min-h-[48px] text-xs sm:text-sm rounded-2xl gap-2'
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-sans tracking-tight btn-tactile hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${disabled ? disabledStyles : ''} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
