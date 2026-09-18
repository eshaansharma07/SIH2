import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ArrowRight
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
  onToggleSidebar,
  onOpenWholesale
}) {
  const { language, toggleLanguage } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Interactive Hover Mega-Menu State
  const [hoveredTab, setHoveredTab] = useState(null);
  const leaveTimerRef = useRef(null);
  const navRef = useRef(null);

  // Dismiss dropdown on outside pointer click or Escape key
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setHoveredTab(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHoveredTab(null);
        setProfileOpen(false);
        setNotificationOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // If on landing/onboarding, OnboardingPage provides its own dedicated masthead
  if (activeTab === 'onboarding' || !currentShop) {
    return null;
  }

  // Hover Bridge Debounce Handlers (140ms delay)
  const handleTabMouseEnter = (tabId) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setHoveredTab(tabId);
  };

  const handleTabMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setHoveredTab(null);
    }, 140);
  };

  const handleMenuMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setHoveredTab(null);
    }, 140);
  };

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
  const initials = typeof ownerName === 'string'
    ? (ownerName.trim().split(/\s+/).map(n => n?.[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'RK')
    : 'RK';

  // Navigation Data Map with Contextual Mega-Menu Specs
  const navItems = [
    { 
      id: 'dashboard', 
      label: language === 'hi' ? 'अवलोकन' : 'Overview', 
      icon: Home,
      menuTitle: language === 'hi' ? 'अवलोकन' : 'Overview',
      menuTagline: language === 'hi' ? 'आपका व्यापार एक नज़र में' : 'Your business at a glance',
      menuDescription: language === 'hi' ? 'व्यापार के सभी मुख्य आंकड़े और दैनिक प्रगति।' : "See what's happening across your business.",
      items: [
        {
          id: 'dash-overview',
          title: language === 'hi' ? 'व्यापार अवलोकन' : 'Business Overview',
          description: language === 'hi' ? 'मुख्य आंकड़े और दैनिक समरी' : 'View all key business metrics',
          action: () => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'dash-activity',
          title: language === 'hi' ? 'हालिया गतिविधि' : 'Recent Activity',
          description: language === 'hi' ? 'दैनिक बही-खाता गतिविधि' : 'Latest ledger & shop updates',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_dashboard_action', 'activity'); } catch (_) {}
            setActiveTab('dashboard');
            window.dispatchEvent(new CustomEvent('saakhsetu:dashboard-action', { detail: { action: 'activity' } }));
          }
        },
        {
          id: 'dash-customers',
          title: language === 'hi' ? 'ग्राहक' : 'Customers',
          description: language === 'hi' ? 'ग्राहक खाते और उधार रिकॉर्ड' : 'Customer ledgers & balances',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'customers'); } catch (_) {}
            setActiveTab('cashflow');
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'customers' } }));
          }
        },
        {
          id: 'dash-inventory',
          title: language === 'hi' ? 'स्टॉक व इन्वेंट्री' : 'Inventory',
          description: language === 'hi' ? 'थोक खरीद व सप्लायर कैटलॉग' : 'Wholesale discovery & stock',
          action: () => {
            onOpenWholesale?.();
          }
        },
        {
          id: 'dash-transactions',
          title: language === 'hi' ? 'लेन-देन' : 'Transactions',
          description: language === 'hi' ? 'दैनिक नकदी एवं यूपीआई रिकॉर्ड' : 'Recent cash & digital records',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'all'); } catch (_) {}
            setActiveTab('cashflow');
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'all' } }));
          }
        }
      ]
    },
    { 
      id: 'cashflow', 
      label: language === 'hi' ? 'बही-खाता' : 'Bahi-Khata', 
      icon: BookOpen,
      menuTitle: language === 'hi' ? 'बही-खाता' : 'Bahi-Khata',
      menuTagline: language === 'hi' ? 'दैनिक व्यापार और हिसाब-किताब का प्रबंधन।' : 'Manage your everyday business records.',
      menuDescription: language === 'hi' ? 'प्रत्येक लेन-देन का सुरक्षित और पारदर्शी रिकॉर्ड।' : 'Record and manage every business transaction.',
      items: [
        {
          id: 'cf-all',
          title: language === 'hi' ? 'सभी लेन-देन' : 'All Transactions',
          description: language === 'hi' ? 'सभी रिकॉर्ड देखें' : 'View all records',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'all'); } catch (_) {}
            setActiveTab('cashflow');
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'all' } }));
          }
        },
        {
          id: 'cf-sales',
          title: language === 'hi' ? 'बिक्री' : 'Sales',
          description: language === 'hi' ? 'दैनिक आय और बिक्री' : 'Money received',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'sales'); } catch (_) {}
            setActiveTab('cashflow');
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'sales' } }));
          }
        },
        {
          id: 'cf-purchases',
          title: language === 'hi' ? 'खरीद' : 'Purchases',
          description: language === 'hi' ? 'दुकान का सामान खरीद' : 'Stock purchases',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'purchases'); } catch (_) {}
            setActiveTab('cashflow');
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'purchases' } }));
          }
        },
        {
          id: 'cf-expenses',
          title: language === 'hi' ? 'खर्च' : 'Expenses',
          description: language === 'hi' ? 'दुकान व परिचालन खर्च' : 'Business costs',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'expenses'); } catch (_) {}
            setActiveTab('cashflow');
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'expenses' } }));
          }
        },
        {
          id: 'cf-udhaar',
          title: language === 'hi' ? 'उधार' : 'Udhaar',
          description: language === 'hi' ? 'लंबित उधारी व वसूली' : 'Credit ledger',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'udhaar'); } catch (_) {}
            setActiveTab('cashflow');
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'udhaar' } }));
          }
        },
        {
          id: 'cf-customers',
          title: language === 'hi' ? 'ग्राहक' : 'Customers',
          description: language === 'hi' ? 'ग्राहक संपर्क व इतिहास' : 'Customer records',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'customers'); } catch (_) {}
            setActiveTab('cashflow');
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'customers' } }));
          }
        }
      ]
    },
    { 
      id: 'credit', 
      label: language === 'hi' ? 'क्रेडिट स्कोर' : 'Credit Score', 
      icon: TrendingUp,
      menuTitle: language === 'hi' ? 'क्रेडिट स्कोर' : 'Credit Score',
      menuTagline: language === 'hi' ? 'व्यापार से बैंक ऋण पात्रता का निर्माण।' : 'Understand how your business activity builds credit readiness.',
      menuDescription: language === 'hi' ? 'बिना सिबिल स्कोर के बैंक ऋण पात्रता की पारदर्शी जांच।' : 'See how your verified business activity contributes to your credit profile.',
      items: [
        {
          id: 'cr-score',
          title: language === 'hi' ? 'क्रेडिट स्कोर' : 'Credit Score',
          description: language === 'hi' ? 'समग्र स्कोर और योजना श्रेणी' : 'Overall score & breakdown',
          action: () => {
            setActiveTab('credit');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'cr-pillars',
          title: language === 'hi' ? 'मूल्यांकन के आधार' : 'Evaluation Pillars',
          description: language === 'hi' ? 'पारदर्शी 4 स्कोरिंग मानक' : 'Core scoring dimensions',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_credit_action', 'pillars'); } catch (_) {}
            setActiveTab('credit');
            window.dispatchEvent(new CustomEvent('saakhsetu:credit-action', { detail: { action: 'pillars' } }));
          }
        },
        {
          id: 'cr-simulator',
          title: language === 'hi' ? 'स्कोर सिम्युलेटर' : 'Score Simulator',
          description: language === 'hi' ? 'स्कोर बढ़ाने का सिमुलेशन' : 'Test improvement scenarios',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_credit_action', 'simulator'); } catch (_) {}
            setActiveTab('credit');
            window.dispatchEvent(new CustomEvent('saakhsetu:credit-action', { detail: { action: 'simulator' } }));
          }
        },
        {
          id: 'cr-insights',
          title: language === 'hi' ? 'क्रेडिट अंतर्दृष्टि' : 'Credit Insights',
          description: language === 'hi' ? 'स्कोर सुधारने के व्यावहारिक सुझाव' : 'Alternative credit analysis',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_credit_action', 'insights'); } catch (_) {}
            setActiveTab('credit');
            window.dispatchEvent(new CustomEvent('saakhsetu:credit-action', { detail: { action: 'insights' } }));
          }
        }
      ]
    },
    { 
      id: 'schemes', 
      label: language === 'hi' ? 'सरकारी योजनाएं' : 'Schemes', 
      icon: Landmark,
      menuTitle: language === 'hi' ? 'सरकारी योजनाएं' : 'Government Schemes',
      menuTagline: language === 'hi' ? 'अपने व्यापार के लिए उपयुक्त योजनाएं खोजें।' : 'Find schemes relevant to your business.',
      menuDescription: language === 'hi' ? 'सत्यापित सरकारी सब्सिडी एवं ऋण योजनाएं।' : 'Explore verified government support matched to your business.',
      items: [
        {
          id: 'sc-recommended',
          title: language === 'hi' ? 'आपके लिए अनुशंसित' : 'Recommended for You',
          description: language === 'hi' ? 'दुकान के अनुरूप शीर्ष योजनाएं' : 'Matched to your business',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_schemes_filter', 'recommended'); } catch (_) {}
            setActiveTab('schemes');
            window.dispatchEvent(new CustomEvent('saakhsetu:schemes-filter', { detail: { filterType: 'recommended' } }));
          }
        },
        {
          id: 'sc-all',
          title: language === 'hi' ? 'सभी योजनाएं' : 'All Schemes',
          description: language === 'hi' ? 'राष्ट्रीय योजना डायरेक्टरी' : 'Complete scheme directory',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_schemes_filter', 'all'); } catch (_) {}
            setActiveTab('schemes');
            window.dispatchEvent(new CustomEvent('saakhsetu:schemes-filter', { detail: { filterType: 'all' } }));
          }
        },
        {
          id: 'sc-loans',
          title: language === 'hi' ? 'ऋण योजनाएं' : 'Loan Schemes',
          description: language === 'hi' ? 'मुद्रा व कार्यशील पूंजी ऋण' : 'MUDRA & credit facilities',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_schemes_filter', 'loan'); } catch (_) {}
            setActiveTab('schemes');
            window.dispatchEvent(new CustomEvent('saakhsetu:schemes-filter', { detail: { filterType: 'loan' } }));
          }
        },
        {
          id: 'sc-subsidies',
          title: language === 'hi' ? 'सब्सिडी व अनुदान' : 'Subsidies & Grants',
          description: language === 'hi' ? 'सीधी आर्थिक सहायता एवं छूट' : 'Direct financial incentives',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_schemes_filter', 'subsidy'); } catch (_) {}
            setActiveTab('schemes');
            window.dispatchEvent(new CustomEvent('saakhsetu:schemes-filter', { detail: { filterType: 'subsidy' } }));
          }
        }
      ]
    },
    { 
      id: 'dossier', 
      label: language === 'hi' ? 'बैंक फाइल' : 'Bank Dossier', 
      icon: FileText,
      menuTitle: language === 'hi' ? 'बैंक फाइल' : 'Bank Dossier',
      menuTagline: language === 'hi' ? 'बैंक ऋण के लिए प्रमाणित फाइल तैयार करें।' : 'Prepare your verified business information for formal credit conversations.',
      menuDescription: language === 'hi' ? 'क्रेडिट असेसमेंट मेमोरेंडम एवं सत्यापन दस्तावेज।' : 'Review and prepare your business credit dossier.',
      items: [
        {
          id: 'ds-overview',
          title: language === 'hi' ? 'डोज़ियर सारांश' : 'Dossier Overview',
          description: language === 'hi' ? 'बैंक मैनेजर के लिए सारांश' : 'Executive credit profile',
          action: () => {
            setActiveTab('dossier');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'ds-readiness',
          title: language === 'hi' ? 'ऋण तत्परता' : 'Credit Readiness',
          description: language === 'hi' ? 'फाइल में शामिल आधिकारिक विवरण' : "What's included in CAM file",
          action: () => {
            try { sessionStorage.setItem('saakhsetu_dossier_action', 'readiness'); } catch (_) {}
            setActiveTab('dossier');
            window.dispatchEvent(new CustomEvent('saakhsetu:dossier-action', { detail: { action: 'readiness' } }));
          }
        },
        {
          id: 'ds-schemes',
          title: language === 'hi' ? 'पात्र योजनाएं' : 'Recommended Schemes',
          description: language === 'hi' ? 'अनुशंसित सरकारी लोन विकल्प' : 'Explore eligible loans',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_schemes_filter', 'recommended'); } catch (_) {}
            setActiveTab('schemes');
            window.dispatchEvent(new CustomEvent('saakhsetu:schemes-filter', { detail: { filterType: 'recommended' } }));
          }
        },
        {
          id: 'ds-download',
          title: language === 'hi' ? 'डोज़ियर डाउनलोड' : 'Download Dossier',
          description: language === 'hi' ? 'आधिकारिक बैंक CAM PDF डाउनलोड' : 'Export official PDF document',
          action: () => {
            try { sessionStorage.setItem('saakhsetu_dossier_action', 'download'); } catch (_) {}
            setActiveTab('dossier');
            window.dispatchEvent(new CustomEvent('saakhsetu:dossier-action', { detail: { action: 'download' } }));
          }
        }
      ]
    }
  ];

  const activeHoverItem = navItems.find(item => item.id === hoveredTab);

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#FAF8F5]/94 border-b border-[#ECE5D8] shadow-[0_4px_24px_rgba(28,25,23,0.03)] transition-all select-none">
      {/* Tri-Color / Terracotta Ambient Micro-Rule */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-terracotta-600 via-amber-500 to-forestRural-600 opacity-85" />
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-3 relative">
          
          {/* Left: Mobile Sidebar Hamburger + Brand (visible on mobile only) */}
          <div className="flex items-center gap-2.5 lg:hidden shrink-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif font-black text-sm text-[#0F3E2E]">व्यापार सेतु</span>
          </div>

          {/* Center: Primary Navigation Tabs & Floating Interactive Mega-Menu */}
          <div ref={navRef} className="hidden lg:flex items-center justify-start xl:justify-center flex-1 min-w-0 relative">
            <nav className="flex items-center gap-1 xl:gap-1.5 flex-nowrap">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isHovered = hoveredTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setHoveredTab(null);
                    }}
                    onMouseEnter={() => handleTabMouseEnter(item.id)}
                    onMouseLeave={handleTabMouseLeave}
                    className={`
                      relative flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 xl:py-2 text-xs transition-all duration-150 cursor-pointer select-none rounded-xl whitespace-nowrap shrink-0
                      ${isActive 
                        ? 'text-[#0F3E2E] font-bold bg-[#0F3E2E]/6 shadow-2xs' 
                        : isHovered
                        ? 'text-stone-950 font-semibold bg-stone-200/60'
                        : 'text-stone-600 hover:text-stone-950 font-medium hover:bg-stone-200/40'
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-[#0F3E2E] stroke-[2.25]' : 'text-stone-500'}`} />
                    <span>{item.label}</span>

                    {/* Subtle, Lightweight Active Underline Indicator */}
                    {isActive && (
                      <span className="absolute bottom-1 left-2.5 right-2.5 xl:left-3 xl:right-3 h-[2px] bg-[#0F3E2E] rounded-full transition-all" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Contextual Interactive Mega-Menu Panel */}
            {activeHoverItem && (
              <div 
                className="absolute top-full left-1/2 -translate-x-1/2 pt-2.5 z-50 pointer-events-auto"
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
              >
                {/* Panel Card */}
                <div className="w-[440px] max-w-[92vw] bg-[#FCFBF8] border border-[#E7DFD4] rounded-2xl p-4 shadow-xl shadow-stone-900/10 transition-all duration-200 ease-out">
                  
                  {/* Morphing Content Area */}
                  <div key={activeHoverItem.id} className="animate-in fade-in zoom-in-[0.99] duration-150">
                    
                    {/* Header Banner */}
                    <div className="flex items-start justify-between pb-2.5 border-b border-[#EDE6DC]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm sm:text-base text-stone-900 tracking-tight">
                            {activeHoverItem.menuTitle}
                          </span>
                          <span className="text-[10px] font-bold text-[#0F3E2E] bg-[#E8F0EA] px-2 py-0.5 rounded-full">
                            Vyapaar Setu
                          </span>
                        </div>
                        <div className="text-xs text-stone-700 font-medium">
                          {activeHoverItem.menuTagline}
                        </div>
                        <div className="text-[11px] text-stone-500 italic leading-snug">
                          "{activeHoverItem.menuDescription}"
                        </div>
                      </div>
                    </div>

                    {/* 2-Column Quick Links Grid */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                      {activeHoverItem.items.map((subItem) => (
                        <button
                          key={subItem.id}
                          type="button"
                          onClick={() => {
                            subItem.action();
                            setHoveredTab(null);
                          }}
                          className="p-2.5 rounded-xl text-left bg-white/70 hover:bg-[#F2ECE3] border border-[#ECE5DA]/80 hover:border-[#DFCFC0] transition-all duration-150 group cursor-pointer flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-stone-800 group-hover:text-[#0F3E2E] transition-colors line-clamp-1">
                              {subItem.title}
                            </span>
                            <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-[#0F3E2E] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                          </div>
                          <span className="text-[10px] text-stone-500 group-hover:text-stone-700 line-clamp-1 mt-0.5">
                            {subItem.description}
                          </span>
                        </button>
                      ))}
                    </div>

                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Right: Action Controls (Notifications, Language, Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto justify-end">
            {/* Live Demo Tour Button */}
            <button
              type="button"
              onClick={() => onStartDemoTour?.()}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200/80 text-amber-950 text-xs font-bold border border-amber-300/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer btn-tactile shrink-0"
              title={language === 'hi' ? 'लाइव डेमो टूर चलाएं' : 'Start Live Guided Demo'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 fill-amber-500/40 shrink-0" />
              <span className="hidden sm:inline lg:hidden xl:inline">{language === 'hi' ? 'लाइव टूर' : 'Demo Tour'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative shrink-0">
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
              className="px-2.5 py-1 rounded-lg bg-stone-200/70 hover:bg-stone-200 text-[11px] font-bold text-stone-800 transition-colors cursor-pointer border border-stone-300/50 shrink-0"
              title="Toggle language"
            >
              {language === 'hi' ? 'English' : 'हिंदी'}
            </button>

            {/* Profile Chip & Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 pr-1.5 sm:pr-2 rounded-full hover:bg-stone-200/50 transition-all cursor-pointer border border-transparent hover:border-stone-200 shrink-0"
              >
                {/* Dark Forest Green Initials Circle */}
                <div className="w-8 h-8 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                  {initials}
                </div>

                {/* Name & Store Lockup (Desktop) */}
                <div className="hidden sm:flex lg:hidden xl:flex flex-col text-left leading-none shrink-0">
                  <span className="font-serif font-bold text-xs text-stone-900 truncate max-w-[100px] 2xl:max-w-[130px]">
                    {ownerName}
                  </span>
                  <span className="text-[10px] text-stone-500 truncate max-w-[100px] 2xl:max-w-[130px] mt-0.5">
                    {shopName}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
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
