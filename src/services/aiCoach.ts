// AI Coach Service - Real intelligent recommendations based on user performance
// IMPORTANT: AI uses PERFORMANCE (scores, mastery, weak areas) - NOT time - for recommendations

import { cloudSave } from './cloudSave';
import { userAuth } from './userAuth';
import { adaptiveDifficultyService } from './adaptiveDifficultyService';

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
  // Get translated test name
  private getTranslatedTestName(testId: string, translate: (key: string) => string): string {
    const testNameMap: Record<string, string> = {
      'traffic-lights-signals': translate('testNames.trafficLightsSignals'),
      'priority-rules': translate('testNames.priorityRules'),
      'hazard-perception': translate('testNames.hazardPerception'),
      'speed-safety': translate('testNames.speedSafety'),
      'bicycle-interactions': translate('testNames.bicycleInteractions'),
      'roundabout-rules': translate('testNames.roundaboutRules'),
      'tram-interactions': translate('testNames.tramInteractions'),
      'pedestrian-crossings': translate('testNames.pedestrianCrossings'),
      'construction-zones': translate('testNames.constructionZones'),
      'weather-conditions': translate('testNames.weatherConditions'),
      'road-signs': translate('testNames.roadSigns'),
      'motorway-rules': translate('testNames.motorwayRules'),
      'vehicle-knowledge': translate('testNames.vehicleKnowledge'),
      'parking-rules': translate('testNames.parkingRules'),
      'environmental': translate('testNames.environmental'),
      'technology-safety': translate('testNames.technologySafety'),
      'alcohol-drugs': translate('testNames.alcoholDrugs'),
      'fatigue-rest': translate('testNames.fatigueRest'),
      'emergency-procedures': translate('testNames.emergencyProcedures'),
      'traffic-rules-signs': translate('testNames.trafficLightsSignals'), // Map old key to new translation
    };
    return testNameMap[testId] || TEST_METADATA[testId]?.name || testId;
  }

  // Save test result
  async saveTestResult(result: TestResult): Promise<void> {
    const history = this.getTestHistory();
    history.push(result);
    localStorage.setItem('testHistory', JSON.stringify(history));
    
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

  // Get top recommendation (STRICT WEAK AREA PRIORITY + ADAPTIVE LEARNING)
  // PRIORITY RULE: Weak areas ALWAYS come first. Other tests only if no weak areas exist.
  getTopRecommendation(translate?: (key: string) => string): TestRecommendation {
    const testScores = this.getTestScores();
    const ignores = this.getIgnoreCounts();
    const testHistory = this.getTestHistory();

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

    // ADAPTIVE LEARNING: Get user's difficulty level and identify weak topics
    const difficultyLevel = adaptiveDifficultyService.calculateDifficultyLevel(testHistory);
    
    // STEP 1: Identify ALL weak areas (score < 60% OR mastery < 60%)
    const weakAreas: Array<{ 
      testId: string; 
      score: number; 
      mastery: number;
      ignoreCount: number;
      isWeak: boolean; // True if score < 60 OR mastery < 60
    }> = [];
    
    Object.keys(TEST_METADATA).forEach(testId => {
      const testData = testScores[testId];
      const mastery = adaptiveDifficultyService.getTopicMastery(testId, testHistory);
      const score = testData?.average || 0;
      
      // A test is "weak" if:
      // - Score < 60% (has been taken and scored low)
      // - OR Mastery < 60% (adaptive learning identifies it as weak)
      // - OR Not practiced yet (score = 0, but we'll handle this separately)
      const isWeak = (score > 0 && score < 60) || (mastery > 0 && mastery < 60);
      
        weakAreas.push({
          testId,
        score,
        mastery,
        ignoreCount: ignores[testId] || 0,
        isWeak
        });
    });

    // STEP 2: Separate weak areas from other tests
    const actualWeakAreas = weakAreas.filter(area => area.isWeak && area.ignoreCount < 3);
    const otherTests = weakAreas.filter(area => !area.isWeak || area.ignoreCount >= 3);

    // STEP 3: STRICT PRIORITY - Only recommend from weak areas if they exist
    let candidateAreas: typeof weakAreas = [];
    
    if (actualWeakAreas.length > 0) {
      // PRIORITY RULE: Weak areas exist - ONLY recommend from weak areas
      candidateAreas = actualWeakAreas;
      
      // Sort weak areas by:
      // 1. Lowest score first (worst performance)
      // 2. Lowest mastery first (weakest topic)
      // 3. Less ignored first
      candidateAreas.sort((a, b) => {
        // First: by score (lower = worse = higher priority)
        if (a.score !== b.score && a.score > 0 && b.score > 0) {
          return a.score - b.score;
        }
        
        // Second: by mastery (lower = weaker = higher priority)
        if (a.mastery !== b.mastery && a.mastery > 0 && b.mastery > 0) {
          return a.mastery - b.mastery;
        }
        
        // Third: by ignore count (less ignored = higher priority)
      if (a.ignoreCount !== b.ignoreCount) {
        return a.ignoreCount - b.ignoreCount;
      }

        // Tie-breaker: prefer tests with actual scores over unpracticed
        if (a.score > 0 && b.score === 0) return -1;
        if (a.score === 0 && b.score > 0) return 1;
        
        return 0;
      });
    } else {
      // NO weak areas exist - only then recommend other tests
      // This includes:
      // - Unpracticed tests (score = 0, mastery = 0)
      // - Strong tests (score >= 60, mastery >= 60)
      candidateAreas = otherTests;
      
      // Sort other tests by:
      // 1. Unpracticed tests first (beginner path priority)
      // 2. Lower scores first (even if >= 60)
      // 3. Less ignored first
      candidateAreas.sort((a, b) => {
        // Unpracticed tests (score = 0) come first
        if (a.score === 0 && b.score > 0) return -1;
        if (a.score > 0 && b.score === 0) return 1;
        
        // Beginner path priority for unpracticed
        if (a.score === 0 && b.score === 0) {
          const aInPath = BEGINNER_PATH.includes(a.testId);
          const bInPath = BEGINNER_PATH.includes(b.testId);
          if (aInPath && !bInPath) return -1;
          if (!aInPath && bInPath) return 1;
        }
        
        // Then by score (lower first, even if >= 60)
        if (a.score !== b.score) {
      return a.score - b.score;
        }
        
        // Then by ignore count
        return a.ignoreCount - b.ignoreCount;
      });
    }

    // STEP 4: Get the top recommendation
    const topRecommendation = candidateAreas[0];
    if (!topRecommendation) {
      // Fallback (shouldn't happen, but just in case)
      return {
        testId: BEGINNER_PATH[0],
        testName: TEST_METADATA[BEGINNER_PATH[0]].name,
        reason: 'Start your learning journey',
        priority: 'high',
        score: 0,
        ignoreCount: 0
      };
    }

    const testName = translate ? this.getTranslatedTestName(topRecommendation.testId, translate) : TEST_METADATA[topRecommendation.testId].name;
    
    // STEP 5: Determine priority and reason based on whether it's a weak area
    let priority: 'critical' | 'high' | 'medium' = 'medium';
    let reason = 'Practice this to improve';

    if (topRecommendation.isWeak) {
      // WEAK AREA - Always critical priority
      priority = 'critical';
      if (topRecommendation.score < 40 || topRecommendation.mastery < 40) {
      reason = 'Critical weakness - focus here first';
      } else if (topRecommendation.score < 60 || topRecommendation.mastery < 60) {
        reason = 'Weak area - improve this before moving on';
      } else {
        reason = 'Needs improvement - practice this area';
      }
    } else {
      // NOT a weak area (only shown if no weak areas exist)
      if (topRecommendation.score === 0) {
        priority = 'high';
        reason = 'Start here - essential for exam success';
      } else if (topRecommendation.score < 88) {
      priority = 'high';
      reason = 'Almost ready - one more practice';
    } else {
      priority = 'medium';
      reason = 'Good progress - maintain skills';
      }
    }

    // Add context-aware reasoning
    const contextReason = this.getContextualReason(topRecommendation, testScores);

    return {
      testId: topRecommendation.testId,
      testName,
      reason: contextReason || reason,
      priority,
      score: topRecommendation.score,
      ignoreCount: topRecommendation.ignoreCount
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
  getAIInsights(translate?: (key: string) => string): AIInsight[] {
    const testScores = this.getTestScores();
    const recommendation = this.getTopRecommendation();
    const isReadyForMockExam = this.canUnlockMockExams();

    const insights: AIInsight[] = [];

    // 1. RED BOX - Mock Exam CTA if ready, otherwise top recommendation
    if (isReadyForMockExam) {
      insights.push({
        type: 'recommendation',
        message: translate ? translate('dashboard.startMockExam') : 'Start Mock Exam',
        priority: 'red',
        testId: 'mock-exam',
        explanation: translate ? translate('dashboard.readyToTest') : 'Ready to test your knowledge!'
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
    const secondPriority = this.getSecondPriority(testScores, recommendation.testId, translate);
    insights.push({
      type: 'mistake',
      message: secondPriority.testName,
      priority: 'amber',
      testId: secondPriority.testId,
      explanation: secondPriority.explanation
    });

    // 3. GREEN BOX - Strength/maintenance (ALWAYS)
    const strengthArea = this.getStrengthArea(testScores, translate);
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
  private getSecondPriority(testScores: any, excludeTestId: string, translate?: (key: string) => string): { testName: string; testId: string; explanation: string } {
    // Find second weakest area (not the top recommendation)
    const availableTests = Object.keys(TEST_METADATA).filter(id => id !== excludeTestId);
    
    if (availableTests.length === 0) {
      return {
        testName: translate ? translate('dashboard.practiceMore') : 'Practice More',
        testId: 'traffic-rules-signs',
        explanation: translate ? translate('dashboard.continueBuilding') : 'Continue building your foundation'
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
      explanation = translate ? translate('dashboard.notPracticedYet') : 'Not practiced yet - good next step';
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
  private getStrengthArea(testScores: any, translate?: (key: string) => string): { testName: string; testId: string; explanation: string } {
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
      explanation = translate ? `${bestTest.score}% - ${translate('dashboard.excellentMastery')}` : `${bestTest.score}% - excellent mastery`;
    } else if (bestTest.score >= 80) {
      explanation = translate ? `${bestTest.score}% - ${translate('dashboard.strongPerformance')}` : `${bestTest.score}% - strong performance`;
    } else if (bestTest.score >= 70) {
      explanation = translate ? `${bestTest.score}% - ${translate('dashboard.goodProgress')}` : `${bestTest.score}% - good progress`;
    } else if (bestTest.score > 0) {
      explanation = translate ? `${bestTest.score}% - ${translate('dashboard.buildingSkills')}` : `${bestTest.score}% - building skills`;
    } else {
      explanation = translate ? translate('dashboard.readyToStartLearning') : 'Ready to start learning';
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

  // Get study time (total time spent in app - tracked from dashboard entry)
  // IMPORTANT: This is for DISPLAY ONLY. AI recommendations use PERFORMANCE, not time.
  getStudyTime(): number {
    // Use actual tracked time from studyTimeTracker (starts when dashboard is entered)
    try {
      const { studyTimeTracker } = require('./studyTimeTracker');
      return studyTimeTracker.getStudyTimeHours();
    } catch (error) {
      // Fallback: estimate from questions if tracker not available
    const history = this.getTestHistory();
    const mockExamResults = this.getMockExamResults();
    const practiceQuestions = history.reduce((sum, result) => sum + result.totalQuestions, 0);
    const mockExamQuestions = mockExamResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const totalQuestions = practiceQuestions + mockExamQuestions;
      const hours = totalQuestions / 40; // 1.5 min per Q = 40 Q per hour
    return parseFloat(hours.toFixed(1));
    }
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

  // Get mock exam pass rate (2025 CBR format - all exams use 88% pass mark, 44/50 correct)
  getMockExamPassRate(): number {
    const mockExamResults = this.getMockExamResults();
    if (mockExamResults.length === 0) return 0;
    
    // All mock exams use 88% pass mark (44/50 questions) - 2025 CBR format
    const passedExams = mockExamResults.filter(result => result.percentage >= 88).length;
    
    return Math.round((passedExams / mockExamResults.length) * 100);
  }

  // Get individual test score
  getTestScore(testId: string): number | null {
    const testScores = this.getTestScores();
    const testData = testScores[testId];
    return testData ? testData.lastScore : null;
  }

  // Smart Study Plan - Game-changing features
  getSmartStudyPlan(translate?: (key: string) => string) {
    const testScores = this.getTestScores();
    const averageScore = this.getCombinedAverage();
    
    // Days remaining is no longer used (exam date selection removed)
    const daysRemaining = 0;
    
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
    const examPrediction = this.getExamPrediction(averageScore, weakAreas, daysRemaining, translate);

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

  private getExamPrediction(averageScore: number, weakAreas: any[], daysRemaining: number, translate?: (key: string) => string) {
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
      message = `Excellent progress! Keep it up!`;
    } else if (confidence >= 60) {
      message = `Good progress! You're doing well!`;
    } else if (confidence >= 40) {
      message = `Keep practicing to improve!`;
    } else {
      message = translate ? translate('dashboard.startWithBasics') : `Start with the basics and build up!`;
    }
    
    return { confidence: Math.round(confidence), message };
  }

  // Get user's performance per topic
  getTopicPerformance(): Record<string, { average: number; count: number; lastScore: number }> {
    return this.getTestScores();
  }

  // Get weak topics that need practice
  getWeakTopics(threshold: number = 60): string[] {
    const testScores = this.getTestScores();
    const weakTopics: string[] = [];
    
    Object.entries(testScores).forEach(([testId, data]) => {
      if (data.average < threshold) {
        weakTopics.push(testId);
      }
    });

    // Also include unpracticed tests
    Object.keys(TEST_METADATA).forEach(testId => {
      if (!testScores[testId] && !weakTopics.includes(testId)) {
        weakTopics.push(testId);
      }
    });

    return weakTopics;
  }

  // Check if mock exam should be personalized
  shouldPersonalizeMockExam(): boolean {
    const history = this.getTestHistory();
    // Personalize if user has taken at least 3 practice tests
    return history.length >= 3;
  }

  // Get recommended difficulty level for adaptive learning
  getRecommendedDifficulty(): number {
    const history = this.getTestHistory();
    if (history.length === 0) return 3; // Start at beginner-intermediate
    
    const recentTests = history.slice(-5);
    const scores = recentTests.map(test => test.percentage);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Simple mapping
    if (average >= 90) return 9;
    if (average >= 80) return 7;
    if (average >= 70) return 5;
    if (average >= 60) return 4;
    if (average >= 50) return 3;
    return 2;
  }
}

export const aiCoach = new AICoachService();

