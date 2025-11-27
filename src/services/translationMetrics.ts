// Translation Quality Metrics and Analytics
import { logger } from '../utils/logger';

export interface TranslationQuality {
  key: string;
  language: string;
  originalText: string;
  translatedText: string;
  qualityScore: number;
  userRating?: number;
  usageCount: number;
  lastUsed: Date;
  issues: string[];
}

export interface TranslationAnalytics {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  qualityDistribution: {
    excellent: number; // 9-10
    good: number;     // 7-8
    fair: number;     // 5-6
    poor: number;     // 1-4
  };
  mostUsedKeys: Array<{ key: string; count: number }>;
  leastUsedKeys: Array<{ key: string; count: number }>;
  userSatisfaction: number;
}

export interface TranslationIssue {
  key: string;
  language: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
  reportedBy?: string;
  reportedAt: Date;
}

class TranslationMetricsService {
  private qualityData: Map<string, TranslationQuality> = new Map();
  private analytics: TranslationAnalytics = {
    totalKeys: 0,
    translatedKeys: 0,
    missingKeys: [],
    qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    mostUsedKeys: [],
    leastUsedKeys: [],
    userSatisfaction: 0
  };
  private issues: TranslationIssue[] = [];

  // Track translation usage
  trackTranslation(key: string, language: string, originalText: string, translatedText: string): void {
    const qualityKey = `${key}_${language}`;
    const existing = this.qualityData.get(qualityKey);
    
    if (existing) {
      existing.usageCount++;
      existing.lastUsed = new Date();
    } else {
      this.qualityData.set(qualityKey, {
        key,
        language,
        originalText,
        translatedText,
        qualityScore: this.calculateQualityScore(originalText, translatedText),
        usageCount: 1,
        lastUsed: new Date(),
        issues: []
      });
    }

    this.updateAnalytics();
  }

  // Calculate quality score based on multiple factors
  private calculateQualityScore(original: string, translated: string): number {
    let score = 0;
    
    // Length appropriateness (30% weight)
    const lengthRatio = Math.min(translated.length / original.length, original.length / translated.length);
    score += lengthRatio * 0.3;
    
    // Word count appropriateness (20% weight)
    const originalWords = original.split(/\s+/).length;
    const translatedWords = translated.split(/\s+/).length;
    const wordRatio = Math.min(translatedWords / originalWords, originalWords / translatedWords);
    score += wordRatio * 0.2;
    
    // Character encoding check (20% weight)
    const hasSpecialChars = /[^\x00-\x7F]/.test(translated);
    score += hasSpecialChars ? 0.2 : 0;
    
    // Language-specific checks (30% weight)
    score += this.languageSpecificChecks(original, translated) * 0.3;
    
    return Math.min(score * 10, 10); // Scale to 1-10
  }

  private languageSpecificChecks(original: string, translated: string): number {
    // Check for common translation issues
    let score = 0.5; // Base score
    
    // Check for untranslated text (English words in non-English translations)
    const englishWords = original.match(/\b[a-zA-Z]+\b/g) || [];
    const translatedEnglishWords = translated.match(/\b[a-zA-Z]+\b/g) || [];
    
    if (translatedEnglishWords.length < englishWords.length * 0.3) {
      score += 0.3; // Good translation
    }
    
    // Check for proper capitalization
    if (translated.charAt(0) === translated.charAt(0).toUpperCase()) {
      score += 0.1;
    }
    
    // Check for proper punctuation
    if (translated.endsWith('.') || translated.endsWith('!') || translated.endsWith('?')) {
      score += 0.1;
    }
    
    return Math.min(score, 1);
  }

  // User feedback on translation quality
  submitUserFeedback(key: string, language: string, rating: number, comment?: string): void {
    const qualityKey = `${key}_${language}`;
    const quality = this.qualityData.get(qualityKey);
    
    if (quality) {
      quality.userRating = rating;
      this.updateUserSatisfaction();
      
      // Log feedback
      logger.debug(`User feedback for ${key} (${language}): ${rating}/5 - ${comment || 'No comment'}`);
    }
  }

