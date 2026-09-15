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
    <div className="space-y-7 animate-fadeIn pb-16">
      
      {/* 1. Sovereign Vyapaar Bharat Pass (Apple Card Titanium x National DPI) */}
      <div className="titanium-pass relative overflow-hidden rounded-4xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-7 sm:p-9 shadow-sovereign border border-slate-700/60 transition-all duration-300 group">
        
        {/* Subtle Sovereign Mesh & Holographic Light Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/20 via-saffron-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-105 transition duration-700" />
        <div className="absolute -bottom-16 -left-16 w-88 h-88 bg-chakra-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* National Pass Top Watermark Strip */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-slate-200 backdrop-blur-md border border-white/15 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-[11px] tracking-wider uppercase text-slate-100">
                {language === 'hi' ? 'सत्यापित सूक्ष्म उद्यम (UDYAM VERIFIED)' : 'UDYAM VERIFIED MSME'}
              </span>
            </div>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="font-mono text-[11px] text-slate-400 font-bold tracking-widest">
              UDYAM-UP-18-0092478
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-black text-[11px] border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>RBI PSL Tier-A Prime</span>
            </span>
            <span className="text-slate-400 text-xs font-semibold hidden md:inline">
              Vintage: 48 Mo.
            </span>
          </div>
        </div>

        {/* Core Pass Body */}
        <div className="relative z-10 pt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <span className="text-xs font-black text-saffron-400 tracking-widest uppercase">
                {language === 'hi' ? 'राष्ट्रीय सूक्ष्म-उद्यम डिजिटल पास' : 'National Micro-Enterprise Sovereign Pass'}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display text-white">
                {shop?.name || 'Ramesh Kirana & General Store'}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-normal flex items-center gap-2 pt-0.5">
                <span className="font-semibold text-white">{shop?.owner_name || 'Ramesh Kumar'} (Proprietor)</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{shop?.village || 'Utraula Dehat'}, {shop?.district || 'Balrampur'} (UP)</span>
              </p>
            </div>

            {/* Turnover & Surplus Highlights */}
            <div className="flex flex-wrap items-baseline gap-6 pt-2">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  {language === 'hi' ? '90-दिवसीय सत्यापित कारोबार' : '90-Day Audited Turnover'}
                </span>
                <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums font-display text-white">
                  ₹{metrics.totalIncome.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="border-l border-white/15 pl-6">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  {language === 'hi' ? 'शुद्ध परिचालन अधिशेष' : 'Net Operating Surplus'}
                </span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums font-display text-emerald-400">
                  ₹{metrics.netSurplus.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Apple Matte / Frosted Style) */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={onOpenKeypad}
              className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition duration-150 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>{language === 'hi' ? 'खाते में लेनदेन दर्ज करें' : '+ Log Ledger Entry'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('advisor')}
              className="px-6 py-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'hi' ? 'एआई मंडी सलाहकार' : 'AI Mandi Advisor'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('dossier')}
              className="px-5 py-3 rounded-2xl bg-white/8 hover:bg-white/14 active:scale-95 text-slate-200 font-semibold text-xs sm:text-sm border border-white/12 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'hi' ? 'बैंक डॉसियर डाउनलोड' : 'Official Bank Dossier'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2. Apple Bento Metric Grid (Keynote Presentation Tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Tile 1: Audited Revenue */}
        <div className="bento-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between group cursor-default">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>{language === 'hi' ? 'कुल बिक्री' : 'Audited Revenue'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tabular-nums tracking-tight font-display">
              ₹{metrics.totalIncome.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>{metrics.loggedDaysCount} {language === 'hi' ? 'दिन रिकॉर्डेड' : 'audited days'}</span>
            <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">● Live</span>
          </div>
        </div>

        {/* Tile 2: Operating Outlay */}
        <div className="bento-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between group cursor-default">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>{language === 'hi' ? 'माल व दुकान खर्च' : 'Operating Outlay'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tabular-nums tracking-tight font-display">
              ₹{metrics.totalExpense.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>{language === 'hi' ? 'थोक खरीद + किराया' : 'Stock & utilities'}</span>
            <span className="text-slate-500 font-semibold text-[10px]">71.8% of rev</span>
          </div>
        </div>

        {/* Tile 3: Net Surplus */}
        <div className="bento-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between group cursor-default">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>{language === 'hi' ? 'शुद्ध बचत' : 'Net Operating Surplus'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs shadow-indigo-500/50" />
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 tabular-nums tracking-tight font-display">
              ₹{metrics.netSurplus.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>+28.2% {language === 'hi' ? 'मजबूत मार्जिन' : 'retained margin'}</span>
            <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">Prime</span>
          </div>
        </div>

        {/* Tile 4: Pending Khata */}
        <div className="bento-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between group cursor-default">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>{language === 'hi' ? 'बकाया उधार' : 'Pending Khata'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-600 tabular-nums tracking-tight font-display">
              ₹{metrics.totalUdhaarPending.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>{language === 'hi' ? 'सुरक्षित सीमा (<1.7%)' : 'Healthy ratio (<2%)'}</span>
            <span className="text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded-full">Protected</span>
          </div>
        </div>

      </div>

      {/* 3. Apple Bento Hero Grid: Demand Radar (7 Cols) & Credit Health (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Seasonal Demand Radar (7 Cols Bento Tile) */}
        <div className="lg:col-span-7 bento-card rounded-4xl p-6 sm:p-7 space-y-5">
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
                  {shop?.district || 'Balrampur'} Mandi Demand Intelligence
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
                      <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Recommended Stock</span>
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

        {/* Right: Credit Score & Health Dial (5 Cols Bento Tile) */}
        <div className="lg:col-span-5 bento-card rounded-4xl p-6 sm:p-7 flex flex-col justify-between gap-5">
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

          {/* 4 Pillars Mini Activity Bars (Apple Watch Ring Style) */}
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
