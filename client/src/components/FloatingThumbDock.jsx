import React from 'react';
import { 
  Plus, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  LayoutDashboard,
  Landmark
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { SyncStatusBadge } from './SyncStatusBadge';

export function FloatingThumbDock({ 
  activeTab, 
  setActiveTab, 
  onOpenKeypad,
  creditScore = null
}) {
  const { language } = useTranslation();

  // Dynamic 5th tab: defaults to Credit Score, but adapts if user is on Dossier or Schemes
  let fifthTab = {
    id: 'credit',
    labelHi: 'क्रेडिट',
    labelEn: creditScore ? `${creditScore}` : 'Score',
    icon: ShieldCheck
  };

  if (activeTab === 'dossier') {
    fifthTab = {
      id: 'dossier',
      labelHi: 'डॉसियर',
      labelEn: 'Dossier',
      icon: FileText
    };
  } else if (activeTab === 'schemes') {
    fifthTab = {
      id: 'schemes',
      labelHi: 'योजनाएं',
      labelEn: 'Schemes',
      icon: Landmark
    };
  }

  const leftNavItems = [
    { 
      id: 'dashboard', 
      labelHi: 'होम', 
      labelEn: 'Home', 
      icon: LayoutDashboard 
    },
    { 
      id: 'cashflow', 
      labelHi: 'खाता', 
      labelEn: 'Khata', 
      icon: BookOpen 
    }
  ];

  const rightNavItems = [
    { 
      id: 'advisor', 
      labelHi: 'साथी AI', 
      labelEn: 'Saathi AI', 
      icon: Sparkles,
      highlight: true
    },
    fifthTab
  ];

  return (
    <div className="lg:hidden fixed bottom-3 sm:bottom-4 inset-x-0 mx-auto w-[calc(100%-1.25rem)] max-w-md z-40 select-none print:hidden animate-fadeIn flex flex-col items-center gap-1.5 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      
      {/* Compact Offline / Pending Sync Badge */}
      <div className="pointer-events-auto">
        <SyncStatusBadge compact className="shadow-md" />
      </div>

      {/* Main 5-Slot Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Thumb Navigation Dock"
        className="pointer-events-auto w-full bg-indigoRural-950/95 backdrop-blur-2xl border border-paper-300/20 shadow-2xl rounded-2xl sm:rounded-3xl p-1.5 flex items-center justify-between text-white ring-1 ring-black/40"
      >
        {/* Left Items: Home & Khata */}
        <div className="flex items-center justify-around flex-1">
          {leftNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = language === 'hi' ? item.labelHi : item.labelEn;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-indigoRural-300 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-white/15 text-terracotta-400 scale-105 shadow-inner' 
                    : 'text-indigoRural-300'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 transition-all ${
                  isActive ? 'font-black text-white' : 'font-semibold text-paper-300/80'
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center Prominent Record (+ FAB) Action Button */}
        <div className="flex flex-col items-center justify-center px-1 shrink-0">
          <button
            type="button"
            onClick={onOpenKeypad}
            aria-label="Record transaction"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-terracotta-600 to-terracotta-500 hover:from-terracotta-500 hover:to-terracotta-400 text-white shadow-lg shadow-terracotta-600/40 ring-3 ring-indigoRural-950 active:scale-90 transition-all cursor-pointer -mt-4"
          >
            <Plus className="w-5 h-5 text-white stroke-[3]" />
          </button>
          <span className="text-[9px] font-black text-terracotta-300 uppercase tracking-wider mt-0.5">
            {language === 'hi' ? 'दर्ज' : 'Record'}
          </span>
        </div>

        {/* Right Items: Saathi AI & Score */}
        <div className="flex items-center justify-around flex-1">
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = language === 'hi' ? item.labelHi : item.labelEn;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-indigoRural-300 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-white/15 text-terracotta-400 scale-105 shadow-inner' 
                    : item.highlight 
                    ? 'text-ochre-300' 
                    : 'text-indigoRural-300'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 transition-all truncate max-w-[65px] ${
                  isActive ? 'font-black text-white' : 'font-semibold text-paper-300/80'
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

      </nav>
    </div>
  );
}
