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
import { DEMO_TOUR_TRANSLATIONS, LANG_VOICE_MAP } from '../data/demoTourTranslations';
import { speak, stopSpeech } from '../utils/speechService';

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
      icon: Store,
      color: "from-terracotta-600 to-amber-600",
      action: () => {
        setActiveTab('dashboard');
      }
    },
    {
      id: 'cashflow',
      tab: 'cashflow',
      icon: BookOpen,
      color: "from-amber-600 to-emerald-600",
      action: () => {
        setActiveTab('cashflow');
      }
    },
    {
      id: 'keypad',
      tab: 'dashboard',
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
      icon: TrendingUp,
      color: "from-indigo-600 to-emerald-600",
      action: () => {
        setActiveTab('credit');
      }
    },
    {
      id: 'schemes',
      tab: 'schemes',
      icon: Landmark,
      color: "from-emerald-600 to-terracotta-600",
      action: () => {
        setActiveTab('schemes');
      }
    },
    {
      id: 'advisor',
      tab: 'advisor',
      icon: Sparkles,
      color: "from-terracotta-600 to-amber-600",
      action: () => {
        setActiveTab('advisor');
        const promptText = language === 'hi' 
          ? "दिवाली के लिए कितना स्टॉक लूँ?" 
          : language === 'pa'
          ? "ਕੀ ਮੈਨੂੰ ਦੀਵਾਲੀ ਲਈ ਸਟਾਕ ਵਧਾਉਣਾ ਚਾਹੀਦਾ ਹੈ?"
          : language === 'bn'
          ? "উৎসবের জন্য কতটা স্টক বাড়াবো?"
          : language === 'ta'
          ? "தீபாவளிக்கு எவ்வளவு சரக்கு எடுக்க வேண்டும்?"
          : "How much stock should I plan for the upcoming festival?";
        setInitialAdvisorPrompt(promptText);
      }
    },
    {
      id: 'dossier',
      tab: 'dossier',
      icon: FileText,
      color: "from-emerald-700 to-terracotta-700",
      action: () => {
        setActiveTab('dossier');
      }
    }
  ];

  const currentStepData = demoSteps[currentStep];

  const getStepText = (stepId, field) => {
    const tData = DEMO_TOUR_TRANSLATIONS[stepId];
    if (!tData || !tData[field]) return '';
    return tData[field][language] || tData[field].en || tData[field].hi || '';
  };

  // Handle Speech Synthesis in active language
  const speakNarration = (text) => {
    if (!speechEnabled) return;
    const targetLang = LANG_VOICE_MAP[language] || 'en-IN';
    speak({
      text,
      lang: targetLang,
      onError: (err) => console.warn('[InteractiveDemoTour] Speech fallback:', err)
    });
  };

  // Execute step action on change and speak in current language
  useEffect(() => {
    if (isOpen && currentStepData) {
      currentStepData.action();
      const currentNarration = getStepText(currentStepData.id, 'narration');
      speakNarration(currentNarration);
    }
  }, [currentStep, isOpen, language]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

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
    if (!newState) {
      stopSpeech();
    } else {
      speakNarration(getStepText(currentStepData.id, 'narration'));
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 max-w-4xl mx-auto animate-slideUp">
      <div className="bg-stone-950/95 text-paper backdrop-blur-2xl rounded-3xl border border-amber-400/30 shadow-2xl p-4 sm:p-5 relative overflow-hidden ring-1 ring-amber-400/20">
        
        {/* Animated Background Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/95 pointer-events-none" />

        {/* Progress Bar Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-950/60">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header Strip */}
        <div className="relative z-10 flex items-center justify-between gap-3 pb-2.5 border-b border-amber-400/20">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-tight text-amber-200 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              {getStepText(currentStepData.id, 'badge')}
            </span>
            <span className="hidden sm:inline text-xs text-stone-200/60 font-medium">
              | Live Guided Tour
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Speech Toggle */}
            <button
              onClick={toggleSpeech}
              title={speechEnabled ? "Mute Voice Narration" : "Enable AI Voice Narration"}
              className={`p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                speechEnabled 
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm' 
                  : 'bg-white/10 text-stone-200 border-white/15 hover:bg-white/20'
              }`}
            >
              {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">{speechEnabled ? 'Voice ON' : 'Voice'}</span>
            </button>

            {/* Exit Demo Button */}
            <button
              onClick={() => {
                stopSpeech();
                onClose();
              }}
              className="p-1.5 bg-paper/10 hover:bg-paper/20 rounded-xl text-stone-200 hover:text-paper transition border border-paper/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Content & Dynamic Narration */}
        <div className="relative z-10 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-white/10 border border-amber-400/20 flex items-center justify-center text-amber-300 shadow-xs">
              <currentStepData.icon className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight font-serif">
                <span>{getStepText(currentStepData.id, 'title')}</span>
              </h3>
              <p className="text-xs text-stone-200/80 leading-relaxed max-w-2xl font-normal font-sans">
                {getStepText(currentStepData.id, 'narration')}
              </p>
              <div className="pt-1">
                <span className="inline-block text-[11px] font-semibold text-amber-200 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {getStepText(currentStepData.id, 'highlight')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-10 pt-2.5 border-t border-amber-400/20 flex items-center justify-between gap-2">
          
          {/* Step Selector Dots */}
          <div className="flex items-center gap-1.5">
            {demoSteps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-6 bg-amber-500' 
                    : idx < currentStep 
                    ? 'w-1.5 bg-amber-400/50' 
                    : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-stone-200 transition border border-white/15 cursor-pointer"
              title={isPlaying ? "Pause Tour" : "Play Tour"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="p-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl text-stone-200 transition border border-white/15 cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <span>{currentStep === demoSteps.length - 1 ? 'Restart Tour' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
