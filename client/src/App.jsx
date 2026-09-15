import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { AdvisorChatPage } from './pages/AdvisorChatPage';
import { CashFlowPage } from './pages/CashFlowPage';
import { CreditScorePage } from './pages/CreditScorePage';
import { SchemeMatcherPage } from './pages/SchemeMatcherPage';
import { BankDossierPage } from './pages/BankDossierPage';
import { ShopProfilePage } from './pages/ShopProfilePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { NumericKeypadModal } from './components/NumericKeypadModal';
import { InteractiveDemoTour } from './components/InteractiveDemoTour';
import { FloatingThumbDock } from './components/FloatingThumbDock';
import { WarliBorder } from './components/WarliMotif';
import { api } from './utils/api';
import { useTranslation } from './i18n/LanguageContext';

export default function App() {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentShop, setCurrentShop] = useState(null);
  const [creditData, setCreditData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [cuesData, setCuesData] = useState(null);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);
  const [initialAdvisorPrompt, setInitialAdvisorPrompt] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [latestTx, setLatestTx] = useState(null);

  useEffect(() => {
    loadAllShopData();
  }, [refreshKey]);

  const loadAllShopData = async () => {
    try {
      const shopRes = await api.getShopCurrent('ramesh-kirana');
      if (shopRes.shop) {
        setCurrentShop(shopRes.shop);
        
        // Fetch financial data in parallel
        const [credRes, sumRes, cuesRes] = await Promise.all([
          api.getCreditScore(shopRes.shop.id),
          api.getTransactionSummary(shopRes.shop.id),
          api.getSeasonalCues(shopRes.shop.id)
        ]);

        if (credRes.success) setCreditData(credRes);
        if (sumRes.success) {
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
        if (cuesRes.success) setCuesData(cuesRes.data);
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
          digitalSharePct: newDigitalShare
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
    }

    setRefreshKey(prev => prev + 1);
  };

  const handleReloadDemo = async () => {
    try {
      await api.resetDemoShop();
      setRefreshKey(prev => prev + 1);
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskPrompt = (promptText) => {
    setInitialAdvisorPrompt(promptText);
    setActiveTab('advisor');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-700 font-sans">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <span className="font-display text-lg font-black tracking-tight text-slate-900">व्यापार साथी (Vyapaar Saathi)</span>
        <span className="text-xs text-slate-400 mt-1 font-medium">ग्रामीण बही-खाता एवं सलाहकार इंजन लोड हो रहा है...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen sovereign-mesh flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 antialiased">
      
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentShop={currentShop}
        onReloadDemo={handleReloadDemo}
        onStartDemoTour={() => setDemoTourOpen(true)}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 lg:pb-10">
        
        {activeTab === 'onboarding' && (
          <OnboardingPage 
            onComplete={(shop) => {
              setCurrentShop(shop);
              setRefreshKey(k => k + 1);
              setActiveTab('dashboard');
            }}
            onSelectDemo={handleReloadDemo}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            shop={currentShop}
            creditData={creditData}
            summaryData={summaryData}
            cuesData={cuesData}
            onOpenKeypad={() => setKeypadOpen(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onAskPrompt={handleAskPrompt}
            onStartDemoTour={() => setDemoTourOpen(true)}
          />
        )}

        {activeTab === 'advisor' && (
          <AdvisorChatPage
            shop={currentShop}
            initialPrompt={initialAdvisorPrompt}
            onPromptUsed={() => setInitialAdvisorPrompt('')}
          />
        )}

        {activeTab === 'cashflow' && (
          <CashFlowPage
            shop={currentShop}
            onOpenKeypad={() => setKeypadOpen(true)}
            refreshKey={refreshKey}
            latestTx={latestTx}
            onTransactionSaved={handleTransactionSaved}
          />
        )}

        {activeTab === 'credit' && (
          <CreditScorePage
            shop={currentShop}
            creditData={creditData}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'schemes' && (
          <SchemeMatcherPage
            shop={currentShop}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'dossier' && (
          <BankDossierPage
            shop={currentShop}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'profile' && (
          <ShopProfilePage
            shop={currentShop}
            onShopUpdated={(updated) => {
              setCurrentShop(updated);
              setRefreshKey(k => k + 1);
            }}
            onReloadDemo={handleReloadDemo}
          />
        )}

      </main>

      {/* Tactile Touch Numeric Keypad Modal */}
      <NumericKeypadModal
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        onTransactionSaved={handleTransactionSaved}
        shopId={currentShop?.id || 'ramesh-kirana'}
      />

      {/* Interactive Animated Guided Demo Tour for SIH Judges */}
      <InteractiveDemoTour
        isOpen={demoTourOpen}
        onClose={() => setDemoTourOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setKeypadOpen={setKeypadOpen}
        setInitialAdvisorPrompt={setInitialAdvisorPrompt}
        onReloadDemo={handleReloadDemo}
      />

      {/* Samsung OneUI Thumb-Zone Floating Action Dock */}
      <FloatingThumbDock 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenKeypad={() => setKeypadOpen(true)}
        creditScore={creditData?.totalScore || 755}
      />

      {/* Sovereign DPI Footer */}
      <footer className="print:hidden border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-7 px-4 text-center text-xs text-slate-500 pb-28 sm:pb-24">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-black text-slate-900 font-display text-sm">भारत सरकार • व्यापार साथी (Vyapaar Saathi)</span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] bg-slate-900 text-white font-bold px-2.5 py-0.5 rounded-full">
              DPI INDIA STACK
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              RBI PSL Compliant
            </span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
            National Micro-Enterprise Credit & Seasonal Advisory Engine. Designed under the Ministry of MSME and Reserve Bank of India Priority Sector Lending (PSL) Framework.
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-chakra-500" />
            <span className="text-[10px] text-slate-400 font-semibold ml-1">Built for 65M+ Indian Micro-Entrepreneurs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
