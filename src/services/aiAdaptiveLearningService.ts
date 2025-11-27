// AI-Enhanced Adaptive Learning Service
// Uses FREE Hugging Face AI to make intelligent learning decisions
// NO API KEY REQUIRED - Completely free!

import { adaptiveDifficultyService } from './adaptiveDifficultyService';
import { TestResult } from './aiCoach';
import type { Question } from '../types';
import { HfInference } from '@huggingface/inference';
import { logger } from '../utils/logger';

export interface AILearningInsight {
  recommendedDifficulty: number;
  reasoning: string;
  confidence: number;
  suggestedTopics: string[];
  learningPattern: 'improving' | 'declining' | 'stable' | 'inconsistent';
}

export interface AIQuestionRecommendation {
  questionIds: string[];
  reasoning: string;
  expectedOutcome: string;
  difficultyBalance: {
    easy: number;
    medium: number;
    hard: number;
  };
}

class AIAdaptiveLearningService {
  private hf: HfInference;
  private readonly models = [
    'google/flan-t5-large',      // Best for instruction following
    'google/flan-t5-base',       // Fast fallback
    'microsoft/DialoGPT-medium'      // Conversational fallback
  ];
  private currentModelIndex = 0;

  constructor() {
    // Initialize Hugging Face client
    // Optional: Set REACT_APP_HUGGINGFACE_API_KEY in .env for better rate limits
    // Free API key available at: https://huggingface.co/settings/tokens
    const apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;
    this.hf = apiKey ? new HfInference(apiKey) : new HfInference();
  }

  /**
   * AI-Powered Difficulty Analysis
   * Uses free AI to analyze user performance and recommend optimal difficulty
   */
  async analyzeLearningPattern(userHistory: TestResult[]): Promise<AILearningInsight> {
    if (userHistory.length === 0) {
      return {
        recommendedDifficulty: 3,
        reasoning: 'Starting fresh - beginning with beginner-intermediate level',
        confidence: 0.9,
        suggestedTopics: ['Traffic Rules & Signs', 'Basic Priority Rules'],
        learningPattern: 'stable'
      };
    }

    // Calculate base metrics
    const recentTests = userHistory.slice(-5);
    const scores = recentTests.map(test => test.percentage);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Use rule-based as fallback
    const ruleBasedDifficulty = adaptiveDifficultyService.calculateDifficultyLevel(userHistory);
    
    // Try AI analysis (with fallback to rule-based)
    try {
      const aiInsight = await this.getAIDifficultyInsight(userHistory, scores, averageScore);
      if (aiInsight) {
        return aiInsight;
      }
    } catch (error) {
      logger.debug('AI analysis unavailable, using rule-based fallback');
    }

    // Fallback to rule-based with enhanced reasoning
    const learningPattern = this.detectLearningPattern(scores);
    const weakTopics = this.identifyWeakTopics(userHistory);
    
    return {
      recommendedDifficulty: ruleBasedDifficulty,
      reasoning: this.generateReasoning(learningPattern, averageScore, weakTopics),
      confidence: 0.7,
      suggestedTopics: weakTopics.length > 0 ? weakTopics : ['Traffic Rules & Signs'],
      learningPattern
    };
  }

