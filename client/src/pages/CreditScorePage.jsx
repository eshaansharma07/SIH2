import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  Award 
} from 'lucide-react';
import { CreditGauge } from '../components/CreditGauge';
import { WarliBorder, WarliCircle } from '../components/WarliMotif';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export function CreditScorePage({ shop, creditData, onNavigateTab }) {
  const { t, language } = useTranslation();
  
  // Simulator State
  const [extraDays, setExtraDays] = useState(30);
  const [recoverUdhaar, setRecoverUdhaar] = useState(4000);
  const [targetUpi, setTargetUpi] = useState(50);
  const [simulatedData, setSimulatedData] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const baseScore = creditData?.totalScore || 750;

  useEffect(() => {
    runSimulation();
  }, [extraDays, recoverUdhaar, targetUpi, baseScore]);

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const res = await api.simulateCreditScore({
        shopId: shop?.id || 'ramesh-kirana',
        additionalLoggingDays: extraDays,
        udhaarRecoveryAmount: recoverUdhaar,
        targetUpiSharePct: targetUpi
      });
      if (res.success) {
        setSimulatedData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const factors = creditData?.factors || [
    {
      id: 'consistency',
      name: 'Cash Flow & Logging Regularity',
      nameHindi: 'दैनिक बही-खाता नियमितता',
      weight: '30%',
      score: 245,
      maxScore: 255,
      percentage: 96,
      explanation: '84 active logging days with healthy net operating surplus.',
      explanationHindi: 'पिछले 90 दिनों में 84 दिन का सक्रिय हिसाब और ₹42,800 का शुद्ध अधिशेष।',
      tip: 'Daily logging keeps score at peak.'
    },
    {
      id: 'growth',
      name: 'Revenue Stability & Turnover',
      nameHindi: 'बिक्री स्थिरता एवं मासिक आय',
      weight: '25%',
      score: 195,
      maxScore: 212,
      percentage: 92,
      explanation: 'Consistent ₹52,000 monthly turnover provides solid EMI coverage.',
      explanationHindi: 'प्रति माह ₹52,000 की स्थिर बिक्री से बैंक को ईएमआई भुगतान का भरोसा मिलता है।',
      tip: 'Festival demand buffer will expand monthly turnover.'
    },
    {
      id: 'discipline',
      name: 'Udhaar & Working Capital Discipline',
      nameHindi: 'उधार वसूली और कार्यशील पूंजी',
      weight: '25%',
      score: 188,
      maxScore: 213,
      percentage: 88,
      explanation: 'Customer udhaar held at 18% of monthly sales with 82% recovery.',
      explanationHindi: 'कुल बिक्री का केवल 18% हिस्सा उधार में है और 82% वसूली दर बहुत अच्छी है।',
      tip: 'Recover pending ₹4,000 to add +18 points.'
    },
    {
      id: 'vintage',
      name: 'Vintage & Digital Footprint',
      nameHindi: 'व्यापार का अनुभव एवं डिजिटल लेन-देन',
      weight: '20%',
      score: 145,
      maxScore: 170,
      percentage: 85,
      explanation: '4 years of uninterrupted trade & 34% UPI digital transactions.',
      explanationHindi: '4 वर्ष का स्थापित व्यापार और 34% यूपीआई लेन-देन बैंक के लिए पक्का सबूत हैं।',
      tip: 'Encourage UPI payments on purchases over ₹100.'
    }
  ];

  const checklist = creditData?.loanReadinessChecklist || [
    { id: '1', title: 'Maintain 60+ Days of Digital Bahi-Khata Records', titleHindi: '60+ दिन का दैनिक बही-खाता रिकॉर्ड', completed: true, currentValue: '84 / 60 days', impact: '+45 pts' },
    { id: '2', title: 'Free Udyam Micro-Enterprise Registration', titleHindi: 'निःशुल्क उद्यम आधार प्रमाण-पत्र', completed: true, currentValue: 'Ready (Aadhaar/PAN)', impact: 'Mandatory' },
    { id: '3', title: 'Keep Customer Udhaar Under 25% of Sales', titleHindi: 'कुल उधार बिक्री के 25% से कम रखें', completed: true, currentValue: '18% current udhaar', impact: '+30 pts' },
    { id: '4', title: 'UPI / Digital Payment Share Above 30%', titleHindi: '30% से अधिक बिक्री यूपीआई से', completed: true, currentValue: '34% UPI share', impact: '+25 pts' },
    { id: '5', title: 'Active Jan Dhan or Savings Account in Gramin Bank', titleHindi: 'ग्रामीण बैंक या एसबीआई में सक्रिय खाता', completed: true, currentValue: 'Aryavart Gramin Bank', impact: 'Direct Credit' }
  ];

  const completedCount = checklist.filter(c => c.completed).length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Hero Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-paper-300 shadow-paper space-y-2 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forestRural-50 text-forestRural-800 border border-forestRural-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-forestRural-600" />
              <span>{language === 'hi' ? '100% पारदर्शी • बैंक-प्रमाणित' : '100% Transparent • Bank Approved Alternative'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              {t('credit.title')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl">
              {t('credit.subtitle')}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('dossier')}
            className="px-5 py-3 bg-terracotta-600 hover:bg-terracotta-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center gap-2 shrink-0 transition"
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'hi' ? 'बैंक डॉसियर प्रमाण-पत्र बनाएं' : 'Generate Bank Dossier'}</span>
          </button>
        </div>
      </div>

      {/* 2. Big Score Gauge & Core Status Card */}
      <div className="bg-gradient-to-br from-paper-50 via-white to-paper-100 rounded-3xl p-6 sm:p-8 border-2 border-paper-300 shadow-paper grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Speedometer Gauge (6 Cols) */}
        <div className="md:col-span-6 flex flex-col items-center justify-center">
          <CreditGauge 
            score={baseScore} 
            ratingLabel={creditData?.ratingLabel || 'अति उत्कृष्ट (Prime Bankable)'} 
            compact={false}
          />
          <p className="text-xs text-stone-500 text-center mt-3 max-w-sm">
            {language === 'hi'
              ? 'यह स्कोर आपकी 90 दिनों की नियमित बही-खाता प्रविष्टि, यूपीआई बिक्री और समय पर उधार वसूली से प्रमाणित है।'
              : 'Computed directly from 90 days of daily ledger entries, UPI share, and low customer default risk.'}
          </p>
        </div>

        {/* Right: Bank Sanction Readiness Summary (6 Cols) */}
        <div className="md:col-span-6 bg-white p-5 rounded-2xl border border-paper-300 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-paper-200 pb-2.5">
            <span className="font-extrabold text-xs uppercase tracking-wider text-stone-500">
              {language === 'hi' ? 'बैंक लोन पात्रता स्थिति' : 'Loan Sanction Probability'}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
              96% High Approval
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-600 font-semibold">{language === 'hi' ? 'मुद्रा शिशु लोन (₹50,000):' : 'MUDRA Shishu (₹50,000):'}</span>
              <span className="font-bold text-forestRural-700">✓ 100% Eligible (Zero Collateral)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600 font-semibold">{language === 'hi' ? 'मुद्रा किशोर लोन (₹5 लाख तक):' : 'MUDRA Kishor (Up to ₹5L):'}</span>
              <span className="font-bold text-forestRural-700">✓ 98% Eligible (Equipment/Expansion)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600 font-semibold">{language === 'hi' ? 'पीएम स्वनिधि (₹50,000):' : 'PM SVANidhi (7% Subsidy):'}</span>
              <span className="font-bold text-forestRural-700">✓ Eligible (Cashback Enabled)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-forestRural-50 border border-forestRural-200 text-forestRural-900 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-forestRural-600 shrink-0 mt-0.5" />
            <p>
              {language === 'hi'
                ? 'आपका स्कोर 750 पार कर चुका है! बैंक शाखा प्रबंधक को आपके पास सिबिल स्कोर न होने का बहाना नहीं मिलेगा।'
                : 'Your score crosses the 750 threshold! Bank branch managers can appraise this under Priority Sector Lending.'}
            </p>
          </div>
        </div>

      </div>

      {/* 3. The 4 Transparent Scoring Pillars (Explainable Grid) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-black text-stone-900">
            {t('credit.factorsTitle')}
          </h2>
          <p className="text-xs text-stone-500">
            {language === 'hi' ? 'कोई सीक्रेट एल्गोरिदम नहीं — देखें कि आपके स्कोर का हर अंक कहाँ से आया है' : 'No black box — exact points and percentage earned in each factor'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {factors.map((fac) => (
            <div key={fac.id} className="bg-white p-5 rounded-3xl border-2 border-paper-300 shadow-paper space-y-3">
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-stone-900 text-sm">
                      {language === 'hi' ? fac.nameHindi : fac.name}
                    </h3>
                    <span className="text-[10px] bg-paper-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                      Weight: {fac.weight}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === 'hi' ? fac.explanationHindi : fac.explanation}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-black text-stone-900">{fac.score}</span>
                  <span className="text-xs text-stone-400">/{fac.maxScore} pts</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full h-2.5 bg-paper-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-forestRural-600 rounded-full transition-all duration-700"
                    style={{ width: `${fac.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 font-semibold mt-1">
                  <span>{fac.percentage}% Achieved</span>
                  <span className="text-forestRural-700 font-bold">Excellent</span>
                </div>
              </div>

              {/* Tip */}
              <div className="p-2.5 rounded-xl bg-paper-50 border border-paper-200 text-[11px] text-stone-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ochre-600 shrink-0" />
                <span><strong>{language === 'hi' ? 'सुधार टिप: ' : 'Tip: '}</strong>{fac.tip}</span>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* 4. Interactive Score Improvement Simulator */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-paper-300 shadow-paper space-y-5">
        <div className="flex items-center justify-between border-b border-paper-200 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-ochre-100 text-ochre-800 rounded-xl">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                {t('credit.simulatorTitle')}
              </h2>
              <p className="text-[11px] text-stone-500">
                {t('credit.simulatorSub')}
              </p>
            </div>
          </div>

          {/* Dynamic Score Delta Result Pill */}
          <div className="flex items-center gap-2 bg-forestRural-50 border border-forestRural-300 px-3.5 py-1.5 rounded-2xl">
            <span className="text-xs text-stone-600 font-bold hidden sm:inline">Projected Score:</span>
            <span className="text-lg font-black text-forestRural-800">
              {simulatedData?.projectedScore || baseScore}
            </span>
            <span className="text-xs font-black text-forestRural-700 bg-forestRural-200/80 px-2 py-0.5 rounded-lg">
              +{simulatedData?.delta || 0} pts!
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* Slider 1: Extra logging days */}
          <div className="p-4 bg-paper-50 rounded-2xl border border-paper-300 space-y-2">
            <div className="flex justify-between text-xs font-bold text-stone-700">
              <span>{language === 'hi' ? 'दैनिक हिसाब दर्ज करें:' : 'Consecutive Logging:'}</span>
              <span className="text-terracotta-700 font-black">+{extraDays} days</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={extraDays}
              onChange={(e) => setExtraDays(Number(e.target.value))}
              className="w-full accent-terracotta-600"
            />
            <span className="text-[10px] text-stone-500 block">Impact: +{Math.round(extraDays * 0.8)} points</span>
          </div>

          {/* Slider 2: Udhaar recovery */}
          <div className="p-4 bg-paper-50 rounded-2xl border border-paper-300 space-y-2">
            <div className="flex justify-between text-xs font-bold text-stone-700">
              <span>{language === 'hi' ? 'बकाया उधार वसूली:' : 'Udhaar Recovery:'}</span>
              <span className="text-ochre-700 font-black">₹{recoverUdhaar}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="500"
              value={recoverUdhaar}
              onChange={(e) => setRecoverUdhaar(Number(e.target.value))}
              className="w-full accent-ochre-600"
            />
            <span className="text-[10px] text-stone-500 block">Impact: +{Math.min(28, Math.round((recoverUdhaar / 5000) * 15))} points</span>
          </div>

          {/* Slider 3: UPI digital sales share */}
          <div className="p-4 bg-paper-50 rounded-2xl border border-paper-300 space-y-2">
            <div className="flex justify-between text-xs font-bold text-stone-700">
              <span>{language === 'hi' ? 'यूपीआई डिजिटल बिक्री लक्ष्य:' : 'Target UPI Share:'}</span>
              <span className="text-indigoRural-700 font-black">{targetUpi}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="80"
              step="5"
              value={targetUpi}
              onChange={(e) => setTargetUpi(Number(e.target.value))}
              className="w-full accent-indigoRural-600"
            />
            <span className="text-[10px] text-stone-500 block">Impact: +{Math.min(25, Math.round(Math.max(0, targetUpi - 34) * 0.6))} points</span>
          </div>

        </div>
      </div>

      {/* 5. Bank Loan Readiness Checklist */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-paper-300 shadow-paper space-y-4">
        <div className="flex items-center justify-between border-b border-paper-200 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-stone-900">
              {t('credit.checklistTitle')}
            </h2>
            <p className="text-[11px] text-stone-500">
              {t('credit.checklistSub')}
            </p>
          </div>
          <span className="text-xs font-bold text-forestRural-800 bg-forestRural-50 border border-forestRural-300 px-3 py-1 rounded-full">
            ✓ {completedCount} / {checklist.length} Completed
          </span>
        </div>

        <div className="space-y-2.5">
          {checklist.map((item) => (
            <div 
              key={item.id}
              className="p-3.5 rounded-2xl bg-paper-50 border border-paper-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  item.completed ? 'bg-forestRural-600 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                    {language === 'hi' ? item.titleHindi : item.title}
                  </span>
                  <p className="text-[11px] text-stone-500">{item.currentValue}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[10px] font-bold text-stone-600 bg-white px-2 py-0.5 rounded-md border border-paper-300">
                  {item.impact}
                </span>
                <span className="text-[11px] font-extrabold text-forestRural-700 bg-forestRural-100 px-2 py-0.5 rounded-lg">
                  {item.completed ? 'Verified ✓' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
