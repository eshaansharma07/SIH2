import React, { useState, useEffect } from 'react';
import { X, Check, Delete, ArrowRight, User, Tag, Calendar, Banknote, ShieldCheck, Smartphone, AlertCircle, Phone, Mic, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { Badge, Button } from './ui';
import RubberStamp from './RubberStamp';
import { 
  findMatchingCustomer, 
  searchCustomerSuggestions, 
  maskIndianPhone, 
  cleanIndianPhone,
  getCustomerDetails,
  findCustomerByPhone,
  getCachedCustomers, 
  setCachedCustomers 
} from '../utils/customerMatcher';

const VALID_KEYPAD_TYPES = ['income', 'expense', 'udhaar_given', 'udhaar_repaid'];
const resolveSafeKeypadType = (t) => (typeof t === 'string' && VALID_KEYPAD_TYPES.includes(t) ? t : 'income');
const resolveSafeKeypadCategory = (c, t) => {
  if (typeof c === 'string' && c.trim()) return c;
  return t === 'expense' ? 'Stock Purchase / माल खरीद' : 'Daily Counter Sales';
};

export function NumericKeypadModal({ 
  isOpen, 
  onClose, 
  onTransactionSaved, 
  shopId, 
  onOpenVoice,
  initialType = 'income',
  initialCategory = null
}) {
  const { t, language } = useTranslation();
  const safeInitType = resolveSafeKeypadType(initialType);
  const safeInitCat = resolveSafeKeypadCategory(initialCategory, safeInitType);

  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState(safeInitType); // 'income', 'expense', 'udhaar_given', 'udhaar_repaid'
  const isUdhaar = String(type || '').startsWith('udhaar');
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash', 'upi', 'khata'
  const [category, setCategory] = useState(safeInitCat);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerList, setCustomerList] = useState(() => getCachedCustomers(shopId));
  const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick New Customer Inline Creation
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [savingNewCustomer, setSavingNewCustomer] = useState(false);

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

  // Reset/sync type and category when modal opens
  useEffect(() => {
    if (isOpen) {
      const resolvedType = resolveSafeKeypadType(initialType);
      const resolvedCat = resolveSafeKeypadCategory(initialCategory, resolvedType);
      setType(resolvedType);
      setPaymentMode('cash');
      setCategory(resolvedCat);
      setAmountStr('');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomer(null);
      setErrorMessage('');
    }
  }, [isOpen, initialType, initialCategory]);

  if (!isOpen) return null;

  const customerSuggestions = searchCustomerSuggestions(customerName, customerList, 6);

  // Detect matching customer by exact 10-digit phone
  const cleanEnteredPhone = String(customerPhone || '').replace(/\D/g, '').slice(-10);
  const phoneMatchedCustomer = cleanEnteredPhone.length === 10 && (!selectedCustomer || selectedCustomer.cleanPhone !== cleanEnteredPhone)
    ? findCustomerByPhone(cleanEnteredPhone, customerList)
    : null;

  const handleSelectCustomer = (customer) => {
    const details = getCustomerDetails(customer);
    const name = details.name || '';
    const phone = details.cleanPhone || '';

    setCustomerName(name);
    setSelectedCustomer(details);
    setShowSuggestions(false);
    setIsQuickCreateOpen(false);

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
    const val = e.target.value || '';
    setCustomerName(val);
    setShowSuggestions(true);
    setIsQuickCreateOpen(false);

    if (selectedCustomer && val.trim().toLowerCase() !== String(selectedCustomer.name || '').toLowerCase()) {
      setSelectedCustomer(null);
      setIsPhoneLocked(false);
    }
  };

  const handleSaveNewCustomer = async () => {
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setErrorMessage(language === 'hi' ? 'ग्राहक का नाम अनिवार्य है' : 'Customer name is required');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage(language === 'hi' ? '10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    setSavingNewCustomer(true);
    try {
      const res = await api.createCustomer({
        shopId,
        name: trimmedName,
        phone: cleanPhone,
        village_address: newCustomerAddress.trim()
      });
      if (res?.customer) {
        const details = getCustomerDetails(res.customer);
        const updatedList = [res.customer, ...customerList.filter(c => (c.phone || c.cleanPhone) !== cleanPhone)];
        setCustomerList(updatedList);
        setCachedCustomers(shopId, updatedList);
        setSelectedCustomer(details);
        setCustomerName(details.name);
        setCustomerPhone(details.cleanPhone);
        setIsPhoneLocked(true);
        setIsQuickCreateOpen(false);
        setShowSuggestions(false);
      }
    } catch (err) {
      // Offline fallback
      const localNew = {
        id: `cust-${Date.now()}`,
        shop_id: shopId,
        name: trimmedName,
        phone: cleanPhone,
        cleanPhone,
        village: newCustomerAddress.trim(),
        balanceOwed: 0,
        txCount: 0,
        udhaarStatus: 'No Pending Udhaar',
        isRegistered: true
      };
      const updatedList = [localNew, ...customerList];
      setCustomerList(updatedList);
      setCachedCustomers(shopId, updatedList);
      setSelectedCustomer(localNew);
      setIsPhoneLocked(true);
      setIsQuickCreateOpen(false);
      setShowSuggestions(false);
    } finally {
      setSavingNewCustomer(false);
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
    const cleanPhone = String(customerPhone || '').replace(/\D/g, '').slice(-10);
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
    const assignedMode = isUdhaar ? 'khata' : paymentMode;
    const nowIso = new Date().toISOString();

    const localTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      shop_id: shopId,
      shopId,
      amount: numAmount,
      type,
      payment_mode: assignedMode,
      category: assignedCategory,
      customer_vendor_name: String(customerName || '').trim(),
      customer_phone: cleanPhone,
      customerPhone: cleanPhone,
      customer_id: selectedCustomer?.id || null,
      customerId: selectedCustomer?.id || null,
      date: nowIso.split('T')[0],
      created_at: nowIso
    };

    try {
      const res = await api.createTransaction(localTx);
      const finalTx = res?.transaction || localTx;

      setSuccessToast(true);
      try {
        onTransactionSaved?.(finalTx);
      } catch (saveErr) {
        console.warn('onTransactionSaved error:', saveErr);
      }
      setShowStamp(true);
      setTimeout(() => {
        setSuccessToast(false);
        setShowStamp(false);
        setAmountStr('');
        setCustomerName('');
        setCustomerPhone('');
        setIsPhoneLocked(false);
        setSelectedCustomer(null);
        setShowSuggestions(false);
        setIsQuickCreateOpen(false);
        setNewCustomerAddress('');
        setErrorMessage('');
        onClose();
      }, 750);
    } catch (err) {
      console.warn('Offline / network error, applying optimistic save:', err?.message);
      try {
        onTransactionSaved?.(localTx);
      } catch (saveErr) {
        console.warn('onTransactionSaved fallback error:', saveErr);
      }
      setShowStamp(true);
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        setShowStamp(false);
        setAmountStr('');
        setCustomerName('');
        setCustomerPhone('');
        setIsPhoneLocked(false);
        setSelectedCustomer(null);
        setShowSuggestions(false);
        setIsQuickCreateOpen(false);
        setNewCustomerAddress('');
        setErrorMessage('');
        onClose();
      }, 750);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] transition-all">
        
        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-stone-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-black text-stone-900 tracking-tight font-display">
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
                className="p-1.5 rounded-full text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition cursor-pointer"
                title={language === 'hi' ? 'आवाज़ द्वारा बोलकर दर्ज करें' : 'Switch to Voice Input'}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </span>
              <button 
                type="button"
                onClick={() => setErrorMessage('')} 
                className="text-red-600 hover:text-red-900 p-0.5 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1. Transaction Type Segmented Pill Bar */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('Daily Counter Sales'); }}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                type === 'income' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {language === 'hi' ? 'बिक्री' : 'Sale'}
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory('Wholesale Stock Purchase'); }}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                type === 'expense' 
                  ? 'bg-stone-900 text-white shadow-2xs' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {language === 'hi' ? 'खर्च' : 'Expense'}
            </button>
            <button
              type="button"
              onClick={() => { setType('udhaar_given'); setCategory('Monthly Grocery Khata'); }}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                isUdhaar 
                  ? 'bg-amber-500 text-white shadow-2xs' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {language === 'hi' ? 'उधार' : 'Udhaar'}
            </button>
          </div>

          {/* 2. Hero Currency Amount Display */}
          <div className="py-3 px-4 bg-stone-50 rounded-xl border border-stone-300 flex items-center justify-between">
            <span className="text-xl font-bold text-stone-400">₹</span>
            <div className="flex-1 text-right overflow-x-auto">
              <span className={`font-black tracking-tight tabular-nums transition-all ${
                amountStr.length > 5 ? 'text-3xl' : 'text-4xl'
              } ${amountStr ? 'text-stone-900' : 'text-stone-400'}`}>
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
                className="flex-1 py-1 px-2 rounded-lg bg-[#FAF8F5] hover:bg-stone-100 text-stone-800 text-xs font-bold transition border border-stone-300 active:scale-95 cursor-pointer"
              >
                +{val}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-1 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
            >
              C
            </button>
          </div>

          {/* 4. Customer Name, Phone & Given/Repaid Sub-Toggle for Udhaar */}
          {isUdhaar ? (
            <div className="space-y-2 p-2.5 bg-[#FAF8F5]/70 border border-stone-300 rounded-xl">
              {/* Udhaar Sub-Toggle: Given vs Repaid */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setType('udhaar_given'); setCategory('Monthly Grocery Khata'); }}
                  className={`py-1.5 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                    type === 'udhaar_given'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {language === 'hi' ? 'उधार दिया' : 'Udhaar Given'}
                </button>
                <button
                  type="button"
                  onClick={() => { setType('udhaar_repaid'); setCategory('Partial Cash Clearing'); }}
                  className={`py-1.5 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                    type === 'udhaar_repaid'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
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
                    <label className="text-[10px] font-bold text-stone-700 flex items-center justify-between mb-0.5">
                      <span>
                        {language === 'hi' ? 'ग्राहक का नाम' : 'Customer'}
                        {type === 'udhaar_given' && <span className="text-terracotta-600 font-black ml-0.5">*</span>}
                      </span>
                      {selectedCustomer && (
                        <span className="text-[9px] font-semibold text-emerald-700 truncate max-w-[65px]">
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
                            : (language === 'hi' ? 'उदा: रामू' : 'e.g. Ramu')
                        }
                        className="w-full px-2.5 py-1.5 pr-6 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] text-stone-900 h-[34px]"
                      />
                      {isFetchingCustomers && customerList.length === 0 && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Phone (Locked On-File vs Required Editable) */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-700 flex items-center justify-between mb-0.5">
                      <span>
                        {language === 'hi' ? 'मोबाइल' : 'Mobile'}
                        {!isPhoneLocked && type === 'udhaar_given' && (
                          <span className="text-terracotta-600 font-black ml-0.5">*</span>
                        )}
                      </span>
                      {isPhoneLocked ? (
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                          {language === 'hi' ? 'मौजूदा ग्राहक' : 'On File'}
                        </span>
                      ) : type === 'udhaar_given' ? (
                        <span className="text-[9px] font-extrabold text-amber-700">
                          {language === 'hi' ? 'नया ग्राहक' : 'New'}
                        </span>
                      ) : null}
                    </label>

                    {isPhoneLocked && customerPhone ? (
                      <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs h-[34px]">
                        <div className="flex items-center gap-1 text-emerald-800 font-bold truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono text-stone-950 font-extrabold text-[11px] truncate">
                            {language === 'hi' ? 'दर्ज: ' : 'On file: '}{maskIndianPhone(customerPhone)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleUnlockPhone}
                          className="text-[10px] font-bold text-stone-600 hover:text-stone-900 underline ml-1 cursor-pointer shrink-0"
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
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] text-stone-900 h-[34px]"
                      />
                    )}
                  </div>
                </div>

                {/* Phone Matching Alert Banner */}
                {phoneMatchedCustomer && (
                  <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-stone-700 text-[11px] truncate">
                        Existing customer: <strong className="text-stone-900 font-semibold">{phoneMatchedCustomer.name}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer(phoneMatchedCustomer)}
                      className="ml-2 px-2.5 py-0.5 rounded-md bg-[#0F3E2E] hover:bg-[#165640] text-white text-[10px] font-bold shrink-0 transition cursor-pointer"
                    >
                      Use Customer
                    </button>
                  </div>
                )}

                {/* Customer Autocomplete Dropdown */}
                {showSuggestions && customerName.trim().length > 0 && !selectedCustomer && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-300 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-stone-100 animate-fadeIn">
                    {customerSuggestions.length > 0 ? (
                      <>
                        <div className="px-3 py-1.5 bg-[#FAF8F5] text-[10px] font-bold text-stone-600 flex items-center justify-between">
                          <span>{language === 'hi' ? 'मौजूदा ग्राहक सुझाव:' : 'Matching Customers:'}</span>
                          <button 
                            type="button" 
                            onMouseDown={(e) => { e.preventDefault(); setShowSuggestions(false); }}
                            className="text-stone-400 hover:text-stone-700 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {customerSuggestions.map((cust, idx) => (
                          <div
                            key={cust.id || cust.name || idx}
                            className="p-2.5 hover:bg-[#FAF8F5] transition flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 truncate">
                                {cust.name}
                              </div>
                              <div className="text-[10px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                                <span>Previous customer</span>
                                <span>•</span>
                                <span>{cust.txCount || 0} transactions</span>
                                {cust.cleanPhone && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{maskIndianPhone(cust.cleanPhone)}</span>
                                  </>
                                )}
                              </div>
                              {cust.village && (
                                <div className="text-[9px] text-stone-400 truncate mt-0.5">
                                  📍 {cust.village}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectCustomer(cust);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold bg-[#0F3E2E] hover:bg-[#165640] text-white rounded-lg transition shrink-0 cursor-pointer shadow-2xs"
                            >
                              Use Customer
                            </button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-3 text-center space-y-1.5">
                        <p className="text-xs text-stone-500 font-medium">No existing customer found.</p>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShowSuggestions(false);
                            setIsQuickCreateOpen(true);
                          }}
                          className="text-xs font-bold text-[#0F3E2E] hover:underline cursor-pointer"
                        >
                          + Create New Customer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Quick Customer Creation Form */}
                {isQuickCreateOpen && (
                  <div className="mt-2 p-2.5 bg-white border border-stone-300 rounded-xl space-y-2 text-xs animate-fadeIn shadow-md">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-1">
                      <span className="font-bold text-stone-800 text-[11px]">New Customer Details</span>
                      <button 
                        type="button" 
                        onClick={() => setIsQuickCreateOpen(false)}
                        className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[10px] font-bold text-stone-600">Full Name *</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Ramu Halwai"
                          className="w-full px-2 py-1 bg-[#FAF8F5] border border-stone-200 rounded text-xs text-stone-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[10px] font-bold text-stone-600">Mobile Number *</label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="9876543210"
                            className="w-full px-2 py-1 bg-[#FAF8F5] border border-stone-200 rounded text-xs font-mono text-stone-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-stone-600">Village / Address</label>
                          <input
                            type="text"
                            value={newCustomerAddress}
                            onChange={(e) => setNewCustomerAddress(e.target.value)}
                            placeholder="e.g. Main Bazaar"
                            className="w-full px-2 py-1 bg-[#FAF8F5] border border-stone-200 rounded text-xs text-stone-900"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={savingNewCustomer}
                        onClick={handleSaveNewCustomer}
                        className="w-full py-1.5 mt-1 bg-[#0F3E2E] hover:bg-[#165640] text-white rounded text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {savingNewCustomer ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Save & Link Customer</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Selector for Udhaar */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] font-bold text-stone-600">
                  {language === 'hi' ? 'खाता श्रेणी' : 'Khata Category'}:
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-2 py-1 bg-white text-stone-800 font-semibold rounded-md text-[11px] border border-stone-300 focus:ring-1 focus:ring-[#0F3E2E]"
                >
                  {(categoriesByType[type] || categoriesByType.udhaar_given).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex gap-1 overflow-x-auto py-0.5 no-scrollbar">
                {(customerList.length > 0 ? customerList : commonVillageCustomers.map(n => ({ name: n, phone: '' }))).slice(0, 6).map((c, i) => {
                  const details = getCustomerDetails(c);
                  const name = details.name;
                  const isSelected = selectedCustomer?.id === details.id || customerName === name;
                  return (
                    <button
                      key={details.id || name || i}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap border transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#0F3E2E] text-white border-[#0F3E2E]'
                          : 'bg-white hover:bg-[#FAF8F5] text-stone-700 border-stone-300'
                      }`}
                    >
                      <span>{String(name || '').split(' ')[0] || 'Customer'}</span>
                      {details.cleanPhone && (
                        <span className={`text-[8px] font-mono ${isSelected ? 'text-white/80' : 'text-emerald-700'}`}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-2.5 bg-[#FAF8F5]/70 border border-stone-300 rounded-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      paymentMode === 'cash' ? 'bg-stone-900 text-white' : 'bg-[#FAF8F5] text-stone-700 border border-stone-300'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      paymentMode === 'upi' ? 'bg-[#0F3E2E] text-white' : 'bg-[#FAF8F5] text-stone-700 border border-stone-300'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>UPI QR</span>
                  </button>
                </div>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-white text-stone-800 font-semibold rounded-lg text-xs border border-stone-300 focus:ring-2 focus:ring-[#0F3E2E]"
                >
                  {(categoriesByType[type] || categoriesByType.income).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Customer / Party input for Sales and Expenses */}
              <div className="relative pt-0.5">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-bold text-stone-700">
                    {type === 'income' 
                      ? (language === 'hi' ? 'ग्राहक का नाम (वैकल्पिक)' : 'Customer (Optional)') 
                      : (language === 'hi' ? 'पार्टी / विक्रेता (वैकल्पिक)' : 'Party / Vendor (Optional)')
                    }
                  </label>
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => { setSelectedCustomer(null); setCustomerName(''); setCustomerPhone(''); setIsPhoneLocked(false); }}
                      className="text-[9px] font-bold text-emerald-700 hover:text-stone-700 cursor-pointer"
                    >
                      ✓ {selectedCustomer.name} (Change)
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={handleCustomerNameChange}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={language === 'hi' ? 'उदा: रामू हलवाई...' : 'e.g. Ramu Halwai...'}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] text-stone-900 h-[32px]"
                  />
                </div>

                {/* Autocomplete for Sales/Expenses */}
                {showSuggestions && customerName.trim().length > 0 && !selectedCustomer && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-300 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-stone-100 animate-fadeIn">
                    {customerSuggestions.length > 0 ? (
                      customerSuggestions.map((cust, idx) => (
                        <div
                          key={cust.id || cust.name || idx}
                          className="p-2 hover:bg-[#FAF8F5] transition flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-stone-900 truncate">
                              {cust.name}
                            </div>
                            <div className="text-[10px] text-stone-500 truncate">
                              Previous customer • {cust.txCount || 0} transactions
                            </div>
                          </div>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectCustomer(cust);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold bg-[#0F3E2E] text-white rounded hover:bg-[#165640] cursor-pointer"
                          >
                            Use Customer
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-2.5 text-center text-xs text-stone-500">
                        <span>No existing customer found.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Tactile Numeric Touch Keypad Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1 select-none">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(digit => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-xl bg-stone-50 hover:bg-[#FAF8F5] border border-stone-300 active:scale-90 text-stone-900 text-lg font-extrabold flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-90 text-stone-800 flex items-center justify-center transition cursor-pointer"
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
                ? 'bg-emerald-600 text-white'
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

      {showStamp && (
        <RubberStamp 
          text={
            type === 'income' ? 'जमा • RECORDED' :
            type === 'expense' ? 'खर्च • RECORDED' :
            type === 'udhaar_given' ? 'उधार • RECORDED' : 'वसूली • RECORDED'
          }
          subtext="व्यापार सेतु बही-खाता"
        />
      )}
    </div>
  );
}
