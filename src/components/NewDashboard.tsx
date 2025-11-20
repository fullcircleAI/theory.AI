import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { aiCoach, type AIInsight } from '../services/aiCoach';
import { studyTimeTracker } from '../services/studyTimeTracker';
import './AICoachDashboard.css';
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
  const { t_nested } = useLanguage();

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
    // Load user progress from aiCoach
    const testHistory = aiCoach.getTestHistory();
    // Use actual tracked time (not estimated from questions)
    const studyTime = studyTimeTracker.getStudyTimeHours();
    const averageScore = aiCoach.getCombinedAverage();
    
    // Calculate total questions and correct answers from test history
    const totalQuestions = testHistory.reduce((sum, test) => sum + test.totalQuestions, 0);
    const correctAnswers = testHistory.reduce((sum, test) => sum + test.score, 0);
    
    setUserProgress({
      averageScore: averageScore || 0,
      totalQuestions,
      correctAnswers,
      studyTime: studyTime || 0,
    });

    // AI insights are calculated on-demand when needed

    // Get test scores
    const testScores = aiCoach.getTestScores();
    const allTestIds = Object.keys(TEST_METADATA);
    
    // Check if all tests are completed
    // A test is considered completed if it exists in testScores (has been taken at least once)
    const completedTestIds = Object.keys(testScores);
    const allCompleted = allTestIds.length > 0 && allTestIds.every(testId => {
      // Check if this test has been completed (exists in testScores)
      return completedTestIds.includes(testId);
    });
    
    // Debug logging (can be removed later)
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard completion check:', {
        totalTests: allTestIds.length,
        completedTests: completedTestIds.length,
        allCompleted,
        missingTests: allTestIds.filter(id => !completedTestIds.includes(id))
      });
    }
    
    setAllTestsCompleted(allCompleted);

    // Get the MOST IMPORTANT weak area (only one - worst score)
    let topWeakArea: { testId: string; name: string; score: number } | null = null;
    Object.entries(testScores).forEach(([testId, data]) => {
      if (data.average < 60 && TEST_METADATA[testId]) {
        if (!topWeakArea || data.average < topWeakArea.score) {
          const testName = getTranslatedTestName(testId);
          topWeakArea = {
            testId,
            name: testName,
            score: Math.round(data.average)
          };
        }
      }
    });
    setWeakAreas(topWeakArea ? [topWeakArea] : []);

    // Get the MOST IMPORTANT strong area (only one - best score)
    let topStrongArea: { testId: string; name: string; score: number } | null = null;
    Object.entries(testScores).forEach(([testId, data]) => {
      if (data.average >= 80 && TEST_METADATA[testId]) {
        if (!topStrongArea || data.average > topStrongArea.score) {
          const testName = getTranslatedTestName(testId);
          topStrongArea = {
            testId,
            name: testName,
            score: Math.round(data.average)
          };
        }
      }
    });
    setStrongAreas(topStrongArea ? [topStrongArea] : []);

    // Get the MOST IMPORTANT recommended test using ADAPTIVE LEARNING
    // This uses the same method as TestsPage and PracticeTest for consistency
    const recommendation = aiCoach.getTopRecommendation(t_nested);
    const topRecommendation: { testId: string; name: string } = {
      testId: recommendation.testId,
      name: recommendation.testName
    };
    setRecommendedTests([topRecommendation]);
  }, [t_nested, getTranslatedTestName]);

  const formatStudyTime = (hours: number): string => {
    const totalSeconds = Math.floor(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Update study time display every second (for live countdown)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = studyTimeTracker.getStudyTimeHours();
      
      setUserProgress(prev => ({
        ...prev,
        studyTime: currentTime
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getExamReadiness = Math.min(100, Math.round((userProgress.averageScore / 100) * 100));

  return (
    <div className={`main-layout`}>
      <main className="main-content">
        <div className="dashboard">
          <div className="dashboard-summary">
            <div className="summary-stats">
              <div className="summary-stat">
                <div className="stat-number">{getExamReadiness}%</div>
                <div className="stat-label">
                  {t_nested('dashboard.examReadiness') || 'Exam Readiness'}
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill"
                    style={{
                      width: `${getExamReadiness}%`,
                      backgroundColor: getExamReadiness >= 80 ? '#10b981' : getExamReadiness >= 60 ? '#f59e0b' : '#ef4444'
                    }}
                  ></div>
                </div>
              </div>

              <div className="summary-stat combined-progress">
                <div className="digital-watch-container">
                  <div className="digital-watch-display">
                    <div className="time-section">
                      <span className="time-label">{t_nested('dashboard.studyTime') || 'Study Time'}</span>
                      <span className="time-value">{formatStudyTime(userProgress.studyTime)}</span>
                    </div>
                    <div className="progress-section">
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill"
                          style={{
                            width: `${(userProgress.studyTime / 24) * 100}%`,
                            backgroundColor: '#10b981'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="time-section">
                      <span className="time-label">{t_nested('dashboard.timeRemaining') || 'Time Remaining'}</span>
                      <span className="time-value">{formatStudyTime(studyTimeTracker.getTimeRemaining() / 3600)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-insights-summary">
            <h3>{t_nested('dashboard.yourProgress') || 'Your Progress'}</h3>
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
                      <p className="insight-explanation">
                        {t_nested('dashboard.allTestsCompleted') || 'All practice tests completed! You can now take mock exams.'}
                      </p>
                      <div className="insight-action">
                        <button
                          className="start-practice-btn"
                          onClick={() => navigate('/mock-exam')}
                        >
                          {t_nested('dashboard.startPractice') || 'Start'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {recommendedTests.length > 0 ? (
                        <>
                          <p className="insight-explanation">
                            {recommendedTests[0].name}
                          </p>
                          <div className="insight-action">
                            <button
                              className="start-practice-btn"
                              onClick={() => navigate(`/practice/${recommendedTests[0].testId}`)}
                            >
                              {t_nested('dashboard.startPractice') || 'Start'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="insight-explanation">
                            {t_nested('dashboard.startFirstTest') || 'Start with your first practice test!'}
                          </p>
                          <div className="insight-action">
                            <button
                              className="start-practice-btn"
                              onClick={() => navigate('/tests')}
                            >
                              {t_nested('dashboard.startPractice') || 'Start'}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Yellow/Amber Card - Focus (Most Important Weak Area) */}
              <div className="insight-card amber">
                <div className="insight-content">
                  <h4>{t_nested('dashboard.focus') || 'Focus'}</h4>
                  {weakAreas.length > 0 ? (
                    <p className="insight-explanation">
                      {weakAreas[0].name} - {weakAreas[0].score}%
                    </p>
                  ) : (
                    <p className="insight-explanation">
                      {t_nested('dashboard.noWeakAreas') || 'No weak areas identified yet. Keep practicing!'}
                    </p>
                  )}
                </div>
              </div>

              {/* Green Card - Strength (Most Important Strong Area) */}
              <div className="insight-card green">
                <div className="insight-content">
                  <h4>{t_nested('dashboard.strength') || 'Strength'}</h4>
                  {strongAreas.length > 0 ? (
                    <>
                      <p className="insight-explanation">
                        {strongAreas[0].name} - {strongAreas[0].score}%
                      </p>
                      <p className="insight-explanation" style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>
                        {t_nested('dashboard.maintainStrength') || 'Keep maintaining this strength!'}
                      </p>
                    </>
                  ) : (
                    <p className="insight-explanation">
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

