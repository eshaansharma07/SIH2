import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, 
  TrendingUp, 
  Sprout, 
  FileText, 
  Users, 
  Smartphone, 
  Lightbulb, 
  ChevronRight, 
  Info, 
  X, 
  Sliders, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Calendar,
  ArrowRight,
  Download,
  Share2,
  Award
} from 'lucide-react';
import { CreditGauge } from '../components/CreditGauge';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { TricolorBrush } from '../components/TricolorBrush';

export function getSchemeTier(score) {
  if (score === null || score === undefined) {
    return {
      tierName: 'Unrated (New Enterprise)',
      tierNameHi: 'अमूल्यांकित (नया उद्यम)',
      scheme: 'PM SVANidhi Starter',
      schemeHi: 'पीएम स्वनिधि स्टार्टर',
      facility: 'Up to ₹10,000 – ₹50,000',
      facilityHi: '₹10,000 से ₹50,000 तक',
      interestRate: 'Subsidized 7% p.a.',
      collateral: '0% Collateral',
      badgeVariant: 'neutral'
    };
  }
  if (score >= 750) {
    return {
      tierName: 'Very Good',
      tierNameHi: 'बहुत अच्छा',
      scheme: 'PM MUDRA Tarun & CGTMSE',
      schemeHi: 'पीएम मुद्रा तरुण एवं CGTMSE',
      facility: '₹5 Lakh – ₹20 Lakh',
      facilityHi: '₹5 लाख – ₹20 लाख',
      interestRate: '8.4% – 9.2% (Lowest Risk Spread)',
      collateral: '100% Collateral-Free (CGTMSE Covered)',
      badgeVariant: 'positive'
    };
  }
  if (score >= 650) {
    return {
      tierName: 'Good',
      tierNameHi: 'अच्छा',
      scheme: 'PM MUDRA Kishor',
      schemeHi: 'पीएम मुद्रा किशोर',
      facility: '₹50,000 – ₹5,00,000',
      facilityHi: '₹50,000 से ₹5,00,000 तक',
      interestRate: '9.5% – 10.5% p.a.',
      collateral: '0% Collateral (Stock Hypothecation)',
      badgeVariant: 'brand'
    };
  }
  if (score >= 550) {
    return {
      tierName: 'Fair',
      tierNameHi: 'सामान्य',
      scheme: 'PM MUDRA Shishu / PM SVANidhi',
      schemeHi: 'पीएम मुद्रा शिशु / पीएम स्वनिधि',
      facility: 'Up to ₹50,000 Working Capital',
      facilityHi: '₹50,000 तक कार्यशील पूंजी',
      interestRate: '10.5% – 11.5% p.a.',
      collateral: '0% Collateral',
      badgeVariant: 'attention'
    };
  }
  return {
    tierName: 'Needs Improvement',
    tierNameHi: 'सुधार आवश्यक',
    scheme: 'PM SVANidhi & Micro-Credit Starter',
    schemeHi: 'पीएम स्वनिधि एवं सूक्ष्म ऋण स्टार्टर',
    facility: '₹10,000 – ₹20,000 Micro-Advance',
    facilityHi: '₹10,000 से ₹20,000 सूक्ष्म अग्रिम',
    interestRate: '7.0% Subsidized',
    collateral: '0% Collateral',
    badgeVariant: 'neutral'
  };
}

