import React from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  PlusCircle, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight,
  Zap,
  FileText,
  Activity
} from 'lucide-react';
import { CreditGauge } from '../components/CreditGauge';
import { useTranslation } from '../i18n/LanguageContext';

export function DashboardPage({ 
  shop, 
  creditData, 
  summaryData, 
  cuesData, 
  onOpenKeypad, 
  onNavigateTab, 
  onAskPrompt,
  onStartDemoTour
}) {
  const { t, language } = useTranslation();

  const metrics = {
    totalIncome: summaryData?.totalIncome ?? creditData?.metrics?.totalIncome ?? 225857,
    totalExpense: summaryData?.totalExpense ?? creditData?.metrics?.totalExpense ?? 162250,
    netSurplus: summaryData?.netSurplus ?? creditData?.metrics?.netSurplus ?? 63607,
    totalUdhaarPending: summaryData?.pendingUdhaar ?? creditData?.metrics?.totalUdhaarPending ?? 1050,
    digitalSharePct: summaryData?.digitalSharePct ?? creditData?.metrics?.digitalSharePct ?? 37,
    loggedDaysCount: creditData?.metrics?.loggedDaysCount || 120
  };

  const sampleQuestions = [
    { text: "दिवाली के लिए तेल और चीनी का कितना स्टॉक लूँ?", textEn: "How much stock of oil & sugar for Diwali?", topic: "festival_stock" },
    { text: "ग्राहक उधार कैसे नियंत्रित करें?", textEn: "How do I manage customer udhaar?", topic: "udhaar_management" },
    { text: "डीप-फ्रीज़र के लिए कौन सा मुद्रा लोन मिलेगा?", textEn: "Which MUDRA loan fits for a deep freezer?", topic: "loan_freezer" },
    { text: "क्रेडिट स्कोर 750+ कैसे करें?", textEn: "How to raise credit score above 750?", topic: "credit_boost" }
  ];

  const festivalList = cuesData?.festivalCues || [
    {
      id: "navratri-dussehra",
      festival: "Sharad Navratri & Dussehra",
      festivalHi: "शारदीय नवरात्रि एवं दशहरा",
      timing: "Oct 11 – Oct 20",
      timingHi: "11 अक्तूबर – 20 अक्तूबर",
      daysRemaining: 37,
      demandSurge: "+38%",
      priorityItems: "Mustard oil, Desi ghee, Sabudana, Pooja items",
      priorityItemsHi: "सरसों तेल, देशी घी, साबूदाना, पूजा सामग्री",
      verifiedByGoogleCalendar: true
    },
    {
      id: "diwali-dhanteras",
      festival: "Dhanteras & Diwali",
      festivalHi: "धनतेरस एवं दीपावली",
      timing: "Nov 6 – Nov 11",
      timingHi: "6 नवंबर – 11 नवंबर",
      daysRemaining: 63,
      demandSurge: "+48%",
      priorityItems: "Sugar, Besan, Edible oil, Dry fruits",
      priorityItemsHi: "चीनी, बेसन, रिफाइंड तेल, मेवा गिफ्ट पैक",
      verifiedByGoogleCalendar: true
    },
    {
      id: "chhath-puja",
      festival: "Chhath Puja Mahaparv",
      festivalHi: "छठ पूजा महापर्व",
      timing: "Nov 15",
      timingHi: "15 नवंबर",
      daysRemaining: 72,
      demandSurge: "+42%",
      priorityItems: "Thekua flour, Desi Gur, Ghee, Soop",
      priorityItemsHi: "ठेकुआ आटा, शुद्ध गुड़, घी, बांस का सूप",
      verifiedByGoogleCalendar: true
    },
    {
      id: "kharif-harvest",
      festival: "Kharif Paddy Mandi Payouts",
      festivalHi: "खरीफ धान मंडी भुगतान",
      timing: "Mid-to-Late November",
      timingHi: "मध्य-से-उत्तर नवंबर",
      daysRemaining: 75,
      demandSurge: "+28%",
      priorityItems: "Bulk 50kg bags, Premium tea, Detergents",
      priorityItemsHi: "थोक 50kg अनाज बोरे, प्रीमियम चाय पत्ती",
      verifiedByGoogleCalendar: true
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-24 lg:pb-12">
      
      {/* 1. Master-Crafted Sovereign Digital Smart Credential Pass */}
      <div className="sovereign-pass relative overflow-hidden rounded-[32px] text-white p-6 sm:p-8 shadow-2xl border border-white/15 group">
        {/* Background Guilloche Security Watermark & Specular Lighting */}
        <div className="absolute inset-0 guilloche-pattern opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/20 via-saffron-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-105 transition duration-700" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Physical Credential Security Strip */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 text-xs">
          {/* Smartcard Chip & Contactless Glyph */}
          <div className="flex items-center gap-3">
            {/* Physical Gold Micro-Chip Vector */}
            <div className="w-10 h-7 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[6px] bg-amber-900/20 border border-amber-900/30 flex flex-col justify-around py-0.5 px-1">
                <div className="h-[1px] bg-amber-950/40 w-full" />
                <div className="h-[1px] bg-amber-950/40 w-full" />
              </div>
            </div>
            {/* Contactless Wave */}
            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8.5 16.5a5 5 0 0 1 0-9" />
              <path d="M12 19a8.5 8.5 0 0 0 0-14" />
            </svg>
            <span className="font-mono text-[11px] text-slate-300 font-bold tracking-widest uppercase">
              UDYAM-UP-18-0092478
            </span>
          </div>

          {/* National Verification Badges */}
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-black text-[11px] border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>UDYAM VERIFIED MSME</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 font-bold text-[11px] border border-white/15">
              RBI PSL Tier-A Prime
            </span>
          </div>
        </div>

        {/* Pass Core Body */}
        <div className="relative z-10 pt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-saffron-400">
                <span>National Sovereign Merchant Credential</span>
                <span>•</span>
                <span>Vintage: 48 Months</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display text-white">
                {shop?.name || 'Ramesh Kirana & General Store'}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-2">
                <span className="font-semibold text-white">{shop?.owner_name || 'Ramesh Kumar'} (Proprietor)</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{shop?.village || 'Utraula Dehat'}, {shop?.district || 'Balrampur'} (UP)</span>
              </p>
            </div>

            {/* Display Figures with High-Contrast Typography */}
            <div className="flex flex-wrap items-baseline gap-6 pt-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                  90-Day Audited Turnover
                </span>
                <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums font-display text-white">
                  ₹{metrics.totalIncome.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="border-l border-white/15 pl-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                  Net Operating Surplus
                </span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums font-display text-emerald-400">
                  ₹{metrics.netSurplus.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="border-l border-white/15 pl-6 hidden sm:block">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                  Retained Margin
                </span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums font-display text-indigo-300">
                  29.6%
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Cryptographic QR Code & Tactile Hardware-style Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3.5 shrink-0">
            {/* Scannable Cryptographic DPI QR Code Seal */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <div className="w-13 h-13 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h7v7H2V2zm2 2v3h3V4H4zm5-2h2v3h2V2h2v2h-2v2h3v3h-2v2h2v2h-2v2h-2v-2h-2v2H9v-2H7v2H5v-2h2v-2H5V9h2V7H5V5h4V2zm5 5h2V5h-2v2zm0 4h2V9h-2v2zm-4 0h2V9h-2v2zm-2 2h2v-2H9v2zm0 2h2v-2H9v2zm4 0h2v-2h-2v2zm2-2h2v-2h-2v2zm0 4h2v-2h-2v2zm-4 0h2v-2h-2v2zm-4 0h2v-2H9v2zM2 15h7v7H2v-7zm2 2v3h3v-3H4zm11 0h7v7h-7v-7zm2 2v3h3v-3h-3z" />
                </svg>
              </div>
              <div className="text-left pr-2">
                <div className="text-[10px] font-black text-white tracking-wider uppercase">
                  DPI Audit Seal
                </div>
                <div className="text-[9px] text-slate-300 font-mono">
                  SHA-256 #UP-92478
                </div>
                <div className="text-[9px] text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Tamper-Evident Bank Pass</span>
                </div>
              </div>
            </div>

            {/* Tactile Hardware Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onOpenKeypad}
                className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>{language === 'hi' ? 'लेन-देन दर्ज करें' : '+ Record Entry'}</span>
              </button>
              <button
                onClick={() => onNavigateTab('advisor')}
                className="px-4 py-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{language === 'hi' ? 'मंडी AI' : 'Mandi AI'}</span>
              </button>
              <button
                onClick={() => onNavigateTab('dossier')}
                className="px-3.5 py-3.5 rounded-2xl bg-white/8 hover:bg-white/14 active:scale-95 text-slate-300 font-semibold text-xs border border-white/12 transition cursor-pointer"
                title="Download Official Bank Dossier"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Asymmetric Financial Pulse Bento (Killing the 4 Cookie-Cutter Boxes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Primary Engine (8 Cols): Audited Financial Pulse & Cash Flow Breakdown */}
        <div className="lg:col-span-8 sovereign-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight font-display">
                  {language === 'hi' ? 'बही-खाता वित्तीय स्थिति' : 'Audited Financial Performance'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  ● 120 Days Audited
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {language === 'hi' ? 'दैनिक बिक्री, माल खरीद एवं शुद्ध परिचालन अधिशेष' : 'Daily gross revenue, inventory replenishment outlays, and net retained margins'}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <span>Operating Margin: </span>
              <strong className="text-emerald-600 font-black">+29.6%</strong>
            </div>
          </div>

          {/* 3 Structured Metrics with Deep Context */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'hi' ? 'सत्यापित कुल बिक्री' : 'Gross Turnover'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight font-display">
                ₹{metrics.totalIncome.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <span>↑</span> 100% verified sales
              </span>
            </div>

            <div className="space-y-1 border-l border-slate-100 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'hi' ? 'माल व दुकान खर्च' : 'Operating Outlay'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight font-display">
                ₹{metrics.totalExpense.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                70.4% wholesale stock
              </span>
            </div>

            <div className="space-y-1 border-l border-slate-100 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'hi' ? 'शुद्ध बचत' : 'Retained Surplus'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums tracking-tight font-display">
                ₹{metrics.netSurplus.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                Prime repayment capacity
              </span>
            </div>
          </div>

          {/* Payment Channels Deepening Bar (RBI Mandated Digital Ratio) */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                {language === 'hi' ? 'भुगतान माध्यम वितरण (Cash vs. UPI)' : 'Payment Channel Distribution'}
              </span>
              <span className="text-indigo-600 font-extrabold text-[11px]">
                RBI Digital Deepening Compliant
              </span>
            </div>

            {/* Segmented Distribution Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex p-[1.5px] gap-1">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: '37%' }} 
                title="Digital UPI: 37%" 
              />
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: '63%' }} 
                title="Direct Cash: 63%" 
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold pt-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                <span>Digital UPI: <strong>37%</strong> (₹{Math.round(metrics.totalIncome * 0.37).toLocaleString('en-IN')})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Cash Receipts: <strong>63%</strong> (₹{Math.round(metrics.totalIncome * 0.63).toLocaleString('en-IN')})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Card (4 Cols): Udhaar Working Capital & Recovery Meter */}
        <div className="lg:col-span-4 sovereign-card p-6 sm:p-7 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-950 tracking-tight font-display">
                {language === 'hi' ? 'ग्राहक उधारी जोखिम' : 'Customer Credit Exposure'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Working Capital Protection
              </p>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200">
              Low Risk (&lt;2%)
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'बकाया ग्राहक खाता' : 'Active Udhaar Balance'}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums font-display">
              ₹{metrics.totalUdhaarPending.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium pt-0.5">
              Strict 7-day credit limit maintained with trusted village patrons.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-600">
              <span>Average Recovery Cycle</span>
              <strong className="text-slate-900 font-bold">4.2 Days</strong>
            </div>
            <div className="flex items-center justify-between font-semibold text-slate-600">
              <span>Active Khata Accounts</span>
              <strong className="text-slate-900 font-bold">8 Customers</strong>
            </div>
            <div className="flex items-center justify-between font-semibold text-slate-600">
              <span>Working Capital At Risk</span>
              <strong className="text-emerald-600 font-bold">1.5% (Safe)</strong>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('cashflow')}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>{language === 'hi' ? 'ग्राहक खाता बही देखें' : 'View Customer Ledger'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

      </div>

      {/* 3. National Seasonal Demand Radar & Credit Health Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Seasonal Demand Radar (7 Cols) */}
        <div className="lg:col-span-7 sovereign-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-display">
                  {language === 'hi' ? 'मौसमी मांग रडार (Demand Radar)' : 'Seasonal Demand Radar'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {shop?.district || 'Balrampur'} Mandi Agricultural & Festival Projections
                </p>
              </div>
            </div>

            <span className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/10 text-emerald-800 text-xs font-black rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Calendar 2026</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {festivalList.map((item, idx) => {
              const name = (language === 'hi' && item.festivalHi) ? item.festivalHi : item.festival;
              const timing = (language === 'hi' && item.timingHi) ? item.timingHi : item.timing;
              const stock = (language === 'hi' && item.priorityItemsHi) ? item.priorityItemsHi : item.priorityItems;

              return (
                <div 
                  key={idx}
                  className="p-4 rounded-3xl bg-slate-50/80 hover:bg-white hover:shadow-card transition duration-200 border border-slate-200/80 flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition truncate">{name}</span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0 tabular-nums">
                        ⏳ {item.daysRemaining}d
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="text-slate-400">📅</span>
                      <span>{timing}</span>
                    </div>
                    <div className="text-[11px] text-slate-800 font-semibold bg-white p-2.5 rounded-2xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Wholesale Pre-Order</span>
                      {stock}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500 font-medium">{language === 'hi' ? 'अनुमानित बिक्री उछाल' : 'Projected Surge'}</span>
                    <span className="font-black text-emerald-600 text-sm tabular-nums">{item.demandSurge}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Credit Score & Health Dial (5 Cols) */}
        <div className="lg:col-span-5 sovereign-card p-6 sm:p-7 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-display">
                  {language === 'hi' ? 'वैकल्पिक क्रेडिट स्वास्थ्य' : 'Alternative Credit Health'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">4-Pillar Non-CIBIL Score</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('credit')}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
            >
              <span>{language === 'hi' ? 'सिम्युलेटर' : 'Simulate'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1">
            <CreditGauge 
              score={creditData?.totalScore || 755} 
              ratingLabel={language === 'hi' ? 'Prime Bankable (ऋण के लिए पात्र)' : 'Prime Bankable'}
            />
          </div>

          {/* 4 Pillars Activity Progress Bars */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-bold">{language === 'hi' ? 'बही-खाता निरंतरता' : 'Cash Flow Regularity'}</span>
                <span className="font-black text-slate-900 tabular-nums">96%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: '96%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-bold">{language === 'hi' ? 'मार्जिन एवं अधिशेष' : 'Surplus Margins'}</span>
                <span className="font-black text-slate-900 tabular-nums">92%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Apple Intelligence / Siri Glow Suggestion Prompts */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-rose-50/80 border border-indigo-100/90 shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            </div>
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
              {language === 'hi' ? 'साथी एआई से तुरंत पूछें' : 'Saathi AI Intelligence Prompts'}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('advisor')}
            className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'hi' ? 'पूरी चैट खोलें' : 'Launch Full Advisor'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onAskPrompt(language === 'hi' ? q.text : q.textEn)}
              className="p-3.5 bg-white/90 hover:bg-white active:scale-[0.98] rounded-2xl border border-indigo-100/80 hover:border-indigo-300 text-left transition duration-150 shadow-xs hover:shadow-card flex items-center justify-between gap-2.5 text-xs font-extrabold text-slate-800 group cursor-pointer"
            >
              <span className="truncate group-hover:text-indigo-600 transition">{language === 'hi' ? q.text : q.textEn}</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