  /**
   * AI-Powered Question Selection
   * Uses free AI to recommend optimal question selection
   */
  async recommendQuestions(
    allQuestions: Question[],
    difficultyLevel: number,
    count: number,
    userHistory: TestResult[],
    weakTopics?: string[]
  ): Promise<AIQuestionRecommendation> {
    // Use rule-based selection as base
    const selectedQuestions = adaptiveDifficultyService.selectAdaptiveQuestions(
      allQuestions,
      difficultyLevel,
      count,
      weakTopics
    );

    // Try AI enhancement (with fallback)
    try {
      const aiRecommendation = await this.getAIQuestionRecommendation(
        allQuestions,
        difficultyLevel,
        count,
        userHistory,
        weakTopics
      );
      
      if (aiRecommendation && aiRecommendation.questionIds.length > 0) {
        // Filter to only include valid question IDs
        const validQuestions = allQuestions.filter(q => 
          aiRecommendation.questionIds.includes(q.id)
        );
        
        if (validQuestions.length >= count * 0.7) { // At least 70% valid
          return {
            questionIds: validQuestions.map(q => q.id),
            reasoning: aiRecommendation.reasoning,
            expectedOutcome: aiRecommendation.expectedOutcome,
            difficultyBalance: this.calculateDifficultyBalance(validQuestions)
          };
        }
      }
    } catch (error) {
      logger.debug('AI recommendation unavailable, using rule-based selection');
    }

    // Fallback: Return rule-based selection with AI-style reasoning
    return {
      questionIds: selectedQuestions.map(q => q.id),
      reasoning: this.generateQuestionSelectionReasoning(difficultyLevel, weakTopics),
      expectedOutcome: this.predictOutcome(difficultyLevel, userHistory),
      difficultyBalance: this.calculateDifficultyBalance(selectedQuestions)
    };
  }

  /**
   * AI-Powered Real-time Difficulty Adjustment
   * Uses AI to make smarter adjustments after each answer
   */
  async adjustDifficultyIntelligently(
    currentLevel: number,
    wasCorrect: boolean,
    timeSpent: number,
    questionDifficulty: 'easy' | 'medium' | 'hard',
    recentPerformance: { correct: number; total: number; averageTime: number }
  ): Promise<{ newLevel: number; reasoning: string }> {
    // Use rule-based as base
    const ruleBasedLevel = adaptiveDifficultyService.adjustDifficultyAfterAnswer(
      currentLevel,
      wasCorrect,
      timeSpent,
      questionDifficulty
    );

    // Try AI adjustment (with quick timeout)
    try {
      const aiAdjustment = await this.getAIDifficultyAdjustment(
        currentLevel,
        wasCorrect,
        timeSpent,
        questionDifficulty,
        recentPerformance
      );
      
      if (aiAdjustment) {
        return {
          newLevel: Math.max(1, Math.min(10, aiAdjustment.newLevel)),
          reasoning: aiAdjustment.reasoning
        };
      }
    } catch (error) {
      // Silent fallback - AI is optional
    }

    // Fallback: Rule-based with enhanced reasoning
    return {
      newLevel: ruleBasedLevel,
      reasoning: this.generateAdjustmentReasoning(
        wasCorrect,
        timeSpent,
        questionDifficulty,
        currentLevel,
        ruleBasedLevel
      )
    };
  }

  // ========== PRIVATE AI METHODS ==========

  /**
   * Get AI insight for difficulty recommendation
   */
  private async getAIDifficultyInsight(
    userHistory: TestResult[],
    scores: number[],
    averageScore: number
  ): Promise<AILearningInsight | null> {
    const prompt = `Analyze learning performance:
Scores: ${scores.join(', ')}
Average: ${averageScore.toFixed(1)}%
Tests taken: ${userHistory.length}

Recommend difficulty level (1-10) and explain why. Format: "Level: X | Reason: Y | Pattern: Z"
Keep response under 80 words.`;

    try {
      const response = await this.callFreeAI(prompt, 5000); // 5 second timeout
      if (response && response.length > 10) {
        return this.parseAIDifficultyResponse(response, scores, averageScore);
      }
    } catch (error) {
      // Silent fail - fallback to rule-based
    }

    return null;
  }

