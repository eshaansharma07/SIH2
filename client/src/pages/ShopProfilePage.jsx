import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Settings, 
  Key, 
  RotateCcw, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Building2,
  AlertCircle,
  X 
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, SectionHeader, Button } from '../components/ui';

export function ShopProfilePage({ shop, onShopUpdated, onReloadDemo }) {
  const { language } = useTranslation();
  const [shopName, setShopName] = useState(shop?.name || '');
  const [ownerName, setOwnerName] = useState(shop?.owner_name || '');
  const [phone, setPhone] = useState(shop?.phone || '');
  const [village, setVillage] = useState(shop?.village || '');
  const [district, setDistrict] = useState(shop?.district || '');
  const [state, setState] = useState(shop?.state || '');
  const [vintage, setVintage] = useState(shop?.vintage_years ?? 1);
  const [bank, setBank] = useState(shop?.bank_account_type || 'State Bank of India');
  const [apiKey, setApiKey] = useState(localStorage.getItem('vyapaar_gemini_api_key') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shop) {
      setShopName(shop.name || '');
      setOwnerName(shop.owner_name || '');
      setPhone(shop.phone || '');
      setVillage(shop.village || '');
      setDistrict(shop.district || '');
      setState(shop.state || '');
      setVintage(shop.vintage_years ?? 4);
      setBank(shop.bank_account_type || '');
    }
  }, [shop]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (apiKey) {
        localStorage.setItem('vyapaar_gemini_api_key', apiKey);
      } else {
        localStorage.removeItem('vyapaar_gemini_api_key');
      }

      if (!shop?.id) {
        throw new Error(language === 'hi' ? 'दुकान की पहचान उपलब्ध नहीं है' : 'Shop ID is missing');
      }

      const res = await api.updateShop(shop.id, {
        name: shopName,
        owner_name: ownerName,
        phone,
        village,
        district,
        state,
        vintage_years: Number(vintage),
        bank_account_type: bank
      });

      if (res.shop) {
        onShopUpdated?.(res.shop);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
      
      {/* Header with Warli Border */}
      <div className="space-y-2">
        <Card padding="md">
          <SectionHeader
            icon={Settings}
            iconColor="terracotta"
            title={language === 'hi' ? 'दुकान प्रोफ़ाइल एवं सेटिंग्स' : 'Shop Profile & Settings'}
            subtitle={language === 'hi' ? 'अपनी दुकान की जानकारी, बैंक खाता और एआई सेटिंग्स अपडेट करें' : 'Manage your enterprise details, banking records, and AI key'}
          />
        </Card>
        <WarliBorder className="w-full h-6 text-terracotta-400 opacity-60" />
      </div>

      {/* Main Settings Form */}
      <Card padding="lg" className="space-y-6">
        <form onSubmit={handleSaveProfile} className="space-y-5">
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
          
          <div className="border-b border-paper-200 pb-3">
            <h2 className="text-xs font-black text-indigoRural-900 uppercase tracking-wider font-display">
              {language === 'hi' ? 'मूल विवरण' : 'Primary Information'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'दुकान का नाम' : 'Enterprise Name'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'दुकानदार / स्वामी का नाम' : 'Proprietor Name'}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'गांव / मोहल्ला' : 'Village'}
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
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
                className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'व्यापार अनुभव (वर्ष)' : 'Vintage (Years)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigoRural-700 mb-1.5">
                {language === 'hi' ? 'बैंक खाता विवरण' : 'Bank Account Type'}
              </label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="उदा. Aryavart Gramin Bank"
                className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
              />
            </div>
          </div>

          {/* AI Settings Section */}
          <div className="pt-4 border-t border-paper-200 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-ochre-600" />
              <h2 className="text-xs font-black text-indigoRural-900 uppercase tracking-wider font-display">
                {language === 'hi' ? 'Google Gemini API (फ्री टियर)' : 'Google Gemini API (Free Tier via Google AI Studio)'}
              </h2>
            </div>
            <p className="text-xs text-indigoRural-500 leading-relaxed">
              {language === 'hi'
                ? 'व्यापार साथी बिना किसी एपीआई कुंजी के भी 6 पूर्व-निर्मित स्थानीय सलाह परिदृश्यों (Safety Net) पर पूरी तरह काम करता है। यदि आप लाइव जेमिनी 2.5 फ्लैश टेस्ट करना चाहते हैं तो अपनी निःशुल्क Google AI Studio कुंजी यहाँ दर्ज करें।'
                : 'Vyapaar Saathi operates smoothly without an API key using 6 grounded rural fallback scenarios. To enable live gemini-2.5-flash responses, paste your free Google AI Studio key below.'}
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 bg-paper-50 focus:bg-white rounded-xl border border-paper-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-indigoRural-900"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              onClick={onReloadDemo}
              variant="secondary"
              size="sm"
              icon={RotateCcw}
            >
              <span>{language === 'hi' ? 'रमेश 90-दिन डेमो रीसेट करें' : 'Reset Demo to Ramesh'}</span>
            </Button>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="md"
              icon={savedSuccess ? Check : undefined}
            >
              <span>{savedSuccess ? (language === 'hi' ? 'सुरक्षित हो गया!' : 'Changes Saved!') : (language === 'hi' ? 'सेव करें' : 'Save Changes')}</span>
            </Button>
          </div>

        </form>
      </Card>

    </div>
  );
}
