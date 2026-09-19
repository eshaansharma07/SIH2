import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Database, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldCheck, 
  Info, 
  Lightbulb, 
  RotateCcw,
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, SectionHeader, Button } from '../components/ui';
import { APP_ADVISOR_NAME_EN, APP_ADVISOR_NAME_HI } from '../config/brand';
import { speak, stopSpeech } from '../utils/speechService';
import { LANG_VOICE_MAP } from '../data/demoTourTranslations';

export function AdvisorChatPage({ shop, creditData, summaryData, initialPrompt = '', onPromptUsed }) {
  const { t, language, currentLanguageInfo } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
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
        setInputText(transcript);
      };

      recognition.onerror = (e) => {
        console.warn('[AdvisorChatPage] Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[AdvisorChatPage] Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleSpeakMessage = (text, index) => {
    if (speakingIndex === index) {
      stopSpeech();
      setSpeakingIndex(null);
      return;
    }

    stopSpeech();
    setSpeakingIndex(index);

    speak({
      text,
      lang: targetSpeechLang,
      onStart: () => setSpeakingIndex(index),
      onEnd: () => setSpeakingIndex(null),
      onError: () => setSpeakingIndex(null)
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

  useEffect(() => {
    loadChatHistory();
  }, [shop?.id]);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
      onPromptUsed?.();
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    if (!shop?.id) return;
    try {
      const res = await api.getAdvisorHistory(shop.id);
      if (res.history && res.history.length > 0) {
        setMessages(res.history.map(m => ({
          role: m.role,
          content: String(m.content || '').replace(/\*/g, '').replace(/\s*[\u2014\u2013]\s*/g, ': ').replace(/[\u2014\u2013]/g, ': ').replace(/\s*--\s*/g, ': ').trim(),
          timestamp: m.timestamp
        })));
      } else {
        setMessages([
          {
            role: 'assistant',
            content: language === 'hi' 
              ? `राम राम ${shop?.owner_name || 'दुकानदार'} जी! 🙏\n\nमैं आपका सेतु AI सलाहकार हूँ। मैंने आपकी दुकान (${shop?.name || 'दुकान'}) के बही-खाते और ${shop?.district || 'क्षेत्र'} के आगामी त्योहारी कैलेंडर का विश्लेषण कर लिया है।\n\nमुझसे कुछ भी पूछें: जैसे कि त्योहार पर कितना माल स्टॉक करना है, ग्राहकों का उधार कैसे समेटना है, या नया उपकरण लेने के लिए कौन सा मुद्रा लोन उपयुक्त है!`
              : `Namaste ${shop?.owner_name || 'Partner'}! 🙏\n\nI am your Setu AI Advisor. I have synchronized with your store (${shop?.name || 'Your Store'}) and the upcoming seasonal demand in ${shop?.district || 'your area'}.\n\nAsk me anything about seasonal inventory planning, managing udhaar recovery, or applying for a statutory MSME loan!`
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading || !shop?.id) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const rawReply = res?.response || res?.advice?.content || res?.content || res?.message || res?.reply;
      const reply = String(rawReply || '').replace(/\*/g, '').replace(/\s*[\u2014\u2013]\s*/g, ': ').replace(/[\u2014\u2013]/g, ': ').replace(/\s*--\s*/g, ': ').trim();
      
      if (res?.updatedOwnerName) {
        window.dispatchEvent(new CustomEvent('vyapaar:shop-updated', { detail: { owner_name: res.updatedOwnerName } }));
      }
      if (res?.success && reply) {
        setMessages(prev => [
          ...prev, 
          {
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString()
          }
        ]);
      }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        {
          role: 'assistant',
          content: language === 'hi'
            ? 'क्षमा करें, नेटवर्क में देरी हो रही है। कृपया पुनः प्रयास करें।'
            : 'Apologies, network delay. Please try asking again.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    { textHi: "दिवाली के लिए खाद्य तेल का कितना स्टॉक लूँ?", textEn: "How much edible oil stock for Diwali?" },
    { textHi: "ग्राहक उधार कैसे कम करें?", textEn: "How to reduce customer udhaar?" },
    { textHi: "क्या डीप-फ्रीज़र के लिए मुद्रा लोन मिलेगा?", textEn: "Can I get a MUDRA loan for a freezer?" },
    { textHi: "क्रेडिट स्कोर 750+ कैसे करें?", textEn: "How to raise credit score above 750?" },
  ];

  const totalIncome = summaryData?.totalIncome || creditData?.metrics?.totalIncome;
  const netSurplus = summaryData?.netSurplus || creditData?.metrics?.netSurplus;
  const creditScore = creditData?.totalScore;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner & Grounding Controls with Warli Border */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-apple-card">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-stone-900 tracking-tight font-display">
                  {language === 'hi' ? APP_ADVISOR_NAME_HI : APP_ADVISOR_NAME_EN}
                </h1>
                <Badge variant="brand" size="sm">
                  Gemini Grounded
                </Badge>
              </div>
              <p className="text-xs text-stone-500">
                {language === 'hi' ? `${shop?.district || 'बलरामपुर'} मंडी एवं आपकी दुकान के वास्तविक आंकड़ों पर आधारित` : 'Hyper-local business intelligence grounded in your verified shop ledger'}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowContext(!showContext)}
            variant="secondary"
            size="sm"
            icon={Database}
            className="self-start sm:self-auto"
          >
            <span>{showContext ? 'Hide Context' : 'Live Data Context'}</span>
            {showContext ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {/* Collapsible Grounding Data Panel */}
        {showContext && (
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-stone-300 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-stone-800 border-b border-stone-200 pb-1.5">
              <span>Live Grounding Context Fed to Model:</span>
              <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Hallucination Guardrails</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Enterprise</span>
                <strong className="text-stone-900">{shop?.name || (language === 'hi' ? 'मेरी दुकान' : 'Registered Store')}{shop?.village ? ` (${shop.village})` : ''}</strong>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Audited Volume</span>
                <strong className="text-stone-900">
                  {totalIncome ? `₹${totalIncome.toLocaleString('en-IN')}` : 'Audited Ledger'} 
                  {netSurplus ? ` (₹${netSurplus.toLocaleString('en-IN')} Surplus)` : ''}
                </strong>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Credit Tier</span>
                <strong className="text-emerald-700">
                  {creditScore ? `${creditScore} / 850 Prime` : 'Prime Bankable Assessment'}
                </strong>
              </div>
            </div>
          </div>
        )}

        <WarliBorder className="w-full h-5 text-terracotta-400 opacity-50 pt-1" />
      </Card>

      {/* 2. Chat Conversation Feed */}
      <Card padding="none" className="flex flex-col h-[520px] overflow-hidden">
        
        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white shrink-0 shadow-apple-card mt-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-apple-card ${
                    isUser
                      ? 'bg-stone-900 text-white rounded-br-xs'
                      : 'bg-white text-stone-900 border border-stone-200/80 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {String(msg.content || '').replace(/\*/g, '').replace(/\s*[\u2014\u2013]\s*/g, ': ').replace(/[\u2014\u2013]/g, ': ').replace(/\s*--\s*/g, ': ')}
                  </div>

                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg.content, index)}
                        className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          speakingIndex === index
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                        title={speakingIndex === index ? "Stop speaking" : `Listen in ${currentLanguageInfo?.nativeName || language}`}
                      >
                        {speakingIndex === index ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                            <span>{language === 'hi' ? 'रोकें' : 'Stop'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#0F3E2E]" />
                            <span>{language === 'hi' ? 'बोलकर सुनें' : 'Listen'}</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] text-stone-400 font-sans">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-white border border-stone-200/80 rounded-2xl rounded-bl-xs p-4 text-xs text-stone-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-semibold">{language === 'hi' ? 'विश्लेषण हो रहा है...' : 'Analyzing Mandi & Shop Ledger...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Chips */}
        <div className="px-4 py-2 bg-stone-50/70 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(language === 'hi' ? q.textHi : q.textEn)}
              className="px-3 py-1 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-full border border-stone-200 shrink-0 transition active:scale-95 shadow-2xs cursor-pointer"
            >
              {language === 'hi' ? q.textHi : q.textEn}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening 
                  ? `${currentLanguageInfo?.nativeName || language}: Listening... बोलिए...` 
                  : (language === 'hi' ? 'यहाँ अपना प्रश्न लिखें या माइक दबाकर बोलें...' : 'Ask question or tap mic to speak in your language...')
              }
              className={`flex-1 px-4 py-3 bg-[#FAF8F5] focus:bg-white border rounded-full text-xs sm:text-sm font-medium focus:outline-none transition text-stone-900 placeholder:text-stone-400 ${
                isListening 
                  ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/40 placeholder:text-amber-700 placeholder:font-semibold' 
                  : 'border-stone-200 focus:ring-2 focus:ring-stone-900/15'
              }`}
            />

            {/* Voice Input Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer ${
                isListening 
                  ? 'bg-amber-500 text-stone-950 animate-pulse ring-2 ring-amber-300 shadow-md' 
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
              title={isListening ? "Stop listening" : `Speak in ${currentLanguageInfo?.nativeName || 'your language'}`}
            >
              {isListening ? <Mic className="w-5 h-5 animate-bounce text-stone-950" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-11 h-11 rounded-full bg-stone-900 hover:bg-stone-800 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-apple-card transition shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </Card>

    </div>
  );
}
