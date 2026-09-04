import React, { useState } from 'react';
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
  Building2 
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';

export function ShopProfilePage({ shop, onShopUpdated, onReloadDemo }) {
  const { language } = useTranslation();
  const [shopName, setShopName] = useState(shop?.name || 'Ramesh Kirana & General Store');
  const [ownerName, setOwnerName] = useState(shop?.owner_name || 'Ramesh Kumar');
  const [phone, setPhone] = useState(shop?.phone || '+91 98391 24789');
  const [village, setVillage] = useState(shop?.village || 'Utraula Dehat');
  const [district, setDistrict] = useState(shop?.district || 'Balrampur');
  const [state, setState] = useState(shop?.state || 'Uttar Pradesh');
  const [vintage, setVintage] = useState(shop?.vintage_years || 4);
  const [bank, setBank] = useState(shop?.bank_account_type || 'Gramin Bank (Aryavart Bank)');
  const [apiKey, setApiKey] = useState(localStorage.getItem('vyapaar_claude_api_key') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (apiKey) {
        localStorage.setItem('vyapaar_claude_api_key', apiKey);
      } else {
        localStorage.removeItem('vyapaar_claude_api_key');
      }

      const res = await api.updateShop(shop?.id || 'ramesh-kirana', {
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
      alert('Error saving profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-paper-300 shadow-paper">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-terracotta-100 text-terracotta-800 rounded-xl">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-black text-stone-900">
              {language === 'hi' ? 'दुकान प्रोफ़ाइल एवं सेटिंग्स' : 'Shop Profile & Settings'}
            </h1>
            <p className="text-xs text-stone-500">
              {language === 'hi' ? 'अपनी दुकान की जानकारी, बैंक खाता और एआई सेटिंग्स अपडेट करें' : 'Manage your enterprise details, banking records, and AI key'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-paper-300 shadow-paper space-y-6">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          
          <div className="border-b border-paper-200 pb-3">
            <h2 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
              {language === 'hi' ? 'मूल विवरण' : 'Primary Information'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'दुकान का नाम' : 'Enterprise Name'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper-50 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:border-terracotta-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'दुकानदार / स्वामी का नाम' : 'Proprietor Name'}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper-50 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:border-terracotta-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'गांव / मोहल्ला' : 'Village'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'व्यापार अनुभव (वर्ष)' : 'Vintage (Years)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper-50 rounded-xl border border-stone-300 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'hi' ? 'बैंक खाता विवरण' : 'Bank Account Type'}
              </label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="उदा. Aryavart Gramin Bank"
                className="w-full px-3.5 py-2.5 bg-paper-50 rounded-xl border border-stone-300 text-xs font-semibold"
              />
            </div>
          </div>

          {/* AI Settings Section (Gemini API Key Free Tier) */}
          <div className="pt-4 border-t border-paper-200 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-ochre-700" />
              <h2 className="text-sm font-extrabold text-stone-900">
                {language === 'hi' ? 'Google Gemini API (फ्री टियर)' : 'Google Gemini API (Free Tier via Google AI Studio)'}
              </h2>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              {language === 'hi'
                ? 'व्यापार साथी बिना किसी एपीआई कुंजी के भी 6 पूर्व-निर्मित स्थानीय सलाह परिदृश्यों (Safety Net) पर पूरी तरह काम करता है। यदि आप लाइव जेमिनी 2.5 फ्लैश टेस्ट करना चाहते हैं तो अपनी निःशुल्क Google AI Studio कुंजी यहाँ दर्ज करें।'
                : 'Vyapaar Saathi operates smoothly without an API key using 6 grounded rural fallback scenarios. To enable live gemini-2.5-flash responses, paste your free Google AI Studio key below.'}
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 bg-paper-50 rounded-xl border border-stone-300 text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onReloadDemo}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'रमेश 90-दिन डेमो रीसेट करें' : 'Reset Demo to Ramesh'}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-terracotta-600 hover:bg-terracotta-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{language === 'hi' ? 'सुरक्षित हो गया!' : 'Changes Saved!'}</span>
                </>
              ) : (
                <span>{language === 'hi' ? 'सेव करें' : 'Save Changes'}</span>
              )}
            </button>
          </div>

        </form>
      </div>

      <WarliBorder className="my-3 opacity-60" />

    </div>
  );
}
