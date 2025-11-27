import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { PullToRefresh } from './PullToRefresh';
import AITutor from './AITutor';
import { RoadProgress } from './RoadProgress';
import { aiCoach } from '../services/aiCoach';
import type { AIInsight } from '../services/aiCoach';
import { logger } from '../utils/logger';
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


// Achievement definitions - now using translation function
const getAchievementDefinitions = (t_nested: (key: string) => string) => ({
  'first-test': {
    title: t_nested('achievements.firstTest.title'),
    description: t_nested('achievements.firstTest.description'),
    icon: '',
    color: '#10b981'
  },
  '1-hour': {
    title: t_nested('achievements.oneHour.title'),
    description: t_nested('achievements.oneHour.description'),
    icon: '',
    color: '#3b82f6'
  },
  '5-hours': {
    title: t_nested('achievements.fiveHours.title'),
    description: t_nested('achievements.fiveHours.description'),
    icon: '',
    color: '#f59e0b'
  },
  '70-percent': {
    title: t_nested('achievements.seventyPercent.title'),
    description: t_nested('achievements.seventyPercent.description'),
    icon: '',
    color: '#10b981'
  },
  '85-percent': {
    title: t_nested('achievements.eightyFivePercent.title'),
    description: t_nested('achievements.eightyFivePercent.description'),
    icon: '',
    color: '#10b981'
  },
  'first-mock': {
    title: t_nested('achievements.firstMock.title'),
    description: t_nested('achievements.firstMock.description'),
    icon: '',
    color: '#8b5cf6'
  },
  '100-questions': {
    title: t_nested('achievements.hundredQuestions.title'),
    description: t_nested('achievements.hundredQuestions.description'),
    icon: '',
    color: '#06b6d4'
  },
  '500-questions': {
    title: t_nested('achievements.fiveHundredQuestions.title'),
    description: t_nested('achievements.fiveHundredQuestions.description'),
    icon: '',
    color: '#f59e0b'
  }
});