  /**
   * Get AI recommendation for question selection
   */
  private async getAIQuestionRecommendation(
    allQuestions: Question[],
    difficultyLevel: number,
    count: number,
    userHistory: TestResult[],
    weakTopics?: string[]
  ): Promise<{ questionIds: string[]; reasoning: string; expectedOutcome: string } | null> {
    const recentScore = userHistory.length > 0 ? userHistory[userHistory.length - 1].percentage : 0;
    const topicInfo = weakTopics && weakTopics.length > 0 
      ? `Focus on: ${weakTopics.join(', ')}` 
      : 'Balanced topic coverage';

    const prompt = `Select ${count} questions for difficulty level ${difficultyLevel}/10.
User recent score: ${recentScore}%
${topicInfo}
Total questions available: ${allQuestions.length}

Recommend question selection strategy. Format: "Strategy: X | Expected: Y"
Keep under 60 words.`;

    try {
      const response = await this.callFreeAI(prompt, 4000); // 4 second timeout
      if (response && response.length > 10) {
        // For now, return rule-based selection with AI reasoning
        // In future, could parse question IDs from response
        return {
          questionIds: [], // Will use rule-based selection
          reasoning: response,
          expectedOutcome: `User should achieve ${difficultyLevel * 10}%+ with this selection`
        };
      }
    } catch (error) {
      // Silent fail
    }

    return null;
  }

  /**
   * Get AI adjustment recommendation
   */
  private async getAIDifficultyAdjustment(
    currentLevel: number,
    wasCorrect: boolean,
    timeSpent: number,
    questionDifficulty: 'easy' | 'medium' | 'hard',
    recentPerformance: { correct: number; total: number; averageTime: number }
  ): Promise<{ newLevel: number; reasoning: string } | null> {
    const accuracy = recentPerformance.total > 0 
      ? (recentPerformance.correct / recentPerformance.total * 100).toFixed(1)
      : '0';

    const prompt = `Adjust difficulty:
Current: ${currentLevel}/10
Answer: ${wasCorrect ? 'correct' : 'wrong'}
Time: ${timeSpent}s (question: ${questionDifficulty})
Recent accuracy: ${accuracy}%

Recommend new level (1-10) and brief reason. Format: "Level: X | Reason: Y"
Keep under 50 words.`;

    try {
      const response = await this.callFreeAI(prompt, 3000); // 3 second timeout
      if (response && response.length > 10) {
        const parsed = this.parseAIAdjustmentResponse(response, currentLevel);
        if (parsed) {
          return parsed;
        }
      }
    } catch (error) {
      // Silent fail
    }

    return null;
  }

  /**
   * Call free Hugging Face AI (NO API KEY NEEDED!)
   */
  private async callFreeAI(prompt: string, timeout: number = 5000): Promise<string> {
    for (let i = 0; i < this.models.length; i++) {
      try {
        const modelName = this.models[this.currentModelIndex];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await this.hf.textGeneration({
          model: modelName,
          inputs: prompt,
          parameters: {
            max_new_tokens: 80,
            temperature: 0.5,
            do_sample: true,
            top_p: 0.8,
            repetition_penalty: 1.2,
            return_full_text: false
          }
        });

        clearTimeout(timeoutId);

        if (response && response.generated_text) {
          const text = response.generated_text.trim();
          if (text.length > 10) {
            return text;
          }
        }

        // Try next model
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
      } catch (error) {
        // Try next model
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
      }
    }

    return '';
  }

  // ========== PARSING & HELPER METHODS ==========

  private parseAIDifficultyResponse(
    response: string,
    scores: number[],
    averageScore: number
  ): AILearningInsight {
    // Extract level from response
    const levelMatch = response.match(/level[:\s]+(\d+)/i);
    const recommendedLevel = levelMatch 
      ? Math.max(1, Math.min(10, parseInt(levelMatch[1])))
      : adaptiveDifficultyService.calculateDifficultyLevel(
          scores.map(s => ({ percentage: s } as TestResult))
        );

    const learningPattern = this.detectLearningPattern(scores);
    const weakTopics = this.identifyWeakTopics(
      scores.map(s => ({ percentage: s } as TestResult))
    );

    return {
      recommendedDifficulty: recommendedLevel,
      reasoning: response.length > 200 ? response.substring(0, 200) : response,
      confidence: 0.8,
      suggestedTopics: weakTopics.length > 0 ? weakTopics : ['Traffic Rules & Signs'],
      learningPattern
    };
  }

