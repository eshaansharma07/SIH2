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
  Sparkles, 
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
  KeyRound
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { WarliBorder } from '../components/WarliMotif';
import { api } from '../utils/api';
import { INDIAN_STATES_AND_UTS, findStandardState } from '../data/indianStates';
import { useTranslation } from '../i18n/LanguageContext';
import { Card, Badge, Button, PageTitle, SectionHeading, FieldLabel, HelperText } from '../components/ui';

export function OnboardingPage({ onComplete, onSelectDemo }) {
  const { language } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [savedShops, setSavedShops] = useState([]);

  // Registration Form State
  const [tradeType, setTradeType] = useState('kirana');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('1234');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [vintageYears, setVintageYears] = useState(1);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shakeError, setShakeError] = useState(false);

  // Load previously used accounts on this device
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vyapaar_saved_shops');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedShops(parsed);
          setAuthMode('login');
          if (parsed[0]?.phone) setLoginPhone(parsed[0].phone);
          if (parsed[0]?.password) setLoginPassword(parsed[0].password);
        }
      }
    } catch (_) {}
  }, []);

  const trades = [
    { 
      id: 'kirana', 
      name: 'किराना एवं जनरल स्टोर', 
      nameEn: 'Kirana & General Store', 
      icon: ShoppingBag,
      tint: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200' 
    },
    { 
      id: 'tailoring', 
      name: 'दर्जी एवं सिलाई केंद्र', 
      nameEn: 'Tailoring & Garments', 
      icon: Scissors,
      tint: 'bg-indigoRural-50 text-indigoRural-700 border-indigoRural-200' 
    },
    { 
      id: 'handicraft', 
      name: 'हस्तशिल्प व मिट्टी बर्तन', 
      nameEn: 'Handicrafts & Pottery', 
      icon: Palette,
      tint: 'bg-ochre-50 text-ochre-700 border-ochre-200' 
    },
    { 
      id: 'dairy', 
      name: 'डेयरी एवं मिष्ठान भंडार', 
      nameEn: 'Dairy & Sweets', 
      icon: Milk,
      tint: 'bg-forestRural-50 text-forestRural-700 border-forestRural-200' 
    },
    { 
      id: 'tea_stall', 
      name: 'चाय-नाश्ता दुकान', 
      nameEn: 'Tea Stall & Eatery', 
      icon: Coffee,
      tint: 'bg-amber-50 text-amber-800 border-amber-200' 
    },
    { 
      id: 'agri_inputs', 
      name: 'खाद-बीज एवं कृषि दुकान', 
      nameEn: 'Agri-inputs & Seeds', 
      icon: Sprout,
      tint: 'bg-emerald-50 text-emerald-800 border-emerald-200' 
    },
    { 
      id: 'repair', 
      name: 'बढ़ईगीरी व मरम्मत', 
      nameEn: 'Carpentry & Repair', 
      icon: Wrench,
      tint: 'bg-stone-100 text-stone-700 border-stone-300' 
    },
  ];

  const triggerErrorShake = (msg) => {
    setErrorMsg(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  // Log in existing shopkeeper by Phone Number & Password
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      triggerErrorShake(language === 'hi' ? 'कृपया अपना 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Please enter your registered mobile number');
      return;
    }
    if (!loginPassword.trim()) {
      triggerErrorShake(language === 'hi' ? 'कृपया अपना 4-अंकीय पासवर्ड या पिन दर्ज करें' : 'Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.loginShop(loginPhone.trim(), loginPassword.trim());
      if (res.success && res.shop) {
        onComplete?.(res.shop);
      } else {
        triggerErrorShake(res.error || 'Login failed');
      }
    } catch (err) {
      triggerErrorShake(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick select from saved account card
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
        state: state.trim() || 'State',
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion ? { duration: 0.1 } : { staggerChildren: 0.1, delayChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 350, damping: 26 } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-[88vh] py-6 px-4 max-w-4xl mx-auto flex flex-col justify-center"
    >
      
      {/* 1. Dedicated SIH Evaluator / Judge Demo Card (Elevation 3) */}
      <motion.div 
        variants={itemVariants}
        whileHover={shouldReduceMotion ? {} : { y: -2, transition: { duration: 0.2 } }}
        className="saathi-pass text-white p-6 sm:p-8 relative overflow-hidden mb-6 rounded-3xl border border-ochre-400/30 shadow-elevation-2"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-ochre-400/20 text-ochre-200 rounded-full text-xs font-bold border border-ochre-300/30">
              <Sparkles className="w-3.5 h-3.5 text-ochre-300 animate-pulse" />
              <span>SIH 2026 Grand Finale • Evaluator Demo Mode</span>
            </div>
            <PageTitle className="!text-white">
              {language === 'hi' ? 'जज एवं मूल्यांकनकर्ता डेमो (Ramesh Kirana)' : 'Evaluator Demo (Ramesh Kirana)'}
            </PageTitle>
            <p className="text-xs sm:text-sm text-paper-200 leading-relaxed font-normal">
              {language === 'hi' 
                ? 'मूल्यांकन हेतु 120 दिन का प्रमाणित डेटा, 785 क्रेडिट स्कोर, मुद्रा किशोर पात्रता एवं इंटरैक्टिव टूर तुरंत लोड करें।'
                : 'Instantly evaluate the platform with 120 days of audited micro-retail transactions, 785 alternative credit score, and matching MUDRA loans.'}
            </p>
          </div>

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
            variant="secondary"
            size="lg"
            icon={demoLoading ? Loader2 : ArrowRight}
            iconPosition="right"
            className={`w-full md:w-auto shrink-0 !bg-white !text-indigoRural-950 hover:!bg-paper-100 shadow-md hover:shadow-lg transition-all ${demoLoading ? 'opacity-90 cursor-wait' : ''}`}
          >
            <span>
              {demoLoading 
                ? (language === 'hi' ? 'डेमो लोड हो रहा है...' : 'Loading Demo Mode...')
                : (language === 'hi' ? 'जज डेमो मोड लोड करें' : 'Launch Judge Demo Mode')}
            </span>
          </Button>
        </div>
      </motion.div>

      <WarliBorder className="w-full h-5 text-terracotta-400 opacity-60 my-2" />

      {/* 2. Auth Mode Segmented Pill Switcher (Login vs New Registration) */}
      <motion.div variants={itemVariants} className="flex justify-center my-4">
        <div className="inline-flex p-1 bg-paper-200/90 rounded-2xl border border-paper-300 shadow-2xs">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-indigoRural-900 text-white shadow-xs'
                : 'text-indigoRural-700 hover:text-indigoRural-950'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{language === 'hi' ? 'दुकानदार लॉगिन' : 'Shopkeeper Login'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              authMode === 'register'
                ? 'bg-terracotta-600 text-white shadow-xs'
                : 'text-indigoRural-700 hover:text-indigoRural-950'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'hi' ? 'नया पंजीकरण' : 'New Registration'}</span>
          </button>
        </div>
      </motion.div>

      {/* Animated Shake Error Banner */}
      {errorMsg && (
        <motion.div 
          animate={shouldReduceMotion ? {} : (shakeError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {})}
          transition={{ duration: 0.4 }}
          className="bg-terracotta-50 border border-terracotta-200 text-terracotta-800 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-between shadow-2xs mb-4"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-terracotta-600 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <button 
            type="button"
            onClick={() => setErrorMsg('')} 
            className="text-terracotta-600 hover:text-terracotta-900 p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* 3A. SHOPKEEPER LOGIN VIEW */}
      {authMode === 'login' && (
        <motion.div variants={itemVariants}>
          <Card elevation={1} padding="lg" className="space-y-6">
            
            <div>
              <SectionHeading>
                {language === 'hi' ? 'वापस अपनी दुकान में लॉगिन करें' : 'Log Back In to Your Shop'}
              </SectionHeading>
              <HelperText>
                {language === 'hi' 
                  ? 'पंजीकृत मोबाइल नंबर एवं 4-अंकीय पिन दर्ज करें • सारा बही-खाता डेटा सुरक्षित मिलेगा' 
                  : 'Enter your registered mobile number & 4-digit PIN • All transactions & scores are restored'}
              </HelperText>
            </div>

            {/* Saved Accounts On This Device (1-Tap Quick Fill) */}
            {savedShops.length > 0 && (
              <div className="bg-paper-50 p-3.5 rounded-2xl border border-paper-200 space-y-2">
                <span className="text-[11px] font-extrabold text-indigoRural-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-terracotta-600" />
                  <span>{language === 'hi' ? 'इस डिवाइस पर सहेजे गए खाते' : 'Saved Accounts on this Device'}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedShops.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSavedShop(s)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        loginPhone === s.phone 
                          ? 'bg-terracotta-50 border-terracotta-300 ring-2 ring-terracotta-400/20' 
                          : 'bg-white hover:bg-paper-100 border-paper-200'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <strong className="block text-xs font-black text-indigoRural-900 truncate">
                          {s.name}
                        </strong>
                        <span className="text-[10px] text-indigoRural-500 font-medium">
                          {s.owner_name} • {s.phone || s.village || 'Registered'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-paper-200 text-indigoRural-800 shrink-0">
                        {loginPhone === s.phone ? '✓ Selected' : 'Use'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Phone Input */}
              <div>
                <FieldLabel required>
                  {language === 'hi' ? 'पंजीकृत मोबाइल नंबर (Mobile Number)' : 'Registered Mobile Number'}
                </FieldLabel>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigoRural-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="उदा. 9839124789 या 9876543210"
                    className="w-full pl-10 pr-3.5 py-3 saathi-input text-xs sm:text-sm font-semibold text-indigoRural-900 tabular-nums"
                  />
                </div>
              </div>

              {/* Password / PIN Input */}
              <div>
                <FieldLabel required>
                  {language === 'hi' ? '4-अंकीय सुरक्षा पिन या पासवर्ड (PIN / Password)' : '4-Digit PIN or Password'}
                </FieldLabel>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigoRural-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="उदा. 1234"
                    className="w-full pl-10 pr-3.5 py-3 saathi-input text-xs sm:text-sm font-semibold text-indigoRural-900"
                  />
                </div>
                <HelperText>
                  {language === 'hi' ? 'डिफ़ॉल्ट पिन: 1234 (डेमो एवं नए खातों हेतु)' : 'Default PIN: 1234 (standard for demo & new accounts)'}
                </HelperText>
              </div>

              {/* Login Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="dark"
                  size="lg"
                  icon={loading ? Loader2 : LogIn}
                  iconPosition="right"
                  className="w-full shadow-elevation-1 hover:shadow-elevation-2 transition-all"
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
                  className="text-xs font-bold text-terracotta-700 hover:text-terracotta-800 hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'खाता नहीं है? नया सूक्ष्म उद्यम पंजीकृत करें →' : "Don't have an account? Register new micro-enterprise →"}
                </button>
              </div>

            </form>
          </Card>
        </motion.div>
      )}

      {/* 3B. NEW SHOP REGISTRATION VIEW */}
      {authMode === 'register' && (
        <motion.div variants={itemVariants}>
          <Card elevation={1} padding="lg" className="space-y-6">
            
            <div>
              <SectionHeading>
                {language === 'hi' ? 'दुकान एवं व्यापार की जानकारी' : 'Shop & Trade Information'}
              </SectionHeading>
              <HelperText>
                {language === 'hi' ? 'आसान आइकन-आधारित चुनाव • कम से कम टाइपिंग' : 'Icon-led category selection • Minimal typing required'}
              </HelperText>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Trade Category Picker */}
              <div>
                <FieldLabel required>
                  {language === 'hi' ? '1. अपने व्यापार का प्रकार चुनें' : '1. Select Trade Category'}
                </FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                  {trades.map(t => {
                    const Icon = t.icon;
                    const isSelected = tradeType === t.id;
                    return (
                      <motion.button
                        key={t.id}
                        type="button"
                        onClick={() => setTradeType(t.id)}
                        whileHover={shouldReduceMotion ? {} : { y: -2 }}
                        whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all relative cursor-pointer ${
                          isSelected
                            ? 'border-terracotta-600 bg-white ring-2 ring-terracotta-500/20 shadow-elevation-1'
                            : 'border-paper-300 hover:border-paper-400 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`p-2 rounded-xl border ${t.tint}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          {isSelected && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className="w-5 h-5 rounded-full bg-terracotta-600 text-white flex items-center justify-center text-[10px]"
                            >
                              <Check className="w-3 h-3 stroke-3" />
                            </motion.span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-indigoRural-900 leading-tight">
                            {language === 'hi' ? t.name : t.nameEn}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Shop Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>
                    {language === 'hi' ? 'दुकान का नाम' : 'Shop Name'}
                  </FieldLabel>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder={language === 'hi' ? 'उदा. वर्मा किराना स्टोर' : 'e.g. Verma Kirana Store'}
                    className="w-full px-3.5 py-2.5 saathi-input text-xs sm:text-sm font-semibold text-indigoRural-900"
                  />
                </div>
                <div>
                  <FieldLabel required>
                    {language === 'hi' ? 'दुकानदार / स्वामी का नाम' : 'Owner / Proprietor Name'}
                  </FieldLabel>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder={language === 'hi' ? 'उदा. रामस्वरूप वर्मा' : 'e.g. Ramswaroop Verma'}
                    className="w-full px-3.5 py-2.5 saathi-input text-xs sm:text-sm font-semibold text-indigoRural-900"
                  />
                </div>
              </div>

              {/* Mobile Number & Security PIN (for logging back in) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-paper-50 p-4 rounded-2xl border border-paper-200">
                <div>
                  <FieldLabel required>
                    {language === 'hi' ? 'मोबाइल नंबर (लॉगिन हेतु)' : 'Mobile Number (for logging in)'}
                  </FieldLabel>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigoRural-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="उदा. 9876543210"
                      className="w-full pl-9 pr-3 py-2 saathi-input text-xs font-semibold text-indigoRural-900"
                    />
                  </div>
                  <HelperText>
                    {language === 'hi' ? 'लॉग आउट के बाद पुनः लॉगिन के लिए आवश्यक' : 'Used to log back in after logout'}
                  </HelperText>
                </div>
                <div>
                  <FieldLabel required>
                    {language === 'hi' ? '4-अंकीय सुरक्षा पिन सेट करें' : 'Set 4-Digit Security PIN'}
                  </FieldLabel>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigoRural-400">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="1234"
                      className="w-full pl-9 pr-3 py-2 saathi-input text-xs font-semibold text-indigoRural-900"
                    />
                  </div>
                  <HelperText>
                    {language === 'hi' ? 'डिफ़ॉल्ट पिन: 1234 (या अपनी पसंद का पिन चुनें)' : 'Default: 1234 (or choose your 4-digit PIN)'}
                  </HelperText>
                </div>
              </div>

              {/* Village, District, State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <FieldLabel>
                    {language === 'hi' ? 'गाँव / कस्बा (Village)' : 'Village / Town'}
                  </FieldLabel>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="उदा. चिलवरिया (Chilwariya)"
                    className="w-full px-3.5 py-2.5 saathi-input text-xs font-medium text-indigoRural-900"
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
                    placeholder="उदा. बहराइच (Bahraich)"
                    className="w-full px-3.5 py-2.5 saathi-input text-xs font-medium text-indigoRural-900"
                  />
                </div>
                <div>
                  <FieldLabel>
                    {language === 'hi' ? 'राज्य / UT (State / UT)' : 'State / Union Territory'}
                  </FieldLabel>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 saathi-input text-xs font-semibold text-indigoRural-900 bg-white"
                  >
                    <option value="">
                      {language === 'hi' ? '-- राज्य / केंद्र शासित प्रदेश चुनें --' : '-- Select State / UT --'}
                    </option>
                    {INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.labelEn} ({s.labelHi})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vintage Slider & Revenue Estimate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-paper-50 p-4 rounded-xl border border-paper-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-indigoRural-800">
                      {language === 'hi' ? 'दुकान कितने सालों से चल रही है?' : 'Years in Operation (Vintage)'}
                    </span>
                    <span className="text-xs font-black text-indigoRural-900 bg-white px-2.5 py-0.5 rounded-full border border-paper-300 shadow-2xs">
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
                    className="saathi-slider"
                    style={{
                      background: `linear-gradient(to right, #C15324 ${(vintageYears / 10) * 100}%, #ECE4D4 ${(vintageYears / 10) * 100}%)`
                    }}
                  />
                  <HelperText>
                    {language === 'hi' ? '0 = नया व्यवसाय (Day 1) • 3+ साल पर मुद्रा प्राथमिकता' : '0 = New enterprise (Day 1) • 3+ years qualifies for MUDRA priority'}
                  </HelperText>
                </div>

                <div className="bg-paper-50 p-4 rounded-xl border border-paper-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-indigoRural-800">
                      {language === 'hi' ? 'अनुमानित मासिक बिक्री' : 'Estimated Monthly Revenue'}
                    </span>
                    <span className="text-xs font-black text-forestRural-700 bg-white px-2.5 py-0.5 rounded-full border border-paper-300 shadow-2xs tabular-nums">
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
                    className="saathi-slider"
                    style={{
                      background: `linear-gradient(to right, #1E523A ${(monthlyRevenue / 150000) * 100}%, #ECE4D4 ${(monthlyRevenue / 150000) * 100}%)`
                    }}
                  />
                  <HelperText>
                    {language === 'hi' ? 'दैनिक बिक्री बही-खाते से यह स्वतः अपडेट होगी' : 'Auto-updates as you log daily bahi-khata transactions'}
                  </HelperText>
                </div>
              </div>

              {/* Submit button with animated loading state */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  variant="dark"
                  size="lg"
                  icon={loading ? Loader2 : ArrowRight}
                  iconPosition="right"
                  className="w-full shadow-elevation-1 hover:shadow-elevation-2 transition-all"
                >
                  <span>
                    {loading 
                      ? (language === 'hi' ? 'प्रोफ़ाइल बना रहे हैं...' : 'Creating Shop Profile...') 
                      : (language === 'hi' ? 'दुकान प्रोफ़ाइल बनाएं एवं डैशबोर्ड खोलें' : 'Create Shop & Launch Dashboard')}
                  </span>
                </Button>
              </motion.div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                  className="text-xs font-bold text-indigoRural-700 hover:text-indigoRural-900 hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'पहले से खाता है? मोबाइल नंबर से लॉगिन करें →' : 'Already have an account? Log in with phone & PIN →'}
                </button>
              </div>

            </form>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
}
