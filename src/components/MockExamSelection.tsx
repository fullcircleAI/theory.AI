import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from './Navigation';
import { aiCoach } from '../services/aiCoach';
import './MockExamSelection.css';

export const MockExamSelection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [recentScores, setRecentScores] = useState<Record<string, any>>({});
  const [unlockProgress, setUnlockProgress] = useState(aiCoach.getUnlockProgress());
  const [showUnlockCelebration, setShowUnlockCelebration] = useState(false);

  const mockExams = [
    {
      id: 'mock-exam1',
      name: 'Mock Exam 1',
      description: 'Authentic exam interface - 25 questions',
      questions: 25,
      time: 30,
      passRate: 52,
      difficulty: 'mock-exam',
      isOfficial: true
    },
    {
      id: 'mock-exam2',
      name: 'Mock Exam 2',
      description: 'Authentic exam interface - 25 questions',
      questions: 25,
      time: 30,
      passRate: 52,
      difficulty: 'mock-exam',
      isOfficial: true
    },
    {
      id: 'mock-exam3',
      name: 'Mock Exam 3',
      description: 'Authentic exam interface - 25 questions',
      questions: 25,
      time: 30,
      passRate: 52,
      difficulty: 'mock-exam',
      isOfficial: true
    }
  ];

  useEffect(() => {
    // Load recent scores from localStorage
    const scores: Record<string, any> = {};
    mockExams.forEach(exam => {
      const result = localStorage.getItem(`mockExamResults_${exam.id}`);
      if (result) {
        scores[exam.id] = JSON.parse(result);
      }
    });
    setRecentScores(scores);
    
    // Update unlock progress
    const newUnlockProgress = aiCoach.getUnlockProgress();
    setUnlockProgress(newUnlockProgress);
    
    // Show celebration if just unlocked
    if (newUnlockProgress.canUnlock && !unlockProgress.canUnlock) {
      setShowUnlockCelebration(true);
      setTimeout(() => setShowUnlockCelebration(false), 5000); // Hide after 5 seconds
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExamClick = (examId: string) => {
    // Check if mock exams are unlocked
    if (!unlockProgress.canUnlock) {
      // Show unlock requirements instead of navigating
      return;
    }
    
    // Check if it's a mock exam
    if (examId.startsWith('mock-exam')) {
      navigate(`/official-exam/${examId}`);
    } else {
      navigate(`/mock-exam/${examId}`);
    }
  };

  return (
    <div className="main-layout">
      <Navigation />
      <main className="main-content tests-page mock-exam-page">
        <div className="tests-page mock-exam-page">
          <div className="tests-header">
            <div className="header-content">
              <div className="header-text">
                <h1>{t('quiz.title')}</h1>
                <div className="mock-exam-requirement-note">
                  <div className="requirement-icon"></div>
                  <div className="requirement-text">
                    <strong>Requirement:</strong> Score 70% or higher on practice tests to access mock exams
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="tests-content">

            <div className="tests-grid">
              {mockExams.map((exam) => {
                const recentScore = recentScores[exam.id];
                const isLocked = !unlockProgress.canUnlock;
                
                return (
                  <div
                    key={exam.id}
                    className={`test-card ${isLocked ? 'locked' : 'unlocked'}`}
                    data-difficulty={exam.difficulty}
                    onClick={() => handleExamClick(exam.id)}
                  >
                    <div className="test-content">
                      <div className="test-header">
                        <h3 className="test-name">
                          {exam.name}
                          {recentScore && !isLocked && (
                            <span className="exam-score"> - {recentScore.percentage}%</span>
                          )}
                        </h3>
                        {isLocked && <div className="lock-icon"></div>}
                      </div>
                      
                      
                      <div className="test-meta">
                        <span>{exam.questions} questions</span>
                        <span>•</span>
                        <span>{exam.time} min</span>
                        <span>•</span>
                        <span>{exam.passRate}% to pass</span>
                      </div>
                      
                      {isLocked && (
                        <div className="locked-message">
                          Complete practice tests to unlock
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Unlock Celebration Modal */}
      {showUnlockCelebration && (
        <div className="unlock-celebration-overlay">
          <div className="unlock-celebration-modal">
            <div className="celebration-icon"></div>
            <h2>Mock Exams Unlocked!</h2>
            <p>Congratulations! You've completed enough practice tests with good scores to unlock mock exams.</p>
            <div className="celebration-achievements">
              <div className="achievement">{unlockProgress.completedTests} tests completed</div>
              <div className="achievement">{unlockProgress.averageScore}% average score</div>
              <div className="achievement">All tests above 70%</div>
              <div className="achievement">{unlockProgress.studyTime}h study time</div>
            </div>
            <button 
              className="celebration-close-btn"
              onClick={() => setShowUnlockCelebration(false)}
            >
              Start Mock Exams
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

