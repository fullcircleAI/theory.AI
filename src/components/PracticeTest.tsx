import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from './Navigation';
import * as questionData from '../question_data';
import { getRandomRealExamQuestions } from '../question_data/realExamQuestions';
import { lightHaptic, successHaptic, errorHaptic } from '../utils/haptics';
import { aiCoach } from '../services/aiCoach';
import { useLanguage } from '../contexts/LanguageContext';
import './PracticeTest.css';
import './PracticeResult.css';

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

export const PracticeTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  // const [isSpeaking, setIsSpeaking] = useState(false); // Not used currently
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Voice functionality - only for practice tests, not mock exams
  const { getSpeechLang, getSpeechVoice } = useLanguage();

  const speakQuestion = useCallback(() => {
    // Don't speak for mock exams
    if (testId === 'mock-test') {
      console.log('Mock test - no voice');
      return;
    }
    
    console.log('Speaking question:', { isVoiceEnabled, isMuted, testId });
    
    // Stop any current speech
    if (speechUtterance) {
      window.speechSynthesis.cancel();
    }

    if (!isVoiceEnabled || isMuted) {
      console.log('Voice disabled or muted');
      return;
    }

    // We'll get currentQuestion later when we need it
    if (questions.length === 0) {
      console.log('No questions available');
      return;
    }

    const questionText = questions[currentQuestionIndex]?.text || '';
    console.log('Question text:', questionText);

    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.lang = getSpeechLang();
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices.length);
    
    const selectedVoice = voices.find(voice => voice.name === getSpeechVoice()) || voices.find(voice => voice.lang.startsWith(getSpeechLang()));
    console.log('Selected voice:', selectedVoice?.name || 'default');
    
    utterance.voice = selectedVoice || null;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => console.log('Voice started');
    utterance.onend = () => console.log('Voice ended');
    utterance.onerror = (e) => console.error('Voice error:', e);

    setSpeechUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  }, [testId, speechUtterance, isVoiceEnabled, isMuted, questions, currentQuestionIndex, getSpeechLang, getSpeechVoice]);

  const stopSpeaking = () => {
    if (speechUtterance) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleVoice = () => {
    console.log('Toggle voice clicked:', { isVoiceEnabled, testId });
    if (isVoiceEnabled) {
      stopSpeaking();
      setIsVoiceEnabled(false);
      console.log('Voice disabled');
    } else {
      setIsVoiceEnabled(true);
      console.log('Voice enabled');
      // Auto-speak current question when voice is enabled
      setTimeout(() => speakQuestion(), 100);
    }
  };

  // Auto-speak question when it changes (only for practice tests, not mock exams)
  useEffect(() => {
    console.log('Voice effect triggered:', { testId, isVoiceEnabled, isMuted, questionsLength: questions.length });
    if (testId !== 'mock-test' && isVoiceEnabled && !isMuted && questions.length > 0) {
      console.log('Auto-speaking question');
      // Small delay to ensure question is rendered
      const timer = setTimeout(() => {
        speakQuestion();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, isVoiceEnabled, isMuted, testId, questions.length, speakQuestion]);

  // Hide mobile footer during practice tests
  useEffect(() => {
    document.body.classList.add('practice-test-active');
    return () => {
      document.body.classList.remove('practice-test-active');
    };
  }, []);

  // Cleanup speech when component unmounts
  useEffect(() => {
    return () => {
      if (speechUtterance) {
        window.speechSynthesis.cancel();
      }
    };
  }, [speechUtterance]);

  // Timer for Mock Test (30 minutes = 1800 seconds)
  useEffect(() => {
    if (testId === 'mock-test') {
      setTimeLeft(1800); // 30 minutes
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            setTestComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [testId]);

  useEffect(() => {
    const loadQuestions = () => {
      let questions: Question[] = [];
      switch (testId) {
        case 'traffic-lights-signals':
          questions = questionData.trafficLightsSignalsQuestions;
          break;
        case 'priority-rules':
          questions = questionData.priorityRulesQuestions;
          break;
        case 'hazard-perception':
          questions = questionData.hazardPerceptionQuestions;
          break;
        case 'speed-safety':
          questions = questionData.speedLimitQuestions;
          break;
        case 'bicycle-interactions':
          questions = questionData.bicycleInteractionsQuestions;
          break;
        case 'roundabout-rules':
          questions = questionData.roundaboutRulesQuestions;
          break;
        case 'tram-interactions':
          questions = questionData.tramInteractionsQuestions;
          break;
        case 'pedestrian-crossings':
          questions = questionData.pedestrianCrossingsQuestions;
          break;
        case 'construction-zones':
          questions = questionData.constructionZonesQuestions;
          break;
        case 'weather-conditions':
          questions = questionData.weatherConditionsQuestions;
          break;
        case 'road-signs':
          questions = questionData.signIdentificationQuestions;
          break;
        case 'motorway-rules':
          questions = questionData.motorwayRulesQuestions;
          break;
        case 'vehicle-knowledge':
          questions = questionData.vehicleCategoriesQuestions;
          break;
        case 'parking-rules':
          questions = questionData.parkingRulesQuestions;
          break;
        case 'environmental':
          questions = questionData.environmentalZonesQuestions;
          break;
        case 'technology-safety':
          questions = questionData.technologySafetyQuestions;
          break;
        case 'alcohol-drugs':
          questions = questionData.alcoholDrugsQuestions;
          break;
        case 'fatigue-rest':
          questions = questionData.fatigueRestQuestions;
          break;
        case 'emergency-procedures':
          questions = questionData.emergencyProceduresQuestions;
          break;
        case 'insight-practice':
          questions = questionData.insightPracticeQuestions;
          break;
        case 'traffic-rules-signs':
          questions = questionData.mandatorySignQuestions;
          break;
        case 'mock-test':
          // Use real exam questions for mock test
          try {
            questions = getRandomRealExamQuestions(25);
            console.log('Mock test questions loaded:', questions.length);
            console.log('First question:', questions[0]);
          } catch (error) {
            console.error('Error loading mock test questions:', error);
            questions = [];
          }
          break;
        default:
          questions = questionData.trafficLightsSignalsQuestions;
      }
      
      // Map test IDs to translation keys
      const testTranslationKeys: Record<string, string> = {
        'traffic-lights-signals': 'trafficLights',
        'hazard-perception': 'hazardPerception',
        'priority-rules': 'priorityRules',
        'speed-safety': 'speedLimit',
        'bicycle-interactions': 'bicycleInteractions',
        'roundabout-rules': 'roundaboutRules',
        'tram-interactions': 'tramInteractions',
        'road-markings': 'roadMarkings',
        'pedestrian-crossings': 'pedestrianCrossings',
        'weather-conditions': 'weatherConditions',
        'alcohol-drugs': 'alcoholDrugs',
        'motorway-rules': 'motorwayRules',
        'construction-zones': 'constructionZones',
        'parking-rules': 'parkingRules',
        'emergency-procedures': 'emergencyProcedures',
        'environmental-zones': 'environmentalZones',
        'vehicle-categories': 'vehicleCategories',
        'vehicle-documentation': 'vehicleDocumentation',
        'fatigue-rest': 'fatigueRest',
        'technology-safety': 'technologySafety',
        'insight-practice': 'insightPractice',
        'traffic-rules-signs': 'mandatorySigns',
        'mandatory-signs-2': 'mandatorySigns2',
        'prohibitory-signs': 'prohibitorySigns',
        'prohibitory-signs-2': 'prohibitorySigns2',
        'warning-signs': 'warningSigns',
        'road-information': 'roadInformation',
        'sign-identification': 'signIdentification',
        'expanded-priority-rules': 'expandedPriorityRules'
      };
      
      const translationKey = testTranslationKeys[testId || ''];
      
      // If test has translations, use them
      if (translationKey && i18n.language !== 'en') {
        try {
          const translatedQuestions = questions.map((q, index) => {
            const qKey = `q${index + 1}`;
            const baseKey = `questions.${translationKey}.${qKey}`;
            
            // Check if translation exists
            const hasTranslation = i18n.exists(`${baseKey}.text`);
            
            if (hasTranslation) {
              return {
                ...q,
                text: t(`${baseKey}.text`),
                options: q.options.map((opt, optIndex) => ({
                  ...opt,
                  text: t(`${baseKey}.o${optIndex + 1}`)
                })),
                explanation: t(`${baseKey}.explanation`)
              };
            }
            return q; // Fall back to English
          });
          setQuestions(translatedQuestions);
        } catch (error) {
          // If translation fails, use English
          setQuestions(questions);
        }
      } else {
        // Use English (default)
        setQuestions(questions);
      }
      console.log('Questions set:', questions.length, 'for test:', testId);
    };
    loadQuestions();
  }, [testId, t, i18n]);


  const handleAnswer = (answerId: string) => {
    if (!isAnswered) {
      // Stop speaking when user chooses an answer
      stopSpeaking();
      
      if (!isMuted) lightHaptic(); // Haptic feedback on selection
      setSelectedAnswer(answerId);
      setIsAnswered(true);
      setShowExplanation(true);
      
      if (answerId === questions[currentQuestionIndex].correctAnswerId) {
        setScore(score + 1);
        if (!isMuted) successHaptic(); // Success haptic for correct answer
      } else {
        if (!isMuted) errorHaptic(); // Error haptic for wrong answer
      }
    }
  };

  const nextQuestion = () => {
    if (!isMuted) lightHaptic(); // Haptic feedback on next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      // Test complete - save results to AI Coach
      const percentage = Math.round((score / questions.length) * 100);
      aiCoach.saveTestResult({
        testId: testId || '',
        testName: getTestName(),
        score: score,
        totalQuestions: questions.length,
        percentage: percentage,
        date: new Date().toISOString()
      });
      setTestComplete(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };


  const getTestName = () => {
    switch (testId) {
      case 'traffic-lights-signals': return 'Traffic Lights & Signals';
      case 'priority-rules': return 'Priority & Right of Way';
      case 'hazard-perception': return 'Hazard Perception';
      case 'speed-safety': return 'Speed & Safety';
      case 'bicycle-interactions': return 'Bicycle Interactions';
      case 'roundabout-rules': return 'Roundabout Rules';
      case 'tram-interactions': return 'Tram Interactions';
      case 'pedestrian-crossings': return 'Pedestrian Crossings';
      case 'construction-zones': return 'Construction Zones';
      case 'weather-conditions': return 'Weather Conditions';
      case 'road-signs': return 'Road Signs';
      case 'motorway-rules': return 'Motorway Rules';
      case 'vehicle-knowledge': return 'Vehicle Knowledge';
      case 'parking-rules': return 'Parking Rules';
      case 'environmental': return 'Environmental Zones';
      case 'technology-safety': return 'Technology & Safety';
      case 'alcohol-drugs': return 'Alcohol & Drugs';
      case 'fatigue-rest': return 'Fatigue & Rest';
      case 'emergency-procedures': return 'Emergency Procedures';
      case 'insight-practice': return 'Insight Practice';
      case 'traffic-rules-signs': return 'Traffic Rules & Signs';
      case 'mock-test': return 'Mock Test';
      default: return 'Practice Test';
    }
  };

  const getMotivationWord = () => {
    const isCorrect = selectedAnswer === questions[currentQuestionIndex]?.correctAnswerId;
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

  if (questions.length === 0) {
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
    const percentage = Math.round((score / questions.length) * 100);
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
                <h2>{getTestName()}</h2>
              </div>
              
              <div className="result-score">
                <div className="score-display">
                  <span className="score-number">{score}</span>
                  <span className="score-separator">/</span>
                  <span className="score-total">{questions.length}</span>
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
                    {/* Show Mock Exam CTA if ready OR if this is the mock test AND user scored 70%+ */}
                    {((isReadyForMockExam || testId === 'mock-test') && percentage >= 70) && (
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
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
                Question {currentQuestionIndex + 1} of {questions.length}:
              </span>
              <span className="practice-question-subject">{currentQuestion.subject}</span>
            </div>
            <div className="practice-header-controls">
              {testId === 'mock-test' && (
                <div className="timer">
                  <span className="timer-text">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <button
                className="practice-exit-btn" 
                onClick={() => navigate('/')}
                aria-label="Exit Practice"
                title="Exit Practice"
              >
                ×
              </button>
              <button 
                className={`practice-mute-btn${isMuted ? ' muted' : ''}${isVoiceEnabled ? ' voice-enabled' : ''}`} 
                onClick={() => {
                  toggleMute();
                  if (testId !== 'mock-test') {
                    toggleVoice();
                  }
                }} 
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={testId === 'mock-test' ? (isMuted ? 'Unmute' : 'Mute') : (isVoiceEnabled ? 'Disable Voice' : 'Enable Voice')}
              >
                {testId === 'mock-test' ? (isMuted ? '🔇' : '🔊') : (isVoiceEnabled ? '🎤' : '🔊')}
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

          {showExplanation && testId !== 'mock-test' && (
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
                {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};