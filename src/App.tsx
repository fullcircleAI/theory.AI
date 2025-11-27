import React, { useState, useEffect, memo } from 'react';
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

// Memoize global components to prevent unnecessary re-renders
const MemoizedInstallPrompt = memo(InstallPrompt);
const MemoizedOfflineIndicator = memo(OfflineIndicator);
const MemoizedSidePanel = memo(SidePanel);
const MemoizedFooterNav = memo(FooterNav);

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
    
    // Add loaded class after initial render to enable smooth scrolling
    requestAnimationFrame(() => {
      document.body.classList.add('loaded');
    });
  }, []);

  useEffect(() => {
    // Add body class to prevent scrolling during splash
    if (showSplash) {
      document.body.classList.add('splash-active');
    } else {
      document.body.classList.remove('splash-active');
    }
  }, [showSplash]);

  // Optimize RTL/LTR updates to prevent flickering
  useEffect(() => {
    if (!currentLanguage) return;
    
    const html = document.documentElement;
    const isRTL = currentLanguage === 'ar';
    const targetDir = isRTL ? 'rtl' : 'ltr';
    const currentDir = html.getAttribute('dir');
    const currentLang = html.getAttribute('lang');
    
    // Only update if actually needed (prevent unnecessary DOM updates)
    if (currentDir !== targetDir || currentLang !== currentLanguage) {
      // Use requestAnimationFrame to batch DOM updates
      requestAnimationFrame(() => {
        html.setAttribute('dir', targetDir);
        html.setAttribute('lang', currentLanguage);
      });
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
      {/* Global Components - Memoized to prevent unnecessary re-renders */}
      <MemoizedInstallPrompt />
      <MemoizedOfflineIndicator />
      <MemoizedSidePanel />
      <MemoizedFooterNav />
      
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
