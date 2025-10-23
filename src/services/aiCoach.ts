// AI Coach Service - Real intelligent recommendations based on user performance

import { cloudSave } from './cloudSave';
import { userAuth } from './userAuth';

export interface TestResult {
  testId: string;
  testName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
}

export interface TestRecommendation {
  testId: string;
  testName: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium';
  score: number;
  ignoreCount: number;
}

export interface AIInsight {
  type: 'mistake' | 'strength' | 'recommendation';
  message: string;
  priority: 'red' | 'amber' | 'green';
  testId?: string;
  explanation?: string;
  frequency?: number;
  lastOccurrence?: string;
}

// Test metadata
const TEST_METADATA: Record<string, { name: string; category: string }> = {
  'traffic-lights-signals': { name: 'Traffic Lights & Signals', category: 'signals' },
  'priority-rules': { name: 'Priority & Right of Way', category: 'rules' },
  'hazard-perception': { name: 'Hazard Perception', category: 'safety' },
  'speed-safety': { name: 'Speed & Safety', category: 'safety' },
  'bicycle-interactions': { name: 'Bicycle Interactions', category: 'interactions' },
  'roundabout-rules': { name: 'Roundabout Rules', category: 'rules' },
  'tram-interactions': { name: 'Tram Interactions', category: 'interactions' },
  'pedestrian-crossings': { name: 'Pedestrian Crossings', category: 'interactions' },
  'construction-zones': { name: 'Construction Zones', category: 'zones' },
  'weather-conditions': { name: 'Weather Conditions', category: 'safety' },
  'road-signs': { name: 'Road Signs', category: 'signs' },
  'motorway-rules': { name: 'Motorway Rules', category: 'rules' },
  'vehicle-knowledge': { name: 'Vehicle Knowledge', category: 'vehicles' },
  'parking-rules': { name: 'Parking Rules', category: 'rules' },
  'environmental': { name: 'Environmental Zones', category: 'zones' },
  'technology-safety': { name: 'Technology & Safety', category: 'technology' },
  'alcohol-drugs': { name: 'Alcohol & Drugs', category: 'safety' },
  'fatigue-rest': { name: 'Fatigue & Rest', category: 'safety' },
  'emergency-procedures': { name: 'Emergency Procedures', category: 'safety' },
  'insight-practice': { name: 'Insight Practice', category: 'advanced' },
  'traffic-rules-signs': { name: 'Traffic Rules & Signs', category: 'rules' },
};

// Default beginner path for new users
const BEGINNER_PATH = ['traffic-rules-signs', 'priority-rules', 'hazard-perception', 'speed-safety'];

class AICoachService {
  // Save test result
  async saveTestResult(result: TestResult): Promise<void> {
    console.log('💾 Saving test result:', result);
    const history = this.getTestHistory();
    history.push(result);
    localStorage.setItem('testHistory', JSON.stringify(history));
    console.log('💾 Test history after save:', history);
    
    // Save to cloud if user is logged in
    const currentUser = userAuth.getCurrentUser();
    if (currentUser) {
      const progressData = {
        testHistory: history,
        studyTime: this.getStudyTime(),
        averageScore: this.getCombinedAverage()
      };
      await cloudSave.saveProgress(currentUser.id, progressData);
    }
    
    // Clear ignore count when user completes a recommended test
    const currentRec = this.getTopRecommendation();
    if (currentRec.testId === result.testId) {
      this.clearIgnoreCount(result.testId);
    }
  }

  // Get all test history
  getTestHistory(): TestResult[] {
    const history = localStorage.getItem('testHistory');
    const parsed = history ? JSON.parse(history) : [];
    console.log('📚 Getting test history:', parsed);
    return parsed;
  }

  // Calculate average score per test
  getTestScores(): Record<string, { average: number; count: number; lastScore: number }> {
    const history = this.getTestHistory();
    const scores: Record<string, number[]> = {};
    
    history.forEach(result => {
      if (!scores[result.testId]) {
        scores[result.testId] = [];
      }
      scores[result.testId].push(result.percentage);
    });

    const testScores: Record<string, { average: number; count: number; lastScore: number }> = {};
    Object.keys(scores).forEach(testId => {
      const testScoreArray = scores[testId];
      const average = testScoreArray.reduce((a, b) => a + b, 0) / testScoreArray.length;
      testScores[testId] = {
        average: Math.round(average),
        count: testScoreArray.length,
        lastScore: testScoreArray[testScoreArray.length - 1]
      };
    });

    return testScores;
  }

