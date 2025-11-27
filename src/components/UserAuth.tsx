import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { userAuth, User } from '../services/userAuth';
import { supabaseAuth } from '../services/supabaseAuth';
import { Mascot } from './Mascot';
import { logger } from '../utils/logger';
import './LoginSignup.css';

interface UserAuthProps {
  onUserChange: (user: User | null) => void;
}

export const UserAuth: React.FC<UserAuthProps> = ({ onUserChange }) => {
  const { t_nested } = useLanguage();
  const [currentPage, setCurrentPage] = useState<'main' | 'login' | 'signup'>('main');
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
    if (currentPage === 'signup' && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }
    
    setIsLoading(true);

    // Simulate API call (like Duolingo)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, just proceed to next step
    // In real app, you'd validate credentials here
    localStorage.setItem('userAuthenticated', 'true');
    if (currentPage === 'signup') {
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
      }
    } catch (error) {
      logger.error('Google sign-in error:', error);
    }
    setIsLoading(false);
  };

  const handleGuestMode = () => {
    const guestUser = userAuth.createGuestUser();
    localStorage.setItem('userAuthenticated', 'true');
    onUserChange(guestUser);
  };

  const handleGetStarted = () => {
    setCurrentPage('signup');
  };

  const handleLogin = () => {
    setCurrentPage('login');
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
  };

  // Main page with 3 buttons
  if (currentPage === 'main') {
    return (
      <div className="login-signup-container">
        <div className="login-signup-content">
          {/* Header with mascot */}
          <div className="auth-header">
            <div className="auth-mascot">
              <Mascot size={120} mood="happy" />
            </div>
            <h1 className="auth-title">
              Theory.AI
            </h1>
            <p className="auth-subtitle">
              Learn Dutch Driving Theory in 24 hours
            </p>
          </div>

          {/* Three main buttons */}
          <div className="auth-buttons main-buttons">
            <button 
              type="button"
              className="auth-button primary"
              onClick={handleLogin}
            >
              Log In
            </button>

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

  // Login page
  if (currentPage === 'login') {
    return (
      <div className="login-signup-container">
        <div className="login-signup-content">
          {/* Header with back button */}
          <div className="auth-header">
            <div className="title-with-back">
              <button 
                className="back-button-inline"
                onClick={handleBackToMain}
              >
                <span className="back-arrow">←</span>
                <span className="back-text">Back</span>
              </button>
              <h1 className="auth-title">
                Log In
              </h1>
            </div>
          </div>

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder={t_nested('auth.email')}
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
                placeholder={t_nested('auth.password')}
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
                {t_nested('auth.forgotPassword')}
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

          {/* Google Sign-In Button */}
          <div className="social-buttons">
            <button className="social-button google" onClick={handleGoogleSignIn}>
              <svg className="google-logo" width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="google-text">Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signup page
  return (
    <div className="login-signup-container">
      <div className="login-signup-content">
        {/* Header with back button */}
        <div className="auth-header">
          <div className="title-with-back">
            <button 
              className="back-button-inline"
              onClick={handleBackToMain}
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
              placeholder={t_nested('auth.fullName')}
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
              placeholder={t_nested('auth.email')}
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
              placeholder={t_nested('auth.password')}
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
              placeholder={t_nested('auth.confirmPassword')}
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
              'Create Account'
            )}
          </button>
        </form>

        {/* Google Sign-In Button */}
        <div className="social-buttons">
          <button className="social-button google" onClick={handleGoogleSignIn}>
            <svg className="google-logo" width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="google-text">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;