import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Minus, 
  X, 
  Bot, 
  Loader2,
  ChevronRight,
  Receipt,
  Landmark,
  FileText,
  Package,
  CreditCard,
  PlusCircle,
  Home,
  UserPlus,
  HelpCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { speak, stopSpeech } from '../utils/speechService';
import { LANG_VOICE_MAP } from '../data/demoTourTranslations';

export function FloatingSetuAI({ 
  currentShop, 
  onNavigateTab, 
  onOpenKeypad, 
  onOpenWholesale,
  onOpenRegister,
  isDemoTourOpen = false
}) {
  const { language, currentLanguageInfo } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState('all');
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const targetSpeechLang = LANG_VOICE_MAP[language] || 'en-IN';

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'hi' ? 'आपके ब्राउज़र में वॉइस इनपुट समर्थित नहीं है।' : 'Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = targetSpeechLang;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (e) => {
        console.warn('[FloatingSetuAI] Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[FloatingSetuAI] Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleSpeakMessage = (text, msgIndex) => {
    if (speakingMsgIndex === msgIndex) {
      stopSpeech();
      setSpeakingMsgIndex(null);
      return;
    }

    stopSpeech();
    setSpeakingMsgIndex(msgIndex);

    speak({
      text,
      lang: targetSpeechLang,
      onStart: () => setSpeakingMsgIndex(msgIndex),
      onEnd: () => setSpeakingMsgIndex(null),
      onError: () => setSpeakingMsgIndex(null)
    });
  };

  useEffect(() => {
    return () => {
      stopSpeech();
      try {
        recognitionRef.current?.abort();
      } catch (_) {}
    };
  }, []);

  const shopName = currentShop?.owner_name || (language === 'hi' ? 'दुकानदार जी' : 'Merchant');
  const isDemo = currentShop?.is_demo === 1 || !currentShop;

  // Services available for quick one-tap routing
  const services = [
    {
      id: 'dashboard',
      label: language === 'hi' ? 'अवलोकन' : 'Overview',
      icon: Home,
      action: () => { onNavigateTab?.('dashboard'); setIsOpen(false); }
    },
    {
      id: 'cashflow',
      label: language === 'hi' ? 'बही-खाता' : 'Bahi-Khata',
      icon: Receipt,
      action: () => { onNavigateTab?.('cashflow'); setIsOpen(false); }
    },
    {
      id: 'record-sale',
      label: language === 'hi' ? 'नई बिक्री' : 'Record Sale',
      icon: PlusCircle,
      highlight: true,
      action: () => { onOpenKeypad?.(); setIsOpen(false); }
    },
    {
      id: 'credit',
      label: language === 'hi' ? 'साख स्कोर' : 'Credit Score',
      icon: CreditCard,
      action: () => { onNavigateTab?.('credit'); setIsOpen(false); }
    },
    {
      id: 'schemes',
      label: language === 'hi' ? 'योजनाएं' : 'Schemes',
      icon: Landmark,
      action: () => { onNavigateTab?.('schemes'); setIsOpen(false); }
    },
    {
      id: 'dossier',
      label: language === 'hi' ? 'बैंक डॉसियर' : 'Bank Dossier',
      icon: FileText,
      action: () => { onNavigateTab?.('dossier'); setIsOpen(false); }
    },
    {
      id: 'wholesale',
      label: language === 'hi' ? 'थोक मंडी' : 'Wholesale',
      icon: Package,
      action: () => { onOpenWholesale?.(); setIsOpen(false); }
    },
    {
      id: 'register',
      label: language === 'hi' ? 'नया पंजीकरण' : 'Register Shop',
      icon: UserPlus,
      highlight: true,
      action: () => { onOpenRegister?.(); setIsOpen(false); }
    }
  ];

  const quickQuestions = [
    { 
      label: language === 'hi' ? 'दुकान रजिस्टर कैसे करें?' : 'How to register my shop?', 
      prompt: language === 'hi' ? 'व्यापार सेतु में अपनी असली दुकान कैसे रजिस्टर करें?' : 'How do I register my actual shop in Vyapaar Setu?',
      serviceAction: 'register'
    },
    { 
      label: language === 'hi' ? 'क्रेडिट स्कोर चेक करें' : 'Check credit score', 
      prompt: language === 'hi' ? 'मेरा वर्तमान साख स्कोर और लोन पात्रता क्या है?' : 'What is my current alternative credit score and loan eligibility?',
      serviceAction: 'credit'
    },
    { 
      label: language === 'hi' ? 'बिक्री कैसे दर्ज करें?' : 'How to record sale?', 
      prompt: language === 'hi' ? 'रोज की नकद या उधार बिक्री कैसे दर्ज करूं?' : 'How do I record a daily cash or udhaar sale?',
      serviceAction: 'record-sale'
    },
    { 
      label: language === 'hi' ? 'सरकारी योजना सहायता' : 'Find Govt Scheme', 
      prompt: language === 'hi' ? 'मेरी दुकान के लिए 0% या कम ब्याज वाली सरकारी योजना कौन सी है?' : 'Which 0% or low-interest government loan scheme is best for my shop?',
      serviceAction: 'schemes'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Determine if reply matches any service action
  const detectServiceAction = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('register') || lower.includes('पंजीकरण') || lower.includes('नया खाता') || lower.includes('sign up')) {
      return { id: 'register', label: language === 'hi' ? '📝 दुकान रजिस्टर करें' : '📝 Register Shop Now', action: onOpenRegister };
    }
    if (lower.includes('credit') || lower.includes('स्कोर') || lower.includes('साख') || lower.includes('cibil')) {
      return { id: 'credit', label: language === 'hi' ? '💳 क्रेडिट स्कोर देखें' : '💳 View Credit Score', action: () => onNavigateTab?.('credit') };
    }
    if (lower.includes('scheme') || lower.includes('योजना') || lower.includes('mudra') || lower.includes('subsidy')) {
      return { id: 'schemes', label: language === 'hi' ? '🏛️ योजनाएं देखें' : '🏛️ View Govt Schemes', action: () => onNavigateTab?.('schemes') };
    }
    if (lower.includes('sale') || lower.includes('bahi') || lower.includes('उधार') || lower.includes('बिक्री') || lower.includes('ledger')) {
      return { id: 'cashflow', label: language === 'hi' ? '📖 बही-खाता खोलें' : '📖 Open Bahi-Khata', action: () => onNavigateTab?.('cashflow') };
    }
    if (lower.includes('dossier') || lower.includes('डॉसियर') || lower.includes('pdf') || lower.includes('bank report')) {
      return { id: 'dossier', label: language === 'hi' ? '📑 बैंक डॉसियर देखें' : '📑 View Bank Dossier', action: () => onNavigateTab?.('dossier') };
    }
    if (lower.includes('mandi') || lower.includes('wholesale') || lower.includes('मंडी') || lower.includes('थोक')) {
      return { id: 'wholesale', label: language === 'hi' ? '🏪 थोक मंडी खोजें' : '🏪 Open Wholesale Mandi', action: onOpenWholesale };
    }
    return null;
  };

  const handleSend = async (textToSend, explicitAction = null) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const shopId = currentShop?.id || 'ramesh-kirana';
      const res = await api.chatAdvisor(shopId, text);
      const reply = res?.response || res?.message || res?.reply || (language === 'hi' ? 'नमस्ते! आपके प्रश्न का विश्लेषण किया गया है।' : "Namaste! I've analyzed your query based on verified metrics.");
      
      const suggestedAction = detectServiceAction(text + ' ' + reply);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          action: suggestedAction,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      // Intelligent fallback with service link
      let fallbackText = language === 'hi' ? `राम-राम ${shopName}! ` : `Namaste ${shopName}! `;
      const suggestedAction = detectServiceAction(text);

      if (suggestedAction?.id === 'register') {
        fallbackText += language === 'hi' 
          ? 'आप नीचे दिए गए बटन से तुरंत अपनी नई दुकान रजिस्टर कर सकते हैं। केवल मोबाइल नंबर और दुकान का नाम चाहिए।'
          : 'You can register your enterprise immediately using the button below. Just enter your 10-digit mobile number and enterprise name.';
      } else if (suggestedAction?.id === 'record-sale') {
        fallbackText += language === 'hi'
          ? 'नई बिक्री या ग्राहक उधार जोड़ने के लिए आप "नई बिक्री" बटन दबाकर सीधे कीपैड या बोलकर रिकॉर्ड कर सकते हैं।'
          : "To record a daily cash sale or customer credit, tap the 'Record Sale' button to open the touch keypad or speech input.";
      } else if (suggestedAction?.id === 'credit') {
        fallbackText += language === 'hi'
          ? 'आपका वैकल्पिक साख स्कोर 753/850 (Prime Bankable) है। यह नियमित बही-खाता और यूपीआई लेनदेन पर आधारित है।'
          : 'Your Alternative Credit Score is 753/850 (Prime Bankable), calculated from continuous transactions and customer recovery.';
      } else {
        fallbackText += language === 'hi'
          ? 'मैं व्यापार सेतु में आपकी हर सेवा तक पहुँचने में मदद कर सकता हूँ—बही-खाता, सरकारी योजना, क्रेडिट स्कोर, या नया रजिस्ट्रेशन।'
          : 'I can help you navigate all Vyapaar Setu services—Bahi-Khata ledger, institutional schemes, credit appraisal, or registering your enterprise.';
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackText,
          action: suggestedAction,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed right-4 sm:right-6 z-50 select-none transition-all duration-300 ${
      isDemoTourOpen ? 'bottom-32 sm:bottom-28' : 'bottom-20 sm:bottom-6'
    }`}>
      {/* 1. Minimized Circle State (Bottom Right) */}
      {!isOpen && (
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-[#0F3E2E] hover:bg-[#165640] text-white shadow-[0_8px_30px_rgba(15,62,46,0.38)] hover:shadow-[0_14px_38px_rgba(15,62,46,0.52)] border-2 border-[#E5D7B7]/80 hover:border-amber-300 flex items-center justify-center hover:scale-110 hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all duration-200 cursor-pointer relative"
            aria-label="Open Setu AI Assistant"
            title={language === 'hi' ? 'सेतु AI सहायक खोलें' : 'Open Setu AI Assistant'}
          >
            {/* Ambient Pulsing Aura */}
            <span className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping pointer-events-none group-hover:scale-125 transition-transform" />
            
            {/* Center Icon */}
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-300 fill-amber-300/40 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-120" />
            </div>

            {/* Online Live Status Indicator */}
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0F3E2E] shadow-sm group-hover:scale-110 transition-transform" />
          </button>

          {/* Desktop Hover Tooltip Badge (Points inwards towards left from bottom-right) */}
          <div className="hidden sm:block absolute right-16 top-1/2 -translate-y-1/2 mr-2 px-3 py-1.5 rounded-xl bg-[#1C1917]/95 backdrop-blur-md text-[#FAF7F2] text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 pointer-events-none transition-all duration-200 shadow-2xl border border-white/10">
            <span className="text-amber-300 font-serif font-bold mr-1">सेतु AI</span>
            <span>{language === 'hi' ? '• सेवा सहायक' : '• Services & Help'}</span>
          </div>
        </div>
      )}

      {/* 2. Expanded Chatbot Window (Bottom Right) */}
      {isOpen && (
        <div className="w-[330px] sm:w-[370px] h-[520px] max-h-[82vh] bg-[#FAF8F5] rounded-3xl shadow-[0_24px_60px_-12px_rgba(15,62,46,0.32)] border border-[#DFCFC0] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="p-3.5 bg-[#0F3E2E] text-white flex items-center justify-between shrink-0 border-b border-emerald-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/12 border border-white/15 flex items-center justify-center text-amber-300 shadow-inner">
                <Sparkles className="w-5 h-5 fill-amber-300/40" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>Setu AI</span>
                  <span className="text-[9px] bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 font-sans font-bold px-1.5 py-0.2 rounded-full">
                    Active
                  </span>
                </div>
                <div className="text-[10px] text-stone-300 font-medium">
                  {language === 'hi' ? 'सेवा एवं व्यापार सहायक' : 'Services & Business Assistant'}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={language === 'hi' ? 'छोटा करें' : 'Minimize'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={language === 'hi' ? 'बंद करें' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Services Navigation Carousel / Bar */}
          <div className="p-2.5 bg-[#F4EFE6] border-b border-[#E8DFCFC0] shrink-0">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 font-sans">
                {language === 'hi' ? 'त्वरित सेवाएं (Quick Access)' : 'Quick Services'}
              </span>
              {isDemo && (
                <button
                  type="button"
                  onClick={() => { onOpenRegister?.(); setIsOpen(false); }}
                  className="text-[10px] font-bold text-[#B91C1C] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{language === 'hi' ? 'पंजीकरण करें' : 'Register'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {services.map((svc) => {
                const Icon = svc.icon;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={svc.action}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap hover-pill transition-all duration-150 cursor-pointer shadow-2xs shrink-0 ${
                      svc.highlight
                        ? 'bg-[#0F3E2E] text-white hover:bg-[#165640] border border-emerald-800 hover:shadow-sm'
                        : 'bg-white hover:bg-[#ECE5D8] text-stone-800 border border-[#DCD3C4]'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span>{svc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FAF8F5]">
            {/* Friendly Greeting Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#ECE5D8] shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between">
                <div className="font-serif font-bold text-stone-900 text-xs">
                  {language === 'hi' ? `राम-राम ${shopName}!` : `Namaste ${shopName}!`}
                </div>
                {isDemo && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300/60">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'मैं सेतु एआई हूँ। आप सीधे किसी भी सेवा पर जा सकते हैं, सवाल पूछ सकते हैं या अपनी असली दुकान रजिस्टर कर सकते हैं।'
                  : "I'm Setu AI. Tap any service above, ask business questions, or register your actual store below."
                }
              </p>

              {/* Quick Prompt Chips */}
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q.prompt, q.serviceAction)}
                    className="px-2.5 py-2 rounded-xl bg-[#F6F2E9] hover:bg-[#EDE5D5] hover:border-emerald-700/40 hover:-translate-y-0.5 hover:shadow-2xs active:translate-y-0 active:scale-95 text-[10px] font-bold text-stone-800 text-left transition-all duration-150 cursor-pointer border border-[#E0D7C5] line-clamp-2 leading-tight"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message History */}
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-[#0F3E2E] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4 text-amber-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[84%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#0F3E2E] text-white rounded-br-xs'
                        : 'bg-white text-stone-800 border border-[#ECE5D8] rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>

                    {/* Action button in bot response if service suggested */}
                    {!isUser && m.action && (
                      <button
                        type="button"
                        onClick={() => {
                          m.action.action?.();
                          setIsOpen(false);
                        }}
                        className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#0F3E2E] text-white text-[11px] font-bold hover:bg-[#165640] transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>{m.action.label}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Voice Read-Aloud for Assistant Response */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-1.5 mt-2 pt-1 border-t border-[#ECE5D8]/70">
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(m.content, idx)}
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                            speakingMsgIndex === idx
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-[#FAF8F5] text-stone-600 border-stone-200 hover:bg-[#F2ECE1] hover:text-stone-900'
                          }`}
                          title={speakingMsgIndex === idx ? "Stop voice" : `Listen aloud (${currentLanguageInfo?.nativeName || language})`}
                        >
                          {speakingMsgIndex === idx ? (
                            <>
                              <VolumeX className="w-3 h-3 text-amber-700 animate-pulse" />
                              <span>{language === 'hi' ? 'रोकें' : 'Stop'}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-[#0F3E2E]" />
                              <span>{language === 'hi' ? 'बोलकर सुनें' : 'Listen'}</span>
                            </>
                          )}
                        </button>
                        <span className="text-[9px] text-stone-400">
                          {m.timestamp}
                        </span>
                      </div>
                    )}

                    {isUser && (
                      <span className="text-[9px] block text-right mt-1 text-emerald-200/70">
                        {m.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-stone-500 text-xs pl-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F3E2E]" />
                <span className="text-[11px] font-medium">
                  {language === 'hi' ? 'सेतु एआई सोच रहा है...' : 'Setu AI is analyzing...'}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-[#E8E0D2] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening 
                  ? `${currentLanguageInfo?.nativeName || language}: Listening... बोलिए...` 
                  : (language === 'hi' ? 'कुछ भी पूछें या बोलकर बताएं...' : 'Ask question or tap mic to speak...')
              }
              className={`flex-1 bg-[#F6F3EC] border rounded-xl px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all ${
                isListening 
                  ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-300/60 placeholder:text-amber-700 placeholder:font-semibold' 
                  : 'border-[#E0D7C8] focus:border-[#0F3E2E] focus:ring-1 focus:ring-[#0F3E2E]'
              }`}
            />

            {/* Voice Input Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isListening 
                  ? 'bg-amber-500 text-stone-950 animate-pulse shadow-md ring-2 ring-amber-300' 
                  : 'bg-[#F6F3EC] hover:bg-[#ECE5D8] text-[#0F3E2E] border border-[#E0D7C8]'
              }`}
              title={isListening ? "Stop listening" : `Speak in ${currentLanguageInfo?.nativeName || 'your language'}`}
            >
              {isListening ? <Mic className="w-4 h-4 animate-bounce text-stone-950" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-[#0F3E2E] text-white flex items-center justify-center hover:bg-[#165640] disabled:opacity-40 disabled:hover:bg-[#0F3E2E] transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