  // Track recommendation ignore
  trackIgnore(testId: string): void {
    const ignores = this.getIgnoreCounts();
    ignores[testId] = (ignores[testId] || 0) + 1;
    localStorage.setItem('recommendationIgnores', JSON.stringify(ignores));
  }

  // Get ignore counts
  getIgnoreCounts(): Record<string, number> {
    const ignores = localStorage.getItem('recommendationIgnores');
    return ignores ? JSON.parse(ignores) : {};
  }

  // Clear ignore count
  clearIgnoreCount(testId: string): void {
    const ignores = this.getIgnoreCounts();
    delete ignores[testId];
    localStorage.setItem('recommendationIgnores', JSON.stringify(ignores));
  }

  // Get top recommendation (SMART LOGIC)
  getTopRecommendation(): TestRecommendation {
    const testScores = this.getTestScores();
    const ignores = this.getIgnoreCounts();

    // New user - recommend beginner path
    if (Object.keys(testScores).length === 0) {
      return {
        testId: BEGINNER_PATH[0],
        testName: TEST_METADATA[BEGINNER_PATH[0]].name,
        reason: 'Perfect starting point for beginners',
        priority: 'high',
        score: 0,
        ignoreCount: 0
      };
    }

    // Calculate weak areas
    const weakAreas: Array<{ testId: string; score: number; ignoreCount: number }> = [];
    
    Object.keys(TEST_METADATA).forEach(testId => {
      const testData = testScores[testId];
      if (testData) {
        weakAreas.push({
          testId,
          score: testData.average,
          ignoreCount: ignores[testId] || 0
        });
      } else {
        // Not practiced yet - add as potential
        weakAreas.push({
          testId,
          score: 0,
          ignoreCount: ignores[testId] || 0
        });
      }
    });

    // Sort by priority:
    // 1. Critical areas (score < 60%) that haven't been ignored too much
    // 2. Unpracticed tests in beginner path
    // 3. Lower scores first
    // 4. Less ignored first
    weakAreas.sort((a, b) => {
      // Critical and not over-ignored comes first
      const aCritical = a.score < 60 && a.ignoreCount < 3;
      const bCritical = b.score < 60 && b.ignoreCount < 3;
      if (aCritical && !bCritical) return -1;
      if (!aCritical && bCritical) return 1;

      // Then by ignore count (less ignored first)
      if (a.ignoreCount !== b.ignoreCount) {
        return a.ignoreCount - b.ignoreCount;
      }

      // Then by score (lower first)
      return a.score - b.score;
    });

    const topWeak = weakAreas[0];
    const testName = TEST_METADATA[topWeak.testId].name;
    
    // Determine priority and reason - Enhanced user-focused messaging
    let priority: 'critical' | 'high' | 'medium' = 'medium';
    let reason = 'Practice this to improve';

    if (topWeak.score === 0) {
      priority = 'high';
      reason = 'Start here - essential for exam success';
    } else if (topWeak.score < 60) {
      priority = 'critical';
      reason = 'Critical weakness - focus here first';
    } else if (topWeak.score < 88) {
      priority = 'high';
      reason = 'Almost ready - one more practice';
    } else {
      priority = 'medium';
      reason = 'Good progress - maintain skills';
    }

    // Add context-aware reasoning
    const contextReason = this.getContextualReason(topWeak, testScores);

    return {
      testId: topWeak.testId,
      testName,
      reason: contextReason || reason,
      priority,
      score: topWeak.score,
      ignoreCount: topWeak.ignoreCount
    };
  }

  // Get contextual reasoning for recommendations
  private getContextualReason(weakArea: { testId: string; score: number; ignoreCount: number }, testScores: any): string {
    const { testId, score } = weakArea;
    const testName = TEST_METADATA[testId].name;
    
    // Count total tests completed
    const completedTests = Object.keys(testScores).length;
    const totalTests = Object.keys(TEST_METADATA).length;
    const progressPercentage = Math.round((completedTests / totalTests) * 100);
    
    // Early learner context
    if (completedTests < 5) {
      if (score === 0) {
        return `Perfect starting point - ${testName} is fundamental`;
      }
      return `Build your foundation with ${testName}`;
    }
    
    // Mid-progress context
    if (completedTests < 15) {
      if (score < 60) {
        return `Focus on ${testName} - you're ${progressPercentage}% through all topics`;
      }
      return `Strengthen ${testName} - almost halfway there!`;
    }
    
    // Advanced learner context
    if (score < 60) {
      return `Final push on ${testName} - you're ${progressPercentage}% complete`;
    }
    
    if (score < 88) {
      return `Polish ${testName} - you're almost exam-ready!`;
    }
    
    return `Review ${testName} to maintain your ${score}% score`;
  }

