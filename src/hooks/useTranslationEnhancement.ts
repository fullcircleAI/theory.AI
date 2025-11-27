import { useState, useEffect, useCallback } from 'react';
import { translationAPI, TranslationResult } from '../services/translationAPI';
import { translationMetrics } from '../services/translationMetrics';
import { translationFeedback } from '../services/translationFeedback';
import { aiTranslationEnhancer } from '../services/aiTranslationEnhancer';
import { logger } from '../utils/logger';

export interface TranslationEnhancementHook {
  // Translation functions
  translate: (text: string, targetLang: string, sourceLang?: string) => Promise<TranslationResult>;
  enhanceTranslation: (key: string, language: string) => Promise<void>;
  
  // Feedback functions
  submitFeedback: (key: string, language: string, rating: number, comment: string) => void;
  voteOnFeedback: (feedbackId: string, vote: 'up' | 'down') => void;
  
  // Analytics
  getMetrics: () => any;
  getQualityRecommendations: () => any[];
  
  // State
  isLoading: boolean;
  error: string | null;
  lastTranslation: TranslationResult | null;
}

export const useTranslationEnhancement = (): TranslationEnhancementHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranslation, setLastTranslation] = useState<TranslationResult | null>(null);

  // Translate text with quality tracking
  const translate = useCallback(async (
    text: string, 
    targetLang: string, 
    sourceLang = 'en'
  ): Promise<TranslationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await translationAPI.translate(text, targetLang, sourceLang);
      
      // Track translation usage
      translationMetrics.trackTranslation(
        'dynamic_translation',
        targetLang,
        text,
        result.text
      );
      
      setLastTranslation(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhance existing translation
  const enhanceTranslation = useCallback(async (key: string, language: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const quality = translationMetrics.getTranslationQuality(key, language);
      if (quality) {
        const enhancement = await aiTranslationEnhancer.enhanceTranslation(
          key,
          language,
          quality.originalText,
          quality.translatedText
        );
        
        logger.debug('Translation enhanced:', enhancement);
        // Here you would update the actual translation in your strings.ts file
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Enhancement failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Submit user feedback
  const submitFeedback = useCallback((
    key: string,
    language: string,
    rating: number,
    comment: string
  ) => {
    try {
      translationFeedback.submitFeedback(
        key,
        language,
        '', // originalText
        '', // currentTranslation
        '', // suggestedTranslation
        rating,
        comment
      );
    } catch (err) {
      logger.error('Failed to submit feedback:', err);
    }
  }, []);

  // Vote on feedback
  const voteOnFeedback = useCallback((feedbackId: string, vote: 'up' | 'down') => {
    try {
      translationFeedback.voteOnFeedback(feedbackId, vote);
    } catch (err) {
      logger.error('Failed to vote on feedback:', err);
    }
  }, []);

  // Get metrics
  const getMetrics = useCallback(() => {
    return translationMetrics.getAnalytics();
  }, []);

  // Get quality recommendations
  const getQualityRecommendations = useCallback(() => {
    return translationMetrics.getQualityRecommendations();
  }, []);

  return {
    translate,
    enhanceTranslation,
    submitFeedback,
    voteOnFeedback,
    getMetrics,
    getQualityRecommendations,
    isLoading,
    error,
    lastTranslation
  };
};














