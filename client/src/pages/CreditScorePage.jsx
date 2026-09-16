import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  Award,
  CreditCard
} from 'lucide-react';
import { CreditGauge } from '../components/CreditGauge';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, SectionHeader, Button } from '../components/ui';
import { AudioReadAloudButton } from '../components/AudioReadAloudButton';

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
      tierName: 'Prime PSL Tier-1 (Super Prime)',
      tierNameHi: 'प्राइम पीएसएल टियर-1 (अति-उत्कृष्ट)',
      scheme: 'PM MUDRA Tarun & CGTMSE Guarantee',
      schemeHi: 'पीएम मुद्रा तरुण एवं CGTMSE गारंटी',
      facility: '₹5 Lakh to ₹20 Lakh (Union Budget 2024 Revised)',
      facilityHi: '₹5 लाख से ₹20 लाख (बजट 2024 संशोधित)',
      interestRate: '8.4% – 9.2% (Lowest Risk Spread)',
      collateral: '100% Collateral-Free (CGTMSE Covered)',
      badgeVariant: 'positive'
    };
  }
  if (score >= 650) {
    return {
      tierName: 'Good Quality Micro-Enterprise',
      tierNameHi: 'उत्कृष्ट सूक्ष्म उद्यम (गुड क्वालिटी)',
      scheme: 'PM MUDRA Kishor',
      schemeHi: 'पीएम मुद्रा किशोर',
      facility: '₹50,000 to ₹5,00,000',
      facilityHi: '₹50,000 से ₹5,00,000 तक',
      interestRate: '9.5% – 10.5% p.a.',
      collateral: '0% Collateral (Stock Hypothecation)',
      badgeVariant: 'brand'
    };
  }
  if (score >= 550) {
    return {
      tierName: 'Moderate Credit Standing',
      tierNameHi: 'मध्यम क्रेडिट श्रेणी',
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
    tierName: 'Emerging Credit File',
    tierNameHi: 'उभरती हुई क्रेडिट फ़ाइल',
    scheme: 'PM SVANidhi & Micro-Credit Starter',
    schemeHi: 'पीएम स्वनिधि एवं सूक्ष्म ऋण स्टार्टर',
    facility: '₹10,000 – ₹20,000 Micro-Advance',
    facilityHi: '₹10,000 से ₹20,000 सूक्ष्म अग्रिम',
    interestRate: '7.0% Subsidized',
    collateral: '0% Collateral',
    badgeVariant: 'neutral'
  };
}