  // Get AI Insights for dashboard - ALWAYS 3 boxes (RED, YELLOW, GREEN)
  getAIInsights(): AIInsight[] {
    const testScores = this.getTestScores();
    const recommendation = this.getTopRecommendation();
    const isReadyForMockExam = this.canUnlockMockExams();

    const insights: AIInsight[] = [];

    // 1. RED BOX - Mock Exam CTA if ready, otherwise top recommendation
    if (isReadyForMockExam) {
      insights.push({
        type: 'recommendation',
        message: 'Start Mock Exam',
        priority: 'red',
        testId: 'mock-exam',
        explanation: 'Ready to test your knowledge!'
      });
    } else {
        insights.push({
        type: 'recommendation',
        message: recommendation.testName,
        priority: 'red',
        testId: recommendation.testId,
        explanation: recommendation.reason
      });
    }

    // 2. YELLOW BOX - Second priority (ALWAYS)
    const secondPriority = this.getSecondPriority(testScores, recommendation.testId);
    insights.push({
      type: 'mistake',
      message: secondPriority.testName,
      priority: 'amber',
      testId: secondPriority.testId,
      explanation: secondPriority.explanation
    });

    // 3. GREEN BOX - Strength/maintenance (ALWAYS)
    const strengthArea = this.getStrengthArea(testScores);
      insights.push({
        type: 'strength',
      message: strengthArea.testName,
        priority: 'green',
      testId: strengthArea.testId,
      explanation: strengthArea.explanation
    });

    return insights; // Always return exactly 3
  }

  // Get second priority for YELLOW box
  private getSecondPriority(testScores: any, excludeTestId: string): { testName: string; testId: string; explanation: string } {
    // Find second weakest area (not the top recommendation)
    const availableTests = Object.keys(TEST_METADATA).filter(id => id !== excludeTestId);
    
    if (availableTests.length === 0) {
      return {
        testName: 'Practice More',
        testId: 'traffic-rules-signs',
        explanation: 'Continue building your foundation'
      };
    }

    // Sort by score (lowest first)
    const sortedTests = availableTests
      .map(testId => ({
        testId,
        score: testScores[testId]?.average || 0
      }))
      .sort((a, b) => a.score - b.score);

    const secondWeak = sortedTests[0];
    const testName = TEST_METADATA[secondWeak.testId].name;
    
    let explanation = '';
    if (secondWeak.score === 0) {
      explanation = 'Not practiced yet - good next step';
    } else if (secondWeak.score < 60) {
      explanation = `${secondWeak.score}% - needs improvement`;
    } else if (secondWeak.score < 80) {
      explanation = `${secondWeak.score}% - almost ready`;
    } else {
      explanation = `${secondWeak.score}% - maintain skills`;
    }

    return {
      testName,
      testId: secondWeak.testId,
      explanation
    };
  }

  // Get strength area for GREEN box
  private getStrengthArea(testScores: any): { testName: string; testId: string; explanation: string } {
    // Find best performing area
    const bestTest = Object.keys(TEST_METADATA)
      .map(testId => ({
        testId,
        score: testScores[testId]?.average || 0
      }))
      .sort((a, b) => b.score - a.score)[0];

    const testName = TEST_METADATA[bestTest.testId].name;
    
    let explanation = '';
    if (bestTest.score >= 90) {
      explanation = `${bestTest.score}% - excellent mastery`;
    } else if (bestTest.score >= 80) {
      explanation = `${bestTest.score}% - strong performance`;
    } else if (bestTest.score >= 70) {
      explanation = `${bestTest.score}% - good progress`;
    } else if (bestTest.score > 0) {
      explanation = `${bestTest.score}% - building skills`;
    } else {
      explanation = 'Ready to start learning';
    }

    return {
      testName,
      testId: bestTest.testId,
      explanation
    };
  }

  // Calculate overall practice average (for dashboard)
  getPracticeAverage(): number {
    const testScores = this.getTestScores();
    const scores = Object.values(testScores).map(t => t.average);
    
    if (scores.length === 0) return 0;
    
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(average);
  }

