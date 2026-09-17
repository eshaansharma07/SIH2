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
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-stone-200/70 pb-3 sm:pb-3.5 min-w-0 ${className}`}>
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {Icon && (
          <div className={`p-2 rounded-xl border shadow-2xs shrink-0 ${iconThemes[iconColor] || iconThemes.terracotta}`}>
            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight font-display break-words">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-stone-500 font-normal mt-0.5 break-words">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap self-start sm:self-auto">
          {action}
        </div>
      )}
    </div>
  );
}
