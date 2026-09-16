import React, { useState, useEffect } from 'react';
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

export function CreditScorePage({ shop, creditData, onNavigateTab }) {
  const { t, language } = useTranslation();
  
  // Simulator State
  const [extraDays, setExtraDays] = useState(30);
  const [recoverUdhaar, setRecoverUdhaar] = useState(4000);
  const [targetUpi, setTargetUpi] = useState(50);
  const [simulatedData, setSimulatedData] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const baseScore = creditData?.totalScore ?? null;

  useEffect(() => {
    if (baseScore !== null && shop?.id) {
      runSimulation();
    }
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
      if (res.success) {
        setSimulatedData(res);
      }
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setSimulating(false);
    }
  };

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
                National MSME Sovereign Credit ID
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
              <span className="text-sm font-extrabold text-forestRural-300">PM MUDRA Shishu / Kishore (₹50k – ₹5L)</span>
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
                  ? 'व्यापार साथी पर अपना पहला हफ्ता पूरा करें (न्यूनतम 5 बिक्री और 3 दिन) ताकि बैंक-मान्य 4-पिलर स्कोर जनरेट हो सके।'
                  : 'Log your first week of transactions (minimum 5 sales across 3 days) to unlock your explainable RBI-aligned credit score.')}
              </p>
              <div className="pt-2">
                <Button onClick={() => onNavigateTab('cashflow')} variant="dark" size="sm">
                  <span>{language === 'hi' ? 'बही-खाता में बिक्री दर्ज करें' : 'Record First Sale'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <CreditGauge score={simulatedData?.projectedScore ?? baseScore} />
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
            <strong className="text-lg font-black text-terracotta-700 tabular-nums font-display">
              {simulatedData?.projectedScore || baseScore || '—'}
            </strong>
            <Badge variant="positive" size="sm">
              +{simulatedData?.delta || 0} pts
            </Badge>
          </div>
        </div>

        {/* 3 Interactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Slider 1: Consistent Logging Days */}
          <div className="space-y-2 p-4 rounded-xl bg-paper-50 border border-paper-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-indigoRural-700">Daily Bahi-Khata Logging</span>
              <span className="text-terracotta-700 font-extrabold tabular-nums">+{extraDays} Days</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="60" 
              step="5"
              value={extraDays}
              onChange={(e) => setExtraDays(Number(e.target.value))}
              className="w-full accent-terracotta-600 cursor-pointer"
            />
            <p className="text-[10px] text-indigoRural-400">Regular evening logging builds credit discipline verification.</p>
          </div>

          {/* Slider 2: Udhaar Recovery */}
          <div className="space-y-2 p-4 rounded-xl bg-paper-50 border border-paper-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-indigoRural-700">Udhaar Recovery Target</span>
              <span className="text-forestRural-700 font-extrabold tabular-nums">₹{recoverUdhaar.toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10000" 
              step="500"
              value={recoverUdhaar}
              onChange={(e) => setRecoverUdhaar(Number(e.target.value))}
              className="w-full accent-forestRural-600 cursor-pointer"
            />
            <p className="text-[10px] text-indigoRural-400">Recovering pending khata accelerates capital turnover.</p>
          </div>

          {/* Slider 3: Digital Payments Adoption */}
          <div className="space-y-2 p-4 rounded-xl bg-paper-50 border border-paper-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-indigoRural-700">UPI Digital Sales Share</span>
              <span className="text-ochre-700 font-extrabold tabular-nums">{targetUpi}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="90" 
              step="5"
              value={targetUpi}
              onChange={(e) => setTargetUpi(Number(e.target.value))}
              className="w-full accent-ochre-600 cursor-pointer"
            />
            <p className="text-[10px] text-indigoRural-400">RBI mandates digital deepening for PSL credit rating.</p>
          </div>

        </div>

        {/* Projection Summary Callout */}
        <div className="p-4 rounded-xl bg-forestRural-50 border border-forestRural-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-forestRural-700 shrink-0" />
          <p className="text-xs text-forestRural-800 font-medium">
            {language === 'hi' 
              ? `इस सिमुलेशन से स्कोर बढ़कर ${simulatedData?.projectedScore || baseScore || '—'} हो जाएगा और वे ₹3 लाख के मुद्रा किशोर लोन के लिए स्वतः योग्य होंगे।`
              : `Simulated actions raise score to ${simulatedData?.projectedScore || baseScore || '—'}/850, qualifying for ₹3–₹5 Lakh MUDRA Kishore facility.`}
          </p>
        </div>
      </Card>

    </div>
  );
}
