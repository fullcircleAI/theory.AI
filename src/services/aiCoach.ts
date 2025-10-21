// AI Coach Service - Real intelligent recommendations based on user performance

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
  saveTestResult(result: TestResult): void {
    console.log('💾 Saving test result:', result);
    const history = this.getTestHistory();
    history.push(result);
    localStorage.setItem('testHistory', JSON.stringify(history));
    console.log('💾 Test history after save:', history);
    
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
    const allTestIds = Object.keys(TEST_METADATA);

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
    
    allTestIds.forEach(testId => {
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
    
    // Determine priority and reason - 3-tier traffic light system
    let priority: 'critical' | 'high' | 'medium' = 'medium';
    let reason = 'Practice this to improve';

    if (topWeak.score === 0) {
      priority = 'high';
      reason = 'Not practiced yet';
    } else if (topWeak.score < 60) {
      priority = 'critical';
      reason = 'Needs practice';
    } else if (topWeak.score < 88) {
      priority = 'high';
      reason = 'Keep improving';
    }

    return {
      testId: topWeak.testId,
      testName,
      reason,
      priority,
      score: topWeak.score,
      ignoreCount: topWeak.ignoreCount
    };
  }

  // Get AI Insights for dashboard
  getAIInsights(): AIInsight[] {
    const testScores = this.getTestScores();
    const recommendation = this.getTopRecommendation();
    const allTestIds = Object.keys(TEST_METADATA);

    const insights: AIInsight[] = [];

    // 1. Top recommendation (RED)
    insights.push({
      type: 'recommendation',
      message: recommendation.testName,
      priority: recommendation.priority === 'critical' ? 'red' : 'amber',
      testId: recommendation.testId,
      explanation: recommendation.reason
    });

    // 2. Find a mistake area (AMBER)
    const mistakeArea = allTestIds.find(testId => {
      const score = testScores[testId];
      return score && score.average >= 60 && score.average < 75 && testId !== recommendation.testId;
    });

    if (mistakeArea) {
      const score = testScores[mistakeArea];
      insights.push({
        type: 'mistake',
        message: TEST_METADATA[mistakeArea].name,
        priority: 'amber',
        testId: mistakeArea,
        explanation: `${score.average}% - needs improvement`
      });
    } else {
      // Fallback: Show second weakest
      const weakAreas = Object.keys(testScores)
        .filter(id => id !== recommendation.testId)
        .sort((a, b) => testScores[a].average - testScores[b].average);
      
      if (weakAreas.length > 0) {
        const secondWeak = weakAreas[0];
        insights.push({
          type: 'mistake',
          message: TEST_METADATA[secondWeak].name,
          priority: 'amber',
          testId: secondWeak,
          explanation: `${testScores[secondWeak].average}% - needs practice`
        });
      }
    }

    // 3. Find a strength area (GREEN)
    const strengthArea = allTestIds.find(testId => {
      const score = testScores[testId];
      return score && score.average >= 85;
    });

    if (strengthArea) {
      const score = testScores[strengthArea];
      insights.push({
        type: 'strength',
        message: TEST_METADATA[strengthArea].name,
        priority: 'green',
        testId: strengthArea,
        explanation: `${score.average}% - good progress`
      });
    } else {
      // No strengths yet - encourage
      insights.push({
        type: 'strength',
        message: 'Keep Practicing',
        priority: 'green',
        explanation: 'You\'re building skills'
      });
    }

    return insights.slice(0, 3); // Return top 3
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

  // Mock Exam Unlock System
  canUnlockMockExams(): boolean {
    const completedTests = this.getTestHistory();
    const averageScore = this.getPracticeAverage();
    const studyTime = this.getStudyTime();
    
    // Check if minimum number of tests completed
    if (completedTests.length < 15) return false;
    
    // Check if average score meets requirement
    if (averageScore < 75) return false;
    
    // Check if any individual test is below 70%
    const hasLowScore = completedTests.some(test => test.percentage < 70);
    if (hasLowScore) return false;
    
    // Check if minimum study time met
    if (studyTime < 3) return false;
    
    return true;
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
    const completedTests = this.getTestHistory();
    const averageScore = this.getPracticeAverage();
    const studyTime = this.getStudyTime();
    
    // Find minimum test score
    const minTestScore = completedTests.length > 0 
      ? Math.min(...completedTests.map(test => test.percentage))
      : 0;
    
    return {
      completedTests: completedTests.length,
      requiredTests: 15,
      averageScore: Math.round(averageScore),
      requiredAverage: 75,
      minTestScore: Math.round(minTestScore),
      requiredMinScore: 70,
      studyTime: Math.round(studyTime * 10) / 10,
      requiredStudyTime: 3,
      canUnlock: this.canUnlockMockExams()
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

  // Get mock exam pass rate
  getMockExamPassRate(): number {
    const mockExamResults = this.getMockExamResults();
    if (mockExamResults.length === 0) return 0;
    
    const passedExams = mockExamResults.filter(result => result.percentage >= 70).length;
    return Math.round((passedExams / mockExamResults.length) * 100);
  }

  // Get individual test score
  getTestScore(testId: string): number | null {
    const testScores = this.getTestScores();
    const testData = testScores[testId];
    return testData ? testData.lastScore : null;
  }
}

export const aiCoach = new AICoachService();

