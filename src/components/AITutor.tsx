import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { realAIService, AITutorResponse } from '../services/realAIService';
import { aiCoach } from '../services/aiCoach';
import { logger } from '../utils/logger';
import './AITutor.css';

interface AITutorProps {
  userProgress?: any;
  currentTest?: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  tone?: 'encouraging' | 'motivational' | 'analytical' | 'supportive';
  actionItems?: string[];
  nextSteps?: string[];
}

const AITutor: React.FC<AITutorProps> = ({ userProgress, currentTest, onClose }) => {
  const { t_nested, currentLanguage } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message - Short and focused
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'ai',
      message: t_nested('aiTutor.welcome'),
      timestamp: new Date(),
      tone: 'encouraging'
    };
    setMessages([welcomeMessage]);
  }, [t_nested]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    logger.debug('Send button clicked:', { inputMessage, isLoading });
    if (!inputMessage.trim() || isLoading) return;

    // Remove the 3-question limit for better user experience
    // const userMessages = messages.filter(msg => msg.type === 'user');
    // if (userMessages.length >= 3) {
    //   const limitMessage: ChatMessage = {
    //     id: Date.now().toString(),
    //     type: 'ai',
    //     message: 'I can only answer 3 questions per session. Please close and reopen the chat to ask more questions.',
    //     timestamp: new Date(),
    //     tone: 'supportive'
    //   };
    //   setMessages(prev => [...prev, limitMessage]);
    //   return;
    // }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Get AI response
      const context = {
        userProgress,
        currentTest,
        recentMessages: messages.slice(-3),
        language: currentLanguage || 'en' // Pass current language
      };

      const aiResponse: AITutorResponse = await realAIService.getTutorResponse(
        userMessage.message,
        context
      );

      // Simulate typing delay
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          message: aiResponse.message,
          timestamp: new Date(),
          tone: aiResponse.tone,
          actionItems: aiResponse.actionItems,
          nextSteps: aiResponse.nextSteps
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      logger.error('AI Tutor error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: t_nested('aiTutor.error'),
        timestamp: new Date(),
        tone: 'supportive'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getToneIcon = (tone?: string) => {
    // Always use mascot, no emojis
    return '🎓';
  };

  // Dynamic questions based on user performance and context
  const getDynamicQuestions = () => {
    const averageScore = userProgress?.averageScore || 0;
    const testContext = currentTest || 'dashboard';
    
    // Get AI insights for personalized questions
    const aiInsights = userProgress ? aiCoach.getAIInsights() : [];
    
    const questions = [];
    
    // Question 1: Based on performance level with personalized messaging
    if (averageScore < 30) {
      questions.push("I'm just starting - what should I focus on first?");
    } else if (averageScore < 60) {
      questions.push(`I'm at ${Math.round(averageScore)}% - how can I improve faster?`);
    } else if (averageScore < 80) {
      questions.push(`I'm at ${Math.round(averageScore)}% - am I ready for mock exams?`);
    } else {
      questions.push("I'm doing well - what should I focus on next?");
    }
    
    // Question 2: Based on current context and AI insights
    if (testContext && testContext !== 'dashboard') {
      const topicName = testContext.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      questions.push(`How can I master ${topicName}?`);
    } else if (aiInsights.length > 0) {
      const topWeakness = aiInsights[0]?.message || 'weak areas';
      questions.push(`Why is ${topWeakness} so challenging?`);
    } else {
      questions.push("What's the best way to study for the CBR exam?");
    }
    
    return questions.slice(0, 2); // Only show 2 questions
  };

  return (
    <div className="ai-tutor-overlay">
      <div className="ai-tutor-container">
        {/* Header */}
        <div className="ai-tutor-header">
          <div className="ai-tutor-title">
            <img src="/images/mascot.png" alt="Coach" className="ai-tutor-mascot" />
            <h3>{t_nested('aiTutor.title')}</h3>
          </div>
          <button className="ai-tutor-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="ai-tutor-messages">
          {messages.map((message) => (
            <div key={message.id} className={`ai-tutor-message ${message.type}`}>
              <div className="ai-tutor-message-content">
                {message.type === 'ai' && (
                  <div className="ai-tutor-avatar">
                    {getToneIcon(message.tone)}
                  </div>
                )}
                <div className="ai-tutor-message-text">
                  <p>{message.message}</p>
                  {message.actionItems && message.actionItems.length > 0 && (
                    <div className="ai-tutor-action-items">
                      <strong>{t_nested('aiTutor.actionItems')}</strong>
                      <ul>
                        {message.actionItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {message.nextSteps && message.nextSteps.length > 0 && (
                    <div className="ai-tutor-next-steps">
                      <strong>{t_nested('aiTutor.nextSteps')}</strong>
                      <ul>
                        {message.nextSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="ai-tutor-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="ai-tutor-message ai">
              <div className="ai-tutor-message-content">
                <div className="ai-tutor-avatar">🎓</div>
                <div className="ai-tutor-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Quick Questions */}
        {messages.length === 1 && (
          <div className="ai-tutor-quick-questions">
            <p>{t_nested('aiTutor.quickQuestions.title')}</p>
            <div className="ai-tutor-quick-buttons">
              {getDynamicQuestions().map((question, index) => (
                <button
                  key={index}
                  className="ai-tutor-quick-button"
                  onClick={() => setInputMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="ai-tutor-input">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t_nested('aiTutor.inputPlaceholder')}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="ai-tutor-send"
            title={isLoading ? 'Sending...' : 'Send message'}
            style={{
              opacity: (!inputMessage.trim() || isLoading) ? 0.6 : 1,
              cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 7l5 5-5 5M6 12h12" fill="white" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ 
                  position: 'absolute', 
                  left: '-9999px', 
                  visibility: 'hidden' 
                }}>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
