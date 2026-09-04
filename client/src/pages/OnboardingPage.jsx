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
  IndianRupee 
} from 'lucide-react';
import { WarliBorder, WarliCircle } from '../components/WarliMotif';
import { SaathiAvatar } from '../components/SaathiAvatar';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export function OnboardingPage({ onComplete, onSelectDemo }) {
  const { language } = useTranslation();
  const [tradeType, setTradeType] = useState('kirana');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [village, setVillage] = useState('Utraula Dehat');
  const [district, setDistrict] = useState('Balrampur');
  const [state, setState] = useState('Uttar Pradesh');
  const [vintageYears, setVintageYears] = useState(4);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [loading, setLoading] = useState(false);

  const trades = [
    { id: 'kirana', name: 'किराना एवं जनरल स्टोर', nameEn: 'Kirana & General Store', icon: ShoppingBag, color: 'text-terracotta-700 bg-terracotta-100 border-terracotta-300' },
    { id: 'tailoring', name: 'दर्जी एवं सिलाई केंद्र', nameEn: 'Tailoring & Garments', icon: Scissors, color: 'text-indigoRural-700 bg-indigoRural-100 border-indigoRural-300' },
    { id: 'handicraft', name: 'हस्तशिल्प व मिट्टी बर्तन', nameEn: 'Handicrafts & Pottery', icon: Palette, color: 'text-ochre-700 bg-ochre-100 border-ochre-300' },
    { id: 'dairy', name: 'डेयरी एवं मिष्ठान भंडार', nameEn: 'Dairy & Sweets', icon: Milk, color: 'text-emerald-700 bg-emerald-100 border-emerald-300' },
    { id: 'tea_stall', name: 'चाय-नाश्ता दुकान', nameEn: 'Tea Stall & Eatery', icon: Coffee, color: 'text-amber-800 bg-amber-100 border-amber-300' },
    { id: 'agri_inputs', name: 'खाद-बीज एवं कृषि दुकान', nameEn: 'Agri-inputs & Seeds', icon: Sprout, color: 'text-forestRural-700 bg-forestRural-100 border-forestRural-300' },
    { id: 'repair', name: 'बढ़ईगीरी व मरम्मत', nameEn: 'Carpentry & Repair', icon: Wrench, color: 'text-stone-700 bg-stone-100 border-stone-300' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedTrade = trades.find(t => t.id === tradeType);
      const res = await api.setupShop({
        name: shopName || 'मेरी दुकान (My Store)',
        owner_name: ownerName || 'दुकानदार',
        trade_type: tradeType,
        trade_name: selectedTrade?.nameEn || 'Kirana Store',
        village,
        district,
        state,
        vintage_years: vintageYears,
        monthly_revenue: monthlyRevenue,
        bank_account_type: 'Gramin Bank',
        ownership: 'rented'
      });
      onComplete?.(res.shop);
    } catch (err) {
      alert('Error creating shop: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] py-6 px-4 max-w-4xl mx-auto flex flex-col justify-center">
      
      {/* 1-Click Demo Hero Card (Front & Center for Judges) */}
      <div className="bg-gradient-to-br from-terracotta-700 via-terracotta-800 to-terracotta-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-terracotta-500 relative overflow-hidden mb-8">
        <div className="absolute -right-8 -bottom-8 opacity-20 pointer-events-none">
          <WarliCircle size={240} className="text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-xs font-bold text-ochre-300 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIH 26091 — Live Prototype Demonstration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-paper-50">
              {language === 'hi' ? 'नमस्ते! व्यापार साथी में आपका स्वागत है' : 'Welcome to Vyapaar Saathi'}
            </h1>
            <p className="text-sm text-terracotta-100 leading-relaxed">
              {language === 'hi' 
                ? 'उत्तर प्रदेश के बलरामपुर गांव के रमेश जी (किराना स्टोर) की 90 दिन की वास्तविक बिक्री, 750 क्रेडिट स्कोर और मुद्रा लोन पात्रता को 1 क्लिक में लोड करें।'
                : 'Instantly load Ramesh\'s Kirana Store (Balrampur, UP) with 90 days of daily transactions, explainable 750 credit score, and matching MUDRA loans.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onSelectDemo}
            className="w-full md:w-auto px-6 py-3.5 bg-ochre-400 hover:bg-ochre-300 active:scale-95 text-stone-900 font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition shrink-0"
          >
            <span>🚀 {language === 'hi' ? 'रमेश का डेमो स्टोर लोड करें' : 'Load Ramesh Demo Store'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-center my-4">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest bg-paper-200 px-4 py-1 rounded-full border border-paper-300">
          {language === 'hi' ? 'या अपनी नई दुकान दर्ज करें' : 'Or Register a New Micro-Enterprise'}
        </span>
      </div>

      {/* Onboarding Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-paper-300 shadow-paper space-y-6">
        
        <div>
          <h2 className="text-lg font-black text-stone-800">
            {language === 'hi' ? 'दुकान एवं व्यापार की जानकारी' : 'Shop & Trade Information'}
          </h2>
          <p className="text-xs text-stone-500">
            {language === 'hi' ? 'आसान आइकन-आधारित चुनाव • कम से कम टाइपिंग' : 'Icon-led category selection • Minimal typing required'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Trade Category Picker (Large Cards with Icons) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              {language === 'hi' ? '1. अपने व्यापार का प्रकार चुनें *' : '1. Select Trade Category *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {trades.map(t => {
                const Icon = t.icon;
                const isSelected = tradeType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTradeType(t.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between min-h-[96px] ${
                      isSelected
                        ? 'border-terracotta-600 bg-terracotta-50 shadow-md ring-2 ring-terracotta-400'
                        : 'border-paper-300 bg-paper-50 hover:bg-paper-100 hover:border-paper-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`p-2 rounded-xl border ${t.color}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-terracotta-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-stone-800 leading-snug">
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
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'दुकान का नाम' : 'Shop Name'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="उदा. राधे कृष्णा किराना"
                className="w-full px-4 py-2.5 bg-paper-50 rounded-xl border border-stone-300 focus:outline-none focus:border-terracotta-500 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'दुकानदार का नाम' : 'Owner Name'}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="उदा. रमेश कुमार"
                className="w-full px-4 py-2.5 bg-paper-50 rounded-xl border border-stone-300 focus:outline-none focus:border-terracotta-500 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Village, District, State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'गांव / कस्बा' : 'Village / Town'}
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3.5 py-2 bg-paper-50 rounded-xl border border-stone-300 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'जिला (District)' : 'District'}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2 bg-paper-50 rounded-xl border border-stone-300 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'राज्य (State)' : 'State'}
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2 bg-paper-50 rounded-xl border border-stone-300 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Vintage Slider & Revenue Estimate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="bg-paper-100 p-4 rounded-2xl border border-paper-300">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-stone-700">
                  {language === 'hi' ? 'दुकान कितने सालों से चल रही है?' : 'Years in Operation (Vintage)'}
                </span>
                <span className="text-sm font-extrabold text-terracotta-700 bg-white px-2.5 py-0.5 rounded-lg border border-terracotta-300">
                  {vintageYears} {language === 'hi' ? 'साल' : 'Years'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={vintageYears}
                onChange={(e) => setVintageYears(Number(e.target.value))}
                className="w-full accent-terracotta-600"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                {language === 'hi' ? '3+ साल पुराने व्यवसाय को मुद्रा लोन में प्राथमिकता मिलती है' : '3+ years improves loan approval rate'}
              </p>
            </div>

            <div className="bg-paper-100 p-4 rounded-2xl border border-paper-300">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-stone-700">
                  {language === 'hi' ? 'अनुमानित मासिक बिक्री' : 'Estimated Monthly Revenue'}
                </span>
                <span className="text-sm font-extrabold text-forestRural-700 bg-white px-2.5 py-0.5 rounded-lg border border-forestRural-300">
                  ₹{monthlyRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="150000"
                step="5000"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                className="w-full accent-forestRural-600"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                {language === 'hi' ? 'दैनिक बिक्री बही-खाते से यह स्वतः अपडेट होगी' : 'Auto-updates as you log daily bahi-khata transactions'}
              </p>
            </div>
          </div>

          <WarliBorder className="my-2" />

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-terracotta-600 hover:bg-terracotta-700 active:scale-[0.99] text-white rounded-2xl font-bold text-base shadow-xl flex items-center justify-center gap-2 transition"
          >
            <span>{loading ? 'बना रहे हैं...' : (language === 'hi' ? 'दुकान प्रोफ़ाइल बनाएं एवं डैशबोर्ड खोलें' : 'Create Shop & Launch Dashboard')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

        </form>
      </div>

    </div>
  );
}
