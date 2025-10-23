import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from './Navigation';
import { aiCoach } from '../services/aiCoach';
import './TestsPage.css';

interface PracticeTest {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  icon: string;
}

export const TestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get REAL recommendation from AI Coach
  const [recommendedTest, setRecommendedTest] = useState({
    id: 'traffic-rules-signs',
    name: 'Traffic Rules & Signs',
    reason: 'Perfect starting point'
  });

  useEffect(() => {
    const recommendation = aiCoach.getTopRecommendation();
    setRecommendedTest({
      id: recommendation.testId,
      name: recommendation.testName,
      reason: recommendation.reason
    });
  }, []);

  const practiceTests: PracticeTest[] = [
    {
      id: 'traffic-rules-signs',
      name: 'Traffic Rules & Signs',
      description: 'Learn Dutch traffic rules, signs, and regulations',
      questionCount: 40,
      difficulty: 'medium',
      category: 'Rules',
      icon: '🚦'
    },
    {
      id: 'priority-rules',
      name: 'Priority & Right of Way',
      description: 'Understand priority rules and right of way situations',
      questionCount: 20,
      difficulty: 'medium',
      category: 'Rules',
      icon: '🚩'
    },
    {
      id: 'hazard-perception',
      name: 'Hazard Perception',
      description: 'Learn to recognize and respond to dangerous situations',
      questionCount: 15,
      difficulty: 'hard',
      category: 'Safety',
      icon: '👁️'
    },
    {
      id: 'speed-safety',
      name: 'Speed & Safety',
      description: 'Speed limits, safety rules, and vehicle regulations',
      questionCount: 20,
      difficulty: 'easy',
      category: 'Safety',
      icon: '🛡️'
    },
    {
      id: 'bicycle-interactions',
      name: 'Bicycle Interactions',
      description: 'Learn to safely interact with cyclists on the road',
      questionCount: 15,
      difficulty: 'medium',
      category: 'Interactions',
      icon: '🚴'
    },
    {
      id: 'roundabout-rules',
      name: 'Roundabout Rules',
      description: 'Learn roundabout navigation and priority rules',
      questionCount: 18,
      difficulty: 'medium',
      category: 'Rules',
      icon: '🔄'
    },
    {
      id: 'tram-interactions',
      name: 'Tram Interactions',
      description: 'Understand how to safely interact with trams',
      questionCount: 12,
      difficulty: 'easy',
      category: 'Interactions',
      icon: '🚊'
    },
    {
      id: 'pedestrian-crossings',
      name: 'Pedestrian Crossings',
      description: 'Learn pedestrian crossing rules and safety',
      questionCount: 15,
      difficulty: 'easy',
      category: 'Interactions',
      icon: '🚶'
    },
    {
      id: 'construction-zones',
      name: 'Construction Zones',
      description: 'Navigate construction zones safely',
      questionCount: 10,
      difficulty: 'easy',
      category: 'Zones',
      icon: '🚧'
    },
    {
      id: 'weather-conditions',
      name: 'Weather Conditions',
      description: 'Drive safely in various weather conditions',
      questionCount: 12,
      difficulty: 'easy',
      category: 'Safety',
      icon: '🌧️'
    },
    {
      id: 'road-signs',
      name: 'Road Signs',
      description: 'Advanced road signs and identification',
      questionCount: 25,
      difficulty: 'medium',
      category: 'Signs',
      icon: '🛑'
    },
    {
      id: 'motorway-rules',
      name: 'Motorway Rules',
      description: 'Specific rules for motorway driving',
      questionCount: 18,
      difficulty: 'medium',
      category: 'Rules',
      icon: '🛣️'
    },
    {
      id: 'vehicle-knowledge',
      name: 'Vehicle Knowledge',
      description: 'Vehicle categories and documentation',
      questionCount: 15,
      difficulty: 'easy',
      category: 'Vehicles',
      icon: '🚗'
    },
    {
      id: 'parking-rules',
      name: 'Parking Rules',
      description: 'Parking regulations and restrictions',
      questionCount: 20,
      difficulty: 'medium',
      category: 'Rules',
      icon: '🅿️'
    },
    {
      id: 'environmental',
      name: 'Environmental Zones',
      description: 'Environmental zones and restrictions',
      questionCount: 10,
      difficulty: 'easy',
      category: 'Zones',
      icon: '🌱'
    },
    {
      id: 'technology-safety',
      name: 'Technology & Safety',
      description: 'Modern vehicle technology and safety features',
      questionCount: 12,
      difficulty: 'easy',
      category: 'Technology',
      icon: '🔧'
    },
    {
      id: 'alcohol-drugs',
      name: 'Alcohol & Drugs',
      description: 'Alcohol and drug regulations for drivers',
      questionCount: 15,
      difficulty: 'medium',
      category: 'Safety',
      icon: '🍺'
    },
    {
      id: 'fatigue-rest',
      name: 'Fatigue & Rest',
      description: 'Driver fatigue and rest requirements',
      questionCount: 10,
      difficulty: 'easy',
      category: 'Safety',
      icon: '😴'
    },
    {
      id: 'emergency-procedures',
      name: 'Emergency Procedures',
      description: 'Emergency procedures and protocols',
      questionCount: 12,
      difficulty: 'medium',
      category: 'Safety',
      icon: '🚨'
    },
    {
      id: 'insight-practice',
      name: 'Insight Practice',
      description: 'Practice understanding traffic scenarios',
      questionCount: 20,
      difficulty: 'hard',
      category: 'Advanced',
      icon: '🧠'
    },
    {
      id: 'traffic-lights-signals',
      name: 'Traffic Lights & Signals',
      description: 'Traffic light signals and sequences',
      questionCount: 25,
      difficulty: 'medium',
      category: 'Signals',
      icon: '🚦'
    },
    {
      id: 'mock-test',
      name: 'Mock Test',
      description: 'Practice with official exam format questions',
      questionCount: 25,
      difficulty: 'hard',
      category: 'Practice',
      icon: '📝'
    }
  ];


  const handleTestClick = (testId: string) => {
    navigate(`/practice/${testId}`);
  };

  return (
    <div className="main-layout">
      <Navigation />
      <main className="main-content tests-page">
        <div className="tests-page">
          <div className="tests-header">
            <div className="header-content">
              <div className="header-text">
                <h1>{t('practice.title')}</h1>
              </div>
            </div>
          </div>

          <div className="tests-content">

            {/* Recommendation Banner - iOS/Android Style */}
            <div className="recommendation-banner">
              <div className="recommendation-header">
                <span className="recommendation-title">{t('practice.recommendedForYou')}</span>
              </div>
              <div className="recommendation-content">
                <h3 className="recommendation-test-name">{recommendedTest.name}</h3>
                <p className="recommendation-reason">{recommendedTest.reason}</p>
              </div>
              <button 
                className="recommendation-start-btn"
                onClick={() => handleTestClick(recommendedTest.id)}
              >
                {t('practice.startTest')}
              </button>
            </div>

            {/* Tests Grid */}
            <div className="tests-grid">
              {practiceTests.map((test) => {
                const testScore = aiCoach.getTestScore(test.id);
                const isTestCompleted = testScore !== null && testScore !== undefined;
                return (
                  <div 
                    key={test.id}
                    className="test-card"
                    onClick={() => handleTestClick(test.id)}
                  >
                    <div className="test-content">
                      <h3 className="test-name">
                        {test.name}
                        {isTestCompleted && (
                          <span className="test-score-inline"> - {testScore}%</span>
                        )}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </main>

    </div>
  );
};