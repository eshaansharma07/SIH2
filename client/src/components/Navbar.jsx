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
    { id: 'advisor', label: language === 'hi' ? 'एआई सलाहकार' : 'AI Advisor', icon: Sparkles, isAi: true },
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
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-white/80 border-b border-slate-200/70 shadow-[0_2px_16px_rgba(0,0,0,0.02)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo: Clean Apple / Linear Aesthetic */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-tight text-slate-900 font-sans">
                  Vyapaar<span className="text-indigo-600">Saathi</span>
                </span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  AI 2.0
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-600 mt-0.5 tracking-wide">
                {currentShop?.village || 'Balrampur'} • {currentShop?.trade_name || 'Kirana'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation: iOS Segmented Pill Controls */}
          <nav className="hidden xl:flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-inner">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-white text-slate-900 shadow-xs scale-[1.02]' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    item.isAi 
                      ? 'text-indigo-600 animate-pulse' 
                      : isActive ? 'text-indigo-600' : 'text-slate-600'
                  }`} />
                  <span>{item.label}</span>
                  {item.isAi && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Ultra-clean Pills */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Live Guided Demo Button */}
            <button
              onClick={onStartDemoTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white text-xs font-bold shadow-xs transition"
              title="Interactive Live Tour for Hackathon Judges"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span className="hidden sm:inline">{language === 'hi' ? 'लाइव डेमो' : 'Live Tour'}</span>
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
