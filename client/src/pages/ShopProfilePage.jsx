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
import { safeStorage } from '../utils/safeStorage';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, SectionHeader, Button } from '../components/ui';
import { INDIAN_STATES_AND_UTS, findStandardState } from '../data/indianStates';

export function ShopProfilePage({ shop, onShopUpdated, onReloadDemo }) {
  const { language } = useTranslation();
  const [shopName, setShopName] = useState(shop?.name || '');
  const [ownerName, setOwnerName] = useState(shop?.owner_name || '');
  const [phone, setPhone] = useState(shop?.phone || '');
  const [village, setVillage] = useState(shop?.village || '');
  const [district, setDistrict] = useState(shop?.district || '');
  const [state, setState] = useState(findStandardState(shop?.state) || 'Uttar Pradesh');
  const [vintage, setVintage] = useState(shop?.vintage_years ?? 1);
  const [bank, setBank] = useState(shop?.bank_account_type || 'State Bank of India');
  const [apiKey, setApiKey] = useState(() => safeStorage.getItem('vyapaar_gemini_api_key', ''));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // DPI Udyam Verification States
  const [udyamNumber, setUdyamNumber] = useState(
    shop?.udyam_number || (shop?.id ? `UDYAM-${(shop.state || 'UP').substring(0, 2).toUpperCase()}-01-0024891` : 'UDYAM-UP-01-0024891')
  );
  const [isUdyamVerified, setIsUdyamVerified] = useState(Boolean(shop?.is_udyam_verified));
  const [udyamLoading, setUdyamLoading] = useState(false);
  const [udyamSuccessMsg, setUdyamSuccessMsg] = useState('');
  const [udyamErrorMsg, setUdyamErrorMsg] = useState('');
  const [udyamDetails, setUdyamDetails] = useState(null);

  useEffect(() => {
    if (shop) {
      setShopName(shop.name || '');
      setOwnerName(shop.owner_name || '');
      setPhone(shop.phone || '');
      setVillage(shop.village || '');
      setDistrict(shop.district || '');
      setState(findStandardState(shop.state) || 'Uttar Pradesh');
      setVintage(shop.vintage_years ?? 4);
      setBank(shop.bank_account_type || '');
      setIsUdyamVerified(Boolean(shop.is_udyam_verified));
      if (shop.udyam_number) setUdyamNumber(shop.udyam_number);
    }
  }, [shop]);

  const handleVerifyUdyam = async () => {
    if (!udyamNumber) {
      setUdyamErrorMsg('Please enter an Udyam Registration Number.');
      return;
    }
    setUdyamLoading(true);
    setUdyamErrorMsg('');
    setUdyamSuccessMsg('');
    try {
      const res = await api.verifyUdyam({
        udyamNumber: udyamNumber.trim().toUpperCase(),
        shopId: shop?.id
      });
      if (res.verified) {
        setIsUdyamVerified(true);
        setUdyamDetails(res);
        setUdyamSuccessMsg(language === 'hi' ? 'उद्यम पंजीकरण सफलतापूर्वक सत्यापित हो गया!' : 'Udyam Registration successfully verified!');
        if (shop) {
          const updatedShop = {
            ...shop,
            is_udyam_verified: 1,
            udyam_number: res.udyamNumber
          };
          onShopUpdated?.(updatedShop);
        }
      }
    } catch (err) {
      setUdyamErrorMsg(err.message || 'Verification failed. Format: UDYAM-XX-00-0000000');
    } finally {
      setUdyamLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (apiKey) {
        safeStorage.setItem('vyapaar_gemini_api_key', apiKey);
      } else {
        safeStorage.removeItem('vyapaar_gemini_api_key');
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
          
          <div className="border-b border-stone-200 pb-3">
            <h2 className="text-xs font-black text-stone-900 uppercase tracking-wider font-display">
              {language === 'hi' ? 'मूल विवरण' : 'Primary Information'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'hi' ? 'दुकान का नाम' : 'Enterprise Name'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'hi' ? 'दुकानदार / स्वामी का नाम' : 'Proprietor Name'}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'hi' ? 'गांव / मोहल्ला' : 'Village'}
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'hi' ? 'जिला (District)' : 'District'}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'hi' ? 'राज्य / UT (State / UT)' : 'State / Union Territory'}
              </label>
              <select
                value={findStandardState(state)}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-stone-900"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'hi' ? 'व्यापार अनुभव (वर्ष)' : 'Vintage (Years)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'hi' ? 'बैंक खाता विवरण' : 'Bank Account Type'}
              </label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="उदा. Aryavart Gramin Bank"
                className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-stone-900"
              />
            </div>
          </div>

          {/* AI Settings Section */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-black text-stone-900 uppercase tracking-wider font-display">
                {language === 'hi' ? 'Google Gemini API (फ्री टियर)' : 'Google Gemini API (Free Tier via Google AI Studio)'}
              </h2>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              {language === 'hi'
                ? 'साख सेतु बिना किसी एपीआई कुंजी के भी 6 पूर्व-निर्मित स्थानीय सलाह परिदृश्यों (Safety Net) पर पूरी तरह काम करता है। यदि आप लाइव जेमिनी 2.5 फ्लैश टेस्ट करना चाहते हैं तो अपनी निःशुल्क Google AI Studio कुंजी यहाँ दर्ज करें।'
                : 'SaakhSetu operates smoothly without an API key using 6 grounded rural fallback scenarios. To enable live gemini-2.5-flash responses, paste your free Google AI Studio key below.'}
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition text-stone-900"
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

      {/* DPI India Stack — Udyam MSME Verification Section */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-stone-900 font-display">
                {language === 'hi' ? 'उद्यम एमएसएमई नंबर सत्यापन (सिमुलेटेड)' : 'Udyam MSME Verification (Simulated Check)'}
              </h2>
              <p className="text-xs text-stone-500">
                {language === 'hi' ? 'उद्यम नंबर प्रारूप सत्यापन (सिमुलेटेड — किसी सरकारी प्रणाली से जुड़ा नहीं)' : 'Udyam Number Format Check (Simulated — not connected to any government system)'}
              </p>
            </div>
          </div>
          <Badge variant={isUdyamVerified ? 'positive' : 'attention'} size="md">
            {isUdyamVerified ? '● UDYAM VERIFIED (Mock Gateway)' : 'UNVERIFIED (OPTIONAL)'}
          </Badge>
        </div>

        {udyamSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{udyamSuccessMsg}</span>
          </div>
        )}

        {udyamErrorMsg && (
          <div className="bg-terracotta-50 border border-terracotta-200 text-terracotta-800 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-terracotta-600 shrink-0" />
            <span>{udyamErrorMsg}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-700">
            {language === 'hi' ? 'उद्यम पंजीकरण संख्या' : 'Udyam Registration Number'}
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={udyamNumber}
              onChange={(e) => setUdyamNumber(e.target.value.toUpperCase())}
              placeholder="UDYAM-UP-01-0024891"
              className="flex-1 px-3.5 py-2.5 bg-stone-50 focus:bg-white rounded-xl border border-stone-300 text-xs font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-stone-900 uppercase"
            />
            <Button
              type="button"
              onClick={handleVerifyUdyam}
              disabled={udyamLoading}
              variant="forest"
              size="md"
              icon={ShieldCheck}
            >
              <span>{udyamLoading ? (language === 'hi' ? 'सत्यापित किया जा रहा है...' : 'Checking format...') : (language === 'hi' ? 'सत्यापित करें' : 'Verify Udyam')}</span>
            </Button>
          </div>
          <p className="text-[11px] text-stone-400">
            Format: <code className="font-mono text-stone-600 font-bold">UDYAM-XX-00-0000000</code> (e.g. UDYAM-UP-01-0024891, UDYAM-MH-12-0049281)
          </p>
        </div>

        {isUdyamVerified && (
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between items-center font-semibold text-stone-600">
              <span>Enterprise Classification:</span>
              <strong className="text-emerald-700 font-bold">Micro Enterprise (Internal PSL-Format Tier: A)</strong>
            </div>
            <div className="flex justify-between items-center font-semibold text-stone-600">
              <span>Primary Business Activity:</span>
              <strong className="text-stone-900 font-bold">Retail Trade (NIC 4711)</strong>
            </div>
            <div className="flex justify-between items-center font-semibold text-stone-600">
              <span>District Industries Centre (DIC):</span>
              <strong className="text-stone-900 font-bold">{shop?.district || 'Varanasi'}, {shop?.state || 'Uttar Pradesh'}</strong>
            </div>
            <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-200/60 italic">
              Verification confirmed via DPI India Stack Mock Gateway conforming to Sahamati & MSME standards.
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}
