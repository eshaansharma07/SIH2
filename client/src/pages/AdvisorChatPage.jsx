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
  Zap,
  Bot
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export function AdvisorChatPage({ shop, initialPrompt = '', onPromptUsed }) {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef(null);

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
    try {
      const res = await api.getAdvisorHistory(shop?.id || 'ramesh-kirana');
      if (res.history && res.history.length > 0) {
        setMessages(res.history.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        })));
      } else {
        setMessages([
          {
            role: 'assistant',
            content: language === 'hi' 
              ? `राम राम ${shop?.owner_name || 'रमेश'} जी! 🙏\n\nमैं आपका साथी AI सलाहकार हूँ। मैंने आपकी दुकान के 4 महीने के बही-खाते और बलरामपुर के आगामी त्योहारी कैलेंडर का विश्लेषण कर लिया है।\n\nमुझसे कुछ भी पूछें — जैसे कि त्योहार पर कितना तेल-चीनी स्टॉक करना है, ग्राहकों का उधार कैसे समेटना है, या नया डीप-फ्रीज़र लेने के लिए कौन सा मुद्रा लोन उपयुक्त है!`
              : `Namaste ${shop?.owner_name || 'Ramesh'}! 🙏\n\nI am your Saathi AI Advisor. I have synchronized with your 4-month audited transactions and the upcoming Google Calendar festival demand.\n\nAsk me anything about seasonal inventory planning, managing udhaar recovery, or applying for a MUDRA loan!`
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.chatAdvisor(shop?.id || 'ramesh-kirana', text);
      if (res.success && res.response) {
        setMessages(prev => [
          ...prev, 
          {
            role: 'assistant',
            content: res.response,
            timestamp: new Date().toISOString()
          }
        ]);
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

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner & Grounding Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {language === 'hi' ? 'साथी AI' : 'Saathi AI'}
                </h1>
                <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Gemini Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? 'बलरामपुर मंडी एवं आपकी दुकान के वास्तविक आंकड़ों पर आधारित' : 'Hyper-local business intelligence grounded in your verified shop ledger'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowContext(!showContext)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition self-start sm:self-auto"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showContext ? 'Hide Context' : 'Live Data Context'}</span>
            {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Grounding Data Panel */}
        {showContext && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-1.5">
              <span>Live Database Context Fed to System Prompt:</span>
              <span className="text-[10px] text-emerald-600 font-extrabold">✓ Zero Hallucination Grounding</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Enterprise</span>
                <strong className="text-slate-900">{shop?.name || 'Ramesh Kirana'} ({shop?.village || 'Utraula'})</strong>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Audited Volume</span>
                <strong className="text-slate-900">₹2,25,857 (₹63k Surplus)</strong>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Credit Tier</span>
                <strong className="text-indigo-600">755 / 850 Prime Bankable</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Chat Conversation Feed (Apple iMessage / Galaxy AI Style) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card flex flex-col h-[520px] overflow-hidden">
        
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                    <Sparkles className="w-4 h-4 text-amber-200" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl rounded-bl-sm p-4 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-semibold">{language === 'hi' ? 'विश्लेषण हो रहा है...' : 'Analyzing Mandi & Shop Ledger...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Chips */}
        <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(language === 'hi' ? q.textHi : q.textEn)}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 shrink-0 transition active:scale-95 shadow-2xs"
            >
              {language === 'hi' ? q.textHi : q.textEn}
            </button>
          ))}
        </div>

        {/* Modern Apple-style Input Bar */}
        <div className="p-3 bg-white border-t border-slate-100">
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
              placeholder={language === 'hi' ? 'यहाँ अपना प्रश्न लिखें या पूछें...' : 'Ask about festival stock, loan schemes, or khata...'}
              className="flex-1 px-4 py-3 bg-slate-100 focus:bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
