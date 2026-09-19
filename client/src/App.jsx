import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { FloatingSetuAI } from './components/FloatingSetuAI';
import { NumericKeypadModal } from './components/NumericKeypadModal';
import { FloatingThumbDock } from './components/FloatingThumbDock';
import { WarliBorder } from './components/WarliMotif';
import { api } from './utils/api';
import { useTranslation } from './i18n/LanguageContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { APP_NAME_EN, APP_NAME_HI, APP_TAGLINE_HI } from './config/brand';

import { lazyRetry } from './utils/lazyRetry';
import { safeStorage } from './utils/safeStorage';
import { PageErrorBoundary } from './components/PageErrorBoundary';

// Resilient lazy-loaded pages with auto-retry and chunk recovery
const DashboardPage = lazyRetry(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })), 'DashboardPage');
const AdvisorChatPage = lazyRetry(() => import('./pages/AdvisorChatPage').then(m => ({ default: m.AdvisorChatPage })), 'AdvisorChatPage');
const CashFlowPage = lazyRetry(() => import('./pages/CashFlowPage').then(m => ({ default: m.CashFlowPage })), 'CashFlowPage');
const CreditScorePage = lazyRetry(() => import('./pages/CreditScorePage').then(m => ({ default: m.CreditScorePage })), 'CreditScorePage');
const SchemeMatcherPage = lazyRetry(() => import('./pages/SchemeMatcherPage').then(m => ({ default: m.SchemeMatcherPage })), 'SchemeMatcherPage');
const BankDossierPage = lazyRetry(() => import('./pages/BankDossierPage').then(m => ({ default: m.BankDossierPage })), 'BankDossierPage');
const ShopProfilePage = lazyRetry(() => import('./pages/ShopProfilePage').then(m => ({ default: m.ShopProfilePage })), 'ShopProfilePage');
const OnboardingPage = lazyRetry(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })), 'OnboardingPage');
const PublicPayPage = lazyRetry(() => import('./pages/PublicPayPage').then(m => ({ default: m.PublicPayPage })), 'PublicPayPage');
const VoiceInputDialog = lazyRetry(() => import('./components/VoiceInputDialog').then(m => ({ default: m.VoiceInputDialog })), 'VoiceInputDialog');
const InteractiveDemoTour = lazyRetry(() => import('./components/InteractiveDemoTour').then(m => ({ default: m.InteractiveDemoTour })), 'InteractiveDemoTour');
const WholesaleDiscoveryModal = lazyRetry(() => import('./components/WholesaleDiscoveryModal').then(m => ({ default: m.WholesaleDiscoveryModal })), 'WholesaleDiscoveryModal');

function PageSkeleton() {
  return (
    <div className="w-full py-8 px-4 space-y-6 animate-pulse max-w-7xl mx-auto">
      <div className="h-8 bg-paper-200/80 rounded-xl w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-28 bg-paper-200/60 rounded-2xl" />
        <div className="h-28 bg-paper-200/60 rounded-2xl" />
        <div className="h-28 bg-paper-200/60 rounded-2xl" />
        <div className="h-28 bg-paper-200/60 rounded-2xl" />
      </div>
      <div className="h-64 bg-paper-200/50 rounded-2xl w-full" />
    </div>
  );
}

