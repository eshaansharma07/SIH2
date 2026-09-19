import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Check, 
  AlertCircle, 
  Sparkles, 
  User, 
  Phone, 
  ArrowRight, 
  Volume2, 
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Edit3,
  TrendingUp,
  TrendingDown,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  parseVoiceTranscriptWithFallback, 
  parseHindiAmount, 
  parseTransactionType, 
  extractCustomerName 
} from '../utils/voiceParser';
import { speak, stopSpeech, isSpeechSupported } from '../utils/speechService';
import { api } from '../utils/api';
import RubberStamp from './RubberStamp';
import { Badge, Button } from './ui';
import { 
  findMatchingCustomer, 
  searchCustomerSuggestions, 
  cleanIndianPhone, 
  maskIndianPhone,
  getCustomerDetails,
  getCachedCustomers,
  setCachedCustomers
} from '../utils/customerMatcher';

export function VoiceInputDialog({ 
  isOpen, 
  onClose, 
  onTransactionSaved, 
  shopId, 
  existingCustomers = [] 
}) {
  const { language } = useTranslation();
  
  // Guided state machine: 'type' -> 'customer' -> 'phone' -> 'amount' -> 'confirm'
  const [step, setStep] = useState('type');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  // Form states
  const [type, setType] = useState('income'); // 'income', 'expense', 'udhaar_given', 'udhaar_repaid'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Daily Counter Sales');
  
  const [customerList, setCustomerList] = useState(() => {
    if (existingCustomers && existingCustomers.length > 0) return existingCustomers;
    return getCachedCustomers(shopId);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef = useRef(null);
  const stepRef = useRef(step);
  stepRef.current = step;
  const isClosingRef = useRef(false);

  const isUdhaar = String(type || '').startsWith('udhaar');
  const voiceSuggestions = searchCustomerSuggestions(customerName, customerList, 5);

  const handleSafeClose = () => {
    isClosingRef.current = true;
    stopSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsSpeakingState(false);
    onClose?.();
  };

  // Load shop customers if not passed (cached + network refresh)
  useEffect(() => {
    if (!isOpen || !shopId) return;
    if (existingCustomers && existingCustomers.length > 0) {
      setCustomerList(existingCustomers);
      setCachedCustomers(shopId, existingCustomers);
    } else {
      const cached = getCachedCustomers(shopId);
      if (cached && cached.length > 0) {
        setCustomerList(cached);
      }
      api.getCustomers(shopId).then(res => {
        if (res?.customers && Array.isArray(res.customers)) {
          setCustomerList(res.customers);
          setCachedCustomers(shopId, res.customers);
        }
      }).catch(() => {});
    }
  }, [isOpen, shopId, existingCustomers]);

  // Check Web Speech API support on open
  useEffect(() => {
    if (!isOpen) {
      isClosingRef.current = true;
      stopSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (_) {}
        recognitionRef.current = null;
      }
      return;
    }

    isClosingRef.current = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    // Initialize state
    setStep('type');
    setType('income');
    setCustomerName('');
    setCustomerPhone('');
    setAmount('');
    setTranscript('');
    setErrorMessage('');
    setSaveSuccess(false);

    // Initial guided prompt for Step 1
    promptForStep('type', { type: 'income', customerName: '', amount: '' });

    return () => {
      isClosingRef.current = true;
      stopSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (_) {}
        recognitionRef.current = null;
      }
    };
  }, [isOpen]);

  // Speak prompt and start listening after speech finishes
  const promptForStep = (targetStep, currentValues = {}) => {
    if (isClosingRef.current) return;
    stopSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (_) {}
    }
    setIsListening(false);
    setTranscript('');

    const langCode = language === 'hi' ? 'hi-IN' : 'en-IN';
    let promptText = '';

    if (targetStep === 'type') {
      promptText = language === 'hi'
        ? 'क्या यह बिक्री है, खर्च है, उधार दिया है, या उधार वापस मिला?'
        : 'Is this a sale, expense, udhaar given, or udhaar repaid?';
    } else if (targetStep === 'customer') {
      promptText = language === 'hi'
        ? 'ग्राहक का नाम क्या है?'
        : "What is the customer's name?";
    } else if (targetStep === 'phone') {
      promptText = language === 'hi'
        ? 'कृपया ग्राहक का 10 अंकों का मोबाइल नंबर स्क्रीन पर दर्ज करें'
        : 'Please enter the 10-digit mobile number on screen';
    } else if (targetStep === 'amount') {
      promptText = language === 'hi'
        ? 'कितने रुपये का लेन-देन है?'
        : 'What is the transaction amount?';
    } else if (targetStep === 'confirm') {
      const amt = currentValues.amount || amount;
      const cName = currentValues.customerName || customerName;
      const t = currentValues.type || type;

      if (t === 'udhaar_given') {
        promptText = language === 'hi'
          ? `आपने कहा — ${cName || 'ग्राहक'} को ${amt} रुपये उधार दिया। क्या यह सही है?`
          : `You said: ₹${amt} udhaar given to ${cName || 'customer'}. Is this correct?`;
      } else if (t === 'udhaar_repaid') {
        promptText = language === 'hi'
          ? `आपने कहा — ${cName || 'ग्राहक'} से ${amt} रुपये उधार वापस मिला। क्या यह सही है?`
          : `You said: ₹${amt} udhaar repaid by ${cName || 'customer'}. Is this correct?`;
      } else if (t === 'expense') {
        promptText = language === 'hi'
          ? `आपने कहा — ${amt} रुपये का खर्च। क्या यह सही है?`
          : `You said: ₹${amt} expense. Is this correct?`;
      } else {
        promptText = language === 'hi'
          ? `आपने कहा — ${amt} रुपये की बिक्री। क्या यह सही है?`
          : `You said: ₹${amt} sale. Is this correct?`;
      }
    }

    if (!audioMuted && isSpeechSupported() && promptText) {
      setIsSpeakingState(true);
      speak({
        text: promptText,
        lang: langCode,
        onEnd: () => {
          setIsSpeakingState(false);
          // Don't auto-listen on phone step or when closing
          if (!isClosingRef.current && targetStep !== 'phone') {
            startListeningForStep(targetStep);
          }
        },
        onError: () => {
          setIsSpeakingState(false);
          if (!isClosingRef.current && targetStep !== 'phone') {
            startListeningForStep(targetStep);
          }
        }
      });
    } else {
      if (!isClosingRef.current && targetStep !== 'phone') {
        startListeningForStep(targetStep);
      }
    }
  };

  // Start Web Speech Recognition
  const startListeningForStep = (currentStepName) => {
    if (isClosingRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (_) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      console.warn('[VoiceInputDialog] Mic error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (_) {}
  };

  // Process transcript once user finishes or taps "Done"
  const handleProcessTranscript = async (overrideTranscript = null) => {
    const rawText = (overrideTranscript !== null ? overrideTranscript : transcript).trim();
    if (!rawText) return;

    try { recognitionRef.current?.stop(); } catch (_) {}
    setIsListening(false);

    const activeStep = stepRef.current;

    // STEP 1: TYPE PROCESSING
    if (activeStep === 'type') {
      // Check if user spoke a full compound sentence in one shot!
      const parsedFull = await parseVoiceTranscriptWithFallback(rawText, { knownCustomers: customerList, shopId });
      if (parsedFull.amount && parsedFull.amount > 0) {
        // High confidence full extraction!
        setType(parsedFull.type);
        setAmount(String(parsedFull.amount));
        if (parsedFull.customerName) setCustomerName(parsedFull.customerName);
        if (parsedFull.customerName) {
          const match = findMatchingCustomer(parsedFull.customerName, customerList);
          if (match) {
            if (match.name) setCustomerName(match.name);
            if (match.cleanPhone) setCustomerPhone(match.cleanPhone);
          } else {
            setCustomerName(parsedFull.customerName);
          }
        }
        setStep('confirm');
        promptForStep('confirm', {
          type: parsedFull.type,
          amount: String(parsedFull.amount),
          customerName: parsedFull.customerName
        });
        return;
      }

      // Single step parse
      const detectedType = parseTransactionType(rawText);
      setType(detectedType);

      if (String(detectedType || '').startsWith('udhaar')) {
        setStep('customer');
        promptForStep('customer', { type: detectedType });
      } else {
        setStep('amount');
        promptForStep('amount', { type: detectedType });
      }
    } 
    // STEP 2: CUSTOMER PROCESSING
    else if (activeStep === 'customer') {
      const extracted = extractCustomerName(rawText, customerList) || rawText;
      const cleanName = extracted.trim();

      // Match against known customers using unified customerMatcher
      const match = findMatchingCustomer(cleanName, customerList);

      if (match) {
        const matchedName = match.name;
        setCustomerName(matchedName);
        if (match.cleanPhone) {
          setCustomerPhone(match.cleanPhone);
        }
        // Speak verbal confirmation of customer found
        if (!audioMuted && isSpeechSupported()) {
          const matchMsg = language === 'hi' ? `${matchedName} जी मिल गए` : `Found ${matchedName}`;
          speak({
            text: matchMsg,
            lang: language === 'hi' ? 'hi-IN' : 'en-IN',
            onEnd: () => {
              setStep('amount');
              promptForStep('amount', { customerName: matchedName });
            }
          });
          return;
        }
        setStep('amount');
        promptForStep('amount', { customerName: matchedName });
      } else {
        setCustomerName(cleanName);
        // New customer: if udhaar_given, require phone number
        if (type === 'udhaar_given') {
          setStep('phone');
          promptForStep('phone', { customerName: cleanName });
        } else {
          setStep('amount');
          promptForStep('amount', { customerName: cleanName });
        }
      }
    } 
    // STEP 3: AMOUNT PROCESSING
    else if (activeStep === 'amount') {
      const parsedAmt = parseHindiAmount(rawText);
      if (parsedAmt && parsedAmt > 0) {
        setAmount(String(parsedAmt));
        setStep('confirm');
        promptForStep('confirm', { amount: String(parsedAmt) });
      } else {
        setErrorMessage(
          language === 'hi' 
            ? 'राशि समझ नहीं आई। कृपया नीचे दिए गए बटनों से चुनें या दोबारा बोलें।' 
            : 'Could not understand amount. Please select from quick chips or speak again.'
        );
      }
    } 
    // STEP 4: CONFIRMATION PROCESSING
    else if (activeStep === 'confirm') {
      const lower = rawText.toLowerCase();
      const isAffirmative = /हाँ|हां|सही|दर्ज|करो|yes|yep|correct|save|save it|theek|thik/i.test(lower);
      const isNegative = /नहीं|गलत|बदलो|रद्द|no|nope|wrong|change|cancel/i.test(lower);

      if (isAffirmative) {
        handleConfirmSave();
      } else if (isNegative) {
        stopSpeech();
        setErrorMessage(language === 'hi' ? 'लेन-देन रद्द किया गया या बदलाव के लिए तैयार' : 'Transaction confirmation rejected. You can edit fields manually.');
      }
    }
  };

  // Save Transaction
  const handleConfirmSave = async () => {
    stopSpeech();
    try { recognitionRef.current?.abort(); } catch (_) {}

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage(language === 'hi' ? 'कृपया सही राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    if (type === 'udhaar_given') {
      const cleanPhone = String(customerPhone || '').replace(/\D/g, '').slice(-10);
      if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMessage(
          language === 'hi'
            ? 'उधार देने के लिए ग्राहक का 10 अंकों का वैध मोबाइल नंबर आवश्यक है'
            : 'A valid 10-digit mobile number is required to register udhaar'
        );
        setStep('phone');
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage('');

    const safePhone = String(customerPhone || '').replace(/\D/g, '').slice(-10);
    const nowIso = new Date().toISOString();
    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      shop_id: shopId,
      shopId,
      amount: numAmount,
      type,
      payment_mode: isUdhaar ? 'khata' : 'cash',
      category: category || (type === 'income' ? 'Daily Counter Sales' : type === 'expense' ? 'Stock Purchase' : 'Udhaar'),
      customer_vendor_name: String(customerName || '').trim() || (isUdhaar ? 'Village Customer' : ''),
      customer_phone: safePhone,
      customerPhone: safePhone,
      notes: `Voice Conversational Entry: "${amount} ${type}"`,
      date: nowIso.split('T')[0],
      created_at: nowIso
    };

    try {
      const res = await api.createTransaction(newTx);
      const finalTx = res?.transaction || newTx;

      setSaveSuccess(true);
      onTransactionSaved?.(finalTx);

      setTimeout(() => {
        setSaveSuccess(false);
        handleSafeClose();
      }, 700);
    } catch (err) {
      console.warn('Network issue, applying local queue save:', err.message);
      onTransactionSaved?.(newTx);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        handleSafeClose();
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleSafeClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-indigoRural-950/70 backdrop-blur-xs animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-paper-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Header with Step Indicator and Audio Toggle */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-terracotta-50 via-paper-50 to-indigoRural-50 border-b border-paper-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-terracotta-600 text-white flex items-center justify-center shadow-xs">
                <Mic className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-black text-indigoRural-900 tracking-tight font-display">
                  {language === 'hi' ? 'आवाज़ से बही-खाता दर्ज करें' : 'Voice Bahi-Khata Assistant'}
                </h3>
                <p className="text-[11px] text-indigoRural-600 font-medium">
                  {language === 'hi' ? 'साथी बोल द्वारा चरण-दर-चरण प्रविष्टि' : 'Step-by-step guided voice entry'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Audio Read-Aloud Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!audioMuted) stopSpeech();
                  setAudioMuted(!audioMuted);
                }}
                className={`p-2 rounded-full border transition cursor-pointer ${
                  audioMuted 
                    ? 'bg-paper-100 text-paper-400 border-paper-300 hover:bg-paper-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                }`}
                title={audioMuted ? 'Unmute voice' : 'Mute spoken prompts'}
              >
                {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Close Dialog */}
              <button
                type="button"
                onClick={handleSafeClose}
                className="p-2 rounded-full text-indigoRural-400 hover:text-indigoRural-800 hover:bg-paper-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Guided Step Indicator Pills */}
          <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-paper-200/80 text-[11px] font-black">
            {[
              { id: 'type', labelHi: '1. प्रकार', labelEn: '1. Type' },
              { id: 'customer', labelHi: '2. ग्राहक', labelEn: '2. Customer' },
              { id: 'amount', labelHi: '3. राशि', labelEn: '3. Amount' },
              { id: 'confirm', labelHi: '4. पुष्टि', labelEn: '4. Confirm' }
            ].map((s) => {
              const isActive = step === s.id || (step === 'phone' && s.id === 'customer');
              const isPast = 
                (s.id === 'type' && step !== 'type') ||
                (s.id === 'customer' && (step === 'amount' || step === 'confirm')) ||
                (s.id === 'amount' && step === 'confirm');

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setStep(s.id);
                    promptForStep(s.id);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-center transition flex items-center justify-center gap-1 cursor-pointer ${
                    isActive 
                      ? 'bg-terracotta-600 text-white shadow-xs font-black ring-2 ring-terracotta-300'
                      : isPast
                      ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200 font-bold'
                      : 'bg-white/60 text-indigoRural-400 border border-paper-200'
                  }`}
                >
                  {isPast && <Check className="w-3 h-3 text-emerald-600" />}
                  <span>{language === 'hi' ? s.labelHi : s.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Unsaved / Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded-2xl flex items-start gap-2.5 text-xs text-terracotta-800">
              <AlertCircle className="w-4 h-4 text-terracotta-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Dynamic Active Step Content */}
          
          {/* STEP 1: TYPE SELECTION */}
          {step === 'type' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-xs font-bold text-terracotta-700 uppercase tracking-wider font-display">
                  {language === 'hi' ? 'चरण 1: लेन-देन का प्रकार' : 'Step 1: Transaction Type'}
                </p>
                <h4 className="text-sm sm:text-base font-black text-indigoRural-950 mt-1">
                  {language === 'hi' 
                    ? '«बिक्री», «खर्च», «उधार दिया», या «उधार वापस» बोलें' 
                    : 'Speak: "Sale", "Expense", "Udhaar Given", or "Udhaar Repaid"'}
                </h4>
              </div>

              {/* Tap Chips fallback for instant selection */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setStep('amount');
                    promptForStep('amount', { type: 'income' });
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col gap-1 cursor-pointer active:scale-98 ${
                    type === 'income' 
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs' 
                      : 'border-paper-300 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      {language === 'hi' ? 'बिक्री (आवक)' : 'Sale (Income)'}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">+ Cash</span>
                  </div>
                  <span className="text-[11px] text-indigoRural-600 font-medium">
                    {language === 'hi' ? 'काउंटर नकद / UPI बिक्री' : 'Daily sales & revenue'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setStep('amount');
                    promptForStep('amount', { type: 'expense' });
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col gap-1 cursor-pointer active:scale-98 ${
                    type === 'expense' 
                      ? 'border-terracotta-500 bg-terracotta-50/70 text-terracotta-950 shadow-xs' 
                      : 'border-paper-300 hover:border-terracotta-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-terracotta-700 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" />
                      {language === 'hi' ? 'दुकान खर्च' : 'Expense'}
                    </span>
                    <span className="text-[10px] bg-terracotta-100 text-terracotta-800 px-2 py-0.5 rounded-full font-bold">- Cash</span>
                  </div>
                  <span className="text-[11px] text-indigoRural-600 font-medium">
                    {language === 'hi' ? 'थोक माल खरीद, बिजली, किराया' : 'Stock purchase, bills'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('udhaar_given');
                    setStep('customer');
                    promptForStep('customer', { type: 'udhaar_given' });
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col gap-1 cursor-pointer active:scale-98 ${
                    type === 'udhaar_given' 
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs' 
                      : 'border-paper-300 hover:border-amber-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-700 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      {language === 'hi' ? 'उधार दिया' : 'Udhaar Given'}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">खाता +</span>
                  </div>
                  <span className="text-[11px] text-indigoRural-600 font-medium">
                    {language === 'hi' ? 'ग्राहक के खाते में लिखा' : 'Customer credit given'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('udhaar_repaid');
                    setStep('customer');
                    promptForStep('customer', { type: 'udhaar_repaid' });
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col gap-1 cursor-pointer active:scale-98 ${
                    type === 'udhaar_repaid' 
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 shadow-xs' 
                      : 'border-paper-300 hover:border-indigo-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-700 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      {language === 'hi' ? 'उधार वापस मिला' : 'Udhaar Repaid'}
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">खाता -</span>
                  </div>
                  <span className="text-[11px] text-indigoRural-600 font-medium">
                    {language === 'hi' ? 'ग्राहक ने पुराना कर्ज चुकाया' : 'Customer debt settled'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CUSTOMER SELECTION */}
          {step === 'customer' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-xs font-bold text-terracotta-700 uppercase tracking-wider font-display">
                  {language === 'hi' ? 'चरण 2: ग्राहक का नाम' : 'Step 2: Customer Name'}
                </p>
                <h4 className="text-sm sm:text-base font-black text-indigoRural-950 mt-1">
                  {language === 'hi' ? 'ग्राहक का नाम बोलें या नीचे सूची से चुनें' : 'Speak customer name or select below'}
                </h4>
              </div>

              {/* Text Input / Quick Search fallback */}
              <div className="relative">
                <User className="w-4 h-4 text-indigoRural-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. रमेश कुमार, मास्टरजी...' : 'e.g. Ramesh Kumar, Masterji...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-paper-50 border border-paper-300 rounded-xl text-sm font-bold text-indigoRural-900 focus:outline-hidden focus:border-terracotta-500"
                />

                {/* Suggestions dropdown in voice dialog */}
                {customerName.trim().length > 0 && voiceSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-paper-300 rounded-xl shadow-xl z-30 max-h-44 overflow-y-auto divide-y divide-paper-200">
                    {voiceSuggestions.map((cust, idx) => (
                      <button
                        key={cust.id || cust.name || idx}
                        type="button"
                        onClick={() => {
                          setCustomerName(cust.name);
                          if (cust.cleanPhone) setCustomerPhone(cust.cleanPhone);
                          setStep('amount');
                          promptForStep('amount', { customerName: cust.name });
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-paper-100 transition flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-indigoRural-900">{cust.name}</span>
                        {cust.cleanPhone && (
                          <span className="text-[10px] font-mono text-forestRural-700 font-semibold">
                            📞 {maskIndianPhone(cust.cleanPhone)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Known Customer Quick Pills */}
              {customerList && customerList.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-indigoRural-600">
                    {language === 'hi' ? 'पसंदीदा ग्राहक:' : 'Registered Customers:'}
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {customerList.map((c, i) => {
                      const details = getCustomerDetails(c);
                      const name = details.name;
                      const phone = details.cleanPhone;
                      return (
                        <button
                          key={details.id || i}
                          type="button"
                          onClick={() => {
                            setCustomerName(name);
                            if (phone) setCustomerPhone(phone);
                            setStep('amount');
                            promptForStep('amount', { customerName: name });
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-white border border-paper-300 hover:border-terracotta-500 text-indigoRural-900 hover:bg-terracotta-50 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{name}</span>
                          {phone && (
                            <span className="text-[10px] text-forestRural-700 font-mono font-bold">
                              ({maskIndianPhone(phone)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {customerName && (
                <Button
                  onClick={() => {
                    const match = findMatchingCustomer(customerName, customerList);
                    if (match) {
                      setCustomerName(match.name);
                      if (match.cleanPhone) setCustomerPhone(match.cleanPhone);
                      setStep('amount');
                      promptForStep('amount', { customerName: match.name });
                    } else if (type === 'udhaar_given') {
                      setStep('phone');
                      promptForStep('phone', { customerName });
                    } else {
                      setStep('amount');
                      promptForStep('amount', { customerName });
                    }
                  }}
                  variant="primary"
                  className="w-full"
                >
                  {language === 'hi' ? 'आगे बढ़ें (राशि दर्ज करें)' : 'Continue to Amount'}
                </Button>
              )}
            </div>
          )}

          {/* STEP 2.5: PHONE NUMBER FOR NEW UDHAAR (TOUCH-FRIENDLY KEYPAD) */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-xs font-bold text-terracotta-700 uppercase tracking-wider font-display">
                  {language === 'hi' ? 'चरण 2.5: नया ग्राहक मोबाइल नंबर' : 'Step 2.5: New Customer Mobile'}
                </p>
                <h4 className="text-sm sm:text-base font-black text-indigoRural-950 mt-1">
                  {language === 'hi' 
                    ? `«${customerName}» के लिए 10 अंकों का मोबाइल नंबर दर्ज करें` 
                    : `Enter 10-digit mobile number for ${customerName}`}
                </h4>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  {language === 'hi' ? '⚠️ WhatsApp तगादा एवं UPI भुगतान लिंक हेतु अनिवार्य' : 'Required for WhatsApp reminders & UPI payment QR'}
                </p>
              </div>

              {/* Display phone box */}
              <div className="p-3.5 bg-paper-50 rounded-2xl border border-paper-300 text-center">
                <span className="text-xs text-indigoRural-500 font-bold mr-2">+91</span>
                <span className="text-xl font-black text-indigoRural-950 tracking-widest font-mono">
                  {customerPhone || '----------'}
                </span>
              </div>

              {/* Numeric Touch Keypad for phone number */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => {
                      if (customerPhone.length < 10) setCustomerPhone(prev => prev + digit);
                    }}
                    className="h-12 rounded-xl bg-white border border-paper-300 hover:bg-paper-100 active:scale-95 text-base font-black text-indigoRural-900 shadow-2xs cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomerPhone('')}
                  className="h-12 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs font-bold text-terracotta-700 cursor-pointer active:scale-95"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customerPhone.length < 10) setCustomerPhone(prev => prev + '0');
                  }}
                  className="h-12 rounded-xl bg-white border border-paper-300 hover:bg-paper-100 active:scale-95 text-base font-black text-indigoRural-900 shadow-2xs cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerPhone(prev => prev.slice(0, -1))}
                  className="h-12 rounded-xl bg-paper-200 border border-paper-300 text-xs font-bold text-indigoRural-700 cursor-pointer active:scale-95"
                >
                  ⌫
                </button>
              </div>

              <Button
                onClick={() => {
                  if (customerPhone.length === 10 && /^[6-9]\d{9}$/.test(customerPhone)) {
                    setErrorMessage('');
                    setStep('amount');
                    promptForStep('amount');
                  } else {
                    setErrorMessage(language === 'hi' ? 'कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर डालें' : 'Please enter valid 10-digit Indian mobile number');
                  }
                }}
                disabled={customerPhone.length !== 10}
                variant="primary"
                className="w-full mt-2"
              >
                {language === 'hi' ? 'फोन सहेजें व राशि पर जाएँ' : 'Save Phone & Proceed to Amount'}
              </Button>
            </div>
          )}

          {/* STEP 3: AMOUNT SELECTION */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-xs font-bold text-terracotta-700 uppercase tracking-wider font-display">
                  {language === 'hi' ? 'चरण 3: लेन-देन राशि' : 'Step 3: Transaction Amount'}
                </p>
                <h4 className="text-sm sm:text-base font-black text-indigoRural-950 mt-1">
                  {language === 'hi' ? 'रुपये बोलें या तुरंत राशि चुनें' : 'Speak amount or select from chips'}
                </h4>
              </div>

              {/* Big Amount Display Box */}
              <div className="p-4 bg-paper-50 rounded-2xl border-2 border-dashed border-paper-300 text-center">
                <span className="text-xs text-indigoRural-500 font-bold block mb-1">
                  {language === 'hi' ? 'कुल राशि' : 'Amount'}
                </span>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-black text-terracotta-600">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-36 text-center text-3xl font-black text-indigoRural-950 bg-transparent border-b-2 border-terracotta-400 focus:outline-hidden font-display"
                  />
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 500, 1000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmount(String(val));
                      setStep('confirm');
                      promptForStep('confirm', { amount: String(val) });
                    }}
                    className="py-2 px-1 rounded-xl bg-white border border-paper-300 hover:border-terracotta-500 active:scale-95 text-xs font-black text-indigoRural-900 shadow-2xs hover:bg-terracotta-50 transition cursor-pointer text-center"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              {amount && Number(amount) > 0 && (
                <Button
                  onClick={() => {
                    setStep('confirm');
                    promptForStep('confirm');
                  }}
                  variant="primary"
                  className="w-full"
                >
                  {language === 'hi' ? 'पुष्टि पर जाएँ' : 'Proceed to Confirmation'}
                </Button>
              )}
            </div>
          )}

          {/* STEP 4: SPOKEN CONFIRMATION CARD */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="text-center py-1">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-display">
                  {language === 'hi' ? 'चरण 4: बही-खाता पुष्टि' : 'Step 4: Summary Confirmation'}
                </p>
                <h4 className="text-sm sm:text-base font-black text-indigoRural-950 mt-1">
                  {language === 'hi' 
                    ? '«हाँ» बोलें या नीचे दिए बटन पर टैप करें' 
                    : 'Speak "Yes" to confirm or tap the button below'}
                </h4>
              </div>

              {/* Summary Card with tap-to-edit escape hatches */}
              <div className="p-4 bg-gradient-to-br from-paper-50 to-white rounded-2xl border border-paper-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-paper-200">
                  <span className="text-xs font-extrabold text-indigoRural-600">
                    {language === 'hi' ? 'प्रकार:' : 'Type:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('type')}
                    className="text-xs font-black text-terracotta-700 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span className="capitalize">{String(type || '').replace('_', ' ')}</span>
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>

                {isUdhaar && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-paper-200">
                      <span className="text-xs font-extrabold text-indigoRural-600">
                        {language === 'hi' ? 'ग्राहक:' : 'Customer:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep('customer')}
                        className="text-xs font-black text-indigoRural-900 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>{customerName || 'Village Customer'}</span>
                        <Edit3 className="w-3 h-3 text-terracotta-600" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-paper-200">
                      <span className="text-xs font-extrabold text-indigoRural-600">
                        {language === 'hi' ? 'मोबाइल:' : 'Mobile:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep('phone')}
                        className="text-xs font-black text-indigoRural-900 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span className="font-mono">{customerPhone || 'Not set'}</span>
                        <Edit3 className="w-3 h-3 text-terracotta-600" />
                      </button>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-extrabold text-indigoRural-600">
                    {language === 'hi' ? 'कुल राशि:' : 'Amount:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('amount')}
                    className="text-xl font-black text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer font-display"
                  >
                    <span>₹{amount}</span>
                    <Edit3 className="w-4 h-4 text-terracotta-600" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Yes / Edit */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('type')}
                  className="py-3 px-4 rounded-xl border border-paper-300 hover:bg-paper-100 text-xs font-bold text-indigoRural-700 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'बदलें / रद्द करें' : 'Edit / Change'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSaving || saveSuccess}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-98"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{language === 'hi' ? 'सहेजा गया!' : 'Saved!'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'hi' ? 'हाँ, दर्ज करें' : 'Yes, Confirm & Save'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Voice Listening Waveform & Manual Speak Input Bar */}
          <div className="pt-2 border-t border-paper-200">
            <div className="flex items-center gap-3 p-3 bg-paper-50 rounded-2xl border border-paper-200">
              
              {/* Mic Indicator Button */}
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    try { recognitionRef.current?.stop(); } catch (_) {}
                    setIsListening(false);
                  } else {
                    startListeningForStep(step);
                  }
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-terracotta-600 text-white ring-4 ring-terracotta-300 animate-pulse' 
                    : isSpeakingState
                    ? 'bg-indigoRural-700 text-white ring-2 ring-indigoRural-300'
                    : 'bg-paper-200 text-indigoRural-700 hover:bg-paper-300'
                }`}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <Mic className="w-5 h-5 animate-bounce" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Transcript & Status text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-terracotta-600 animate-ping' : isSpeakingState ? 'bg-turmeric animate-pulse' : 'bg-paper-300'}`} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigoRural-600 font-display">
                    {isSpeakingState 
                      ? (language === 'hi' ? 'सेतु AI बोल रहा है...' : 'Setu AI is speaking...')
                      : isListening 
                      ? (language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... speak now')
                      : (language === 'hi' ? 'माइक पर टैप करके बोलें' : 'Tap mic to speak')}
                  </span>
                </div>
                <p className="text-xs font-bold text-indigoRural-950 truncate mt-0.5">
                  {transcript || (language === 'hi' ? 'आपकी आवाज़ यहाँ दिखाई देगी...' : 'Your speech will appear here...')}
                </p>
              </div>

              {/* If transcript captured, user can click "Done" */}
              {transcript && isListening && (
                <button
                  type="button"
                  onClick={() => handleProcessTranscript()}
                  className="px-3 py-1.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-black shadow-xs cursor-pointer shrink-0"
                >
                  {language === 'hi' ? 'हो गया' : 'Done'}
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {saveSuccess && (
        <RubberStamp 
          text={
            parsedData?.type === 'income' ? 'जमा • RECORDED' :
            parsedData?.type === 'expense' ? 'खर्च • RECORDED' :
            parsedData?.type === 'udhaar_given' ? 'उधार • RECORDED' : 'वसूली • RECORDED'
          }
          subtext="साख सेतु बही-खाता"
        />
      )}
    </div>
  );
}
