// Audio Service - Multilingual TTS Support
// Clean, simple audio service for questions, answers, and explanations

import { logger } from '../utils/logger';

type Language = 'en' | 'nl' | 'ar';

class AudioService {
  private synth = window.speechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled = true;
  private volume = 0.9;
  private rate = 0.85;
  private voicesLoaded = false;

  constructor() {
    // Ensure voices are loaded before use
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Some browsers load voices asynchronously
      if (this.synth.getVoices().length > 0) {
        this.voicesLoaded = true;
      } else {
        // Wait for voices to load
        this.synth.onvoiceschanged = () => {
          this.voicesLoaded = true;
        };
      }
    }
  }

  speak(text: string, language: Language): void {
    if (!this.isEnabled) return;
    
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.getLangCode(language);
    
    // Get voice (will wait for voices if needed)
    const voice = this.getVoice(language);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = this.rate;
    utterance.pitch = 1.0;
    utterance.volume = this.volume;

    utterance.onerror = (e) => {
      logger.error('Audio error:', e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop(): void {
    this.synth.cancel();
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2, rate));
  }

  private getLangCode(lang: Language): string {
    const codes: Record<Language, string> = {
      en: 'en-GB',
      nl: 'nl-NL',
      ar: 'ar-SA'
    };
    return codes[lang] || 'en-GB';
  }

  private getVoice(lang: Language): SpeechSynthesisVoice | null {
    // Ensure voices are loaded - wait if needed
    let voices = this.synth.getVoices();
    if (voices.length === 0) {
      // Wait a bit for voices to load (some browsers load asynchronously)
      voices = this.synth.getVoices();
      if (voices.length === 0) {
        // Still no voices, return null and let browser use default
        return null;
      }
    }
    
    const langCode = this.getLangCode(lang);
    const langPrefix = langCode.split('-')[0]; // 'en', 'nl', 'ar'
    
    // Comprehensive list of female voice names by language
    const femaleVoiceNames: Record<Language, string[]> = {
      en: [
        'samantha', 'sarah', 'claire', 'lisa', 'karen', 'victoria', 
        'susan', 'kate', 'samantha premium', 'siri', 'zira',
        'female', 'woman', 'woman voice', 'alexandra', 'sophia'
      ],
      nl: [
        'anna', 'nora', 'ellen', 'sophie', 'emma', 'mariska', 'xander',
        'female', 'vrouw', 'vrouwenstem', 'nederlandse', 'dutch female',
        'tessa', 'fiona', 'moira'
      ],
      ar: [
        'mageda', 'salma', 'hala', 'zeina', 'laila', 'nawal', 'mariam',
        'female', 'أنثى', 'صوت أنثوي', 'arabic female', 'arabic woman',
        'amira', 'fatima', 'layla', 'noor'
      ]
    };

    // Priority 1: Exact language match + female voice name
    let voice = voices.find(v => {
      const isExactLang = v.lang === langCode || v.lang.startsWith(langPrefix);
      const nameLower = v.name.toLowerCase();
      const isFemale = femaleVoiceNames[lang].some(femaleName => 
        nameLower.includes(femaleName.toLowerCase())
      ) || nameLower.includes('female') || nameLower.includes('woman') || nameLower.includes('vrouw');
      
      const hasFemaleGender = (v as any).gender === 'female';
      
      return isExactLang && (isFemale || hasFemaleGender);
    });

    // Priority 2: Language match + any female indicator
    if (!voice) {
      voice = voices.find(v => {
        const isLang = v.lang.startsWith(langPrefix);
        const nameLower = v.name.toLowerCase();
        return isLang && (
          nameLower.includes('female') || 
          nameLower.includes('woman') ||
          nameLower.includes('vrouw') ||
          nameLower.includes('أنثى') ||
          femaleVoiceNames[lang].some(femaleName => nameLower.includes(femaleName.toLowerCase()))
        );
      });
    }

    // Priority 3: Exact language match (any gender - prefer native)
    if (!voice) {
      voice = voices.find(v => v.lang === langCode || v.lang.startsWith(langPrefix + '-'));
    }

    // Priority 4: Any voice in language family
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(langPrefix));
    }

    // Priority 5: For Arabic/Dutch, if still no voice, try to find any voice with correct locale
    if (!voice && (lang === 'ar' || lang === 'nl')) {
      // Try alternative locale codes
      const altCodes = lang === 'ar' ? ['ar-EG', 'ar-AE', 'ar'] : ['nl-BE', 'nl'];
      for (const code of altCodes) {
        voice = voices.find(v => v.lang.startsWith(code));
        if (voice) break;
      }
    }

    return voice || null;
  }
}

export const audioService = new AudioService();

