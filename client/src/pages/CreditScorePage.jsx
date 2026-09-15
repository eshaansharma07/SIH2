import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  Zap,
  Award,
  CreditCard
} from 'lucide-react';
import { CreditGauge } from '../components/CreditGauge';
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

  const baseScore = creditData?.totalScore || 755;

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
      explanation: '84 active logging days with positive operating surplus.',
      explanationHindi: '84 दिन का नियमित बही-खाता और सकारात्मक नकदी प्रवाह।'
    },
    {
      id: 'growth',
      name: 'Revenue Stability & Turnover',
      nameHindi: 'बिक्री स्थिरता एवं मासिक आय',
      weight: '25%',
      score: 195,
      maxScore: 212,
      percentage: 92,
      explanation: 'Stable ₹52,000 monthly turnover providing 3.2x EMI coverage.',
      explanationHindi: 'स्थिर मासिक बिक्री जिससे 3.2x ईएमआई सुरक्षा मिलती है।'
    },
    {
      id: 'discipline',
      name: 'Working Capital & Khata Discipline',
      nameHindi: 'उधार वसूली और कार्यशील पूंजी',
      weight: '25%',
      score: 188,
      maxScore: 213,
      percentage: 88,
      explanation: 'Customer credit held at 18% of monthly sales with 82% recovery rate.',
      explanationHindi: 'उधार बिक्री का केवल 18% हिस्सा और 82% वसूली दर।'
    },
    {
      id: 'vintage',
      name: 'Vintage & Digital Footprint',
      nameHindi: 'व्यापार अनुभव एवं डिजिटल लेन-देन',
      weight: '20%',
      score: 145,
      maxScore: 170,
      percentage: 85,
      explanation: '4 years of uninterrupted trade & 37% verified UPI QR receipts.',
      explanationHindi: '4 वर्ष का स्थापित व्यापार और 37% यूपीआई डिजिटल रसीदें।'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Sovereign Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-display">
              {language === 'hi' ? 'वैकल्पिक क्रेडिट स्कोर' : 'Alternative Credit Score'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBI PSL Tier-A Prime</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi' ? 'बिना सिबिल स्कोर के बैंक ऋण पात्रता की पारदर्शी जांच' : 'Explainable, non-CIBIL alternative financial underwriting engine for Priority Sector Lending'}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('dossier')}
          className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>{language === 'hi' ? 'बैंक फाइल डाउनलोड करें' : 'Generate Bank Dossier'}</span>
        </button>
      </div>

      {/* 2. Top Row: Sovereign Micro-Credit Pass + Health Dial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Apple Card Titanium Sovereign Pass (7 Cols) */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-4xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-7 sm:p-8 shadow-sovereign border border-slate-700/60 flex flex-col justify-between min-h-[240px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Sovereign Vector Micro Chip */}
              <div className="w-7 h-5 rounded-md bg-gradient-to-tr from-amber-300 to-amber-500 border border-amber-200/60 shadow-xs flex items-center justify-center">
                <div className="w-4 h-3 border border-amber-800/40 rounded-xs" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                National MSME Sovereign Credit ID
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
              UDYAM-UP-18-0092478
            </span>
          </div>

          <div className="space-y-1 py-5">
            <div className="text-[11px] text-saffron-400 font-bold uppercase tracking-wider">Verified Enterprise</div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
              {shop?.name || "Ramesh Kirana & General Store"}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {shop?.owner_name || "Ramesh Kumar"} (Proprietor) • {shop?.village || "Utraula Dehat"}, {shop?.district || "Balrampur"}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Alternative Score</span>
              <span className="text-2xl font-black text-white tabular-nums font-display">{baseScore} <span className="text-xs text-slate-400 font-normal">/ 850</span></span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Facility</span>
              <span className="text-sm font-extrabold text-emerald-400">PM MUDRA Shishu / Kishore (₹50k – ₹5L)</span>
            </div>
          </div>
        </div>

        {/* Dial Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col items-center justify-center">
          <CreditGauge score={baseScore} />
        </div>

      </div>

      {/* 3. 4 Transparent Factor Pillars */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-3">
          {language === 'hi' ? '4 पारदर्शी आधार (Explainable Pillars)' : '4 Transparent Evaluation Pillars'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {factors.map((factor) => (
            <div key={factor.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Weight {factor.weight}
                </span>
                <span className="text-sm font-black text-slate-900 tabular-nums">
                  {factor.percentage}%
                </span>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {language === 'hi' ? factor.nameHindi : factor.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'hi' ? factor.explanationHindi : factor.explanation}
                </p>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-indigo-600 transition-all duration-700" 
                  style={{ width: `${factor.percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-bold pt-1">
                <span>Score</span>
                <span className="text-slate-900 tabular-nums">{factor.score} / {factor.maxScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Interactive Score What-If Simulator (Apple Slider Controls) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {language === 'hi' ? 'स्कोर सिमुलेटर (What-If Simulator)' : 'Interactive Score Simulator'}
              </h2>
              <p className="text-xs text-slate-500">
                Adjust actions to project score enhancement and loan eligibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Projected Score:</span>
            <strong className="text-lg font-black text-indigo-600 tabular-nums">
              {simulatedData?.projectedScore || baseScore}
            </strong>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +{simulatedData?.delta || 0} pts
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Slider 1: Additional Logging Days */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">{language === 'hi' ? 'दैनिक बही-खाता प्रविष्टि' : 'Additional Logging Days'}</span>
              <span className="text-indigo-600 tabular-nums">{extraDays} days</span>
            </div>
            <input 
              type="range"
              min="0"
              max="60"
              step="5"
              value={extraDays}
              onChange={(e) => setExtraDays(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[11px] text-slate-400 block">+0.8 pts per regular logging day</span>
          </div>

          {/* Slider 2: Udhaar Recovery */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">{language === 'hi' ? 'ग्राहक उधार वसूली' : 'Khata Udhaar Recovery'}</span>
              <span className="text-indigo-600 tabular-nums">₹{recoverUdhaar.toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="range"
              min="0"
              max="8000"
              step="500"
              value={recoverUdhaar}
              onChange={(e) => setRecoverUdhaar(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[11px] text-slate-400 block">Reduces working capital risk</span>
          </div>

          {/* Slider 3: Target UPI Share */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">{language === 'hi' ? 'डिजिटल यूपीआई अनुपात' : 'Target UPI Share'}</span>
              <span className="text-indigo-600 tabular-nums">{targetUpi}%</span>
            </div>
            <input 
              type="range"
              min="20"
              max="80"
              step="5"
              value={targetUpi}
              onChange={(e) => setTargetUpi(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[11px] text-slate-400 block">Bank verified digital trail</span>
          </div>

        </div>

        {/* Projected Impact Pill */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-slate-800 font-semibold">
              {language === 'hi'
                ? `इस सिमुलेशन से रमेश जी का स्कोर 755 से बढ़कर ${simulatedData?.projectedScore || 793} हो जाएगा और वे ₹3 लाख के मुद्रा किशोर लोन के लिए स्वतः योग्य होंगे।`
                : `Simulated actions raise Ramesh's score to ${simulatedData?.projectedScore || 793}/850, qualifying for ₹3–₹5 Lakh MUDRA Kishore facility.`}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('schemes')}
            className="text-xs font-extrabold text-indigo-600 hover:underline shrink-0"
          >
            Check Eligible Schemes →
          </button>
        </div>

      </div>

    </div>
  );
}
