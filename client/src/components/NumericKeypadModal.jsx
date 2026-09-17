import React, { useState, useEffect } from 'react';
import { X, Check, Delete, ArrowRight, User, Tag, Calendar, Banknote, ShieldCheck, Smartphone, AlertCircle, Phone, Mic, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { Badge, Button } from './ui';
import { 
  findMatchingCustomer, 
  searchCustomerSuggestions, 
  maskIndianPhone, 
  cleanIndianPhone,
  getCustomerDetails,
  getCachedCustomers, 
  setCachedCustomers 
} from '../utils/customerMatcher';

export function NumericKeypadModal({ isOpen, onClose, onTransactionSaved, shopId, onOpenVoice }) {
  const { t, language } = useTranslation();
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState('income'); // 'income', 'expense', 'udhaar_given', 'udhaar_repaid'
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash', 'upi', 'khata'
  const [category, setCategory] = useState('Daily Counter Sales');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerList, setCustomerList] = useState(() => getCachedCustomers(shopId));
  const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch shop customers for quick selection & live search (resilient with local cache)
  useEffect(() => {
    if (!isOpen || !shopId) return;

    // Load instantly from synchronous cache
    const cached = getCachedCustomers(shopId);
    if (cached && cached.length > 0) {
      setCustomerList(cached);
    } else {
      setIsFetchingCustomers(true);
    }

    let isMounted = true;
    api.getCustomers(shopId)
      .then(res => {
        if (!isMounted) return;
        if (res?.customers && Array.isArray(res.customers)) {
          setCustomerList(res.customers);
          setCachedCustomers(shopId, res.customers);
        }
      })
      .catch((err) => {
        console.warn('Could not refresh customers from server:', err?.message);
      })
      .finally(() => {
        if (isMounted) setIsFetchingCustomers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, shopId]);

  if (!isOpen) return null;

  const customerSuggestions = searchCustomerSuggestions(customerName, customerList, 6);

  const handleSelectCustomer = (customer) => {
    const details = getCustomerDetails(customer);
    const name = details.name;
    const phone = details.cleanPhone;

    setCustomerName(name);
    setSelectedCustomer(details);
    setShowSuggestions(false);

    if (phone) {
      setCustomerPhone(phone);
      setIsPhoneLocked(true);
    } else {
      setCustomerPhone('');
      setIsPhoneLocked(false);
    }
    setErrorMessage('');
  };

  const handleCustomerNameChange = (e) => {
    const val = e.target.value;
    setCustomerName(val);
    setShowSuggestions(true);

    const match = findMatchingCustomer(val, customerList);
    if (match && match.name.toLowerCase() === val.trim().toLowerCase()) {
      setSelectedCustomer(match);
      if (match.cleanPhone) {
        setCustomerPhone(match.cleanPhone);
        setIsPhoneLocked(true);
      }
    } else if (isPhoneLocked) {
      setSelectedCustomer(null);
      setIsPhoneLocked(false);
    }
  };

  const handleUnlockPhone = () => {
    setIsPhoneLocked(false);
  };

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
    const numAmount = Number(amountStr);
    if (!amountStr || isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage(language === 'hi' ? 'कृपया सही राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    // Strict requirement: udhaar_given requires a valid 10-digit Indian phone
    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (type === 'udhaar_given') {
      if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMessage(
          language === 'hi'
            ? 'उधार देने के लिए ग्राहक का 10 अंकों का वैध मोबाइल नंबर दर्ज करना अनिवार्य है'
            : 'A valid 10-digit Indian mobile number is required to record udhaar'
        );
        return;
      }
    }

    setLoading(true);
    setErrorMessage('');

    const assignedCategory = category || (
      type === 'income' ? 'Daily Counter Sales' : 
      type === 'expense' ? 'Wholesale Stock Purchase' : 
      type === 'udhaar_repaid' ? 'Partial Cash Clearing' : 
      'Monthly Grocery Khata'
    );
    const assignedMode = type.startsWith('udhaar') ? 'khata' : paymentMode;
    const nowIso = new Date().toISOString();

    const localTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      shop_id: shopId,
      shopId,
      amount: numAmount,
      type,
      payment_mode: assignedMode,
      category: assignedCategory,
      customer_vendor_name: customerName.trim(),
      customer_phone: cleanPhone,
      customerPhone: cleanPhone,
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
        setCustomerPhone('');
        setIsPhoneLocked(false);
        setSelectedCustomer(null);
        setShowSuggestions(false);
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
        setCustomerPhone('');
        setIsPhoneLocked(false);
        setSelectedCustomer(null);
        setShowSuggestions(false);
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
          <div className="flex items-center gap-1.5">
            {onOpenVoice && (
              <button 
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVoice();
                }}
                className="p-1.5 rounded-full text-terracotta-700 bg-terracotta-50 hover:bg-terracotta-100 border border-terracotta-200 transition cursor-pointer"
                title={language === 'hi' ? 'आवाज़ द्वारा बोलकर दर्ज करें' : 'Switch to Voice Input'}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 rounded-full text-indigoRural-400 hover:text-indigoRural-800 hover:bg-paper-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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

          {/* 4. Customer Name, Phone & Given/Repaid Sub-Toggle for Udhaar */}
          {type.startsWith('udhaar') ? (
            <div className="space-y-2 p-2.5 bg-paper-100/70 border border-paper-300 rounded-xl">
              {/* Udhaar Sub-Toggle: Given vs Repaid */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-paper-200/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setType('udhaar_given'); setCategory('Monthly Grocery Khata'); }}
                  className={`py-1.5 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                    type === 'udhaar_given'
                      ? 'bg-ochre-500 text-white shadow-2xs'
                      : 'text-indigoRural-600 hover:text-indigoRural-900'
                  }`}
                >
                  {language === 'hi' ? 'उधार दिया' : 'Udhaar Given'}
                </button>
                <button
                  type="button"
                  onClick={() => { setType('udhaar_repaid'); setCategory('Partial Cash Clearing'); }}
                  className={`py-1.5 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                    type === 'udhaar_repaid'
                      ? 'bg-forestRural-600 text-white shadow-2xs'
                      : 'text-indigoRural-600 hover:text-indigoRural-900'
                  }`}
                >
                  {language === 'hi' ? 'उधार वापस मिला' : 'Udhaar Repaid'}
                </button>
              </div>

              {/* Customer Input Row with Relative Dropdown Wrapper */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-2">
                  {/* Customer Name with Live Search */}
                  <div>
                    <label className="text-[10px] font-bold text-indigoRural-700 flex items-center justify-between mb-0.5">
                      <span>
                        {language === 'hi' ? 'ग्राहक का नाम' : 'Customer'}
                        {type === 'udhaar_given' && <span className="text-terracotta-600 font-black ml-0.5">*</span>}
                      </span>
                      {selectedCustomer && (
                        <span className="text-[9px] font-semibold text-forestRural-700 truncate max-w-[65px]">
                          ✓ {language === 'hi' ? 'पहचाना गया' : 'Matched'}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerName}
                        onChange={handleCustomerNameChange}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={
                          isFetchingCustomers && customerList.length === 0
                            ? (language === 'hi' ? 'लोड हो रहा है...' : 'Loading...')
                            : (language === 'hi' ? 'उदा: मास्टरजी' : 'e.g. Masterji')
                        }
                        className="w-full px-2.5 py-1.5 pr-6 bg-white border border-paper-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta-500 text-indigoRural-900 h-[34px]"
                      />
                      {isFetchingCustomers && customerList.length === 0 && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigoRural-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Phone (Locked On-File vs Required Editable) */}
                  <div>
                    <label className="text-[10px] font-bold text-indigoRural-700 flex items-center justify-between mb-0.5">
                      <span>
                        {language === 'hi' ? 'मोबाइल' : 'Mobile'}
                        {!isPhoneLocked && type === 'udhaar_given' && (
                          <span className="text-terracotta-600 font-black ml-0.5">*</span>
                        )}
                      </span>
                      {isPhoneLocked ? (
                        <span className="text-[9px] font-extrabold text-forestRural-700 bg-forestRural-100 px-1 py-0.2 rounded">
                          {language === 'hi' ? 'मौजूदा ग्राहक' : 'On File'}
                        </span>
                      ) : type === 'udhaar_given' ? (
                        <span className="text-[9px] font-extrabold text-ochre-700">
                          {language === 'hi' ? 'नया ग्राहक' : 'New'}
                        </span>
                      ) : null}
                    </label>

                    {isPhoneLocked && customerPhone ? (
                      <div className="flex items-center justify-between px-2 py-1.5 bg-forestRural-50 border border-forestRural-200 rounded-lg text-xs h-[34px]">
                        <div className="flex items-center gap-1 text-forestRural-800 font-bold truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-forestRural-600 shrink-0" />
                          <span className="font-mono text-indigoRural-950 font-extrabold text-[11px] truncate">
                            {language === 'hi' ? 'दर्ज: ' : 'On file: '}{maskIndianPhone(customerPhone)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleUnlockPhone}
                          className="text-[10px] font-bold text-terracotta-700 hover:text-terracotta-900 underline ml-1 cursor-pointer shrink-0"
                          title={language === 'hi' ? 'नंबर बदलें' : 'Change number'}
                        >
                          {language === 'hi' ? 'बदलें' : 'Change'}
                        </button>
                      </div>
                    ) : (
                      <input
                        type="tel"
                        maxLength={10}
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value.replace(/\D/g, ''));
                          setIsPhoneLocked(false);
                        }}
                        placeholder="9876543210"
                        className="w-full px-2.5 py-1.5 bg-white border border-paper-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-terracotta-500 text-indigoRural-900 h-[34px]"
                      />
                    )}
                  </div>
                </div>

                {/* Real Live-Search Suggestion List Dropdown */}
                {showSuggestions && customerName.trim().length > 0 && customerSuggestions.length > 0 && (!selectedCustomer || selectedCustomer.name !== customerName) && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-paper-300 rounded-xl shadow-xl z-40 max-h-48 overflow-y-auto divide-y divide-paper-200 animate-fadeIn">
                    <div className="px-3 py-1.5 bg-paper-100 text-[10px] font-bold text-indigoRural-600 flex items-center justify-between">
                      <span>{language === 'hi' ? 'मौजूदा ग्राहक सुझाव (चुनने पर फ़ोन स्वतः जुड़ेगा):' : 'Matching Customers (Tap to auto-fill & lock phone):'}</span>
                      <button 
                        type="button" 
                        onMouseDown={(e) => { e.preventDefault(); setShowSuggestions(false); }}
                        className="text-indigoRural-400 hover:text-indigoRural-700 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {customerSuggestions.map((cust, idx) => (
                      <button
                        key={cust.id || cust.name || idx}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCustomer(cust);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-paper-100 transition flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-indigoRural-900 group-hover:text-terracotta-700 truncate">
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-indigoRural-600 truncate flex items-center gap-1.5 mt-0.5">
                            {cust.cleanPhone ? (
                              <span className="font-mono text-forestRural-700 font-bold">
                                📞 On file: {maskIndianPhone(cust.cleanPhone)}
                              </span>
                            ) : (
                              <span className="text-amber-700 italic">
                                {language === 'hi' ? 'फ़ोन दर्ज नहीं है' : 'No phone saved'}
                              </span>
                            )}
                            {cust.village && <span className="text-indigoRural-400">• {cust.village}</span>}
                          </div>
                        </div>
                        {cust.balanceOwed > 0 && (
                          <span className="text-[10px] font-black text-terracotta-700 bg-terracotta-50 px-1.5 py-0.5 rounded border border-terracotta-200 shrink-0">
                            {language === 'hi' ? 'बकाया' : 'Due'}: ₹{cust.balanceOwed}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Selector for Udhaar */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] font-bold text-indigoRural-600">
                  {language === 'hi' ? 'खाता श्रेणी' : 'Khata Category'}:
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-2 py-1 bg-white text-indigoRural-800 font-semibold rounded-md text-[11px] border border-paper-300 focus:ring-1 focus:ring-terracotta-500"
                >
                  {(categoriesByType[type] || categoriesByType.udhaar_given).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex gap-1 overflow-x-auto py-0.5">
                {(customerList.length > 0 ? customerList : commonVillageCustomers.map(n => ({ name: n, phone: '' }))).slice(0, 6).map((c, i) => {
                  const details = getCustomerDetails(c);
                  const name = details.name;
                  const isSelected = customerName === name;
                  return (
                    <button
                      key={details.id || name || i}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap border transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-terracotta-600 text-white border-terracotta-600'
                          : 'bg-white hover:bg-paper-100 text-indigoRural-700 border-paper-300'
                      }`}
                    >
                      <span>{name.split(' ')[0]}</span>
                      {details.cleanPhone && (
                        <span className={`text-[8px] font-mono ${isSelected ? 'text-white/80' : 'text-forestRural-700'}`}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
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
