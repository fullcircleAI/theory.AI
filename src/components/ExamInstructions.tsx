import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translationHelpers';
import './TestsPage.css';

export const ExamInstructions: React.FC = () => {
  const navigate = useNavigate();
  const { t_nested } = useLanguage();

  const handleStartExam = () => {
    navigate('/mock-exam');
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="main-layout">
      <main className="main-content tests-page">
        <div className="tests-page">
          <div className="tests-header">
            <div className="header-content">
              <div className="header-text">
                <h1>Exam Instructions</h1>
                <p>Everything you need to know before taking your driving theory exam</p>
              </div>
              <button 
                className="back-button-icon"
                onClick={handleBackToDashboard}
                title="Back to Dashboard"
              >
                ←
              </button>
            </div>
          </div>

          <div className="tests-content">
            <div className="instruction-sections">
              
              {/* Exam Format Section */}
              <div className="instruction-section">
                <div className="section-header">
                  <h2>Exam Format</h2>
                </div>
                <div className="section-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-icon"></div>
                      <div className="info-text">
                        <h3>Time Limit</h3>
                        <p>30 minutes to complete 50 questions</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon"></div>
                      <div className="info-text">
                        <h3>Pass Rate</h3>
                        <p>You need 88% (44 correct answers) to pass</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon"></div>
                      <div className="info-text">
                        <h3>Navigation</h3>
                        <p>You can go back and change answers</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon"></div>
                      <div className="info-text">
                        <h3>Question Types</h3>
                        <p>Multiple choice with 3 answer options</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Expect Section */}
              <div className="instruction-section">
                <div className="section-header">
                  <h2>What to Expect</h2>
                </div>
                <div className="section-content">
                  <div className="expectation-list">
                    <div className="expectation-item">
                      <div className="expectation-icon"></div>
                      <div className="expectation-text">
                        <h4>Traffic Rules & Signs</h4>
                        <p>Questions about traffic lights, road signs, and right-of-way</p>
                      </div>
                    </div>
                    <div className="expectation-item">
                      <div className="expectation-icon"></div>
                      <div className="expectation-text">
                        <h4>Vehicle Knowledge</h4>
                        <p>Basic car mechanics, safety equipment, and maintenance</p>
                      </div>
                    </div>
                    <div className="expectation-item">
                      <div className="expectation-icon"></div>
                      <div className="expectation-text">
                        <h4>Hazard Perception</h4>
                        <p>Recognizing dangerous situations and safe driving practices</p>
                      </div>
                    </div>
                    <div className="expectation-item">
                      <div className="expectation-icon"></div>
                      <div className="expectation-text">
                        <h4>Legal Requirements</h4>
                        <p>Driving licenses, insurance, and legal obligations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips for Success Section */}
              <div className="instruction-section">
                <div className="section-header">
                  <h2>Tips for Success</h2>
                </div>
                <div className="section-content">
                  <div className="tips-grid">
                    <div className="tip-card">
                      <div className="tip-icon"></div>
                      <h4>Read Carefully</h4>
                      <p>Take your time to understand each question fully before answering</p>
                    </div>
                    <div className="tip-card">
                      <div className="tip-icon"></div>
                      <h4>Manage Time</h4>
                      <p>You have about 1.2 minutes per question - don't rush but stay focused</p>
                    </div>
                    <div className="tip-card">
                      <div className="tip-icon"></div>
                      <h4>Review Answers</h4>
                      <p>Use the navigation to review and change answers if needed</p>
                    </div>
                    <div className="tip-card">
                      <div className="tip-icon"></div>
                      <h4>Stay Calm</h4>
                      <p>Take deep breaths and trust your preparation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Practice Recommendations */}
              <div className="instruction-section">
                <div className="section-header">
                  <h2>📖 Recommended Practice</h2>
                </div>
                <div className="section-content">
                  <div className="practice-steps">
                    <div className="practice-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h4>Complete Practice Tests</h4>
                        <p>Take all practice tests to build your knowledge base</p>
                      </div>
                    </div>
                    <div className="practice-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h4>Review Weak Areas</h4>
                        <p>Focus on topics where you scored below 70%</p>
                      </div>
                    </div>
                    <div className="practice-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h4>Take Mock Exams</h4>
                        <p>Practice with timed exams to simulate real conditions</p>
                      </div>
                    </div>
                    <div className="practice-step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <h4>Official Exam Simulation</h4>
                        <p>Try the official exam format for the most realistic experience</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="instruction-actions">
              <button 
                className="action-button secondary"
                onClick={handleBackToDashboard}
              >
                {getTranslation(t_nested, 'practice.goToDashboard', 'Back to Dashboard')}
              </button>
              <button 
                className="action-button primary"
                onClick={handleStartExam}
              >
                {getTranslation(t_nested, 'dashboard.startPractice', 'Start Practice Exams')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
