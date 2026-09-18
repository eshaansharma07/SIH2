import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Minus, 
  X, 
  Bot, 
  User, 
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../utils/api';

export function FloatingSetuAI({ 
  currentShop, 
  onNavigateTab, 
  onOpenKeypad, 
  onOpenWholesale 
}) {
  const { language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const shopName = currentShop?.owner_name || 'Ramesh Ji';

  const quickQuestions = [
    { label: language === 'hi' ? 'जल्दी सवाल' : 'Quick question', prompt: 'What are the top 3 priorities for my store today?' },
    { label: language === 'hi' ? 'मार्गदर्शन' : 'Guide me', prompt: 'How do I improve my business credit profile?' },
    { label: language === 'hi' ? 'योजना समझाएं' : 'Explain a scheme', prompt: 'Which government scheme gives 0% or low interest for my kirana store?' },
    { label: language === 'hi' ? 'बिक्री कैसे दर्ज करें?' : 'How to record a sale?', prompt: 'How do I record a daily cash or udhaar sale in SaakhSetu?' }
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
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
      const reply = res?.response || res?.message || "Namaste! I have analyzed your query based on RBI PSL norms and your shop activity.";
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      // Grounded rural fallback response
      let fallbackText = `Namaste ${shopName}! `;
      if (text.toLowerCase().includes('sale') || text.toLowerCase().includes('bahi') || text.toLowerCase().includes('record')) {
        fallbackText += "To record a sale or udhaar, click the 'Record Sale →' button at the top of your Overview, or tap the '+' button in Bahi-Khata. You can also use voice to speak in Hindi!";
      } else if (text.toLowerCase().includes('scheme') || text.toLowerCase().includes('mudra') || text.toLowerCase().includes('loan')) {
        fallbackText += "Based on your verified kirana profile in UP, you match PM MUDRA Kishor (up to ₹5 Lakhs) and UP ODOP Margin Money Scheme. Go to the Schemes tab to review full benefits!";
      } else {
        fallbackText += "I am actively monitoring your daily bahi-khata and wholesale opportunities. Regularly logging daily entries helps build your institutional credit profile for low-interest bank loans.";
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {/* Collapsed Floating Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0F3E2E] text-white shadow-xl hover:shadow-2xl hover:bg-[#165640] transition-all duration-200 cursor-pointer border border-emerald-800/40 transform hover:-translate-y-0.5"
          aria-label="Open Setu AI assistant"
        >
          <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="font-serif font-bold text-xs tracking-wide">Setu AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Expanded Floating Popup Window */}
      {isOpen && (
        <div className="w-[330px] sm:w-[370px] h-[480px] max-h-[85vh] bg-[#FAF8F5] rounded-2xl shadow-2xl border border-stone-300/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* Header */}
          <div className="p-3.5 bg-[#0F3E2E] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>Setu AI</span>
                  <span className="text-[9px] bg-emerald-700/80 text-emerald-100 font-sans font-bold px-1.5 py-0.2 rounded-full">
                    Active
                  </span>
                </div>
                <div className="text-[10px] text-stone-300 font-medium">
                  {language === 'hi' ? 'आपका व्यापार सहायक' : 'Your business assistant'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FAF8F5]">
            {/* Friendly Greeting Card */}
            <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <div className="font-serif font-bold text-stone-900 text-xs">
                Namaste {shopName}!
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'मैं सेतु एआई हूँ, आपका व्यापार सहायक। आज मैं आपकी क्या सहायता कर सकता हूँ?'
                  : "I'm Setu AI, your business assistant. How can I help you today?"
                }
              </p>

              {/* Quick Prompt Chips */}
              <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q.prompt)}
                    className="px-2 py-1.5 rounded-lg bg-[#F3EFE6] hover:bg-[#EBE4D5] text-[10px] font-semibold text-stone-800 text-left truncate transition-colors cursor-pointer border border-stone-300/50"
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
                    <div className="w-6 h-6 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center shrink-0 text-[10px]">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#0F3E2E] text-white rounded-br-xs'
                        : 'bg-white text-stone-800 border border-stone-200/90 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                    <span className={`text-[9px] block text-right mt-1 ${isUser ? 'text-emerald-200/70' : 'text-stone-400'}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-stone-500 text-xs pl-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F3E2E]" />
                <span className="text-[11px] font-medium">Setu AI is thinking...</span>
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
            className="p-2.5 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'hi' ? 'कुछ पूछें...' : 'Ask something...'}
              className="flex-1 bg-[#F6F3EC] border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#0F3E2E] focus:ring-1 focus:ring-[#0F3E2E]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-[#0F3E2E] text-white flex items-center justify-center hover:bg-[#165640] disabled:opacity-40 disabled:hover:bg-[#0F3E2E] transition-all cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
