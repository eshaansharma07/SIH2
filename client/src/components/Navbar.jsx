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
  Zap,
  MapPin,
  ArrowRightLeft,
  LogOut
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { Badge, Button } from './ui';
import { SyncStatusBadge } from './SyncStatusBadge';

export function Navbar({ activeTab, setActiveTab, currentShop, isDemoMode, onReloadDemo, onStartDemoTour, onSwitchToDemo, onSwitchToRegister, onLogout }) {
  const { t, language, toggleLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const udyamNumber = currentShop?.udyam_number || (currentShop?.id ? `UDYAM-${(currentShop.state || 'IN').substring(0, 2).toUpperCase()}-DEMO` : '');

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-white/95 border-b border-paper-300/90 shadow-2xs transition-all">
      {/* Tri-Color Micro-Rule */}
      <div className="h-[3px] w-full bg-gradient-to-r from-terracotta-500 via-paper-200 to-forestRural-600" />

      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Mark: Rural Micro-Enterprise Ledger */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group min-w-0 flex-1 sm:flex-initial"
          >
            {/* Folk / Bahi-Khata Geometric Mark */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-terracotta-600 flex items-center justify-center text-white shadow-2xs group-hover:bg-terracotta-700 transition-all shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-paper-100 transition-transform duration-200 group-hover:scale-105" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 leading-tight">
                <span className="font-black text-sm sm:text-lg tracking-tight text-indigoRural-900 font-display truncate">
                  व्यापार साथी
                </span>
                <span className="text-xs font-bold text-indigoRural-500 hidden sm:inline">
                  Vyapaar Saathi
                </span>
                {/* Mode Badge */}
                {isDemoMode ? (
                  <Badge variant="attention" size="sm" className="px-1.5 py-0 text-[10px] shrink-0">
                    DEMO DATA
                  </Badge>
                ) : currentShop ? (
                  <Badge variant="positive" size="sm" className="px-1.5 py-0 text-[10px] shrink-0">
                    LIVE
                  </Badge>
                ) : null}
              </div>
              <div className="text-[10px] font-semibold text-indigoRural-500 flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="font-bold text-indigoRural-800 truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
                  {currentShop?.name || (language === 'hi' ? 'दुकान' : 'Store')}
                </span>
                {udyamNumber && (
                  <>
                    <span className="text-paper-400 shrink-0">•</span>
                    <span className="text-indigoRural-600 font-mono truncate text-[9px] sm:text-[10px] max-w-[90px] sm:max-w-none">
                      {udyamNumber}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation: Segmented Controls */}
          <nav className="hidden lg:flex items-center p-1 rounded-xl bg-paper-200/80 border border-paper-300 shadow-2xs">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-white text-indigoRural-950 shadow-2xs scale-[1.02]' 
                      : 'text-indigoRural-600 hover:text-indigoRural-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    item.isAi 
                      ? 'text-terracotta-600' 
                      : isActive ? 'text-terracotta-600' : 'text-indigoRural-500'
                  }`} />
                  {item.isAi && (
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Real-time DPI / PWA Sync & Connectivity Badge */}
            <SyncStatusBadge />
            
            {/* Live Guided Demo Button */}
            {isDemoMode && (
              <Button
                onClick={onStartDemoTour}
                variant="primary"
                size="sm"
                icon={Sparkles}
                className="shadow-2xs !p-1.5 sm:!px-3 sm:!py-1.5"
              >
                <span className="hidden sm:inline">{language === 'hi' ? 'लाइव टूर' : 'Live Tour'}</span>
              </Button>
            )}

            {/* Mode Switch Pill */}
            {isDemoMode ? (
              <Button
                onClick={onSwitchToRegister}
                variant="secondary"
                size="sm"
                icon={ArrowRightLeft}
                className="hidden sm:inline-flex"
              >
                <span>{language === 'hi' ? 'असली पंजीकरण' : 'Real Registration'}</span>
              </Button>
            ) : currentShop && (
              <Button
                onClick={onSwitchToDemo}
                variant="secondary"
                size="sm"
                icon={ArrowRightLeft}
                className="hidden sm:inline-flex"
              >
                <span>{language === 'hi' ? 'जज डेमो' : 'Judge Demo'}</span>
              </Button>
            )}

            {/* Quick Demo Reset Pill (only when in demo mode) */}
            {isDemoMode && (
              <Button
                onClick={handleResetDemo}
                disabled={resetting}
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                className="hidden sm:inline-flex"
              >
                <span>{resetting ? '...' : (language === 'hi' ? 'रीसेट' : 'Reset')}</span>
              </Button>
            )}

            {/* Language Switcher Pill */}
            <Button
              onClick={toggleLanguage}
              variant="outline"
              size="sm"
              icon={Globe}
              className="!px-2 sm:!px-3"
            >
              <span>{language === 'hi' ? 'HI' : 'EN'}</span>
            </Button>

            {/* Log Out Button */}
            {currentShop && (
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                icon={LogOut}
                className="hidden sm:inline-flex !text-terracotta-700 hover:!text-terracotta-900 !border-terracotta-200 hover:!bg-terracotta-50 shadow-2xs font-extrabold"
                title={language === 'hi' ? 'दुकान से लॉग आउट करें' : 'Log out from active session'}
              >
                <span>{language === 'hi' ? 'लॉग आउट' : 'Log Out'}</span>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-indigoRural-700 hover:bg-paper-200 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-paper-300 bg-white/95 backdrop-blur-2xl p-4 space-y-2 animate-fadeIn shadow-lg">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-paper-200">
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
                      ? 'bg-terracotta-600 text-white shadow-2xs' 
                      : 'bg-paper-50 text-indigoRural-800 hover:bg-paper-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 text-xs border-t border-paper-100">
            <span className="text-indigoRural-500 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigoRural-400 shrink-0" />
              <span>{currentShop?.village || '—'}, {currentShop?.district || '—'}</span>
            </span>
            <div className="flex items-center gap-3">
              {isDemoMode ? (
                <button
                  onClick={() => {
                    onSwitchToRegister?.();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-terracotta-700 hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'असली पंजीकरण' : 'Real Registration'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    onSwitchToDemo?.();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-terracotta-700 hover:underline cursor-pointer"
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
                  className="flex items-center gap-1 text-xs font-black text-terracotta-700 hover:text-terracotta-900 bg-terracotta-50 px-2 py-1 rounded-md border border-terracotta-200 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{language === 'hi' ? 'लॉग आउट' : 'Log Out'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
