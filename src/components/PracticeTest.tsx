import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next'; // Removed - using LanguageContext
import * as questionData from '../question_data';
import { getRandomRealExamQuestions } from '../question_data/realExamQuestions';
import { lightHaptic, successHaptic, errorHaptic } from '../utils/haptics';
import { aiCoach } from '../services/aiCoach';
import { useLanguage } from '../contexts/LanguageContext';
import { audioService } from '../services/audioService';
import { adaptiveDifficultyService } from '../services/adaptiveDifficultyService';
import { logger } from '../utils/logger';
import { aiAdaptiveLearningService, type AILearningInsight } from '../services/aiAdaptiveLearningService';
import { getTranslation as getTranslationHelper } from '../utils/translationHelpers';
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
  const { t, currentLanguage, t_nested } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to muted
  const [timeLeft, setTimeLeft] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [currentDifficultyLevel, setCurrentDifficultyLevel] = useState<number>(3);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [aiInsight, setAiInsight] = useState<AILearningInsight | null>(null);
  const [recentPerformance, setRecentPerformance] = useState<{ correct: number; total: number; averageTime: number }>({ correct: 0, total: 0, averageTime: 0 });

  const speakQuestion = useCallback(() => {
    // MOCK EXAMS: NO TTS - completely silent, no code execution
    // But MOCK TESTS (practice) should have TTS
    if (testId === 'mock-exam') {
      return; // Exit immediately, no TTS code
    }
    
    if (!isVoiceEnabled || isMuted) {
      return;
    }

    if (questions.length === 0) {
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const questionText = currentQuestion?.text || '';

    // Create full text with question and answer options
    let fullText = questionText;
    if (currentQuestion?.options) {
      fullText += '. Options: ';
      currentQuestion.options.forEach((option, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
        fullText += `${optionLetter}: ${option.text}. `;
      });
    }
    
    // Use new audio service
    const lang = (currentLanguage || 'en') as 'en' | 'nl' | 'ar';
    audioService.speak(fullText, lang);
  }, [testId, isVoiceEnabled, isMuted, questions, currentQuestionIndex, currentLanguage]);

  const stopSpeaking = () => {
    // MOCK EXAMS: NO TTS - no speech to stop
    // But MOCK TESTS (practice) should have TTS
    if (testId === 'mock-exam') {
      return;
    }
    audioService.stop();
  };

  const speakExplanation = useCallback(() => {
    if (testId === 'mock-exam' || !isVoiceEnabled || isMuted) {
      return;
    }
    if (questions.length === 0 || !showExplanation) {
      return;
    }
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion?.explanation) {
      const lang = (currentLanguage || 'en') as 'en' | 'nl' | 'ar';
      audioService.speak(currentQuestion.explanation, lang);
    }
  }, [testId, isVoiceEnabled, isMuted, questions, currentQuestionIndex, showExplanation, currentLanguage]);

  // Read explanation when it's shown
  useEffect(() => {
    if (showExplanation && isVoiceEnabled && !isMuted) {
      const timer = setTimeout(() => {
        speakExplanation();
      }, 500); // Small delay after showing explanation
      return () => clearTimeout(timer);
    }
  }, [showExplanation, isVoiceEnabled, isMuted, speakExplanation]);


  const toggleMute = () => {
    // MOCK EXAMS: NO TTS - no mute functionality
    // But MOCK TESTS (practice) should have TTS
    if (testId === 'mock-exam') {
      return;
    }
    
    if (isMuted) {
      // Unmuting - enable voice and start reading
      setIsMuted(false);
      setIsVoiceEnabled(true);
      // Auto-speak current question when unmuted
      setTimeout(() => speakQuestion(), 100);
    } else {
      // Muting - disable voice and stop reading
      setIsMuted(true);
      setIsVoiceEnabled(false);
      stopSpeaking();
    }
  };

  // Auto-speak question when it changes (ONLY for practice tests - NO TTS for mock exams)
  useEffect(() => {
    // MOCK EXAMS: NO TTS - completely silent, no auto-speak
    // But MOCK TESTS (practice) should have TTS
    if (testId === 'mock-exam') {
      return;
    }
    
    
    if (isVoiceEnabled && !isMuted && questions.length > 0) {
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

  // Cleanup speech when component unmounts (ONLY for practice tests)
  useEffect(() => {
    return () => {
      // MOCK EXAMS: NO TTS - no speech to cleanup
      if (testId === 'mock-exam') {
        return;
      }
      audioService.stop();
    };
  }, [testId]);

  // Timer for Mock Exam (30 minutes = 1800 seconds)
  useEffect(() => {
    if (testId === 'mock-exam') {
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

  // Calculate initial difficulty level
  useEffect(() => {
    if (testId && testId !== 'mock-exam') {
      const testHistory = aiCoach.getTestHistory();
      const difficulty = adaptiveDifficultyService.calculateDifficultyLevel(testHistory);
      setCurrentDifficultyLevel(difficulty);
    }
  }, [testId]);

  // Track question start time
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions.length]);

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
          questions = questionData.trafficLightsSignalsQuestions;
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
      if (translationKey && currentLanguage !== 'en') {
        try {
          const translatedQuestions = questions.map((q, index) => {
            const qKey = `q${index + 1}`;
            const baseKey = `questions.${translationKey}.${qKey}`;
            
            // Check if translation exists
            const hasTranslation = false; // Simplified for now
            
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
        // Apply AI-enhanced adaptive learning (except for mock exams)
        if (testId && testId !== 'mock-exam' && questions.length > 0) {
          const testHistory = aiCoach.getTestHistory();
          
          // Get AI-powered difficulty analysis (with fallback to rule-based)
          aiAdaptiveLearningService.analyzeLearningPattern(testHistory)
            .then(insight => {
              setAiInsight(insight);
              setCurrentDifficultyLevel(insight.recommendedDifficulty);
              
              // Get weak topics for prioritization
              const testScores = aiCoach.getTestScores();
              const weakTopics = Object.entries(testScores)
                .filter(([_, data]) => data.average < 60)
                .map(([testId, _]) => {
                  // Map test ID to topic name
                  const topicMap: Record<string, string> = {
                    'priority-rules': 'Priority Rules',
                    'hazard-perception': 'Hazard Perception',
                    'speed-safety': 'Speed Limits',
                    'traffic-lights-signals': 'Traffic Lights',
                    'road-signs': 'Road Signs',
                    'motorway-rules': 'Motorway Rules',
                    'roundabout-rules': 'Roundabout Rules',
                    'bicycle-interactions': 'Bicycle Interactions',
                    'tram-interactions': 'Tram Interactions',
                    'pedestrian-crossings': 'Pedestrian Crossings',
                    'construction-zones': 'Construction Zones',
                    'weather-conditions': 'Weather Conditions',
                    'vehicle-knowledge': 'Vehicle Knowledge',
                    'parking-rules': 'Parking Rules',
                    'environmental': 'Environmental Zones',
                    'technology-safety': 'Technology & Safety',
                    'alcohol-drugs': 'Alcohol & Drugs',
                    'fatigue-rest': 'Fatigue & Rest',
                    'emergency-procedures': 'Emergency Procedures',
                  };
                  return topicMap[testId] || testId;
                });
              
              // Get AI-powered question recommendation (with fallback to rule-based)
              aiAdaptiveLearningService.recommendQuestions(
                questions,
                insight.recommendedDifficulty,
                questions.length,
                testHistory,
                weakTopics.length > 0 ? weakTopics : undefined
              )
                .then(recommendation => {
                  // Filter questions based on AI recommendation (or use rule-based if AI didn't provide IDs)
                  let selectedQuestions: Question[];
                  if (recommendation.questionIds.length > 0) {
                    selectedQuestions = questions.filter(q => 
                      recommendation.questionIds.includes(q.id)
                    );
                    // If AI didn't provide enough questions, fill with rule-based
                    if (selectedQuestions.length < questions.length * 0.7) {
                      const ruleBasedQuestions = adaptiveDifficultyService.selectAdaptiveQuestions(
                        questions,
                        insight.recommendedDifficulty,
                        questions.length,
                        weakTopics.length > 0 ? weakTopics : undefined
                      );
                      selectedQuestions = ruleBasedQuestions;
                    }
                  } else {
                    // Fallback to rule-based selection
                    selectedQuestions = adaptiveDifficultyService.selectAdaptiveQuestions(
                      questions,
                      insight.recommendedDifficulty,
                      questions.length,
                      weakTopics.length > 0 ? weakTopics : undefined
                    );
                  }
                  setQuestions(selectedQuestions);
                })
                .catch(() => {
                  // Fallback to rule-based if AI fails
                  const ruleBasedQuestions = adaptiveDifficultyService.selectAdaptiveQuestions(
                    questions,
                    insight.recommendedDifficulty,
                    questions.length,
                    weakTopics.length > 0 ? weakTopics : undefined
                  );
                  setQuestions(ruleBasedQuestions);
                });
            })
            .catch(() => {
              // Fallback to rule-based if AI analysis fails
              const difficulty = adaptiveDifficultyService.calculateDifficultyLevel(testHistory);
              setCurrentDifficultyLevel(difficulty);
              
              const testScores = aiCoach.getTestScores();
              const weakTopics = Object.entries(testScores)
                .filter(([_, data]) => data.average < 60)
                .map(([testId, _]) => {
                  const topicMap: Record<string, string> = {
                    'priority-rules': 'Priority Rules',
                    'hazard-perception': 'Hazard Perception',
                    'speed-safety': 'Speed Limits',
                    'traffic-lights-signals': 'Traffic Lights',
                    'road-signs': 'Road Signs',
                    'motorway-rules': 'Motorway Rules',
                    'roundabout-rules': 'Roundabout Rules',
                    'bicycle-interactions': 'Bicycle Interactions',
                    'tram-interactions': 'Tram Interactions',
                    'pedestrian-crossings': 'Pedestrian Crossings',
                    'construction-zones': 'Construction Zones',
                    'weather-conditions': 'Weather Conditions',
                    'vehicle-knowledge': 'Vehicle Knowledge',
                    'parking-rules': 'Parking Rules',
                    'environmental': 'Environmental Zones',
                    'technology-safety': 'Technology & Safety',
                    'alcohol-drugs': 'Alcohol & Drugs',
                    'fatigue-rest': 'Fatigue & Rest',
                    'emergency-procedures': 'Emergency Procedures',
                  };
                  return topicMap[testId] || testId;
                });
              
              const adaptiveQuestions = adaptiveDifficultyService.selectAdaptiveQuestions(
                questions,
                difficulty,
                questions.length,
                weakTopics.length > 0 ? weakTopics : undefined
              );
              setQuestions(adaptiveQuestions);
            });
        } else {
          setQuestions(questions);
        }
      }
    };
    loadQuestions();
  }, [testId, t, currentLanguage]);


  const handleAnswer = (answerId: string) => {
    if (!isAnswered) {
      // MOCK EXAMS: NO TTS - no speech to stop
      if (testId !== 'mock-exam') {
        stopSpeaking();
      }
      
      // Calculate time spent on question
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      
      // AI-enhanced adaptive learning: Adjust difficulty after answer
      if (testId && testId !== 'mock-exam') {
        const isCorrect = answerId === questions[currentQuestionIndex].correctAnswerId;
        const currentQuestion = questions[currentQuestionIndex];
        const questionDifficulty = (currentQuestion as any).difficulty || 
          adaptiveDifficultyService.calculateQuestionDifficulty(currentQuestion);
        
        // Update recent performance tracking
        const newCorrect = recentPerformance.correct + (isCorrect ? 1 : 0);
        const newTotal = recentPerformance.total + 1;
        const newAverageTime = (recentPerformance.averageTime * recentPerformance.total + timeSpent) / newTotal;
        const updatedPerformance = {
          correct: newCorrect,
          total: newTotal,
          averageTime: newAverageTime
        };
        setRecentPerformance(updatedPerformance);
        
        // Get AI-powered difficulty adjustment (with fallback to rule-based)
        aiAdaptiveLearningService.adjustDifficultyIntelligently(
          currentDifficultyLevel,
          isCorrect,
          timeSpent,
          questionDifficulty,
          updatedPerformance
        )
          .then(adjustment => {
            setCurrentDifficultyLevel(adjustment.newLevel);
            // Log AI reasoning (development only)
            logger.debug('AI Adjustment:', adjustment.reasoning);
          })
          .catch(() => {
            // Fallback to rule-based adjustment if AI fails
            const newDifficulty = adaptiveDifficultyService.adjustDifficultyAfterAnswer(
              currentDifficultyLevel,
              isCorrect,
              timeSpent,
              questionDifficulty
            );
            setCurrentDifficultyLevel(newDifficulty);
          });
      }
      
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
    // Stop audio when moving to next question or finishing
    if (testId !== 'mock-exam') {
      stopSpeaking();
    }
    
    if (!isMuted) lightHaptic(); // Haptic feedback on next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setQuestionStartTime(Date.now()); // Reset timer for next question
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
      default: return 'Practice Test';
    }
  };

  // Helper function to get translation with fallback
  const getTranslation = (key: string, fallback: string): string => {
    return getTranslationHelper(t_nested, key, fallback);
  };

  const getMotivationWord = () => {
    if (!isAnswered || !selectedAnswer) return '';
    
    const isCorrect = selectedAnswer === questions[currentQuestionIndex]?.correctAnswerId;
    if (isCorrect) {
      const words = [
        t_nested('practice.correctFeedback.excellent'),
        t_nested('practice.correctFeedback.perfect'),
        t_nested('practice.correctFeedback.great'),
        t_nested('practice.correctFeedback.correct'),
        t_nested('practice.correctFeedback.wellDone')
      ];
      const selectedWord = words[Math.floor(Math.random() * words.length)];
      // Fallback if translation returns key
      return selectedWord && selectedWord.startsWith('practice.') ? 'Excellent!' : selectedWord;
    } else {
      const words = [
        t_nested('practice.incorrectFeedback.tryAgain'),
        t_nested('practice.incorrectFeedback.notQuite'),
        t_nested('practice.incorrectFeedback.incorrect'),
        t_nested('practice.incorrectFeedback.wrongAnswer'),
        t_nested('practice.incorrectFeedback.keepTrying')
      ];
      const selectedWord = words[Math.floor(Math.random() * words.length)];
      // Fallback if translation returns key
      return selectedWord && selectedWord.startsWith('practice.') ? 'Try Again' : selectedWord;
    }
  };

  const getNextTest = () => {
    // Get REAL next recommendation from AI Coach (with adaptive learning + weak area priority)
    // This uses the same logic as Dashboard and Practice Page for consistency
    // The recommendation reflects the just-completed test since it's saved before results page shows
    const recommendation = aiCoach.getTopRecommendation(t_nested);
    return { 
      id: recommendation.testId, 
      name: recommendation.testName 
    };
  };

  if (questions.length === 0) {
    return (
      <div className="main-layout">
        <main className="main-content">
          <div className="practice-test">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div>{t_nested('practice.loadingQuestions')}</div>
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

    // Check if all tests are completed
    const testScores = aiCoach.getTestScores();
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
      'traffic-rules-signals': { name: 'Traffic Rules & Signs', category: 'rules' },
    };
    const allTestIds = Object.keys(TEST_METADATA);
    const completedTestIds = Object.keys(testScores);
    const allTestsCompleted = allTestIds.length > 0 && allTestIds.every(testId => completedTestIds.includes(testId));
    
    // Determine if there's a next test (not the same as current test and not all tests completed)
    const hasNextTest = !allTestsCompleted && nextTest.id && nextTest.id !== testId;

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
        return t_nested('practice.excellentWork');
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
                <div className={`score-percentage ${hasMastery ? 'excellent' : needsWork ? 'good' : 'practice'}`}>
                  {percentage}%
                </div>
              </div>

              <div className={`result-message ${hasMastery ? 'excellent' : needsWork ? 'good' : 'practice'}`}>
                {getCoachingMessage()}
              </div>

              <div className="result-actions">
                {/* Context-Aware Button Logic */}
                
                {/* Score < 60% (Critical): Retry is Primary */}
                {isCritical ? (
                  <>
                    <button 
                      className="practice-nav-btn primary retry-btn critical" 
                      onClick={() => {
                        if (testId !== 'mock-exam') {
                          stopSpeaking();
                        }
                        setCurrentQuestionIndex(0);
                        setSelectedAnswer(null);
                        setIsAnswered(false);
                        setShowExplanation(false);
                        setScore(0);
                        setTestComplete(false);
                        setQuestionStartTime(Date.now());
                      }}
                      aria-label={getTranslation('practice.retryTest', 'Retry Test')}
                    >
                      <span className="btn-text">{getTranslation('practice.retryTest', 'Retry Test')}</span>
                      <span className="btn-arrow">↻</span>
                    </button>
                    
                    {/* Secondary: Next Test if available */}
                    {hasNextTest && (
                      <button 
                        className="practice-nav-btn secondary next-test-btn" 
                        onClick={() => {
                          if (testId !== 'mock-exam') {
                            stopSpeaking();
                          }
                          navigate(`/practice/${nextTest.id}`);
                        }}
                        aria-label={`Continue to next test: ${nextTest.name}`}
                      >
                        <span className="btn-text">Next: {nextTest.name}</span>
                      </button>
                    )}
                    
                    {/* Secondary: Dashboard */}
                    <button 
                      className="practice-nav-btn secondary dashboard-btn" 
                      onClick={() => {
                        if (testId !== 'mock-exam') {
                          stopSpeaking();
                        }
                        navigate('/new-dashboard');
                      }}
                      aria-label={getTranslation('practice.goToDashboard', 'Go to dashboard')}
                    >
                      {getTranslation('practice.goToDashboard', 'Go to Dashboard')}
                    </button>
                  </>
                ) : needsWork ? (
                  /* Score 60-79% (Needs Work): Next Test is Primary, Retry is Secondary */
                  <>
                    {hasNextTest ? (
                      <button 
                        className="practice-nav-btn primary next-test-btn" 
                        onClick={() => {
                          if (testId !== 'mock-exam') {
                            stopSpeaking();
                          }
                          navigate(`/practice/${nextTest.id}`);
                        }}
                        aria-label={`Continue to next test: ${nextTest.name}`}
                      >
                        <span className="btn-text">Next Test: {nextTest.name}</span>
                        <span className="btn-arrow">→</span>
                      </button>
                    ) : (
                      <button 
                        className="practice-nav-btn primary dashboard-btn" 
                        onClick={() => {
                          if (testId !== 'mock-exam') {
                            stopSpeaking();
                          }
                          navigate('/new-dashboard');
                        }}
                        aria-label={getTranslation('practice.goToDashboard', 'Go to dashboard')}
                      >
                        <span className="btn-text">{getTranslation('practice.goToDashboard', 'Go to Dashboard')}</span>
                        <span className="btn-arrow">→</span>
                      </button>
                    )}
                    
                    {/* Secondary: Retry Test */}
                    <button 
                      className="practice-nav-btn secondary retry-btn" 
                      onClick={() => {
                        if (testId !== 'mock-exam') {
                          stopSpeaking();
                        }
                        setCurrentQuestionIndex(0);
                        setSelectedAnswer(null);
                        setIsAnswered(false);
                        setShowExplanation(false);
                        setScore(0);
                        setTestComplete(false);
                        setQuestionStartTime(Date.now());
                      }}
                      aria-label={getTranslation('practice.retryTest', 'Retry Test')}
                    >
                      <span className="btn-text">{getTranslation('practice.retryTest', 'Retry Test')}</span>
                    </button>
                    
                    {/* Secondary: Dashboard */}
                    {hasNextTest && (
                      <button 
                        className="practice-nav-btn secondary dashboard-btn" 
                        onClick={() => {
                          if (testId !== 'mock-exam') {
                            stopSpeaking();
                          }
                          navigate('/new-dashboard');
                        }}
                        aria-label={getTranslation('practice.goToDashboard', 'Go to dashboard')}
                      >
                        {getTranslation('practice.goToDashboard', 'Go to Dashboard')}
                      </button>
                    )}
                  </>
                ) : (
                  /* Score ≥ 80% (Mastery): Next Test is Primary */
                  <>
                    {hasNextTest ? (
                      <button 
                        className="practice-nav-btn primary next-test-btn mastery" 
                        onClick={() => {
                          if (testId !== 'mock-exam') {
                            stopSpeaking();
                          }
                          navigate(`/practice/${nextTest.id}`);
                        }}
                        aria-label={`Continue to next test: ${nextTest.name}`}
                      >
                        <span className="btn-text">Next Test: {nextTest.name}</span>
                        <span className="btn-arrow">→</span>
                      </button>
                    ) : (
                      <button 
                        className="practice-nav-btn primary dashboard-btn mastery" 
                        onClick={() => {
                          if (testId !== 'mock-exam') {
                            stopSpeaking();
                          }
                          navigate('/new-dashboard');
                        }}
                        aria-label={getTranslation('practice.goToDashboard', 'Go to dashboard')}
                      >
                        <span className="btn-text">{getTranslation('practice.goToDashboard', 'Go to Dashboard')}</span>
                        <span className="btn-arrow">→</span>
                      </button>
                    )}
                    
                    {/* Secondary: Dashboard (only if next test exists) */}
                    {hasNextTest && (
                      <button 
                        className="practice-nav-btn secondary dashboard-btn" 
                        onClick={() => {
                          if (testId !== 'mock-exam') {
                            stopSpeaking();
                          }
                          navigate('/new-dashboard');
                        }}
                        aria-label={getTranslation('practice.goToDashboard', 'Go to dashboard')}
                      >
                        {getTranslation('practice.goToDashboard', 'Go to Dashboard')}
                      </button>
                    )}
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
  const isCorrect = isAnswered && selectedAnswer === currentQuestion.correctAnswerId;
  // Only get motivation word when answered
  const motivationWord = isAnswered ? getMotivationWord() : '';



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
                {t_nested('practice.question')} {currentQuestionIndex + 1} {t_nested('practice.of')} {questions.length}:
              </span>
              <span className="practice-question-subject">{currentQuestion.subject}</span>
            </div>
            <div className="practice-header-controls">
              {testId === 'mock-exam' && (
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
              {/* Only show voice controls for practice tests - NO TTS for mock exams */}
              {testId !== 'mock-exam' && (
                <button 
                  className={`practice-mute-btn${isMuted ? ' muted' : ''}${isVoiceEnabled ? ' voice-enabled' : ''}`} 
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute and start reading' : 'Mute voice reading'}
                  title={isMuted ? 'Unmute and start reading' : 'Mute voice reading'}
                >
                  {isMuted ? '🔇' : '🎤'}
                </button>
              )}
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

          {showExplanation && testId !== 'mock-exam' && (
            <div className="practice-explanation-section">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isAnswered && motivationWord && (
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
                <div className="practice-explanation-label" style={{ fontSize: '1rem', margin: '0 auto' }}>{t_nested('practice.explanation') || 'Explanation'}</div>
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
                aria-label={currentQuestionIndex < questions.length - 1 
                  ? getTranslation('practice.next', 'Next Question')
                  : getTranslation('practice.finishTest', 'Finish Test')}
              >
                {currentQuestionIndex < questions.length - 1 
                  ? getTranslation('practice.next', 'Next')
                  : getTranslation('practice.finishTest', 'Finish')}
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};