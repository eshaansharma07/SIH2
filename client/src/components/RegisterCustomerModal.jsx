import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, ShieldAlert, Check, AlertCircle, Banknote, FileText } from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export function RegisterCustomerModal({ isOpen, onClose, onCustomerRegistered, shopId }) {
  const { language } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [creditLimit, setCreditLimit] = useState('5000');
  const [initialBalance, setInitialBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const presetLimits = [2000, 5000, 8000, 10000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया ग्राहक का नाम दर्ज करें' : 'Please enter customer name');
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '').replace(/^91/, '');
    if (cleanDigits.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        shopId,
        name: name.trim(),
        phone: cleanDigits,
        village_address: village.trim(),
        credit_limit: Number(creditLimit) || 5000,
        notes: notes.trim(),
        initialBalance: Number(initialBalance) || 0
      };

      const res = await api.createCustomer(payload);
      if (res.success && res.customer) {
        setSuccess(true);
        setTimeout(() => {
          onCustomerRegistered?.(res.customer);
          setSuccess(false);
          setName('');
          setPhone('');
          setVillage('');
          setCreditLimit('5000');
          setInitialBalance('');
          setNotes('');
          onClose();
        }, 600);
      } else {
        throw new Error(res.error || 'Failed to register customer');
      }
    } catch (err) {
      console.error('Customer registration error:', err);
      setErrorMsg(err.message || 'Error creating customer record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-indigoRural-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl border border-paper-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-paper-200 flex items-center justify-between bg-paper-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-indigoRural-900 font-display">
                {language === 'hi' ? 'नया ग्राहक जोड़ें (उधार खाता)' : 'Register Customer (Udhaar Khata)'}
              </h3>
              <p className="text-[11px] text-indigoRural-500">
                {language === 'hi' ? 'व्हाट्सएप तगादा और बही-खाता ट्रैक करने के लिए' : 'For WhatsApp reminders & credit limit tracking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-indigoRural-400 hover:text-indigoRural-800 hover:bg-paper-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl text-terracotta-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-terracotta-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-indigoRural-800 flex items-center gap-1.5">
              <span>{language === 'hi' ? 'ग्राहक का पूरा नाम' : 'Customer Full Name'}</span>
              <span className="text-terracotta-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'hi' ? 'उदा. राम प्रसाद यादव / मास्टरजी' : 'e.g. Ram Prasad Yadav / Masterji'}
              className="w-full px-3.5 py-2.5 bg-paper-50 border border-paper-300 rounded-xl font-semibold text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:bg-white transition"
            />
          </div>

          {/* 2. Mobile Number */}
          <div className="space-y-1.5">
            <label className="font-bold text-indigoRural-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-forestRural-600" />
                <span>{language === 'hi' ? 'मोबाइल नंबर (व्हाट्सएप हेतु)' : 'Mobile Number (for WhatsApp)'}</span>
                <span className="text-terracotta-600">*</span>
              </span>
              <span className="text-[10px] text-forestRural-700 font-bold bg-forestRural-50 px-1.5 py-0.5 rounded border border-forestRural-200">
                1-Click WhatsApp
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-bold text-indigoRural-500 text-xs select-none">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                className="w-full pl-14 pr-3.5 py-2.5 bg-paper-50 border border-paper-300 rounded-xl font-bold text-indigoRural-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-forestRural-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* 3. Village / Address */}
          <div className="space-y-1.5">
            <label className="font-bold text-indigoRural-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-ochre-600" />
              <span>{language === 'hi' ? 'गाँव / मौहल्ला / पता' : 'Village / Locality / Address'}</span>
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder={language === 'hi' ? 'उदा. उतरौला देहात / चौहानपुर' : 'e.g. Utraula Dehat / Chauhanpur'}
              className="w-full px-3.5 py-2.5 bg-paper-50 border border-paper-300 rounded-xl font-semibold text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-ochre-500 focus:bg-white transition"
            />
          </div>

          {/* 4. Credit Limit Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-indigoRural-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigoRural-600" />
                <span>{language === 'hi' ? 'उधार सीमा (क्रेडिट लिमिट)' : 'Credit Limit (Max Udhaar)'}</span>
              </label>
              <span className="font-black text-xs text-indigoRural-900">
                ₹{Number(creditLimit || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {presetLimits.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCreditLimit(String(amt))}
                  className={`py-1.5 rounded-lg font-bold text-xs transition cursor-pointer border ${
                    creditLimit === String(amt)
                      ? 'bg-indigoRural-900 text-white border-indigoRural-900'
                      : 'bg-paper-100 text-indigoRural-700 border-paper-300 hover:bg-paper-200'
                  }`}
                >
                  ₹{(amt / 1000)}k
                </button>
              ))}
            </div>

            <input
              type="number"
              min="500"
              step="500"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="Custom Credit Limit ₹"
              className="w-full px-3 py-2 bg-paper-50 border border-paper-300 rounded-xl text-xs font-semibold text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-indigoRural-500"
            />
          </div>

          {/* 5. Existing Paper Balance (Optional) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-ochre-50/60 border border-ochre-200">
            <label className="font-bold text-ochre-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-ochre-700" />
                <span>{language === 'hi' ? 'पुरानी डायरी का बकाया (यदि हो)' : 'Existing Paper Khata Balance (Optional)'}</span>
              </span>
            </label>
            <input
              type="number"
              min="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="₹ 0 (उदा. ₹450 पिछला बाकी)"
              className="w-full px-3 py-2 bg-white border border-ochre-300 rounded-xl text-xs font-bold text-ochre-900 focus:outline-none focus:ring-2 focus:ring-ochre-500"
            />
            <p className="text-[10px] text-ochre-700">
              {language === 'hi' 
                ? 'यदि ग्राहक का पहले से डायरी में हिसाब था, तो यहाँ दर्ज करें। यह सीधे बही-खाता में जुड़ जाएगा।'
                : 'Transfers existing paper ledger balance into customer digital khata.'}
            </p>
          </div>

          {/* 6. Notes / Profession */}
          <div className="space-y-1.5">
            <label className="font-bold text-indigoRural-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-paper-500" />
              <span>{language === 'hi' ? 'काम-धंधा / टिप्पणी (ऐच्छिक)' : 'Profession / Notes (Optional)'}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'hi' ? 'उदा. शिक्षक, दूध किसान, फसल कटाई पर भुगतान' : 'e.g. Teacher, settles after harvest'}
              className="w-full px-3 py-2 bg-paper-50 border border-paper-300 rounded-xl text-xs font-medium text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-paper-400"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] cursor-pointer ${
                success 
                  ? 'bg-forestRural-600 text-white'
                  : 'bg-terracotta-600 hover:bg-terracotta-700 text-white disabled:opacity-50'
              }`}
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'hi' ? 'ग्राहक खाता तैयार!' : 'Customer Registered!'}</span>
                </>
              ) : loading ? (
                <span>{language === 'hi' ? 'खाता सुरक्षित हो रहा है...' : 'Saving Customer Record...'}</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'ग्राहक का खाता खोलें' : 'Create Customer Khata'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
