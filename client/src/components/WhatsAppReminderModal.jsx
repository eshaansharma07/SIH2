import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, MessageSquare, Smartphone, ExternalLink, Sparkles, AlertCircle, ShieldCheck, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export function WhatsAppReminderModal({ isOpen, onClose, customer, shop, onReminderSent }) {
  const { language } = useTranslation();
  const [selectedTone, setSelectedTone] = useState('polite'); // 'polite', 'festive', 'statement', 'custom'
  const [message, setMessage] = useState('');
  const [shopUpiId, setShopUpiId] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Shop details
  const shopName = shop?.name || (language === 'hi' ? 'हमारी दुकान' : 'Our Kirana Store');
  const shopPhone = (shop?.phone || '').replace(/\D/g, '').replace(/^91/, '') || '9839124789';
  const defaultUpi = shopUpiId || `${shopPhone}@upi`;

  const customerName = customer?.name || customer?.customerName || (language === 'hi' ? 'ग्राहक' : 'Customer');
  const rawPhone = customer?.cleanPhone || customer?.phone || customer?.customer_phone || '';
  const cleanPhone = (phoneInput || String(rawPhone).replace(/\D/g, '').replace(/^91/, '')).slice(-10);
  const balance = Number(customer?.balanceOwed || 0);
  const village = customer?.village_address || customer?.village || (language === 'hi' ? 'स्थानीय' : 'Local');

  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(defaultUpi)}&pn=${encodeURIComponent(shopName)}&am=${balance}&cu=INR&tn=${encodeURIComponent('Khata Settle ' + shopName)}`;

  useEffect(() => {
    if (!customer) return;
    const initialRaw = customer?.cleanPhone || customer?.phone || customer?.customer_phone || '';
    const initialClean = String(initialRaw).replace(/\D/g, '').replace(/^91/, '').slice(-10);
    setPhoneInput(initialClean);
  }, [customer]);

  // Regenerate message when tone, customer, or UPI changes
  useEffect(() => {
    if (!customer) return;

    const upiStr = defaultUpi;

    if (selectedTone === 'polite') {
      setMessage(
        language === 'hi'
          ? `नमस्ते ${customerName} जी! 🙏\n${shopName} से आपका ₹${balance.toLocaleString('en-IN')} का किराना हिसाब बाकी है।\nकृपया फुर्सत मिलते ही या नीचे दिए UPI पर भुगतान कर दें। धन्यवाद!\n\n💳 UPI ID: ${upiStr}`
          : `Namaste ${customerName} ji! 🙏\nYour grocery khata balance at ${shopName} is ₹${balance.toLocaleString('en-IN')}.\nPlease settle when convenient via cash or UPI. Thank you!\n\n💳 UPI ID: ${upiStr}`
      );
    } else if (selectedTone === 'festive') {
      setMessage(
        language === 'hi'
          ? `नमस्ते ${customerName} जी! 🌾✨\n${shopName} पर त्योहार व मंडी सीजन का नया माल आ चुका है।\nनिवेदन है कि पिछला ₹${balance.toLocaleString('en-IN')} का हिसाब चुकता करवाकर नया सामान ले जाएं। सपरिवार स्वागत है!\n\n💳 UPI ID: ${upiStr}`
          : `Namaste ${customerName} ji! 🌾✨\nFresh festival and seasonal rations have arrived at ${shopName}.\nPlease clear your previous balance of ₹${balance.toLocaleString('en-IN')} at your earliest convenience.\n\n💳 UPI ID: ${upiStr}`
      );
    } else if (selectedTone === 'statement') {
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      setMessage(
        language === 'hi'
          ? `📜 *${shopName} - ग्राहक खाता पर्ची*\n` +
            `ग्राहक: ${customerName}\n` +
            `गाँव/पता: ${village}\n` +
            `कुल बकाया: *₹${balance.toLocaleString('en-IN')}*\n` +
            `दिनांक: ${today}\n\n` +
            `कृपया बकाया राशि का भुगतान करें। धन्यवाद!\n💳 UPI ID: ${upiStr}`
          : `📜 *${shopName} - Customer Statement*\n` +
            `Customer: ${customerName}\n` +
            `Address: ${village}\n` +
            `Balance Owed: *₹${balance.toLocaleString('en-IN')}*\n` +
            `Date: ${today}\n\n` +
            `Please clear your pending amount. Thank you!\n💳 UPI ID: ${upiStr}`
      );
    }
  }, [selectedTone, customer, defaultUpi, language, shopName]);

  if (!isOpen || !customer) return null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = async () => {
    if (!cleanPhone || cleanPhone.length < 10) {
      handleCopyMessage();
      return;
    }

    setDispatching(true);
    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp Click-to-Chat in new window/tab
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Record reminder sent timestamp on server if customer has an id
    const custId = customer.customerId || customer.id;
    if (custId && !String(custId).startsWith('unregistered-')) {
      try {
        await api.recordReminderSent(custId);
      } catch (err) {
        console.warn('Could not record reminder timestamp:', err.message);
      }
    }

    setDispatchSuccess(true);
    setDispatching(false);

    onReminderSent?.({
      ...customer,
      phone: cleanPhone,
      last_reminder_sent: new Date().toISOString()
    });

    setTimeout(() => {
      setDispatchSuccess(false);
      onClose();
    }, 1200);
  };

  const toneOptions = [
    { id: 'polite', labelHi: 'विनम्र तगादा', labelEn: 'Polite & Gentle', icon: '🙏' },
    { id: 'festive', labelHi: 'त्योहार / नई आवक', labelEn: 'Festive & Seasonal', icon: '🌾' },
    { id: 'statement', labelHi: 'खाता पर्ची (बिल)', labelEn: 'Khata Statement', icon: '📜' },
    { id: 'custom', labelHi: 'स्वयं लिखें', labelEn: 'Custom Note', icon: '✍️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-indigoRural-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-paper-300 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header with WhatsApp official green accent */}
        <div className="px-5 py-4 bg-[#075E54] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-tight font-display">
                  {language === 'hi' ? 'व्हाट्सएप तगादा / बकाया संदेश' : 'WhatsApp Payment Reminder'}
                </h3>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">1-Click</span>
              </div>
              <p className="text-[11px] text-white/80">
                {language === 'hi' ? 'दुकानदार के मोबाइल से सीधे ग्राहक के व्हाट्सएप पर' : 'Dispatches directly from your mobile number'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Summary Strip */}
        <div className="px-5 py-3 bg-paper-100/80 border-b border-paper-200 flex items-center justify-between text-xs">
          <div>
            <div className="font-black text-indigoRural-900 text-sm">{customerName}</div>
            <div className="text-[11px] text-indigoRural-600 font-semibold flex items-center gap-2">
              <span>📱 +91 {cleanPhone || (language === 'hi' ? 'नंबर दर्ज नहीं' : 'No Phone')}</span>
              {village && <span>• 📍 {village}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-black text-terracotta-700 tabular-nums">
              ₹{balance.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] font-bold text-indigoRural-500 uppercase tracking-wider">
              {language === 'hi' ? 'कुल बकाया' : 'Balance Owed'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Tone Selector Pills */}
          <div className="space-y-1.5">
            <label className="font-bold text-indigoRural-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ochre-600" />
              <span>{language === 'hi' ? 'संदेश का लहज़ा (टोन)' : 'Select Reminder Tone'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {toneOptions.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTone(t.id)}
                  className={`px-2.5 py-2 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    selectedTone === t.id
                      ? 'bg-indigoRural-900 text-white border-indigoRural-900 shadow-2xs'
                      : 'bg-paper-50 text-indigoRural-700 border-paper-300 hover:bg-paper-100'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{language === 'hi' ? t.labelHi : t.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigoRural-700 text-[11px] flex items-center gap-1.5">
                <span>💬 {language === 'hi' ? 'व्हाट्सएप चैट प्रीव्यू' : 'WhatsApp Preview'}</span>
              </span>
              <span className="text-[10px] text-paper-500">
                {language === 'hi' ? 'नीचे संदेश संपादित कर सकते हैं' : 'Editable text below'}
              </span>
            </div>

            {/* Mock Chat Wallpaper */}
            <div className="p-3.5 rounded-2xl bg-[#E5DDD5] border border-paper-300 relative">
              <div className="max-w-[90%] ml-auto bg-[#DCF8C6] p-3 rounded-xl rounded-tr-xs shadow-xs text-indigoRural-950 font-sans whitespace-pre-wrap leading-relaxed border border-[#c4e8ab] relative">
                {message}
                <div className="text-[9px] text-[#075E54]/70 font-semibold text-right mt-1.5 flex items-center justify-end gap-1 select-none">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-forestRural-600 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Text Area */}
          <div className="space-y-1.5">
            <textarea
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (selectedTone !== 'custom') setSelectedTone('custom');
              }}
              className="w-full p-3 bg-paper-50 border border-paper-300 rounded-xl text-xs font-medium text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-forestRural-500 focus:bg-white transition"
              placeholder="Type message here..."
            />
          </div>

          {/* Attached Shop UPI ID */}
          <div className="p-3 bg-forestRural-50/70 border border-forestRural-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-forestRural-700 shrink-0" />
              <div>
                <span className="font-bold text-forestRural-900 text-xs">
                  {language === 'hi' ? 'दुकानदार UPI ID (भुगतान हेतु):' : 'Store UPI ID for Instant Settlement:'}
                </span>
                <div className="font-mono text-[11px] text-forestRural-800 font-bold">
                  {defaultUpi}
                </div>
              </div>
            </div>
            <input
              type="text"
              value={shopUpiId}
              onChange={(e) => setShopUpiId(e.target.value)}
              placeholder="Change UPI ID"
              className="px-2.5 py-1 bg-white border border-forestRural-300 rounded-lg text-xs font-mono text-indigoRural-900 w-36 focus:outline-none focus:ring-1 focus:ring-forestRural-500"
            />
          </div>

          {/* Instant UPI Payment QR Code Section */}
          <div className="border border-paper-300 rounded-xl overflow-hidden bg-paper-50">
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between font-bold text-xs text-indigoRural-900 hover:bg-paper-100 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-forestRural-600" />
                <span>{language === 'hi' ? 'दुकान का UPI QR कोड दिखाएं' : 'Show UPI Payment QR Code'}</span>
              </span>
              <span className="text-[11px] text-forestRural-700 font-extrabold">
                {showQrCode ? (language === 'hi' ? 'छुपाएं ▲' : 'Hide ▲') : (language === 'hi' ? 'खोलें ▼' : 'View ▼')}
              </span>
            </button>
            {showQrCode && (
              <div className="p-4 bg-white border-t border-paper-200 flex flex-col items-center justify-center space-y-2 text-center animate-fadeIn">
                <div className="p-3 bg-white border-2 border-forestRural-500 rounded-2xl shadow-sm inline-block">
                  <QRCodeSVG value={upiPaymentUri} size={140} level="M" />
                </div>
                <div className="text-[11px] font-mono font-bold text-forestRural-800">{defaultUpi}</div>
                <p className="text-[10px] text-paper-500 max-w-xs">
                  {language === 'hi'
                    ? `ग्राहक सीधे किसी भी UPI ऐप (GPay / PhonePe / Paytm / BHIM) से स्कैन करके ₹${balance.toLocaleString('en-IN')} का भुगतान कर सकता है।`
                    : `Customer can scan directly from any UPI app to pay ₹${balance.toLocaleString('en-IN')} instantly.`}
                </p>
              </div>
            )}
          </div>

          {/* Missing Phone Number Graceful Fallback Banner */}
          {(!cleanPhone || cleanPhone.length < 10) && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{language === 'hi' ? 'ग्राहक का फोन नंबर दर्ज नहीं है' : 'Customer mobile number missing'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-900">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="flex-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-indigoRural-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-[10px] text-amber-800">
                {language === 'hi'
                  ? 'मोबाइल नंबर दर्ज करने पर सीधे व्हाट्सएप खुलेगा, अथवा नीचे संदेश कॉपी करें।'
                  : 'Enter 10-digit number to launch WhatsApp, or click "Copy Message" below.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyMessage}
              className="py-3 px-4 rounded-xl border border-paper-300 bg-paper-100 hover:bg-paper-200 text-indigoRural-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-forestRural-600" />
                  <span className="text-forestRural-700 font-extrabold">{language === 'hi' ? 'कॉपी हो गया!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigoRural-600" />
                  <span>{language === 'hi' ? 'संदेश कॉपी करें' : 'Copy Message'}</span>
                </>
              )}
            </button>

            {/* Official WhatsApp Launch Button */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              disabled={dispatching || dispatchSuccess}
              className={`py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-95 ${
                dispatchSuccess
                  ? 'bg-forestRural-700 text-white'
                  : (!cleanPhone || cleanPhone.length < 10)
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#25D366] hover:bg-[#20bd5a] text-white'
              }`}
            >
              {dispatchSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'hi' ? 'व्हाट्सएप खुल गया!' : 'Dispatched!'}</span>
                </>
              ) : (!cleanPhone || cleanPhone.length < 10) ? (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{language === 'hi' ? 'संदेश कॉपी करें (नंबर नहीं)' : 'Copy Message (No Phone)'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{language === 'hi' ? 'व्हाट्सएप में भेजें' : 'Send via WhatsApp'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </>
              )}
            </button>

          </div>

          <p className="text-[10px] text-center text-paper-500 pt-1">
            {language === 'hi' 
              ? '✓ 100% सुरक्षित • सीधे आपके व्यक्तिगत व्हाट्सएप से भेजा जाता है • किसी तीसरे पक्ष API शुल्क की आवश्यकता नहीं'
              : '✓ Free & 100% direct via WhatsApp Web/App • No Meta API charges or third-party gateways'}
          </p>

        </div>

      </div>
    </div>
  );
}
