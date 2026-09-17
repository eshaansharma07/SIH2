import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { NumericKeypadModal } from './components/NumericKeypadModal';
import { FloatingThumbDock } from './components/FloatingThumbDock';
import { WarliBorder } from './components/WarliMotif';
import { api } from './utils/api';
import { useTranslation } from './i18n/LanguageContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { APP_NAME_EN, APP_NAME_HI, APP_TAGLINE_HI } from './config/brand';

// Lazy-loaded pages for reduced initial bundle and sub-second reloads
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdvisorChatPage = lazy(() => import('./pages/AdvisorChatPage').then(m => ({ default: m.AdvisorChatPage })));
const CashFlowPage = lazy(() => import('./pages/CashFlowPage').then(m => ({ default: m.CashFlowPage })));
const CreditScorePage = lazy(() => import('./pages/CreditScorePage').then(m => ({ default: m.CreditScorePage })));
const SchemeMatcherPage = lazy(() => import('./pages/SchemeMatcherPage').then(m => ({ default: m.SchemeMatcherPage })));
const BankDossierPage = lazy(() => import('./pages/BankDossierPage').then(m => ({ default: m.BankDossierPage })));
const ShopProfilePage = lazy(() => import('./pages/ShopProfilePage').then(m => ({ default: m.ShopProfilePage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const PublicPayPage = lazy(() => import('./pages/PublicPayPage').then(m => ({ default: m.PublicPayPage })));
const VoiceInputDialog = lazy(() => import('./components/VoiceInputDialog').then(m => ({ default: m.VoiceInputDialog })));
const InteractiveDemoTour = lazy(() => import('./components/InteractiveDemoTour').then(m => ({ default: m.InteractiveDemoTour })));
const WholesaleDiscoveryModal = lazy(() => import('./components/WholesaleDiscoveryModal').then(m => ({ default: m.WholesaleDiscoveryModal })));

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

  // Read persisted state from localStorage
  const savedShopId = localStorage.getItem('vyapaar_active_shop_id') || null;
  const savedShopJson = localStorage.getItem('vyapaar_active_shop');
  let initialShop = null;
  try {
    if (savedShopJson) initialShop = JSON.parse(savedShopJson);
  } catch (_) {}

  const savedIsDemoStr = localStorage.getItem('vyapaar_is_demo_mode');
  const savedIsDemo = savedIsDemoStr === 'true';

  const savedTab = localStorage.getItem('vyapaar_active_tab');
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
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [wholesaleModalOpen, setWholesaleModalOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);
  const [initialAdvisorPrompt, setInitialAdvisorPrompt] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [latestTx, setLatestTx] = useState(null);

  const changeTab = (tab) => {
    setActiveTab(tab);
    if (tab && tab !== 'onboarding') {
      localStorage.setItem('vyapaar_active_tab', tab);
    }
  };

  useEffect(() => {
    loadAllShopData();

    const handleSyncDone = () => {
      const activeShopId = localStorage.getItem('vyapaar_active_shop_id');
      if (activeShopId) {
        fetchFinancials(activeShopId);
        setRefreshKey(k => k + 1);
      }
    };
    window.addEventListener('vyapaar:sync-completed', handleSyncDone);
    return () => window.removeEventListener('vyapaar:sync-completed', handleSyncDone);
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
      const activeShopId = localStorage.getItem('vyapaar_active_shop_id');
      const cachedJson = localStorage.getItem('vyapaar_active_shop');
      let cachedShop = null;
      if (cachedJson) {
        try { cachedShop = JSON.parse(cachedJson); } catch (_) {}
      }

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
          localStorage.setItem('vyapaar_active_shop', JSON.stringify(shopRes.shop));
          setIsDemoMode(shopRes.shop.is_demo === 1);
          localStorage.setItem('vyapaar_is_demo_mode', shopRes.shop.is_demo === 1 ? 'true' : 'false');
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
      const activeId = currentShop?.id || localStorage.getItem('vyapaar_active_shop_id');
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
    // 1. Instantly update local state and localStorage so user transitions immediately (0ms UI latency)
    localStorage.setItem('vyapaar_active_shop_id', 'ramesh-kirana');
    localStorage.setItem('vyapaar_active_shop', JSON.stringify(demoShopDefault));
    localStorage.setItem('vyapaar_is_demo_mode', 'true');
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
      localStorage.setItem('vyapaar_active_shop', JSON.stringify(demoShop));
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
      const raw = localStorage.getItem('vyapaar_saved_shops');
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      list = list.filter(s => s.id !== shop.id);
      list.unshift(shop);
      list = list.slice(0, 6);
      localStorage.setItem('vyapaar_saved_shops', JSON.stringify(list));
    } catch (_) {}
  };

  // Real Registration / Login Complete
  const handleRealRegistrationComplete = (newShop) => {
    if (newShop?.id) {
      localStorage.setItem('vyapaar_active_shop_id', newShop.id);
      localStorage.setItem('vyapaar_active_shop', JSON.stringify(newShop));
      localStorage.setItem('vyapaar_is_demo_mode', newShop.is_demo === 1 ? 'true' : 'false');
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
    localStorage.removeItem('vyapaar_active_shop_id');
    localStorage.removeItem('vyapaar_active_shop');
    localStorage.removeItem('vyapaar_is_demo_mode');
    localStorage.removeItem('vyapaar_active_tab');
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
      localStorage.setItem('vyapaar_active_shop_id', 'ramesh-kirana');
      localStorage.setItem('vyapaar_active_shop', JSON.stringify(demoShop));
      localStorage.setItem('vyapaar_is_demo_mode', 'true');
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
      <div className="min-h-screen bg-paper-50 flex flex-col items-center justify-center p-6 text-ledgerInk font-sans">
        <div className="w-10 h-10 border-3 border-ochre-200 border-t-turmeric rounded-full animate-spin mb-4" />
        <span className="font-serif text-xl font-bold tracking-tight text-ledgerInk">{APP_NAME_HI} ({APP_NAME_EN})</span>
        <span className="text-xs text-ledgerInk/65 mt-1 font-medium">{APP_TAGLINE_HI}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden relative paper-canvas flex flex-col font-sans text-ledgerInk selection:bg-turmeric-100 selection:text-ledgerInk antialiased">
      
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
      />

      {/* Main Page Container */}
      <main className={`flex-1 w-full min-w-0 ${activeTab === 'onboarding' ? 'p-0 pb-16 sm:pb-24' : 'max-w-7xl xl:max-w-[1440px] mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-28 sm:pb-32 lg:pb-10'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-w-0"
          >
            <Suspense fallback={<PageSkeleton />}>
              {activeTab === 'onboarding' && (
                <OnboardingPage 
                  onComplete={handleRealRegistrationComplete}
                  onSelectDemo={handleSelectDemo}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardPage
                  shop={currentShop}
                  creditData={creditData}
                  summaryData={summaryData}
                  cuesData={cuesData}
                  onOpenKeypad={() => setKeypadOpen(true)}
                  onOpenWholesale={() => setWholesaleModalOpen(true)}
                  onNavigateTab={(tab) => changeTab(tab)}
                  onAskPrompt={handleAskPrompt}
                  onStartDemoTour={() => setDemoTourOpen(true)}
                  isDemoMode={isDemoMode}
                  onSwitchToDemo={handleSelectDemo}
                  onSwitchToRegister={handleSwitchToRegister}
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
                  onOpenKeypad={() => setKeypadOpen(true)}
                  onOpenWholesale={() => setWholesaleModalOpen(true)}
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
                  onBack={() => changeTab('dashboard')}
                />
              )}

              {activeTab === 'profile' && (
                <ShopProfilePage
                  shop={currentShop}
                  onShopUpdated={(updated) => {
                    setCurrentShop(updated);
                    localStorage.setItem('vyapaar_active_shop', JSON.stringify(updated));
                    setRefreshKey(k => k + 1);
                  }}
                  onReloadDemo={handleReloadDemo}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Tactile Touch Numeric Keypad Modal */}
      <NumericKeypadModal
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        onTransactionSaved={handleTransactionSaved}
        shopId={currentShop?.id}
        onOpenVoice={() => setVoiceModalOpen(true)}
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

      {/* Interactive Animated Guided Demo Tour for SIH Judges */}
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

      {/* Rural Footer (SIH 2026 Prototype) */}
      <footer className="print:hidden border-t border-ochre-200/80 bg-paper/90 backdrop-blur-md py-7 px-4 text-center text-xs text-ledgerInk/75 pb-28 sm:pb-24">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-bold text-ledgerInk font-serif text-sm">{APP_NAME_HI} ({APP_NAME_EN}) — Prototype</span>
            <span className="text-ochre-400">•</span>
            <span className="text-[10px] bg-ledgerInk text-paper font-bold px-2.5 py-0.5 rounded-full">
              DPI-Inspired Architecture (Prototype)
            </span>
            <span className="text-ochre-400">•</span>
            <span className="text-[10px] bg-forestRural-50 text-forestRural-800 font-bold px-2 py-0.5 rounded-full border border-forestRural-200">
              PSL-Format Aligned (Demo)
            </span>
          </div>
          <p className="text-[11px] text-ledgerInk/65 max-w-2xl mx-auto leading-relaxed">
            National Micro-Enterprise Credit & Seasonal Advisory Engine. A prototype built for Smart India Hackathon 2026, referencing RBI's Priority Sector Lending (PSL) documentation format. Not an official government service.
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-marginRule" />
            <span className="w-1.5 h-1.5 rounded-full bg-ochre-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-forestRural-600" />
            <span className="text-[10px] text-ledgerInk/55 font-semibold ml-1">Built for 65M+ Indian Micro-Entrepreneurs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
