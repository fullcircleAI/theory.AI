import React, { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { aiCoach, type AIInsight } from '../services/aiCoach';
import { studyTimeTracker } from '../services/studyTimeTracker';
import { RoadProgress } from './RoadProgress';
import './AICoachDashboard.css';
import { getTranslation } from '../utils/translationHelpers';
import { logger } from '../utils/logger';
import '../mobile-optimizations.css';

// Test metadata (same as in aiCoach.ts)
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

export const NewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t_nested, currentLanguage } = useLanguage();

  // Function to get translated test name (memoized to fix dependency warning)
  const getTranslatedTestName = useCallback((testId: string): string => {
    const testNameMap: Record<string, string> = {
      'traffic-lights-signals': t_nested('testNames.trafficLightsSignals'),
      'priority-rules': t_nested('testNames.priorityRules'),
      'hazard-perception': t_nested('testNames.hazardPerception'),
      'speed-safety': t_nested('testNames.speedSafety'),
      'bicycle-interactions': t_nested('testNames.bicycleInteractions'),
      'roundabout-rules': t_nested('testNames.roundaboutRules'),
      'tram-interactions': t_nested('testNames.tramInteractions'),
      'pedestrian-crossings': t_nested('testNames.pedestrianCrossings'),
      'construction-zones': t_nested('testNames.constructionZones'),
      'weather-conditions': t_nested('testNames.weatherConditions'),
      'road-signs': t_nested('testNames.roadSigns'),
      'motorway-rules': t_nested('testNames.motorwayRules'),
      'vehicle-knowledge': t_nested('testNames.vehicleKnowledge'),
      'parking-rules': t_nested('testNames.parkingRules'),
      'environmental': t_nested('testNames.environmental'),
      'environmental-zones': t_nested('testNames.environmental'),
      'technology-safety': t_nested('testNames.technologySafety'),
      'alcohol-drugs': t_nested('testNames.alcoholDrugs'),
      'fatigue-rest': t_nested('testNames.fatigueRest'),
      'emergency-procedures': t_nested('testNames.emergencyProcedures'),
      'insight-practice': t_nested('testNames.insightPractice'),
      'traffic-rules-signs': t_nested('testNames.trafficLightsSignals'),
    };
    return testNameMap[testId] || TEST_METADATA[testId]?.name || testId;
  }, [t_nested]);
  const [userProgress, setUserProgress] = useState({
    averageScore: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    studyTime: 0,
  });
  // Removed unused aiInsights state - insights are calculated on-demand
  const [weakAreas, setWeakAreas] = useState<Array<{ testId: string; name: string; score: number }>>([]);
  const [strongAreas, setStrongAreas] = useState<Array<{ testId: string; name: string; score: number }>>([]);
  const [recommendedTests, setRecommendedTests] = useState<Array<{ testId: string; name: string }>>([]);
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [completedCounts, setCompletedCounts] = useState({ practiceTests: 0, mockExams: 0 });
  // Separate state for study time to prevent unnecessary re-renders
  const [currentStudyTime, setCurrentStudyTime] = useState(0);
  
  // Use ref to track if data has been loaded to prevent unnecessary re-runs
  const dataLoadedRef = useRef(false);
  const lastLanguageRef = useRef<string | null>(null);
  // Store latest functions in refs to avoid dependency issues
  const tNestedRef = useRef(t_nested);
  const getTranslatedTestNameRef = useRef(getTranslatedTestName);
  
  // Update refs when functions change
  useEffect(() => {
    tNestedRef.current = t_nested;
    getTranslatedTestNameRef.current = getTranslatedTestName;
  }, [t_nested, getTranslatedTestName]);

  useEffect(() => {
    // Initialize study time tracker (starts timer when dashboard is entered)
    studyTimeTracker.initialize();
    studyTimeTracker.startTimer();
    
    // Cleanup: stop timer when component unmounts
    return () => {
      studyTimeTracker.stopTimer();
    };
  }, []);

  useEffect(() => {
    // Only reload data if language actually changed, not on every render
    const shouldReload = !dataLoadedRef.current || lastLanguageRef.current !== currentLanguage;
    
    if (!shouldReload && dataLoadedRef.current) {
      return; // Skip if data already loaded and language hasn't changed
    }
    
    // Mark as loaded and update language ref
    dataLoadedRef.current = true;
    lastLanguageRef.current = currentLanguage || null;
    
    // Batch all state updates using startTransition to prevent flickering
    // This marks updates as non-urgent, allowing React to batch them smoothly
    startTransition(() => {
      // Load user progress from aiCoach
      const testHistory = aiCoach.getTestHistory();
      // Use actual tracked time (not estimated from questions)
      const studyTime = studyTimeTracker.getStudyTimeHours();
      const averageScore = aiCoach.getCombinedAverage();
      
      // Calculate total questions and correct answers from test history
      const totalQuestions = testHistory.reduce((sum, test) => sum + test.totalQuestions, 0);
      const correctAnswers = testHistory.reduce((sum, test) => sum + test.score, 0);
      
      const newProgress = {
        averageScore: averageScore || 0,
        totalQuestions,
        correctAnswers,
        studyTime: studyTime || 0,
      };
      
      // Only update if values actually changed (prevents unnecessary re-renders)
      setUserProgress(prev => {
        if (prev.averageScore !== newProgress.averageScore ||
            prev.totalQuestions !== newProgress.totalQuestions ||
            prev.correctAnswers !== newProgress.correctAnswers ||
            prev.studyTime !== newProgress.studyTime) {
          return newProgress;
        }
        return prev;
      });
      
      // Initialize currentStudyTime from loaded studyTime
      setCurrentStudyTime(prev => {
        const newTime = studyTime || 0;
        return Math.abs(prev - newTime) > 0.001 ? newTime : prev;
      });

      // Get test scores
      const testScores = aiCoach.getTestScores();
      const allTestIds = Object.keys(TEST_METADATA);
      
      // Check if all tests are completed
      const completedTestIds = Object.keys(testScores);
      const allCompleted = allTestIds.length > 0 && allTestIds.every(testId => {
        return completedTestIds.includes(testId);
      });
      
      logger.debug('Dashboard completion check:', {
        totalTests: allTestIds.length,
        completedTests: completedTestIds.length,
        allCompleted,
        missingTests: allTestIds.filter(id => !completedTestIds.includes(id))
      });
      
      setAllTestsCompleted(allCompleted);

      // Calculate Journey Progress
      const PRACTICE_TEST_MIN_SCORE = 80;
      const MOCK_EXAM_MIN_SCORE = 88;
      const TOTAL_PRACTICE_TESTS = allTestIds.length;
      const TOTAL_MOCK_EXAMS = 3;
      
      const completedPracticeTests = Object.entries(testScores).filter(([testId, data]) => {
        return TEST_METADATA[testId] && data.average >= PRACTICE_TEST_MIN_SCORE;
      }).length;
      
      const mockExamResults = aiCoach.getMockExamResults();
      const completedMockExams = mockExamResults.filter(result => result.percentage >= MOCK_EXAM_MIN_SCORE).length;
      
      const practiceProgress = (completedPracticeTests / TOTAL_PRACTICE_TESTS) * 50;
      const mockExamProgress = (completedMockExams / TOTAL_MOCK_EXAMS) * 50;
      const totalProgress = Math.min(100, Math.round(practiceProgress + mockExamProgress));
      
      setJourneyProgress(prev => prev !== totalProgress ? totalProgress : prev);
      setCompletedCounts(prev => {
        if (prev.practiceTests !== completedPracticeTests || prev.mockExams !== completedMockExams) {
          return { 
            practiceTests: completedPracticeTests, 
            mockExams: completedMockExams 
          };
        }
        return prev;
      });

      // Get the MOST IMPORTANT weak area (only one - worst score)
      let topWeakArea: { testId: string; name: string; score: number } | null = null;
      Object.entries(testScores).forEach(([testId, data]) => {
        if (data.average < 60 && TEST_METADATA[testId]) {
          if (!topWeakArea || data.average < topWeakArea.score) {
            const testName = getTranslatedTestNameRef.current(testId);
            topWeakArea = {
              testId,
              name: testName,
              score: Math.round(data.average)
            };
          }
        }
      });
      setWeakAreas(prev => {
        const newWeakArea = topWeakArea ? [topWeakArea] : [];
        if (prev.length === 0 && newWeakArea.length === 0) return prev;
        if (prev.length === 0 || newWeakArea.length === 0) return newWeakArea;
        if (prev[0].testId !== newWeakArea[0].testId || prev[0].score !== newWeakArea[0].score) {
          return newWeakArea;
        }
        return prev;
      });

      // Get the MOST IMPORTANT strong area (only one - best score)
      let topStrongArea: { testId: string; name: string; score: number } | null = null;
      Object.entries(testScores).forEach(([testId, data]) => {
        if (data.average >= 80 && TEST_METADATA[testId]) {
          if (!topStrongArea || data.average > topStrongArea.score) {
            const testName = getTranslatedTestNameRef.current(testId);
            topStrongArea = {
              testId,
              name: testName,
              score: Math.round(data.average)
            };
          }
        }
      });
      setStrongAreas(prev => {
        const newStrongArea = topStrongArea ? [topStrongArea] : [];
        if (prev.length === 0 && newStrongArea.length === 0) return prev;
        if (prev.length === 0 || newStrongArea.length === 0) return newStrongArea;
        if (prev[0].testId !== newStrongArea[0].testId || prev[0].score !== newStrongArea[0].score) {
          return newStrongArea;
        }
        return prev;
      });

      // Get the MOST IMPORTANT recommended test using ADAPTIVE LEARNING
      const recommendation = aiCoach.getTopRecommendation(tNestedRef.current);
      const topRecommendation: { testId: string; name: string } = {
        testId: recommendation.testId,
        name: recommendation.testName
      };
      setRecommendedTests(prev => {
        if (prev.length === 0 || prev[0].testId !== topRecommendation.testId) {
          return [topRecommendation];
        }
        return prev;
      });
    });
  }, [currentLanguage]); // Only depend on language changes - functions accessed via refs

  // Memoize translated strings to prevent re-renders
  const studyTimeLabel = useMemo(() => t_nested('dashboard.studyTime') || 'Study Time', [t_nested]);
  const timeRemainingLabel = useMemo(() => t_nested('dashboard.timeRemaining') || 'Time Remaining', [t_nested]);
  const yourProgressLabel = useMemo(() => t_nested('dashboard.yourProgress') || 'Your Progress', [t_nested]);

  const formatStudyTime = useCallback((hours: number): string => {
    const totalSeconds = Math.floor(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Update study time display every 15 seconds (reduced frequency to prevent flickering)
  // Use separate state to avoid re-rendering entire component
  useEffect(() => {
    // Initial load
    const currentTime = studyTimeTracker.getStudyTimeHours();
    setCurrentStudyTime(currentTime);
    
    // Update every 15 seconds (less frequent to reduce flickering)
    const interval = setInterval(() => {
      const newTime = studyTimeTracker.getStudyTimeHours();
      // Use startTransition to mark as non-urgent update
      startTransition(() => {
        setCurrentStudyTime(prev => {
          const roundedPrev = Math.round(prev * 3600);
          const roundedNew = Math.round(newTime * 3600);
          // Return new value only if changed
          return roundedPrev !== roundedNew ? newTime : prev;
        });
      });
    }, 15000); // 15 seconds to reduce flickering

    return () => clearInterval(interval);
  }, []);


  return (
    <div className={`main-layout`}>
      <main className="main-content">
        <div className="dashboard">
          <div className="dashboard-summary">
            <div className="summary-stats">
              {/* Journey Progress - Road with Car */}
              <div className="summary-stat">
                <RoadProgress 
                  progress={journeyProgress}
                  showLabel={false}
                />
              </div>
              
              <div className="summary-stat combined-progress">
                <div className="digital-watch-container">
                  <div className="digital-watch-display">
                    <div className="time-section">
                      <span className="time-label">{studyTimeLabel}</span>
                      <span className="time-value">{formatStudyTime(currentStudyTime)}</span>
                    </div>
                    <div className="progress-section">
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, (currentStudyTime / 24) * 100)}%`,
                            background: currentStudyTime >= 24 
                              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                              : 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                            transition: 'width 0.5s ease-out' // Slower, smoother transition
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="time-section">
                      <span className="time-label">{timeRemainingLabel}</span>
                      <span className="time-value">{formatStudyTime(Math.max(0, 24 - currentStudyTime))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-insights-summary">
            <h3>{yourProgressLabel}</h3>
            <div className="insights-grid">
              {/* Red Box - Recommendation or Mock Exams */}
              <div className="insight-card red">
                <div className="insight-content">
                  <h4>
                    {allTestsCompleted 
                      ? (t_nested('dashboard.mockExamsAvailable') || 'Mock Exams Available')
                      : (t_nested('dashboard.recommendation') || 'Recommendation')}
                  </h4>
                  {allTestsCompleted ? (
                    <>
                      <p className="insight-explanation" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {t_nested('dashboard.allTestsCompleted') || 'All practice tests completed! You can now take mock exams.'}
                      </p>
                      <div className="insight-action">
                        <button
                          className="start-practice-btn"
                          onClick={() => navigate('/mock-exam')}
                        >
                          {getTranslation(t_nested, 'dashboard.startPractice', 'Start')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {recommendedTests.length > 0 ? (
                        <>
                          {weakAreas.length > 0 && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              marginBottom: '0.75rem',
                              justifyContent: 'center'
                            }}>
                              <span style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.4rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                              }}>
                                Weak Area
                              </span>
                            </div>
                          )}
                          <p className="insight-explanation practice-test-name" style={{ marginBottom: '0.75rem' }}>
                            {recommendedTests[0].name}
                          </p>
                          <div className="insight-action">
                            <button
                              className="start-practice-btn"
                              onClick={() => navigate(`/practice/${recommendedTests[0].testId}`)}
                            >
                              {getTranslation(t_nested, 'dashboard.startPractice', 'Start')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="insight-explanation" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {t_nested('dashboard.startFirstTest') || 'Start with your first practice test!'}
                          </p>
                          <div className="insight-action">
                            <button
                              className="start-practice-btn"
                              onClick={() => navigate('/tests')}
                            >
                              {getTranslation(t_nested, 'dashboard.startPractice', 'Start')}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Yellow/Amber Card - Focus (Most Important Weak Area) */}
              <div className="insight-card amber" key={`amber-${weakAreas.length > 0 ? weakAreas[0].testId : 'empty'}`}>
                <div className="insight-content">
                  <h4 style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
                    {t_nested('dashboard.focus') || 'Focus'}
                  </h4>
                  {weakAreas.length > 0 ? (
                    <p className="insight-explanation practice-test-name" style={{ 
                      textAlign: 'center',
                      color: weakAreas[0].score < 50 ? '#dc2626' : '#d97706'
                    }}>
                      {weakAreas[0].name}
                      <br />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.25rem', display: 'block' }}>
                        {weakAreas[0].score}%
                      </span>
                    </p>
                  ) : (
                    <p className="insight-explanation" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
                      {t_nested('dashboard.noWeakAreas') || 'No weak areas identified yet. Keep practicing!'}
                    </p>
                  )}
                </div>
              </div>

              {/* Green Card - Strength (Most Important Strong Area) */}
              <div className="insight-card green" key={`green-${strongAreas.length > 0 ? strongAreas[0].testId : 'empty'}`}>
                <div className="insight-content">
                  <h4 style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
                    {t_nested('dashboard.strength') || 'Strength'}
                  </h4>
                  {strongAreas.length > 0 ? (
                    <p className="insight-explanation practice-test-name" style={{ 
                      textAlign: 'center',
                      color: '#059669'
                    }}>
                      {strongAreas[0].name}
                      <br />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.25rem', display: 'block' }}>
                        {strongAreas[0].score}%
                      </span>
                    </p>
                  ) : (
                    <p className="insight-explanation" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
                      {t_nested('dashboard.completeTestsForStrength') || 'Complete practice tests to see your strong areas.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