  // Get mock exam results from localStorage
  getMockExamResults(): TestResult[] {
    const mockExamResults: TestResult[] = [];
    
    // Check for all mock exam results (Exam 1, 2, 3)
    for (let i = 1; i <= 3; i++) {
      const result = localStorage.getItem(`mockExamResults_exam${i}`);
      if (result) {
        try {
          const data = JSON.parse(result);
          mockExamResults.push({
            testId: `mock-exam-${i}`,
            testName: `Exam ${i}`,
            score: data.score,
            totalQuestions: data.totalQuestions,
            percentage: data.percentage,
            date: new Date().toISOString() // Use current date as approximation
          });
        } catch (error) {
          console.error(`Error parsing mock exam ${i} result:`, error);
        }
      }
    }
    
    return mockExamResults;
  }

  // Get combined average (practice tests + mock exams)
  getCombinedAverage(): number {
    const practiceHistory = this.getTestHistory();
    const mockExamResults = this.getMockExamResults();
    
    // Combine all results
    const allResults = [...practiceHistory, ...mockExamResults];
    
    if (allResults.length === 0) return 0;
    
    const totalScore = allResults.reduce((sum, result) => sum + result.percentage, 0);
    return Math.round(totalScore / allResults.length);
  }

  // Get total questions (practice + mock exams)
  getTotalQuestions(): number {
    const practiceHistory = this.getTestHistory();
    const mockExamResults = this.getMockExamResults();
    
    const practiceQuestions = practiceHistory.reduce((sum, result) => sum + result.totalQuestions, 0);
    const mockExamQuestions = mockExamResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    
    return practiceQuestions + mockExamQuestions;
  }

  // Get study time (total time spent practicing)
  getStudyTime(): number {
    const history = this.getTestHistory();
    const mockExamResults = this.getMockExamResults();
    
    // Estimate: 1.5 minutes per question (realistic average)
    const practiceQuestions = history.reduce((sum, result) => sum + result.totalQuestions, 0);
    const mockExamQuestions = mockExamResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const totalQuestions = practiceQuestions + mockExamQuestions;
    
    const hours = totalQuestions / 40; // 1.5 min per Q = 40 Q per hour
    return parseFloat(hours.toFixed(1));
  }

  // Mock Exam Unlock System - UNLOCKED FOR TESTING
  canUnlockMockExams(): boolean {
    // UNLOCKED FOR TESTING - All mock exams are now accessible
    return true;
    
    // Original unlock logic (commented out for testing):
    // const completedTests = this.getTestHistory();
    // 
    // // Must complete at least 15 practice tests
    // if (completedTests.length < 15) return false;
    // 
    // // ALL practice tests must score 70% or higher
    // const hasLowScore = completedTests.some(test => test.percentage < 70);
    // if (hasLowScore) return false;
    // 
    // // Check minimum study time (3 hours)
    // const studyTime = this.getStudyTime();
    // if (studyTime < 3) return false;
    // 
    // return true;
  }

  // Get unlock progress for dashboard
  getUnlockProgress(): {
    completedTests: number;
    requiredTests: number;
    averageScore: number;
    requiredAverage: number;
    minTestScore: number;
    requiredMinScore: number;
    studyTime: number;
    requiredStudyTime: number;
    canUnlock: boolean;
  } {
    // UNLOCKED FOR TESTING - Show all requirements as met
    return {
      completedTests: 20, // Show as completed
      requiredTests: 15,
      averageScore: 85, // Show as above requirement
      requiredAverage: 75,
      minTestScore: 75, // Show as above requirement
      requiredMinScore: 70,
      studyTime: 5.0, // Show as above requirement
      requiredStudyTime: 3,
      canUnlock: true // Always unlocked for testing
    };
  }

  // Get mock exam average score
  getMockExamAverage(): number {
    const mockExamResults = this.getMockExamResults();
    if (mockExamResults.length === 0) return 0;
    
    const totalScore = mockExamResults.reduce((sum, result) => sum + result.percentage, 0);
    return Math.round(totalScore / mockExamResults.length);
  }

  // Get mock exam count
  getMockExamCount(): number {
    return this.getMockExamResults().length;
  }

