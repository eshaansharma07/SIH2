import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';
import te from './te.json';
import pa from './pa.json';
import gu from './gu.json';

const translations = { en, hi, ta, te, pa, gu };

export const LANGUAGES = [
  { code: 'en', label: 'EN', nativeLabel: 'English' },
  { code: 'hi', label: 'HI', nativeLabel: 'हिंदी' },
  { code: 'ta', label: 'TA', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'TE', nativeLabel: 'తెలుగు' },
  { code: 'pa', label: 'PA', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'gu', label: 'GU', nativeLabel: 'ગુજરાતી' },
];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('vyapaar_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('vyapaar_lang', language);
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
    const codes = LANGUAGES.map(l => l.code);
    const currentIndex = codes.indexOf(language);
    const nextIndex = (currentIndex + 1) % codes.length;
    setLanguage(codes[nextIndex]);
  };

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, currentLang, LANGUAGES }}>
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
