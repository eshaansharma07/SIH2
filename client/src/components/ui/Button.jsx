import React from 'react';

/**
 * Canonical Button component for Vyapaar Saathi
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
    primary: 'bg-terracotta-600 hover:bg-terracotta-700 active:bg-terracotta-800 text-white font-extrabold shadow-xs',
    secondary: 'bg-paper-100 hover:bg-paper-200 active:bg-paper-300 text-indigoRural-900 font-bold border border-paper-300/90',
    dark: 'bg-indigoRural-900 hover:bg-indigoRural-800 active:bg-indigoRural-950 text-white font-extrabold shadow-xs',
    outline: 'bg-transparent hover:bg-paper-100 text-indigoRural-800 font-bold border border-paper-300 active:scale-98',
    ghost: 'bg-transparent hover:bg-paper-100 active:bg-paper-200 text-indigoRural-700 font-semibold',
    forest: 'bg-forestRural-600 hover:bg-forestRural-700 active:bg-forestRural-800 text-white font-extrabold shadow-xs'
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
      className={`inline-flex items-center justify-center font-sans tracking-tight transition duration-150 active:scale-[0.98] cursor-pointer ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${disabled ? disabledStyles : ''} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
