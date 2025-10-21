import React, { useState } from 'react';
import { userAuth, User } from '../services/userAuth';
import { cloudSave } from '../services/cloudSave';
import { supabaseAuth } from '../services/supabaseAuth';
import './LoginSignup.css';

interface UserAuthProps {
  onUserChange: (user: User | null) => void;
}

const UserAuth: React.FC<UserAuthProps> = ({ onUserChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const user = await userAuth.createUser(email, name);
      onUserChange(user);
      setMessage('✅ Account created successfully! Your progress will be saved.');
    } catch (error) {
      setMessage('❌ Error creating account. Please try again.');
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const user = await userAuth.signIn(email);
      if (user) {
        onUserChange(user);
        setMessage('✅ Signed in successfully!');
        
        // Load saved progress
        const savedProgress = await cloudSave.loadProgress(user.id);
        if (savedProgress) {
          setMessage('✅ Signed in successfully! Your progress has been restored.');
        }
      } else {
        setMessage('❌ User not found. Please sign up first.');
      }
    } catch (error) {
      setMessage('❌ Error signing in. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
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
        setMessage('✅ Google sign-in successful! Your progress will be saved.');
      } else {
        setMessage('❌ Google sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setMessage('❌ Google sign-in failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGuestMode = () => {
    const guestUser = userAuth.createGuestUser();
    onUserChange(guestUser);
    setMessage('👤 Guest mode activated. Progress saved locally only.');
  };

  return (
    <div className="login-signup-container">
      <div className="login-signup-content">
        <div className="auth-header">
          <h2>Save Your Progress</h2>
          <p className="auth-description">
            Create a free account to save your progress across devices, just like Duolingo!
          </p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your Name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Google Sign-In Button */}
        <button onClick={handleGoogleSignIn} className="social-button google" disabled={loading}>
          <span className="social-icon-text">G</span>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button onClick={handleGuestMode} className="guest-btn">
          Continue as Guest
        </button>

        {message && (
          <div className={`auth-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="auth-benefits">
          <h3>Free Account Benefits:</h3>
          <ul>
            <li>✅ Save progress across devices</li>
            <li>✅ Track your learning journey</li>
            <li>✅ No credit card required</li>
            <li>✅ Works offline</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
