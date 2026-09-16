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
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { parseVoiceTranscriptWithFallback } from '../utils/voiceParser';
import { api } from '../utils/api';
import { Badge, Button } from './ui';

export function VoiceInputDialog({ 
  isOpen, 
  onClose, 
  onTransactionSaved, 
  shopId, 
  existingCustomers = [] 
}) {
  const { language } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [step, setStep] = useState('listening'); // 'listening', 'confirm', 'unsupported'
  const [isSupported, setIsSupported] = useState(true);

  // Editable parsed fields for confirmation card
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income'); // 'income', 'expense', 'udhaar_given', 'udhaar_repaid'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [category, setCategory] = useState('Daily Counter Sales');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const recognitionRef = useRef(null);

  // Check browser SpeechRecognition support
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setStep('unsupported');
      return;
    }

    setIsSupported(true);
    setStep('listening');
    setTranscript('');
    setErrorMessage('');
    setSaveSuccess(false);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let currentText = '';
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
    };

    recognition.onerror = (event) => {
      console.warn('[SpeechRecognition] error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        setErrorMessage(
          language === 'hi'
            ? `माइक त्रुटि: ${event.error}`
            : `Mic error: ${event.error}`
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Auto-start listening
    try {
      recognition.start();
    } catch (_) {}

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, [isOpen, language]);

  // When returning customer name changes, auto-fill phone if known
  useEffect(() => {
    if (!customerName) return;
    const match = existingCustomers.find(
      c => (c.name || c.customerName || '').trim().toLowerCase() === customerName.trim().toLowerCase()
    );
    if (match && (match.phone || match.cleanPhone)) {
      const clean = (match.phone || match.cleanPhone).replace(/\D/g, '').slice(-10);
      if (clean) setCustomerPhone(clean);
    }
  }, [customerName, existingCustomers]);

  if (!isOpen) return null;

  const handleStartListening = () => {
    setErrorMessage('');
    setTranscript('');
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (_) {
      try {
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      } catch (_) {}
    }
  };

  const handleStopListening = async () => {
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    setIsListening(false);

    if (!transcript.trim()) {
      setErrorMessage(
        language === 'hi'
          ? 'कोई आवाज़ सुनाई नहीं दी। कृपया दोबारा बोलें।'
          : 'No speech detected. Please speak again.'
      );
      return;
    }

    setIsParsing(true);
    try {
      const parsed = await parseVoiceTranscriptWithFallback(transcript, {
        knownCustomers: existingCustomers,
        shopId
      });

      setAmount(parsed.amount ? String(parsed.amount) : '');
      setType(parsed.type || 'income');
      setCustomerName(parsed.customerName || '');
      setCategory(parsed.category || (parsed.type === 'income' ? 'Daily Counter Sales' : 'Monthly Grocery Khata'));

      // If customer was matched, lookup phone
      if (parsed.customerName) {
        const found = existingCustomers.find(
          c => (c.name || c.customerName || '').trim().toLowerCase() === parsed.customerName.trim().toLowerCase()
        );
        if (found && (found.phone || found.cleanPhone)) {
          setCustomerPhone((found.phone || found.cleanPhone).replace(/\D/g, '').slice(-10));
        }
      }

      setStep('confirm');
    } catch (err) {
      setErrorMessage(err.message);
      setStep('confirm');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmSave = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage(language === 'hi' ? 'कृपया सही राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    // Strict validation for udhaar_given: requires 10-digit Indian mobile number
    if (type === 'udhaar_given') {
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
      if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMessage(
          language === 'hi'
            ? 'उधार देने के लिए ग्राहक का 10 अंकों का वैध मोबाइल नंबर अनिवार्य है'
            : 'A valid 10-digit mobile number is required to register udhaar'
        );
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage('');

    const safePhone = customerPhone.replace(/\D/g, '').slice(-10);
    const nowIso = new Date().toISOString();
    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      shop_id: shopId,
      shopId,
      amount: numAmount,
      type,
      payment_mode: type.startsWith('udhaar') ? 'khata' : 'cash',
      category: category || (type === 'income' ? 'Daily Counter Sales' : 'Monthly Grocery Khata'),
      customer_vendor_name: customerName.trim() || (type.startsWith('udhaar') ? 'Village Customer' : ''),
      customer_phone: safePhone,
      customerPhone: safePhone,
      notes: `Voice Entry: "${transcript.slice(0, 100)}"`,
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
        onClose();
      }, 700);
    } catch (err) {
      console.warn('Network issue, applying local queue save:', err.message);
      onTransactionSaved?.(newTx);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-indigoRural-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl border border-paper-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-terracotta-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight font-display">
                {language === 'hi' ? 'बोलकर बही-खाता दर्ज करें' : 'Voice Bahi-Khata Input'}
              </h3>
              <p className="text-[10px] text-paper-200">
                {language === 'hi' ? 'हिन्दी (hi-IN) व English (en-IN) समर्थित' : 'Supports Hindi (hi-IN) & English (en-IN)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Unsupported State */}
          {step === 'unsupported' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{language === 'hi' ? 'आवाज़ पहचान समर्थित नहीं' : 'Voice Input Not Supported'}</span>
              </div>
              <p>
                {language === 'hi'
                  ? 'आपका वर्तमान ब्राउज़र (Safari/Firefox) Web Speech API का समर्थन नहीं करता। कृपया Google Chrome या Microsoft Edge का उपयोग करें, या सीधे कीपैड से लेन-देन दर्ज करें।'
                  : 'Your current browser lacks Web Speech API support. Please use Google Chrome or Microsoft Edge, or use the standard numeric keypad.'}
              </p>
              <Button
                onClick={onClose}
                variant="primary"
                size="sm"
                className="w-full mt-2"
              >
                {language === 'hi' ? 'कीपैड पर वापस जाएं' : 'Back to Keypad'}
              </Button>
            </div>
          )}

          {/* Listening State */}
          {step === 'listening' && (
            <div className="text-center py-4 space-y-4">
              {/* Mic Ripple Animation */}
              <div className="relative inline-block mx-auto">
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-terracotta-400 animate-ping opacity-30" />
                )}
                <button
                  type="button"
                  onClick={isListening ? handleStopListening : handleStartListening}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                    isListening 
                      ? 'bg-terracotta-600 text-white ring-4 ring-terracotta-200 scale-105' 
                      : 'bg-paper-100 text-indigoRural-700 hover:bg-paper-200 border border-paper-300'
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-9 h-9 animate-pulse" />
                  ) : (
                    <MicOff className="w-9 h-9 text-paper-400" />
                  )}
                </button>
              </div>

              <div>
                <p className="text-xs font-black text-indigoRural-900">
                  {isListening
                    ? (language === 'hi' ? '🎙️ सुन रहे हैं... बोलिए...' : '🎙️ Listening... Speak now...')
                    : (language === 'hi' ? 'माइक पर टैप करके बोलें' : 'Tap mic to speak')}
                </p>
                <p className="text-[11px] text-paper-500 mt-0.5">
                  {language === 'hi'
                    ? 'उदा: "रमेश को पांच सौ रुपये उधार दिया" या "दो हज़ार की बिक्री"'
                    : 'e.g. "Ramesh ko 500 rupaye udhaar diya" or "2000 sale"'}
                </p>
              </div>

              {/* Realtime Transcript Box */}
              <div className="p-3.5 bg-paper-50 border border-paper-200 rounded-xl min-h-[64px] flex items-center justify-center text-xs text-indigoRural-950 font-medium">
                {transcript ? (
                  <span className="font-bold text-sm text-indigoRural-900">"{transcript}"</span>
                ) : (
                  <span className="text-paper-400 italic">
                    {language === 'hi' ? 'बोले गए शब्द यहाँ दिखेंगे...' : 'Your speech transcript will appear here...'}
                  </span>
                )}
              </div>

              {errorMessage && (
                <div className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {isListening ? (
                  <Button
                    onClick={handleStopListening}
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={isParsing}
                  >
                    <span>{isParsing ? '...' : (language === 'hi' ? 'पूर्ण करें व पुष्टि देखें' : 'Done & Review')}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartListening}
                    variant="secondary"
                    size="md"
                    className="w-full"
                    icon={Mic}
                  >
                    <span>{language === 'hi' ? 'दोबारा बोलें' : 'Speak Again'}</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Step (Mandatory Step before saving) */}
          {step === 'confirm' && (
            <div className="space-y-3 animate-fadeIn">
              
              <div className="p-2.5 bg-paper-100 rounded-xl border border-paper-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-indigoRural-700">
                  <Volume2 className="w-3.5 h-3.5 text-terracotta-600" />
                  <span className="font-semibold truncate max-w-[240px]">"{transcript}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('listening')}
                  className="text-[11px] font-bold text-terracotta-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === 'hi' ? 'पुनः बोलें' : 'Retry'}</span>
                </button>
              </div>

              {/* Transaction Type Segmented Pills */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-indigoRural-800">
                  {language === 'hi' ? 'लेन-देन प्रकार:' : 'Transaction Type:'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      type === 'income'
                        ? 'bg-forestRural-700 text-white border-forestRural-700 shadow-2xs'
                        : 'bg-paper-50 text-indigoRural-700 border-paper-300'
                    }`}
                  >
                    {language === 'hi' ? 'बिक्री (आवक)' : 'Sale / Income'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      type === 'expense'
                        ? 'bg-terracotta-700 text-white border-terracotta-700 shadow-2xs'
                        : 'bg-paper-50 text-indigoRural-700 border-paper-300'
                    }`}
                  >
                    {language === 'hi' ? 'दुकान खर्च' : 'Expense'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('udhaar_given')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      type === 'udhaar_given'
                        ? 'bg-ochre-600 text-white border-ochre-600 shadow-2xs'
                        : 'bg-paper-50 text-indigoRural-700 border-paper-300'
                    }`}
                  >
                    {language === 'hi' ? 'उधार दिया' : 'Udhaar Given'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('udhaar_repaid')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      type === 'udhaar_repaid'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-paper-50 text-indigoRural-700 border-paper-300'
                    }`}
                  >
                    {language === 'hi' ? 'उधार जमा' : 'Udhaar Repaid'}
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-indigoRural-800">
                  {language === 'hi' ? 'राशि (रुपये):' : 'Amount (₹):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-base font-extrabold text-indigoRural-400">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 bg-paper-50 border border-paper-300 rounded-xl text-lg font-black text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              {/* Customer Name Input (Shown for udhaar, or optional for sale) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-indigoRural-800 flex items-center justify-between">
                  <span>{language === 'hi' ? 'ग्राहक का नाम:' : 'Customer Name:'}</span>
                  {type.startsWith('udhaar') && (
                    <span className="text-terracotta-600 font-extrabold">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={language === 'hi' ? 'e.g. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-300 rounded-xl text-xs font-semibold text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Customer Phone (Mandatory for udhaar_given) */}
              {type === 'udhaar_given' && (
                <div className="space-y-1 p-3 bg-ochre-50/70 border border-ochre-200 rounded-xl">
                  <label className="text-[11px] font-extrabold text-ochre-900 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-ochre-700" />
                      <span>{language === 'hi' ? 'ग्राहक का 10-अंकीय मोबाइल नंबर (अनिवार्य):' : 'Customer 10-digit Mobile (Required):'}</span>
                    </span>
                    <span className="text-terracotta-700 font-black">*तगादा हेतु</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono font-bold text-ochre-700">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3 py-1.5 bg-white border border-ochre-300 rounded-lg text-xs font-mono font-bold text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-ochre-500"
                    />
                  </div>
                  <p className="text-[10px] text-ochre-700">
                    {language === 'hi'
                      ? '✓ यही नंबर व्हाट्सएप तगादा लिंक व यूपीआई संदेश में उपयोग होगा।'
                      : '✓ Used directly for 1-click WhatsApp reminders & UPI settlements.'}
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Confirm & Save Button */}
              <div className="pt-2">
                <Button
                  onClick={handleConfirmSave}
                  variant="primary"
                  size="md"
                  disabled={isSaving || saveSuccess}
                  className="w-full shadow-md"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{language === 'hi' ? '✓ दर्ज हो गया!' : '✓ Recorded!'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isSaving ? '...' : (language === 'hi' ? 'पुष्टि करें और बही-खाता में सहेजें' : 'Confirm & Save to Khata')}</span>
                    </>
                  )}
                </Button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
