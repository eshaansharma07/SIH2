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
  X 
} from 'lucide-react';
import { WarliBorder, WarliCircle } from '../components/WarliMotif';
import { SaathiAvatar } from '../components/SaathiAvatar';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { Card, Badge, SectionHeader, Button } from '../components/ui';

export function OnboardingPage({ onComplete, onSelectDemo }) {
  const { language } = useTranslation();
  const [tradeType, setTradeType] = useState('kirana');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [vintageYears, setVintageYears] = useState(1);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  const trades = [
    { id: 'kirana', name: 'किराना एवं जनरल स्टोर', nameEn: 'Kirana & General Store', icon: ShoppingBag },
    { id: 'tailoring', name: 'दर्जी एवं सिलाई केंद्र', nameEn: 'Tailoring & Garments', icon: Scissors },
    { id: 'handicraft', name: 'हस्तशिल्प व मिट्टी बर्तन', nameEn: 'Handicrafts & Pottery', icon: Palette },
    { id: 'dairy', name: 'डेयरी एवं मिष्ठान भंडार', nameEn: 'Dairy & Sweets', icon: Milk },
    { id: 'tea_stall', name: 'चाय-नाश्ता दुकान', nameEn: 'Tea Stall & Eatery', icon: Coffee },
    { id: 'agri_inputs', name: 'खाद-बीज एवं कृषि दुकान', nameEn: 'Agri-inputs & Seeds', icon: Sprout },
    { id: 'repair', name: 'बढ़ईगीरी व मरम्मत', nameEn: 'Carpentry & Repair', icon: Wrench },
  ];

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim() || !ownerName.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया दुकान और दुकानदार का नाम दर्ज करें' : 'Please provide shop name and proprietor name');
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
      setErrorMsg(err.message || 'Error creating shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] py-6 px-4 max-w-4xl mx-auto flex flex-col justify-center animate-fadeIn">
      
      {/* 1. Dedicated SIH Evaluator / Judge Demo Card */}
      <div className="saathi-pass text-white p-6 sm:p-8 relative overflow-hidden mb-6 rounded-2xl border border-ochre-400/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-ochre-400/20 text-ochre-200 rounded-full text-xs font-bold border border-ochre-300/30">
              <Sparkles className="w-3.5 h-3.5 text-ochre-300" />
              <span>SIH 2026 Grand Finale • Evaluator Demo Mode</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              {language === 'hi' ? 'जज एवं मूल्यांकनकर्ता डेमो (Ramesh Kirana)' : 'Evaluator Demo (Ramesh Kirana)'}
            </h1>
            <p className="text-sm text-paper-200 leading-relaxed font-normal">
              {language === 'hi' 
                ? 'मूल्यांकन हेतु 120 दिन का प्रमाणित डेटा, 785 क्रेडिट स्कोर, मुद्रा किशोर पात्रता एवं इंटरैक्टिव टूर तुरंत लोड करें।'
                : 'Instantly evaluate the platform with 120 days of audited micro-retail transactions, 785 alternative credit score, and matching MUDRA loans.'}
            </p>
          </div>

          <Button
            type="button"
            onClick={onSelectDemo}
            variant="secondary"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            className="w-full md:w-auto shrink-0 !bg-white !text-indigoRural-950 hover:!bg-paper-100 shadow-md"
          >
            <span>{language === 'hi' ? 'जज डेमो मोड लोड करें' : 'Launch Judge Demo Mode'}</span>
          </Button>
        </div>
      </div>

      <WarliBorder className="w-full h-5 text-terracotta-400 opacity-60 my-2" />

      {/* Pathway Divider */}
      <div className="text-center my-4">
        <span className="text-xs font-bold text-indigoRural-700 uppercase tracking-wider bg-paper-100 px-4 py-2 rounded-full border border-paper-300 shadow-2xs">
          {language === 'hi' ? 'अथवा: वास्तविक सूक्ष्म उद्यम पंजीकरण (Day 1)' : 'Or: Register Real Micro-Enterprise (Day 1 Honest State)'}
        </span>
      </div>

      {/* Onboarding Form */}
      <Card padding="lg" className="space-y-6">
        
        <div>
          <h2 className="text-base font-black text-indigoRural-900 tracking-tight font-display">
            {language === 'hi' ? 'दुकान एवं व्यापार की जानकारी' : 'Shop & Trade Information'}
          </h2>
          <p className="text-xs text-indigoRural-500 mt-0.5">
            {language === 'hi' ? 'आसान आइकन-आधारित चुनाव • कम से कम टाइपिंग' : 'Icon-led category selection • Minimal typing required'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="bg-terracotta-50 border border-terracotta-200 text-terracotta-800 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
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
            </div>
          )}
          
          {/* Trade Category Picker */}
          <div>
            <label className="block text-xs font-bold text-indigoRural-700 mb-2">
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
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[96px] cursor-pointer ${
                      isSelected
                        ? 'border-terracotta-600 bg-terracotta-50/50 shadow-2xs ring-2 ring-terracotta-500/20'
                        : 'border-paper-300 bg-paper-50/60 hover:bg-paper-100 hover:border-paper-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-lg bg-white border border-paper-300 text-indigoRural-800 shadow-2xs">
                        <Icon className="w-5 h-5 text-terracotta-600" />
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-terracotta-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className={`font-bold text-xs leading-snug ${isSelected ? 'text-terracotta-900' : 'text-indigoRural-800'}`}>
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
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'दुकान का नाम' : 'Shop Name'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="उदा. राधे कृष्णा किराना"
                className="w-full px-4 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-xs font-medium transition text-indigoRural-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'दुकानदार का नाम' : 'Owner Name'}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="उदा. रमेश कुमार"
                className="w-full px-4 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-xs font-medium transition text-indigoRural-900"
              />
            </div>
          </div>

          {/* Village, District, State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'गांव / कस्बा' : 'Village / Town'}
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="उदा. चिलवरिया (Chilwariya)"
                className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'जिला (District)' : 'District'}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="उदा. बहराइच (Bahraich)"
                className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'राज्य (State)' : 'State'}
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="उदा. उत्तर प्रदेश (UP)"
                className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
              />
            </div>
          </div>

          {/* Vintage Slider & Revenue Estimate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="bg-paper-50 p-4 rounded-xl border border-paper-200">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-indigoRural-700">
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
                className="w-full accent-terracotta-600"
              />
              <p className="text-[11px] text-indigoRural-400 mt-1">
                {language === 'hi' ? '0 = नया व्यवसाय (Day 1) • 3+ साल पर मुद्रा प्राथमिकता' : '0 = New enterprise (Day 1) • 3+ years qualifies for MUDRA priority'}
              </p>
            </div>

            <div className="bg-paper-50 p-4 rounded-xl border border-paper-200">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-indigoRural-700">
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
                className="w-full accent-forestRural-600"
              />
              <p className="text-[11px] text-indigoRural-400 mt-1">
                {language === 'hi' ? 'दैनिक बिक्री बही-खाते से यह स्वतः अपडेट होगी' : 'Auto-updates as you log daily bahi-khata transactions'}
              </p>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            variant="dark"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            className="w-full"
          >
            <span>{loading ? 'बना रहे हैं...' : (language === 'hi' ? 'दुकान प्रोफ़ाइल बनाएं एवं डैशबोर्ड खोलें' : 'Create Shop & Launch Dashboard')}</span>
          </Button>

        </form>
      </Card>

    </div>
  );
}
