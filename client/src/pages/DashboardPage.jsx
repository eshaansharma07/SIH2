import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  IndianRupee, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  Sparkles,
  Star,
  MessageSquare
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { safeStorage } from '../utils/safeStorage';
import { TricolorBrush } from '../components/TricolorBrush';
import { SurveyChecklistIcon } from '../components/SurveyChecklistIcon';
import { getHeroContent } from '../utils/greetingUtils';
import { getSiteText } from '../data/siteTranslations';

export function DashboardPage({ 
  shop, 
  onOpenKeypad, 
  onOpenWholesale,
  onNavigateTab
}) {
  const { language } = useTranslation();
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [surveyRating, setSurveyRating] = useState(5);
  const [surveyFeature, setSurveyFeature] = useState('khata');
  const [surveyFeedback, setSurveyFeedback] = useState('');
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const rawOwner = shop?.owner_name || 'Ramesh Ji';
  const shopOwner = rawOwner ? (rawOwner.charAt(0).toUpperCase() + rawOwner.slice(1)) : 'Ramesh Ji';
  
  const heroContent = useMemo(() => {
    return getHeroContent(language);
  }, [language]);

  const currentDateFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const handleBentoClick = (target, options = {}) => {
    if (target === 'wholesale') {
      onOpenWholesale?.();
    } else if (target === 'udhaar') {
      try { sessionStorage.setItem('saakhsetu_cashflow_tab', 'udhaar'); } catch (_) {}
      onNavigateTab?.('cashflow');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'udhaar' } }));
      }, 50);
    } else if (target === 'cashflow') {
      if (options.filter) {
        try { sessionStorage.setItem('saakhsetu_cashflow_filter', options.filter); } catch (_) {}
      }
      onNavigateTab?.('cashflow');
      if (options.filter) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('saakhsetu:filter-tx', { detail: { filter: options.filter } }));
        }, 50);
      }
    } else {
      onNavigateTab?.(target);
    }
  };

  // External action listener from Top Navigation Mega-Menu
  useEffect(() => {
    const handleDashAction = (e) => {
      const action = e.detail?.action;
      if (action === 'activity') {
        setTimeout(() => {
          const el = document.getElementById('recent-activity');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    try {
      const pendingAction = sessionStorage.getItem('saakhsetu_dashboard_action');
      if (pendingAction) {
        sessionStorage.removeItem('saakhsetu_dashboard_action');
        if (pendingAction === 'activity') {
          setTimeout(() => {
            const el = document.getElementById('recent-activity');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    } catch (_) {}

    window.addEventListener('saakhsetu:dashboard-action', handleDashAction);
    return () => window.removeEventListener('saakhsetu:dashboard-action', handleDashAction);
  }, []);

  const handleSurveySubmit = (e) => {
    e.preventDefault();
    try {
      safeStorage.setJSON('saakhsetu_merchant_feedback', {
        rating: surveyRating,
        feature: surveyFeature,
        feedback: surveyFeedback,
        submittedAt: new Date().toISOString()
      });
    } catch (_) {}
    setSurveySubmitted(true);
    setTimeout(() => {
      setSurveySubmitted(false);
      setSurveyOpen(false);
    }, 2200);
  };

  const bentoCards = [
    {
      id: 'sales',
      title: getSiteText(language, 'dashboard', 'cardSalesTitle', 'Sales'),
      description: getSiteText(language, 'dashboard', 'cardSalesDesc', 'View and manage your sales records'),
      icon: ShoppingCart,
      iconBg: 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]',
      action: () => handleBentoClick('cashflow', { filter: 'income' })
    },
    {
      id: 'customers',
      title: getSiteText(language, 'dashboard', 'cardCustomersTitle', 'Customers'),
      description: getSiteText(language, 'dashboard', 'cardCustomersDesc', 'Manage customer accounts and udhaar'),
      icon: Users,
      iconBg: 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]',
      action: () => handleBentoClick('udhaar')
    },
    {
      id: 'inventory',
      title: getSiteText(language, 'dashboard', 'cardInventoryTitle', 'Inventory'),
      description: getSiteText(language, 'dashboard', 'cardInventoryDesc', 'Track stock and get low-stock alerts'),
      icon: Package,
      iconBg: 'bg-[#E1F5FE] text-[#0277BD] border-[#B3E5FC]',
      action: () => handleBentoClick('wholesale')
    },
    {
      id: 'udhaar',
      title: getSiteText(language, 'dashboard', 'cardUdhaarTitle', 'Udhaar'),
      description: getSiteText(language, 'dashboard', 'cardUdhaarDesc', 'Manage pending and recovered payments'),
      icon: IndianRupee,
      iconBg: 'bg-[#FBE9E7] text-[#D84315] border-[#FFCCBC]',
      action: () => handleBentoClick('udhaar')
    },
    {
      id: 'purchases',
      title: getSiteText(language, 'dashboard', 'cardPurchasesTitle', 'Purchases'),
      description: getSiteText(language, 'dashboard', 'cardPurchasesDesc', 'View your purchase records'),
      icon: FileText,
      iconBg: 'bg-[#EDE7F6] text-[#4527A0] border-[#D1C4E9]',
      action: () => handleBentoClick('cashflow', { filter: 'expense' })
    },
    {
      id: 'expenses',
      title: getSiteText(language, 'dashboard', 'cardExpensesTitle', 'Expenses'),
      description: getSiteText(language, 'dashboard', 'cardExpensesDesc', 'Track your business expenses'),
      icon: BarChart3,
      iconBg: 'bg-[#E0F2F1] text-[#00695C] border-[#B2DFDB]',
      action: () => handleBentoClick('cashflow', { filter: 'expense' })
    }
  ];

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HERO SECTION (Editorial Rural Composition) */}
      <section className="w-full relative rounded-3xl bg-[#FAF7F2] border border-[#EFE9DF] p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Hero Typography */}
          <div className="lg:col-span-5 space-y-3 z-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 block">
              {heroContent.greeting}
            </span>
            
            <h1 className="font-serif font-black text-3xl sm:text-4xl xl:text-5xl text-stone-900 tracking-tight leading-none">
              {shopOwner}!
            </h1>

            <p className="font-sans font-bold text-stone-800 text-sm sm:text-base leading-snug pt-1">
              {heroContent.tagline}
            </p>

            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-sm">
              {heroContent.subtitle}
            </p>

            {/* Primary Single CTA: Record Sale */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenKeypad?.('income')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs sm:text-sm btn-tactile cursor-pointer"
              >
                <span>{heroContent.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Hero Visual & Handwritten Art */}
          <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end select-none">
            <div className="relative w-full max-w-[580px] rounded-2xl bg-[#FAF7F2] border border-[#EBE4D8] overflow-hidden shadow-2xs">
              <img 
                src="/assets/saakhsetu/overview-hero.png" 
                alt="Ramesh Kirana Store in Rural Bharat" 
                className="w-full h-auto object-contain select-none pointer-events-none"
              />
              {/* Authentic Motivational Calligraphic Strip */}
              <div className="px-4 py-2.5 bg-[#FAF7F2]/95 border-t border-[#EBE4D8] flex items-center justify-between flex-wrap gap-2">
                <span className="font-serif italic font-bold text-xs sm:text-sm text-[#0F3E2E] tracking-wide">
                  {getSiteText(language, 'dashboard', 'heroQuote', '"Small accounts make the big picture."')}
                </span>
                <TricolorBrush className="w-20 h-2.5 shrink-0" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. ACTIVITY & SURVEY ROW */}
      <section id="recent-activity" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Your Business Activity Bento Cards */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Section Header with Date Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 leading-tight">
                {getSiteText(language, 'dashboard', 'activityTitle', 'Your Business Activity')}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {getSiteText(language, 'dashboard', 'activitySub', 'Choose a section to view and manage your records.')}
              </p>
            </div>

            {/* Date Picker Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200/90 text-xs font-semibold text-stone-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>{getSiteText(language, 'dashboard', 'today', 'Today')}, {currentDateFormatted}</span>
            </div>
          </div>

          {/* 3x2 Bento Activity Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {bentoCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={card.action}
                  className="group relative rounded-2xl bg-white/95 hover:bg-white border border-stone-200/80 hover:border-emerald-800/30 p-4 sm:p-4.5 flex flex-col justify-between min-h-[120px] interactive-card cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Tinted Icon Badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.iconBg} transition-transform duration-200 group-hover:scale-110 group-hover:shadow-xs shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Small Navigation Arrow */}
                    <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-400 group-hover:bg-[#0F3E2E] group-hover:text-white flex items-center justify-center transition-all duration-200 shrink-0 group-hover:scale-110">
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-serif font-bold text-sm text-stone-900 group-hover:text-[#0F3E2E] transition-colors leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-normal">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right 4 Cols: Quick Survey Card */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex-1 rounded-2xl bg-white border border-stone-200/90 p-5 flex flex-col justify-between shadow-2xs hover-lift transition-all duration-200">
            
            {/* Top Row: Title & 2 min Badge */}
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-stone-900">
                {getSiteText(language, 'dashboard', 'surveyTitle', 'Quick Survey')}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold border border-stone-200/60">
                <Clock className="w-2.5 h-2.5" />
                <span>{getSiteText(language, 'dashboard', 'surveyTime', '2 min')}</span>
              </span>
            </div>

            {/* Checklist Illustration */}
            <div className="my-3 flex justify-center select-none">
              <SurveyChecklistIcon className="w-24 h-24 sm:w-28 sm:h-28" />
            </div>

            {/* Content Copy */}
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 leading-tight">
                {getSiteText(language, 'dashboard', 'surveyHeading', 'Help us serve you better')}
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed max-w-[240px] mx-auto">
                {getSiteText(language, 'dashboard', 'surveySub', 'Share your feedback and help improve Saakh Setu for rural businesses.')}
              </p>
            </div>

            {/* Action CTA: Take Survey */}
            <button
              type="button"
              onClick={() => setSurveyOpen(true)}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs flex items-center justify-center gap-1.5 btn-tactile cursor-pointer"
            >
              <span>{getSiteText(language, 'dashboard', 'surveyCta', 'Take Survey')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </section>

      {/* 3. GROWING TOGETHER WITH RURAL INDIA */}
      <section className="w-full relative rounded-3xl bg-[#FAF7F2] border border-[#EFE9DF] p-6 sm:p-8 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Text & CTA */}
          <div className="lg:col-span-6 space-y-2 z-10">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 leading-tight">
              {getSiteText(language, 'dashboard', 'growingHeading', 'Growing Together With Rural India')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md leading-relaxed">
              {getSiteText(language, 'dashboard', 'growingSub', 'Discover new schemes, build your bank dossier, and unlock more opportunities for your business.')}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('schemes')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs sm:text-sm btn-tactile cursor-pointer"
              >
                <span>{getSiteText(language, 'dashboard', 'growingCta', 'Explore Opportunities')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Dedicated Rural Village Landscape Artwork */}
          <div className="lg:col-span-6 flex justify-end select-none">
            <div className="w-full max-w-[540px] rounded-2xl bg-[#FAF7F2] border border-[#EAE3D6] overflow-hidden shadow-2xs">
              <img 
                src="/assets/saakhsetu/growing-together.png" 
                alt="Rural Village Landscape of Bharat" 
                className="w-full h-auto object-contain select-none pointer-events-none"
              />
              {/* Cultural Pride Caption Strip */}
              <div className="px-4 py-2 bg-[#FAF7F2]/95 border-t border-[#EAE3D6] flex items-center justify-between">
                <span className="font-serif font-bold text-xs text-[#0F3E2E] tracking-wider">
                  {getSiteText(language, 'dashboard', 'growingBadge', 'गाँव से गौरव तक')}
                </span>
                <TricolorBrush className="w-16 h-2 shrink-0" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CLEAN INSTITUTIONAL FOOTER */}
      <footer className="pt-4 pb-12 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <div className="flex items-center gap-2 text-center sm:text-left flex-wrap">
          <span className="font-bold text-stone-800">© 2026 Saakh Setu</span>
          <span className="text-stone-300">•</span>
          <span>Bridging Businesses to Credit</span>
          <span className="text-stone-300">•</span>
          <span className="font-semibold text-emerald-800">Built for Bharat</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium text-stone-600">
          <button 
            type="button" 
            onClick={() => alert('Saakh Setu adheres to strict RBI Priority Sector Lending borrower data privacy principles. All merchant records remain confidential.')}
            className="hover:text-stone-900 transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <button 
            type="button" 
            onClick={() => alert('Saakh Setu MSME Terms: Governed under RBI PSL norms and MSMED Act framework for Indian micro-enterprises.')}
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
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-2.5 text-stone-500">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-stone-800 cursor-pointer font-bold" aria-label="LinkedIn">in</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-stone-800 cursor-pointer font-bold" aria-label="Twitter">𝕏</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-stone-800 cursor-pointer font-bold" aria-label="YouTube">▶</a>
          </div>
        </div>
      </footer>

      {/* QUICK SURVEY MODAL */}
      {surveyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            
            <button
              type="button"
              onClick={() => setSurveyOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>

            {surveySubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  {language === 'hi' ? 'धन्यवाद रमेश जी!' : 'Thank you Ramesh Ji!'}
                </h3>
                <p className="text-xs text-stone-600 max-w-xs mx-auto">
                  {language === 'hi'
                    ? 'आपकी प्रतिक्रिया ग्रामीण भारत के 6.3 करोड़ सूक्ष्म उद्यमियों को सशक्त बनाने में मदद करेगी।'
                    : 'Your valuable feedback helps strengthen Vyapaar Setu for 63 million micro-enterprises across Bharat.'
                  }
                </p>
              </div>
            ) : (
              <form onSubmit={handleSurveySubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 block">
                    Merchant Survey • 2 min
                  </span>
                  <h3 className="font-serif font-bold text-lg text-stone-900 mt-0.5">
                    {language === 'hi' ? 'आपकी राय हमारे लिए महत्वपूर्ण है' : 'Help us serve you better'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'hi' ? '3 छोटे प्रश्नों के उत्तर दें' : 'Answer 3 quick questions'}
                  </p>
                </div>

                {/* Question 1: Rating */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 block">
                    1. {language === 'hi' ? 'व्यापार सेतु का उपयोग करना कितना आसान है?' : 'How easy is Vyapaar Setu to use for daily business?'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSurveyRating(star)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          star <= surveyRating 
                            ? 'bg-amber-100 text-amber-600' 
                            : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${star <= surveyRating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-stone-600 ml-2">
                      {surveyRating === 5 ? '⭐⭐⭐⭐⭐ Excellent' : `${surveyRating} / 5`}
                    </span>
                  </div>
                </div>

                {/* Question 2: Favorite feature */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 block">
                    2. {language === 'hi' ? 'कौन सी सुविधा आपके लिए सबसे उपयोगी रही?' : 'Which feature helped your store the most?'}
                  </label>
                  <select
                    value={surveyFeature}
                    onChange={(e) => setSurveyFeature(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#0F3E2E]"
                  >
                    <option value="khata">Daily Bahi-Khata & Voice Entry</option>
                    <option value="udhaar">Customer Udhaar WhatsApp Reminders</option>
                    <option value="credit">Alternative Credit Score (RBI PSL)</option>
                    <option value="schemes">Government Scheme Matcher (MUDRA / SVANidhi)</option>
                    <option value="wholesale">ONDC Wholesale Group Purchasing</option>
                  </select>
                </div>

                {/* Question 3: Comments */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 block">
                    3. {language === 'hi' ? 'कोई अन्य सुझाव या आवश्यकता?' : 'Any suggestions for your village or store?'}
                  </label>
                  <textarea
                    rows={2}
                    value={surveyFeedback}
                    onChange={(e) => setSurveyFeedback(e.target.value)}
                    placeholder={language === 'hi' ? 'अपनी बात यहाँ लिखें...' : 'Tell us what you would like improved...'}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSurveyOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900"
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    {language === 'hi' ? 'जमा करें →' : 'Submit Feedback →'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
