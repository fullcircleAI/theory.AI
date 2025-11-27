import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translationHelpers';
import { Mascot } from './Mascot';
import './AICoachRecommendations.css';

interface StudyRecommendation {
  topic: string;
  priority: 'high' | 'medium' | 'low';
  timeNeeded: number;
  readiness: number;
  method: string;
  description: string;
  resources: string[];
}

interface LearningStyle {
  type: string;
  description: string;
  effectiveness: number;
}

export const AICoachRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const { t_nested } = useLanguage();
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [learningStyle, setLearningStyle] = useState<LearningStyle | null>(null);
  const [studyPlan, setStudyPlan] = useState<string[]>([]);

  useEffect(() => {
    // Simulate loading AI recommendations
    const mockRecommendations: StudyRecommendation[] = [
      {
        topic: 'Traffic Lights',
        priority: 'high',
        timeNeeded: 2,
        readiness: 60,
        method: 'Visual Learning',
        description: 'Focus on traffic light sequences with visual examples',
        resources: ['Traffic Light Videos', 'Interactive Diagrams', 'Practice Tests']
      },
      {
        topic: 'Priority Rules',
        priority: 'medium',
        timeNeeded: 1.5,
        readiness: 75,
        method: 'Practice-Based Learning',
        description: 'Practice with real-world scenarios and examples',
        resources: ['Scenario Practice', 'Road Diagrams', 'Video Examples']
      },
      {
        topic: 'Roundabouts',
        priority: 'high',
        timeNeeded: 1,
        readiness: 45,
        method: 'Visual + Practice',
        description: 'Combine visual learning with hands-on practice',
        resources: ['Roundabout Diagrams', 'Lane Selection Practice', 'Video Tutorials']
      },
      {
        topic: 'Speed Limits',
        priority: 'low',
        timeNeeded: 0.5,
        readiness: 90,
        method: 'Quick Review',
        description: 'Quick review of speed limit rules',
        resources: ['Speed Limit Chart', 'Quick Quiz']
      }
    ];

    const mockLearningStyle: LearningStyle = {
      type: 'Visual Learner',
      description: 'You learn 40% faster with visual content like diagrams, videos, and interactive examples',
      effectiveness: 85
    };

    const mockStudyPlan = [
      'Today: Focus on Traffic Lights (2 hours) - Your biggest weakness',
      'Tomorrow: Practice Priority Rules (1.5 hours) - Build confidence',
      'This Week: Learn Roundabouts (1 hour daily) - Visual + practice',
      'Next Week: Review Speed Limits (30 min) - Quick refresh'
    ];

    setRecommendations(mockRecommendations);
    setLearningStyle(mockLearningStyle);
    setStudyPlan(mockStudyPlan);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return t_nested('recommendations.highPriority');
      case 'medium': return t_nested('recommendations.mediumPriority');
      case 'low': return t_nested('recommendations.lowPriority');
      default: return priority;
    }
  };

  return (
    <div className="main-layout">
      <main className="main-content">
        <div className="recommendations-container">
          <div className="recommendations-header">
            <div className="header-content">
              <div className="header-mascot">
                <Mascot size={60} />
              </div>
              <div className="header-text">
                <h1>📚 {t_nested('recommendations.title')}</h1>
                <p>Personalized study plan based on your learning patterns</p>
              </div>
            </div>
            <button 
              className="back-button"
              onClick={() => navigate('/')}
            >
              × {getTranslation(t_nested, 'recommendations.close', 'Close')}
            </button>
          </div>

          {/* Learning Style Analysis */}
          {learningStyle && (
            <div className="learning-style-card">
              <h2>🧠 Your Learning Style</h2>
              <div className="learning-style-content">
                <div className="learning-type">
                  <div className="type-label">{learningStyle.type === 'Visual Learner' ? t_nested('recommendations.visualLearner') : learningStyle.type}</div>
                  <div className="effectiveness">{learningStyle.effectiveness}% Effective</div>
                </div>
                <p>{learningStyle.description === 'You learn 40% faster with visual content like diagrams, videos, and interactive examples' ? t_nested('recommendations.learningStyleDescription') : learningStyle.description}</p>
              </div>
            </div>
          )}

          {/* Study Plan Overview */}
          <div className="study-plan-card">
            <h2>📅 {t_nested('recommendations.studyPlan')}</h2>
            <div className="study-plan-list">
              {studyPlan.map((item, index) => (
                <div key={index} className="plan-item">
                  <div className="plan-number">{index + 1}</div>
                  <div className="plan-text">{item}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Recommendations */}
          <div className="recommendations-list">
            <h2>🎯 Detailed Study Recommendations</h2>
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="recommendation-header">
                  <div className="topic-name">{rec.topic}</div>
                  <div 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(rec.priority) }}
                  >
                    {getPriorityLabel(rec.priority)}
                  </div>
                </div>
                
                <div className="recommendation-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">{t_nested('recommendations.timeNeeded')}</div>
                      <div className="detail-value">{rec.timeNeeded} {t_nested('recommendations.hours')}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t_nested('recommendations.readiness')}</div>
                      <div className="detail-value">{rec.readiness}%</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">{t_nested('recommendations.method')}</div>
                      <div className="detail-value">{rec.method}</div>
                    </div>
                  </div>
                  
                  <div className="recommendation-description">
                    <strong>Focus:</strong> {rec.description}
                  </div>
                  
                  <div className="recommendation-resources">
                    <strong>{t_nested('recommendations.resources')}:</strong>
                    <div className="resources-list">
                      {rec.resources.map((resource, idx) => (
                        <span key={idx} className="resource-tag">{resource}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="recommendations-actions">
            <button 
              className="action-button"
              onClick={() => navigate('/')}
            >
              {getTranslation(t_nested, 'recommendations.viewDashboard', 'View Dashboard')}
            </button>
            <button 
              className="action-button secondary"
              onClick={() => navigate('/')}
            >
              {getTranslation(t_nested, 'recommendations.viewDashboard', 'View Dashboard')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
