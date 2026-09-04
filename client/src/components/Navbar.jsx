import React, { useState } from 'react';
import { 
  Store, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Landmark, 
  FileText, 
  Settings, 
  Globe, 
  RotateCcw,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { SaathiAvatar } from './SaathiAvatar';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../utils/api';

export function Navbar({ activeTab, setActiveTab, currentShop, onReloadDemo }) {
  const { t, language, toggleLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Store },
    { id: 'advisor', label: t('nav.advisor'), icon: Sparkles, badge: 'AI' },
    { id: 'cashflow', label: t('nav.cashflow'), icon: BookOpen },
    { id: 'credit', label: t('nav.credit'), icon: TrendingUp },
    { id: 'schemes', label: t('nav.schemes'), icon: Landmark },
    { id: 'dossier', label: t('nav.dossier'), icon: FileText },
    { id: 'profile', label: t('nav.profile'), icon: Settings }
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

  const indianLanguages = [
    { code: 'hi', name: 'हिंदी (Hindi)', active: true },
    { code: 'en', name: 'English', active: true },
    { code: 'bn', name: 'বাংলা (Bengali)', active: false, badge: 'Soon' },
    { code: 'mr', name: 'मराठी (Marathi)', active: false, badge: 'Soon' },
    { code: 'te', name: 'తెలుగు (Telugu)', active: false, badge: 'Soon' },
    { code: 'ta', name: 'தமிழ் (Tamil)', active: false, badge: 'Soon' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)', active: false, badge: 'Soon' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', active: false, badge: 'Soon' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Odia)', active: false, badge: 'Soon' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-paper-50/95 backdrop-blur-md border-b-2 border-paper-300 shadow-paper">
      
      {/* Top Banner with Shop Details, Demo Loader & Language Selector */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 border-b border-paper-200 text-xs text-stone-700">
        
        {/* Left: Current Active Shop Badge */}
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-forestRural-500 animate-pulse shrink-0" />
          <span className="font-bold text-stone-900 truncate">
            {currentShop?.name || "Ramesh Kirana & General Store"}
          </span>
          <span className="hidden sm:inline text-stone-500 text-[11px] truncate">
            📍 {currentShop?.village || "Utraula Dehat"}, {currentShop?.district || "Balrampur"} ({currentShop?.state || "UP"})
          </span>
        </div>

        {/* Right: 1-Click Demo Reload + Multilingual Selector */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* 1-Click Demo Reset Button */}
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            title="Reset to Ramesh's 90-day seeded retail history"
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold shadow-xs active:scale-95 transition"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">
              {resetting ? 'Loading...' : (language === 'hi' ? 'रमेश डेमो लोड करें' : 'Ramesh Demo')}
            </span>
          </button>

          {/* Multilingual Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-paper-100 border border-stone-300 rounded-lg text-[11px] font-bold text-stone-800 shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-terracotta-600" />
              <span>{language === 'hi' ? 'हिंदी' : 'English'}</span>
              <span className="text-[10px] text-terracotta-600 font-semibold hidden md:inline">+8 more</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-paper-300 py-1.5 z-50 animate-fadeIn text-xs">
                <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                  Select Language (भाषा चुनें)
                </div>
                {indianLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (lang.active) {
                        toggleLanguage();
                        setLangDropdownOpen(false);
                      }
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-paper-100 transition ${
                      language === lang.code ? 'font-bold text-terracotta-700 bg-terracotta-50' : 'text-stone-700'
                    }`}
                  >
                    <span>{lang.name}</span>
                    {lang.badge ? (
                      <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                        {lang.badge}
                      </span>
                    ) : (
                      language === lang.code && <span className="text-terracotta-600">✓</span>
                    )}
                  </button>
                ))}
                <div className="px-3 py-1 text-[10px] text-stone-500 bg-stone-50 border-t border-stone-100 mt-1">
                  💡 Designed for i18n scale across 10 Indian regional languages
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Companion Diya */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <SaathiAvatar size="md" glowing={true} />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-terracotta-800 tracking-tight font-display group-hover:text-terracotta-700 transition">
                  {language === 'hi' ? 'व्यापार साथी' : 'Vyapaar Saathi'}
                </span>
                <span className="hidden sm:inline text-xs text-ochre-700 font-bold bg-ochre-100 px-2 py-0.5 rounded-full border border-ochre-200">
                  SIH 26091
                </span>
              </div>
              <p className="text-[11px] font-semibold text-stone-600 leading-tight">
                {language === 'hi' ? 'ग्रामीण व्यापारी सलाहकार एवं वित्तीय साथी' : 'Rural Business & Credit Advisor'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-terracotta-600 text-white shadow-sm shadow-terracotta-300'
                      : 'text-stone-700 hover:bg-paper-200 hover:text-terracotta-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                      isActive ? 'bg-ochre-400 text-terracotta-900' : 'bg-ochre-200 text-ochre-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-stone-700 hover:bg-paper-200"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-paper-100 border-b-2 border-paper-300 px-4 py-3 space-y-1 animate-fadeIn">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                  isActive
                    ? 'bg-terracotta-600 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-paper-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-ochre-300 text-ochre-900 px-2 py-0.5 rounded-full font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile Fixed Bottom Quick Bar for Field Usability */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-paper-300 px-2 py-1.5 shadow-2xl flex items-center justify-around">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-bold transition min-w-[54px] ${
                isActive ? 'text-terracotta-700' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-terracotta-100' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate max-w-[62px]">{item.label}</span>
            </button>
          );
        })}
      </div>

    </header>
  );
}
