import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLanguage } from './contexts/LanguageContext';
import { SplashScreen } from './components/SplashScreen';
import { LanguageSelection } from './components/LanguageSelection';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AICoachDashboard } from './components/AICoachDashboard';
import { AICoachRecommendations } from './components/AICoachRecommendations';
import { TestsPage } from './components/TestsPage';
import { Settings } from './components/Settings';
import { PracticeTest } from './components/PracticeTest';
import { MockExamSelection } from './components/MockExamSelection';
import { MockExam } from './components/MockExam';
import { MockExamResults } from './components/MockExamResults';
import { OfficialExam } from './components/RealCBRExam';
import { TranslationDashboard } from './components/TranslationDashboard';
import { SidePanel } from './components/SidePanel';
import { FooterNav } from './components/FooterNav';
import { NewDashboard } from './components/NewDashboard';
import UserAuth from './components/UserAuth';
import { userAuth, User } from './services/userAuth';
import './App.css';

// AppContent component that manages the app flow
function AppContent() {
  const { currentLanguage } = useLanguage();
  const [, setCurrentUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit (like Duolingo)
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });
  const [showLogin, setShowLogin] = useState(() => {
    // Show login after splash if not authenticated
    const isAuthenticated = localStorage.getItem('userAuthenticated');
    return !isAuthenticated;
  });

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = userAuth.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      setShowLogin(false);
    }
  }, []);

  useEffect(() => {
    // Add body class to prevent scrolling during splash
    if (showSplash) {
      document.body.classList.add('splash-active');
    } else {
      document.body.classList.remove('splash-active');
    }
  }, [showSplash]);

  useEffect(() => {
    // Add RTL support for Arabic
    if (currentLanguage === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', currentLanguage || 'en');
    }
  }, [currentLanguage]);

  const handleSplashFinish = () => {
    localStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };


  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      setShowLogin(false);
    }
  };


  // SPLASH SCREEN FIRST (like Duolingo)
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Then show user authentication (if not authenticated)
  if (showLogin) {
    return <UserAuth onUserChange={handleUserChange} />;
  }

  // Then language selection (if no language chosen)
  if (!currentLanguage) {
    return <LanguageSelection />;
  }

  // Finally show the main app
  return (
    <div className="App">
      {/* Global Components */}
      <InstallPrompt />
      <OfflineIndicator />
      <SidePanel />
      <FooterNav />
      
      <Routes>
        <Route path="/" element={<AICoachDashboard />} />
        <Route path="/new-dashboard" element={<NewDashboard />} />
        <Route path="/recommendations" element={<AICoachRecommendations />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/mock-exam" element={<MockExamSelection />} />
        <Route path="/mock-exam/results" element={<MockExamResults />} />
        <Route path="/mock-exam/:examId" element={<MockExam />} />
        <Route path="/official-exam/:examId" element={<OfficialExam />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/translation-dashboard" element={<TranslationDashboard />} />
        <Route path="/practice/:testId" element={<PracticeTest />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
      <Router>
        <AppContent />
      </Router>
  );
}

export default App;
