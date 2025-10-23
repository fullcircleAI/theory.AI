import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from './Navigation';
import { PullToRefresh } from './PullToRefresh';
import AITutor from './AITutor';
import { aiCoach } from '../services/aiCoach';
import type { AIInsight } from '../services/aiCoach';
import './AICoachDashboard.css';
import '../mobile-optimizations.css';

interface UserProgress {
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  studyTime: number;
  weakAreas: string[];
  strongAreas: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface ReadinessStatus {
  status: string;
  color: string;
  emoji: string;
  message: string;
}

interface TimeRemaining {
  remaining: number;
  percentage: number;
  timeMessage: string;
}

// Utility functions for exam readiness calculation
const calculateVariance = (scores: number[]): number => {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  return variance;
};

const calculateImprovementTrend = (tests: any[]): number => {
  if (tests.length < 3) return 0;
  const scores = tests.map(t => t.percentage);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  return (secondAvg - firstAvg) / firstAvg;
};

const calculateDifficultyBonus = (testHistory: any[]): number => {
  const difficultTopics = ['hazard-perception', 'priority-rules', 'motorway-rules'];
  const completedDifficult = testHistory.filter(test => 
    difficultTopics.includes(test.testId) && test.percentage >= 70
  ).length;
  
  return Math.min(5, completedDifficult * 2);
};

const calculateTimeBonus = (testHistory: any[]): number => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentTests = testHistory.filter(test => 
    new Date(test.date) > sevenDaysAgo
  );
  
  return Math.min(3, recentTests.length);
};

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = {
  'first-test': {
    title: 'First Steps! 🎯',
    description: 'Completed your first practice test',
    icon: '🎯',
    color: '#10b981'
  },
  '1-hour': {
    title: 'Dedicated Learner! ⏰',
    description: 'Studied for 1 hour',
    icon: '⏰',
    color: '#3b82f6'
  },
  '5-hours': {
    title: 'Study Champion! 🏆',
    description: 'Studied for 5 hours',
    icon: '🏆',
    color: '#f59e0b'
  },
  '70-percent': {
    title: 'Passing Grade! 📈',
    description: 'Achieved 70% average score',
    icon: '📈',
    color: '#10b981'
  },
  '85-percent': {
    title: 'Exam Ready! 🎉',
    description: 'Achieved 85% average score',
    icon: '🎉',
    color: '#10b981'
  },
  'first-mock': {
    title: 'Mock Exam Master! 🎭',
    description: 'Completed your first mock exam',
    icon: '🎭',
    color: '#8b5cf6'
  },
  '100-questions': {
    title: 'Question Master! ❓',
    description: 'Answered 100 questions',
    icon: '❓',
    color: '#06b6d4'
  },
  '500-questions': {
    title: 'Theory Expert! 🧠',
    description: 'Answered 500 questions',
    icon: '🧠',
    color: '#f59e0b'
  }
} as const;

