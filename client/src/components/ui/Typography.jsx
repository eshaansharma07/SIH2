import React from 'react';

/**
 * Typography Hierarchy Primitives for Vyapaar Saathi
 * Distinct visual roles preventing hierarchy flattening:
 * - PageTitle: Largest, boldest font-display
 * - SectionHeading: Confident section divider
 * - FieldLabel: Confident ink (indigoRural-900), medium weight
 * - HelperText: Lighter weight, muted tone (indigoRural-500)
 * - ValueText: Crisp tabular numbers
 */

export function PageTitle({ children, className = '', ...props }) {
  return (
    <h1
      className={`text-2xl sm:text-3xl font-black tracking-tight text-indigoRural-900 font-display ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionHeading({ children, className = '', ...props }) {
  return (
    <h2
      className={`text-base sm:text-lg font-black tracking-tight text-indigoRural-900 font-display ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

export function FieldLabel({ children, required = false, className = '', ...props }) {
  return (
    <label
      className={`block text-xs sm:text-sm font-bold text-indigoRural-800 tracking-wide mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-terracotta-600 ml-1 font-black">*</span>}
    </label>
  );
}

export function HelperText({ children, className = '', ...props }) {
  return (
    <p
      className={`text-[11px] sm:text-xs text-indigoRural-500 font-normal leading-relaxed mt-1 block ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function ValueText({ children, className = '', ...props }) {
  return (
    <span
      className={`font-black text-indigoRural-900 tabular-nums ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
