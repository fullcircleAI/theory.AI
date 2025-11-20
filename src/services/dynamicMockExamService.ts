// Dynamic Mock Exam Service
// Generates personalized mock exams based on user performance
// IMPORTANT: Only uses REAL CBR questions - no generation, only filtering
// MAINTAINS CBR STRUCTURE (2025 Format): 50 questions (30 regular + 20 image), 30 minutes total, 44 correct to pass (88%)

import { TestResult } from './aiCoach';
import { realExamQuestions, mockExamImageQuestions, RealExamQuestion } from '../question_data/realExamQuestions';
import { adaptiveDifficultyService } from './adaptiveDifficultyService';

export interface WeakArea {
  topic: string;
  score: number;
  count: number;
  urgency?: number; // Optional: urgency score for prioritization
  mastery?: number; // Mastery level (0-100%)
  improvement?: number; // Improvement trend (-100 to +100)
}

export interface QuestionHistory {
  questionId: string;
  seenCount: number;
  lastSeen: Date;
  correctCount: number;
  incorrectCount: number;
  averageTime: number;
  topics: string[];
  lastExamId?: string;
}

export interface RecentPerformance {
  averageScore: number;
  trend: 'improving' | 'declining' | 'stable';
  recentDifficulty: number;
  mockExamCount: number;
}

export interface DynamicExamConfig {
  examId: string;
  focusAreas: string[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  personalizationLevel: number; // 0-100%
  generatedAt: Date;
}

class DynamicMockExamService {
  // CBR Exam Structure Constants - Updated to 2025 Format
  private readonly CBR_STRUCTURE = {
    TOTAL_QUESTIONS: 50,
    REGULAR_QUESTIONS: 30,
    IMAGE_QUESTIONS: 20,
    TOTAL_TIME_SECONDS: 1800, // 30 minutes
    AVERAGE_TIME_PER_QUESTION: 36, // seconds (30 min / 50 questions)
    MAX_TIME_PER_QUESTION: 60, // seconds
    PASS_MARK: 44, // 44/50 correct (88%)
    PASS_PERCENTAGE: 88
  };

  // Map practice test IDs to real exam subjects
  private topicMapping: Record<string, string> = {
    'priority-rules': 'Priority Rules',
    'hazard-perception': 'Hazard Perception',
    'speed-safety': 'Speed Limits',
    'traffic-lights-signals': 'Traffic Lights',
    'road-signs': 'Road Signs',
    'motorway-rules': 'Motorway Rules',
    'roundabout-rules': 'Roundabout Rules',
    'bicycle-interactions': 'Bicycle Interactions',
    'tram-interactions': 'Tram Interactions',
    'pedestrian-crossings': 'Pedestrian Crossings',
    'construction-zones': 'Construction Zones',
    'weather-conditions': 'Weather Conditions',
    'vehicle-knowledge': 'Vehicle Knowledge',
    'parking-rules': 'Parking Rules',
    'environmental': 'Environmental Zones',
    'technology-safety': 'Technology & Safety',
    'alcohol-drugs': 'Alcohol & Drugs',
    'fatigue-rest': 'Fatigue & Rest',
    'emergency-procedures': 'Emergency Procedures',
  };

  // Major CBR themes that must be represented in every mock exam
  // These are the core official CBR exam topics
  private readonly MAJOR_CBR_THEMES: string[] = [
    'Hazard Perception',
    'Priority Rules',
    'Speed Limits',
    'Traffic Lights',
    'Traffic Signs',
    'Warning Signs',
    'Prohibitory Signs',
    'Road Markings',
    'Roundabout Rules',
    'Overtaking',
    'Pedestrian Crossings',
    'Construction Zones',
    'Weather Conditions',
    'Safety Rules',
    'Lane Changing',
    // Note: Some themes may be grouped (e.g., "Traffic Signs" covers multiple sign types)
  ];

  // Get question history for user (prevents repeats)
  private getQuestionHistory(userId?: string): QuestionHistory[] {
    try {
      const key = userId ? `questionHistory_${userId}` : 'questionHistory';
      const stored = localStorage.getItem(key);
      if (stored) {
        const history = JSON.parse(stored);
        // Convert date strings back to Date objects
        return history.map((h: any) => ({
          ...h,
          lastSeen: new Date(h.lastSeen)
        }));
      }
    } catch (error) {
      console.error('Error loading question history:', error);
    }
    return [];
  }

  // Save question history
  private saveQuestionHistory(history: QuestionHistory[], userId?: string): void {
    try {
      const key = userId ? `questionHistory_${userId}` : 'questionHistory';
      localStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving question history:', error);
    }
  }

