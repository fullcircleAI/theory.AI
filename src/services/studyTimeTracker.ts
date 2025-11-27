// Study Time Tracker Service
// Tracks actual time spent in the app (dashboard + practice)
// Timer starts when user enters dashboard, pauses when app closes, resumes when user returns
// IMPORTANT: AI uses PERFORMANCE (not time) for recommendations

import { logger } from '../utils/logger';

const TWENTY_FOUR_HOURS_SECONDS = 24 * 60 * 60; // 86,400 seconds
const STORAGE_KEY = 'studyTimeTracker';

export interface StudyTimeData {
  totalElapsedSeconds: number; // Total time actually spent in app
  sessionStartTime: number | null; // Current session start (null if paused)
  lastUpdateTime: number; // Last time data was updated
  timeRemaining: number; // 24-hour countdown (for display only)
  isActive: boolean; // Whether timer is currently running
}

class StudyTimeTrackerService {
  private currentData: StudyTimeData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  // Initialize tracker
  initialize(): void {
    this.loadFromStorage();
    this.setupVisibilityHandlers();
    this.startUpdateInterval();
  }

  // Load data from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        // Calculate time elapsed since last update
        const timeSinceLastUpdate = Math.floor((now - data.lastUpdateTime) / 1000);
        
        // If timer was active, add elapsed time
        if (data.isActive && data.sessionStartTime) {
          const sessionElapsed = Math.floor((now - data.sessionStartTime) / 1000);
          data.totalElapsedSeconds += sessionElapsed;
          data.sessionStartTime = now; // Reset session start
        }
        
        // Update time remaining (24-hour countdown)
        data.timeRemaining = Math.max(0, TWENTY_FOUR_HOURS_SECONDS - data.totalElapsedSeconds);
        data.lastUpdateTime = now;
        
        this.currentData = data;
      } else {
        // First time - initialize
        this.currentData = {
          totalElapsedSeconds: 0,
          sessionStartTime: null,
          lastUpdateTime: Date.now(),
          timeRemaining: TWENTY_FOUR_HOURS_SECONDS,
          isActive: false
        };
        this.saveToStorage();
      }
    } catch (error) {
      logger.error('Error loading study time:', error);
      this.reset();
    }
  }

  // Save data to localStorage
  private saveToStorage(): void {
    if (this.currentData) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentData));
      } catch (error) {
        logger.error('Error saving study time:', error);
      }
    }
  }

  // Start timer (when user enters dashboard)
  startTimer(): void {
    if (!this.currentData) {
      this.loadFromStorage();
    }
    
    if (this.currentData && !this.currentData.isActive) {
      this.currentData.isActive = true;
      this.currentData.sessionStartTime = Date.now();
      this.currentData.lastUpdateTime = Date.now();
      this.saveToStorage();
    }
  }

  // Stop timer (when app closes or user leaves)
  stopTimer(): void {
    if (this.currentData && this.currentData.isActive) {
      const now = Date.now();
      
      // Add elapsed time from current session
      if (this.currentData.sessionStartTime) {
        const sessionElapsed = Math.floor((now - this.currentData.sessionStartTime) / 1000);
        this.currentData.totalElapsedSeconds += sessionElapsed;
      }
      
      this.currentData.isActive = false;
      this.currentData.sessionStartTime = null;
      this.currentData.lastUpdateTime = now;
      this.currentData.timeRemaining = Math.max(0, TWENTY_FOUR_HOURS_SECONDS - this.currentData.totalElapsedSeconds);
      
      this.saveToStorage();
    }
  }

  // Resume timer (when user returns)
  resumeTimer(): void {
    if (this.currentData && !this.currentData.isActive) {
      this.currentData.isActive = true;
      this.currentData.sessionStartTime = Date.now();
      this.currentData.lastUpdateTime = Date.now();
      this.saveToStorage();
    }
  }

  // Get current study time in hours
  getStudyTimeHours(): number {
    if (!this.currentData) {
      this.loadFromStorage();
    }
    
    if (this.currentData) {
      // Calculate current total including active session
      let totalSeconds = this.currentData.totalElapsedSeconds;
      
      if (this.currentData.isActive && this.currentData.sessionStartTime) {
        const now = Date.now();
        const sessionElapsed = Math.floor((now - this.currentData.sessionStartTime) / 1000);
        totalSeconds += sessionElapsed;
      }
      
      // Convert to hours
      return parseFloat((totalSeconds / 3600).toFixed(2));
    }
    
    return 0;
  }

  // Get time remaining (24-hour countdown)
  getTimeRemaining(): number {
    if (!this.currentData) {
      this.loadFromStorage();
    }
    
    if (this.currentData) {
      // Calculate current total including active session
      let totalSeconds = this.currentData.totalElapsedSeconds;
      
      if (this.currentData.isActive && this.currentData.sessionStartTime) {
        const now = Date.now();
        const sessionElapsed = Math.floor((now - this.currentData.sessionStartTime) / 1000);
        totalSeconds += sessionElapsed;
      }
      
      return Math.max(0, TWENTY_FOUR_HOURS_SECONDS - totalSeconds);
    }
    
    return TWENTY_FOUR_HOURS_SECONDS;
  }

  // Get current data
  getCurrentData(): StudyTimeData | null {
    if (!this.currentData) {
      this.loadFromStorage();
    }
    return this.currentData;
  }

  // Setup visibility handlers (pause when app closes, resume when returns)
  private setupVisibilityHandlers(): void {
    // Handle visibility change (tab switch, app minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is hidden - pause timer
        this.stopTimer();
      } else {
        // App is visible - resume timer if user was studying
        // Note: Timer will be explicitly started by NewDashboard component
        // This just ensures it resumes if it was active before
        if (this.currentData && this.currentData.totalElapsedSeconds > 0) {
          // Only resume if we're likely on dashboard (check current route)
          const currentPath = window.location.pathname;
          if (currentPath === '/new-dashboard' || currentPath === '/') {
            this.resumeTimer();
          }
        }
      }
    };

    // Handle page unload (browser close, tab close)
    const handleBeforeUnload = () => {
      this.stopTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  // Start update interval (updates every second when active)
  private startUpdateInterval(): void {
    this.updateInterval = setInterval(() => {
      if (this.currentData && this.currentData.isActive) {
        // Update last update time
        this.currentData.lastUpdateTime = Date.now();
        // Save periodically (every 10 seconds to reduce localStorage writes)
        if (Date.now() % 10000 < 1000) {
          this.saveToStorage();
        }
      }
    }, 1000);
  }

  // Reset timer (for testing or user reset)
  reset(): void {
    this.currentData = {
      totalElapsedSeconds: 0,
      sessionStartTime: null,
      lastUpdateTime: Date.now(),
      timeRemaining: TWENTY_FOUR_HOURS_SECONDS,
      isActive: false
    };
    this.saveToStorage();
  }

  // Cleanup
  destroy(): void {
    this.stopTimer();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const studyTimeTracker = new StudyTimeTrackerService();