export function CreditScorePage({ shop, creditData, onNavigateTab }) {
  const { t, language } = useTranslation();
  
  // Simulator State
  const [extraDays, setExtraDays] = useState(30);
  const [recoverUdhaar, setRecoverUdhaar] = useState(4000);
  const [targetUpi, setTargetUpi] = useState(50);
  const [simulatedData, setSimulatedData] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const baseScore = creditData?.totalScore ?? null;

  // Instant local calculation so gauge dial moves immediately (60fps) upon slider drag
  const computeLocalProjection = (days, udhaar, upi) => {
    if (baseScore === null) return { projectedScore: null, delta: 0 };
    const loggingGain = Math.min(35, Math.round(days * 0.8));
    const udhaarGain = udhaar > 0 ? Math.min(28, Math.round((udhaar / 5000) * 15)) : 0;
    const digitalGain = Math.min(25, Math.round(Math.max(0, upi - (creditData?.metrics?.digitalSharePct || 20)) * 0.6));
    const delta = loggingGain + udhaarGain + digitalGain;
    return {
      projectedScore: Math.min(850, baseScore + delta),
      delta
    };
  };

  const localProjection = computeLocalProjection(extraDays, recoverUdhaar, targetUpi);

  // Debounce API simulation call by 200ms to avoid flooding backend during rapid slider drag
  useEffect(() => {
    if (baseScore === null || !shop?.id) return;
    const timer = setTimeout(() => {
      runSimulation();
    }, 200);
    return () => clearTimeout(timer);
  }, [extraDays, recoverUdhaar, targetUpi, baseScore, shop?.id]);

  const runSimulation = async () => {
    if (!shop?.id || baseScore === null) return;
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

  const activeProjectedScore = simulatedData?.projectedScore ?? localProjection.projectedScore ?? baseScore;
  const activeDelta = simulatedData?.delta ?? localProjection.delta ?? 0;
  const currentTier = getSchemeTier(baseScore);
  const projectedTier = getSchemeTier(activeProjectedScore);
  const tierUpgraded = baseScore !== null && projectedTier.scheme !== currentTier.scheme && activeProjectedScore > (baseScore || 0);

  const factors = creditData?.factors || [];
  const udyamNumber = shop?.udyam_number || (shop?.id ? `UDYAM-${(shop.state || 'IN').substring(0, 2).toUpperCase()}-0092478` : 'UDYAM-DEMO');

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner with Warli Border */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-indigoRural-900 font-display">
                {language === 'hi' ? 'वैकल्पिक क्रेडिट स्वास्थ्य' : 'Alternative Credit Health'}
              </h1>
              <Badge variant="positive" size="sm" dot>
                4-Pillar Non-CIBIL
              </Badge>
            </div>
            <p className="text-xs text-indigoRural-500 mt-1">
              {language === 'hi' ? 'बिना सिबिल स्कोर के बैंक ऋण पात्रता की पारदर्शी जांच' : 'Explainable, non-CIBIL alternative underwriting engine for Priority Sector Lending'}
            </p>
          </div>

          <Button
            onClick={() => onNavigateTab('dossier')}
            variant="dark"
            size="lg"
            icon={FileText}
            className="self-start sm:self-auto"
          >
            <span>{language === 'hi' ? 'बैंक फाइल डाउनलोड करें' : 'Generate Bank Dossier'}</span>
          </Button>
        </div>

        <WarliBorder className="w-full h-6 text-terracotta-400 opacity-60" />
      </div>

      {/* 2. Top Row: Merchant Micro-Credit Pass + Health Dial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Physical Saathi Micro-Credit Pass (7 Cols) */}
        <div className="lg:col-span-7 saathi-pass text-white p-7 sm:p-8 flex flex-col justify-between min-h-[240px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Vector Micro Chip */}
              <div className="w-7 h-5 rounded-md bg-gradient-to-tr from-ochre-300 to-ochre-500 border border-ochre-200/60 shadow-xs flex items-center justify-center">
                <div className="w-4 h-3 border border-ochre-900/40 rounded-xs" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-paper-300">
                Digital MSME Enterprise Pass (Demo)
              </span>
            </div>
            <span className="text-[10px] font-mono text-forestRural-300 font-bold bg-forestRural-900/80 px-2.5 py-0.5 rounded-full border border-forestRural-500/40">
              {udyamNumber}
            </span>
          </div>

          <div className="space-y-1 py-5">
            <div className="text-[11px] text-terracotta-300 font-bold uppercase tracking-wider">Verified Enterprise</div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
              {shop?.name || (language === 'hi' ? 'मेरी दुकान' : 'My Store')}
            </div>
            <div className="text-xs text-paper-200 font-medium">
              {shop?.owner_name || (language === 'hi' ? 'दुकानदार' : 'Proprietor')} (Proprietor) • {shop?.village || '—'}, {shop?.district || '—'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/15 text-xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-paper-400 block text-[10px] uppercase font-bold">Alternative Score</span>
                {baseScore !== null && (
                  <AudioReadAloudButton
                    size="sm"
                    className="!bg-white/15 !border-white/20 !text-white"
                    textHi={`आपकी दुकान का क्रेडिट स्कोर: ${baseScore} अंक है, 850 में से। बैंक ऋण पात्रता उत्तम है।`}
                    textEn={`Store credit score: ${baseScore} out of 850. Loan eligibility is strong.`}
                  />
                )}
              </div>
              <span className="text-2xl font-black text-white tabular-nums font-display">
                {baseScore !== null ? baseScore : '—'} <span className="text-xs text-paper-300 font-normal">/ 850</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-paper-400 block text-[10px] uppercase font-bold">Recommended Facility</span>
              <span className="text-sm font-extrabold text-forestRural-300">
                {language === 'hi' ? currentTier.schemeHi : currentTier.scheme}
              </span>
            </div>
          </div>
        </div>

        {/* Dial Card (5 Cols) */}
        <Card padding="lg" className="lg:col-span-5 flex flex-col items-center justify-center">
          {creditData?.isUnrated || baseScore === null ? (
            <div className="text-center p-4 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-ochre-100 border border-ochre-300 flex items-center justify-center text-ochre-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-base text-indigoRural-900">
                {language === 'hi' ? 'क्रेडिट स्कोर अभी अवर्गीकृत है' : 'Credit Score Unrated'}
              </h3>
              <p className="text-xs text-indigoRural-600 max-w-xs mx-auto leading-relaxed">
                {creditData?.message || (language === 'hi' 
                  ? 'व्यापार साथी पर अपना पहला हफ्ता पूरा करें (न्यूनतम 5 बिक्री और 3 दिन) ताकि 4-पिलर स्कोर जनरेट हो सके।'
                  : 'Log your first week of transactions (minimum 5 sales across 3 days) to unlock your explainable PSL-aligned alternative credit score.')}
              </p>
              <div className="pt-2">
                <Button onClick={() => onNavigateTab('cashflow')} variant="dark" size="sm">
                  <span>{language === 'hi' ? 'बही-खाता में बिक्री दर्ज करें' : 'Record First Sale'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <CreditGauge 
              score={activeProjectedScore} 
              ratingLabel={language === 'hi' ? projectedTier.tierNameHi : projectedTier.tierName} 
            />
          )}
        </Card>

      </div>

      {/* 3. 4 Transparent Factor Pillars */}
      <div>
        <h2 className="text-base font-black text-indigoRural-900 tracking-tight mb-3 font-display">
          {language === 'hi' ? '4 पारदर्शी आधार (Explainable Pillars)' : '4 Transparent Evaluation Pillars'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {factors.length > 0 ? (
            factors.map((factor) => {
              const isPositive = factor.status === 'positive' || factor.percentage >= 70;

              return (
                <Card key={factor.id} padding="md" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="neutral" size="sm">
                      Weight {factor.weight}
                    </Badge>
                    <span className="text-sm font-black text-indigoRural-900 tabular-nums">
                      {factor.percentage}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-indigoRural-900 leading-tight">
                      {language === 'hi' ? factor.nameHindi : factor.name}
                    </h3>
                    <p className="text-xs text-indigoRural-500 mt-1">
                      {language === 'hi' ? factor.explanationHindi : factor.explanation}
                    </p>
                  </div>

                  <div className="w-full bg-paper-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-forestRural-600' : 'bg-ochre-500'}`} 
                      style={{ width: `${factor.percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-indigoRural-500 font-bold pt-1 border-t border-paper-200/60">
                    <span>Pillar Weight: {factor.weight}</span>
                    <span className="text-indigoRural-900 tabular-nums font-black">{factor.score} / {factor.maxScore}</span>
                  </div>

                  {factor.subFactors && factor.subFactors.length > 0 && (
                    <div className="pt-2 border-t border-paper-200/50 space-y-1">
                      {factor.subFactors.map((sub, sIdx) => (
                        <div key={sIdx} className="flex justify-between items-center text-[10px] text-indigoRural-600 bg-paper-100/60 px-2 py-1 rounded-lg">
                          <span className="truncate pr-1 font-medium">• {sub.name}</span>
                          <span className="font-bold tabular-nums shrink-0">{sub.score}/{sub.maxScore}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="col-span-4 p-8 text-center text-indigoRural-400 text-xs">
              Loading explainable scoring factors...
            </div>
          )}
        </div>
      </div>

      {/* 4. Interactive Score What-If Simulator */}
      <Card padding="lg" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-terracotta-50 text-terracotta-700 border border-terracotta-200/80">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-indigoRural-900 tracking-tight font-display">
                {language === 'hi' ? 'स्कोर सिमुलेटर (What-If Simulator)' : 'Interactive Score Simulator'}
              </h2>
              <p className="text-xs text-indigoRural-500">
                Adjust actions to project score enhancement and loan eligibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-paper-100 px-3.5 py-1.5 rounded-xl border border-paper-300">
            <span className="text-xs text-indigoRural-500 font-medium">Projected Score:</span>
            <motion.strong 
              key={activeProjectedScore}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="text-lg font-black text-terracotta-700 tabular-nums font-display"
            >
              {activeProjectedScore || '—'}
            </motion.strong>
            <Badge variant={activeDelta > 0 ? 'positive' : 'neutral'} size="sm">
              +{activeDelta} pts
            </Badge>
          </div>
        </div>

        {/* 3 Interactive Sliders with touch-friendly targets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Slider 1: Consistent Logging Days */}
          <div className="space-y-2 p-4 rounded-xl bg-paper-50 border border-paper-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-indigoRural-700">Daily Bahi-Khata Logging</span>
              <span className="text-terracotta-700 font-extrabold tabular-nums">+{extraDays} Days</span>
            </div>
            <div className="min-h-[44px] flex items-center">
              <input 
                type="range" 
                min="0" 
                max="60" 
                step="5"
                value={extraDays}
                onChange={(e) => setExtraDays(Number(e.target.value))}
                className="w-full h-8 py-2 accent-terracotta-600 cursor-pointer touch-none"
              />
            </div>
            <p className="text-[10px] text-indigoRural-400">Regular evening logging builds credit discipline verification.</p>
          </div>

          {/* Slider 2: Udhaar Recovery */}
          <div className="space-y-2 p-4 rounded-xl bg-paper-50 border border-paper-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-indigoRural-700">Udhaar Recovery Target</span>
              <span className="text-forestRural-700 font-extrabold tabular-nums">₹{recoverUdhaar.toLocaleString('en-IN')}</span>
            </div>
            <div className="min-h-[44px] flex items-center">
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="500"
                value={recoverUdhaar}
                onChange={(e) => setRecoverUdhaar(Number(e.target.value))}
                className="w-full h-8 py-2 accent-forestRural-600 cursor-pointer touch-none"
              />
            </div>
            <p className="text-[10px] text-indigoRural-400">Recovering pending khata accelerates capital turnover.</p>
          </div>

          {/* Slider 3: Digital Payments Adoption */}
          <div className="space-y-2 p-4 rounded-xl bg-paper-50 border border-paper-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-indigoRural-700">UPI Digital Sales Share</span>
              <span className="text-ochre-700 font-extrabold tabular-nums">{targetUpi}%</span>
            </div>
            <div className="min-h-[44px] flex items-center">
              <input 
                type="range" 
                min="10" 
                max="90" 
                step="5"
                value={targetUpi}
                onChange={(e) => setTargetUpi(Number(e.target.value))}
                className="w-full h-8 py-2 accent-ochre-600 cursor-pointer touch-none"
              />
            </div>
            <p className="text-[10px] text-indigoRural-400">Digital deepening is a key factor in PSL-format credit evaluation.</p>
          </div>

        </div>

        {/* Dynamic Projection Summary Callout */}
        <motion.div 
          key={`${activeProjectedScore}-${tierUpgraded}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            tierUpgraded 
              ? 'bg-forestRural-50/80 border-forestRural-300 shadow-xs' 
              : 'bg-paper-100/70 border-paper-300'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${tierUpgraded ? 'bg-forestRural-600 text-white shadow-xs' : 'bg-paper-200 text-indigoRural-700'}`}>
              {tierUpgraded ? <Sparkles className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-indigoRural-900 uppercase tracking-wide">
                  {tierUpgraded 
                    ? (language === 'hi' ? '🎉 नया ऋण स्तर खुला!' : '🎉 Higher Loan Tier Unlocked!') 
                    : (language === 'hi' ? 'ऋण फ़ाइल सुदृढ़ीकरण' : 'Credit File Deepening')}
                </span>
                <Badge variant={projectedTier.badgeVariant} size="sm">
                  {language === 'hi' ? projectedTier.schemeHi : projectedTier.scheme}
                </Badge>
              </div>
              <p className="text-xs text-indigoRural-700 font-medium leading-relaxed">
                {language === 'hi'
                  ? tierUpgraded
                    ? `इस सिमुलेशन से स्कोर बढ़कर ${activeProjectedScore}/850 हो जाएगा (+${activeDelta} अंक), जिससे आपकी दुकान '${projectedTier.schemeHi}' (${projectedTier.facilityHi}) के लिए बिना किसी बंधक (0% Collateral) के सीधे बैंक शाखा स्वीकृति के योग्य बन जाती है।`
                    : `स्कोर ${activeProjectedScore}/850 पर पहुंचने से बैंक आपकी फ़ाइल को '${projectedTier.schemeHi}' के तहत न्यूनतम जोखिम स्प्रेड दर (${projectedTier.interestRate}) पर ऋण स्वीकृत करने की अनुशंसा करता है।`
                  : tierUpgraded
                    ? `Simulated actions raise score to ${activeProjectedScore}/850 (+${activeDelta} pts), advancing you into ${projectedTier.scheme} (${projectedTier.facility}) with 100% collateral-free terms.`
                    : `Score reaches ${activeProjectedScore}/850 (+${activeDelta} pts), solidifying your Prime standing for ${projectedTier.scheme} and qualifying for bank risk-spread rate discounts (${projectedTier.interestRate}).`
                }
              </p>
            </div>
          </div>

          <div className="md:text-right shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-paper-200/80">
            <div className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-wider">
              {language === 'hi' ? 'अनुमानित अधिकतम सीमा' : 'Sanctioned Ceiling'}
            </div>
            <div className="text-sm font-black text-forestRural-700 font-display">
              {language === 'hi' ? projectedTier.facilityHi : projectedTier.facility}
            </div>
          </div>
        </motion.div>
      </Card>

    </div>
  );
}