  // Update question history after exam
  updateQuestionHistory(questionIds: string[], examId: string, userId?: string): void {
    const history = this.getQuestionHistory(userId);
    const now = new Date();

    questionIds.forEach(qId => {
      const existing = history.find(h => h.questionId === qId);
      if (existing) {
        existing.seenCount += 1;
        existing.lastSeen = now;
        existing.lastExamId = examId;
      } else {
        // Get question to extract topics
        const allQuestions = [...realExamQuestions, ...mockExamImageQuestions];
        const question = allQuestions.find(q => q.id === qId);
        history.push({
          questionId: qId,
          seenCount: 1,
          lastSeen: now,
          correctCount: 0,
          incorrectCount: 0,
          averageTime: 0,
          topics: question ? [question.subject] : [],
          lastExamId: examId
        });
      }
    });

    this.saveQuestionHistory(history, userId);
  }

  // Filter out recently seen questions
  private filterUnseenQuestions(
    questions: RealExamQuestion[],
    userId?: string,
    minDaysSinceSeen: number = 7,
    maxSeenCount: number = 3
  ): RealExamQuestion[] {
    const history = this.getQuestionHistory(userId);
    const seenQuestionIds = new Set(history.map(h => h.questionId));
    const now = Date.now();

    return questions.filter(q => {
      const questionHistory = history.find(h => h.questionId === q.id);
      
      // Never seen - always include
      if (!questionHistory) return true;
      
      // Seen too many times - exclude
      if (questionHistory.seenCount >= maxSeenCount) return false;
      
      // Check if seen recently
      const daysSinceSeen = (now - questionHistory.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSeen >= minDaysSinceSeen;
    });
  }

  // Get recent performance (last 7 days or last 5 mock exams)
  getRecentPerformance(userHistory: TestResult[]): RecentPerformance {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Filter recent tests (last 7 days)
    const recentTests = userHistory.filter(test => {
      const testDate = new Date(test.date).getTime();
      return testDate >= sevenDaysAgo;
    });

    // Get mock exams specifically (testId contains 'mock' or 'exam')
    const mockExams = userHistory.filter(test => 
      test.testId.toLowerCase().includes('mock') || 
      test.testId.toLowerCase().includes('exam')
    ).slice(-5); // Last 5 mock exams

    const averageScore = recentTests.length > 0
      ? recentTests.reduce((sum, t) => sum + t.percentage, 0) / recentTests.length
      : 0;

    // Calculate trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentTests.length >= 2) {
      const firstHalf = recentTests.slice(0, Math.floor(recentTests.length / 2));
      const secondHalf = recentTests.slice(Math.floor(recentTests.length / 2));
      const firstAvg = firstHalf.reduce((sum, t) => sum + t.percentage, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, t) => sum + t.percentage, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 5) trend = 'improving';
      else if (secondAvg < firstAvg - 5) trend = 'declining';
    }

    // Calculate recent difficulty
    const recentDifficulty = adaptiveDifficultyService.calculateDifficultyLevel(recentTests);

    return {
      averageScore,
      trend,
      recentDifficulty,
      mockExamCount: mockExams.length
    };
  }

  // Track topic improvement
  private trackTopicImprovement(topic: string, userHistory: TestResult[]): {
    currentMastery: number;
    previousMastery: number;
    improvement: number;
    trend: 'improving' | 'declining' | 'stable';
  } {
    // Get tests for this topic
    const topicTests = userHistory.filter(test => {
      const subject = this.topicMapping[test.testId] || test.testId;
      return subject === topic;
    });

    if (topicTests.length < 2) {
      const mastery = topicTests.length > 0 ? topicTests[0].percentage : 0;
      return {
        currentMastery: mastery,
        previousMastery: mastery,
        improvement: 0,
        trend: 'stable'
      };
    }

    // Split into recent and older
    const recentCount = Math.ceil(topicTests.length / 2);
    const recentTests = topicTests.slice(-recentCount);
    const olderTests = topicTests.slice(0, topicTests.length - recentCount);

    const currentMastery = recentTests.reduce((sum, t) => sum + t.percentage, 0) / recentTests.length;
    const previousMastery = olderTests.reduce((sum, t) => sum + t.percentage, 0) / olderTests.length;
    const improvement = currentMastery - previousMastery;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (improvement > 10) trend = 'improving';
    else if (improvement < -10) trend = 'declining';

    return {
      currentMastery,
      previousMastery,
      improvement,
      trend
    };
  }

