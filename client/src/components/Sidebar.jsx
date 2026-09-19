import React, { useState } from 'react';
import { 
  Home, 
  Receipt, 
  Package, 
  Users, 
  TrendingUp, 
  Landmark, 
  FileText, 
  Headphones, 
  X, 
  Sparkles,
  Phone,
  MessageCircle,
  Plus,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { VyapaarVikasVishwas } from './VyapaarVikasVishwas';
import { getSiteText } from '../data/siteTranslations';

export function Sidebar({
  activeTab,
  setActiveTab,
  currentShop,
  onOpenWholesale,
  isOpen = false,
  onClose,
  summaryData,
  creditData,
  onOpenKeypad
}) {
  const { language, t } = useTranslation();
  const [helpOpen, setHelpOpen] = useState(false);

  // Map sidebar item IDs to existing App tab IDs
  const navItems = [
    { 
      id: 'dashboard', 
      label: t('nav.dashboard', 'Overview'), 
      icon: Home 
    },
    { 
      id: 'cashflow', 
      label: t('nav.cashflow', 'Bahi-Khata'), 
      icon: Receipt,
      filter: 'all'
    },
    { 
      id: 'inventory', 
      label: getSiteText(language, 'nav', 'inventory', 'Inventory'), 
      icon: Package,
      action: 'wholesale'
    },
    { 
      id: 'customers', 
      label: getSiteText(language, 'nav', 'customers', 'Customers (Udhaar)'), 
      icon: Users,
      tab: 'cashflow',
      subTab: 'udhaar'
    },
    { 
      id: 'credit', 
      label: t('nav.credit', 'Credit Score'), 
      icon: TrendingUp 
    },
    { 
      id: 'schemes', 
      label: t('nav.schemes', 'Schemes'), 
      icon: Landmark 
    },
    { 
      id: 'dossier', 
      label: t('nav.dossier', 'Bank Dossier'), 
      icon: FileText 
    }
  ];

  const handleItemClick = (item) => {
    if (item.action === 'wholesale') {
      onOpenWholesale?.();
    } else if (item.subTab === 'udhaar') {
      try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'udhaar'); } catch (_) {}
      setActiveTab('cashflow');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'udhaar' } }));
      }, 50);
    } else {
      setActiveTab(item.id);
    }
    onClose?.();
  };

  const isItemActive = (item) => {
    if (item.id === 'customers') return false;
    if (item.id === 'inventory') return false;
    return activeTab === item.id;
  };

  const shopName = currentShop?.name || "Ramesh's Kirana Store";
  const shopLocation = currentShop?.village && currentShop?.district 
    ? `${currentShop.village}, ${currentShop.district}`
    : currentShop?.district || "Balrampur, Uttar Pradesh";

  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 xl:w-64 bg-[#F6F3EC] border-r border-[#ECE5D8] flex flex-col justify-between transition-transform duration-200 ease-in-out
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0 overflow-y-auto no-scrollbar
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Top Section */}
        <div className="flex flex-col p-4 sm:p-5 pb-0">
          
          {/* Logo Lockup */}
          <div className="flex items-center justify-between mb-5">
            <div 
              onClick={() => { setActiveTab('dashboard'); onClose?.(); }}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              {/* Bridge Mark SVG */}
              <svg className="w-8 h-7 text-[#0F3E2E]" viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 29H40" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M8 29L22 7L36 29" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 18H29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 29V23M32 29V23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="22" cy="7" r="2.2" fill="currentColor" />
              </svg>
              <div className="flex flex-col leading-none">
                <span className="font-serif font-black text-base text-[#0F3E2E] tracking-tight">व्यापार सेतु</span>
                <span className="text-[10px] font-sans font-bold text-[#0F3E2E]/80 tracking-wider">Vyapaar Setu</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button 
                type="button" 
                onClick={onClose} 
                className="lg:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Business Identity Card (Dark Forest Green Container) */}
          <div className="relative rounded-2xl bg-[#123B2B] text-white p-3 sm:p-3.5 mb-4 shadow-sm overflow-hidden border border-[#0F3E2E]">
            <div className="relative z-10 flex items-center gap-2.5">
              {/* Circular Store Avatar */}
              <div className="w-10 h-10 rounded-full border-2 border-amber-400/80 overflow-hidden shrink-0 bg-stone-800 flex items-center justify-center">
                <img 
                  src="/assets/saakhsetu/shopkeeper-avatar.png" 
                  alt={shopName} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="font-serif font-bold text-xs leading-snug truncate text-[#FFFDF8]">
                  {shopName}
                </span>
                <span className="text-[10px] text-amber-200/90 truncate font-medium">
                  {shopLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-200 text-left cursor-pointer
                    ${active 
                      ? 'bg-[#E3EBE4] text-[#0F3E2E] font-bold shadow-2xs border-l-[3px] border-[#15803D]' 
                      : 'text-stone-700 hover:text-stone-950 hover:bg-[#EFEAE0] font-medium'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0F3E2E]' : 'text-stone-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Space Utilization: Live Daily Ledger & Quick Action Card */}
          <div className="mt-4 rounded-2xl bg-white/90 border border-[#E2D8C3] p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span className="font-serif font-bold text-[11px] text-[#0F3E2E]">
                  {getSiteText(language, 'sidebar', 'todayLedger', "Today's Ledger")}
                </span>
              </div>
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                {getSiteText(language, 'sidebar', 'live', 'Live')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5 text-left">
              <div className="bg-[#FAF8F5] p-2 rounded-xl border border-stone-200/60">
                <div className="text-[9px] text-stone-500 font-medium">
                  {getSiteText(language, 'sidebar', 'salesInflow', 'Sales Inflow')}
                </div>
                <div className="font-bold text-xs text-stone-900 mt-0.5 tabular-nums">
                  ₹{Number(summaryData?.totalIncome || 84200).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-[#FAF8F5] p-2 rounded-xl border border-stone-200/60">
                <div className="text-[9px] text-stone-500 font-medium">
                  {getSiteText(language, 'sidebar', 'pendingUdhaar', 'Pending Udhaar')}
                </div>
                <div className="font-bold text-xs text-amber-700 mt-0.5 tabular-nums">
                  ₹{Number(summaryData?.pendingUdhaar || summaryData?.totalUdhaarGiven || 28400).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Quick Record Sale Button in Sidebar */}
            <button
              type="button"
              onClick={() => {
                onOpenKeypad?.('income');
                onClose?.();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white text-[11px] font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer btn-tactile"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getSiteText(language, 'sidebar', 'recordSaleBtn', '+ Record Sale')}</span>
            </button>
          </div>

          {/* Alternative Credit Score & PSL Readiness Card */}
          <div 
            onClick={() => {
              setActiveTab('credit');
              onClose?.();
            }}
            className="mt-3 rounded-2xl bg-gradient-to-br from-[#123B2B] to-[#0A261C] text-white p-3 shadow-2xs border border-[#164D38] cursor-pointer hover:border-amber-400/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-amber-200/90 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-300" />
                <span>{getSiteText(language, 'sidebar', 'creditScoreTitle', 'Credit Score')}</span>
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                {getSiteText(language, 'sidebar', 'primeBadge', 'Prime')}
              </span>
            </div>
            
            <div className="flex items-baseline justify-between">
              <div className="font-serif font-black text-lg text-white">
                785 <span className="text-[10px] font-normal text-stone-300">/ 850</span>
              </div>
              <span className="text-[10px] text-amber-300 group-hover:underline flex items-center gap-0.5">
                {getSiteText(language, 'sidebar', 'viewCam', 'View CAM')} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-[9px] text-stone-300 mt-1 leading-tight">
              {getSiteText(language, 'sidebar', 'mudraEligible', 'Pre-qualified: ₹5,00,000 Mudra loan')}
            </p>
          </div>
        </div>

        {/* Middle / Lower Decorative Artistic Area */}
        <div className="p-4 sm:p-5 pt-3 flex flex-col items-center">
          {/* Calligraphic 'Vyapaar Vikas Vishwas' Art */}
          <div className="w-full my-1.5 flex justify-center opacity-90">
            <VyapaarVikasVishwas className="w-full" />
          </div>

          {/* Help & Support Button */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="w-full mt-1.5 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-[#EAE4D7] transition-all cursor-pointer border border-transparent hover:border-stone-300/60"
          >
            <Headphones className="w-4 h-4 text-stone-500 shrink-0" />
            <span>{getSiteText(language, 'sidebar', 'helpBtn', 'Help: 1800-889-SETU')}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 lg:hidden" 
        />
      )}

      {/* Help & Support Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0F3E2E] text-white flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900">
                    {language === 'hi' ? 'व्यापार सेतु सहायता केंद्र' : 'Vyapaar Setu Support'}
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    {language === 'hi' ? '24x7 व्यापारी सहायता' : 'Merchant Assistance'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setHelpOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#0F3E2E]" />
                  <div>
                    <div className="font-bold text-stone-800">1800-889-SETU</div>
                    <div className="text-[10px] text-stone-500">Toll-free Merchant Helpline (Hindi/English)</div>
                  </div>
                </div>
                <a 
                  href="tel:18008897388"
                  className="px-2.5 py-1 rounded-lg bg-[#0F3E2E] text-white text-[10px] font-bold"
                >
                  Call
                </a>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-bold text-stone-800">WhatsApp Sahayak</div>
                    <div className="text-[10px] text-stone-500">Daily Udhaar reminders & support</div>
                  </div>
                </div>
                <a 
                  href="https://wa.me/919839124789"
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                >
                  Chat
                </a>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                💡 <strong>Tip:</strong> You can also ask <strong>Setu AI</strong> at the bottom-right for instant guidance on logging sales, calculating udhaar, or matching government schemes!
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="w-full py-2 rounded-xl bg-stone-200 hover:bg-stone-300/80 text-stone-800 text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
