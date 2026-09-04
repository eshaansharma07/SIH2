import React from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  PlusCircle, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { CreditGauge } from '../components/CreditGauge';
import { WarliBorder, WarliSun } from '../components/WarliMotif';
import { SaathiAvatar } from '../components/SaathiAvatar';
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

  const metrics = creditData?.metrics || {
    totalIncome: summaryData?.totalIncome || 148500,
    netSurplus: summaryData?.netSurplus || 42800,
    totalUdhaarPending: summaryData?.pendingUdhaar || 4650,
    digitalSharePct: summaryData?.digitalSharePct || 34,
    loggedDaysCount: 84
  };

  const sampleQuestions = [
    { text: "दिवाली के लिए तेल और चीनी का कितना स्टॉक लूँ?", textEn: "How much stock of oil & sugar for Diwali?", topic: "festival_stock" },
    { text: "ग्राहक उधार बहुत मांग रहे हैं, क्या करूँ?", textEn: "How do I manage customer udhaar?", topic: "udhaar_management" },
    { text: "नया डीप-फ्रीज़र लेने के लिए कौन सा मुद्रा लोन मिलेगा?", textEn: "Which MUDRA loan fits for a deep freezer?", topic: "loan_freezer" },
    { text: "अपनी दुकान का वैकल्पिक क्रेडिट स्कोर 750+ कैसे करें?", textEn: "How to raise credit score above 750?", topic: "credit_boost" }
  ];

  const festivalList = cuesData?.festivalCues || [
    {
      id: "navratri-dussehra",
      festival: "Sharad Navratri & Dussehra",
      festivalHi: "शारदीय नवरात्रि एवं विजयदशमी (दशहरा)",
      timing: "Oct 11 – Oct 20 (In 37 days)",
      timingHi: "11 अक्तूबर – 20 अक्तूबर (37 दिन शेष)",
      daysRemaining: 37,
      demandSurge: "+38%",
      priorityItems: "Sabudana, Kuttu & Singhadha flour, Sendha namak, Mustard oil, Desi ghee, Pooja brass thalis, Dhoop & Camphor",
      priorityItemsHi: "साबूदाना, कुट्टू व सिंघाड़ा आटा, सेंधा नमक, सरसों तेल, देशी घी, पीतल पूजा थाली, धूप-बत्ती व कपूर",
      verifiedByGoogleCalendar: true
    },
    {
      id: "diwali-dhanteras",
      festival: "Dhanteras, Diwali & Bhai Dooj",
      festivalHi: "धनतेरस, दीपावली एवं भाई दूज",
      timing: "Nov 6 – Nov 11 (In 63 days)",
      timingHi: "6 नवंबर – 11 नवंबर (63 दिन शेष)",
      daysRemaining: 63,
      demandSurge: "+48%",
      priorityItems: "Dry fruits gift hampers, Sugar, Besan, Maida, Vanaspati & Mustard oil, Clay diyas, Mithai ingredients",
      priorityItemsHi: "मेवा गिफ्ट पैक (काजू/बादाम), चीनी, बेसन, मैदा, रिफाइंड व सरसों तेल, मिट्टी के दीये, मिठाई का सामान",
      verifiedByGoogleCalendar: true
    },
    {
      id: "chhath-puja",
      festival: "Chhath Puja (सूर्य षष्ठी महापर्व)",
      festivalHi: "छठ पूजा (सूर्य षष्ठी महापर्व)",
      timing: "Nov 15 (In 72 days)",
      timingHi: "15 नवंबर (72 दिन शेष)",
      daysRemaining: 72,
      demandSurge: "+42%",
      priorityItems: "Thekua wheat flour, Pure Desi Gur (Jaggery), Ghee, Bamboo Soop, Daura baskets, Camphor, Mustard oil",
      priorityItemsHi: "ठेकुआ आटा, शुद्ध देसी गुड़, घी, बांस का सूप, दौरा टोकरियां, कपूर, सरसों तेल व पूजा फल",
      verifiedByGoogleCalendar: true
    },
    {
      id: "kharif-harvest",
      festival: "Kharif Paddy Harvest & Mandi Cash Payouts",
      festivalHi: "खरीफ धान कटाई एवं मंडी भुगतान नकदी प्रवाह",
      timing: "Mid-to-Late November (In ~75 days)",
      timingHi: "मध्य-से-उत्तर नवंबर (लगभग 75 दिन शेष)",
      daysRemaining: 75,
      demandSurge: "+28%",
      priorityItems: "Bulk 50kg grain bags, Branded premium tea packs, Detergents, High-ticket consumer packaged goods",
      priorityItemsHi: "थोक 50 किग्रा अनाज बोरे, प्रीमियम चाय पत्ती, सर्फ-साबुन, ब्रांडेड बिस्कुट व किराना पैकेट्स",
      verifiedByGoogleCalendar: true
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Hero Welcome & Today's Hyper-Local Pulse */}
      <div className="bg-gradient-to-r from-terracotta-700 via-terracotta-800 to-terracotta-900 text-white rounded-3xl p-5 sm:p-7 shadow-paper-lg relative overflow-hidden">
        <div className="absolute right-4 top-2 opacity-15 pointer-events-none">
          <WarliSun size={160} className="text-ochre-200" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <SaathiAvatar size="sm" />
              <span className="text-xs font-bold text-ochre-300">
                {language === 'hi' ? 'सलाहकार साथी बुलेटिन' : 'Daily Advisor Bulletin'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-paper-50">
              {language === 'hi' 
                ? `राम राम ${shop?.owner_name || 'रमेश'} जी! 🙏` 
                : `Namaste, ${shop?.owner_name || 'Ramesh Kumar'}! 🙏`}
            </h1>
            <p className="text-xs sm:text-sm text-terracotta-100 leading-relaxed">
              {language === 'hi'
                ? `आपकी दुकान (${shop?.village || 'उतराउला देहात, बलरामपुर'}) के बही-खाते में पिछले 4 महीनों में 120 दिन का पूर्ण हिसाब दर्ज है। मानसून की मंदी के बाद त्योहारी उछाल में आपका वैकल्पिक क्रेडिट स्कोर (755/850) बैंक लोन के लिए तैयार है!`
                : `Your enterprise in ${shop?.village || 'Balrampur'} has 120 active days logged across 4 months (baseline, monsoon dip & festive surge). Your credit score (755/850) is Prime Bankable!`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={onStartDemoTour}
              className="px-4 py-3 bg-gradient-to-r from-ochre-400 via-amber-400 to-ochre-300 hover:brightness-105 active:scale-95 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 border border-ochre-200 transition"
            >
              <Sparkles className="w-4 h-4 text-terracotta-800 animate-spin" />
              <span>{language === 'hi' ? '🎬 2-मिनट लाइव डेमो' : '🎬 Start Live Demo'}</span>
            </button>
            <button
              onClick={onOpenKeypad}
              className="px-4 py-3 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/30 flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'hi' ? 'बिक्री दर्ज करें' : 'Log Sale'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('advisor')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-ochre-300" />
              <span>{language === 'hi' ? 'सलाहकार' : 'Ask AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Two Interactive Tiles: Demand Radar & Alternative Credit Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Tile: Hyper-Local Festival & Seasonal Demand Radar (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-paper-300 shadow-paper space-y-4">
          <div className="flex items-center justify-between border-b border-paper-200 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-ochre-100 text-ochre-800 rounded-xl">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-stone-900">
                  {t('dashboard.localDemandTitle')}
                </h2>
                <p className="text-[11px] text-stone-500">
                  📍 {shop?.district || 'Balrampur'} ({shop?.state || 'UP'}) — {shop?.trade_name || 'Kirana'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{language === 'hi' ? '🗓️ गूगल कैलेंडर सिंक' : '🗓️ Google Calendar API Synced'}</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {festivalList.map((item, idx) => {
              const festivalName = (language === 'hi' && item.festivalHi) ? item.festivalHi : item.festival;
              const timingText = (language === 'hi' && item.timingHi) ? item.timingHi : item.timing;
              const stockText = (language === 'hi' && item.priorityItemsHi) ? item.priorityItemsHi : item.priorityItems;

              return (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-2xl bg-paper-50 border border-paper-300 hover:border-ochre-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-stone-800">{festivalName}</span>
                      <span className="text-[10px] bg-terracotta-100 text-terracotta-800 px-2 py-0.5 rounded-md font-bold">
                        {timingText}
                      </span>
                      {item.daysRemaining !== undefined && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-0.5">
                          <span>⏳</span>
                          <span>{language === 'hi' ? `${item.daysRemaining} दिन शेष` : `${item.daysRemaining}d left`}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600">
                      <span className="font-bold text-stone-700">{language === 'hi' ? 'जरूरी सामान: ' : 'Priority Stock: '}</span>
                      {stockText}
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 bg-white sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-xl border sm:border-0 border-paper-200">
                    <span className="text-[11px] text-stone-500 font-semibold">
                      {language === 'hi' ? 'अनुमानित बिक्री उछाल' : 'Projected Surge'}
                    </span>
                    <span className="text-sm font-black text-forestRural-700 bg-forestRural-50 px-2 py-0.5 rounded-lg border border-forestRural-200">
                      {item.demandSurge}
                    </span>
                    {item.verifiedByGoogleCalendar && (
                      <span className="text-[9px] text-emerald-700 font-medium hidden sm:inline mt-0.5">
                        ✓ Google Calendar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong className="font-bold">{language === 'hi' ? 'सलाहकार टिप: ' : 'Advisor Alert: '}</strong>
              {language === 'hi' 
                ? 'दीपावली से 10 दिन पहले बलरामपुर थोक मंडी में खाद्य तेल और चीनी के दाम ₹4–₹5 प्रति किलो बढ़ सकते हैं। इस बुधवार को 35% अतिरिक्त स्टॉक बुक करें।'
                : 'Wholesale edible oil and sugar prices typically spike in Balrampur mandi 10 days before Diwali. Pre-stock by Wednesday to lock low wholesale rates.'}
            </p>
          </div>
        </div>

        {/* Right Tile: Alternative Credit Score Gauge (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-paper-300 shadow-paper flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-paper-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-terracotta-100 text-terracotta-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-stone-900">
                    {t('dashboard.creditScoreTitle')}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    {language === 'hi' ? 'पारदर्शी 4 आधार • सिबिल मुक्त' : 'Explainable 4-Pillar Metric'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {creditData?.ratingBadge || 'Prime Bankable'}
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="py-2 flex justify-center">
              <CreditGauge 
                score={creditData?.totalScore || 750} 
                ratingLabel={creditData?.ratingLabel || 'अति उत्कृष्ट (Prime Bankable)'} 
                compact={false}
              />
            </div>

            {/* 4 Pillars Mini-Pills */}
            <div className="grid grid-cols-2 gap-2 my-3 text-[11px]">
              <div className="p-2 bg-paper-100 rounded-xl border border-paper-300">
                <span className="text-stone-500 block">{language === 'hi' ? 'बही-खाता नियमितता' : 'Cash Flow Logging'}</span>
                <span className="font-extrabold text-forestRural-700">96% (245/255 pts)</span>
              </div>
              <div className="p-2 bg-paper-100 rounded-xl border border-paper-300">
                <span className="text-stone-500 block">{language === 'hi' ? 'बिक्री स्थिरता' : 'Revenue Trend'}</span>
                <span className="font-extrabold text-forestRural-700">92% (195/212 pts)</span>
              </div>
              <div className="p-2 bg-paper-100 rounded-xl border border-paper-300">
                <span className="text-stone-500 block">{language === 'hi' ? 'उधार अनुशासन' : 'Udhaar Discipline'}</span>
                <span className="font-extrabold text-forestRural-700">88% (188/213 pts)</span>
              </div>
              <div className="p-2 bg-paper-100 rounded-xl border border-paper-300">
                <span className="text-stone-500 block">{language === 'hi' ? 'व्यापार अनुभव' : 'Vintage & UPI'}</span>
                <span className="font-extrabold text-forestRural-700">85% (145/170 pts)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('credit')}
            className="w-full py-2.5 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-800 border border-terracotta-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <span>{language === 'hi' ? 'स्कोर विवरण एवं सुधार कैलकुलेटर देखें' : 'View Breakdown & Simulator'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 3. 90-Day Cash Flow Snapshot (4 Metrics) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-extrabold text-stone-900">
            {t('dashboard.financialSummaryTitle')}
          </h2>
          <button
            onClick={() => onNavigateTab('cashflow')}
            className="text-xs font-bold text-terracotta-700 hover:text-terracotta-800 flex items-center gap-1"
          >
            <span>{language === 'hi' ? 'पूरा बही-खाता खोलें' : 'Open Full Bahi-Khata'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          <div className="bg-white p-4 rounded-2xl border border-paper-300 shadow-sm">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              {t('dashboard.totalSales')}
            </span>
            <div className="text-xl sm:text-2xl font-black text-stone-900">
              ₹{metrics.totalIncome.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-forestRural-700 font-bold bg-forestRural-50 px-2 py-0.5 rounded mt-1 inline-block">
              ✓ {metrics.loggedDaysCount} {language === 'hi' ? 'दिन दर्ज' : 'days logged'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-paper-300 shadow-sm">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              {t('dashboard.netSurplus')}
            </span>
            <div className="text-xl sm:text-2xl font-black text-forestRural-700">
              ₹{metrics.netSurplus.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-stone-500 font-medium mt-1 block">
              {language === 'hi' ? 'माल व दुकान खर्च काटकर' : 'After inventory & rent'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-paper-300 shadow-sm">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              {t('dashboard.pendingUdhaar')}
            </span>
            <div className="text-xl sm:text-2xl font-black text-ochre-700">
              ₹{metrics.totalUdhaarPending.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-ochre-800 font-bold bg-ochre-50 px-2 py-0.5 rounded mt-1 inline-block">
              {language === 'hi' ? 'बिक्री का 18% (सुरक्षित)' : '18% of sales (Healthy)'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-paper-300 shadow-sm">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              {t('dashboard.digitalShare')}
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigoRural-700">
              {metrics.digitalSharePct}%
            </div>
            <span className="text-[10px] text-indigoRural-800 font-bold bg-indigoRural-50 px-2 py-0.5 rounded mt-1 inline-block">
              📱 PhonePe / UPI QR
            </span>
          </div>

        </div>
      </div>

      {/* 4. Peer Benchmarking Card & Quick Ask Saathi Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* District Peer Benchmark Card (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border-2 border-paper-300 shadow-paper space-y-4">
          <div className="flex items-center gap-2.5 border-b border-paper-200 pb-3">
            <span className="p-2 bg-indigoRural-100 text-indigoRural-800 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                {t('dashboard.peerBenchTitle')}
              </h2>
              <p className="text-[11px] text-stone-500">
                {t('dashboard.peerBenchSub')}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-paper-50 rounded-xl border border-paper-200">
              <span className="text-stone-600 font-semibold">
                {language === 'hi' ? 'बलरामपुर किराना औसत मासिक बिक्री:' : 'District Kirana Avg Monthly Turnover:'}
              </span>
              <span className="font-extrabold text-stone-900">₹42,000 – ₹65,000</span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-paper-50 rounded-xl border border-paper-200">
              <span className="text-stone-600 font-semibold">
                {language === 'hi' ? 'आपकी दुकान की वर्तमान स्थिति:' : 'Your Shop\'s Current Position:'}
              </span>
              <span className="font-extrabold text-forestRural-700 bg-forestRural-50 px-2 py-0.5 rounded-lg border border-forestRural-200">
                ₹52,000 / माह (Top 35% in District)
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-paper-50 rounded-xl border border-paper-200">
              <span className="text-stone-600 font-semibold">
                {language === 'hi' ? 'औसत इन्वेंट्री टर्नओवर चक्र:' : 'Inventory Turnover Cycle:'}
              </span>
              <span className="font-extrabold text-stone-900">18 {language === 'hi' ? 'दिन' : 'days'}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-paper-50 rounded-xl border border-paper-200">
              <span className="text-stone-600 font-semibold">
                {language === 'hi' ? 'डिजिटल यूपीआई भुगतान हिस्सेदारी:' : 'Digital Payment Adoption:'}
              </span>
              <span className="font-extrabold text-stone-900">
                आप: {metrics.digitalSharePct}% (जिला औसत: 31%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-paper-100 border border-paper-300 text-[11px] text-stone-600 leading-relaxed">
            💡 <strong className="font-bold">{language === 'hi' ? 'निष्कर्ष: ' : 'Takeaway: '}</strong>
            {language === 'hi' 
              ? 'आपकी दुकान का टर्नओवर जिले के औसत से बेहतर है। आगामी त्योहार में ₹25,000 का अतिरिक्त माल उठाने पर आप ₹8,000–₹12,000 का अतिरिक्त शुद्ध लाभ कमा सकते हैं।'
              : 'Your shop ranks in the top tier of Balrampur rural grocers. An additional ₹25,000 inventory buffer before Diwali will unlock ₹8,000–₹12,000 in net profit.'}
          </div>
        </div>

        {/* Quick Ask Saathi Chips (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border-2 border-paper-300 shadow-paper flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-paper-200 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-ochre-100 text-ochre-800 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-stone-900">
                    {t('dashboard.quickAskTitle')}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    {language === 'hi' ? '1-क्लिक में सवाल पूछें' : '1-Tap Plain-Language Inquiries'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-terracotta-700 bg-terracotta-50 px-2 py-0.5 rounded-full border border-terracotta-200">
                AI Powered
              </span>
            </div>

            <div className="space-y-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskPrompt(language === 'hi' ? q.text : q.textEn)}
                  className="w-full text-left p-3 rounded-2xl bg-paper-50 hover:bg-terracotta-50/70 border border-paper-300 hover:border-terracotta-400 transition group flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-stone-800 group-hover:text-terracotta-800 transition">
                    💬 {language === 'hi' ? q.text : q.textEn}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-terracotta-600 transition shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('schemes')}
            className="w-full py-3 bg-forestRural-50 hover:bg-forestRural-100 text-forestRural-800 border border-forestRural-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <span>🏛️ {language === 'hi' ? 'मुद्रा एवं अन्य सरकारी लोन पात्रता देखें (96% Match)' : 'Check MUDRA & Govt Loan Matches (96% Match)'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      <WarliBorder />

    </div>
  );
}
