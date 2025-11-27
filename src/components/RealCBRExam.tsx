import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lightHaptic, impactHaptic } from '../utils/haptics';
import './RealCBRExam.css';
import './TestsPage.css';
import { getRandomRealExamQuestions } from '../question_data/realExamQuestions';
import { dynamicMockExamService } from '../services/dynamicMockExamService';
import { aiCoach } from '../services/aiCoach';
import { adaptiveDifficultyService } from '../services/adaptiveDifficultyService';
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

interface RealCBRExamConfig {
  questions: number;
  timeLimit: number;
  passRate: number;
  difficulty: string;
}

export const OfficialExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  // Mock exam configurations - moved inside useEffect to avoid dependency issues
  const getExamConfigs = () => ({
    'mock-exam1': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'mock-exam1' },
    'mock-exam2': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'mock-exam2' },
    'mock-exam3': { questions: 50, timeLimit: 30, passRate: 88, difficulty: 'mock-exam3' }
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [examConfig, setExamConfig] = useState<RealCBRExamConfig | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  // Hide mobile footer during exam
  useEffect(() => {
    document.body.classList.add('practice-test-active');
    return () => {
      document.body.classList.remove('practice-test-active');
    };
  }, []);

  // Helper function to get user ID
  const getUserId = (): string | undefined => {
    try {
      return localStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  };

  // Load exam configuration and questions
  useEffect(() => {
    const examConfigs = getExamConfigs();
    if (examId && examConfigs[examId as keyof typeof examConfigs]) {
      const config = examConfigs[examId as keyof typeof examConfigs];
      setExamConfig(config);
      setTimeLeft(config.timeLimit * 60); // Convert minutes to seconds
      
      // Check if exam should be personalized
      const personalizationPref = localStorage.getItem('mockExamPersonalization');
      const shouldPersonalize = personalizationPref !== 'false' && aiCoach.shouldPersonalizeMockExam();
      const testHistory = aiCoach.getTestHistory();
      
      if (shouldPersonalize && testHistory.length > 0) {
        // Generate personalized exam from real CBR questions
        const difficultyLevel = adaptiveDifficultyService.calculateDifficultyLevel(testHistory);
        const userId = getUserId();
        const { questions: personalizedQuestions, config: examConfig } = dynamicMockExamService.generatePersonalizedExam(
          examId,
          testHistory,
          difficultyLevel,
          userId
        );
        
        setIsPersonalized(true);
        setFocusAreas(examConfig.focusAreas);
        
        logger.debug(`Mock exam ${examId} using personalized questions:`, {
          total: personalizedQuestions.length,
          focusAreas: examConfig.focusAreas,
          personalizationLevel: examConfig.personalizationLevel,
          difficultyDistribution: examConfig.difficultyDistribution
        });
        
        setQuestions(personalizedQuestions);
      } else {
        // Use random real exam questions (default)
        const realQuestions = getRandomRealExamQuestions(config.questions);
        logger.debug(`Mock exam ${examId} using random real questions:`, { 
          total: realQuestions.length,
          realExamQuestions: realQuestions.filter(q => !q.imageUrl).length,
          imageQuestions: realQuestions.filter(q => q.imageUrl).length
        });
        setQuestions(realQuestions);
      }
    }
  }, [examId]);

  const finishExam = useCallback(() => {
    impactHaptic();
    setIsFinished(true);

    // Calculate final score
    const correctAnswers = Object.values(answers).filter((answer, index) =>
      answer === questions[index]?.correctAnswerId
    ).length;
    
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    const passed = percentage >= (examConfig?.passRate || 88);

    // Save results
    if (examConfig && examId) {
      const result = {
        testId: examId,
        testName: 'Rules',
        score: correctAnswers,
        totalQuestions: questions.length,
        percentage: percentage,
        date: new Date().toISOString(),
        passed: passed
      };

      // Save to localStorage and AI Coach
      aiCoach.saveTestResult(result);
      
      // Update question history (prevent repeats in future mocks)
      const userId = getUserId();
      const questionIds = questions.map(q => q.id);
      dynamicMockExamService.updateQuestionHistory(questionIds, examId, userId);
      
      // Save results to localStorage for results page
      const resultsData = {
        examId,
        score: correctAnswers,
        percentage,
        passed,
        totalQuestions: questions.length,
        timeUsed: (examConfig.timeLimit * 60) - timeLeft,
        difficulty: examConfig.difficulty,
        passRate: examConfig.passRate
      };
      localStorage.setItem(`mockExamResults_${examId}`, JSON.stringify(resultsData));
    }
  }, [answers, questions, examConfig, examId, timeLeft]);

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
    setShowInstructions(false);
    lightHaptic();
  };

  const handleAnswer = (answerId: string) => {
    if (!isAnswered) {
      lightHaptic();
      setSelectedAnswer(answerId);
      setIsAnswered(true);
      setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerId }));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      finishExam();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevAnswer = answers[currentQuestionIndex - 1];
      setSelectedAnswer(prevAnswer || null);
      setIsAnswered(!!prevAnswer);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  };

  // Instructions screen
  if (showInstructions && examConfig) {
    return (
      <div className="cbr-exam-container">
        <div className="cbr-question-container">
          <button 
            className="back-button-icon"
            onClick={() => navigate('/')}
            title="Back to Dashboard"
          >
            ←
          </button>
          <div className="cbr-exam-instructions">
            <h4>Rules</h4>
            <ul>
              <li>You have {examConfig.timeLimit} minutes to complete {examConfig.questions} questions</li>
              <li>You need {examConfig.passRate}% correct answers to pass</li>
              <li>No explanations during the exam - just like the real test</li>
              <li>You can navigate between questions using Previous/Next buttons</li>
            </ul>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              className="cbr-nav-button primary"
              onClick={startExam}
              style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
            >
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (isFinished && examConfig) {
    const correctAnswers = Object.values(answers).filter((answer, index) =>
      answer === questions[index]?.correctAnswerId
    ).length;
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    const passed = percentage >= examConfig.passRate;

    return (
      <div className="cbr-exam-container">
        <div className="cbr-results-container">
          <div className="cbr-results-header">
            <div className={`cbr-results-status ${passed ? 'passed' : 'failed'}`}>
              {passed ? 'PASSED' : 'FAILED'}
            </div>
            <p>You scored {percentage}% - Need {examConfig.passRate}% to pass</p>
          </div>

          <div className="cbr-results-details">
            <div className="cbr-result-item">
              <span className="cbr-result-label">Correct Answers</span>
              <span className="cbr-result-value">{correctAnswers}/{questions.length}</span>
            </div>
            <div className="cbr-result-item">
              <span className="cbr-result-label">Percentage</span>
              <span className="cbr-result-value">{percentage}%</span>
            </div>
            <div className="cbr-result-item">
              <span className="cbr-result-label">Pass Rate Required</span>
              <span className="cbr-result-value">{examConfig.passRate}%</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="cbr-nav-button"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </button>
            <button 
              className="cbr-nav-button primary"
              onClick={() => window.location.reload()}
            >
              Retake Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!examConfig || questions.length === 0) {
    return (
      <div className="cbr-exam-container">
        <div className="cbr-question-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Loading official exam...</div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="cbr-exam-container">
      {/* Header */}
      <div className="cbr-exam-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 className="cbr-exam-title">Mock Exam {examId?.replace('mock-exam', '') || '1'}</h1>
          {isPersonalized && focusAreas.length > 0 && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#2563eb',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
              padding: '0.3rem 0.6rem',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              whiteSpace: 'nowrap'
            }}>
              AI Personalized
            </span>
          )}
        </div>
        <div className={`cbr-exam-timer ${timeLeft < 300 ? 'warning' : ''}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="cbr-progress-container">
        <div 
          className="cbr-progress-bar" 
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Question Container */}
      <div className="cbr-question-container">
        <div className="cbr-question-header">
          <h2 className="cbr-question-text">{currentQuestion.text}</h2>
          {currentQuestion.imageUrl && (
            <div className="cbr-question-image">
              <img 
                src={currentQuestion.imageUrl} 
                alt={currentQuestion.imageHint || 'Question image'} 
                className="cbr-image"
              />
            </div>
          )}
        </div>

        <div className="cbr-answer-options">
          {currentQuestion.options.map((option) => (
            <div
              key={option.id}
              className={`cbr-answer-option ${
                selectedAnswer === option.id ? 'selected' : ''
              }`}
              onClick={() => handleAnswer(option.id)}
            >
              <div className={`cbr-radio ${
                selectedAnswer === option.id ? 'selected' : ''
              }`} />
              <span>{option.text}</span>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="cbr-navigation">
          <button
            className="cbr-nav-button"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          
          <button
            className="cbr-nav-button primary"
            onClick={nextQuestion}
            disabled={!selectedAnswer}
          >
            {isLastQuestion ? 'Finish Exam' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
