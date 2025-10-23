import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PracticeResult.css';

interface ResultsData {
  examId: string;
  score: number;
  percentage: number;
  passed: boolean;
  totalQuestions: number;
  timeUsed: number;
  difficulty: string;
  passRate: number;
}

export const MockExamResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resultsData = location.state as ResultsData;

  // Debug logging for results verification
  console.log('=== MOCK EXAM RESULTS DEBUG ===');
  console.log('Results data received:', resultsData);

  if (!resultsData) {
    navigate('/mock-exam');
    return null;
  }

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  // Get next available mock exam
  const getNextMockExam = (currentExamId: string) => {
    const mockExams = ['mock-exam1', 'mock-exam2', 'mock-exam3'];
    const currentIndex = mockExams.indexOf(currentExamId);
    if (currentIndex < mockExams.length - 1) {
      return mockExams[currentIndex + 1];
    }
    return null; // No next exam available
  };

  const nextExamId = getNextMockExam(resultsData.examId);

  return (
    <div className="result-page">
      <div className="result-content-row">
        <div className="result-content-main">
          <div className="result-card">
            <div className="result-header">
              <h1>Mock Exam Complete!</h1>
              <h2>{getDifficultyLabel(resultsData.difficulty)} Level</h2>
            </div>
            
            <div className="result-score">
              <div className="score-display">
                <span className="score-number">{resultsData.score}</span>
                <span className="score-separator">/</span>
                <span className="score-total">{resultsData.totalQuestions}</span>
              </div>
              <div className="score-percentage">{resultsData.percentage}%</div>
            </div>

            <div className={`result-message ${resultsData.passed ? 'excellent' : 'practice'}`}>
              {resultsData.passed ? 'Excellent Work!' : 'Keep Practicing!'}
            </div>

            <div className="result-actions">
              <button 
                className="practice-nav-btn primary"
                onClick={() => navigate(`/mock-exam/${resultsData.examId}`)}
              >
                Retake Exam
              </button>
              {nextExamId ? (
                <button 
                  className="practice-nav-btn"
                  onClick={() => navigate(`/mock-exam/${nextExamId}`)}
                >
                  Start Mock Exam {nextExamId.replace('mock-exam', '')}
                </button>
              ) : (
                <button 
                  className="practice-nav-btn"
                  onClick={() => navigate('/mock-exam')}
                >
                  Mock Exam Dashboard
                </button>
              )}
              <button 
                className="practice-nav-btn"
                onClick={() => {
                  console.log('Navigating to dashboard...');
                  navigate('/');
                }}
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