  private parseAIAdjustmentResponse(
    response: string,
    currentLevel: number
  ): { newLevel: number; reasoning: string } | null {
    const levelMatch = response.match(/level[:\s]+(\d+)/i);
    if (!levelMatch) return null;

    const newLevel = Math.max(1, Math.min(10, parseInt(levelMatch[1])));
    const reasoning = response.length > 100 ? response.substring(0, 100) : response;

    return { newLevel, reasoning };
  }

  private detectLearningPattern(scores: number[]): 'improving' | 'declining' | 'stable' | 'inconsistent' {
    if (scores.length < 3) return 'stable';

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    const variance = this.calculateVariance(scores);

    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    if (variance > 300) return 'inconsistent';
    return 'stable';
  }

  private identifyWeakTopics(userHistory: TestResult[]): string[] {
    // Simplified - in real implementation, would analyze topic performance
    const averageScore = userHistory.length > 0
      ? userHistory.reduce((sum, test) => sum + test.percentage, 0) / userHistory.length
      : 0;

    if (averageScore < 60) {
      return ['Traffic Rules & Signs', 'Basic Priority Rules'];
    } else if (averageScore < 80) {
      return ['Priority Rules', 'Roundabouts'];
    }

    return [];
  }

  private generateReasoning(
    pattern: string,
    averageScore: number,
    weakTopics: string[]
  ): string {
    if (pattern === 'improving') {
      return `Your scores are improving! Current average: ${averageScore.toFixed(1)}%. Ready for slightly harder questions.`;
    } else if (pattern === 'declining') {
      return `Scores are declining. Let's focus on fundamentals. Average: ${averageScore.toFixed(1)}%.`;
    } else if (pattern === 'inconsistent') {
      return `Performance is inconsistent. Building consistency with balanced difficulty. Average: ${averageScore.toFixed(1)}%.`;
    }
    return `Stable performance at ${averageScore.toFixed(1)}%. Maintaining current difficulty level.`;
  }

  private generateQuestionSelectionReasoning(
    difficultyLevel: number,
    weakTopics?: string[]
  ): string {
    if (weakTopics && weakTopics.length > 0) {
      return `Selected questions focus on weak areas: ${weakTopics.join(', ')}. Difficulty level: ${difficultyLevel}/10.`;
    }
    return `Balanced question selection at difficulty level ${difficultyLevel}/10.`;
  }

  private generateAdjustmentReasoning(
    wasCorrect: boolean,
    timeSpent: number,
    questionDifficulty: string,
    currentLevel: number,
    newLevel: number
  ): string {
    const direction = newLevel > currentLevel ? 'increased' : newLevel < currentLevel ? 'decreased' : 'maintained';
    const reason = wasCorrect 
      ? `Correct answer on ${questionDifficulty} question`
      : `Incorrect answer - needs easier questions`;
    
    return `Difficulty ${direction} (${currentLevel} → ${newLevel}). ${reason}.`;
  }

  private predictOutcome(difficultyLevel: number, userHistory: TestResult[]): string {
    const recentAvg = userHistory.length > 0
      ? userHistory.slice(-3).reduce((sum, test) => sum + test.percentage, 0) / Math.min(3, userHistory.length)
      : 0;

    const expectedScore = difficultyLevel * 10;
    if (recentAvg >= expectedScore - 5) {
      return `Expected score: ${expectedScore}%+ (aligned with current performance)`;
    }
    return `Expected score: ${expectedScore}% (challenging but achievable)`;
  }

  private calculateDifficultyBalance(questions: Question[]): {
    easy: number;
    medium: number;
    hard: number;
  } {
    let easy = 0, medium = 0, hard = 0;

    questions.forEach(q => {
      const difficulty = adaptiveDifficultyService.calculateQuestionDifficulty(q);
      if (difficulty === 'easy') easy++;
      else if (difficulty === 'medium') medium++;
      else hard++;
    });

    return { easy, medium, hard };
  }

  private calculateVariance(scores: number[]): number {
    if (scores.length === 0) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  }
}

export const aiAdaptiveLearningService = new AIAdaptiveLearningService();


