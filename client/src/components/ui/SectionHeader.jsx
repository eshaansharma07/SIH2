import React from 'react';

/**
 * SectionHeader component
 * Standardizes the header pattern across dashboard and feature cards:
 * Icon chip (terracotta or custom theme) + Title + Subtitle + Action / Badge
 */
export function SectionHeader({
  icon: Icon,
  iconColor = 'terracotta',
  title,
  subtitle,
  action,
  className = ''
}) {
  const iconThemes = {
    terracotta: 'bg-terracotta-50 text-terracotta-600 border-terracotta-200/80',
    forest: 'bg-forestRural-50 text-forestRural-700 border-forestRural-200/80',
    ochre: 'bg-ochre-50 text-ochre-700 border-ochre-200/80',
    neutral: 'bg-paper-100 text-indigoRural-700 border-paper-300'
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/90 pb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2.5 rounded-xl border shadow-2xs shrink-0 ${iconThemes[iconColor] || iconThemes.terracotta}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h2 className="text-base sm:text-lg font-black text-indigoRural-900 tracking-tight font-display">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-indigoRural-600 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