  // Report translation issues
  reportIssue(key: string, language: string, issue: string, severity: 'low' | 'medium' | 'high' | 'critical', suggestion?: string): void {
    const translationIssue: TranslationIssue = {
      key,
      language,
      issue,
      severity,
      suggestion,
      reportedAt: new Date()
    };
    
    this.issues.push(translationIssue);
    
    // Update quality data
    const qualityKey = `${key}_${language}`;
    const quality = this.qualityData.get(qualityKey);
    if (quality) {
      quality.issues.push(issue);
    }
  }

  // Get translation quality for a specific key
  getTranslationQuality(key: string, language: string): TranslationQuality | undefined {
    return this.qualityData.get(`${key}_${language}`);
  }

  // Get all translation analytics
  getAnalytics(): TranslationAnalytics {
    return { ...this.analytics };
  }

  // Get translation issues
  getIssues(severity?: string): TranslationIssue[] {
    if (severity) {
      return this.issues.filter(issue => issue.severity === severity);
    }
    return [...this.issues];
  }

  // Get quality recommendations
  getQualityRecommendations(): Array<{ key: string; language: string; recommendation: string; priority: number }> {
    const recommendations: Array<{ key: string; language: string; recommendation: string; priority: number }> = [];
    
    this.qualityData.forEach((quality, key) => {
      if (quality.qualityScore < 6) {
        recommendations.push({
          key: quality.key,
          language: quality.language,
          recommendation: `Low quality score (${quality.qualityScore.toFixed(1)}/10). Consider retranslation.`,
          priority: quality.qualityScore < 4 ? 3 : quality.qualityScore < 6 ? 2 : 1
        });
      }
      
      if (quality.userRating && quality.userRating < 3) {
        recommendations.push({
          key: quality.key,
          language: quality.language,
          recommendation: `Poor user rating (${quality.userRating}/5). User feedback needed.`,
          priority: 3
        });
      }
      
      if (quality.issues.length > 0) {
        recommendations.push({
          key: quality.key,
          language: quality.language,
          recommendation: `${quality.issues.length} reported issues. Review needed.`,
          priority: 2
        });
      }
    });
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  // Update analytics
  private updateAnalytics(): void {
    this.analytics.totalKeys = this.qualityData.size;
    this.analytics.translatedKeys = Array.from(this.qualityData.values()).length;
    
    // Quality distribution
    this.analytics.qualityDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    this.qualityData.forEach(quality => {
      if (quality.qualityScore >= 9) this.analytics.qualityDistribution.excellent++;
      else if (quality.qualityScore >= 7) this.analytics.qualityDistribution.good++;
      else if (quality.qualityScore >= 5) this.analytics.qualityDistribution.fair++;
      else this.analytics.qualityDistribution.poor++;
    });
    
    // Most/least used keys
    const usageCounts = Array.from(this.qualityData.values())
      .map(q => ({ key: q.key, count: q.usageCount }))
      .sort((a, b) => b.count - a.count);
    
    this.analytics.mostUsedKeys = usageCounts.slice(0, 10);
    this.analytics.leastUsedKeys = usageCounts.slice(-10);
  }

  private updateUserSatisfaction(): void {
    const ratings = Array.from(this.qualityData.values())
      .filter(q => q.userRating)
      .map(q => q.userRating!);
    
    if (ratings.length > 0) {
      this.analytics.userSatisfaction = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }
  }

  // Export data for analysis
  exportData(): { quality: TranslationQuality[]; analytics: TranslationAnalytics; issues: TranslationIssue[] } {
    return {
      quality: Array.from(this.qualityData.values()),
      analytics: this.analytics,
      issues: this.issues
    };
  }

  // Import data
  importData(data: { quality: TranslationQuality[]; analytics: TranslationAnalytics; issues: TranslationIssue[] }): void {
    this.qualityData.clear();
    data.quality.forEach(quality => {
      this.qualityData.set(`${quality.key}_${quality.language}`, quality);
    });
    this.analytics = data.analytics;
    this.issues = data.issues;
  }
}

export const translationMetrics = new TranslationMetricsService();














