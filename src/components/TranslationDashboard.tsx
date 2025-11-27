import React, { useState, useEffect } from 'react';
import { translationAPI } from '../services/translationAPI';
import { translationMetrics } from '../services/translationMetrics';
import { translationFeedback } from '../services/translationFeedback';
import { aiTranslationEnhancer } from '../services/aiTranslationEnhancer';
import { logger } from '../utils/logger';
import './TranslationDashboard.css';

export const TranslationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'feedback' | 'enhancement'>('overview');
  const [metrics, setMetrics] = useState(translationMetrics.getAnalytics());
  const [feedback, setFeedback] = useState(translationFeedback.getAnalytics());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      setMetrics(translationMetrics.getAnalytics());
      setFeedback(translationFeedback.getAnalytics());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleEnhanceTranslation = async (key: string, language: string) => {
    setIsLoading(true);
    try {
      // Get current translation
      const currentTranslation = translationMetrics.getTranslationQuality(key, language);
      if (currentTranslation) {
        const enhancement = await aiTranslationEnhancer.enhanceTranslation(
          key,
          language,
          currentTranslation.originalText,
          currentTranslation.translatedText
        );
        
        logger.debug('Translation enhanced:', enhancement);
        // Here you would update the translation in your strings.ts file
      }
    } catch (error) {
      logger.error('Enhancement failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = (key: string, language: string, rating: number, comment: string) => {
    const feedbackId = translationFeedback.submitFeedback(
      key,
      language,
      '', // originalText
      '', // currentTranslation
      '', // suggestedTranslation
      rating,
      comment
    );
    
    logger.debug('Feedback submitted:', feedbackId);
    setFeedback(translationFeedback.getAnalytics());
  };

  return (
    <div className="translation-dashboard">
      <div className="dashboard-header">
        <h1>Translation Management Dashboard</h1>
        <div className="dashboard-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'quality' ? 'active' : ''}
            onClick={() => setActiveTab('quality')}
          >
            Quality
          </button>
          <button 
            className={activeTab === 'feedback' ? 'active' : ''}
            onClick={() => setActiveTab('feedback')}
          >
            Feedback
          </button>
          <button 
            className={activeTab === 'enhancement' ? 'active' : ''}
            onClick={() => setActiveTab('enhancement')}
          >
            AI Enhancement
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Translation Coverage</h3>
                <div className="metric-value">
                  {metrics.translatedKeys} / {metrics.totalKeys}
                </div>
                <div className="metric-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${(metrics.translatedKeys / metrics.totalKeys) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="metric-card">
                <h3>Quality Distribution</h3>
                <div className="quality-bars">
                  <div className="quality-bar excellent">
                    <span>Excellent (9-10)</span>
                    <span>{metrics.qualityDistribution.excellent}</span>
                  </div>
                  <div className="quality-bar good">
                    <span>Good (7-8)</span>
                    <span>{metrics.qualityDistribution.good}</span>
                  </div>
                  <div className="quality-bar fair">
                    <span>Fair (5-6)</span>
                    <span>{metrics.qualityDistribution.fair}</span>
                  </div>
                  <div className="quality-bar poor">
                    <span>Poor (1-4)</span>
                    <span>{metrics.qualityDistribution.poor}</span>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <h3>User Satisfaction</h3>
                <div className="metric-value">
                  {feedback.averageRating.toFixed(1)} / 5.0
                </div>
                <div className="satisfaction-stars">
                  {'★'.repeat(Math.floor(feedback.averageRating))}
                  {'☆'.repeat(5 - Math.floor(feedback.averageRating))}
                </div>
              </div>

              <div className="metric-card">
                <h3>Pending Feedback</h3>
                <div className="metric-value">
                  {feedback.pendingCount}
                </div>
                <div className="metric-label">
                  Items need review
                </div>
              </div>
            </div>

            <div className="top-contributors">
              <h3>Top Contributors</h3>
              <div className="contributors-list">
                {feedback.topContributors.map((contributor, index) => (
                  <div key={index} className="contributor-item">
                    <span className="contributor-name">{contributor.user}</span>
                    <span className="contributor-count">{contributor.count} contributions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="quality-tab">
            <h3>Translation Quality Analysis</h3>
            <div className="quality-recommendations">
              {translationMetrics.getQualityRecommendations().map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-header">
                    <span className="recommendation-key">{rec.key}</span>
                    <span className="recommendation-language">{rec.language}</span>
                    <span className={`priority priority-${rec.priority}`}>
                      Priority {rec.priority}
                    </span>
                  </div>
                  <div className="recommendation-text">{rec.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-tab">
            <h3>User Feedback</h3>
            <div className="feedback-list">
              {translationFeedback.getPendingFeedback().map((item) => (
                <div key={item.id} className="feedback-item">
                  <div className="feedback-header">
                    <span className="feedback-key">{item.key}</span>
                    <span className="feedback-language">{item.language}</span>
                    <span className="feedback-rating">{item.rating}/5</span>
                  </div>
                  <div className="feedback-content">
                    <div className="feedback-comment">{item.comment}</div>
                    <div className="feedback-suggestion">
                      <strong>Suggested:</strong> {item.suggestedTranslation}
                    </div>
                  </div>
                  <div className="feedback-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => translationFeedback.approveFeedback(item.id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => translationFeedback.rejectFeedback(item.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'enhancement' && (
          <div className="enhancement-tab">
            <h3>AI Translation Enhancement</h3>
            <div className="enhancement-controls">
              <button 
                className="enhance-all-btn"
                onClick={() => {
                  // Enhance all low-quality translations
                  const recommendations = translationMetrics.getQualityRecommendations();
                  recommendations.forEach(rec => {
                    handleEnhanceTranslation(rec.key, rec.language);
                  });
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Enhancing...' : 'Enhance All Low Quality'}
              </button>
            </div>
            
            <div className="enhancement-results">
              {/* Show enhancement results here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};














