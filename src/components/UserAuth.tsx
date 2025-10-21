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
        {/* Header with mascot */}
        <div className="auth-header">
          <div className="auth-mascot">
            <img src="/images/mascot.png" alt="Mascot" className="mascot-image" />
          </div>
          <h1 className="auth-title">
            Welcome to Theory Coach AI
          </h1>
          <p className="auth-subtitle">
            Your personal driving theory tutor
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button onClick={handleGoogleSignIn} className="social-button google" disabled={loading}>
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google" 
            className="google-icon"
          />
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
      </div>
    </div>
  );
};

export default UserAuth;
