import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translationHelpers';
import { lightHaptic, impactHaptic } from '../utils/haptics';
import './MockExam.css';
import * as questionData from '../question_data';
import { getRandomRealExamQuestions } from '../question_data/realExamQuestions';
import { dynamicMockExamService } from '../services/dynamicMockExamService';
import { aiCoach } from '../services/aiCoach';
import { adaptiveDifficultyService } from '../services/adaptiveDifficultyService';
import { userAuth } from '../services/userAuth';
import { logger } from '../utils/logger';

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswerId: string;
  explanation: string;
  imageUrl?: string;
  imageHint?: string;
  subject: string;
}

interface MockExamConfig {
  questions: number;
  timeLimit: number; // in minutes
  passRate: number; // percentage
  difficulty: 'exam1' | 'exam2' | 'exam3';
}

export const MockExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { t_nested } = useLanguage();
  
  // Get user ID for question history tracking
  const getUserId = (): string | undefined => {
    const user = userAuth.getCurrentUser();
    return user?.id;
  };

  // Mock exam configurations - Official 2025 CBR exam format
  const examConfigs: Record<string, MockExamConfig> = {
    'exam1': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'exam1' }, // 44/50 (88%)
    'exam2': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'exam2' }, // 44/50 (88%)
    'exam3': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'exam3' }, // 44/50 (88%)
    'mock-exam1': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'exam1' }, // 44/50 (88%)
    'mock-exam2': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'exam2' }, // 44/50 (88%)
    'mock-exam3': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'exam3' } // 44/50 (88%)
  };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isFinished, setIsFinished] = useState(false);
  const [examConfig, setExamConfig] = useState<MockExamConfig | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  // Hide mobile footer during mock exam
  useEffect(() => {
    document.body.classList.add('practice-test-active');
    return () => {
      document.body.classList.remove('practice-test-active');
    };
  }, []);

  // Load exam configuration and questions
  useEffect(() => {
    if (!examId) return;

    const config = examConfigs[examId];
    if (!config) {
      navigate('/mock-exam');
      return;
    }

    setExamConfig(config);
    
    // Check if exam was already started (Rule 6: Timer continues)
    const savedStartTime = localStorage.getItem(`mockExamStart_${examId}`);
    if (savedStartTime) {
      const startTime = parseInt(savedStartTime);
      const elapsed = Math.floor((Date.now() - startTime) / 1000); // seconds
      const remainingTime = (config.timeLimit * 60) - elapsed;
      
      if (remainingTime > 0) {
        // Exam still in progress
        setTimeLeft(remainingTime);
        setIsExamStarted(true);
      } else {
        // Time's up
        setTimeLeft(0);
      }
    } else {
      // New exam - set full time
      setTimeLeft(config.timeLimit * 60);
    }

    // Create formatted exam with proper question distribution
    const formattedQuestions = createFormattedExam();
    setQuestions(formattedQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, navigate]);

  // Create formatted exam - 50 questions: 30 regular + 20 image questions (2025 CBR format)
  const createFormattedExam = (): Question[] => {
    try {
      // Check if exam should be personalized
      const personalizationPref = localStorage.getItem('mockExamPersonalization');
      const shouldPersonalize = personalizationPref !== 'false' && aiCoach.shouldPersonalizeMockExam();
      const testHistory = aiCoach.getTestHistory();
      
      if (shouldPersonalize && testHistory.length > 0) {
        // Generate personalized exam from real CBR questions
        // Includes: repeat prevention, mastery weighting, recent performance tracking
        const difficultyLevel = adaptiveDifficultyService.calculateDifficultyLevel(testHistory);
        const userId = getUserId();
        const { questions: personalizedQuestions, config } = dynamicMockExamService.generatePersonalizedExam(
          examId || 'mock-exam1',
          testHistory,
          difficultyLevel,
          userId
        );
        
        setIsPersonalized(true);
        setFocusAreas(config.focusAreas);
        
        logger.debug(`Mock exam ${examId} using personalized questions:`, {
          total: personalizedQuestions.length,
          focusAreas: config.focusAreas,
          personalizationLevel: config.personalizationLevel,
          difficultyDistribution: config.difficultyDistribution
        });
        
        return personalizedQuestions;
      } else {
        // Use random real exam questions (default)
      const exam = getRandomRealExamQuestions(50);
      
        logger.debug(`Mock exam ${examId} using random real questions:`, { 
        total: exam.length,
        realExamQuestions: exam.filter(q => !q.imageUrl).length,
        imageQuestions: exam.filter(q => q.imageUrl).length
      });
      
      return exam;
      }
    } catch (error) {
      logger.error('Error loading exam questions:', error);
      // Fallback to generic questions if real exam questions fail
      return questionData.trafficLightsSignalsQuestions.slice(0, 50);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!isExamStarted || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamStarted, isFinished]);

  const startExam = () => {
    setIsExamStarted(true);
    // Save exam start time to localStorage (Rule 6: Timer continues)
    if (examId) {
      const startTime = Date.now();
      localStorage.setItem(`mockExamStart_${examId}`, startTime.toString());
    }
  };

  const finishExam = () => {
    impactHaptic(); // Heavy haptic for exam completion
    setIsFinished(true);

    // Calculate final score
    const correctAnswers = Object.values(answers).filter((answer, index) =>
      answer === questions[index]?.correctAnswerId
    ).length;
    
    // Scoring verification (development only)
    logger.debug('Mock exam scoring:', {
      totalQuestions: questions.length,
      userAnswers: answers,
      correctAnswers: questions.map(q => q.correctAnswerId),
      correctCount: correctAnswers
    });
    
    // Detailed answer comparison
    Object.entries(answers).forEach(([questionIndex, userAnswer]) => {
      const question = questions[parseInt(questionIndex)];
      const isCorrect = userAnswer === question?.correctAnswerId;
      logger.debug(`Q${parseInt(questionIndex) + 1}:`, {
        userAnswer,
        correctAnswer: question?.correctAnswerId,
        isCorrect
      });
    });
    
    // Navigate to results page with data
    if (examConfig && examId) {
      const percentage = Math.round((correctAnswers / examConfig.questions) * 100);
      const passed = percentage >= examConfig.passRate;
      
      const resultsData = {
        examId,
        score: correctAnswers,
        percentage,
        passed,
        totalQuestions: examConfig.questions,
        timeUsed: (examConfig.timeLimit * 60) - timeLeft,
        difficulty: examConfig.difficulty,
        passRate: examConfig.passRate
      };
      
      // Update question history (prevent repeats in future mocks)
      const userId = getUserId();
      const questionIds = questions.map(q => q.id);
      dynamicMockExamService.updateQuestionHistory(questionIds, examId, userId);
      
      // Save to localStorage
      localStorage.setItem(`mockExamResults_${examId}`, JSON.stringify(resultsData));
      
      // Clear exam start time (exam finished)
      localStorage.removeItem(`mockExamStart_${examId}`);
      
      // Navigate to results page
      navigate('/mock-exam/results', { state: resultsData });
    }
  };


  const handleAnswer = (answerId: string) => {
    if (isAnswered || !isExamStarted) return;

    lightHaptic(); // Haptic feedback on answer selection
    setIsAnswered(true);
    setSelectedAnswer(answerId);
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerId }));

    // Instant next question (no delays)
    setTimeout(() => {
      nextQuestion();
    }, 300);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      finishExam();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (!examConfig || questions.length === 0) {
    return null;
  }


  // Intro Screen - Native iOS/Android style
  if (!isExamStarted) {
    
    return (
      <div className="main-layout">
        <main className="main-content">
          <div className="mock-exam-intro">
            <button className="back-btn" onClick={() => navigate('/mock-exam')}>
              ←
            </button>
            
            <div className="intro-header">
              <h1 className="intro-title">{t_nested('quiz.title')}</h1>
              {isPersonalized && focusAreas.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#2563eb',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {t_nested('quiz.aiPersonalizedExam')}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#1e40af',
                    fontWeight: 600
                  }}>
                    {t_nested('quiz.focusedOnWeakAreas')}
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    marginTop: '0.5rem'
                  }}>
                    {focusAreas.map((area, idx) => (
                      <span key={idx} style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                      }}>
                        {area}
                      </span>
                    ))}
                  </div>
                  <p style={{
                    margin: '0.75rem 0 0 0',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    {t_nested('quiz.tailoredToHelp')}
                  </p>
                </div>
              )}
            </div>

            <div className="exam-rules">
              <h3 className="rules-title">{t_nested('quiz.examRules')}</h3>
              <div className="rules-list">
                <div className="rule-item">
                  <span className="rule-number">1.</span>
                  <span className="rule-text">{t_nested('quiz.rule1')}</span>
                </div>
                <div className="rule-item">
                  <span className="rule-number">2.</span>
                  <span className="rule-text">{t_nested('quiz.rule2')}</span>
                </div>
                <div className="rule-item">
                  <span className="rule-number">3.</span>
                  <span className="rule-text">{t_nested('quiz.rule3')}</span>
                </div>
                <div className="rule-item">
                  <span className="rule-number">4.</span>
                  <span className="rule-text">{t_nested('quiz.rule4')}</span>
                </div>
                <div className="rule-item">
                  <span className="rule-number">5.</span>
                  <span className="rule-text">{t_nested('quiz.rule5').replace('{passRate}', examConfig.passRate.toString())}</span>
                </div>
                <div className="rule-item">
                  <span className="rule-number">6.</span>
                  <span className="rule-text">{t_nested('quiz.rule6')}</span>
                </div>
              </div>
            </div>

            <button className="start-exam-btn" onClick={startExam}>
              {getTranslation(t_nested, 'quiz.start', 'Start')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Exam Screen (using Practice Test design)
  return (
    <div className="main-layout">
      <main className="main-content">
        <div className="practice-test">
          <div className="practice-progress-bar">
            <div className="practice-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="practice-header-row">
            <div className="practice-subject-row">
              <span className="practice-question-number">
                {t_nested('quiz.question')} {currentQuestionIndex + 1} {t_nested('quiz.of')} {questions.length}
              </span>
              {isPersonalized && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  marginRight: '0.5rem'
                }}>
                  AI Personalized
                </span>
              )}
              <span className="practice-timer" style={{ color: timeLeft < 300 ? '#ef4444' : '#10b981' }}>
                ⏱ {formatTime(timeLeft)}
              </span>
            </div>
            <div className="practice-header-controls">
              <button className="practice-exit-btn" onClick={() => navigate('/mock-exam')}>
                ✕
              </button>
              <button 
                className={`practice-mute-btn ${isMuted ? 'muted' : ''}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>

          <div className="practice-question-text">{currentQuestion.text}</div>

          {currentQuestion.imageUrl && (
            <div className="practice-question-image">
              <img src={currentQuestion.imageUrl} alt="Question" />
            </div>
          )}

          <div className="practice-options-list">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option.id;

              return (
                <label
                  key={option.id}
                  className={`practice-option-label ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => handleAnswer(option.id)}
                    disabled={isAnswered}
                  />
                  <span className="practice-option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="practice-option-text">{option.text}</span>
                </label>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

