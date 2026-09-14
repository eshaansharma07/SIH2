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
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Apple Card Style Financial Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
        
        {/* Subtle Ambient Mesh Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-semibold backdrop-blur-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{shop?.village || 'Utraula Dehat'}, {shop?.district || 'Balrampur'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                {shop?.trade_name || 'Kirana & General'}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans text-white">
                {language === 'hi' 
                  ? `राम राम, ${shop?.owner_name || 'रमेश'} जी` 
                  : `Good afternoon, ${shop?.owner_name || 'Ramesh Kumar'}`}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                {language === 'hi'
                  ? 'आपकी दुकान का 4 माह का हिसाब पूर्ण है और बैंक ऋण पात्रता सक्रिय है।'
                  : '4-month cash flow audited • Prime Bankable status active for micro-loans.'}
              </p>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums text-white">
                ₹{metrics.totalIncome.toLocaleString('en-IN')}
              </div>
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                +28.8% Net Surplus (₹{metrics.netSurplus.toLocaleString('en-IN')})
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={onOpenKeypad}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'hi' ? 'बिक्री दर्ज करें' : 'Log Transaction'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('advisor')}
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>{language === 'hi' ? 'एआई सलाहकार' : 'Ask AI'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('dossier')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-slate-200 font-semibold text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-1.5 transition"
              title="Official Bank Loan Dossier"
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'hi' ? 'बैंक फाइल' : 'Dossier'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Minimalist Financial Metric Cards (Apple Wallet / Stripe Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition duration-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{language === 'hi' ? 'कुल बिक्री' : 'Total Revenue'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
            ₹{metrics.totalIncome.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            {metrics.loggedDaysCount} {language === 'hi' ? 'दिन का रिकॉर्ड' : 'days logged'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition duration-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{language === 'hi' ? 'माल व दुकान खर्च' : 'Operating Costs'}</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
            ₹{metrics.totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            {language === 'hi' ? 'थोक खरीद + किराया' : 'Stock & bills paid'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition duration-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{language === 'hi' ? 'शुद्ध बचत' : 'Net Surplus'}</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums tracking-tight">
            ₹{metrics.netSurplus.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1">
            +28.8% {language === 'hi' ? 'सकारात्मक मार्जिन' : 'healthy margin'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition duration-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{language === 'hi' ? 'बकाया उधार' : 'Pending Khata'}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tabular-nums tracking-tight">
            ₹{metrics.totalUdhaarPending.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            {language === 'hi' ? 'सुरक्षित सीमा में (18%)' : 'Healthy low ratio (<20%)'}
          </div>
        </div>

      </div>

      {/* 3. Interactive Split: Seasonal Demand Radar & Credit Score Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Seasonal Demand Radar (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {language === 'hi' ? 'मौसमी मांग रडार (Demand Radar)' : 'Seasonal Demand Radar'}
                </h2>
                <p className="text-xs text-slate-500">
                  {shop?.district || 'Balrampur'} Mandi Demand Projections
                </p>
              </div>
            </div>

            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Calendar Synced</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {festivalList.map((item, idx) => {
              const name = (language === 'hi' && item.festivalHi) ? item.festivalHi : item.festival;
              const timing = (language === 'hi' && item.timingHi) ? item.timingHi : item.timing;
              const stock = (language === 'hi' && item.priorityItemsHi) ? item.priorityItemsHi : item.priorityItems;

              return (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition border border-slate-200/70 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900 truncate">{name}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                        ⏳ {item.daysRemaining}d
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      📅 {timing}
                    </div>
                    <div className="text-[11px] text-slate-700 font-semibold bg-white p-2 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 font-bold">Stock: </span>
                      {stock}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-xs">
                    <span className="text-slate-500 font-medium">{language === 'hi' ? 'बिक्री उछाल' : 'Surge'}</span>
                    <span className="font-extrabold text-emerald-600">{item.demandSurge}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Credit Score & Health Dial (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {language === 'hi' ? 'वैकल्पिक क्रेडिट स्वास्थ्य' : 'Alternative Credit Health'}
                </h2>
                <p className="text-xs text-slate-500">4-Pillar Non-CIBIL Metric</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('credit')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
            >
              <span>{language === 'hi' ? 'सिम्युलेटर' : 'Simulate'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-2">
            <CreditGauge 
              score={creditData?.totalScore || 755} 
              ratingLabel={language === 'hi' ? 'Prime Bankable (ऋण के लिए पात्र)' : 'Prime Bankable'}
            />
          </div>

          {/* 4 Pillars Mini Bars */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-semibold">{language === 'hi' ? 'बही-खाता निरंतरता' : 'Cash Flow Regularity'}</span>
              <span className="font-bold text-slate-900">96%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '96%' }} />
            </div>

            <div className="flex justify-between items-center text-slate-600 pt-1">
              <span className="font-semibold">{language === 'hi' ? 'मार्जिन एवं लाभ' : 'Surplus Margins'}</span>
              <span className="font-bold text-slate-900">92%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
            </div>
          </div>
        </div>

      </div>

      {/* 4. Galaxy AI / Siri Style Quick Suggestion Prompts */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/70 rounded-3xl p-5 sm:p-6 border border-indigo-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              {language === 'hi' ? 'साथी एआई से तुरंत पूछें' : 'Ask Saathi AI Assistant'}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('advisor')}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <span>{language === 'hi' ? 'पूरी चैट खोलें' : 'Open Full Chat'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onAskPrompt(language === 'hi' ? q.text : q.textEn)}
              className="p-3 bg-white hover:bg-slate-50 active:scale-[0.98] rounded-2xl border border-indigo-100 text-left transition shadow-xs flex items-center justify-between gap-2 text-xs font-bold text-slate-800 group"
            >
              <span className="truncate">{language === 'hi' ? q.text : q.textEn}</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
