import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userAuth } from '../services/userAuth';
import { logger } from '../utils/logger';

interface TimerContextType {
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  formatTime: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TWENTY_FOUR_HOURS = 24 * 60 * 60; // 86,400 seconds

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timeRemaining, setTimeRemaining] = useState(TWENTY_FOUR_HOURS);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem('24hChallengeTimer');
    if (savedTimer) {
      const timerData = JSON.parse(savedTimer);
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - timerData.originalStartTime) / 1000);
      const remaining = Math.max(0, TWENTY_FOUR_HOURS - elapsed);
      
      setTimeRemaining(remaining);
      setIsActive(timerData.isActive && remaining > 0);
      setIsPaused(timerData.isPaused);
    }
  }, []);

  // Save timer state to localStorage
  const saveTimerState = (active: boolean, paused: boolean, remaining: number) => {
    const savedTimer = localStorage.getItem('24hChallengeTimer');
    let originalStartTime = Date.now();
    
    // If timer already exists, keep the original start time
    if (savedTimer) {
      const existingData = JSON.parse(savedTimer);
      originalStartTime = existingData.originalStartTime;
    }
    
    const timerData = {
      originalStartTime: originalStartTime,
      isActive: active,
      isPaused: paused,
      timeRemaining: remaining
    };
    localStorage.setItem('24hChallengeTimer', JSON.stringify(timerData));
  };

  // Listen for user changes (sign in/out)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const currentUser = userAuth.getCurrentUser();
        if (!currentUser || currentUser.isGuest) {
          // Reset timer for guests or when no user
          resetTimer();
        }
      } catch (error) {
        logger.warn('Timer: Could not check user status:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsActive(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, isPaused, timeRemaining]);

  // Save state when timer changes
  useEffect(() => {
    if (isActive) {
      saveTimerState(isActive, isPaused, timeRemaining);
    }
  }, [isActive, isPaused, timeRemaining]);

  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
    setTimeRemaining(TWENTY_FOUR_HOURS);
  };

  const pauseTimer = () => {
    setIsPaused(true);
    setIsActive(false);
  };

  const resumeTimer = () => {
    setIsPaused(false);
    setIsActive(true);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(TWENTY_FOUR_HOURS);
    localStorage.removeItem('24hChallengeTimer');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const value: TimerContextType = {
    timeRemaining,
    isActive,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    formatTime
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
