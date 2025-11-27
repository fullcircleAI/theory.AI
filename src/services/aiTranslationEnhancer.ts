// AI-Powered Translation Enhancement Service
import { logger } from '../utils/logger';

export interface TranslationEnhancement {
  key: string;
  language: string;
  originalText: string;
  currentTranslation: string;
  enhancedTranslation: string;
  confidence: number;
  improvements: string[];
  context: string;
  suggestedBy: 'ai' | 'user' | 'community';
}

export interface AITranslationConfig {
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3' | 'gemini-pro';
  temperature: number;
  maxTokens: number;
  contextWindow: number;
}

class AITranslationEnhancer {
  private config: AITranslationConfig = {
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 500,
    contextWindow: 2000
  };

  // Enhance translation using AI
  async enhanceTranslation(
    key: string,
    language: string,
    originalText: string,
    currentTranslation: string,
    context?: string
  ): Promise<TranslationEnhancement> {
    try {
      const prompt = this.buildEnhancementPrompt(originalText, currentTranslation, language, context);
      const response = await this.callAI(prompt);
      
      const enhancement: TranslationEnhancement = {
        key,
        language,
        originalText,
        currentTranslation,
        enhancedTranslation: response.enhancedTranslation,
        confidence: response.confidence,
        improvements: response.improvements,
        context: context || '',
        suggestedBy: 'ai'
      };

      return enhancement;
    } catch (error) {
      logger.error('AI translation enhancement failed:', error);
      throw error;
    }
  }

  // Build enhancement prompt
  private buildEnhancementPrompt(
    originalText: string,
    currentTranslation: string,
    targetLanguage: string,
    context?: string
  ): string {
    const languageNames = {
      'en': 'English',
      'nl': 'Dutch',
      'ar': 'Arabic'
    };

    const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || targetLanguage;

    return `You are a professional translator specializing in ${targetLangName}. Please enhance the following translation:

ORIGINAL TEXT (English): "${originalText}"
CURRENT TRANSLATION (${targetLangName}): "${currentTranslation}"
${context ? `CONTEXT: ${context}` : ''}

Please provide:
1. An enhanced translation that is more natural, culturally appropriate, and contextually accurate
2. A confidence score (0-1) for your enhancement
3. A list of specific improvements made
4. Brief explanation of why the enhancement is better

Respond in JSON format:
{
  "enhancedTranslation": "your enhanced translation",
  "confidence": 0.95,
  "improvements": ["improvement 1", "improvement 2"],
  "explanation": "brief explanation"
}`;
  }

  // Call AI service
  private async callAI(prompt: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translation enhancement AI. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }
  }

  // Batch enhance multiple translations
  async batchEnhance(translations: Array<{
    key: string;
    language: string;
    originalText: string;
    currentTranslation: string;
    context?: string;
  }>): Promise<TranslationEnhancement[]> {
    const enhancements: TranslationEnhancement[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < translations.length; i += batchSize) {
      const batch = translations.slice(i, i + batchSize);
      const batchPromises = batch.map(translation => 
        this.enhanceTranslation(
          translation.key,
          translation.language,
          translation.originalText,
          translation.currentTranslation,
          translation.context
        )
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        enhancements.push(...batchResults);
      } catch (error) {
        logger.error(`Batch enhancement failed for batch ${i}-${i + batchSize}:`, error);
        // Continue with next batch
      }
    }
    
    return enhancements;
  }

  // Analyze translation quality
  async analyzeQuality(
    originalText: string,
    translatedText: string,
    targetLanguage: string
  ): Promise<{
    qualityScore: number;
    issues: string[];
    suggestions: string[];
    culturalAppropriateness: number;
  }> {
    const prompt = `Analyze the quality of this translation:

ORIGINAL (English): "${originalText}"
TRANSLATED (${targetLanguage}): "${translatedText}"

Provide analysis in JSON format:
{
  "qualityScore": 0.85,
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "culturalAppropriateness": 0.9
}`;

    try {
      const response = await this.callAI(prompt);
      return response;
    } catch (error) {
      logger.error('Quality analysis failed:', error);
      return {
        qualityScore: 0.5,
        issues: ['Analysis failed'],
        suggestions: ['Manual review needed'],
        culturalAppropriateness: 0.5
      };
    }
  }

  // Generate translation suggestions
  async generateSuggestions(
    key: string,
    originalText: string,
    targetLanguage: string,
    context?: string
  ): Promise<Array<{
    translation: string;
    confidence: number;
    reasoning: string;
  }>> {
    const prompt = `Generate 3 alternative translations for this text:

ORIGINAL: "${originalText}"
TARGET LANGUAGE: ${targetLanguage}
${context ? `CONTEXT: ${context}` : ''}

Provide 3 different translation options with confidence scores and reasoning.

Respond in JSON format:
{
  "suggestions": [
    {
      "translation": "option 1",
      "confidence": 0.9,
      "reasoning": "reason 1"
    },
    {
      "translation": "option 2", 
      "confidence": 0.8,
      "reasoning": "reason 2"
    },
    {
      "translation": "option 3",
      "confidence": 0.7,
      "reasoning": "reason 3"
    }
  ]
}`;

    try {
      const response = await this.callAI(prompt);
      return response.suggestions || [];
    } catch (error) {
      logger.error('Suggestion generation failed:', error);
      return [];
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<AITranslationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): AITranslationConfig {
    return { ...this.config };
  }
}

export const aiTranslationEnhancer = new AITranslationEnhancer();














