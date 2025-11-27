import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { strings } from '../i18n/strings';
import type { Language, LanguageStrings } from '../types_i18n';
import { translationMetrics } from '../services/translationMetrics';

interface LanguageContextType {
  currentLanguage: Language | null;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  t_nested: (path: string) => string;
  getVoiceCommands: () => { [key: string]: number };
  getSpeechLang: () => string;
  getSpeechVoice: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);

  // Get nested object value by path (e.g., "dashboard.welcomeMessage")
  const getNestedValue = useCallback((obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  }, []);

  // Enhanced translation function with quality tracking (memoized)
  const t = useCallback((key: string): string => {
    if (!currentLanguage) {
      return key; // Return the key if no language is set
    }
    const langStrings = strings[currentLanguage];
    const value = langStrings[key as keyof LanguageStrings];
    const translatedText = typeof value === 'string' ? value : key;
    
    // Track translation usage for analytics
    if (currentLanguage && translatedText !== key) {
      translationMetrics.trackTranslation(
        key,
        currentLanguage,
        key, // original text (key)
        translatedText
      );
    }
    
    return translatedText;
  }, [currentLanguage]);

  // Nested translation function (memoized)
  const t_nested = useCallback((path: string): string => {
    if (!currentLanguage) {
      return path; // Return the path if no language is set
    }
    const langStrings = strings[currentLanguage];
    return getNestedValue(langStrings, path) || path;
  }, [currentLanguage, getNestedValue]);

  // Get voice commands for speech recognition (memoized)
  const getVoiceCommands = useCallback(() => {
    if (!currentLanguage) {
      return {}; // Return empty object if no language is set
    }
    const commands = strings[currentLanguage].voiceCommands;
    return {
      [commands.optionA]: 0,
      [commands.optionB]: 1,
      [commands.optionC]: 2,
      [commands.optionD]: 3,
      [commands.first]: 0,
      [commands.second]: 1,
      [commands.third]: 2,
      [commands.fourth]: 3,
      [commands.one]: 0,
      [commands.two]: 1,
      [commands.three]: 2,
      [commands.four]: 3,
    };
  }, [currentLanguage]);

  // Get speech language code (memoized)
  const getSpeechLang = useCallback((): string => {
    switch (currentLanguage) {
      case 'nl':
        return 'nl-NL';
      case 'ar':
        return 'ar-SA';
      default:
        return 'en-US';
    }
  }, [currentLanguage]);

  // Get preferred speech voice (memoized)
  const getSpeechVoice = useCallback((): string => {
    const voices = window.speechSynthesis.getVoices();
    const langCode = getSpeechLang();
    
    // Try to find a native female voice for the language
    const nativeFemaleVoice = voices.find(voice => {
      const isCorrectLanguage = voice.lang.startsWith(langCode);
      const isFemale = voice.name.toLowerCase().includes('female') || 
                      voice.name.toLowerCase().includes('samantha') || // Common English female voice
                      voice.name.toLowerCase().includes('claire') ||   // Common English female voice
                      voice.name.toLowerCase().includes('xander') ||   // Common Dutch female voice
                      voice.name.toLowerCase().includes('anna') ||     // Common Dutch female voice
                      voice.name.toLowerCase().includes('sarah') ||    // Common English female voice
                      voice.name.toLowerCase().includes('lisa') ||     // Common English female voice
                      voice.name.toLowerCase().includes('nora') ||     // Common Dutch female voice
                      voice.name.toLowerCase().includes('ellen');      // Common Dutch female voice
      
      return isCorrectLanguage && isFemale;
    });
    
    if (nativeFemaleVoice) return nativeFemaleVoice.name;
    
    // Fallback to any female voice in the language
    const fallbackFemaleVoice = voices.find(voice => {
      const isCorrectLanguage = voice.lang.startsWith(langCode);
      const isFemale = voice.name.toLowerCase().includes('female') || 
                      voice.name.toLowerCase().includes('samantha') ||
                      voice.name.toLowerCase().includes('claire') ||
                      voice.name.toLowerCase().includes('xander') ||
                      voice.name.toLowerCase().includes('anna') ||
                      voice.name.toLowerCase().includes('sarah') ||
                      voice.name.toLowerCase().includes('lisa') ||
                      voice.name.toLowerCase().includes('nora') ||
                      voice.name.toLowerCase().includes('ellen');
      
      return isCorrectLanguage && isFemale;
    });
    
    if (fallbackFemaleVoice) return fallbackFemaleVoice.name;
    
    // Fallback to any voice in the language
    const fallbackVoice = voices.find(voice => 
      voice.lang.startsWith(langCode)
    );
    
    if (fallbackVoice) return fallbackVoice.name;
    
    // Final fallback to default
    return '';
  }, [getSpeechLang]);

  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    // Store in localStorage for persistence
    localStorage.setItem('preferredLanguage', language);
  }, []);

  // Load saved language preference on mount (only once)
  // Use requestAnimationFrame to prevent flickering on initial load
  useEffect(() => {
    requestAnimationFrame(() => {
      const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'nl' || savedLanguage === 'ar')) {
        setCurrentLanguage(savedLanguage);
      }
      // Don't set a default language - let the user choose
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: LanguageContextType = useMemo(() => ({
    currentLanguage,
    setLanguage,
    t,
    t_nested,
    getVoiceCommands,
    getSpeechLang,
    getSpeechVoice,
  }), [currentLanguage, setLanguage, t, t_nested, getVoiceCommands, getSpeechLang, getSpeechVoice]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 