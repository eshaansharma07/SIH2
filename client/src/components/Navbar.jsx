import React, { useState } from 'react';
import { 
  Store, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Landmark, 
  FileText, 
  Globe, 
  RotateCcw,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../utils/api';

export function Navbar({ activeTab, setActiveTab, currentShop, onReloadDemo, onStartDemoTour }) {
  const { t, language, toggleLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const navItems = [
    { id: 'dashboard', label: language === 'hi' ? 'डैशबोर्ड' : 'Overview', icon: Store },
    { id: 'cashflow', label: language === 'hi' ? 'बही-खाता' : 'Bahi-Khata', icon: BookOpen },
    { id: 'credit', label: language === 'hi' ? 'क्रेडिट स्कोर' : 'Credit Score', icon: TrendingUp },
    { id: 'schemes', label: language === 'hi' ? 'सरकारी योजनाएं' : 'Schemes', icon: Landmark },
    { id: 'advisor', label: language === 'hi' ? 'साथी AI' : 'Saathi AI', icon: Sparkles, isAi: true },
    { id: 'dossier', label: language === 'hi' ? 'बैंक फाइल' : 'Bank Dossier', icon: FileText }
  ];

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await api.resetDemoShop();
      onReloadDemo?.();
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-white/90 border-b border-slate-200/90 shadow-[0_2px_16px_rgba(0,0,0,0.03)] transition-all">
      {/* Top Sovereign Tri-Color Micro-Rule */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-orange-500 via-slate-100 to-emerald-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Sovereign Brand Mark: National DPI Credential Header */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            {/* Ashoka Geometric Vector Emblem */}
            <div className="relative w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-sm border border-slate-800 group-hover:scale-105 transition-all">
              <svg className="w-5 h-5 text-indigo-300 group-hover:rotate-45 transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18" />
                <path d="M3 12h18" />
                <path d="m5.6 5.6 12.8 12.8" />
                <path d="m18.4 5.6-12.8 12.8" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" className="text-white" />
              </svg>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 leading-tight">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-950 font-display">
                  व्यापार साथी
                </span>
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                  Vyapaar Saathi
                </span>
                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-900 text-white tracking-wider">
                  DPI Stack
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-slate-800">{currentShop?.name || 'Ramesh Kirana'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono">UDYAM-UP-18-0092478</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation: Apple Liquid-Glass Segmented Controls */}
          <nav className="hidden xl:flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-xs">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-white text-slate-950 shadow-xs scale-[1.02]' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    item.isAi 
                      ? 'text-indigo-600 animate-pulse' 
                      : isActive ? 'text-indigo-600' : 'text-slate-500'
                  }`} />
                  <span>{item.label}</span>
                  {item.isAi && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Ultra-clean Sovereign Pills */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Live Guided Demo Button */}
            <button
              onClick={onStartDemoTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold shadow-xs transition"
              title="Interactive Live Tour for Evaluators"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span className="hidden sm:inline">{language === 'hi' ? 'लाइव टूर' : 'Live Tour'}</span>
            </button>

            {/* Quick Demo Reset Pill */}
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              title="Reset seeded retail demo data"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition active:scale-95"
            >
              <RotateCcw className={`w-3 h-3 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{resetting ? '...' : (language === 'hi' ? 'रीसेट' : 'Reset')}</span>
            </button>

            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition active:scale-95"
              title="Toggle Hindi / English"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'hi' ? 'HI' : 'EN'}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu with Frosted Glass */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-2xl p-4 space-y-2 animate-fadeIn shadow-xl">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-slate-500 font-medium">
              📍 {currentShop?.village || 'Utraula Dehat'}, {currentShop?.district || 'Balrampur'}
            </span>
            <button
              onClick={() => {
                handleResetDemo();
                setMobileMenuOpen(false);
              }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              {language === 'hi' ? 'डेमो डेटा रीसेट' : 'Reset Demo'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
