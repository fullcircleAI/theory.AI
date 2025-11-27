// AI Service - Real AI-powered features using OpenAI
import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Only for client-side usage
});

export interface AIExplanation {
  explanation: string;
  personalizedTips: string[];
  relatedConcepts: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIStudyPlan {
  personalizedPath: string[];
  estimatedTimeToPass: number;
  dailyGoals: string[];
  focusAreas: string[];
  motivation: string;
}

export interface AIAnalytics {
  examReadinessScore: number;
  predictedPassProbability: number;
  timeToExamReadiness: number;
  riskFactors: string[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface AITutorResponse {
  message: string;
  tone: 'encouraging' | 'motivational' | 'analytical' | 'supportive';
  actionItems: string[];
  nextSteps: string[];
}

class AIService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!process.env.VITE_OPENAI_API_KEY;
  }

  // Check if AI is available
  isAIAvailable(): boolean {
    return this.isConfigured;
  }

  // Generate AI explanation for a question
  async generateExplanation(
    question: string,
    userAnswer: string,
    correctAnswer: string,
    explanation: string,
    userHistory: any[]
  ): Promise<AIExplanation> {
    if (!this.isConfigured) {
      return this.getFallbackExplanation(explanation);
    }

    try {
      const prompt = `
You are an expert Dutch driving theory tutor. Provide a detailed, personalized explanation for this question:

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Basic Explanation: ${explanation}

User's recent performance: ${JSON.stringify(userHistory.slice(-5))}

Provide:
1. A clear, detailed explanation of why the correct answer is right
2. Personalized tips based on their performance
3. Related concepts they should review
4. Difficulty assessment

Format as JSON with keys: explanation, personalizedTips (array), relatedConcepts (array), difficulty
`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      logger.error('AI explanation error:', error);
    }

    return this.getFallbackExplanation(explanation);
  }

  // Generate personalized study plan
  async generateStudyPlan(userProgress: any): Promise<AIStudyPlan> {
    if (!this.isConfigured) {
      return this.getFallbackStudyPlan();
    }

    try {
      const prompt = `
You are an AI driving theory coach. Create a personalized study plan based on this user data:

User Progress: ${JSON.stringify(userProgress)}

Create a study plan that includes:
1. Personalized learning path (array of test categories)
2. Estimated time to pass (in hours)
3. Daily goals (array of specific goals)
4. Focus areas (array of weak areas to prioritize)
5. Motivational message

Format as JSON with keys: personalizedPath, estimatedTimeToPass, dailyGoals, focusAreas, motivation
`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      logger.error('AI study plan error:', error);
    }

    return this.getFallbackStudyPlan();
  }

  // Generate AI analytics and predictions
  async generateAnalytics(userProgress: any): Promise<AIAnalytics> {
    if (!this.isConfigured) {
      return this.getFallbackAnalytics();
    }

    try {
      const prompt = `
You are an AI driving theory analyst. Analyze this user's progress and provide predictions:

User Progress: ${JSON.stringify(userProgress)}

Provide:
1. Exam readiness score (0-100)
2. Predicted pass probability (0-100)
3. Time to exam readiness (in hours)
4. Risk factors (array of concerns)
5. Recommendations (array of specific actions)
6. Strengths (array of strong areas)
7. Weaknesses (array of weak areas)

Format as JSON with all the above keys
`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      logger.error('AI analytics error:', error);
    }

    return this.getFallbackAnalytics();
  }

  // AI Tutor conversation
  async getTutorResponse(userMessage: string, context: any): Promise<AITutorResponse> {
    if (!this.isConfigured) {
      return this.getFallbackTutorResponse();
    }

    try {
      const prompt = `
You are a friendly, encouraging AI driving theory tutor. Respond to this user message:

User Message: "${userMessage}"
Context: ${JSON.stringify(context)}

Respond with:
1. A helpful, encouraging message
2. Tone (encouraging/motivational/analytical/supportive)
3. Action items (array of specific things to do)
4. Next steps (array of recommended next actions)

Format as JSON with keys: message, tone, actionItems, nextSteps
`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.9,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      logger.error('AI tutor error:', error);
    }

    return this.getFallbackTutorResponse();
  }

  // Fallback methods when AI is not available
  private getFallbackExplanation(explanation: string): AIExplanation {
    return {
      explanation: explanation,
      personalizedTips: ['Keep practicing similar questions', 'Review the theory behind this topic'],
      relatedConcepts: ['Related traffic rules', 'Similar scenarios'],
      difficulty: 'medium'
    };
  }

  private getFallbackStudyPlan(): AIStudyPlan {
    return {
      personalizedPath: ['traffic-rules-signs', 'priority-rules', 'hazard-perception'],
      estimatedTimeToPass: 24,
      dailyGoals: ['Complete 1 practice test', 'Review weak areas', 'Take notes on mistakes'],
      focusAreas: ['Priority rules', 'Traffic signs'],
      motivation: 'You\'re making great progress! Keep practicing to learn Dutch driving theory.'
    };
  }

  private getFallbackAnalytics(): AIAnalytics {
    return {
      examReadinessScore: 65,
      predictedPassProbability: 70,
      timeToExamReadiness: 12,
      riskFactors: ['Need more practice with priority rules'],
      recommendations: ['Focus on weak areas', 'Take more practice tests'],
      strengths: ['Good understanding of basic concepts'],
      weaknesses: ['Priority rules need improvement']
    };
  }

  private getFallbackTutorResponse(): AITutorResponse {
    return {
      message: 'Keep up the great work! Practice makes perfect.',
      tone: 'encouraging',
      actionItems: ['Complete today\'s practice test', 'Review yesterday\'s mistakes'],
      nextSteps: ['Focus on weak areas', 'Take a mock exam']
    };
  }
}

export const aiService = new AIService();
