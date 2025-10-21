import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from './Navigation';
import { PullToRefresh } from './PullToRefresh';
import AITutor from './AITutor';
import { aiCoach } from '../services/aiCoach';
import type { AIInsight } from '../services/aiCoach';
import './AICoachDashboard.css';

interface UserProgress {
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  studyTime: number;
  weakAreas: string[];
  strongAreas: string[];
}


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

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showAITutor, setShowAITutor] = useState(false);
  // const [unlockProgress, setUnlockProgress] = useState(aiCoach.getUnlockProgress()); // Removed unused variable

  useEffect(() => {
    // Load REAL data from AI Coach (including mock exams)
    const loadDashboardData = () => {
      try {
        // Force refresh by getting fresh data
        const testHistory = aiCoach.getTestHistory();
        const studyTime = aiCoach.getStudyTime();
        const averageScore = aiCoach.getCombinedAverage();
        
        console.log('Dashboard Data:', {
          testHistory: testHistory.length,
          studyTime,
          averageScore,
          recentTests: testHistory.slice(-3)
        });

        const realData: UserProgress = {
          averageScore: averageScore,
          totalQuestions: aiCoach.getTotalQuestions(),
          correctAnswers: testHistory.reduce((sum, t) => sum + t.score, 0),
          studyTime: studyTime,
          weakAreas: [],
          strongAreas: []
        };

        const realInsights = aiCoach.getAIInsights();

        setUserProgress(realData);
        setAiInsights(realInsights);
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
      }
    };

    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Force reload data without full page reload
    const testHistory = aiCoach.getTestHistory();
    const studyTime = aiCoach.getStudyTime();
    const averageScore = aiCoach.getCombinedAverage();
    
    console.log('Refresh Data:', {
      testHistory: testHistory.length,
      studyTime,
      averageScore,
      recentTests: testHistory.slice(-3)
    });
    
    const realData: UserProgress = {
      averageScore: averageScore,
      totalQuestions: aiCoach.getTotalQuestions(),
      correctAnswers: testHistory.reduce((sum, t) => sum + t.score, 0),
      studyTime: studyTime,
      weakAreas: [],
      strongAreas: []
    };

    const realInsights = aiCoach.getAIInsights();
    setUserProgress(realData);
    setAiInsights(realInsights);
  };

  // const getScoreColor = (score: number) => { // Removed unused function
  //   if (score < 30) return 'red';
  //   if (score < 70) return 'orange';
  //   return 'green';
  // };

  // Calculate Exam Readiness - Enhanced with Mock Exam Pass Mark Awareness
  const getExamReadiness = () => {
    const averageScore = userProgress.averageScore; // Your test scores (practice + mock exams)
    const studyTime = userProgress.studyTime; // Hours studied
    const totalQuestions = userProgress.totalQuestions; // Questions answered
    
    // ENHANCED FORMULA: Score + Study Time + Practice Volume + Mock Exam Bonus
    // 1. Your average score (0-100%) - includes mock exams with different pass marks
    // 2. Study time bonus: +1% per hour (first 15 hours), then +0.5% per hour (max +20%)
    // 3. Practice bonus: +1% per 50 questions (max +10%)
    // 4. Mock exam bonus: +5% per passed mock exam (accounts for different pass marks)
    
    // Diminishing returns for study time (realistic learning curve)
    let studyBonus = 0;
    if (studyTime <= 15) {
      studyBonus = studyTime; // +1% per hour for first 15 hours
    } else {
      studyBonus = 15 + ((studyTime - 15) * 0.5); // +0.5% per hour after 15 hours
    }
    studyBonus = Math.min(20, studyBonus); // Cap at +20%
    
    const practiceBonus = Math.min(10, Math.floor(totalQuestions / 50)); // +1% per 50 questions, max +10%
    
    // Mock exam bonus (accounts for different pass marks)
    const mockExamBonus = Math.min(15, aiCoach.getMockExamPassRate() * 0.15); // +5% per passed mock exam
    
    const readiness = Math.min(100, averageScore + studyBonus + practiceBonus + mockExamBonus);
    
    return Math.round(readiness);
  };

  const getReadinessStatus = (confidence: number) => {
    // CRITICAL: You can't be "Ready" until you pass ALL 3 mock exams
    const mockExamResults = aiCoach.getMockExamResults();
    const totalMockExams = 3; // Total available mock exams
    const passedMockExams = mockExamResults.filter(result => {
      const examPassMarks: Record<string, number> = {
        'mock-exam-1': 88, // Beginner
        'mock-exam-2': 92, // Intermediate  
        'mock-exam-3': 96  // Advanced
      };
      const passMark = examPassMarks[result.testId] || 70;
      return result.percentage >= passMark;
    }).length;
    
    // Must pass ALL 3 mock exams to be "Ready"
    if (passedMockExams < totalMockExams) {
      return { status: 'Needs Practice', color: '#ef4444', emoji: '🔴' };
    }
    
    // Only then check confidence score
    if (confidence >= 80) return { status: 'Ready', color: '#10b981', emoji: '🟢' };
    if (confidence >= 60) return { status: 'On Track', color: '#f59e0b', emoji: '🟡' };
    return { status: 'Needs Practice', color: '#ef4444', emoji: '🔴' };
  };


  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    // Digital clock format: 08:30 instead of 8h 30m
    return `${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    const targetHours = 24; // 24-hour target
    const remaining = Math.max(0, targetHours - userProgress.studyTime);
    const percentage = Math.min(100, (userProgress.studyTime / targetHours) * 100);
    
    // Adaptive messaging based on progress
    let timeMessage = '';
    if (userProgress.studyTime < 2) {
      timeMessage = 'Just getting started!';
    } else if (userProgress.studyTime < 8) {
      timeMessage = 'Great progress!';
    } else if (userProgress.studyTime < 16) {
      timeMessage = 'You\'re on track!';
    } else if (userProgress.studyTime < 24) {
      timeMessage = 'Almost there!';
    } else {
      timeMessage = 'Challenge complete!';
    }
    
    return { remaining, percentage, timeMessage };
  };

  const navigateToRecommendedTest = (insight: AIInsight) => {
    // Use testId from AI Coach (already calculated)
    const testId = insight.testId || 'traffic-rules-signs';
    navigate(`/practice/${testId}`);
  };

  return (
    <div className="main-layout">
      <Navigation />
      <main className="main-content">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="dashboard">
          {/* Summarized Learning Progress */}
          <div className="dashboard-summary">
            <div className="summary-stats">
              <div className="summary-stat">
                <div className="stat-number">{getExamReadiness()}%</div>
                <div className="stat-label">Exam Readiness</div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" 
                       style={{ 
                         width: `${getExamReadiness()}%`,
                         backgroundColor: getReadinessStatus(getExamReadiness()).color
                       }}></div>
                </div>
                <div className="readiness-status">
                  <span className="status-emoji">{getReadinessStatus(getExamReadiness()).emoji}</span>
                  <span className="status-text">{getReadinessStatus(getExamReadiness()).status}</span>
                </div>
              </div>
              <div className="summary-stat combined-progress">
                <div className="digital-watch-container">
                  <div className="digital-watch-display">
                    <div className="time-section">
                      <span className="time-label">{t('dashboard.studyTime')}</span>
                      <span className="time-value">{formatTime(userProgress.studyTime)}</span>
                    </div>
                    <div className="progress-section">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" 
                             style={{ 
                               width: `${Math.min((userProgress.studyTime / 24) * 100, 100)}%`,
                               backgroundColor: '#10b981'
                             }}></div>
                      </div>
                    </div>
                    <div className="time-section">
                      <span className="time-label">{t('dashboard.timeRemaining')}</span>
                      <span className="time-value">{formatTime(getTimeRemaining().remaining)}</span>
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
                    {/* Show Start button for recommendation insights */}
                    {insight.type === 'recommendation' && (
                      <button 
                        className="start-practice-btn"
                        onClick={() => navigateToRecommendedTest(insight)}
                      >
                        <span className="btn-text">{t('dashboard.startPractice')}</span>
                        <span className="btn-time">15 min</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating AI Tutor Button - Mascot as Button */}
          <div className="floating-ai-tutor">
            <button 
              className="floating-ai-btn-mascot"
              onClick={() => setShowAITutor(true)}
              title="Ask AI Tutor"
            >
              <img src="/images/mascot.png" alt="AI Tutor" className="floating-mascot-full" />
            </button>
          </div>

          </div>
        </PullToRefresh>
      </main>

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
