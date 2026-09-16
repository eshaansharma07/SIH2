import React, { useState } from 'react';
import { X, Check, Delete, ArrowRight, User, Tag, Calendar, Banknote, ShieldCheck, Smartphone, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { Badge, Button } from './ui';

export function NumericKeypadModal({ isOpen, onClose, onTransactionSaved, shopId }) {
  const { t, language } = useTranslation();
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState('income'); // 'income', 'expense', 'udhaar_given', 'udhaar_repaid'
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash', 'upi', 'khata'
  const [category, setCategory] = useState('Daily Counter Sales');
  const [customerName, setCustomerName] = useState('');
  const [customerList, setCustomerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch shop customers for quick selection
  React.useEffect(() => {
    if (!isOpen || !shopId) return;
    api.getCustomers(shopId)
      .then(res => {
        if (res?.customers && Array.isArray(res.customers)) {
          setCustomerList(res.customers);
        }
      })
      .catch(() => {});
  }, [isOpen, shopId]);

  if (!isOpen) return null;

  const handleKeyPress = (char) => {
    if (amountStr.length >= 7) return;
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
    if (!shopId) {
      setErrorMessage(language === 'hi' ? 'दुकान की पहचान उपलब्ध नहीं है' : 'Shop ID is missing. Please set up a shop first.');
      return;
    }
    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      setErrorMessage(language === 'hi' ? 'कृपया सही राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const assignedCategory = category || (type === 'income' ? 'Daily Counter Sales' : type === 'expense' ? 'Wholesale Stock Purchase' : 'Monthly Grocery Khata');
    const assignedMode = type.startsWith('udhaar') ? 'khata' : paymentMode;
    const nowIso = new Date().toISOString();

    const localTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      shop_id: shopId,
      shopId,
      amount,
      type,
      payment_mode: assignedMode,
      category: assignedCategory,
      customer_vendor_name: customerName.trim(),
      date: nowIso.split('T')[0],
      created_at: nowIso
    };

    try {
      const res = await api.createTransaction(localTx);
      const finalTx = res?.transaction || localTx;

      setSuccessToast(true);
      onTransactionSaved?.(finalTx);

      setTimeout(() => {
        setSuccessToast(false);
        setAmountStr('');
        setCustomerName('');
        setErrorMessage('');
        onClose();
      }, 500);
    } catch (err) {
      console.warn('Offline / network error, applying optimistic save:', err.message);
      onTransactionSaved?.(localTx);
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        setAmountStr('');
        setCustomerName('');
        setErrorMessage('');
        onClose();
      }, 500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-indigoRural-950/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-paper-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] transition-all">
        
        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-paper-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-terracotta-600 animate-pulse" />
            <h3 className="text-sm font-black text-indigoRural-900 tracking-tight font-display">
              {language === 'hi' ? 'लेन-देन दर्ज करें' : 'Log Transaction'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-indigoRural-400 hover:text-indigoRural-800 hover:bg-paper-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          
          {errorMessage && (
            <div className="bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-xs px-3 py-2 rounded-xl flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-terracotta-600 shrink-0" />
                <span>{errorMessage}</span>
              </span>
              <button 
                type="button"
                onClick={() => setErrorMessage('')} 
                className="text-terracotta-600 hover:text-terracotta-900 p-0.5 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1. Transaction Type Segmented Pill Bar */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-paper-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('Daily Counter Sales'); }}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                type === 'income' 
                  ? 'bg-forestRural-600 text-white shadow-2xs' 
                  : 'text-indigoRural-600 hover:text-indigoRural-900'
              }`}
            >
              {language === 'hi' ? 'बिक्री' : 'Sale'}
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory('Wholesale Stock Purchase'); }}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                type === 'expense' 
                  ? 'bg-terracotta-600 text-white shadow-2xs' 
                  : 'text-indigoRural-600 hover:text-indigoRural-900'
              }`}
            >
              {language === 'hi' ? 'खर्च' : 'Expense'}
            </button>
            <button
              type="button"
              onClick={() => { setType('udhaar_given'); setCategory('Monthly Grocery Khata'); }}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                type.startsWith('udhaar') 
                  ? 'bg-ochre-500 text-white shadow-2xs' 
                  : 'text-indigoRural-600 hover:text-indigoRural-900'
              }`}
            >
              {language === 'hi' ? 'उधार' : 'Udhaar'}
            </button>
          </div>

          {/* 2. Hero Currency Amount Display */}
          <div className="py-3 px-4 bg-paper-50 rounded-xl border border-paper-300 flex items-center justify-between">
            <span className="text-xl font-bold text-indigoRural-400">₹</span>
            <div className="flex-1 text-right overflow-x-auto">
              <span className={`font-black tracking-tight tabular-nums transition-all ${
                amountStr.length > 5 ? 'text-3xl' : 'text-4xl'
              } ${amountStr ? 'text-indigoRural-900' : 'text-paper-400'}`}>
                {amountStr ? Number(amountStr).toLocaleString('en-IN') : '0'}
              </span>
            </div>
          </div>

          {/* 3. Preset Quick Pills */}
          <div className="flex items-center justify-between gap-1.5">
            {[100, 500, 1000, 2000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleAddPreset(val)}
                className="flex-1 py-1 px-2 rounded-lg bg-paper-100 hover:bg-paper-200 text-indigoRural-800 text-xs font-bold transition border border-paper-300 active:scale-95 cursor-pointer"
              >
                +{val}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-1 px-2.5 rounded-lg bg-paper-200 hover:bg-paper-300 text-indigoRural-700 text-xs font-bold transition cursor-pointer"
            >
              C
            </button>
          </div>

          {/* 4. Customer Name for Udhaar or Payment Mode for Sale */}
          {type.startsWith('udhaar') ? (
            <div className="space-y-1">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={language === 'hi' ? 'ग्राहक का नाम (e.g. मास्टरजी)' : 'Customer Name (e.g. Masterji)'}
                className="w-full px-3 py-2 bg-paper-50 border border-paper-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta-500 text-indigoRural-900"
              />
              <div className="flex gap-1 overflow-x-auto py-1">
                {(customerList.length > 0 ? customerList.map(c => c.name) : commonVillageCustomers).slice(0, 6).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCustomerName(c)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap border transition cursor-pointer ${
                      customerName === c
                        ? 'bg-terracotta-600 text-white border-terracotta-600'
                        : 'bg-paper-100 hover:bg-paper-200 text-indigoRural-700 border-paper-300'
                    }`}
                  >
                    {c.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentMode === 'cash' ? 'bg-indigoRural-900 text-white' : 'bg-paper-100 text-indigoRural-700 border border-paper-300'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentMode === 'upi' ? 'bg-terracotta-600 text-white' : 'bg-paper-100 text-indigoRural-700 border border-paper-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>UPI QR</span>
                </button>
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-paper-100 text-indigoRural-800 font-semibold rounded-lg text-xs border border-paper-300 focus:ring-2 focus:ring-terracotta-500"
              >
                {(categoriesByType[type] || categoriesByType.income).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Tactile Numeric Touch Keypad Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1 select-none">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(digit => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-xl bg-paper-50 hover:bg-paper-100 border border-paper-300 active:scale-90 text-indigoRural-900 text-lg font-extrabold flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-paper-200 hover:bg-paper-300 active:scale-90 text-indigoRural-800 flex items-center justify-center transition cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* 6. Primary Action Save Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !amountStr || Number(amountStr) <= 0}
            className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] cursor-pointer ${
              successToast
                ? 'bg-forestRural-600 text-white'
                : 'bg-terracotta-600 hover:bg-terracotta-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {successToast ? (
              <>
                <Check className="w-5 h-5" />
                <span>{language === 'hi' ? 'सफलतापूर्वक दर्ज हुआ!' : 'Saved Instantly (0ms)'}</span>
              </>
            ) : (
              <span>
                {language === 'hi' ? 'बही-खाता में दर्ज करें' : 'Record in Bahi-Khata'}
              </span>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}
