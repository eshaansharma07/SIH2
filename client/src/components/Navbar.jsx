import React, { useState } from 'react';
import { 
  Home,
  BookOpen, 
  TrendingUp, 
  Landmark, 
  FileText, 
  Bell, 
  ChevronDown, 
  Menu, 
  X, 
  User, 
  LogOut, 
  RotateCcw, 
  ArrowRightLeft,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../utils/api';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentShop, 
  isDemoMode, 
  onReloadDemo, 
  onStartDemoTour, 
  onSwitchToDemo, 
  onSwitchToRegister, 
  onLogout,
  onToggleSidebar
}) {
  const { language, toggleLanguage } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // If on landing/onboarding, OnboardingPage provides its own dedicated masthead
  if (activeTab === 'onboarding' || !currentShop) {
    return null;
  }

  const navItems = [
    { id: 'dashboard', label: language === 'hi' ? 'अवलोकन' : 'Overview', icon: Home },
    { id: 'cashflow', label: language === 'hi' ? 'बही-खाता' : 'Bahi-Khata', icon: BookOpen },
    { id: 'credit', label: language === 'hi' ? 'क्रेडिट स्कोर' : 'Credit Score', icon: TrendingUp },
    { id: 'schemes', label: language === 'hi' ? 'सरकारी योजनाएं' : 'Schemes', icon: Landmark },
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

  const ownerName = currentShop?.owner_name || 'Ramesh Kumar';
  const shopName = currentShop?.name || "Ramesh's Kirana Store";
  const initials = ownerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'RK';

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#FAF8F5]/90 border-b border-[#ECE5D8] transition-all">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-3">
          
          {/* Mobile Sidebar Hamburger + Left Brand (visible on mobile only) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif font-black text-sm text-[#0F3E2E]">साख सेतु</span>
          </div>

          {/* Desktop Navigation Tabs (Exact Reference Style) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer
                    ${isActive 
                      ? 'bg-[#E5EDE7] text-[#0F3E2E] font-bold shadow-2xs' 
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/50'
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0F3E2E]' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#FAF8F5]" />
              </button>

              {/* Notification Popover */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xl z-50 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 font-bold text-stone-900 font-serif">
                    <span>{language === 'hi' ? 'सूचनाएं' : 'Notifications'}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-sans">1 New</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                      <div>
                        <div className="font-bold text-stone-800">PM MUDRA Kishor Scheme Matched</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">Pre-eligible for up to ₹5,00,000 working capital loan under RBI PSL norms.</div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                      <div>
                        <div className="font-bold text-stone-800">Daily Udhaar Reminder Sent</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">WhatsApp reminder queued for Sunil (₹1,250).</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher: हिन्दी | English */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg bg-stone-200/70 hover:bg-stone-200 text-[11px] font-bold text-stone-800 transition-colors cursor-pointer border border-stone-300/50"
              title="Toggle language"
            >
              {language === 'hi' ? 'English' : 'हिंदी'}
            </button>

            {/* Profile Chip & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-stone-200/50 transition-all cursor-pointer border border-transparent hover:border-stone-200"
              >
                {/* Dark Forest Green Initials Circle */}
                <div className="w-8 h-8 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {initials}
                </div>

                {/* Name & Store Lockup (Desktop) */}
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="font-serif font-bold text-xs text-stone-900 truncate max-w-[120px]">
                    {ownerName}
                  </span>
                  <span className="text-[10px] text-stone-500 truncate max-w-[120px] mt-0.5">
                    {shopName}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl p-1.5 shadow-2xl z-50 space-y-1 text-xs">
                  <div className="px-3 py-2 border-b border-stone-100">
                    <div className="font-bold text-stone-900 truncate">{ownerName}</div>
                    <div className="text-[10px] text-stone-500 truncate">{shopName}</div>
                    <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Udyam Merchant</span>
                    </div>
                  </div>

                  {/* Evaluator & Demo Tools */}
                  <button
                    type="button"
                    onClick={() => { onStartDemoTour?.(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 text-left transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'hi' ? 'लाइव टूर देखें' : 'Start Demo Tour'}</span>
                  </button>

                  {isDemoMode ? (
                    <button
                      type="button"
                      onClick={() => { onSwitchToRegister?.(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 text-left transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-stone-500" />
                      <span>{language === 'hi' ? 'असली खाता बनाएं' : 'Switch to Real Account'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { onSwitchToDemo?.(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 text-left transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'hi' ? 'जज डेमो स्टोर' : 'Switch to Judge Demo'}</span>
                    </button>
                  )}

                  {isDemoMode && (
                    <button
                      type="button"
                      onClick={() => { handleResetDemo(); setProfileOpen(false); }}
                      disabled={resetting}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 text-left transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                      <span>{resetting ? 'Resetting...' : (language === 'hi' ? 'डेमो रीसेट करें' : 'Reset Demo Data')}</span>
                    </button>
                  )}

                  <div className="h-[1px] bg-stone-100 my-1" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => { onLogout?.(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-700 hover:bg-red-50 text-left transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'लॉग आउट' : 'Log Out'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