export function CreditScorePage({ shop, creditData, onNavigateTab, isDemoMode = false }) {
  const { t, language } = useTranslation();

  // Secondary interaction dialog states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [activeRecommendationPillar, setActiveRecommendationPillar] = useState(null);

  // Score determination: use live creditData, shop foundation, or Ramesh baseline 809
  const isDemo = Boolean(isDemoMode || shop?.is_demo === 1 || shop?.is_demo === true || shop?.id === 'ramesh-kirana');
  const txCount = creditData?.transactionCount ?? creditData?.metrics?.totalTransactions ?? (isDemo ? 120 : (creditData?.metrics?.loggedDays ?? 0));
  const requiredTransactions = creditData?.requiredTransactions || 50;
  const transactionsRemaining = Math.max(0, requiredTransactions - txCount);
  const progressPct = Math.min(100, Math.round((txCount / requiredTransactions) * 100));

  const isUnrated = !isDemo && (creditData?.isUnrated || !creditData?.totalScore || txCount < requiredTransactions);
  const baseScore = isUnrated ? null : (creditData?.totalScore ?? (isDemo ? 809 : null));
  const currentTier = isUnrated ? null : getSchemeTier(baseScore);
  const factors = creditData?.factors || [];

  // Score change compared to last month: calculated dynamically or baseline
  const scoreDelta = isUnrated ? null : (isDemo ? 44 : (creditData?.scoreDelta ?? null));

  // External action listener from Top Navigation Mega-Menu
  useEffect(() => {
    const handleCreditAction = (e) => {
      const action = e.detail?.action;
      if (action === 'simulator') {
        setIsSimulatorModalOpen(true);
      } else if (action === 'pillars') {
        setIsBreakdownModalOpen(true);
      } else if (action === 'insights') {
        setTimeout(() => {
          const el = document.getElementById('credit-insights');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    // Check stored action on mount
    try {
      const pendingAction = sessionStorage.getItem('saakhsetu_credit_action');
      if (pendingAction) {
        sessionStorage.removeItem('saakhsetu_credit_action');
        if (pendingAction === 'simulator') setIsSimulatorModalOpen(true);
        else if (pendingAction === 'pillars') setIsBreakdownModalOpen(true);
        else if (pendingAction === 'insights') {
          setTimeout(() => {
            const el = document.getElementById('credit-insights');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    } catch (_) {}

    window.addEventListener('saakhsetu:credit-action', handleCreditAction);
    return () => window.removeEventListener('saakhsetu:credit-action', handleCreditAction);
  }, []);

  // Simulator State
  const [extraDays, setExtraDays] = useState(30);
  const [recoverUdhaar, setRecoverUdhaar] = useState(4000);
  const [targetUpi, setTargetUpi] = useState(50);
  const [simulatedData, setSimulatedData] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Local instant calculation for smooth 60fps slider drag
  const computeLocalProjection = (days, udhaar, upi) => {
    const startScore = baseScore || (isDemo ? 809 : 615);
    const loggingGain = Math.min(35, Math.round(days * 0.8));
    const udhaarGain = udhaar > 0 ? Math.min(28, Math.round((udhaar / 5000) * 15)) : 0;
    const digitalGain = Math.min(25, Math.round(Math.max(0, upi - (creditData?.metrics?.digitalSharePct || 20)) * 0.6));
    const delta = loggingGain + udhaarGain + digitalGain;
    return {
      projectedScore: Math.min(850, startScore + delta),
      delta
    };
  };

  const localProjection = computeLocalProjection(extraDays, recoverUdhaar, targetUpi);

  // Debounced API simulation call
  useEffect(() => {
    if (!isSimulatorModalOpen || !shop?.id) return;
    const timer = setTimeout(() => {
      runSimulation();
    }, 250);
    return () => clearTimeout(timer);
  }, [extraDays, recoverUdhaar, targetUpi, isSimulatorModalOpen, shop?.id]);

  const runSimulation = async () => {
    if (!shop?.id) return;
    setSimulating(true);
    try {
      const res = await api.simulateCreditScore({
        shopId: shop.id,
        additionalLoggingDays: extraDays,
        udhaarRecoveryAmount: recoverUdhaar,
        targetUpiSharePct: targetUpi
      });
      if (res && res.success) {
        setSimulatedData({
          projectedScore: res.projectedScore,
          delta: res.projectedDelta ?? res.delta ?? 0,
          simulationBreakdown: res.simulationBreakdown,
          advice: res.advice
        });
      }
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setSimulating(false);
    }
  };

  const activeProjectedScore = simulatedData?.projectedScore ?? localProjection.projectedScore ?? (baseScore || (isDemo ? 809 : 615));
  const activeDelta = simulatedData?.delta ?? localProjection.delta ?? (scoreDelta || 15);
  const projectedTier = getSchemeTier(activeProjectedScore);
  const tierUpgraded = currentTier ? (projectedTier.scheme !== currentTier.scheme && activeProjectedScore > (baseScore || 0)) : false;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* 1. CREDIT SCORE COMPACT EDITORIAL HERO SECTION                            */}
      {/* ========================================================================= */}
      <section className="w-full relative rounded-3xl bg-[#FAF7F2] border border-[#EFE9DF] p-6 sm:p-7 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Hero Typography */}
          <div className="lg:col-span-6 space-y-2 z-10">
            <h1 className="font-serif font-black text-3xl sm:text-4xl text-stone-900 tracking-tight leading-none">
              {language === 'hi' ? 'क्रेडिट स्कोर' : 'Credit Score'}
            </h1>

            <p className="font-sans font-bold text-stone-800 text-sm sm:text-base leading-snug">
              {language === 'hi'
                ? 'आज की मेहनत, कल की बड़ी सोच।'
                : 'Aaj ki mehnat, kal ki badi soch.'
              }
            </p>

            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-md">
              {language === 'hi'
                ? 'आपके दैनिक लेन-देन, उधार प्रबंधन और डिजिटल अपनाने के आधार पर आपका व्यापार सेतु क्रेडिट स्कोर तैयार किया जाता है।'
                : 'Your business performance is analysed using your transactions, udhaar management, and digital adoption to create your Vyapaar Setu Credit Score.'
              }
            </p>
          </div>

          {/* Right Visual: Kirana Shopkeeper Illustration + Calligraphic Note */}
          <div className="lg:col-span-6 relative flex items-center justify-end select-none">
            <div className="relative w-full max-w-[530px] rounded-2xl bg-[#FAF7F2] border border-[#EAE3D6] overflow-hidden shadow-2xs">
              <img 
                src="/assets/saakhsetu/credit-score-hero.png" 
                alt="Rural Shopkeeper at Kirana Store" 
                className="w-full h-auto object-contain select-none pointer-events-none"
              />
              {/* Authentic Motivational Calligraphic Strip */}
              <div className="px-4 py-2.5 bg-[#FAF7F2]/95 border-t border-[#EAE3D6] flex items-center justify-between flex-wrap gap-2">
                <span className="font-serif italic font-bold text-xs sm:text-sm text-[#0F3E2E] tracking-wide">
                  "विश्वास से बनता है विकास का रास्ता।"
                </span>
                <TricolorBrush className="w-20 h-2.5 shrink-0" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MAIN CREDIT SCORE + ELIGIBILITY BENTO CARD                             */}
      {/* ========================================================================= */}
      <section className="w-full rounded-3xl border border-stone-200/85 bg-white p-5 sm:p-7 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* LEFT 5 COLS: SCORE GAUGE */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            {/* Header Badge with info button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="font-sans font-bold text-xs sm:text-sm text-stone-900">
                  {language === 'hi' ? 'आपका व्यापार सेतु क्रेडिट स्कोर' : 'Your Vyapaar Setu Credit Score'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBreakdownModalOpen(true)}
                  aria-label="View score details"
                  className="text-stone-400 hover:text-stone-700 transition-colors p-0.5 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Semicircular SVG Arc Gauge with Score inside & 4-Tier Scale Strip */}
            <div className="w-full flex justify-center py-1">
              {isUnrated ? (
                <div className="p-4 space-y-3 border border-dashed border-stone-300 rounded-2xl bg-[#FAF9F6] w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-stone-900">
                          {language === 'hi' ? 'क्रेडिट स्कोर: समीक्षाधीन' : 'Credit Score: Under Audit'}
                        </h4>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {txCount} / {requiredTransactions} {language === 'hi' ? 'लेन-देन' : 'Transactions'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {progressPct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${Math.max(4, progressPct)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {language === 'hi' 
                      ? `क्रेडिट स्कोर और बैंक मूल्यांकन केवल 50 लेन-देन के बाद लागू होते हैं। अनलॉक करने के लिए अभी ${transactionsRemaining} और लेन-देन आवश्यक हैं।` 
                      : `Credit score and bank appraisal unlock only after 50 transactions. ${transactionsRemaining} more transactions needed to unlock.`
                    }
                  </p>

                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('transactions')}
                    className="w-full py-2 px-3 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>{language === 'hi' ? '+ लेन-देन दर्ज करें' : '+ Record Transactions'}</span>
                  </button>
                </div>
              ) : (
                <CreditGauge 
                  score={baseScore || 809} 
                  variant="editorial" 
                  language={language}
                  ratingLabel={language === 'hi' ? currentTier?.tierNameHi : currentTier?.tierName}
                />
              )}
            </div>
          </div>

          {/* CENTER 3 COLS: SCORE CHANGE & GUIDANCE */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-4 lg:border-l lg:border-stone-100 lg:pl-6">
            {/* Score Change Compared to Last Month */}
            <div>
              <div className="flex items-center gap-1.5 text-[#0F3E2E]">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span className="font-serif font-black text-xl sm:text-2xl tracking-tight">
                  {isUnrated 
                    ? (language === 'hi' ? 'समीक्षाधीन' : 'Under Audit')
                    : (scoreDelta !== null ? `+${scoreDelta} points` : 'Building history')
                  }
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {isUnrated 
                  ? (language === 'hi' ? `${txCount}/50 लेन-देन दर्ज (${transactionsRemaining} शेष)` : `${txCount}/50 transactions logged (${transactionsRemaining} remaining)`)
                  : (language === 'hi' ? 'पिछले महीने की तुलना में' : 'compared to last month')
                }
              </p>
            </div>

            {/* Guidance Card */}
            <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Sprout className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-stone-900">
                  {isUnrated 
                    ? (language === 'hi' ? '50 लेन-देन का लक्ष्य' : '50-Transaction Milestone')
                    : (language === 'hi' ? 'आप सही राह पर हैं!' : "You're on the right track!")
                  }
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {isUnrated
                  ? (language === 'hi'
                      ? `स्कोर व ऋण पात्रता अनलॉक करने के लिए रोज के लेन-देन दर्ज करें। अभी ${transactionsRemaining} लेन-देन शेष हैं।`
                      : `Log daily sales and counter expenses to establish your verified credit profile. ${transactionsRemaining} entries remaining.`
                    )
                  : (language === 'hi'
                      ? 'दैनिक लेन-देन नियमित रखें और समय पर उधारी वसूलते रहें।'
                      : 'Keep maintaining regular transactions and timely udhaar recovery.'
                    )
                }
              </p>
            </div>

            {/* View Score History Button */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 text-stone-800 text-xs font-bold btn-tactile flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isUnrated ? (language === 'hi' ? 'सत्यापन स्थिति देखें →' : 'View Audit Status →') : (language === 'hi' ? 'स्कोर का इतिहास देखें →' : 'View Score History →')}</span>
            </button>
          </div>

          {/* RIGHT 4 COLS: LOAN ELIGIBILITY ESTIMATE CARD */}
          <div className="lg:col-span-4 bg-[#FAF7F0] border border-[#EFE8DC] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
            <div>
              {/* Classical Bank Icon */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900 leading-tight">
                    {language === 'hi' ? 'ऋण पात्रता का अनुमान' : 'Loan Eligibility Estimate'}
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    {isUnrated 
                      ? (language === 'hi' ? '50 लेन-देन के बाद पात्रता निर्धारित होगी' : 'Unlocks after 50 verified transactions')
                      : (language === 'hi' ? 'वर्तमान स्कोर और प्रोफाइल पर आधारित (अनुमान)' : 'Based on your current score and profile')
                    }
                  </p>
                </div>
              </div>

              {/* Big Facility Range */}
              <div className="font-serif font-black text-2xl sm:text-3xl text-[#0F3E2E] tracking-tight my-2.5">
                {isUnrated 
                  ? (language === 'hi' ? '50 लेन-देन के बाद अनलॉक होगा' : 'Unlocks after 50 transactions')
                  : (language === 'hi' ? currentTier?.facilityHi : currentTier?.facility)
                }
              </div>

              {/* Government Scheme Pill */}
              <div className="inline-flex items-center gap-1.5 bg-white border border-emerald-300/80 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-2xs max-w-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">
                  {isUnrated 
                    ? (language === 'hi' ? 'सत्यापन आवश्यक (50 लेन-देन)' : 'Audit Milestone: 50 Transactions')
                    : (language === 'hi' ? currentTier?.schemeHi : currentTier?.scheme)
                  }
                </span>
              </div>
            </div>

            {/* Explore Schemes CTA Button */}
            <div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('schemes')}
                className="w-full bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs font-bold py-2.5 px-4 rounded-xl btn-tactile text-center cursor-pointer"
              >
                {language === 'hi' ? 'सरकारी योजनाएं देखें →' : 'Explore Schemes →'}
              </button>
            </div>

            {/* Subtle decorative botanical watermark */}
            <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none text-[#0F3E2E]">
              <Sprout className="w-24 h-24" />
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. WHAT CAN IMPROVE YOUR SCORE? (3 CONCISE RECOMMENDATION CARDS)          */}
      {/* ========================================================================= */}
      <section id="credit-insights" className="w-full space-y-3">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 tracking-tight leading-tight">
                {language === 'hi' ? 'स्कोर कैसे बेहतर करें?' : 'What Can Improve Your Score?'}
              </h2>
              <p className="text-xs text-stone-500">
                {language === 'hi' ? 'मजबूत क्रेडिट प्रोफाइल बनाने के लिए इन क्षेत्रों पर ध्यान दें।' : 'Focus on these areas to build a stronger credit profile.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBreakdownModalOpen(true)}
            className="text-xs font-bold text-[#0F3E2E] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{language === 'hi' ? 'सभी सुझाव देखें' : 'See All Recommendations'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Actionable Recommendations Grid (Strictly NO numeric percentages) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Maintain Regular Transactions */}
          <button
            type="button"
            onClick={() => { setActiveRecommendationPillar('consistency'); setIsBreakdownModalOpen(true); }}
            className="w-full bg-white border border-stone-200/90 rounded-2xl p-4.5 interactive-card text-left flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-xs transition-transform duration-200">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-stone-900 truncate group-hover:text-[#0F3E2E] transition-colors">
                  {language === 'hi' ? 'नियमित लेन-देन दर्ज करें' : 'Maintain Regular Transactions'}
                </h3>
                <p className="text-[11px] text-stone-500 leading-snug mt-0.5 line-clamp-2">
                  {language === 'hi'
                    ? 'लेन-देन इतिहास सुधारने के लिए दैनिक बिक्री और खरीद दर्ज करें।'
                    : 'Record your daily sales and purchases to improve transaction history.'
                  }
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/* Card 2: Recover Pending Udhaar */}
          <button
            type="button"
            onClick={() => { setActiveRecommendationPillar('udhaar'); setIsBreakdownModalOpen(true); }}
            className="w-full bg-white border border-stone-200/90 rounded-2xl p-4.5 interactive-card text-left flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-xs transition-transform duration-200">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-stone-900 truncate group-hover:text-[#0F3E2E] transition-colors">
                  {language === 'hi' ? 'लंबित उधार वसूलें' : 'Recover Pending Udhaar'}
                </h3>
                <p className="text-[11px] text-stone-500 leading-snug mt-0.5 line-clamp-2">
                  {language === 'hi'
                    ? 'अपनी प्रोफाइल मजबूत करने के लिए ग्राहकों से बकाया राशि कम करें।'
                    : 'Reduce outstanding customer dues to strengthen your profile.'
                  }
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/* Card 3: Increase Digital Payments */}
          <button
            type="button"
            onClick={() => { setActiveRecommendationPillar('digital'); setIsBreakdownModalOpen(true); }}
            className="w-full bg-white border border-stone-200/90 rounded-2xl p-4.5 interactive-card text-left flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-xs transition-transform duration-200">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-stone-900 truncate group-hover:text-[#0F3E2E] transition-colors">
                  {language === 'hi' ? 'डिजिटल भुगतान बढ़ाएं' : 'Increase Digital Payments'}
                </h3>
                <p className="text-[11px] text-stone-500 leading-snug mt-0.5 line-clamp-2">
                  {language === 'hi'
                    ? 'स्कोर सुधारने के लिए UPI और डिजिटल लेन-देन को बढ़ावा दें।'
                    : 'Encourage UPI and digital transactions to improve your score.'
                  }
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. STRONGER BUSINESSES, BRIGHTER FUTURES BANNER                           */}
      {/* ========================================================================= */}
      <section className="w-full rounded-2xl bg-[#FAF7F2] border border-[#EFE9DF] p-5 sm:p-6 overflow-hidden relative shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
        
        {/* Left Side: Typography and CTA */}
        <div className="flex items-start gap-4 z-10 max-w-xl">
          <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 text-[#0F3E2E] flex items-center justify-center shrink-0 shadow-2xs">
            <Sprout className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 tracking-tight">
              {language === 'hi' ? 'मजबूत व्यापार, उज्ज्वल भविष्य' : 'Stronger Businesses, Brighter Futures'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {language === 'hi'
                ? 'बेहतर क्रेडिट स्कोर आपके व्यापार के लिए नए अवसर, सरकारी योजनाएं और दीर्घकालिक विकास के द्वार खोलता है।'
                : 'Better credit opens doors to bigger opportunities, government schemes, and long-term growth.'
              }
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="z-10 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab?.('schemes')}
            className="bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs hover:shadow-sm transition-all cursor-pointer"
          >
            {language === 'hi' ? 'योजनाएं देखें →' : 'Explore Schemes →'}
          </button>
        </div>

        {/* Right Side: Rural Village Skyline Line Art Backdrop */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-25 pointer-events-none hidden md:block">
          <img 
            src="/assets/saakhsetu/rural-landscape.png" 
            alt="Rural Village Silhouette" 
            className="h-full w-full object-cover object-right"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. GLOBAL EDITORIAL FOOTER                                                */}
      {/* ========================================================================= */}
      <footer className="w-full pt-8 pb-4 border-t border-stone-200/80 text-xs text-stone-500 select-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-600 font-medium">
            <span>© 2026 Vyapaar Setu</span>
            <span>•</span>
            <span>Bridging Businesses to Credit</span>
            <span>•</span>
            <span className="font-serif italic text-stone-800">Built for Bharat</span>
          </div>

          <div className="flex items-center gap-6 text-stone-500">
            <button 
              type="button" 
              onClick={() => alert('Vyapaar Setu adheres to strict RBI Priority Sector Lending borrower data privacy principles. All merchant records remain confidential.')}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button 
              type="button" 
              onClick={() => alert('Vyapaar Setu MSME Terms: Governed under RBI PSL norms and MSMED Act framework for Indian micro-enterprises.')}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <button 
              type="button" 
              onClick={() => window.open('tel:18008897388', '_self')}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Contact (1800-889-SETU)
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SECONDARY MODAL 1: SCORE HISTORY MODAL                                    */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    {language === 'hi' ? 'क्रेडिट स्कोर इतिहास' : 'Credit Score History'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {language === 'hi' ? 'मासिक प्रगति और ऑडिट रिकॉर्ड' : 'Monthly progress & verified audits'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Delta Highlight */}
            <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {isUnrated ? (language === 'hi' ? 'ऑडिट प्रगति' : 'Audit Progress') : 'Growth Trend'}
                </span>
                <div className="font-serif font-black text-2xl text-[#0F3E2E] mt-0.5">
                  {isUnrated
                    ? `${txCount} / ${requiredTransactions}`
                    : (scoreDelta !== null ? `+${scoreDelta} Points` : 'Initial Audit')
                  }
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  {isUnrated
                    ? (language === 'hi' ? `क्रेडिट स्कोर अनलॉक करने के लिए ${transactionsRemaining} और लेन-देन आवश्यक हैं` : `${transactionsRemaining} more transactions needed to unlock credit rating`)
                    : (language === 'hi' ? 'पिछले 30 दिनों में निरंतर सुधार' : 'Consistent improvement over last 30 days')
                  }
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {isUnrated ? (language === 'hi' ? 'वर्तमान स्थिति' : 'Current Status') : 'Current Score'}
                </span>
                <div className="font-serif font-black text-2xl text-stone-900 mt-0.5">
                  {isUnrated ? (
                    <span className="text-stone-700 text-lg sm:text-xl font-bold">
                      {language === 'hi' ? 'समीक्षाधीन' : 'Under Audit'}
                    </span>
                  ) : (
                    <>
                      {baseScore} <span className="text-xs text-stone-400 font-normal">/ 850</span>
                    </>
                  )}
                </div>
                <span className="inline-block mt-0.5 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {isUnrated 
                    ? (language === 'hi' ? `${progressPct}% पूर्ण` : `${progressPct}% Complete`) 
                    : (language === 'hi' ? currentTier?.tierNameHi : currentTier?.tierName)
                  }
                </span>
              </div>
            </div>

            {/* Monthly Progression Timeline */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-xs text-stone-800 tracking-wide uppercase">
                {isUnrated 
                  ? (language === 'hi' ? 'सत्यापन मील के पत्थर' : 'Verification Milestones')
                  : (language === 'hi' ? 'मासिक ऑडिट रिकॉर्ड' : 'Audit Timeline')
                }
              </h4>

              <div className="space-y-2 text-xs">
                {isUnrated ? (
                  <>
                    {/* Milestone 1: Registration */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                        <div>
                          <span className="font-bold text-stone-900">
                            {language === 'hi' ? 'चरण 1: व्यापारी पंजीकरण' : 'Milestone 1: Merchant Registration'}
                          </span>
                          <span className="text-[10px] text-emerald-700 block font-medium">
                            {language === 'hi' ? 'सफलतापूर्वक सत्यापित एवं सक्रिय' : 'Successfully Verified & Enrolled'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {language === 'hi' ? 'पूर्ण' : 'Completed'}
                      </span>
                    </div>

                    {/* Milestone 2: 50 Transactions */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100 animate-pulse" />
                        <div>
                          <span className="font-bold text-stone-900">
                            {language === 'hi' ? 'चरण 2: 50 बही-खाता लेन-देन' : 'Milestone 2: 50 Ledger Transactions'}
                          </span>
                          <span className="text-[10px] text-stone-600 block">
                            {language === 'hi' 
                              ? `${txCount}/50 प्रविष्टियां दर्ज (${transactionsRemaining} शेष)`
                              : `${txCount}/50 entries recorded (${transactionsRemaining} remaining)`
                            }
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        {progressPct}%
                      </span>
                    </div>

                    {/* Milestone 3: Score & Formal Bank Appraisal */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 opacity-60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                        <div>
                          <span className="font-semibold text-stone-700">
                            {language === 'hi' ? 'चरण 3: साख सेतु क्रेडिट रेटिंग एवं ऋण पात्रता' : 'Milestone 3: Alternative Credit Rating & Loan Eligibility'}
                          </span>
                          <span className="text-[10px] text-stone-500 block">
                            {language === 'hi' ? '50 लेन-देन के बाद स्वतः सक्रिय होगा' : 'Unlocks automatically after 50 transactions'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-md">
                        {language === 'hi' ? 'लॉक्ड' : 'Locked'}
                      </span>
                    </div>
                  </>
                ) : isDemo ? (
                  <>
                    {/* Month 4 (Current) */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                        <div>
                          <span className="font-bold text-stone-900">September 2026 (Current)</span>
                          <span className="text-[10px] text-stone-500 block">100% Khata disciplined, +15 UPI orders</span>
                        </div>
                      </div>
                      <div className="font-serif font-black text-stone-900 text-sm">{baseScore}</div>
                    </div>

                    {/* Month 3 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                        <div>
                          <span className="font-semibold text-stone-800">August 2026</span>
                          <span className="text-[10px] text-stone-500 block">Festive procurement stock surge</span>
                        </div>
                      </div>
                      <div className="font-serif font-black text-stone-700 text-sm">{Math.max(300, baseScore - 44)}</div>
                    </div>

                    {/* Month 2 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                        <div>
                          <span className="font-semibold text-stone-800">July 2026</span>
                          <span className="text-[10px] text-stone-500 block">Monsoon dip resilient management</span>
                        </div>
                      </div>
                      <div className="font-serif font-black text-stone-700 text-sm">{Math.max(300, baseScore - 67)}</div>
                    </div>

                    {/* Month 1 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                        <div>
                          <span className="font-semibold text-stone-800">June 2026 (Initial Baseline)</span>
                          <span className="text-[10px] text-stone-500 block">First 30 days bahi-khata logged</span>
                        </div>
                      </div>
                      <div className="font-serif font-black text-stone-700 text-sm">{Math.max(300, baseScore - 94)}</div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Dynamic Current Audit */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                        <div>
                          <span className="font-bold text-stone-900">Current Ledger Performance</span>
                          <span className="text-[10px] text-stone-500 block">
                            {creditData?.metrics?.loggedDays ? `${creditData.metrics.loggedDays} active logged days recorded` : 'Daily transaction ledger active'}
                          </span>
                        </div>
                      </div>
                      <div className="font-serif font-black text-stone-900 text-sm">{baseScore}</div>
                    </div>

                    {/* Dynamic Onboarding Foundation */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                        <div>
                          <span className="font-semibold text-stone-800">Enterprise Onboarding Baseline</span>
                          <span className="text-[10px] text-stone-500 block">
                            {shop?.vintage_years || 1} yr vintage with {shop?.bank_account_type || 'Commercial Bank'}
                          </span>
                        </div>
                      </div>
                      <div className="font-serif font-black text-stone-700 text-sm">{Math.max(300, baseScore - scoreDelta)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0F3E2E] text-white text-xs font-bold hover:bg-[#165640] transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECONDARY MODAL 2: EVALUATION BREAKDOWN (4 DETAILED PILLARS)              */}
      {/* ========================================================================= */}
      {isBreakdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    {language === 'hi' ? '4 पारदर्शी आधार (Evaluation Pillars)' : '4 Transparent Evaluation Pillars'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {language === 'hi' ? 'बिना सिबिल स्कोर के बैंक ऋण पात्रता की पारदर्शी जांच' : 'Explainable non-CIBIL scoring metrics for Priority Sector Lending'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBreakdownModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Pillars Detailed Grid */}
            <div className="space-y-4">
              {factors.length > 0 ? (
                factors.map((factor) => {
                  const isPositive = factor.status === 'positive' || factor.percentage >= 70;
                  const isSelected = activeRecommendationPillar && factor.id.toLowerCase().includes(activeRecommendationPillar);

                  return (
                    <div 
                      key={factor.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-200' 
                          : 'bg-[#FAF8F5] border-stone-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-stone-900">
                            {language === 'hi' ? factor.nameHindi : factor.name}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                            Weight {factor.weight}
                          </span>
                        </div>
                        <span className="font-serif font-black text-xs text-stone-900 tabular-nums">
                          {factor.score !== null 
                            ? `${factor.score} / ${factor.maxScore} pts (${factor.percentage}%)`
                            : (language === 'hi' ? `समीक्षाधीन (${factor.percentage || 0}% दर्ज)` : `Under Audit (${factor.percentage || 0}% logged)`)
                          }
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-600 leading-relaxed mb-2.5">
                        {language === 'hi' ? factor.explanationHindi : factor.explanation}
                      </p>

                      {/* Progress bar */}
                      <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-emerald-600' : 'bg-amber-500'}`} 
                          style={{ width: `${factor.percentage}%` }}
                        />
                      </div>

                      {/* Sub-factors */}
                      {factor.subFactors && factor.subFactors.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-stone-200/60">
                          {factor.subFactors.map((sub, sIdx) => (
                            <div key={sIdx} className="flex justify-between items-center text-[10px] text-stone-600 bg-white/80 border border-stone-200/50 px-2.5 py-1 rounded-lg">
                              <span className="font-medium truncate">• {sub.name}</span>
                              <span className="font-bold tabular-nums shrink-0 ml-1">
                                {sub.score !== null ? `${sub.score}/${sub.maxScore}` : (language === 'hi' ? 'समीक्षाधीन' : 'Locked')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="space-y-3">
                  {/* Dynamic fallback pillars representing transparent scoring */}
                  <div className="p-4 rounded-2xl border bg-[#FAF8F5] border-stone-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-stone-900">Cash Flow & Logging Regularity (दैनिक बही-खाता नियमितता)</span>
                      <span className="font-serif font-black text-xs text-stone-900">
                        {isUnrated ? (language === 'hi' ? 'समीक्षाधीन (50 लेन-देन आवश्यक)' : 'Under Audit (50 txs required)') : (isDemo ? '210 / 255 pts (82%)' : '150 / 255 pts (59%)')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                      {isUnrated
                        ? (language === 'hi' ? `वर्तमान में ${txCount}/50 लेन-देन दर्ज हैं। रेटिंग अनलॉक करने के लिए ${transactionsRemaining} और लेन-देन दर्ज करें।` : `Currently ${txCount}/50 transactions logged. Log ${transactionsRemaining} more to unlock formal rating.`)
                        : (isDemo 
                          ? 'Logged 118 active transaction days with a healthy net cash surplus of ₹68,657.'
                          : `Active transaction tracking configured for ${shop?.name || 'your enterprise'}. Log transactions daily to compound score.`
                        )
                      }
                    </p>
                    <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: isUnrated ? `${progressPct}%` : (isDemo ? '82%' : '59%') }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border bg-[#FAF8F5] border-stone-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-stone-900">Revenue Stability & Turnover (बिक्री स्थिरता एवं मासिक आय)</span>
                      <span className="font-serif font-black text-xs text-stone-900">
                        {isUnrated ? (language === 'hi' ? 'समीक्षाधीन' : 'Under Audit') : (isDemo ? '135 / 212 pts (64%)' : '130 / 212 pts (61%)')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                      {isUnrated
                        ? (language === 'hi' ? 'बिक्री स्थिरता और राजस्व गति का मूल्यांकन 50 लेन-देन के बाद किया जाएगा।' : 'Turnover stability and revenue momentum will be appraised after 50 transactions.')
                        : (isDemo 
                          ? 'Recorded cumulative sales with resilient seasonal management through monsoon.'
                          : `Baseline turnover profile established for ${shop?.trade_type || shop?.trade_name || 'enterprise'}.`
                        )
                      }
                    </p>
                    <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: isUnrated ? `${progressPct}%` : (isDemo ? '64%' : '61%') }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border bg-[#FAF8F5] border-stone-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-stone-900">Working Capital & Udhaar Discipline (उधार वसूली एवं पूंजी अनुशासन)</span>
                      <span className="font-serif font-black text-xs text-stone-900">
                        {isUnrated ? (language === 'hi' ? 'समीक्षाधीन' : 'Under Audit') : (isDemo ? '175 / 213 pts (82%)' : '185 / 213 pts (87%)')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                      {isUnrated
                        ? (language === 'hi' ? 'उधार वसूली चक्र और डिजिटल अनुपात का विश्लेषण 50 लेन-देन के बाद सक्रिय होगा।' : 'Udhaar recovery cycles and digital adoption will be analyzed after 50 transactions.')
                        : (isDemo 
                          ? 'Customer udhaar collected within 18 days average settlement cycle.'
                          : 'Clean credit discipline with zero overdue credit dues.'
                        )
                      }
                    </p>
                    <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: isUnrated ? `${progressPct}%` : (isDemo ? '82%' : '87%') }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border bg-[#FAF8F5] border-stone-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-stone-900">Business Vintage & Banking Linkage (व्यापार अनुभव एवं बैंकिंग संबंध)</span>
                      <span className="font-serif font-black text-xs text-stone-900">
                        {isUnrated ? (language === 'hi' ? 'समीक्षाधीन' : 'Under Audit') : (isDemo ? '150 / 170 pts (88%)' : '125 / 170 pts (74%)')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                      {isUnrated
                        ? (language === 'hi' ? 'व्यापार अवधि एवं बैंक लिंकेज सत्यापन 50 लेन-देन के बाद औपचारिक रूप से दर्ज होगा।' : 'Business vintage and banking linkage will be formally appraised after 50 transactions.')
                        : (isDemo 
                          ? '4 years verified operating vintage at same village location with Aryavart Gramin Bank linkage.'
                          : `${shop?.vintage_years || 1} year(s) operating history with ${shop?.bank_account_type || 'State Bank of India'} linkage.`
                        )
                      }
                    </p>
                    <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: isUnrated ? `${progressPct}%` : (isDemo ? '88%' : '74%') }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Score Simulator CTA Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => { setIsBreakdownModalOpen(false); setIsSimulatorModalOpen(true); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'स्कोर सिमुलेटर खोलें →' : 'Explore Score Simulator →'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBreakdownModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                {language === 'hi' ? 'बंद करें' : 'Done'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECONDARY MODAL 3: INTERACTIVE WHAT-IF SIMULATOR                          */}
      {/* ========================================================================= */}
      {isSimulatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    {language === 'hi' ? 'स्कोर सिमुलेटर (What-If Simulator)' : 'Interactive Score Simulator'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {language === 'hi' ? 'कार्यों को बदलकर देखें कि स्कोर और ऋण पात्रता कितनी बढ़ेगी' : 'Adjust actions to project score enhancement and loan eligibility'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatorModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Projected Score Metric Callout */}
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Projected Score</span>
                <div className="font-serif font-black text-2xl text-[#0F3E2E] mt-0.5">
                  {activeProjectedScore} <span className="text-xs text-stone-400 font-normal">/ 850</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Projected Boost</span>
                <div className="text-base font-black text-emerald-700 mt-0.5">
                  +{activeDelta} points
                </div>
              </div>
            </div>

            {/* 3 Interactive Sliders */}
            <div className="space-y-4">
              
              {/* Slider 1: Daily Bahi-Khata Logging */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-stone-800">
                    {language === 'hi' ? 'दैनिक बही-खाता नियमितता' : 'Daily Bahi-Khata Logging'}
                  </span>
                  <span className="text-[#0F3E2E] font-extrabold tabular-nums">+{extraDays} Days</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="60" 
                  step="5"
                  value={extraDays}
                  onChange={(e) => setExtraDays(Number(e.target.value))}
                  className="w-full h-6 accent-[#0F3E2E] cursor-pointer"
                />
                <p className="text-[10px] text-stone-400">Regular evening logging verifies strong cash discipline.</p>
              </div>

              {/* Slider 2: Udhaar Recovery Target */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-stone-800">
                    {language === 'hi' ? 'उधार वसूली लक्ष्य' : 'Udhaar Recovery Target'}
                  </span>
                  <span className="text-emerald-700 font-extrabold tabular-nums">₹{recoverUdhaar.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="500"
                  value={recoverUdhaar}
                  onChange={(e) => setRecoverUdhaar(Number(e.target.value))}
                  className="w-full h-6 accent-emerald-600 cursor-pointer"
                />
                <p className="text-[10px] text-stone-400">Recovering pending credit accelerates working capital velocity.</p>
              </div>

              {/* Slider 3: UPI Digital Payments */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-stone-800">
                    {language === 'hi' ? 'UPI डिजिटल बिक्री शेयर' : 'UPI Digital Sales Share'}
                  </span>
                  <span className="text-amber-700 font-extrabold tabular-nums">{targetUpi}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="90" 
                  step="5"
                  value={targetUpi}
                  onChange={(e) => setTargetUpi(Number(e.target.value))}
                  className="w-full h-6 accent-amber-600 cursor-pointer"
                />
                <p className="text-[10px] text-stone-400">Digital footprint deepening is heavily weighted in PSL norms.</p>
              </div>

            </div>

            {/* Scheme Tier Unlock Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              tierUpgraded ? 'bg-emerald-50 border-emerald-300' : 'bg-[#FAF8F5] border-stone-200'
            }`}>
              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-stone-900 block">
                  {tierUpgraded ? 'Higher Loan Tier Unlocked!' : 'Credit Standing Deepened'}
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
                  {language === 'hi'
                    ? `सिम्युलेटेड कार्यों से स्कोर बढ़कर ${activeProjectedScore}/850 हो जाएगा, जिससे आपकी दुकान '${projectedTier.schemeHi}' (${projectedTier.facilityHi}) के लिए योग्य बन जाती है।`
                    : `Simulated actions raise score to ${activeProjectedScore}/850 (+${activeDelta} pts), qualifying for ${projectedTier.scheme} (${projectedTier.facility}) with collateral-free terms.`
                  }
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSimulatorModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0F3E2E] text-white text-xs font-bold hover:bg-[#165640] transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'पूर्ण करें' : 'Done'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CreditScorePage;
