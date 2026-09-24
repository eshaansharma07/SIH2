import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  Clock, 
  MapPin, 
  ChevronRight,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export function SeasonalDemandCalendarWidget({ shop, onOpenWholesale, onNavigateTab }) {
  const { language } = useTranslation();
  const district = shop?.district || 'Balrampur';
  const state = shop?.state || 'Uttar Pradesh';

  // Curated seasonal festival & harvest demand radar events
  const seasonalEvents = [
    {
      id: 'navratri-dussehra',
      nameEn: 'Sharad Navratri & Dussehra',
      nameHi: 'शारदीय नवरात्रि व दशहरा',
      dateRangeEn: 'Oct 3 – Oct 12',
      dateRangeHi: '3 अक्टूबर – 12 अक्टूबर',
      statusEn: 'Surge in 2 Weeks',
      statusHi: '2 सप्ताह में मांग उछाल',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      predictedSurge: '+35%',
      topCategoriesEn: ['Puja Essentials', 'Pure Desi Ghee', 'Dry Fruits', 'Sabudana & Singhadha Atta'],
      topCategoriesHi: ['पूजा सामग्री', 'शुद्ध देसी घी', 'सूखे मेवे', 'साबूदाना व सिंघाड़ा आटा'],
      mandiAdviceEn: 'Procure pure ghee and festive packaging before regional APMC mandi prices rise ₹8–₹12/unit.',
      mandiAdviceHi: 'मंडी में भाव ₹8–₹12/इकाई बढ़ने से पहले शुद्ध घी और पूजा सामग्री का 30% अतिरिक्त स्टॉक सुरक्षित करें।',
      suggestedWholesaleCategory: 'grocery'
    },
    {
      id: 'diwali-dhanteras',
      nameEn: 'Deepavali & Dhanteras Peak',
      nameHi: 'दीपावली एवं धनतेरस महा-बिक्री',
      dateRangeEn: 'Oct 29 – Nov 3',
      dateRangeHi: '29 अक्टूबर – 3 नवंबर',
      statusEn: 'Peak Annual Surge',
      statusHi: 'वार्षिक शिखर मांग',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      predictedSurge: '+48%',
      topCategoriesEn: ['Mustard & Refined Oils', 'Sugar & Besan', 'Mithai Boxes', 'Counter Gift Packs'],
      topCategoriesHi: ['सरसों व रिफाइंड तेल', 'चीनी व बेसन', 'मिठाई डिब्बे', 'काउंटर उपहार पैक'],
      mandiAdviceEn: 'Working capital recommendation: Allocate ₹20,000–₹25,000 to wholesale edible oils to capture peak margin.',
      mandiAdviceHi: 'कार्यशील पूंजी सलाह: अधिकतम लाभ के लिए खाद्य तेलों और चीनी में ₹20,000–₹25,000 का अग्रिम कोटा लगाएं।',
      suggestedWholesaleCategory: 'edible-oil'
    },
    {
      id: 'paddy-harvest',
      nameEn: 'Kharif Paddy Harvest & Cash Inflow',
      nameHi: 'धान कटाई सत्र एवं ग्रामीण तरलता',
      dateRangeEn: 'Nov 15 – Dec 10',
      dateRangeHi: '15 नवंबर – 10 दिसंबर',
      statusEn: 'High Cash Liquidity',
      statusHi: 'उच्च नकद आवक',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      predictedSurge: '+28%',
      topCategoriesEn: ['Bulk Staples (Atta/Rice)', 'Soaps & Detergents', 'Tea & Biscuits'],
      topCategoriesHi: ['थोक राशन (आटा/चावल)', 'साबुन व डिटर्जेंट', 'चाय व बिस्कुट'],
      mandiAdviceEn: 'Farmers receive government MSP payments. Ideal window for 1-click WhatsApp customer udhaar recovery.',
      mandiAdviceHi: 'किसानों को धान का सरकारी भुगतान मिलेगा। ग्राहकों से पुराना बकाया वसूलने का यह सबसे अनुकूल समय है।',
      suggestedWholesaleCategory: 'staples'
    }
  ];

  const [selectedEventId, setSelectedEventId] = useState(seasonalEvents[0].id);
  const activeEvent = seasonalEvents.find(e => e.id === selectedEventId) || seasonalEvents[0];

  const handleConsultAI = (event) => {
    const prompt = language === 'hi'
      ? `${event.nameHi} के लिए मुझे कितना स्टॉक करना चाहिए और थोक भाव का क्या अनुमान है?`
      : `What stock should I prepare for ${event.nameEn} and what are the wholesale price expectations in ${district}?`;
    
    // Dispatch global event for floating AI advisor
    window.dispatchEvent(new CustomEvent('saakhsetu:open-advisor-prompt', {
      detail: { prompt }
    }));
  };

  return (
    <div className="w-full rounded-3xl bg-white border border-stone-200/90 shadow-2xs overflow-hidden">
      
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-stone-100 bg-[#FAF7F2]/80 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0F3E2E]/10 text-[#0F3E2E] text-[11px] font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'मौसमी मांग रडार व त्योहारी कैलेंडर' : 'Seasonal Demand Radar & Festive Calendar'}</span>
          </div>
          <h2 className="font-serif font-black text-xl text-stone-900 tracking-tight">
            {language === 'hi' 
              ? `${district} जिले का आगामी मांग पूर्वानुमान` 
              : `Upcoming Demand Forecast for ${district} District`}
          </h2>
          <p className="text-xs text-stone-500 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-stone-400" />
            <span>{district}, {state} • {language === 'hi' ? 'एपीएमसी मंडी और त्योहारी कैलेंडर द्वारा संचालित' : 'Powered by APMC Mandi & Calendar Intelligence'}</span>
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl border border-stone-200 text-xs shadow-2xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="font-semibold text-stone-700">
            {language === 'hi' ? 'अगले 60 दिन: +38% औसत ग्रामीण मांग वृद्धि' : 'Next 60 Days: +38% Avg Rural Demand Surge'}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Event Selector Left, Deep Dive Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
        
        {/* Left 5 Cols: Interactive Calendar Timeline Selector */}
        <div className="lg:col-span-5 p-4 sm:p-5 space-y-2.5 bg-stone-50/40">
          <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 px-1 block">
            {language === 'hi' ? 'आगामी प्रमुख तिथियां व चक्र' : 'UPCOMING CYCLES & MILESTONES'}
          </span>

          <div className="space-y-2">
            {seasonalEvents.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected 
                      ? 'bg-white border-[#0F3E2E] shadow-sm ring-1 ring-[#0F3E2E]/20' 
                      : 'bg-white/80 hover:bg-white border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-stone-900 leading-snug">
                      {language === 'hi' ? evt.nameHi : evt.nameEn}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${evt.badgeColor}`}>
                      {language === 'hi' ? evt.statusHi : evt.statusEn}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 mt-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{language === 'hi' ? evt.dateRangeHi : evt.dateRangeEn}</span>
                    </div>
                    <div className="font-bold text-emerald-700 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{evt.predictedSurge} {language === 'hi' ? 'मांग' : 'Demand'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Detailed Demand Breakdown & Direct Actions */}
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Active Event Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F3E2E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-block mb-1">
                  {language === 'hi' ? 'विस्तृत कार्ययोजना' : 'Actionable Intelligence'}
                </span>
                <h3 className="font-serif font-black text-lg sm:text-xl text-stone-900">
                  {language === 'hi' ? activeEvent.nameHi : activeEvent.nameEn}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {language === 'hi' ? activeEvent.dateRangeHi : activeEvent.dateRangeEn} • {district} Mandi Zone
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  {language === 'hi' ? 'अनुमानित उछाल' : 'Projected Lift'}
                </span>
                <span className="font-serif font-black text-2xl text-emerald-700">
                  {activeEvent.predictedSurge}
                </span>
              </div>
            </div>

            {/* High Demand Product Categories Tags */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-stone-700 block">
                {language === 'hi' ? 'सर्वोच्च मांग वाले उत्पाद (Top Demand Categories):' : 'Key In-Demand Categories:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(language === 'hi' ? activeEvent.topCategoriesHi : activeEvent.topCategoriesEn).map((cat, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E7DFD5] text-xs font-semibold text-stone-800"
                  >
                    <PackageCheck className="w-3.5 h-3.5 text-[#0F3E2E]" />
                    <span>{cat}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Mandi & Working Capital Advisory Note */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{language === 'hi' ? 'थोक मंडी एवं नकदी योजना:' : 'Mandi & Cash-Flow Advisory:'}</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-amber-800">
                {language === 'hi' ? activeEvent.mandiAdviceHi : activeEvent.mandiAdviceEn}
              </p>
            </div>

          </div>

          {/* Bottom Action Triggers */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenWholesale?.()}
              className="flex-1 min-w-[170px] py-2.5 px-4 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold shadow-2xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ONDC थोक दरें देखें' : 'View ONDC Wholesale Quotes'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleConsultAI(activeEvent)}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0F3E2E]" />
              <span>{language === 'hi' ? 'AI से स्टॉक सलाह लें' : 'Consult Setu AI'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
