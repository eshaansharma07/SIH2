import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import hi from './hi.json';
import pa from './pa.json';
import bn from './bn.json';
import mr from './mr.json';
import ta from './ta.json';
import te from './te.json';
import gu from './gu.json';
import kn from './kn.json';
import ml from './ml.json';
import or from './or.json';
import as from './as.json';
import { safeStorage } from '../utils/safeStorage';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' }
];

const translations = { en, hi, pa, bn, mr, ta, te, gu, kn, ml, or, as };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return safeStorage.getItem('vyapaar_lang', 'en');
  });

  useEffect(() => {
    safeStorage.setItem('vyapaar_lang', language);
  }, [language]);

  const t = (path, fallback = '') => {
    const keys = path.split('.');
    let current = translations[language] || translations.en;
    
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let engVal = translations.en;
        for (const ek of keys) {
          if (engVal && engVal[ek] !== undefined) {
            engVal = engVal[ek];
          } else {
            return fallback || path;
          }
        }
        return engVal;
      }
    }
    return current;
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      toggleLanguage, 
      t, 
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLanguageInfo,
      isHindi: language === 'hi',
      isEnglish: language === 'en'
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
}
