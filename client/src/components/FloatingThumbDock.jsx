import React from 'react';
import { 
  Plus, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  LayoutDashboard
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export function FloatingThumbDock({ 
  activeTab, 
  setActiveTab, 
  onOpenKeypad,
  creditScore = 755
}) {
  const { language } = useTranslation();

  const navItems = [
    { 
      id: 'dashboard', 
      labelHi: 'होम', 
      labelEn: 'Pass', 
      icon: LayoutDashboard 
    },
    { 
      id: 'cashflow', 
      labelHi: 'बही-खाता', 
      labelEn: 'Khata', 
      icon: BookOpen 
    },
    { 
      id: 'advisor', 
      labelHi: 'मंडी AI', 
      labelEn: 'Mandi AI', 
      icon: Sparkles,
      highlight: true
    },
    { 
      id: 'credit', 
      labelHi: 'क्रेडिट', 
      labelEn: `${creditScore}`, 
      icon: ShieldCheck 
    },
    { 
      id: 'dossier', 
      labelHi: 'डॉसियर', 
      labelEn: 'Dossier', 
      icon: FileText 
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-4 inset-x-0 mx-auto w-fit z-40 px-3 select-none print:hidden animate-fadeIn">
      <nav 
        aria-label="Samsung OneUI Mobile Thumb Navigation Dock"
        className="flex items-center gap-1.5 p-2 rounded-full bg-slate-950/92 backdrop-blur-2xl border border-white/18 shadow-2xl text-white transition-all duration-300 ring-1 ring-black/40"
      >
        {/* Rapid Thumb Add Action Button */}
        <button
          onClick={onOpenKeypad}
          aria-label="Record transaction"
          className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="w-5 h-5 rounded-full bg-slate-950/20 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
          </span>
          <span className="tracking-wide">
            {language === 'hi' ? 'दर्ज करें' : '+ Record'}
          </span>
        </button>

        <div className="w-[1px] h-6 bg-white/15 mx-0.5" />

        {/* Quick Nav Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = language === 'hi' ? item.labelHi : item.labelEn;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3 sm:px-3.5 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 active:scale-95'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${
                  isActive 
                    ? 'text-slate-950 stroke-[2.5]' 
                    : item.highlight 
                    ? 'text-amber-300 stroke-[2]' 
                    : 'text-slate-400 stroke-[2]'
                }`} />
                <span className="text-[11px] tracking-tight">{label}</span>

                {item.id === 'credit' && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
