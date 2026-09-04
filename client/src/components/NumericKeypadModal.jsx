import React, { useState } from 'react';
import { X, Check, Delete, ArrowRight, User, Tag, Calendar, Banknote } from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export function NumericKeypadModal({ isOpen, onClose, onTransactionSaved, shopId = 'ramesh-kirana' }) {
  const { t, language } = useTranslation();
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState('income'); // 'income', 'expense', 'udhaar_given', 'udhaar_repaid'
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash', 'upi', 'khata'
  const [category, setCategory] = useState('Daily Counter Sales');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleKeyPress = (char) => {
    if (amountStr.length >= 7) return; // limit max
    setAmountStr(prev => prev + char);
  };

  const handleBackspace = () => {
    setAmountStr(prev => prev.slice(0, -1));
  };

  const handleAddPreset = (val) => {
    const current = Number(amountStr) || 0;
    setAmountStr(String(current + val));
  };

  const handleClear = () => {
    setAmountStr('');
  };

  const handleSubmit = async () => {
    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      setErrorMessage(language === 'hi' ? 'कृपया सही राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await api.createTransaction({
        shopId,
        amount,
        type,
        payment_mode: type.startsWith('udhaar') ? 'khata' : paymentMode,
        category: category || (type === 'income' ? 'Daily Counter Sales' : 'Shop Expense'),
        customer_vendor_name: customerName.trim(),
        date: new Date().toISOString().split('T')[0]
      });

      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        setAmountStr('');
        setCustomerName('');
        setErrorMessage('');
        onTransactionSaved?.();
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || (language === 'hi' ? 'लेन-देन दर्ज करने में त्रुटि आई' : 'Failed to record transaction'));
    } finally {
      setLoading(false);
    }
  };

  const categoriesByType = {
    income: ['Daily Counter Sales', 'Grains & Atta', 'Edible Oil & Ghee', 'Spices & Masala', 'Dairy & Tea', 'Biscuits & Snacks'],
    expense: ['Wholesale Stock Purchase', 'Shop Rent', 'Electricity Bill', 'Freight & Tempo', 'Packaging Bags'],
    udhaar_given: ['Monthly Grocery Khata', 'Emergency Ration', 'Fertilizer/Seeds Udhaar', 'Family Khata'],
    udhaar_repaid: ['Milk Settlement Return', 'Paddy/Crop Payout Repay', 'Partial Cash Clearing', 'Full Khata Settle']
  };

  const commonVillageCustomers = ['Masterji Ramswaroop', 'Dharmendra Yadav', 'Suresh Carpenter', 'Panchayat Sahayak Amit', 'Chachi Kunti Devi'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-paper-100 rounded-3xl border-2 border-terracotta-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-terracotta-700 to-terracotta-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-terracotta-900/40 rounded-lg">
              <Banknote className="w-5 h-5 text-ochre-300" />
            </span>
            <div>
              <h3 className="text-base font-bold">
                {language === 'hi' ? 'दैनिक बही-खाता प्रविष्टि' : 'Log Cash Flow Transaction'}
              </h3>
              <p className="text-[11px] text-terracotta-200">
                {language === 'hi' ? 'बड़े अंकों वाला टच पैड • कम लिखना' : 'Numeric Touch Logger • Low Literacy Friendly'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition text-terracotta-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span>⚠️</span>
                <span className="font-semibold">{errorMessage}</span>
              </div>
              <button 
                onClick={() => setErrorMessage('')}
                className="text-rose-600 hover:text-rose-900 text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}
          
          {/* 1. Transaction Type Selector (Large 4 Buttons) */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5">
              {language === 'hi' ? 'लेन-देन का प्रकार चुनें' : 'Transaction Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType('income'); setCategory('Daily Counter Sales'); }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  type === 'income'
                    ? 'bg-forestRural-600 text-white border-forestRural-700 shadow-sm'
                    : 'bg-white text-stone-700 border-paper-400 hover:border-forestRural-400'
                }`}
              >
                <span>🟢</span>
                <span>{language === 'hi' ? 'दुकान बिक्री (आवक)' : 'Shop Sale (Income)'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('expense'); setCategory('Wholesale Stock Purchase'); }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  type === 'expense'
                    ? 'bg-terracotta-600 text-white border-terracotta-700 shadow-sm'
                    : 'bg-white text-stone-700 border-paper-400 hover:border-terracotta-400'
                }`}
              >
                <span>🔴</span>
                <span>{language === 'hi' ? 'माल खरीदा / खर्च' : 'Stock Expense'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('udhaar_given'); setCategory('Monthly Grocery Khata'); }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  type === 'udhaar_given'
                    ? 'bg-ochre-600 text-white border-ochre-700 shadow-sm'
                    : 'bg-white text-stone-700 border-paper-400 hover:border-ochre-400'
                }`}
              >
                <span>🟡</span>
                <span>{language === 'hi' ? 'उधार दिया (खाता)' : 'Udhaar Given'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('udhaar_repaid'); setCategory('Milk Settlement Return'); }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  type === 'udhaar_repaid'
                    ? 'bg-indigoRural-600 text-white border-indigoRural-700 shadow-sm'
                    : 'bg-white text-stone-700 border-paper-400 hover:border-indigoRural-400'
                }`}
              >
                <span>🔵</span>
                <span>{language === 'hi' ? 'उधार वापस मिला' : 'Udhaar Repaid'}</span>
              </button>
            </div>
          </div>

          {/* 2. Big Amount Display */}
          <div className="bg-white rounded-2xl border-2 border-stone-300 p-3 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-stone-500">₹</span>
              <span className="text-3xl font-extrabold text-stone-900 tracking-tight min-h-[36px] flex items-center">
                {amountStr ? Number(amountStr).toLocaleString('en-IN') : '0'}
              </span>
            </div>
            {amountStr && (
              <button 
                onClick={handleClear}
                className="text-xs text-stone-400 hover:text-stone-700 font-semibold px-2 py-1 bg-stone-100 rounded-md"
              >
                {language === 'hi' ? 'साफ़' : 'Clear'}
              </button>
            )}
          </div>

          {/* 3. Quick Preset Increment Chips (+50, +100, +500, +1000) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[10px] font-bold text-stone-500 whitespace-nowrap">
              {language === 'hi' ? 'त्वरित जोड़ें:' : 'Quick Add:'}
            </span>
            {[50, 100, 200, 500, 1000, 2000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleAddPreset(val)}
                className="px-2.5 py-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg shadow-sm whitespace-nowrap active:scale-95 transition"
              >
                +₹{val}
              </button>
            ))}
          </div>

          {/* 4. Tactile Touch Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 bg-stone-100 p-2.5 rounded-2xl border border-stone-200">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 bg-white hover:bg-paper-50 active:bg-amber-100 rounded-xl font-extrabold text-lg text-stone-800 border border-stone-200 shadow-sm flex items-center justify-center transition active:scale-95"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 bg-terracotta-50 hover:bg-terracotta-100 active:bg-terracotta-200 rounded-xl font-bold text-terracotta-800 border border-terracotta-200 shadow-sm flex items-center justify-center transition active:scale-95"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* 5. Payment Mode (Cash vs UPI vs Khata) */}
          {!type.startsWith('udhaar') && (
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                {language === 'hi' ? 'भुगतान का माध्यम' : 'Payment Mode'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMode === 'cash'
                      ? 'bg-amber-700 text-white border-amber-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'
                  }`}
                >
                  💵 {language === 'hi' ? 'नकदी (Cash)' : 'Cash'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMode === 'upi'
                      ? 'bg-indigoRural-700 text-white border-indigoRural-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-indigoRural-300'
                  }`}
                >
                  📱 {language === 'hi' ? 'डिजिटल यूपीआई (QR / PhonePe)' : 'Digital UPI (QR)'}
                </button>
              </div>
            </div>
          )}

          {/* 6. Customer or Vendor Name (Especially for Udhaar / Khata) */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              {type === 'expense' 
                ? (language === 'hi' ? 'थोक व्यापारी / मंडी का नाम' : 'Vendor / Mandi Supplier')
                : (language === 'hi' ? 'ग्राहक का नाम (उधार / विशेष ग्राहक)' : 'Customer Name (Optional for cash sales)')}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={type === 'expense' ? 'उदा. गल्ला मंडी बलरामपुर' : 'उदा. मास्टरजी रामस्वरूप'}
              className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-terracotta-500"
            />
            {type.startsWith('udhaar') && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {commonVillageCustomers.slice(0, 4).map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCustomerName(name)}
                    className="text-[10px] bg-paper-200 hover:bg-paper-300 text-stone-700 px-2 py-0.5 rounded-md border border-paper-400"
                  >
                    + {name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Submit Button */}
        <div className="p-3 bg-white border-t border-paper-300">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !amountStr || Number(amountStr) <= 0}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition ${
              !amountStr || Number(amountStr) <= 0
                ? 'bg-stone-300 cursor-not-allowed'
                : successToast
                ? 'bg-emerald-600'
                : 'bg-terracotta-600 hover:bg-terracotta-700 active:scale-[0.98]'
            }`}
          >
            {successToast ? (
              <>
                <Check className="w-5 h-5" />
                <span>{language === 'hi' ? 'बही-खाते में दर्ज हो गया!' : 'Recorded in Bahi-Khata!'}</span>
              </>
            ) : loading ? (
              <span>{language === 'hi' ? 'दर्ज हो रहा है...' : 'Saving...'}</span>
            ) : (
              <>
                <span>{language === 'hi' ? 'बही-खाते में जोड़ें' : 'Save to Bahi-Khata'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
