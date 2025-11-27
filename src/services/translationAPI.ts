// Translation API Service with multiple providers
import { logger } from '../utils/logger';

export interface TranslationProvider {
  name: string;
  translate: (text: string, targetLang: string, sourceLang?: string) => Promise<string>;
  cost: number; // per character
  quality: number; // 1-10
}

export interface TranslationResult {
  text: string;
  provider: string;
  confidence: number;
  cost: number;
  quality: number;
}

export interface TranslationMetrics {
  totalTranslations: number;
  averageQuality: number;
  totalCost: number;
  userSatisfaction: number;
}

class TranslationAPIService {
  private providers: TranslationProvider[] = [];
  private metrics: TranslationMetrics = {
    totalTranslations: 0,
    averageQuality: 0,
    totalCost: 0,
    userSatisfaction: 0
  };

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Google Translate API
    this.providers.push({
      name: 'google',
      translate: this.googleTranslate,
      cost: 0.00002, // $20 per 1M characters
      quality: 9
    });

    // LibreTranslate (Free)
    this.providers.push({
      name: 'libretranslate',
      translate: this.libreTranslate,
      cost: 0,
      quality: 7
    });

    // DeepL API
    this.providers.push({
      name: 'deepl',
      translate: this.deepLTranslate,
      cost: 0.000025, // $25 per 1M characters
      quality: 10
    });

    // MyMemory API (Free tier)
    this.providers.push({
      name: 'mymemory',
      translate: this.myMemoryTranslate,
      cost: 0,
      quality: 6
    });
  }

  // Google Translate API
  private async googleTranslate(text: string, targetLang: string, sourceLang = 'en'): Promise<string> {
    try {
      const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GOOGLE_API_KEY}`
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          source: sourceLang,
          format: 'text'
        })
      });

      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      logger.error('Google Translate error:', error);
      throw error;
    }
  }

  // LibreTranslate (Free, Open Source)
  private async libreTranslate(text: string, targetLang: string, sourceLang = 'en'): Promise<string> {
    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      });

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      logger.error('LibreTranslate error:', error);
      throw error;
    }
  }

  // DeepL API
  private async deepLTranslate(text: string, targetLang: string, sourceLang = 'en'): Promise<string> {
    try {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `DeepL-Auth-Key ${process.env.REACT_APP_DEEPL_API_KEY}`
        },
        body: new URLSearchParams({
          text: text,
          target_lang: targetLang.toUpperCase(),
          source_lang: sourceLang.toUpperCase()
        })
      });

      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      logger.error('DeepL error:', error);
      throw error;
    }
  }

  // MyMemory API (Free tier: 1000 requests/day)
  private async myMemoryTranslate(text: string, targetLang: string, sourceLang = 'en'): Promise<string> {
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        return data.responseData.translatedText;
      } else {
        throw new Error('MyMemory translation failed');
      }
    } catch (error) {
      logger.error('MyMemory error:', error);
      throw error;
    }
  }

  // Smart translation with provider selection
  async translate(text: string, targetLang: string, sourceLang = 'en'): Promise<TranslationResult> {
    // Select best provider based on text length, cost, and quality
    const provider = this.selectBestProvider(text.length);
    
    try {
      const translatedText = await provider.translate(text, targetLang, sourceLang);
      
      // Update metrics
      this.updateMetrics(provider, text.length);
      
      return {
        text: translatedText,
        provider: provider.name,
        confidence: this.calculateConfidence(translatedText, text),
        cost: text.length * provider.cost,
        quality: provider.quality
      };
    } catch (error) {
      // Fallback to free provider
      const fallbackProvider = this.providers.find(p => p.cost === 0);
      if (fallbackProvider) {
        const translatedText = await fallbackProvider.translate(text, targetLang, sourceLang);
        return {
          text: translatedText,
          provider: fallbackProvider.name,
          confidence: 0.5,
          cost: 0,
          quality: fallbackProvider.quality
        };
      }
      throw error;
    }
  }

  private selectBestProvider(textLength: number): TranslationProvider {
    // For short texts, use high-quality providers
    if (textLength < 100) {
      return this.providers.find(p => p.quality >= 9) || this.providers[0];
    }
    
    // For long texts, consider cost
    return this.providers.reduce((best, current) => {
      const bestScore = best.quality / (best.cost * textLength + 1);
      const currentScore = current.quality / (current.cost * textLength + 1);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateConfidence(translated: string, original: string): number {
    // Simple confidence calculation based on length ratio and word overlap
    const lengthRatio = Math.min(translated.length / original.length, original.length / translated.length);
    const wordOverlap = this.calculateWordOverlap(original, translated);
    return (lengthRatio + wordOverlap) / 2;
  }

  private calculateWordOverlap(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  private updateMetrics(provider: TranslationProvider, textLength: number): void {
    this.metrics.totalTranslations++;
    this.metrics.totalCost += textLength * provider.cost;
    this.metrics.averageQuality = (this.metrics.averageQuality + provider.quality) / 2;
  }

  // Get translation metrics
  getMetrics(): TranslationMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      totalTranslations: 0,
      averageQuality: 0,
      totalCost: 0,
      userSatisfaction: 0
    };
  }
}

export const translationAPI = new TranslationAPIService();