// Format study time (hours) to HH:MM:SS
const formatStudyTime = (hours: number): string => {
  const totalSeconds = Math.floor(hours * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const AICoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t_nested } = useLanguage();
  
  const [userProgress, setUserProgress] = useState<UserProgress>({
    averageScore: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    studyTime: 0,
    weakAreas: [],
    strongAreas: []
  });

  // Constants for better maintainability
  const MOCK_EXAM_PASS_THRESHOLD = 88; // 2025 CBR format: 44/50 correct (88%)
  const TOTAL_MOCK_EXAMS = 3;
  
  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showAITutor, setShowAITutor] = useState(false);
  const [smartStudyPlan, setSmartStudyPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);

  // Achievement System - Check for new achievements (Optimized for performance)
  const checkAchievements = useCallback(() => {
    const testHistory = aiCoach.getTestHistory();
    const mockExamResults = aiCoach.getMockExamResults();
    const { averageScore, studyTime, totalQuestions } = userProgress;
    
    const newAchievements: Achievement[] = [];
    
    // Helper function to check if achievement already exists
    const hasAchievement = (id: string) => achievements.some(a => a.id === id);
    
    // Achievement checks (inline array for better performance)
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
    
    const achievementDefinitions = getAchievementDefinitions(t_nested);
    
    achievementChecks.forEach(({ condition, id }) => {
      if (condition && !hasAchievement(id)) {
        newAchievements.push({
          id,
          ...achievementDefinitions[id as keyof typeof achievementDefinitions]
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
  }, [achievements, userProgress, t_nested]);

  // Calculate Journey Progress (based on completed practice tests and mock exams with minimum scores)
  const journeyProgress = useMemo(() => {
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
    
    const PRACTICE_TEST_MIN_SCORE = 80;
    const MOCK_EXAM_MIN_SCORE = 88;
    const TOTAL_PRACTICE_TESTS = Object.keys(TEST_METADATA).length;
    const TOTAL_MOCK_EXAMS = 3;
    
    const testScores = aiCoach.getTestScores();
    const completedPracticeTests = Object.entries(testScores).filter(([testId, data]) => {
      return TEST_METADATA[testId] && data.average >= PRACTICE_TEST_MIN_SCORE;
    }).length;
    
    const mockExamResults = aiCoach.getMockExamResults();
    const completedMockExams = mockExamResults.filter(result => result.percentage >= MOCK_EXAM_MIN_SCORE).length;
    
    const practiceProgress = (completedPracticeTests / TOTAL_PRACTICE_TESTS) * 50;
    const mockExamProgress = (completedMockExams / TOTAL_MOCK_EXAMS) * 50;
    const totalProgress = Math.min(100, Math.round(practiceProgress + mockExamProgress));
    
    return { progress: totalProgress, practiceTests: completedPracticeTests, mockExams: completedMockExams };
  }, [userProgress.averageScore, userProgress.totalQuestions]);

  // Data loading function - extracted for reusability (Optimized with error handling)
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
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

        const realInsights = aiCoach.getAIInsights(t_nested);
        
        let smartPlan = null;
        try {
          smartPlan = aiCoach.getSmartStudyPlan(t_nested);
        } catch (smartPlanError) {
          logger.error('Error loading smart study plan:', smartPlanError);
        }

        // Batch state updates for better performance
        setUserProgress(realData);
        setAiInsights(realInsights);
        setSmartStudyPlan(smartPlan);
        
        // Check for achievements after data is loaded (debounced)
        setTimeout(checkAchievements, 1000);
      } catch (error) {
        logger.error('Error loading dashboard data:', error);
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
  }, [checkAchievements, t_nested]);

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
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(async () => {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    await loadDashboardData();
  }, [loadDashboardData]);






  const navigateToRecommendedTest = useCallback((insight: AIInsight) => {
    logger.debug('Start button clicked:', { insight, testId: insight.testId });
    
    try {
      if (insight.testId === 'mock-exam') {
        navigate('/mock-exam');
      } else {
        const testId = insight.testId || 'traffic-rules-signs';
        navigate(`/practice/${testId}`);
      }
    } catch (error) {
      logger.error('Navigation error:', error);
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="main-layout">
        <main className="main-content">
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <div className="loading-text">
              <h3>{t_nested('dashboard.loadingProgress')}</h3>
              <p>{t_nested('dashboard.analyzingData')}</p>
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
      <main className="main-content">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="dashboard">
          {/* Summarized Learning Progress */}
          <div className="dashboard-summary">
            <div className="summary-stats">
              {/* Journey Progress - Road with Car */}
              <div className="summary-stat">
                <RoadProgress 
                  progress={journeyProgress.progress}
                  showLabel={false}
                />
              </div>
              
              <div className="summary-stat combined-progress">
                <div className="digital-watch-container">
                  <div className="digital-watch-display">
                    <div className="time-section">
                      <span className="time-label">{t_nested('dashboard.studyTime')}</span>
                      <span className="time-value">{formatStudyTime(userProgress.studyTime)}</span>
                    </div>
                    <div className="progress-section">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" 
                             style={{ 
                               width: `${Math.min(100, (userProgress.studyTime / 24) * 100)}%`,
                               backgroundColor: '#10b981'
                             }}></div>
                      </div>
                    </div>
                    <div className="time-section">
                      <span className="time-label">{t_nested('dashboard.timeRemaining')}</span>
                      <span className="time-value">{formatStudyTime(Math.max(0, 24 - userProgress.studyTime))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* AI Insights Summary */}
          <div className="ai-insights-summary">
            <h3>{t_nested('dashboard.yourProgress')}</h3>
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
                              <span className="focus-title">{t_nested('dashboard.todayFocus')}</span>
                            </div>
                            <div className="focus-details">
                              <strong>{smartStudyPlan.todayFocus.name}</strong>
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
                              <span className="weakness-title">{t_nested('dashboard.needsAttention')}</span>
                            </div>
                            <div className="weakness-details">
                              <strong>{smartStudyPlan.weakAreas[0].name}</strong>
                              <span className="weakness-score">{Math.round(smartStudyPlan.weakAreas[0].score)}%</span>
                            </div>
                            <div className="weakness-tip">
                              {t_nested('dashboard.focusOnThis')}
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
                    {/* Start Button */}
                    {insight.type === 'recommendation' && (
                      <div className="insight-action">
                        <button 
                          className="start-practice-btn"
                          onClick={() => {
                            navigateToRecommendedTest(insight);
                          }}
                        >
                          {t_nested('dashboard.startPractice')}
                        </button>
                      </div>
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