  // Get mock exam pass rate (simplified - all exams use 52% pass mark)
  getMockExamPassRate(): number {
    const mockExamResults = this.getMockExamResults();
    if (mockExamResults.length === 0) return 0;
    
    // All mock exams use 52% pass mark (13/25 questions)
    const passedExams = mockExamResults.filter(result => result.percentage >= 52).length;
    
    return Math.round((passedExams / mockExamResults.length) * 100);
  }

  // Get individual test score
  getTestScore(testId: string): number | null {
    const testScores = this.getTestScores();
    const testData = testScores[testId];
    return testData ? testData.lastScore : null;
  }

  // Smart Study Plan - Game-changing features
  getSmartStudyPlan() {
    const testScores = this.getTestScores();
    const averageScore = this.getCombinedAverage();
    const examDate = localStorage.getItem('examDate');
    
    // Calculate days remaining
    const daysRemaining = examDate ? 
      Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Find weak areas (scores below 60%)
    const weakAreas = Object.entries(testScores)
      .filter(([_, data]) => data.average < 60)
      .map(([testId, data]) => ({
        testId,
        name: TEST_METADATA[testId]?.name || testId,
        score: data.average,
        lastScore: data.lastScore
      }))
      .sort((a, b) => a.score - b.score);

    // Find strong areas (scores above 80%)
    const strongAreas = Object.entries(testScores)
      .filter(([_, data]) => data.average >= 80)
      .map(([testId, data]) => ({
        testId,
        name: TEST_METADATA[testId]?.name || testId,
        score: data.average
      }));

    // Get today's focus topic
    const todayFocus = this.getTodayFocus(weakAreas, daysRemaining);
    
    // Calculate study time needed
    const studyTimeNeeded = this.calculateStudyTimeNeeded(averageScore, daysRemaining);
    
    // Get exam readiness prediction
    const examPrediction = this.getExamPrediction(averageScore, weakAreas, daysRemaining);

    return {
      todayFocus,
      weakAreas: weakAreas.slice(0, 2), // Top 2 weak areas
      strongAreas: strongAreas.slice(0, 2), // Top 2 strong areas
      studyTimeNeeded,
      daysRemaining,
      examPrediction,
      averageScore
    };
  }

  private getTodayFocus(weakAreas: any[], daysRemaining: number) {
    if (daysRemaining <= 0) return null;
    
    // If less than 7 days, focus on high-frequency topics
    if (daysRemaining < 7) {
      const highFrequencyTopics = ['traffic-lights-signals', 'priority-rules', 'speed-limits'];
      const availableTopics = weakAreas.filter(area => 
        highFrequencyTopics.includes(area.testId)
      );
      return availableTopics[0] || weakAreas[0];
    }
    
    // Otherwise focus on weakest area
    return weakAreas[0];
  }

  private calculateStudyTimeNeeded(averageScore: number, daysRemaining: number) {
    if (daysRemaining <= 0) return 0;
    
    const targetScore = 70; // 70% to be safe
    const scoreGap = Math.max(0, targetScore - averageScore);
    
    // 1 hour study = 5% improvement
    const hoursNeeded = Math.ceil(scoreGap / 5);
    const dailyMinutes = Math.ceil((hoursNeeded * 60) / daysRemaining);
    
    return Math.min(dailyMinutes, 60); // Max 1 hour per day
  }

  private getExamPrediction(averageScore: number, weakAreas: any[], daysRemaining: number) {
    if (daysRemaining <= 0) return null;
    
    // Base prediction on current score
    let confidence = averageScore;
    
    // Adjust based on weak areas
    const criticalWeakAreas = weakAreas.filter(area => area.score < 40);
    confidence -= criticalWeakAreas.length * 5;
    
    // Adjust based on time remaining
    if (daysRemaining < 7) {
      confidence -= 10; // Less time = lower confidence
    } else if (daysRemaining > 30) {
      confidence += 5; // More time = higher confidence
    }
    
    // Cap confidence between 0-100
    confidence = Math.max(0, Math.min(100, confidence));
    
    let message = '';
    if (confidence >= 80) {
      message = `You're ${confidence}% ready - exam confident!`;
    } else if (confidence >= 60) {
      message = `You're ${confidence}% ready - almost there!`;
    } else if (confidence >= 40) {
      message = `You're ${confidence}% ready - focus on weak areas`;
    } else {
      message = `You're ${confidence}% ready - start with basics`;
    }
    
    return { confidence: Math.round(confidence), message };
  }
}

export const aiCoach = new AICoachService();

