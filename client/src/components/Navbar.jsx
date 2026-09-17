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
  ShieldCheck, 
  MapPin, 
  ArrowRightLeft, 
  LogOut 
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { Badge, Button } from './ui';
import { SyncStatusBadge } from './SyncStatusBadge';
import { APP_NAME_EN, APP_NAME_HI, APP_ADVISOR_NAME_EN, APP_ADVISOR_NAME_HI } from '../config/brand';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentShop, 
  isDemoMode, 
  onReloadDemo, 
  onStartDemoTour, 
  onSwitchToDemo, 
  onSwitchToRegister, 
  onLogout 
}) {
  const { language, toggleLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // If on landing/onboarding, OnboardingPage provides its own dedicated masthead
  if (activeTab === 'onboarding' || !currentShop) {
    return null;
  }

  const navItems = [
    { id: 'dashboard', label: language === 'hi' ? 'डैशबोर्ड' : 'Overview', icon: Store },
    { id: 'cashflow', label: language === 'hi' ? 'बही-खाता' : 'Bahi-Khata', icon: BookOpen },
    { id: 'credit', label: language === 'hi' ? 'क्रेडिट स्कोर' : 'Credit Score', icon: TrendingUp },
    { id: 'schemes', label: language === 'hi' ? 'सरकारी योजनाएं' : 'Schemes', icon: Landmark },
    { id: 'advisor', label: language === 'hi' ? APP_ADVISOR_NAME_HI : APP_ADVISOR_NAME_EN, icon: Sparkles, isAi: true },
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

  const udyamNumber = currentShop?.udyam_number || (currentShop?.id ? `UDYAM-${(currentShop.state || 'IN').substring(0, 2).toUpperCase()}-0092478` : '');

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#FAF8F5]/85 border-b border-stone-200/70 shadow-2xs transition-all">
      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Mark & Active Shop Lockup */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group min-w-0 flex-1 sm:flex-initial"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-2xs group-hover:bg-stone-800 transition-all shrink-0 font-serif font-black text-base">
              स
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 leading-tight">
                <span className="font-serif font-black text-sm sm:text-base tracking-tight text-stone-900 truncate">
                  {APP_NAME_HI}
                </span>
                <span className="text-xs font-bold text-stone-400 hidden sm:inline font-sans">
                  {APP_NAME_EN}
                </span>

                {isDemoMode ? (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    DEMO
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    LIVE
                  </span>
                )}
              </div>

              <div className="text-[10px] font-semibold text-stone-500 flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="font-bold text-stone-800 truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
                  {currentShop?.name || (language === 'hi' ? 'दुकान' : 'Store')}
                </span>
                {udyamNumber && (
                  <>
                    <span className="text-stone-300 shrink-0">•</span>
                    <span className="font-mono truncate text-[9px] sm:text-[10px] max-w-[90px] sm:max-w-none text-stone-500">
                      {udyamNumber}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation: Apple-Style Segmented Bar */}
          <nav className="hidden lg:flex items-center p-1 rounded-xl bg-stone-200/60 border border-stone-300/60 shadow-2xs">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-white text-stone-950 shadow-2xs scale-[1.01]' 
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    item.isAi 
                      ? 'text-amber-600' 
                      : isActive ? 'text-stone-900' : 'text-stone-500'
                  }`} />
                  <span>{item.label}</span>
                  {item.isAi && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              );
            })}
            <div className="h-4 w-[1px] bg-stone-300 mx-1" />
            <button
              type="button"
              onClick={() => setActiveTab('onboarding')}
              title={language === 'hi' ? 'शोकेस लैंडिंग पेज देखें' : 'View Showcase Landing Page'}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-100/70 hover:bg-amber-200/80 transition-all duration-150 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'hi' ? 'शोकेस' : 'Showcase'}</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Real-time Sync Badge */}
            <SyncStatusBadge />
            
            {/* Live Tour Button */}
            {isDemoMode && (
              <button
                type="button"
                onClick={onStartDemoTour}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 shadow-2xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">{language === 'hi' ? 'लाइव टूर' : 'Live Tour'}</span>
              </button>
            )}

            {/* Mode Switch Button */}
            {isDemoMode ? (
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 shadow-2xs transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-stone-500" />
                <span>{language === 'hi' ? 'असली खाता' : 'Real Account'}</span>
              </button>
            ) : currentShop && (
              <button
                type="button"
                onClick={onSwitchToDemo}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 shadow-2xs transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'hi' ? 'जज डेमो' : 'Judge Demo'}</span>
              </button>
            )}

            {/* Quick Demo Reset (Demo Mode only) */}
            {isDemoMode && (
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={resetting}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 shadow-2xs transition-all cursor-pointer"
                title={language === 'hi' ? 'डेमो डेटा रीसेट करें' : 'Reset demo store to day 1'}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? '...' : (language === 'hi' ? 'रीसेट' : 'Reset')}</span>
              </button>
            )}

            {/* Language Switcher */}
            <div className="inline-flex p-0.5 rounded-full bg-stone-200/60 border border-stone-300/60 text-[11px] font-bold">
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2 py-0.5 rounded-full bg-white text-stone-900 shadow-2xs cursor-pointer"
              >
                {language === 'hi' ? 'हिन्दी' : 'EN'}
              </button>
            </div>

            {/* Log Out Button */}
            {currentShop && (
              <button
                type="button"
                onClick={onLogout}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-700 hover:text-red-900 bg-red-50/70 hover:bg-red-100/70 border border-red-200/70 shadow-2xs transition-all cursor-pointer"
                title={language === 'hi' ? 'लॉग आउट' : 'Log out'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'लॉग आउट' : 'Exit'}</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200/80 bg-white/95 backdrop-blur-2xl p-4 space-y-3 animate-fadeIn shadow-lg">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-stone-100">
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
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive 
                      ? 'bg-stone-900 text-white shadow-2xs' 
                      : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setActiveTab('onboarding');
                setMobileMenuOpen(false);
              }}
              className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-100/80 text-amber-900 hover:bg-amber-200/90 transition cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>{language === 'hi' ? '✨ शोकेस लैंडिंग पेज देखें' : '✨ View Showcase Landing'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-stone-500 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{currentShop?.village || '—'}, {currentShop?.district || '—'}</span>
            </span>
            <div className="flex items-center gap-2">
              {isDemoMode ? (
                <button
                  onClick={() => {
                    onSwitchToRegister?.();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-stone-700 hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'असली पंजीकरण' : 'Real Registration'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    onSwitchToDemo?.();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'जज डेमो' : 'Judge Demo'}
                </button>
              )}

              {currentShop && (
                <button
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{language === 'hi' ? 'लॉग आउट' : 'Exit'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
