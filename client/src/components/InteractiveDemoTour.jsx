import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Landmark,
  FileText,
  Store,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import { SaathiAvatar } from './SaathiAvatar';
import { WarliBorder } from './WarliMotif';
import { useTranslation } from '../i18n/LanguageContext';

export function InteractiveDemoTour({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  setKeypadOpen, 
  setInitialAdvisorPrompt,
  onReloadDemo
}) {
  const { language } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const STEP_DURATION = 9000; // 9 seconds per step

  const demoSteps = [
    {
      id: 'persona',
      tab: 'dashboard',
      badge: 'Step 1 / 7 • Rural Persona',
      titleEn: "Meet Ramesh Kumar: Village Kirana Store",
      titleHi: "मिलिए रमेश कुमार जी से: ग्रामीण किराना स्टोर",
      narrationEn: "Ramesh operates a Kirana store in Utraula Dehat village, Balrampur, UP. Despite 4 years of solid business, traditional banks reject him because he has zero CIBIL credit history.",
      narrationHi: "रमेश जी उत्तर प्रदेश के बलरामपुर जिले के उतरौला देहात में 4 साल से किराना दुकान चला रहे हैं। ठोस व्यापार के बावजूद, सिबिल स्कोर न होने से बैंक इन्हें लोन देने से मना कर देते हैं।",
      highlightTextEn: "Enterprise: Ramesh's Kirana Store • Vintage: 48 Months • Village: Utraula Dehat, Balrampur (UP)",
      highlightTextHi: "दुकान: रमेश किराना स्टोर • आयु: 48 महीने • गाँव: उतरौला देहात, बलरामपुर (उत्तर प्रदेश)",
      icon: Store,
      color: "from-terracotta-600 to-amber-600",
      action: () => {
        setActiveTab('dashboard');
      }
    },
    {
      id: 'cashflow',
      tab: 'cashflow',
      badge: 'Step 2 / 7 • Seasonal Reality',
      titleEn: "4-Month Real Rural Cash Flow & Monsoon Dip",
      titleHi: "4 महीने का वास्तविक ग्रामीण नकदी प्रवाह एवं मानसून गिरावट",
      narrationEn: "Notice the seasonal pattern: steady baseline in May/June, a sharp 32% dip during July monsoons due to muddy lanes, followed by an 88% surge in September ahead of Navratri and Diwali.",
      narrationHi: "ग्रामीण अर्थव्यवस्था का मौसमी चक्र देखें: मई-जून की स्थिर बिक्री, जुलाई के भारी मानसून में -32% की गिरावट और सितंबर में त्योहारों के कारण +88% का ऐतिहासिक उछाल।",
      highlightTextEn: "Monsoon Dip (-32% in July) ➔ Pre-Diwali Surge (+88% in September verified across 120 days)",
      highlightTextHi: "जुलाई में मानसूनी गिरावट (-32%) ➔ सितंबर में प्री-दिवाली उछाल (+88% सत्यापित 120 दिन का डेटा)",
      icon: BookOpen,
      color: "from-amber-600 to-emerald-600",
      action: () => {
        setActiveTab('cashflow');
      }
    },
    {
      id: 'keypad',
      tab: 'dashboard',
      badge: 'Step 3 / 7 • Low-Literacy Inclusion',
      titleEn: "Tactile Touch Logger (Bahi-Khata Dialer)",
      titleHi: "कम पढ़े-लिखे व्यापारियों के लिए स्पर्श आधारित बही-खाता",
      narrationEn: "Vyapaar Saathi replaces complex accounting software with a tactile numeric keypad, big buttons, and 1-tap quick presets (+₹100, +₹500). Shopkeepers record daily sales in 15 seconds.",
      narrationHi: "जटिल एकाउंटिंग सॉफ्टवेयर की जगह बड़े टच बटनों और +₹100, +₹500 वाले त्वरित बटनों से युक्त डायलर, जिससे ग्रामीण दुकानदार 15 सेकंड में रोज़ की बिक्री दर्ज कर लेते हैं।",
      highlightTextEn: "Interactive Tactile Pad • Cash / UPI Switch • Live Bahi-Khata Database Logging",
      highlightTextHi: "बड़े अंकों वाला टच पैड • नकद/यूपीआई चुनाव • रियल-टाइम डेटाबेस में सुरक्षित प्रविष्टि",
      icon: CheckCircle2,
      color: "from-emerald-600 to-indigo-600",
      action: () => {
        setActiveTab('dashboard');
        setTimeout(() => setKeypadOpen(true), 400);
        setTimeout(() => setKeypadOpen(false), 5500);
      }
    },
    {
      id: 'credit',
      tab: 'credit',
      badge: 'Step 4 / 7 • Alternative Credit Engine',
      titleEn: "Explainable Credit Score (785 / 850 Prime Bankable)",
      titleHi: "पारदर्शी वैकल्पिक क्रेडिट स्कोर (785 / 850 प्राइम बैंकेबल)",
      narrationEn: "No formal CIBIL required. The 4-pillar scoring engine analyzes: Daily Ledger Logging (96%), Revenue Stability (92%), Udhaar Recovery Rate (87%), and UPI Digital Footprint (37%).",
      narrationHi: "पारंपरिक सिबिल की कोई जरूरत नहीं। 4 पारदर्शी स्तंभ: दैनिक बही-खाता नियमितता (96%), बिक्री स्थिरता (92%), उधार अनुशासन (87%), और यूपीआई डिजिटल शेयर (37%)।",
      highlightTextEn: "Score: 785 / 850 (Prime Bankable) • +15 Points Simulator Boost with Udhaar Recovery",
      highlightTextHi: "स्कोर: 785 / 850 (अति उत्कृष्ट) • उधार वसूली से +15 अंक का तुरंत लाइव सिम्युलेटर उछाल",
      icon: TrendingUp,
      color: "from-indigo-600 to-forestRural-600",
      action: () => {
        setActiveTab('credit');
      }
    },
    {
      id: 'schemes',
      tab: 'schemes',
      badge: 'Step 5 / 7 • Financial Structuring',
      titleEn: "10 Authentic GOI Schemes Auto-Matched",
      titleHi: "10 वास्तविक सरकारी योजनाओं का स्वचालित मिलान",
      narrationEn: "Vyapaar Saathi auto-matches Ramesh with government schemes. Ramesh is 98% matched with PM MUDRA Shishu and Kishor (₹50,000 to ₹5,00,000 with 0% collateral) and UP ODOP.",
      narrationHi: "व्यापार साथी रमेश जी के लिए 10 वास्तविक सरकारी योजनाओं का मिलान करता है। पीएम मुद्रा शिशु और किशोर योजना (0% बंधक पर ₹50,000 से ₹5 लाख) में 98% पात्रता।",
      highlightTextEn: "Top Match: PM MUDRA Shishu & Kishor (Zero Collateral) • UP ODOP (93% Match)",
      highlightTextHi: "शीर्ष मिलान: पीएम मुद्रा योजना (बिना किसी गारंटी के) • यूपी ओडीओपी मार्जिन मनी (93% मैच)",
      icon: Landmark,
      color: "from-forestRural-600 to-terracotta-600",
      action: () => {
        setActiveTab('schemes');
      }
    },
    {
      id: 'advisor',
      tab: 'advisor',
      badge: 'Step 6 / 7 • Grounded AI Advisory',
      titleEn: "Google Gemini 2.5 Flash Grounded Advisor",
      titleHi: "गूगल जेमिनी 2.5 फ्लैश आधारित स्थानीय व्यापार सलाहकार",
      narrationEn: "No generic AI fluff. Every response is strictly grounded in Ramesh's 48-month vintage, Balrampur wholesale mandi trends, and his last 30-day sales (₹84,055 with 50.8% growth).",
      narrationHi: "कोई बनावटी या सामान्य सलाह नहीं। हर जवाब रमेश जी के 48 महीने के अनुभव, बलरामपुर गल्ला मंडी के भाव और पिछले 30 दिनों की ₹84,055 की बिक्री पर 100% आधारित है।",
      highlightTextEn: "Live Google Gemini 2.5 Flash • Balrampur Mandi Prices • Bulletproof Safety Net Fallback",
      highlightTextHi: "लाइव गूगल जेमिनी 2.5 फ्लैश • बलरामपुर गल्ला मंडी अग्रिम बुकिंग • 6 सुरक्षित ऑफलाइन परिदृश्य",
      icon: Sparkles,
      color: "from-terracotta-600 to-amber-600",
      action: () => {
        setActiveTab('advisor');
        setInitialAdvisorPrompt(language === 'hi' ? "दिवाली के लिए कितना स्टॉक लूँ?" : "How much stock for Diwali?");
      }
    },
    {
      id: 'dossier',
      tab: 'dossier',
      badge: 'Step 7 / 7 • Bank Ready Dossier',
      titleEn: "1-Click Bank Credit Dossier for Aryavart Bank",
      titleHi: "आर्यावर्त ग्रामीण बैंक हेतु 1-क्लिक बैंक डॉसियर प्रमाण-पत्र",
      narrationEn: "Vyapaar Saathi generates a verified Priority Sector Lending (PSL) statement with QR verification, audited cash flow figures, and official stamps that village branch managers accept on the spot.",
      narrationHi: "व्यापार साथी प्राथमिकता प्राप्त क्षेत्र ऋण (PSL) हेतु एक सत्यापित वित्तीय प्रमाण-पत्र बनाता है, जिसे आर्यावर्त ग्रामीण बैंक प्रबंधक बिना सीए ऑडिट के तुरंत स्वीकार कर लेते हैं।",
      highlightTextEn: "Printable Verified Dossier • QR Verification • 0% CA Audit Required for PSL Loans",
      highlightTextHi: "प्रिंट करने योग्य मुहरबंद पत्रक • क्यूआर कोड सत्यापन • बिना किसी सीए ऑडिट के तुरंत लोन स्वीकृति",
      icon: FileText,
      color: "from-emerald-700 to-terracotta-700",
      action: () => {
        setActiveTab('dossier');
      }
    }
  ];

  const currentStepData = demoSteps[currentStep];

  // Execute step action on change
  useEffect(() => {
    if (isOpen && currentStepData) {
      currentStepData.action();
      speakNarration(language === 'hi' ? currentStepData.narrationHi : currentStepData.narrationEn);
    }
  }, [currentStep, isOpen]);

  // Handle Speech Synthesis
  const speakNarration = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      clearInterval(timerRef.current);
      clearInterval(progressTimerRef.current);
      return;
    }

    setProgress(0);
    const intervalMs = 100;
    const increment = 100 / (STEP_DURATION / intervalMs);

    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 100;
        }
        return prev + increment;
      });
    }, intervalMs);

    timerRef.current = setTimeout(() => {
      if (currentStep < demoSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsPlaying(false); // Finished tour
      }
    }, STEP_DURATION);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [currentStep, isPlaying, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleSpeech = () => {
    const newState = !speechEnabled;
    setSpeechEnabled(newState);
    if (!newState && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    } else if (newState) {
      speakNarration(language === 'hi' ? currentStepData.narrationHi : currentStepData.narrationEn);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 px-3 max-w-4xl mx-auto animate-slideUp">
      <div className="bg-stone-900/95 text-white backdrop-blur-md rounded-3xl border-2 border-ochre-400 shadow-2xl p-4 sm:p-5 relative overflow-hidden ring-4 ring-terracotta-500/30">
        
        {/* Animated Background Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-terracotta-900/40 via-ochre-900/20 to-stone-900/60 pointer-events-none" />

        {/* Progress Bar Top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-stone-800">
          <div 
            className="h-full bg-gradient-to-r from-ochre-400 to-terracotta-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header Strip */}
        <div className="relative z-10 flex items-center justify-between gap-3 pb-2 border-b border-stone-700/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ochre-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-ochre-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-ochre-400 bg-ochre-950/80 px-2.5 py-0.5 rounded-full border border-ochre-500/40">
              {currentStepData.badge}
            </span>
            <span className="hidden sm:inline text-xs text-stone-400">
              | SIH 2024 Problem Statement 26091
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Speech Toggle */}
            <button
              onClick={toggleSpeech}
              title={speechEnabled ? "Mute Voice Narration" : "Enable AI Voice Narration"}
              className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition ${
                speechEnabled 
                  ? 'bg-ochre-500 text-stone-950 border-ochre-300 shadow-sm' 
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-white'
              }`}
            >
              {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">{speechEnabled ? 'Voice ON' : 'Voice'}</span>
            </button>

            {/* Exit Demo Button */}
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                onClose();
              }}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-stone-300 hover:text-white transition border border-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Content & Dynamic Narration */}
        <div className="relative z-10 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2.5 rounded-2xl bg-gradient-to-br from-terracotta-600 to-ochre-600 shadow-md">
              <currentStepData.icon className="w-5 h-5 text-white" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>{language === 'hi' ? currentStepData.titleHi : currentStepData.titleEn}</span>
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
                {language === 'hi' ? currentStepData.narrationHi : currentStepData.narrationEn}
              </p>
              <div className="pt-1">
                <span className="inline-block text-[11px] font-semibold text-ochre-300 bg-ochre-950/60 px-2 py-0.5 rounded-md border border-ochre-600/30">
                  ⚡ {language === 'hi' ? currentStepData.highlightTextHi : currentStepData.highlightTextEn}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-10 pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
          
          {/* Step Selector Dots */}
          <div className="flex items-center gap-1.5">
            {demoSteps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-6 bg-ochre-400' 
                    : idx < currentStep 
                    ? 'w-2 bg-stone-500' 
                    : 'w-2 bg-stone-800'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            
            {/* Prev */}
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`p-2 rounded-xl border text-xs font-bold transition ${
                currentStep === 0 
                  ? 'bg-stone-800 text-stone-600 border-stone-800 cursor-not-allowed' 
                  : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 bg-ochre-500 hover:bg-ochre-400 text-stone-950 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 bg-terracotta-600 hover:bg-terracotta-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 border border-terracotta-400 shadow-md active:scale-95 transition"
            >
              <span>{currentStep === demoSteps.length - 1 ? 'Restart' : 'Next'}</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