export const AICoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [userProgress, setUserProgress] = useState<UserProgress>({
    averageScore: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    studyTime: 0,
    weakAreas: [],
    strongAreas: []
  });

  // Constants for better maintainability
  const TARGET_STUDY_HOURS = 24;
  const MOCK_EXAM_PASS_THRESHOLD = 52;
  const TOTAL_MOCK_EXAMS = 3;
  
  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showAITutor, setShowAITutor] = useState(false);
  const [examDate, setExamDate] = useState<string | null>(null);
  const [smartStudyPlan, setSmartStudyPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);

  // Achievement System - Check for new achievements
  const checkAchievements = useCallback(() => {
    const testHistory = aiCoach.getTestHistory();
    const mockExamResults = aiCoach.getMockExamResults();
    const { averageScore, studyTime, totalQuestions } = userProgress;
    
    const newAchievements: Achievement[] = [];
    
    // Helper function to check if achievement already exists
    const hasAchievement = (id: string) => achievements.some(a => a.id === id);
    
    // Achievement checks
    const achievementChecks = [
      { condition: testHistory.length >= 1, id: 'first-test' },
      { condition: studyTime >= 1, id: '1-hour' },
      { condition: studyTime >= 5, id: '5-hours' },
      { condition: averageScore >= 70, id: '70-percent' },
      { condition: averageScore >= 85, id: '85-percent' },
      { condition: mockExamResults.length >= 1, id: 'first-mock' },
      { condition: totalQuestions >= 100, id: '100-questions' },
      { condition: totalQuestions >= 500, id: '500-questions' }
    ];
    
    achievementChecks.forEach(({ condition, id }) => {
      if (condition && !hasAchievement(id)) {
        newAchievements.push({
          id,
          ...ACHIEVEMENT_DEFINITIONS[id as keyof typeof ACHIEVEMENT_DEFINITIONS]
        });
      }
    });
    
    // Show first new achievement
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      setShowAchievement(newAchievements[0]);
      
      // Auto-hide achievement after 4 seconds
      setTimeout(() => {
        setShowAchievement(null);
      }, 4000);
    }
  }, [achievements, userProgress]);

  // Data loading function - extracted for reusability
  const loadDashboardData = useCallback(async () => {
    try {
      const testHistory = aiCoach.getTestHistory();
      const studyTime = aiCoach.getStudyTime();
      const averageScore = aiCoach.getCombinedAverage();
      
      const realData: UserProgress = {
        averageScore,
        totalQuestions: aiCoach.getTotalQuestions(),
        correctAnswers: testHistory.reduce((sum, t) => sum + t.score, 0),
        studyTime,
        weakAreas: [],
        strongAreas: []
      };

      const realInsights = aiCoach.getAIInsights();
      
      let smartPlan = null;
      try {
        smartPlan = aiCoach.getSmartStudyPlan();
      } catch (smartPlanError) {
        console.error('Error loading smart study plan:', smartPlanError);
      }

      setUserProgress(realData);
      setAiInsights(realInsights);
      setSmartStudyPlan(smartPlan);
      
      // Check for achievements after data is loaded
      setTimeout(checkAchievements, 1000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set fallback data
      setUserProgress({
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        studyTime: 0,
        weakAreas: [],
        strongAreas: []
      });
      setAiInsights([]);
      setSmartStudyPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [checkAchievements]);

  // Mobile detection
  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroidDevice = /Android/.test(userAgent);
      
      setIsMobile(isMobileDevice);
      setIsIOS(isIOSDevice);
      setIsAndroid(isAndroidDevice);
      
      // Add mobile-specific classes to body
      if (isMobileDevice) {
        document.body.classList.add('mobile-device');
      }
      if (isIOSDevice) {
        document.body.classList.add('ios-device');
      }
      if (isAndroidDevice) {
        document.body.classList.add('android-device');
      }
    };
    
    detectMobile();
  }, []);

  useEffect(() => {
    // Load exam date if set
    const savedExamDate = localStorage.getItem('examDate');
    if (savedExamDate) {
      setExamDate(savedExamDate);
    }

    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(async () => {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    await loadDashboardData();
  }, [loadDashboardData]);


  // Calculate Exam Readiness - Memoized for performance
  const getExamReadiness = useMemo(() => {
    const { averageScore, studyTime, totalQuestions } = userProgress;
    
    // Study time bonus: +1% per hour, max +15%
    const studyBonus = Math.min(15, studyTime);
    
    // Practice bonus: +1% per 50 questions, max +10%
    const practiceBonus = Math.min(10, Math.floor(totalQuestions / 50));
    
    // Mock exam bonus: +5% per passed exam, max +15%
    const mockExamResults = aiCoach.getMockExamResults();
    const passedMockExams = mockExamResults.filter(result => result.percentage >= MOCK_EXAM_PASS_THRESHOLD).length;
    const mockExamBonus = Math.min(15, passedMockExams * 5);
    
    // Consistency bonus - reward consistent performance
    const testHistory = aiCoach.getTestHistory();
    const recentTests = testHistory.slice(-5);
    let consistencyBonus = 0;
    
    if (recentTests.length >= 3) {
      const allAbove70 = recentTests.every(test => test.percentage >= 70);
      const allAbove80 = recentTests.every(test => test.percentage >= 80);
      const variance = calculateVariance(recentTests.map(t => t.percentage));
      
      if (allAbove80) {
        consistencyBonus = 8;
      } else if (allAbove70 && variance < 100) {
        consistencyBonus = 5;
      } else if (allAbove70) {
        consistencyBonus = 3;
      }
    }
    
    // Recent improvement bonus
    let recentImprovement = 0;
    if (recentTests.length >= 3) {
      const improvementTrend = calculateImprovementTrend(recentTests);
      if (improvementTrend > 0.1) {
        recentImprovement = 5;
      } else if (improvementTrend > 0.05) {
        recentImprovement = 3;
      }
    }
    
    const difficultyBonus = calculateDifficultyBonus(testHistory);
    const timeBonus = calculateTimeBonus(testHistory);
    
    const readiness = Math.min(100, 
      averageScore + studyBonus + practiceBonus + mockExamBonus + 
      consistencyBonus + recentImprovement + difficultyBonus + timeBonus
    );
    
    return Math.round(readiness);
  }, [userProgress]);

  const getReadinessStatus = useCallback((confidence: number): ReadinessStatus => {
    const mockExamResults = aiCoach.getMockExamResults();
    const totalMockExams = TOTAL_MOCK_EXAMS;
    const passedMockExams = mockExamResults.filter(result => result.percentage >= MOCK_EXAM_PASS_THRESHOLD).length;
    
    if (passedMockExams < totalMockExams) {
      return { 
        status: '', 
        color: '#ef4444', 
        emoji: '',
        message: ''
      };
    }
    
    if (confidence >= 85) {
      return { 
        status: '', 
        color: '#10b981', 
        emoji: '',
        message: ''
      };
    } else if (confidence >= 70) {
      return { 
        status: '', 
        color: '#f59e0b', 
        emoji: '',
        message: ''
      };
    } else if (confidence >= 50) {
      return { 
        status: '', 
        color: '#3b82f6', 
        emoji: '',
        message: ''
      };
    } else {
      return { 
        status: '', 
        color: '#ef4444', 
        emoji: '',
        message: ''
      };
    }
  }, []);


  const formatTime = useCallback((hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }, []);

  const getTimeRemaining = useMemo((): TimeRemaining => {
    const targetHours = TARGET_STUDY_HOURS;
    const remaining = Math.max(0, targetHours - userProgress.studyTime);
    const percentage = Math.min(100, (userProgress.studyTime / targetHours) * 100);
    
    const timeMessages = {
      early: 'Just getting started!',
      progress: 'Great progress!',
      onTrack: 'You\'re on track!',
      almost: 'Almost there!',
      complete: 'Challenge complete!'
    };
    
    let timeMessage = timeMessages.early;
    if (userProgress.studyTime >= 24) timeMessage = timeMessages.complete;
    else if (userProgress.studyTime >= 16) timeMessage = timeMessages.almost;
    else if (userProgress.studyTime >= 8) timeMessage = timeMessages.onTrack;
    else if (userProgress.studyTime >= 2) timeMessage = timeMessages.progress;
    
    return { remaining, percentage, timeMessage };
  }, [userProgress.studyTime]);

  const navigateToRecommendedTest = useCallback((insight: AIInsight) => {
    if (insight.testId === 'mock-exam') {
      navigate('/mock-exam');
      return;
    }
    
    const testId = insight.testId || 'traffic-rules-signs';
    navigate(`/practice/${testId}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="main-layout">
        <Navigation />
        <main className="main-content">
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <div className="loading-text">
              <h3>Loading your progress...</h3>
              <p>Analyzing your study data and generating insights</p>
            </div>
            <div className="loading-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`main-layout ${isMobile ? 'mobile-device' : ''} ${isIOS ? 'ios-device' : ''} ${isAndroid ? 'android-device' : ''}`}>
      <Navigation />
      <main className="main-content">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="dashboard">
          {/* Summarized Learning Progress */}
          <div className="dashboard-summary">
            <div className="summary-stats">
              <div className="summary-stat">
                <div className="stat-number">{getExamReadiness}%</div>
                <div className="stat-label">
                  Exam Readiness
                  {examDate && (
                    <div className="exam-date-display">
                      {new Date(examDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" 
                       style={{ 
                         width: `${getExamReadiness}%`,
                         backgroundColor: getReadinessStatus(getExamReadiness).color
                       }}></div>
                </div>
                <div className="readiness-status">
                  <span className="status-text">{getReadinessStatus(getExamReadiness).status}</span>
                </div>
              </div>
              <div className="summary-stat combined-progress">
                <div className="digital-watch-container">
                  <div className="digital-watch-display">
                    <div className="time-section">
                      <span className="time-label">{t('dashboard.studyTime')}</span>
                      <span className="time-value">{formatTime(userProgress.studyTime)}</span>
                      {smartStudyPlan?.studyTimeNeeded && smartStudyPlan.studyTimeNeeded > 0 && (
                        <div className="smart-focus">
                          Study {smartStudyPlan.studyTimeNeeded} min today
                        </div>
                      )}
                    </div>
                    <div className="progress-section">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" 
                             style={{ 
                               width: `${Math.min((userProgress.studyTime / TARGET_STUDY_HOURS) * 100, 100)}%`,
                               backgroundColor: '#10b981'
                             }}></div>
                      </div>
                    </div>
                    <div className="time-section">
                      <span className="time-label">{t('dashboard.timeRemaining')}</span>
                      <span className="time-value">{formatTime(getTimeRemaining.remaining)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* AI Insights Summary */}
          <div className="ai-insights-summary">
            <h3>{t('dashboard.yourProgress')}</h3>
            <div className="insights-grid">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`insight-card ${insight.priority}`}>
                  <div className="insight-content">
                    <h4>{insight.message}</h4>
                    {insight.explanation && (
                      <p className="insight-explanation">{insight.explanation}</p>
                    )}
                    {insight.frequency && insight.frequency > 0 && (
                      <p className="insight-frequency">{insight.frequency} times • {insight.lastOccurrence}</p>
                    )}
                    {/* Enhanced Smart Study Plan Insights */}
                    {smartStudyPlan && (
                      <>
                        {insight.priority === 'red' && smartStudyPlan.todayFocus && (
                          <div className="smart-insight">
                            <div className="smart-focus-header">
                              <span className="focus-title">Today's Focus</span>
                            </div>
                            <div className="focus-details">
                              <strong>{smartStudyPlan.todayFocus.name}</strong>
                              <span className="focus-time">{smartStudyPlan.studyTimeNeeded} min</span>
                            </div>
                            {smartStudyPlan.todayFocus.score && (
                              <div className="focus-score">
                                Current: {Math.round(smartStudyPlan.todayFocus.score)}% • Target: 80%
                              </div>
                            )}
                          </div>
                        )}
                        {insight.priority === 'amber' && smartStudyPlan.weakAreas && smartStudyPlan.weakAreas.length > 0 && (
                          <div className="smart-weakness">
                            <div className="weakness-header">
                              <span className="weakness-title">Needs Attention</span>
                            </div>
                            <div className="weakness-details">
                              <strong>{smartStudyPlan.weakAreas[0].name}</strong>
                              <span className="weakness-score">{Math.round(smartStudyPlan.weakAreas[0].score)}%</span>
                            </div>
                            <div className="weakness-tip">
                              Focus on this area to improve your overall readiness
                            </div>
                          </div>
                        )}
                        {insight.priority === 'green' && smartStudyPlan.examPrediction && (
                          <div className="smart-confidence">
                            <div className="confidence-message-small">
                            {smartStudyPlan.examPrediction.message}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {/* Show Start button for recommendation insights */}
                    {insight.type === 'recommendation' && (
                      <button 
                        className="start-practice-btn"
                        onClick={() => navigateToRecommendedTest(insight)}
                      >
                        <span className="btn-text">{t('dashboard.startPractice')}</span>
                        <span className="btn-time">20 min</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating AI Tutor Button - Enhanced for Mobile */}
          <div className={`floating-ai-tutor ${isMobile ? 'mobile-floating' : ''} ${isIOS ? 'ios-floating' : ''} ${isAndroid ? 'android-floating' : ''}`}>
            <button 
              className={`floating-ai-btn-mascot touch-target ${isMobile ? 'haptic-light' : ''}`}
              onClick={() => setShowAITutor(true)}
              title="Ask Coach"
              aria-label="Open AI Tutor"
            >
              <img src="/images/mascot.png" alt="Coach" className="floating-mascot-full" />
            </button>
          </div>

          </div>
        </PullToRefresh>
      </main>


      {/* Achievement Notification - Enhanced for Mobile */}
      {showAchievement && (
        <div className={`achievement-notification ${isMobile ? 'mobile-achievement' : ''} ${isIOS ? 'ios-achievement' : ''} ${isAndroid ? 'android-achievement' : ''}`}>
          <div className="achievement-content">
            <div className="achievement-icon" style={{ backgroundColor: showAchievement.color }}>
              {showAchievement.icon}
            </div>
            <div className="achievement-text">
              <h4>{showAchievement.title}</h4>
              <p>{showAchievement.description}</p>
            </div>
            <button 
              className={`achievement-close touch-target ${isMobile ? 'haptic-light' : ''}`}
              onClick={() => setShowAchievement(null)}
              aria-label="Close achievement notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* AI Tutor Modal */}
      {showAITutor && (
        <AITutor
          userProgress={userProgress}
          currentTest="dashboard"
          onClose={() => setShowAITutor(false)}
        />
      )}
    </div>
  );
};
