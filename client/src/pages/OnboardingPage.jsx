import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Scissors, 
  Palette, 
  Milk, 
  Coffee, 
  Sprout, 
  Wrench, 
  Check, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  IndianRupee,
  AlertCircle,
  X,
  Loader2,
  LogIn,
  UserPlus,
  Phone,
  Lock,
  Store,
  KeyRound,
  ShieldCheck,
  TrendingUp,
  Activity,
  Award,
  ChevronDown
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../utils/api';
import { INDIAN_STATES_AND_UTS, findStandardState } from '../data/indianStates';
import { useTranslation } from '../i18n/LanguageContext';
import { APP_NAME_EN, APP_NAME_HI, APP_TAGLINE_EN, APP_TAGLINE_HI } from '../config/brand';
import { Card, Badge, Button, PageTitle, SectionHeading, FieldLabel, HelperText } from '../components/ui';

// Smooth counting hook for animated score and metrics
function useAnimatedCounter(targetValue, durationMs = 900, delayMs = 0, shouldReduce = false) {
  const [count, setCount] = useState(shouldReduce ? targetValue : 0);

  useEffect(() => {
    if (shouldReduce) {
      setCount(targetValue);
      return;
    }

    let startTimestamp = null;
    let animationFrameId = null;
    let timeoutId = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / durationMs, 1);
        // Ease-out quartic
        const ease = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(ease * targetValue));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(targetValue);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, durationMs, delayMs, shouldReduce]);

  return count;
}