export default function App() {
  const { language } = useTranslation();

  // Route check: Standalone /pay/:shopId customer UPI payment portal
  const isPayRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/pay');

  // Read persisted state from safeStorage
  const savedShopId = safeStorage.getItem('vyapaar_active_shop_id');
  const initialShop = safeStorage.getJSON('vyapaar_active_shop');
  const savedIsDemo = safeStorage.getItem('vyapaar_is_demo_mode') === 'true';
  const savedTab = safeStorage.getItem('vyapaar_active_tab');

  const hasUserSession = Boolean(savedShopId || initialShop);
  const [activeTab, setActiveTab] = useState(
    hasUserSession ? (savedTab && savedTab !== 'onboarding' ? savedTab : 'dashboard') : 'onboarding'
  );
  const [currentShop, setCurrentShop] = useState(initialShop);
  const [isDemoMode, setIsDemoMode] = useState(savedIsDemo);
  const [creditData, setCreditData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [cuesData, setCuesData] = useState(null);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [keypadInitialType, setKeypadInitialType] = useState('income');
  const [keypadInitialCategory, setKeypadInitialCategory] = useState(null);

  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [wholesaleModalOpen, setWholesaleModalOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);
  const [initialAdvisorPrompt, setInitialAdvisorPrompt] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestTx, setLatestTx] = useState(null);

  const handleOpenKeypad = (type = 'income', category = null) => {
    const validTypes = ['income', 'expense', 'udhaar_given', 'udhaar_repaid'];
    const safeType = typeof type === 'string' && validTypes.includes(type) ? type : 'income';
    const safeCategory = typeof category === 'string' ? category : null;
    setKeypadInitialType(safeType);
    setKeypadInitialCategory(safeCategory);
    setKeypadOpen(true);
  };

  const changeTab = (tab) => {
    if (tab === 'wholesale') {
      setWholesaleModalOpen(true);
      return;
    }
    if (tab === 'udhaar') {
      try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'udhaar'); } catch (_) {}
      setActiveTab('cashflow');
      safeStorage.setItem('vyapaar_active_tab', 'cashflow');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'udhaar' } }));
      }, 50);
      return;
    }
    setActiveTab(tab);
    if (tab && tab !== 'onboarding') {
      safeStorage.setItem('vyapaar_active_tab', tab);
    }
  };

  useEffect(() => {
    loadAllShopData();

    const handleSyncDone = () => {
      const activeShopId = safeStorage.getItem('vyapaar_active_shop_id');
      if (activeShopId) {
        fetchFinancials(activeShopId);
        setRefreshKey(k => k + 1);
      }
    };

    const handleOpenAdvisor = (e) => {
      const prompt = e.detail?.prompt;
      if (prompt) {
        setInitialAdvisorPrompt(prompt);
      }
      changeTab('advisor');
    };

    const handleGlobalNavigate = (e) => {
      const tab = e.detail?.tab;
      if (tab) {
        changeTab(tab);
      }
    };

    const handleShopUpdated = (e) => {
      const updatedFields = e.detail;
      if (updatedFields) {
        setCurrentShop(prev => {
          const next = { ...(prev || {}), ...updatedFields };
          safeStorage.setJSON('vyapaar_active_shop', next);
          return next;
        });
        setRefreshKey(k => k + 1);
      }
    };

    window.addEventListener('vyapaar:sync-completed', handleSyncDone);
    window.addEventListener('saakhsetu:open-advisor', handleOpenAdvisor);
    window.addEventListener('saakhsetu:navigate', handleGlobalNavigate);
    window.addEventListener('vyapaar:shop-updated', handleShopUpdated);
    return () => {
      window.removeEventListener('vyapaar:sync-completed', handleSyncDone);
      window.removeEventListener('saakhsetu:open-advisor', handleOpenAdvisor);
      window.removeEventListener('saakhsetu:navigate', handleGlobalNavigate);
      window.removeEventListener('vyapaar:shop-updated', handleShopUpdated);
    };
  }, []);

  const fetchFinancials = async (shopId) => {
    if (!shopId) return;
    try {
      const [credRes, sumRes, cuesRes] = await Promise.all([
        api.getCreditScore(shopId),
        api.getTransactionSummary(shopId),
        api.getSeasonalCues(shopId)
      ]);

      if (credRes?.success) setCreditData(credRes);
      if (sumRes?.success) {
        setSummaryData(prev => {
          if (!prev) return sumRes.summary;
          return {
            ...sumRes.summary,
            totalIncome: Math.max(prev.totalIncome || 0, sumRes.summary.totalIncome || 0),
            totalExpense: Math.max(prev.totalExpense || 0, sumRes.summary.totalExpense || 0),
            netSurplus: (Math.max(prev.totalIncome || 0, sumRes.summary.totalIncome || 0)) - (Math.max(prev.totalExpense || 0, sumRes.summary.totalExpense || 0)),
            pendingUdhaar: sumRes.summary.pendingUdhaar !== undefined ? sumRes.summary.pendingUdhaar : prev.pendingUdhaar
          };
        });
      }
      if (cuesRes?.success) setCuesData(cuesRes.data);
    } catch (err) {
      console.warn('Background financial fetch warning:', err);
    }
  };

  const loadAllShopData = async () => {
    try {
      const activeShopId = safeStorage.getItem('vyapaar_active_shop_id');
      const cachedShop = safeStorage.getJSON('vyapaar_active_shop');

      // If user has neither an activeShopId nor a cached profile, show onboarding
      if (!activeShopId && !cachedShop) {
        setLoading(false);
        setActiveTab('onboarding');
        return;
      }

      // Ensure currentShop is populated immediately from cache
      const effectiveShop = cachedShop || (activeShopId ? { id: activeShopId } : null);
      if (effectiveShop && !currentShop) {
        setCurrentShop(effectiveShop);
        setIsDemoMode(effectiveShop.is_demo === 1);
      }

      const idToFetch = activeShopId || cachedShop?.id;
      if (!idToFetch) {
        setLoading(false);
        return;
      }

      // Refresh shop data from API without ever evicting the session on errors
      try {
        const shopRes = await api.getShopCurrent(idToFetch);
        if (shopRes?.shop) {
          setCurrentShop(shopRes.shop);
          safeStorage.setJSON('vyapaar_active_shop', shopRes.shop);
          setIsDemoMode(shopRes.shop.is_demo === 1);
          safeStorage.setItem('vyapaar_is_demo_mode', shopRes.shop.is_demo === 1 ? 'true' : 'false');
          await fetchFinancials(shopRes.shop.id);
        } else if (cachedShop) {
          await fetchFinancials(cachedShop.id);
        }
      } catch (netErr) {
        console.warn('Network issue during shop background sync (session preserved):', netErr.message);
        if (cachedShop?.id) {
          await fetchFinancials(cachedShop.id);
        }
      }
    } catch (err) {
      console.error('Error initializing shop data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSaved = (newTx) => {
    if (newTx) {
      setLatestTx(newTx);

      // Optimistically update summaryData immediately (0ms delay)
      setSummaryData(prev => {
        if (!prev) return prev;
        const amt = Number(newTx.amount) || 0;
        let newIncome = prev.totalIncome || 0;
        let newExpense = prev.totalExpense || 0;
        let newUdhaarGiven = prev.totalUdhaarGiven || 0;
        let newUdhaarRepaid = prev.totalUdhaarRepaid || 0;
        let newCash = prev.cashIncome || 0;
        let newUpi = prev.upiIncome || 0;

        if (newTx.type === 'income') {
          newIncome += amt;
          if (newTx.payment_mode === 'cash') newCash += amt;
          if (newTx.payment_mode === 'upi') newUpi += amt;
        } else if (newTx.type === 'expense') {
          newExpense += amt;
        } else if (newTx.type === 'udhaar_given') {
          newUdhaarGiven += amt;
        } else if (newTx.type === 'udhaar_repaid') {
          newUdhaarRepaid += amt;
          newIncome += amt;
          if (newTx.payment_mode === 'upi') newUpi += amt;
          else newCash += amt;
        }

        const newSurplus = newIncome - newExpense;
        const newPending = Math.max(0, newUdhaarGiven - newUdhaarRepaid);
        const newDigitalShare = newIncome > 0 ? Math.round((newUpi / newIncome) * 100) : 0;

        return {
          ...prev,
          totalIncome: Math.round(newIncome),
          totalExpense: Math.round(newExpense),
          netSurplus: Math.round(newSurplus),
          pendingUdhaar: Math.round(newPending),
          totalUdhaarGiven: Math.round(newUdhaarGiven),
          totalUdhaarRepaid: Math.round(newUdhaarRepaid),
          cashIncome: Math.round(newCash),
          upiIncome: Math.round(newUpi),
          digitalSharePct: newDigitalShare,
          totalTransactions: (prev.totalTransactions || 0) + 1
        };
      });

      // Also optimistically bump creditData metrics
      setCreditData(prev => {
        if (!prev || !prev.metrics) return prev;
        const amt = Number(newTx.amount) || 0;
        const m = prev.metrics;
        let totalIncome = m.totalIncome || 0;
        let netSurplus = m.netSurplus || 0;
        let totalUdhaarPending = m.totalUdhaarPending || 0;

        if (newTx.type === 'income') {
          totalIncome += amt;
          netSurplus += amt;
        } else if (newTx.type === 'expense') {
          netSurplus -= amt;
        } else if (newTx.type === 'udhaar_given') {
          totalUdhaarPending += amt;
        } else if (newTx.type === 'udhaar_repaid') {
          totalUdhaarPending = Math.max(0, totalUdhaarPending - amt);
          netSurplus += amt;
        }

        return {
          ...prev,
          metrics: {
            ...m,
            totalIncome,
            netSurplus,
            totalUdhaarPending
          }
        };
      });
      setRefreshKey(k => k + 1);

      // Background financial sync without risk of session logout
      const activeId = currentShop?.id || safeStorage.getItem('vyapaar_active_shop_id');
      if (activeId) {
        fetchFinancials(activeId);
      }
    }
  };

  const demoShopDefault = {
    id: 'ramesh-kirana',
    name: "Ramesh's Kirana Store",
    owner_name: 'Ramesh Kumar',
    trade_type: 'kirana',
    trade_name: 'Kirana & General Store',
    village: 'Shivpur',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    vintage_years: 5,
    monthly_revenue: 125000,
    ownership: 'owned',
    bank_account_type: 'Gramin Bank',
    phone: '9876543210',
    owner_category: 'OBC',
    is_demo: 1
  };

  // === MODE SWITCHING ===

  // Load Demo Mode (Ramesh Kirana) - Instant response + background seed
  const handleSelectDemo = async () => {
    // 1. Instantly update local state and safeStorage so user transitions immediately (0ms UI latency)
    safeStorage.setItem('vyapaar_active_shop_id', 'ramesh-kirana');
    safeStorage.setJSON('vyapaar_active_shop', demoShopDefault);
    safeStorage.setItem('vyapaar_is_demo_mode', 'true');
    setCurrentShop(demoShopDefault);
    setIsDemoMode(true);
    setRefreshKey(k => k + 1);
    setCreditData(null);
    setSummaryData(null);
    setCuesData(null);
    changeTab('dashboard');

    // 2. Concurrently reset demo shop on server and fetch real financials
    try {
      const demoRes = await api.resetDemoShop().catch(e => {
        console.warn('Demo reset notice (using seeded data):', e.message);
        return null;
      });
      const demoShop = demoRes?.shop || demoShopDefault;
      safeStorage.setJSON('vyapaar_active_shop', demoShop);
      setCurrentShop(demoShop);
      setRefreshKey(k => k + 1);
      fetchFinancials('ramesh-kirana');
    } catch (e) {
      console.warn('Demo fetch notice:', e);
      fetchFinancials('ramesh-kirana');
    }
  };

  const rememberShop = (shop) => {
    if (!shop || !shop.id) return;
    try {
      let list = safeStorage.getJSON('vyapaar_saved_shops', []);
      if (!Array.isArray(list)) list = [];
      list = list.filter(s => s.id !== shop.id);
      list.unshift(shop);
      list = list.slice(0, 6);
      safeStorage.setJSON('vyapaar_saved_shops', list);
    } catch (_) {}
  };

  // Real Registration / Login Complete
  const handleRealRegistrationComplete = (newShop) => {
    if (newShop?.id) {
      safeStorage.setItem('vyapaar_active_shop_id', newShop.id);
      safeStorage.setJSON('vyapaar_active_shop', newShop);
      safeStorage.setItem('vyapaar_is_demo_mode', newShop.is_demo === 1 ? 'true' : 'false');
      rememberShop(newShop);
    }
    setCurrentShop(newShop);
    setIsDemoMode(newShop?.is_demo === 1);
    setCreditData(null);
    setSummaryData(null);
    setCuesData(null);
    changeTab('dashboard');
    if (newShop?.id) {
      fetchFinancials(newShop.id);
    }
  };

  // Switch to real registration from demo mode (MANUAL LOGOUT)
  const handleSwitchToRegister = () => {
    safeStorage.removeItem('vyapaar_active_shop_id');
    safeStorage.removeItem('vyapaar_active_shop');
    safeStorage.removeItem('vyapaar_is_demo_mode');
    safeStorage.removeItem('vyapaar_active_tab');
    setCurrentShop(null);
    setIsDemoMode(false);
    setCreditData(null);
    setSummaryData(null);
    setCuesData(null);
    setActiveTab('onboarding');
  };

  // Reload demo (reset)
  const handleReloadDemo = async () => {
    try {
      const demoRes = await api.resetDemoShop().catch(() => null);
      const demoShop = demoRes?.shop || demoShopDefault;
      safeStorage.setItem('vyapaar_active_shop_id', 'ramesh-kirana');
      safeStorage.setJSON('vyapaar_active_shop', demoShop);
      safeStorage.setItem('vyapaar_is_demo_mode', 'true');
      setCurrentShop(demoShop);
      setIsDemoMode(true);
      setRefreshKey(k => k + 1);
      changeTab('dashboard');
      fetchFinancials('ramesh-kirana');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskPrompt = (promptText) => {
    setInitialAdvisorPrompt(promptText);
    changeTab('advisor');
  };

  // If standalone public payment portal, render directly without merchant auth/state
  if (isPayRoute) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <PublicPayPage />
      </Suspense>
    );
  }

  const shouldReduceMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-stone-900 font-sans">
        <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-serif font-black text-xl shadow-apple-card mb-4 animate-pulse">
          स
        </div>
        <span className="font-serif text-xl font-black tracking-tight text-stone-900">{APP_NAME_HI} • {APP_NAME_EN}</span>
        <span className="text-xs text-stone-500 mt-1 font-medium">{APP_TAGLINE_HI}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden relative paper-canvas flex flex-col font-sans text-stone-900 selection:bg-amber-100 selection:text-amber-900 antialiased">
      
      {/* Onboarding / Showcase Landing Page */}
      {activeTab === 'onboarding' ? (
        <main className="flex-1 w-full min-w-0 p-0 pb-0">
          <Suspense fallback={<PageSkeleton />}>
            <OnboardingPage 
              onComplete={handleRealRegistrationComplete}
              onSelectDemo={handleSelectDemo}
              onStartDemoTour={() => {
                handleSelectDemo();
                setDemoTourOpen(true);
              }}
            />
          </Suspense>
        </main>
      ) : (
        /* Authenticated View: 2-Column Desktop Shell (Left Sidebar + Right Content Area) */
        <div className="flex min-h-screen w-full paper-canvas">
          {/* Left Sidebar */}
          <Sidebar 
            activeTab={activeTab}
            setActiveTab={changeTab}
            currentShop={currentShop}
            onOpenWholesale={() => setWholesaleModalOpen(true)}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Right Main Area with Ambient Parchment Light */}
          <div className="flex-1 flex flex-col min-w-0 paper-canvas relative">
            {/* Top Navbar */}
            <Navbar 
              activeTab={activeTab} 
              setActiveTab={changeTab} 
              currentShop={currentShop}
              isDemoMode={isDemoMode}
              onReloadDemo={handleReloadDemo}
              onStartDemoTour={() => setDemoTourOpen(true)}
              onSwitchToDemo={handleSelectDemo}
              onSwitchToRegister={handleSwitchToRegister}
              onLogout={handleSwitchToRegister}
              onToggleSidebar={() => setSidebarOpen(prev => !prev)}
              onOpenWholesale={() => setWholesaleModalOpen(true)}
            />

            {/* Main Page Container */}
            <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl xl:max-w-[1440px] mx-auto pb-28 sm:pb-32 lg:pb-12">
              <PageErrorBoundary activeTab={activeTab} onResetTab={() => changeTab('dashboard')}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 15 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -15 }}
                    transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full min-w-0"
                  >
                    <Suspense fallback={<PageSkeleton />}>
                      {activeTab === 'dashboard' && (
                        <DashboardPage
                          shop={currentShop}
                          onOpenKeypad={handleOpenKeypad}
                          onOpenWholesale={() => setWholesaleModalOpen(true)}
                          onNavigateTab={(tab) => changeTab(tab)}
                        />
                      )}

                      {activeTab === 'advisor' && (
                        <AdvisorChatPage
                          shop={currentShop}
                          creditData={creditData}
                          summaryData={summaryData}
                          initialPrompt={initialAdvisorPrompt}
                          onPromptUsed={() => setInitialAdvisorPrompt('')}
                        />
                      )}

                      {activeTab === 'cashflow' && (
                        <CashFlowPage
                          shop={currentShop}
                          isDemoMode={isDemoMode}
                          summaryData={summaryData}
                          onOpenKeypad={handleOpenKeypad}
                          onOpenWholesale={() => setWholesaleModalOpen(true)}
                          onNavigateTab={(tab) => changeTab(tab)}
                          refreshKey={refreshKey}
                          latestTx={latestTx}
                          onTransactionSaved={handleTransactionSaved}
                        />
                      )}

                      {activeTab === 'credit' && (
                        <CreditScorePage
                          shop={currentShop}
                          creditData={creditData}
                          onNavigateTab={(tab) => changeTab(tab)}
                        />
                      )}

                      {activeTab === 'schemes' && (
                        <SchemeMatcherPage
                          shop={currentShop}
                          creditData={creditData}
                          onNavigateTab={(tab) => changeTab(tab)}
                        />
                      )}

                      {activeTab === 'dossier' && (
                        <BankDossierPage
                          shop={currentShop}
                          isDemoMode={isDemoMode}
                          onNavigateTab={(tab) => changeTab(tab)}
                          onBack={() => changeTab('dashboard')}
                        />
                      )}

                      {activeTab === 'profile' && (
                        <ShopProfilePage
                          shop={currentShop}
                          onShopUpdated={(updated) => {
                            setCurrentShop(updated);
                            safeStorage.setJSON('vyapaar_active_shop', updated);
                            setRefreshKey(k => k + 1);
                          }}
                          onReloadDemo={handleReloadDemo}
                        />
                      )}
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </PageErrorBoundary>
            </main>
          </div>
        </div>
      )}

      {/* Floating Setu AI Pop-Up (Minimizes to circle in bottom-right, assists with services & registration) */}
      <FloatingSetuAI 
        currentShop={currentShop}
        onNavigateTab={changeTab}
        onOpenKeypad={handleOpenKeypad}
        onOpenWholesale={() => setWholesaleModalOpen(true)}
        onOpenRegister={() => {
          handleSwitchToRegister();
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('saakhsetu:open-register-modal'));
          }, 150);
        }}
        isDemoTourOpen={demoTourOpen}
      />

      {/* Tactile Touch Numeric Keypad Modal */}
      <NumericKeypadModal
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        onTransactionSaved={handleTransactionSaved}
        shopId={currentShop?.id}
        onOpenVoice={() => setVoiceModalOpen(true)}
        initialType={keypadInitialType}
        initialCategory={keypadInitialCategory}
      />

      {/* Global Voice Bahi-Khata Input Dialog */}
      {voiceModalOpen && (
        <Suspense fallback={null}>
          <VoiceInputDialog
            isOpen={voiceModalOpen}
            onClose={() => setVoiceModalOpen(false)}
            shopId={currentShop?.id}
            onTransactionSaved={handleTransactionSaved}
          />
        </Suspense>
      )}

      {/* ONDC B2B Wholesale Price Discovery Modal */}
      {wholesaleModalOpen && (
        <Suspense fallback={null}>
          <WholesaleDiscoveryModal
            isOpen={wholesaleModalOpen}
            onClose={() => setWholesaleModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Live Interactive Guided Demo Tour */}
      {demoTourOpen && (
        <Suspense fallback={null}>
          <InteractiveDemoTour
            isOpen={demoTourOpen}
            onClose={() => setDemoTourOpen(false)}
            activeTab={activeTab}
            setActiveTab={changeTab}
            setKeypadOpen={setKeypadOpen}
            setInitialAdvisorPrompt={setInitialAdvisorPrompt}
            onReloadDemo={handleReloadDemo}
          />
        </Suspense>
      )}

      {/* Mobile Thumb Action Dock */}
      {currentShop && activeTab !== 'onboarding' && (
        <FloatingThumbDock 
          activeTab={activeTab}
          setActiveTab={changeTab}
          onOpenKeypad={() => setKeypadOpen(true)}
          creditScore={creditData?.totalScore || null}
        />
      )}

      {/* Clean Institutional Prototype Footer (shown on inner tabs; Overview has its own reference footer) */}
      {currentShop && activeTab !== 'onboarding' && activeTab !== 'dashboard' && (
        <footer className="print:hidden border-t border-stone-200/80 bg-[#FAF8F5]/90 backdrop-blur-md py-8 px-4 text-center text-xs text-stone-600 pb-28 sm:pb-24">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-bold text-stone-900 font-serif text-sm">{APP_NAME_HI} ({APP_NAME_EN})</span>
          </div>
          <p className="text-[11px] text-stone-500 max-w-2xl mx-auto leading-relaxed">
            National Micro-Enterprise Credit & Seasonal Demand Radar. Built for Indian micro-enterprises referencing Nayak Committee & RBI Priority Sector Lending norms.
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span className="text-[10px] text-stone-400 font-medium ml-1">Engineered for 63M+ Indian Micro-Enterprises</span>
          </div>
        </div>
      </footer>
      )}

    </div>
  );
}
