import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userAuth, User } from '../services/userAuth';
import { supabaseAuth } from '../services/supabaseAuth';
import './LoginSignup.css';

interface UserAuthProps {
  onUserChange: (user: User | null) => void;
}

export const UserAuth: React.FC<UserAuthProps> = ({ onUserChange }) => {
  const { t } = useTranslation();
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    } else {
      localStorage.setItem('username', 'AI Learner');
      localStorage.setItem('userEmail', formData.email);
    }

    // Create user object
    const user: User = {
      id: 'user_' + Date.now(),
      email: formData.email,
      name: formData.name || 'AI Learner',
      createdAt: new Date().toISOString(),
      isGuest: false
    };

    onUserChange(user);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const supabaseUser = await supabaseAuth.signInWithGoogle();
      if (supabaseUser) {
        console.log('✅ Google sign-in successful:', supabaseUser);
        
        // Convert SupabaseUser to User format
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.name,
          createdAt: new Date().toISOString(),
          isGuest: false
        };
        
        onUserChange(user);
      } else {
        console.log('Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
    setIsLoading(false);
  };

  const handleGuestMode = () => {
    const guestUser = userAuth.createGuestUser();
    onUserChange(guestUser);
  };

  const handleGetStarted = () => {
    setShowSignup(true);
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
              Theory Coach AI
            </h1>
            <p className="auth-subtitle">
              Learn Dutch Driving Theory in 24 hours
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

            <div className="input-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t('auth.password', 'Password')}
                value={formData.password}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
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
                'Log In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span className="divider-text">{t('auth.orContinueWith', 'or continue with')}</span>
          </div>

          {/* Social Media Buttons */}
          <div className="social-buttons">
            <button className="social-button google" onClick={handleGoogleSignIn}>
              <span className="google-icon">G</span>
              <span className="google-text">Google</span>
            </button>
          </div>

          {/* Get Started and Guest buttons */}
          <div className="auth-buttons">
            <button 
              type="button"
              className="auth-button secondary"
              onClick={handleGetStarted}
            >
              Get Started
            </button>

            <button 
              type="button"
              className="auth-button guest"
              onClick={handleGuestMode}
            >
              Continue as Guest
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
        {/* Header with back button */}
        <div className="auth-header">
          <div className="title-with-back">
            <button 
              className="back-button-inline"
              onClick={() => setShowSignup(false)}
            >
              <span className="back-arrow">←</span>
              <span className="back-text">Back</span>
            </button>
            <h1 className="auth-title">
              Sign Up
            </h1>
          </div>
        </div>

        {/* Signup Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder={t('auth.fullName', 'Full Name')}
              value={formData.name}
              onChange={handleInputChange}
              required
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

          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder={t('auth.password', 'Password')}
              value={formData.password}
              onChange={handleInputChange}
              required
              className="auth-input"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder={t('auth.confirmPassword', 'Confirm Password')}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="auth-input"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
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
              t('auth.createAccount', 'Create Account')
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span className="divider-text">{t('auth.orContinueWith', 'or continue with')}</span>
        </div>

        {/* Social Media Buttons */}
        <div className="social-buttons">
          <button className="social-button google" onClick={handleGoogleSignIn}>
            <span className="google-icon">G</span>
            <span className="google-text">Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;