  // Analyze weak areas from user history (ENHANCED with mastery and improvement)
  analyzeWeakAreas(userHistory: TestResult[]): WeakArea[] {
    // Group by topic
    const topicScores: Record<string, { scores: number[]; count: number; dates: string[] }> = {};

    userHistory.forEach(test => {
      const subject = this.topicMapping[test.testId] || test.testId;
      if (!topicScores[subject]) {
        topicScores[subject] = { scores: [], count: 0, dates: [] };
      }
      topicScores[subject].scores.push(test.percentage);
      topicScores[subject].count += 1;
      topicScores[subject].dates.push(test.date);
    });

    // Calculate averages and identify weak areas (<60%)
    const weakAreas: WeakArea[] = [];
    Object.entries(topicScores).forEach(([topic, data]) => {
      const average = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      
      // Enhanced: Calculate urgency score
      // Factor 1: Average score (lower = more urgent)
      const scoreUrgency = Math.max(0, 60 - average);
      
      // Factor 2: Consistency (high variance = unstable = more urgent)
      const mean = average;
      const variance = data.scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / data.scores.length;
      const consistencyUrgency = Math.min(20, variance / 10);
      
      // Factor 3: Trend (declining = more urgent)
      let trendUrgency = 0;
      if (data.scores.length >= 2) {
        const firstHalf = data.scores.slice(0, Math.floor(data.scores.length / 2));
        const secondHalf = data.scores.slice(Math.floor(data.scores.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const trend = firstAvg - secondAvg; // Positive = declining
        trendUrgency = Math.max(0, trend); // Declining = more urgent
      }
      
      // Factor 4: Recent performance (recent tests weighted more)
      const recentWeight = 1.5;
      const oldWeight = 1.0;
      let weightedAverage = average;
      if (data.scores.length >= 2) {
        const recentScores = data.scores.slice(-Math.ceil(data.scores.length / 2));
        const oldScores = data.scores.slice(0, Math.floor(data.scores.length / 2));
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const oldAvg = oldScores.length > 0 ? oldScores.reduce((a, b) => a + b, 0) / oldScores.length : average;
        weightedAverage = (recentAvg * recentWeight + oldAvg * oldWeight) / (recentWeight + oldWeight);
      }
      
      // Identify weak areas (<60% average or <60% weighted average)
      if (average < 60 || weightedAverage < 60) {
        const urgency = scoreUrgency + consistencyUrgency + trendUrgency;
        
        // Get mastery and improvement tracking
        const mastery = Math.round(weightedAverage);
        const improvement = this.trackTopicImprovement(topic, userHistory);
        
        // Adjust urgency based on improvement
        let adjustedUrgency = urgency;
        if (improvement.trend === 'improving' && improvement.improvement > 10) {
          // User is improving - reduce urgency slightly
          adjustedUrgency = urgency * 0.7;
        } else if (improvement.trend === 'declining') {
          // User is declining - increase urgency
          adjustedUrgency = urgency * 1.3;
        }
        
        weakAreas.push({
          topic,
          score: mastery,
          count: data.count,
          urgency: Math.round(adjustedUrgency * 10) / 10,
          mastery: mastery,
          improvement: improvement.improvement
        } as WeakArea);
      }
    });

    // Sort by urgency (worst + declining + unstable = highest priority)
    return weakAreas.sort((a, b) => {
      const aUrgency = a.urgency || 0;
      const bUrgency = b.urgency || 0;
      if (aUrgency !== bUrgency) return bUrgency - aUrgency;
      // Tie-breaker: lower mastery first
      const aMastery = a.mastery || a.score;
      const bMastery = b.mastery || b.score;
      return aMastery - bMastery;
    });
  }

  // Generate personalized mock exam FROM REAL CBR QUESTIONS ONLY
  // MAINTAINS CBR STRUCTURE (2025 Format): 50 questions (30 regular + 20 image), 44 correct to pass (88%)
  generatePersonalizedExam(
    examId: string,
    userHistory: TestResult[],
    difficultyLevel?: number,
    userId?: string
  ): { questions: RealExamQuestion[]; config: DynamicExamConfig } {
    // Step 1: Get ALL real exam questions
    const allRealQuestions: RealExamQuestion[] = [
      ...realExamQuestions,
      ...mockExamImageQuestions
    ];

    // Step 2: Filter out recently seen questions (prevent repeats)
    const availableQuestions = this.filterUnseenQuestions(allRealQuestions, userId);

    // Step 3: Analyze weak areas (with mastery and improvement tracking)
    const weakAreas = this.analyzeWeakAreas(userHistory);
    const focusAreas = weakAreas.slice(0, 3).map(area => area.topic);

    // Step 4: Get recent performance for difficulty adjustment
    const recentPerformance = this.getRecentPerformance(userHistory);
    
    // Step 5: Adjust difficulty based on recent performance
    let adjustedDifficulty = difficultyLevel || recentPerformance.recentDifficulty;
    if (recentPerformance.trend === 'improving') {
      adjustedDifficulty = Math.min(10, adjustedDifficulty + 1);
    } else if (recentPerformance.trend === 'declining') {
      adjustedDifficulty = Math.max(1, adjustedDifficulty - 1);
    }

    // Step 6: Filter available questions by weak areas (enhanced matching)
    // Weight by mastery: lower mastery = higher priority
    const weakAreaQuestions = availableQuestions.filter(q => {
      const questionSubject = q.subject || '';
      return focusAreas.some(area => {
        // Exact match
        if (questionSubject === area) return true;
        // Partial match (case insensitive)
        if (questionSubject.toLowerCase().includes(area.toLowerCase()) ||
            area.toLowerCase().includes(questionSubject.toLowerCase())) {
          return true;
        }
        // Check if question has topics array
        if ((q as any).topics && Array.isArray((q as any).topics)) {
          return (q as any).topics.some((topic: string) => 
            topic.toLowerCase().includes(area.toLowerCase()) ||
            area.toLowerCase().includes(topic.toLowerCase())
          );
        }
        return false;
      });
    });

    // Step 7: Weight questions by mastery level
    const weightedWeakQuestions = weakAreaQuestions.map(q => {
      const questionTopic = q.subject || '';
      const weakArea = weakAreas.find(wa => 
        wa.topic === questionTopic ||
        questionTopic.toLowerCase().includes(wa.topic.toLowerCase()) ||
        wa.topic.toLowerCase().includes(questionTopic.toLowerCase())
      );
      
      // Lower mastery = higher weight (30% mastery = 70 weight, 55% mastery = 45 weight)
      const mastery = weakArea?.mastery || weakArea?.score || 50;
      const weight = 100 - mastery;
      
      return { question: q, weight, mastery };
    }).sort((a, b) => b.weight - a.weight); // Highest weight first

    // Step 8: Get medium/strong area questions (also from available pool)
    const mediumAreaQuestions = availableQuestions.filter(q => {
      const questionSubject = q.subject || '';
      return !focusAreas.some(area => 
        questionSubject === area ||
        questionSubject.toLowerCase().includes(area.toLowerCase())
      );
    });

    // Step 9: Smart distribution based on weak area count and mastery
    // Weight distribution: Lower mastery topics get more questions
    const weakAreaCount = weakAreas.length;
    let weakPercentage = 0.5; // Default 50%
    
    if (weakAreaCount === 1) {
      weakPercentage = 0.7; // 70% from weak area if only one
    } else if (weakAreaCount <= 3) {
      weakPercentage = 0.6; // 60% from weak areas if 2-3
    }
    // else 50% if 4+ weak areas (balanced)
    
    // Calculate distribution maintaining CBR structure (30 regular + 20 image = 50 total)
    const totalWeakCount = Math.floor(this.CBR_STRUCTURE.TOTAL_QUESTIONS * weakPercentage);
    
    // Distribute weak area questions: 60% regular, 40% image (maintains CBR ratio: 30/20 = 60/40)
    const regularFromWeakCount = Math.floor(totalWeakCount * 0.6);
    const imageFromWeakCount = totalWeakCount - regularFromWeakCount;
    
    // Select from weighted questions (highest weight = lowest mastery = priority)
    const regularFromWeak = weightedWeakQuestions
      .filter(wq => !wq.question.imageUrl)
      .slice(0, regularFromWeakCount)
      .map(wq => wq.question);

    const imageFromWeak = weightedWeakQuestions
      .filter(wq => wq.question.imageUrl)
      .slice(0, imageFromWeakCount)
      .map(wq => wq.question);

    // Step 10: Fill remaining slots to maintain CBR structure (30 regular + 20 image = 50 total)
    const regularNeeded = this.CBR_STRUCTURE.REGULAR_QUESTIONS - regularFromWeak.length;
    const imageNeeded = this.CBR_STRUCTURE.IMAGE_QUESTIONS - imageFromWeak.length;
    
    let regularQuestions = [...regularFromWeak];
    if (regularNeeded > 0) {
      const fillFrom = mediumAreaQuestions
        .filter(q => !q.imageUrl)
        .slice(0, regularNeeded);
      regularQuestions = [...regularQuestions, ...fillFrom];
    }

    let imageQuestions = [...imageFromWeak];
    if (imageNeeded > 0) {
      const fillFrom = mediumAreaQuestions
        .filter(q => q.imageUrl)
        .slice(0, imageNeeded);
      imageQuestions = [...imageQuestions, ...fillFrom];
    }

    // Step 11: Balance difficulty based on adjusted difficulty (considers recent performance)
    let finalQuestions: RealExamQuestion[] = [...regularQuestions, ...imageQuestions];
    
    if (adjustedDifficulty) {
      finalQuestions = this.balanceDifficulty(finalQuestions, adjustedDifficulty);
    }

    // Step 12: Ensure CBR structure is maintained (30 regular + 20 image = 50 total)
    // Re-verify structure after difficulty balancing
    const finalRegular = finalQuestions.filter(q => !q.imageUrl);
    const finalImage = finalQuestions.filter(q => q.imageUrl);
    
    // If structure is broken, fix it
    if (finalRegular.length !== this.CBR_STRUCTURE.REGULAR_QUESTIONS || 
        finalImage.length !== this.CBR_STRUCTURE.IMAGE_QUESTIONS) {
      // Rebuild maintaining structure
      const neededRegular = this.CBR_STRUCTURE.REGULAR_QUESTIONS - finalRegular.length;
      const neededImage = this.CBR_STRUCTURE.IMAGE_QUESTIONS - finalImage.length;
      
      if (neededRegular > 0) {
        const fillRegular = availableQuestions
          .filter(q => !q.imageUrl && !finalQuestions.includes(q))
          .slice(0, neededRegular);
        finalQuestions = [...finalRegular, ...finalImage, ...fillRegular];
      }
      
      if (neededImage > 0) {
        const fillImage = availableQuestions
          .filter(q => q.imageUrl && !finalQuestions.includes(q))
          .slice(0, neededImage);
        finalQuestions = [...finalQuestions, ...fillImage];
      }
      
      // Limit to exactly 50
      finalQuestions = finalQuestions.slice(0, this.CBR_STRUCTURE.TOTAL_QUESTIONS);
    }

    // Step 13: Ensure theme diversity (all major CBR themes represented)
    finalQuestions = this.ensureThemeDiversity(finalQuestions, availableQuestions, focusAreas);

    // Step 14: Shuffle to randomize order (maintains CBR structure)
    finalQuestions = this.shuffleArray(finalQuestions);

    // Calculate personalization level
    const personalizationLevel = Math.min(100, 
      Math.round((regularFromWeak.length + imageFromWeak.length) / 50 * 100)
    );

    // Create config
    const config: DynamicExamConfig = {
      examId,
      focusAreas,
      difficultyDistribution: this.calculateDifficultyDistribution(finalQuestions),
      personalizationLevel,
      generatedAt: new Date()
    };

    return { questions: finalQuestions, config };
  }

  // Ensure all major CBR themes are represented in the exam
  // Maintains weak area focus while ensuring theme diversity
  private ensureThemeDiversity(
    questions: RealExamQuestion[],
    availableQuestions: RealExamQuestion[],
    focusAreas: string[] // Weak areas that should be prioritized
  ): RealExamQuestion[] {
    // Get currently represented themes
    const representedThemes = new Set<string>();
    questions.forEach(q => {
      const subject = q.subject || '';
      if (subject) {
        representedThemes.add(subject);
        // Also check for grouped themes (e.g., "Traffic Signs" covers "Warning Signs", "Prohibitory Signs")
        if (subject.includes('Sign')) {
          if (subject.includes('Warning')) representedThemes.add('Warning Signs');
          if (subject.includes('Prohibitory')) representedThemes.add('Prohibitory Signs');
          if (subject.includes('Traffic')) representedThemes.add('Traffic Signs');
        }
      }
    });

    // Find missing themes
    const missingThemes: string[] = [];
    this.MAJOR_CBR_THEMES.forEach(theme => {
      // Check if theme is represented (exact match or partial)
      const isRepresented = Array.from(representedThemes).some(represented => {
        // Exact match
        if (represented === theme) return true;
        // Partial match (case insensitive)
        if (represented.toLowerCase().includes(theme.toLowerCase()) ||
            theme.toLowerCase().includes(represented.toLowerCase())) {
          return true;
        }
        // Special handling for sign types
        if (theme.includes('Sign') && represented.includes('Sign')) {
          return true;
        }
        return false;
      });

      if (!isRepresented) {
        missingThemes.push(theme);
      }
    });

    // If no missing themes, return as is
    if (missingThemes.length === 0) {
      return questions;
    }

    // Replace questions to include missing themes
    // Strategy: Replace non-weak-area questions first, then least important weak-area questions
    let updatedQuestions = [...questions];
    const regularQuestions = updatedQuestions.filter(q => !q.imageUrl);
    const imageQuestions = updatedQuestions.filter(q => q.imageUrl);

    // Helper to find questions matching a theme
    const findQuestionsForTheme = (theme: string, isImage: boolean): RealExamQuestion[] => {
      return availableQuestions.filter(q => {
        if (isImage && !q.imageUrl) return false;
        if (!isImage && q.imageUrl) return false;
        if (updatedQuestions.includes(q)) return false; // Already selected

        const subject = q.subject || '';
        // Exact match
        if (subject === theme) return true;
        // Partial match
        if (subject.toLowerCase().includes(theme.toLowerCase()) ||
            theme.toLowerCase().includes(subject.toLowerCase())) {
          return true;
        }
        // Special handling for sign types
        if (theme.includes('Sign') && subject.includes('Sign')) {
          return true;
        }
        return false;
      });
    };

    // Replace questions to cover missing themes
    // Priority: Replace from non-weak areas first, maintain structure
    for (const missingTheme of missingThemes) {
      // Try to find a question for this theme
      // Prefer regular questions first (easier to maintain structure)
      let replacement: RealExamQuestion | null = null;
      let questionToReplace: RealExamQuestion | null = null;

      // First, try to find a regular question for the missing theme
      const regularForTheme = findQuestionsForTheme(missingTheme, false);
      if (regularForTheme.length > 0) {
        // Find a non-weak-area regular question to replace
        const found = regularQuestions.find(q => {
          const subject = q.subject || '';
          return !focusAreas.some(area => 
            subject === area ||
            subject.toLowerCase().includes(area.toLowerCase()) ||
            area.toLowerCase().includes(subject.toLowerCase())
          );
        });
        if (found) {
          questionToReplace = found;
          replacement = regularForTheme[0];
        }
      }

      // If no regular replacement found, try image questions
      if (!replacement) {
        const imageForTheme = findQuestionsForTheme(missingTheme, true);
        if (imageForTheme.length > 0) {
          // Find a non-weak-area image question to replace
          const found = imageQuestions.find(q => {
            const subject = q.subject || '';
            return !focusAreas.some(area => 
              subject === area ||
              subject.toLowerCase().includes(area.toLowerCase()) ||
              area.toLowerCase().includes(subject.toLowerCase())
            );
          });
          if (found) {
            questionToReplace = found;
            replacement = imageForTheme[0];
          }
        }
      }

      // If still no replacement, replace from weak areas (last resort)
      if (!replacement) {
        const anyForTheme = findQuestionsForTheme(missingTheme, false).concat(
          findQuestionsForTheme(missingTheme, true)
        );
        if (anyForTheme.length > 0) {
          // Replace the least important weak-area question
          const found = updatedQuestions.find(q => {
            const subject = q.subject || '';
            return focusAreas.some(area => 
              subject === area ||
              subject.toLowerCase().includes(area.toLowerCase()) ||
              area.toLowerCase().includes(subject.toLowerCase())
            );
          });
          if (found) {
            questionToReplace = found;
            replacement = anyForTheme[0];
          }
        }
      }

      // Perform replacement
      if (replacement && questionToReplace) {
        const index = updatedQuestions.indexOf(questionToReplace);
        if (index !== -1) {
          updatedQuestions[index] = replacement;
          // Update regular/image arrays
          if (questionToReplace.imageUrl) {
            const imgIndex = imageQuestions.indexOf(questionToReplace);
            if (imgIndex !== -1) imageQuestions[imgIndex] = replacement;
          } else {
            const regIndex = regularQuestions.indexOf(questionToReplace);
            if (regIndex !== -1) regularQuestions[regIndex] = replacement;
          }
        }
      }
    }

    // Final verification: ensure structure is maintained
    const finalRegular = updatedQuestions.filter(q => !q.imageUrl);
    const finalImage = updatedQuestions.filter(q => q.imageUrl);

    if (finalRegular.length !== this.CBR_STRUCTURE.REGULAR_QUESTIONS ||
        finalImage.length !== this.CBR_STRUCTURE.IMAGE_QUESTIONS) {
      // Structure broken, rebuild while maintaining theme diversity
      const allRegular = availableQuestions.filter(q => !q.imageUrl);
      const allImage = availableQuestions.filter(q => q.imageUrl);

      // Build new selection ensuring theme coverage
      const newRegular: RealExamQuestion[] = [];
      const newImage: RealExamQuestion[] = [];
      const coveredThemes = new Set<string>();

      // First, add questions from weak areas (prioritized)
      for (const focusArea of focusAreas) {
        const matching = allRegular.filter(q => {
          const subject = q.subject || '';
          return subject === focusArea ||
            subject.toLowerCase().includes(focusArea.toLowerCase()) ||
            focusArea.toLowerCase().includes(subject.toLowerCase());
        });
        if (matching.length > 0 && newRegular.length < this.CBR_STRUCTURE.REGULAR_QUESTIONS) {
          newRegular.push(matching[0]);
          coveredThemes.add(focusArea);
        }
      }

      // Then, ensure all major themes are covered
      for (const theme of this.MAJOR_CBR_THEMES) {
        if (coveredThemes.has(theme)) continue;

        const matching = allRegular.filter(q => {
          if (newRegular.includes(q)) return false;
          const subject = q.subject || '';
          return subject === theme ||
            subject.toLowerCase().includes(theme.toLowerCase()) ||
            theme.toLowerCase().includes(subject.toLowerCase());
        });
        if (matching.length > 0 && newRegular.length < this.CBR_STRUCTURE.REGULAR_QUESTIONS) {
          newRegular.push(matching[0]);
          coveredThemes.add(theme);
        }
      }

      // Fill remaining regular slots
      const remainingRegular = allRegular
        .filter(q => !newRegular.includes(q))
        .slice(0, this.CBR_STRUCTURE.REGULAR_QUESTIONS - newRegular.length);
      newRegular.push(...remainingRegular);

      // Same for image questions
      for (const focusArea of focusAreas) {
        const matching = allImage.filter(q => {
          const subject = q.subject || '';
          return subject === focusArea ||
            subject.toLowerCase().includes(focusArea.toLowerCase()) ||
            focusArea.toLowerCase().includes(subject.toLowerCase());
        });
        if (matching.length > 0 && newImage.length < this.CBR_STRUCTURE.IMAGE_QUESTIONS) {
          newImage.push(matching[0]);
        }
      }

      for (const theme of this.MAJOR_CBR_THEMES) {
        if (newImage.length >= this.CBR_STRUCTURE.IMAGE_QUESTIONS) break;

        const matching = allImage.filter(q => {
          if (newImage.includes(q)) return false;
          const subject = q.subject || '';
          return subject === theme ||
            subject.toLowerCase().includes(theme.toLowerCase()) ||
            theme.toLowerCase().includes(subject.toLowerCase());
        });
        if (matching.length > 0) {
          newImage.push(matching[0]);
        }
      }

      const remainingImage = allImage
        .filter(q => !newImage.includes(q))
        .slice(0, this.CBR_STRUCTURE.IMAGE_QUESTIONS - newImage.length);
      newImage.push(...remainingImage);

      return [...newRegular.slice(0, this.CBR_STRUCTURE.REGULAR_QUESTIONS), 
              ...newImage.slice(0, this.CBR_STRUCTURE.IMAGE_QUESTIONS)];
    }

    return updatedQuestions.slice(0, this.CBR_STRUCTURE.TOTAL_QUESTIONS);
  }

  // Balance difficulty distribution (MAINTAINS CBR STRUCTURE: 30 regular + 20 image = 50 total)
  private balanceDifficulty(
    questions: RealExamQuestion[],
    difficultyLevel: number
  ): RealExamQuestion[] {
    // Separate by difficulty AND type (regular vs image)
    const easyRegular = questions.filter(q => q.difficulty === 'easy' && !q.imageUrl);
    const easyImage = questions.filter(q => q.difficulty === 'easy' && q.imageUrl);
    const mediumRegular = questions.filter(q => q.difficulty === 'medium' && !q.imageUrl);
    const mediumImage = questions.filter(q => q.difficulty === 'medium' && q.imageUrl);
    const hardRegular = questions.filter(q => q.difficulty === 'hard' && !q.imageUrl);
    const hardImage = questions.filter(q => q.difficulty === 'hard' && q.imageUrl);

    // Target distribution based on difficulty level
    // Always maintain: 30 regular + 20 image = 50 total
    let targetEasyRegular = 0, targetEasyImage = 0;
    let targetMediumRegular = 0, targetMediumImage = 0;
    let targetHardRegular = 0, targetHardImage = 0;

    if (difficultyLevel <= 3) {
      // Beginner: More easy questions
      targetEasyRegular = 16; targetEasyImage = 8; // 24 easy total
      targetMediumRegular = 14; targetMediumImage = 12; // 26 medium total
      targetHardRegular = 0; targetHardImage = 0; // 0 hard
    } else if (difficultyLevel <= 6) {
      // Intermediate: Balanced
      targetEasyRegular = 6; targetEasyImage = 4; // 10 easy total
      targetMediumRegular = 18; targetMediumImage = 12; // 30 medium total
      targetHardRegular = 6; targetHardImage = 4; // 10 hard total
    } else if (difficultyLevel <= 8) {
      // Advanced: More hard questions
      targetEasyRegular = 2; targetEasyImage = 2; // 4 easy total
      targetMediumRegular = 12; targetMediumImage = 12; // 24 medium total
      targetHardRegular = 16; targetHardImage = 6; // 22 hard total
    } else {
      // Expert: Mostly hard
      targetEasyRegular = 0; targetEasyImage = 0; // 0 easy
      targetMediumRegular = 8; targetMediumImage = 6; // 14 medium total
      targetHardRegular = 22; targetHardImage = 14; // 36 hard total
    }

    const selected: RealExamQuestion[] = [];
    
    // Select maintaining CBR structure (30 regular + 20 image)
    selected.push(...this.shuffleArray(easyRegular).slice(0, Math.min(targetEasyRegular, easyRegular.length)));
    selected.push(...this.shuffleArray(easyImage).slice(0, Math.min(targetEasyImage, easyImage.length)));
    selected.push(...this.shuffleArray(mediumRegular).slice(0, Math.min(targetMediumRegular, mediumRegular.length)));
    selected.push(...this.shuffleArray(mediumImage).slice(0, Math.min(targetMediumImage, mediumImage.length)));
    selected.push(...this.shuffleArray(hardRegular).slice(0, Math.min(targetHardRegular, hardRegular.length)));
    selected.push(...this.shuffleArray(hardImage).slice(0, Math.min(targetHardImage, hardImage.length)));

    // Fill remaining to maintain CBR structure
    const selectedRegular = selected.filter(q => !q.imageUrl);
    const selectedImage = selected.filter(q => q.imageUrl);
    
    const regularNeeded = this.CBR_STRUCTURE.REGULAR_QUESTIONS - selectedRegular.length;
    const imageNeeded = this.CBR_STRUCTURE.IMAGE_QUESTIONS - selectedImage.length;

    // Fill regular questions
    if (regularNeeded > 0) {
      const allRegular = [...easyRegular, ...mediumRegular, ...hardRegular]
        .filter(q => !selected.includes(q));
      selected.push(...this.shuffleArray(allRegular).slice(0, regularNeeded));
    }

    // Fill image questions
    if (imageNeeded > 0) {
      const allImage = [...easyImage, ...mediumImage, ...hardImage]
        .filter(q => !selected.includes(q));
      selected.push(...this.shuffleArray(allImage).slice(0, imageNeeded));
    }

    // Final check: ensure exactly 30 regular + 20 image
    const finalRegular = selected.filter(q => !q.imageUrl);
    const finalImage = selected.filter(q => q.imageUrl);
    
    if (finalRegular.length !== this.CBR_STRUCTURE.REGULAR_QUESTIONS || 
        finalImage.length !== this.CBR_STRUCTURE.IMAGE_QUESTIONS) {
      // Rebuild to maintain structure
      const allAvailable = [...easyRegular, ...easyImage, ...mediumRegular, ...mediumImage, ...hardRegular, ...hardImage]
        .filter(q => !selected.includes(q));
      
      // Take first 30 regular and 20 image from available
      const neededRegular = this.CBR_STRUCTURE.REGULAR_QUESTIONS - finalRegular.length;
      const neededImage = this.CBR_STRUCTURE.IMAGE_QUESTIONS - finalImage.length;
      
      const fillRegular = allAvailable.filter(q => !q.imageUrl).slice(0, neededRegular);
      const fillImage = allAvailable.filter(q => q.imageUrl).slice(0, neededImage);
      
      return [...finalRegular, ...finalImage, ...fillRegular, ...fillImage].slice(0, this.CBR_STRUCTURE.TOTAL_QUESTIONS);
    }

    return selected.slice(0, this.CBR_STRUCTURE.TOTAL_QUESTIONS);
  }

  // Calculate difficulty distribution
  private calculateDifficultyDistribution(questions: RealExamQuestion[]): {
    easy: number;
    medium: number;
    hard: number;
  } {
    return {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length
    };
  }

  // Get focus areas for display
  getFocusAreas(userHistory: TestResult[]): string[] {
    const weakAreas = this.analyzeWeakAreas(userHistory);
    return weakAreas.slice(0, 3).map(area => area.topic);
  }

  // Analyze exam results
  analyzeExamResults(
    examResults: { score: number; total: number; answers: Record<number, { correct: boolean; topic: string }> },
    userHistory: TestResult[]
  ): { summary: string; recommendations: string[] } {
    const percentage = Math.round((examResults.score / examResults.total) * 100);
    const weakAreas = this.analyzeWeakAreas(userHistory);

    let summary = '';
    if (percentage >= 80) {
      summary = 'Excellent performance! You\'re well prepared for the real exam.';
    } else if (percentage >= 60) {
      summary = 'Good progress! Keep practicing to improve your weak areas.';
    } else {
      summary = 'Keep practicing! Focus on your weak areas to improve.';
    }

    const recommendations: string[] = [];
    if (weakAreas.length > 0) {
      recommendations.push(`Focus on: ${weakAreas[0].topic} (current: ${weakAreas[0].score}%)`);
    }
    if (percentage < 60) {
      recommendations.push('Take more practice tests before attempting the real exam');
    }
    if (percentage >= 60 && percentage < 80) {
      recommendations.push('Take 1-2 more mock exams to build confidence');
    }

    return { summary, recommendations };
  }

  // Shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const dynamicMockExamService = new DynamicMockExamService();

