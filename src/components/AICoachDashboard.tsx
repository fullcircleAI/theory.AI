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
    try {
      const realData: UserProgress = {
        averageScore: aiCoach.getCombinedAverage(), // Now includes practice tests + mock exams
        totalQuestions: aiCoach.getTotalQuestions(), // Now includes practice + mock exam questions
        correctAnswers: aiCoach.getTestHistory().reduce((sum, t) => sum + t.score, 0),
        studyTime: aiCoach.getStudyTime(), // Now includes mock exam time
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
  }, []);

  const handleRefresh = async () => {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reload data without full page reload
    const realData: UserProgress = {
      averageScore: aiCoach.getCombinedAverage(),
      totalQuestions: aiCoach.getTotalQuestions(),
      correctAnswers: aiCoach.getTestHistory().reduce((sum, t) => sum + t.score, 0),
      studyTime: aiCoach.getStudyTime(),
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

  // Calculate Exam Readiness Confidence Level (Practice Tests + Mock Exams)
  const getExamReadiness = () => {
    const averageScore = userProgress.averageScore; // Combined practice + mock exam average
    const studyTime = userProgress.studyTime; // Combined study time
    const totalQuestions = userProgress.totalQuestions; // Combined question count
    
    // Base confidence from combined average score (0-70 points)
    let confidence = Math.min(70, averageScore);
    
    // Bonus for study time (0-20 points) - includes practice + mock exam time
    const studyTimeBonus = Math.min(20, (studyTime / 24) * 20);
    confidence += studyTimeBonus;
    
    // Bonus for practice volume (0-10 points) - includes practice + mock exam questions
    const practiceBonus = Math.min(10, (totalQuestions / 100) * 10);
    confidence += practiceBonus;
    
    return Math.min(100, Math.max(0, Math.round(confidence)));
  };

  const getReadinessStatus = (confidence: number) => {
    if (confidence >= 80) return { status: 'Ready', color: '#10b981', emoji: '🟢' };
    if (confidence >= 60) return { status: 'On Track', color: '#f59e0b', emoji: '🟡' };
    return { status: 'Needs Practice', color: '#ef4444', emoji: '🔴' };
  };

  const getReadinessMessage = (confidence: number) => {
    if (confidence >= 80) return 'Strong progress';
    if (confidence >= 60) return 'Good progress';
    return 'Needs practice';
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
    return { remaining, percentage };
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
                <div className="readiness-message">
                  {getReadinessMessage(getExamReadiness())}
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
