import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speak, stopSpeech, isSpeaking, isSpeechSupported, hasLanguageVoice } from '../utils/speechService';
import { useTranslation } from '../i18n/LanguageContext';

export function AudioReadAloudButton({ 
  textHi, 
  textEn, 
  className = '', 
  size = 'sm' 
}) {
  const { language } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);

  const targetLang = language === 'hi' ? 'hi-IN' : 'en-IN';
  const targetText = language === 'hi' ? textHi : (textEn || textHi);

  useEffect(() => {
    setSupported(isSpeechSupported());
    return () => {
      stopSpeech();
    };
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!supported) return;

    if (playing) {
      stopSpeech();
      setPlaying(false);
      return;
    }

    const ok = speak({
      text: targetText,
      lang: targetLang,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false)
    });

    if (!ok) {
      setPlaying(false);
    }
  };

  if (!supported) {
    return null;
  }

  const hasVoice = hasLanguageVoice(targetLang);

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const buttonPadding = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  if (!hasVoice) {
    return (
      <button
        type="button"
        disabled
        className={`${buttonPadding[size]} rounded-full bg-paper-200 text-paper-400 opacity-60 cursor-not-allowed ${className}`}
        title={language === 'hi' ? 'इस डिवाइस पर हिन्दी आवाज़ उपलब्ध नहीं है' : 'Voice engine unavailable'}
      >
        <VolumeX className={iconSizes[size]} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${buttonPadding[size]} rounded-full transition-all cursor-pointer select-none ${
        playing
          ? 'bg-terracotta-600 text-white shadow-md ring-2 ring-terracotta-300 animate-pulse'
          : 'bg-paper-100 hover:bg-paper-200 text-indigoRural-700 hover:text-indigoRural-950 border border-paper-300'
      } ${className}`}
      title={
        playing
          ? (language === 'hi' ? 'आवाज़ बंद करें (Stop)' : 'Stop reading')
          : (language === 'hi' ? 'साथी बोल: बोलकर सुनें (Listen aloud)' : 'Saathi Bol: Listen aloud')
      }
      aria-label="Saathi Bol Read Aloud"
    >
      {playing ? (
        <VolumeX className={`${iconSizes[size]} text-white`} />
      ) : (
        <Volume2 className={`${iconSizes[size]} text-terracotta-600`} />
      )}
    </button>
  );
}
