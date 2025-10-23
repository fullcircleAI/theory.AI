import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from './Navigation';
import { realExamService, RealExamSession } from '../services/realExamService';
import { RealExamQuestion } from '../question_data/realExamQuestions';
import { lightHaptic, successHaptic, errorHaptic } from '../utils/haptics';
import { aiCoach } from '../services/aiCoach';
import './PracticeTest.css';
import './PracticeResult.css';

interface RealExamPracticeProps {
  onComplete: (session: RealExamSession) => void;
  onClose: () => void;
}

const RealExamPractice: React.FC<RealExamPracticeProps> = ({ onComplete, onClose }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState<RealExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Hide mobile footer during practice tests
  useEffect(() => {
    document.body.classList.add('practice-test-active');
    return () => {
      document.body.classList.remove('practice-test-active');
    };
  }, []);

  useEffect(() => {
    const startSession = () => {
      const newSession = realExamService.startRealExamSession('mixed');
      setSession(newSession);
    };
    startSession();
  }, []);

  const handleAnswer = (answerId: string) => {
    if (!isAnswered && session) {
      lightHaptic(); // Haptic feedback on selection
      setSelectedAnswer(answerId);
      setIsAnswered(true);
      setShowExplanation(true);
      
      // Record answer in session - we'll handle this in the complete session
      
      if (answerId === session.questions[currentQuestionIndex].correctAnswerId) {
        setScore(score + 1);
        successHaptic(); // Success haptic for correct answer
      } else {
        errorHaptic(); // Error haptic for wrong answer
      }
    }
  };

  const nextQuestion = () => {
    lightHaptic(); // Haptic feedback on next question
    if (currentQuestionIndex < session!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      // Test complete - save results to AI Coach
      const percentage = Math.round((score / session!.questions.length) * 100);
      aiCoach.saveTestResult({
        testId: 'mock-test',
        testName: 'Mock Test',
        score: score,
        totalQuestions: session!.questions.length,
        percentage: percentage,
        date: new Date().toISOString()
      });
      setTestComplete(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getMotivationWord = () => {
    const isCorrect = selectedAnswer === session?.questions[currentQuestionIndex]?.correctAnswerId;
    if (isCorrect) {
      const words = ['Excellent!', 'Perfect!', 'Great!', 'Correct!', 'Well done!'];
      return words[Math.floor(Math.random() * words.length)];
    } else {
      const words = ['Try again', 'Not quite', 'Incorrect', 'Wrong answer', 'Keep trying'];
      return words[Math.floor(Math.random() * words.length)];
    }
  };

  const getNextTest = () => {
    // Get REAL next recommendation from AI Coach
    const recommendation = aiCoach.getTopRecommendation();
    return { 
      id: recommendation.testId, 
      name: recommendation.testName 
    };
  };

  if (!session) {
    return (
      <div className="main-layout">
        <Navigation />
        <main className="main-content">
          <div className="practice-test">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div>Loading questions...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Results page
  if (testComplete) {
    const percentage = Math.round((score / session.questions.length) * 100);
    const nextTest = getNextTest();

    // Smart Coaching Logic: Determine readiness level
    const isCritical = percentage < 60;  // Must retry
    const needsWork = percentage >= 60 && percentage < 80;  // Recommended retry
    const hasMastery = percentage >= 80;  // Ready to progress

    // Check if user is ready for mock exams (70%+ in all practice tests)
    const isReadyForMockExam = aiCoach.canUnlockMockExams();

    // Coaching messages based on performance
    const getCoachingMessage = () => {
      if (isCritical) {
        return "Let's learn this first! Practice makes perfect.";
      } else if (needsWork) {
        return "Almost there! 80% proficiency recommended before moving on.";
      } else {
        return "Excellent Work!";
      }
    };

    return (
      <div className="result-page">
        <div className="result-content-row">
          <div className="result-content-main">
            <div className="result-card">
              <div className="result-header">
                <h1>Test Complete!</h1>
                <h2>Mock Test</h2>
              </div>
              
              <div className="result-score">
                <div className="score-display">
                  <span className="score-number">{score}</span>
                  <span className="score-separator">/</span>
                  <span className="score-total">{session.questions.length}</span>
                </div>
                <div className="score-percentage">{percentage}%</div>
              </div>

              <div className={`result-message ${hasMastery ? 'excellent' : needsWork ? 'good' : 'practice'}`}>
                {getCoachingMessage()}
              </div>

              <div className="result-actions">
                {/* Critical (<60%): Only show Retry button */}
                {isCritical && (
                  <>
                    <button className="practice-nav-btn primary" onClick={() => {
                      setCurrentQuestionIndex(0);
                      setSelectedAnswer('');
                      setIsAnswered(false);
                      setShowExplanation(false);
                      setScore(0);
                      setTestComplete(false);
                    }}>
                      Retry Test
                    </button>
                    <button className="practice-nav-btn" onClick={() => navigate('/')}>
                      Back to Dashboard
                    </button>
                  </>
                )}

                {/* Needs Work (60-79%): Show both, prioritize Retry */}
                {needsWork && (
                  <>
                    <button className="practice-nav-btn primary" onClick={() => {
                      setCurrentQuestionIndex(0);
                      setSelectedAnswer('');
                      setIsAnswered(false);
                      setShowExplanation(false);
                      setScore(0);
                      setTestComplete(false);
                    }}>
                      Retry Test (Recommended)
                    </button>
                    <button className="practice-nav-btn" onClick={() => {
                      window.location.href = `/practice/${nextTest.id}`;
                    }}>
                      Next: {nextTest.name}
                    </button>
                    <button className="practice-nav-btn" onClick={() => navigate('/')}>
                      Back to Dashboard
                    </button>
                  </>
                )}

                {/* Proficiency (80%+): Encourage progression */}
                {hasMastery && (
                  <>
                    {/* Show Mock Exam CTA if ready */}
                    {isReadyForMockExam && (
                      <button 
                        className="practice-nav-btn mock-exam-cta primary" 
                        onClick={() => navigate('/mock-exam')}
                        style={{
                          background: 'linear-gradient(135deg, #1A3E7A, #002868)',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          padding: '1rem 1.5rem',
                          marginBottom: '1rem',
                          boxShadow: '0 4px 12px rgba(26, 62, 122, 0.3)'
                        }}
                      >
                        Start Mock Exam
                      </button>
                    )}
                    
                    <button className="practice-nav-btn next-test primary" onClick={() => {
                      window.location.href = `/practice/${nextTest.id}`;
                    }}>
                      Next: {nextTest.name}
                    </button>
                    <button className="practice-nav-btn" onClick={() => {
                      setCurrentQuestionIndex(0);
                      setSelectedAnswer('');
                      setIsAnswered(false);
                      setShowExplanation(false);
                      setScore(0);
                      setTestComplete(false);
                    }}>
                      Retry Test
                    </button>
                    <button className="practice-nav-btn" onClick={() => navigate('/')}>
                      Back to Dashboard
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion.correctAnswerId;
  const motivationWord = getMotivationWord();

  return (
    <div className="main-layout">
      <Navigation />
      <main className="main-content">
        <div className="practice-test">
          <div className="practice-progress-bar">
            <div className="practice-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          
          <div className="practice-header-row">
            <div className="practice-subject-row">
              <span className="practice-question-number">
                Question {currentQuestionIndex + 1} of {session.questions.length}:
              </span>
              <span className="practice-question-subject">Mock Test</span>
            </div>
            <div className="practice-header-controls">
              <button
                className="practice-exit-btn" 
                onClick={() => navigate('/')}
                aria-label="Exit Practice"
                title="Exit Practice"
              >
                ×
              </button>
              <button className={`practice-mute-btn${isMuted ? ' muted' : ''}`} onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>

          <div className="practice-question-text">
            {currentQuestion.text}
          </div>

          {currentQuestion.imageUrl && (
            <div className="practice-question-image">
              <img src={currentQuestion.imageUrl} alt="question visual" style={{ maxHeight: '220px', width: 'auto', objectFit: 'contain' }} />
            </div>
          )}

          <div className="practice-options-list">
            {currentQuestion.options.map((option, idx) => (
              <label key={option.id} className={`practice-option-label${selectedAnswer === option.id ? ' selected' : ''}${isAnswered && currentQuestion.correctAnswerId === option.id ? ' correct' : ''}${isAnswered && selectedAnswer === option.id && selectedAnswer !== currentQuestion.correctAnswerId ? ' incorrect' : ''}`}> 
                <input
                  type="radio"
                  name="practice-option"
                  value={option.id}
                  checked={selectedAnswer === option.id}
                  onChange={() => handleAnswer(option.id)}
                  disabled={isAnswered}
                />
                <span className="practice-option-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="practice-option-text">{option.text}</span>
              </label>
            ))}
          </div>

          {showExplanation && (
            <div className="practice-explanation-section">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isAnswered && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    color: isCorrect ? '#059669' : '#dc2626',
                    background: isCorrect ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginRight: '0.7rem',
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    borderRadius: '8px',
                    padding: '0.25em 0.6em',
                    display: 'inline-block',
                    boxShadow: isCorrect ? '0 1px 4px rgba(5, 150, 105, 0.2)' : '0 1px 4px rgba(220, 38, 38, 0.2)',
                    border: isCorrect ? '1px solid #a7f3d0' : '1px solid #fecaca',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>
                    {motivationWord}
                  </span>
                )}
                <div className="practice-explanation-label" style={{ fontSize: '1rem', margin: '0 auto' }}>Explanation</div>
              </div>
              <div className="practice-explanation-text" style={{ fontSize: '0.95rem' }}>{currentQuestion.explanation}</div>
            </div>
          )}
          
          {/* Always show Next button after answering */}
          {isAnswered && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0' }}>
              <button
                className="practice-nav-btn"
                onClick={nextQuestion}
              >
                {currentQuestionIndex < session.questions.length - 1 ? 'Next' : 'Finish'}
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default RealExamPractice;