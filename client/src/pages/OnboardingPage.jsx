import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { WarliBorder } from '../components/WarliMotif';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { Card, Badge, Button, PageTitle, SectionHeading, FieldLabel, HelperText } from '../components/ui';

export function OnboardingPage({ onComplete, onSelectDemo }) {
  const { language } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  
  const [tradeType, setTradeType] = useState('kirana');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [vintageYears, setVintageYears] = useState(1);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shakeError, setShakeError] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim() || !ownerName.trim()) {
      triggerErrorShake(language === 'hi' ? 'कृपया दुकान और दुकानदार का नाम दर्ज करें' : 'Please provide shop name and proprietor name');
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

      {/* Pathway Divider */}
      <motion.div variants={itemVariants} className="text-center my-4">
        <span className="text-xs font-bold text-indigoRural-700 uppercase tracking-wider bg-paper-100 px-4 py-2 rounded-full border border-paper-300 shadow-elevation-1">
          {language === 'hi' ? 'अथवा: वास्तविक सूक्ष्म उद्यम पंजीकरण (Day 1)' : 'Or: Register Real Micro-Enterprise (Day 1 Honest State)'}
        </span>
      </motion.div>

      {/* Onboarding Form Card (Elevation 1) */}
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
            {/* Animated Shake Error Banner */}
            {errorMsg && (
              <motion.div 
                animate={shouldReduceMotion ? {} : (shakeError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {})}
                transition={{ duration: 0.4 }}
                className="bg-terracotta-50 border border-terracotta-200 text-terracotta-800 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-between shadow-2xs"
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
                      whileHover={shouldReduceMotion ? {} : { y: -2, transition: { duration: 0.15 } }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[96px] cursor-pointer ${
                        isSelected
                          ? 'border-terracotta-600 bg-terracotta-50/70 shadow-elevation-1 ring-2 ring-terracotta-500/25'
                          : 'border-paper-300 bg-white hover:bg-paper-50/80 hover:border-paper-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`p-2 rounded-lg border shadow-2xs transition-colors ${
                          isSelected ? 'bg-terracotta-600 text-white border-terracotta-700' : t.tint
                        }`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        {isSelected && (
                          <motion.span 
                            initial={shouldReduceMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            className="w-5 h-5 rounded-full bg-terracotta-600 text-white flex items-center justify-center text-xs shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                          </motion.span>
                        )}
                      </div>
                      <div className="pt-2">
                        <p className={`font-bold text-xs leading-snug transition-colors ${isSelected ? 'text-terracotta-900 font-extrabold' : 'text-indigoRural-800'}`}>
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
                <div className="flex justify-between items-center mb-1">
                  <FieldLabel required>
                    {language === 'hi' ? 'दुकान का नाम' : 'Shop Name'}
                  </FieldLabel>
                  {shopName.trim().length > 1 && (
                    <span className="text-[10px] font-bold text-forestRural-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Valid
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="उदा. राधे कृष्णा किराना"
                  className="w-full px-4 py-2.5 saathi-input text-xs font-medium text-indigoRural-900"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <FieldLabel required>
                    {language === 'hi' ? 'दुकानदार का नाम' : 'Owner Name'}
                  </FieldLabel>
                  {ownerName.trim().length > 1 && (
                    <span className="text-[10px] font-bold text-forestRural-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Valid
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="उदा. रमेश कुमार"
                  className="w-full px-4 py-2.5 saathi-input text-xs font-medium text-indigoRural-900"
                />
              </div>
            </div>

            {/* Village, District, State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel>
                  {language === 'hi' ? 'गांव / कस्बा' : 'Village / Town'}
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
                  {language === 'hi' ? 'राज्य (State)' : 'State'}
                </FieldLabel>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="उदा. उत्तर प्रदेश (UP)"
                  className="w-full px-3.5 py-2.5 saathi-input text-xs font-medium text-indigoRural-900"
                />
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

          </form>
        </Card>
      </motion.div>

    </motion.div>
  );
}
