import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabaseAuth } from '../services/supabaseAuth';
import './LoginSignup.css';

interface LoginSignupProps {
  onComplete: () => void;
}

export const LoginSignup: React.FC<LoginSignupProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  // const [isLogin, setIsLogin] = useState(false); // Removed unused variable
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password confirmation for signup
    if (showSignup && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }
    
    setIsLoading(true);

    // Simulate API call (like Duolingo)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, just proceed to next step
    // In real app, you'd validate credentials here
    localStorage.setItem('userAuthenticated', 'true');
    if (showSignup) {
      localStorage.setItem('username', formData.name || 'AI Learner');
      localStorage.setItem('userEmail', formData.email);
    }
    setIsLoading(false);
    onComplete();
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await supabaseAuth.signInWithGoogle();
      if (user) {
        console.log('✅ Google sign-in successful:', user);
        localStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('username', user.name || 'Google User');
        localStorage.setItem('userEmail', user.email);
        onComplete();
      } else {
        alert('Google sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Google sign-in failed. Please try again.');
    }
    setIsLoading(false);
  };


  const handleGuestMode = () => {
    // Guest mode - no authentication needed
    localStorage.setItem('userAuthenticated', 'guest');
    onComplete();
  };

  const handleGetStarted = () => {
    setShowSignup(true);
    // setIsLogin(false); // Removed unused variable
  };

  // Bot-it style: Show initial page with sign-in form and 3 buttons
  if (!showSignup) {
    return (
      <div className="login-signup-container">
        <div className="login-signup-content">
          {/* Header with mascot */}
          <div className="auth-header">
            <div className="auth-mascot">
              <img src="/images/mascot.png" alt="Mascot" className="mascot-image" />
            </div>
            <h1 className="auth-title">
              {t('auth.welcome', 'Welcome to Theory Coach AI')}
            </h1>
            <p className="auth-subtitle">
              {t('auth.welcomeSubtitle', 'Your personal driving theory tutor')}
            </p>
          </div>

          {/* Sign In Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder={t('auth.email', 'Email')}
                value={formData.email}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder={t('auth.password', 'Password')}
                value={formData.password}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
            </div>

            {/* Forgot Password Link */}
            <div className="forgot-password">
              <button 
                type="button"
                className="forgot-password-link"
                onClick={() => alert('Forgot password functionality coming soon!')}
              >
                {t('auth.forgotPassword', 'Forgot Password?')}
              </button>
            </div>

            <button 
              type="submit" 
              className={`auth-button primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                t('auth.signIn', 'Sign In')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span className="divider-text">{t('auth.orContinueWith', 'or continue with')}</span>
          </div>

          {/* Social Media Buttons */}
          <div className="social-buttons">
            <button className="social-button facebook" onClick={() => alert('Facebook login coming soon!')}>
              <span className="social-icon-text">f</span>
            </button>
            
            <button className="social-button google" onClick={handleGoogleSignIn}>
              <span className="social-icon-text">G</span>
            </button>
            
            <button className="social-button apple" onClick={() => alert('Apple login coming soon!')}>
              <span className="social-icon-text">🍎</span>
            </button>
          </div>

          {/* Two main buttons */}
          <div className="auth-buttons">
            <button 
              type="button"
              className="auth-button secondary"
              onClick={handleGetStarted}
            >
              {t('auth.getStarted', 'Get Started')}
            </button>

            <button 
              type="button"
              className="auth-button guest"
              onClick={handleGuestMode}
            >
              {t('auth.continueAsGuest', 'Continue as Guest')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bot-it style: Show signup form with social media
  return (
    <div className="login-signup-container">
      <div className="login-signup-content">

        {/* Header with back arrow and title */}
        <div className="auth-header">
          <div className="title-with-back">
            <button 
              type="button"
              className="back-button-inline"
              onClick={() => setShowSignup(false)}
              aria-label="Go back"
            >
              <svg className="back-arrow-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="back-text">Back</span>
            </button>
            <h1 className="auth-title">
              {t('auth.signUp', 'Sign up')}
            </h1>
          </div>
        </div>


        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder={t('auth.name', 'Your Name')}
              value={formData.name}
              onChange={handleInputChange}
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder={t('auth.email', 'Email')}
              value={formData.email}
              onChange={handleInputChange}
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder={t('auth.password', 'Password')}
              value={formData.password}
              onChange={handleInputChange}
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder={t('auth.confirmPassword', 'Confirm Password')}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="auth-input"
            />
          </div>

          <button 
            type="submit" 
            className={`auth-button primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              t('auth.signUp', 'Sign up')
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span className="divider-text">{t('auth.orContinueWith', 'or continue with')}</span>
        </div>

        {/* Social Media Buttons */}
        <div className="social-buttons">
          <button className="social-button facebook" onClick={() => alert('Facebook login coming soon!')}>
            <span className="social-icon-text">f</span>
          </button>
          
          <button className="social-button google" onClick={() => alert('Google login coming soon!')}>
            <span className="social-icon-text">G</span>
          </button>
          
          <button className="social-button apple" onClick={() => alert('Apple login coming soon!')}>
            <span className="social-icon-text">🍎</span>
          </button>
        </div>

        {/* Back to login */}
        <div className="auth-toggle">
          <button 
            type="button" 
            className="toggle-button"
            onClick={() => setShowSignup(false)}
          >
            {t('auth.alreadyHaveAccount', 'Already have an account? Sign In')}
          </button>
        </div>
      </div>
    </div>
  );
};
