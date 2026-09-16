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
  Bot
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, SectionHeader, Button } from '../components/ui';

export function AdvisorChatPage({ shop, creditData, summaryData, initialPrompt = '', onPromptUsed }) {
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
    if (!shop?.id) return;
    try {
      const res = await api.getAdvisorHistory(shop.id);
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
              ? `राम राम ${shop?.owner_name || 'दुकानदार'} जी! 🙏\n\nमैं आपका साथी AI सलाहकार हूँ। मैंने आपकी दुकान (${shop?.name || 'दुकान'}) के बही-खाते और ${shop?.district || 'क्षेत्र'} के आगामी त्योहारी कैलेंडर का विश्लेषण कर लिया है।\n\nमुझसे कुछ भी पूछें — जैसे कि त्योहार पर कितना माल स्टॉक करना है, ग्राहकों का उधार कैसे समेटना है, या नया उपकरण लेने के लिए कौन सा मुद्रा लोन उपयुक्त है!`
              : `Namaste ${shop?.owner_name || 'Partner'}! 🙏\n\nI am your Saathi AI Advisor. I have synchronized with your store (${shop?.name || 'Your Store'}) and the upcoming seasonal demand in ${shop?.district || 'your area'}.\n\nAsk me anything about seasonal inventory planning, managing udhaar recovery, or applying for a statutory MSME loan!`
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
      const res = await api.chatAdvisor(shop.id, text);
      const reply = res.response || res.advice?.content || res.reply;
      if (res.success && reply) {
        setMessages(prev => [
          ...prev, 
          {
            role: 'assistant',
            content: reply,
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

  const totalIncome = summaryData?.totalIncome || creditData?.metrics?.totalIncome;
  const netSurplus = summaryData?.netSurplus || creditData?.metrics?.netSurplus;
  const creditScore = creditData?.totalScore;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner & Grounding Controls with Warli Border */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta-600 flex items-center justify-center text-white shadow-2xs">
              <Sparkles className="w-5 h-5 text-ochre-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-indigoRural-900 tracking-tight font-display">
                  {language === 'hi' ? 'साथी AI' : 'Saathi AI'}
                </h1>
                <Badge variant="brand" size="sm">
                  Claude Grounded
                </Badge>
              </div>
              <p className="text-xs text-indigoRural-500">
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
          <div className="bg-paper-100 rounded-xl p-4 border border-paper-300 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-indigoRural-800 border-b border-paper-200 pb-1.5">
              <span>Live Grounding Context Fed to Model:</span>
              <span className="text-[10px] text-forestRural-700 font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-forestRural-600" />
                <span>Zero Hallucination Guardrails</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-paper-200">
                <span className="text-indigoRural-400 block text-[10px] uppercase font-bold">Enterprise</span>
                <strong className="text-indigoRural-900">{shop?.name || (language === 'hi' ? 'मेरी दुकान' : 'Registered Store')}{shop?.village ? ` (${shop.village})` : ''}</strong>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-paper-200">
                <span className="text-indigoRural-400 block text-[10px] uppercase font-bold">Audited Volume</span>
                <strong className="text-indigoRural-900">
                  {totalIncome ? `₹${totalIncome.toLocaleString('en-IN')}` : 'Audited Ledger'} 
                  {netSurplus ? ` (₹${netSurplus.toLocaleString('en-IN')} Surplus)` : ''}
                </strong>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-paper-200">
                <span className="text-indigoRural-400 block text-[10px] uppercase font-bold">Credit Tier</span>
                <strong className="text-forestRural-700">
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
                  <div className="w-8 h-8 rounded-full bg-terracotta-600 flex items-center justify-center text-white shrink-0 shadow-2xs mt-1">
                    <Sparkles className="w-4 h-4 text-ochre-200" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-terracotta-600 text-white rounded-br-xs'
                      : 'bg-paper-50 text-indigoRural-900 border border-paper-200 rounded-bl-xs'
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
              <div className="w-8 h-8 rounded-full bg-terracotta-600 flex items-center justify-center text-white shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-ochre-200" />
              </div>
              <div className="bg-paper-50 border border-paper-200 rounded-2xl rounded-bl-xs p-4 text-xs text-indigoRural-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-semibold">{language === 'hi' ? 'विश्लेषण हो रहा है...' : 'Analyzing Mandi & Shop Ledger...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Chips */}
        <div className="px-4 py-2 bg-paper-50/70 border-t border-paper-200 flex items-center gap-1.5 overflow-x-auto">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(language === 'hi' ? q.textHi : q.textEn)}
              className="px-3 py-1 bg-white hover:bg-paper-100 text-indigoRural-700 text-xs font-semibold rounded-full border border-paper-300 shrink-0 transition active:scale-95 shadow-2xs cursor-pointer"
            >
              {language === 'hi' ? q.textHi : q.textEn}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-paper-200">
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
              className="flex-1 px-4 py-3 bg-paper-100 focus:bg-white border border-paper-300 rounded-full text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-terracotta-500 transition text-indigoRural-900 placeholder:text-indigoRural-400"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-11 h-11 rounded-full bg-terracotta-600 hover:bg-terracotta-700 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-xs transition shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </Card>

    </div>
  );
}