export function OnboardingPage({ onComplete, onSelectDemo }) {
  const { language, setLanguage } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // Animated counters for the Hero Product Showcase
  const animatedScore = useAnimatedCounter(785, 950, 200, shouldReduceMotion);
  const animatedDays = useAnimatedCounter(120, 800, 350, shouldReduceMotion);
  const animatedSchemes = useAnimatedCounter(6, 750, 450, shouldReduceMotion);

  // Auth Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Saved accounts from local storage
  const [savedShops, setSavedShops] = useState([]);

  // Login Form States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('1234');

  // Registration Form States
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('1234');
  const [tradeType, setTradeType] = useState('kirana');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [vintageYears, setVintageYears] = useState(3);
  const [monthlyRevenue, setMonthlyRevenue] = useState(45000);

  // Shared Interaction States
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shakeError, setShakeError] = useState(false);

  // Available Trades for Registration
  const trades = [
    { id: 'kirana', name: 'किराना दुकान', nameEn: 'Kirana Store', icon: ShoppingBag, tint: 'bg-amber-50 text-amber-900 border-amber-200' },
    { id: 'tailor', name: 'सिलाई / टेलरिंग', nameEn: 'Tailoring Shop', icon: Scissors, tint: 'bg-rose-50 text-rose-900 border-rose-200' },
    { id: 'handloom', name: 'हस्तशिल्प / कारीगर', nameEn: 'Artisan & Craft', icon: Palette, tint: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
    { id: 'dairy', name: 'डेयरी / दूध केंद्र', nameEn: 'Dairy & Milk Center', icon: Milk, tint: 'bg-sky-50 text-sky-900 border-sky-200' },
    { id: 'tea', name: 'चाय / ढाबा', nameEn: 'Tea & Small Eatery', icon: Coffee, tint: 'bg-amber-50 text-amber-900 border-amber-200' },
    { id: 'agri', name: 'कृषि सेवा / खाद-बीज', nameEn: 'Agri-Inputs & Seeds', icon: Sprout, tint: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
    { id: 'repair', name: 'मरम्मत / वर्कशॉप', nameEn: 'Repair & Workshop', icon: Wrench, tint: 'bg-stone-100 text-stone-900 border-stone-300' }
  ];

  // Load saved accounts from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vyapaar_saved_shops');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedShops(parsed);
          setLoginPhone(parsed[0].phone || '');
          setLoginPassword(parsed[0].password || '1234');
        }
      }
    } catch (_) {}
  }, []);

  const triggerErrorShake = (msg) => {
    setErrorMsg(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      triggerErrorShake(language === 'hi' ? 'कृपया पंजीकृत मोबाइल नंबर दर्ज करें' : 'Please enter registered mobile phone number');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.loginShop(loginPhone.trim(), loginPassword.trim() || '1234');
      if (res.success && res.shop) {
        onComplete?.(res.shop);
      } else {
        triggerErrorShake(res.error || (language === 'hi' ? 'लॉगिन विफल। कृपया नंबर व पिन जांचें।' : 'Login failed. Please check phone and PIN.'));
      }
    } catch (err) {
      triggerErrorShake(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSavedShop = (saved) => {
    if (saved?.phone) {
      setLoginPhone(saved.phone);
      setLoginPassword(saved.password || '1234');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim() || !ownerName.trim()) {
      triggerErrorShake(language === 'hi' ? 'कृपया दुकान और दुकानदार का नाम दर्ज करें' : 'Please provide shop name and proprietor name');
      return;
    }
    if (!phone.trim()) {
      triggerErrorShake(language === 'hi' ? 'कृपया भविष्य में लॉगिन हेतु मोबाइल नंबर दर्ज करें' : 'Please enter mobile number for logging in later');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const selectedTrade = trades.find(t => t.id === tradeType);
      const res = await api.setupShop({
        name: shopName.trim(),
        owner_name: ownerName.trim(),
        trade_type: tradeType,
        trade_name: selectedTrade?.nameEn || 'Kirana Store',
        village: village.trim() || 'Village',
        district: district.trim() || 'District',
        state: state.trim() || 'Uttar Pradesh',
        vintage_years: vintageYears,
        monthly_revenue: monthlyRevenue,
        phone: phone.trim(),
        password: password.trim() || '1234',
        bank_account_type: 'Gramin Bank',
        ownership: 'rented'
      });
      onComplete?.(res.shop);
    } catch (err) {
      triggerErrorShake(err.message || 'Error creating shop');
    } finally {
      setLoading(false);
    }
  };

  const scrollToAuth = (mode = 'login') => {
    setAuthMode(mode);
    const el = document.getElementById('auth-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      
      {/* ========================================================
          1. FLOATING FROSTED GLASS MASTHEAD (Top Bar)
          ======================================================== */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#FAF8F5]/85 border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          
          {/* Brand Lockup */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-serif font-black text-lg shadow-sm shrink-0">
              स
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-stone-900 text-base sm:text-lg tracking-tight">
                  {APP_NAME_HI}
                </span>
                <span className="text-stone-300 font-light">•</span>
                <span className="font-sans font-bold text-stone-700 text-xs sm:text-sm tracking-tight">
                  {APP_NAME_EN}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium truncate hidden xs:block">
                {language === 'hi' ? 'बही-खाता से बैंक साख सेतु' : 'Your Ledger, Bridged to Credit'}
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Language Toggle Pill */}
            <div className="inline-flex p-0.5 rounded-full bg-stone-200/60 border border-stone-300/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-white text-stone-950 shadow-2xs font-black'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-stone-950 shadow-2xs font-black'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                English
              </button>
            </div>

            {/* Quick Evaluator Demo Button */}
            <button
              type="button"
              onClick={async () => {
                setDemoLoading(true);
                try {
                  await onSelectDemo?.();
                } finally {
                  setTimeout(() => setDemoLoading(false), 2000);
                }
              }}
              disabled={demoLoading || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-stone-900 hover:bg-stone-800 active:bg-black text-white shadow-xs transition-all cursor-pointer"
            >
              {demoLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {language === 'hi' ? 'जज डेमो' : 'Evaluator Demo'}
              </span>
              <span className="sm:hidden">Demo</span>
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================
          2. EXPANSIVE PRODUCT HERO (Editorial Dignity)
          ======================================================== */}
      <section className="relative w-full overflow-hidden pt-8 sm:pt-14 md:pt-18 pb-12 sm:pb-16 px-4 sm:px-6">
        
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.08),transparent_65%)]" />

        <div className="relative max-w-5xl mx-auto space-y-8 sm:space-y-12">
          
          {/* Header Typography Group */}
          <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] sm:text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span>
                {language === 'hi' 
                  ? 'आरबीआई (PSL) प्रारूप समर्थित • राष्ट्रीय सूक्ष्म उद्यम साख इंजन' 
                  : 'RBI Priority Sector Lending (PSL) Aligned • Smart India Hackathon 2026'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-stone-950 tracking-tight leading-[1.12]">
              {language === 'hi' 
                ? 'हर उधार, हर बिक्री — अब बैंक-योग्य साख' 
                : 'Your Ledger. Validated. Bank-Ready.'}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-stone-600 font-normal leading-relaxed max-w-2xl mx-auto">
              {language === 'hi'
                ? 'कागज़ी पर्चियों में दर्ज रोज़मर्रा का लेन-देन अब बैंक के लिए अदृश्य नहीं रहेगा। साख सेतु आपके दैनिक बही-खाते को बैंक-मान्य 4-पिलर क्रेडिट स्कोर और बिना गारंटी सरकारी ऋणों में बदलता है — बिना CIBIL या ITR की बाध्यता के।'
                : 'Pencil-written entries are no longer invisible to formal lenders. SaakhSetu translates your everyday transactions into an RBI-aligned alternative credit score (300–850) and unlocks collateral-free MSME loans without requiring formal ITR.'}
            </p>

          </div>

          {/* ========================================================
              HERO PRODUCT SHOWCASE: INTERACTIVE CREDIT FOLIO & PASS
              ======================================================== */}
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-stone-200/90 shadow-apple-floating overflow-hidden"
          >
            {/* Folio Top Identification Ribbon */}
            <div className="bg-stone-900 text-white px-6 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                    {language === 'hi' ? 'प्रमाणित सूक्ष्म उद्यम प्रोफ़ाइल' : 'Verified Enterprise Profile'}
                  </span>
                  <span className="text-stone-500">•</span>
                  <span className="text-[10px] font-mono text-stone-400">UDYAM-UP-00-0092478</span>
                </div>
                <h3 className="font-serif font-black text-lg sm:text-xl text-white tracking-tight">
                  {language === 'hi' ? "रमेश किराना स्टोर (Ramesh Kirana Store)" : "Ramesh's Kirana Store"}
                </h3>
                <p className="text-xs text-stone-400">
                  {language === 'hi' ? 'बलरामपुर, उत्तर प्रदेश • ग्रामीण रिटेल बही-खाता' : 'Balrampur, Uttar Pradesh • Rural Retail Ledger'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{language === 'hi' ? 'प्राइम पीएसएल टियर-१' : 'Prime PSL Tier-1'}</span>
                </span>
              </div>
            </div>

            {/* 3 Core Metric Pillars inside the Folio */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 bg-stone-50/40">
              
              {/* Pillar 1: Saakh Score */}
              <div className="p-6 sm:p-7 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                  <span>{language === 'hi' ? 'साख स्कोर' : 'Saakh Score'}</span>
                  <span className="font-mono text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    4 Pillars
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-serif font-black text-stone-900 tracking-tight tabular-nums">
                    {animatedScore}
                  </span>
                  <span className="text-sm font-bold text-stone-400">/ 850</span>
                </div>
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  {language === 'hi' 
                    ? 'बैंक-स्वीकृत रेटिंग (Prime Bankable)' 
                    : 'Bank-sanctioned Prime PSL credit tier'}
                </p>
              </div>

              {/* Pillar 2: Operating History */}
              <div className="p-6 sm:p-7 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                  <span>{language === 'hi' ? 'दैनिक खाता इतिहास' : 'Operating Ledger'}</span>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    100% Audited
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-serif font-black text-stone-900 tracking-tight tabular-nums">
                    {animatedDays}
                  </span>
                  <span className="text-sm font-bold text-stone-700">
                    {language === 'hi' ? 'दिन' : 'Days'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  {language === 'hi' 
                    ? 'अटूट नकद व यूपीआई लेन-देन निरंतरता' 
                    : 'Daily continuous cash & digital turnover'}
                </p>
              </div>

              {/* Pillar 3: Pre-matched Statutory Loans */}
              <div className="p-6 sm:p-7 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                  <span>{language === 'hi' ? 'सरकारी ऋण योजनाएं' : 'Matched Schemes'}</span>
                  <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Zero Collateral
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-serif font-black text-stone-900 tracking-tight tabular-nums">
                    {animatedSchemes}
                  </span>
                  <span className="text-sm font-bold text-stone-700">
                    {language === 'hi' ? 'योजनाएं' : 'Schemes'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  {language === 'hi' 
                    ? 'मुद्रा किशोर, स्वनिधि व यूपी ओडीओपी' 
                    : 'MUDRA Kishor, SVANidhi & UP ODOP'}
                </p>
              </div>

            </div>

            {/* Folio Bottom Unified Action Bar */}
            <div className="p-6 sm:p-8 bg-white border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-xs font-bold text-stone-900">
                  {language === 'hi' ? 'जज एवं मूल्यांकनकर्ता लाइव टूर' : 'SIH Evaluator Live Experience'}
                </p>
                <p className="text-[11px] text-stone-500">
                  {language === 'hi' 
                    ? '120 दिन का डेटा, 785 स्कोर एवं बैंक डॉसियर तुरंत खोलें' 
                    : 'Instantly load 120-day transactions, 785 score & bank dossier'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={async () => {
                    setDemoLoading(true);
                    try {
                      await onSelectDemo?.();
                    } finally {
                      setTimeout(() => setDemoLoading(false), 2000);
                    }
                  }}
                  disabled={demoLoading || loading}
                  variant="primary"
                  size="lg"
                  icon={demoLoading ? Loader2 : ArrowRight}
                  iconPosition="right"
                  className="w-full sm:w-auto !py-3.5 !px-7 shadow-apple-card hover:shadow-apple-elevated"
                >
                  <span>
                    {demoLoading 
                      ? (language === 'hi' ? 'डेमो लोड हो रहा है...' : 'Loading Demo Experience...')
                      : (language === 'hi' ? 'जज डेमो मोड खोलें →' : 'Launch Evaluator Demo →')}
                  </span>
                </Button>

                <button
                  type="button"
                  onClick={() => scrollToAuth('login')}
                  className="text-xs font-bold text-stone-600 hover:text-stone-950 underline underline-offset-4 cursor-pointer py-1"
                >
                  {language === 'hi' ? 'या अपनी दुकान में लॉगिन करें ↓' : 'Or sign in to your shop ↓'}
                </button>
              </div>

            </div>

          </motion.div>

        </div>
      </section>

      {/* ========================================================
          3. THE 4 PILLARS OF ALTERNATIVE UNDERWRITING (Bento Grid)
          ======================================================== */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        
        <div className="text-center space-y-1.5 max-w-xl mx-auto">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
            {language === 'hi' ? '4-स्तंभीय वैकल्पिक अंडरराइटिंग' : '4-Pillar Alternative Underwriting Architecture'}
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight">
            {language === 'hi' ? 'बिना CIBIL, बिना ITR — बैंक लोन कैसे मिलता है?' : 'How Rural Micro-Enterprises Qualify Without CIBIL'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-apple-card space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-stone-900 font-display">
              {language === 'hi' ? '1. नकद प्रवाह एवं अनुशासन' : '1. Cash Flow Velocity'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {language === 'hi'
                ? 'दैनिक बिक्री एवं खरीद प्रविष्टियों की निरंतरता औपचारिक बैंक स्टेटमेंट और P&L का विकल्प बनती है।'
                : 'Continuous daily turnover entries replace audited balance sheets and verify working capacity.'}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-apple-card space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-stone-900 font-display">
              {language === 'hi' ? '2. ग्राहक उधारी अनुशासन' : '2. Community Credit Health'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {language === 'hi'
                ? 'स्थानीय ग्राहकों के साथ 4.2 दिन का त्वरित वसूली चक्र क्रेडिट अनुशासन की पुष्टि करता है।'
                : 'Customer credit recovery cycles and WhatsApp settlement history replace traditional credit bureau data.'}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-apple-card space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-stone-900 font-display">
              {language === 'hi' ? '3. मौसमी मांग रडार' : '3. Seasonal Demand Radar'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {language === 'hi'
                ? 'मंडी फसल कटाई एवं त्योहारों (दीवाली, छठ) के पूर्वानुमान से अग्रिम स्टॉक और पूंजी सुरक्षा।'
                : 'Google Calendar synced agri-mandi harvests and festival surges protect rural merchants from stockouts.'}
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-apple-card space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-stone-900 font-display">
              {language === 'hi' ? '4. डिजिटल डीपीआई गेटवे' : '4. Sovereign DPI Gateway'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {language === 'hi'
                ? 'उद्यम सत्यापन, नायक समिति बैंक डॉसियर (CAM) एवं ओएनडीसी थोक मूल्य लाभ।'
                : 'Instant Nayak Committee CAM dossier export, Udyam linkage, and ONDC B2B wholesale pricing.'}
            </p>
          </div>

        </div>

      </section>

      {/* ========================================================
          4. SEAMLESS AUTHENTICATION DOCK (Login & Register)
          ======================================================== */}
      <section id="auth-section" className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        
        {/* Mode Switcher Pill */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-stone-200/60 rounded-2xl border border-stone-300/60 shadow-2xs">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'hi' ? 'दुकानदार लॉगिन' : 'Shopkeeper Login'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'hi' ? 'नया पंजीकरण' : 'New Registration'}</span>
            </button>
          </div>
        </div>

        {/* Shake Error Banner */}
        {errorMsg && (
          <motion.div 
            animate={shouldReduceMotion ? {} : (shakeError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {})}
            transition={{ duration: 0.4 }}
            className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl font-bold flex items-center justify-between shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </span>
            <button 
              type="button"
              onClick={() => setErrorMsg('')} 
              className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* ========================================================
            4A. SHOPKEEPER LOGIN CARD
            ======================================================== */}
        {authMode === 'login' && (
          <Card elevation={1} padding="lg" className="space-y-6">
            
            <div className="space-y-1">
              <SectionHeading>
                {language === 'hi' ? 'अपनी दुकान में लॉगिन करें' : 'Log Back In to Your Enterprise'}
              </SectionHeading>
              <HelperText>
                {language === 'hi' 
                  ? 'पंजीकृत मोबाइल नंबर एवं 4-अंकीय सुरक्षा पिन दर्ज करें • सारा बही-खाता डेटा तुरंत सुरक्षित मिलेगा' 
                  : 'Enter registered phone & 4-digit PIN • All transactions, credit score and CAM are preserved'}
              </HelperText>
            </div>

            {/* Saved Accounts on This Device */}
            {savedShops.length > 0 && (
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-stone-700" />
                  <span>{language === 'hi' ? 'इस डिवाइस पर सहेजे गए खाते' : 'Saved Accounts on This Device'}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedShops.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSavedShop(s)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        loginPhone === s.phone 
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 shadow-2xs' 
                          : 'bg-white hover:bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <strong className="block text-xs font-bold text-stone-900 truncate">
                          {s.name}
                        </strong>
                        <span className="text-[10px] text-stone-500 font-medium">
                          {s.owner_name} • {s.phone || 'Registered'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 shrink-0">
                        {loginPhone === s.phone ? '✓ Active' : 'Use'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Phone Input with +91 Country Indicator */}
              <div>
                <FieldLabel required>
                  {language === 'hi' ? 'पंजीकृत मोबाइल नंबर (Mobile Number)' : 'Registered Mobile Number'}
                </FieldLabel>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-stone-500">
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="9839124789"
                    className="w-full pl-12 pr-3.5 py-3 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs sm:text-sm font-semibold text-stone-900 tabular-nums bg-white shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Security PIN */}
              <div>
                <FieldLabel required>
                  {language === 'hi' ? '4-अंकीय सुरक्षा पिन (4-Digit PIN)' : '4-Digit Security PIN'}
                </FieldLabel>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="1234"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs sm:text-sm font-semibold text-stone-900 bg-white shadow-2xs transition-all"
                  />
                </div>
                <HelperText>
                  {language === 'hi' ? 'डिफ़ॉल्ट पिन: 1234 (डेमो एवं नए खातों हेतु)' : 'Default PIN: 1234 (pre-set for demo accounts)'}
                </HelperText>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  icon={loading ? Loader2 : LogIn}
                  iconPosition="right"
                  className="w-full !py-3.5"
                >
                  <span>
                    {loading 
                      ? (language === 'hi' ? 'लॉगिन हो रहा है...' : 'Authenticating...') 
                      : (language === 'hi' ? 'खाता लॉगिन करें एवं डैशबोर्ड खोलें' : 'Log In & Open Dashboard')}
                  </span>
                </Button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'खाता नहीं है? नया सूक्ष्म उद्यम पंजीकृत करें →' : "Don't have an account? Register new micro-enterprise →"}
                </button>
              </div>

            </form>
          </Card>
        )}

        {/* ========================================================
            4B. NEW SHOP REGISTRATION CARD
            ======================================================== */}
        {authMode === 'register' && (
          <Card elevation={1} padding="lg" className="space-y-6">
            
            <div className="space-y-1">
              <SectionHeading>
                {language === 'hi' ? 'नया सूक्ष्म उद्यम पंजीकृत करें' : 'Register New Micro-Enterprise'}
              </SectionHeading>
              <HelperText>
                {language === 'hi' ? 'आसान श्रेणी चुनाव • 1 मिनट में सक्रिय' : 'Intuitive category selection • Takes less than 1 minute'}
              </HelperText>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Trade Category Picker */}
              <div>
                <FieldLabel required>
                  {language === 'hi' ? '1. व्यापार का प्रकार चुनें' : '1. Select Trade Category'}
                </FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                  {trades.map(t => {
                    const Icon = t.icon;
                    const isSelected = tradeType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTradeType(t.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all relative cursor-pointer ${
                          isSelected
                            ? 'border-stone-900 bg-white ring-2 ring-stone-900/10 shadow-apple-card'
                            : 'border-stone-200/80 hover:border-stone-300 bg-white shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`p-2 rounded-xl border ${t.tint}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[9px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900 leading-tight">
                            {language === 'hi' ? t.name : t.nameEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shop Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>
                    {language === 'hi' ? 'दुकान का नाम' : 'Shop / Enterprise Name'}
                  </FieldLabel>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder={language === 'hi' ? 'उदा. वर्मा किराना स्टोर' : 'e.g. Verma Kirana Store'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs sm:text-sm font-semibold text-stone-900 bg-white shadow-2xs transition-all"
                  />
                </div>
                <div>
                  <FieldLabel required>
                    {language === 'hi' ? 'दुकानदार / स्वामी का नाम' : 'Proprietor Name'}
                  </FieldLabel>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder={language === 'hi' ? 'उदा. रामस्वरूप वर्मा' : 'e.g. Ramswaroop Verma'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs sm:text-sm font-semibold text-stone-900 bg-white shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number & Security PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
                <div>
                  <FieldLabel required>
                    {language === 'hi' ? 'मोबाइल नंबर (लॉगिन हेतु)' : 'Mobile Phone (for login)'}
                  </FieldLabel>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs font-semibold text-stone-900 bg-white shadow-2xs transition-all"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel required>
                    {language === 'hi' ? '4-अंकीय सुरक्षा पिन सेट करें' : 'Set 4-Digit Security PIN'}
                  </FieldLabel>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="1234"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs font-semibold text-stone-900 bg-white shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Village, District, State Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <FieldLabel>
                    {language === 'hi' ? 'गाँव / कस्बा (Village)' : 'Village / Town'}
                  </FieldLabel>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="चिलवरिया (Chilwariya)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs font-medium text-stone-900 bg-white shadow-2xs transition-all"
                  />
                </div>
                <div>
                  <FieldLabel>
                    {language === 'hi' ? 'जिला (District)' : 'District'}
                  </FieldLabel>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="बहराइच (Bahraich)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs font-medium text-stone-900 bg-white shadow-2xs transition-all"
                  />
                </div>
                <div>
                  <FieldLabel>
                    {language === 'hi' ? 'राज्य / UT' : 'State / UT'}
                  </FieldLabel>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 outline-none text-xs font-bold text-stone-900 bg-white shadow-2xs transition-all"
                  >
                    {INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.labelEn} ({s.labelHi})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vintage and Revenue Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-700">
                      {language === 'hi' ? 'दुकान कितने सालों से चल रही है?' : 'Vintage (Years in Business)'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200 shadow-2xs">
                      {vintageYears} {language === 'hi' ? 'साल' : 'Years'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={vintageYears}
                    onChange={(e) => setVintageYears(Number(e.target.value))}
                    className="w-full accent-stone-900 cursor-pointer"
                  />
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-700">
                      {language === 'hi' ? 'अनुमानित मासिक बिक्री' : 'Estimated Monthly Revenue'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200 shadow-2xs tabular-nums text-emerald-800">
                      ₹{monthlyRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150000"
                    step="5000"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full accent-stone-900 cursor-pointer"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  icon={loading ? Loader2 : ArrowRight}
                  iconPosition="right"
                  className="w-full !py-3.5 shadow-apple-card hover:shadow-apple-elevated"
                >
                  <span>
                    {loading 
                      ? (language === 'hi' ? 'प्रोफ़ाइल बना रहे हैं...' : 'Creating Enterprise Profile...') 
                      : (language === 'hi' ? 'दुकान प्रोफ़ाइल बनाएं एवं डैशबोर्ड खोलें' : 'Create Shop & Launch Dashboard')}
                  </span>
                </Button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'पहले से खाता है? मोबाइल नंबर से लॉगिन करें →' : 'Already registered? Log in with phone & PIN →'}
                </button>
              </div>

            </form>
          </Card>
        )}

      </section>

    </div>
  );
}
