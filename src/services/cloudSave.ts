// Cloud Save Service - Free tier using Supabase
// No credit card required, free for up to 50,000 users

import { createClient } from '@supabase/supabase-js';
import { userAuth } from './userAuth';
import { logger } from '../utils/logger';

// Your Supabase project details
const supabaseUrl = 'https://cwwqvrcfsaahytkxqdck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d3F2cmNmc2FhaHl0a3hxZGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDkwMzcsImV4cCI6MjA3NjUyNTAzN30.NVGa5rSEMJ9ZGMLZtISHh2h9soQvBzGkNrcnESHg-Ec';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProgress {
  userId: string;
  testHistory: any[];
  studyTime: number;
  averageScore: number;
  lastSync: string;
}

class CloudSaveService {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncToCloud();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Save user progress locally and attempt cloud sync
  async saveProgress(userId: string, progressData: any): Promise<boolean> {
    try {
      // Always save locally first
      const progress: UserProgress = {
        userId,
        testHistory: progressData.testHistory || [],
        studyTime: progressData.studyTime || 0,
        averageScore: progressData.averageScore || 0,
        lastSync: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem(`userProgress_${userId}`, JSON.stringify(progress));
      
      // Try to sync to cloud if online
      if (this.isOnline) {
        await this.syncToCloud();
      }

      logger.debug('Progress saved locally for user:', userId);
      return true;
    } catch (error) {
      logger.error('Error saving progress:', error);
      return false;
    }
  }

  // Load user progress from local storage
  async loadProgress(userId: string): Promise<UserProgress | null> {
    try {
      const saved = localStorage.getItem(`userProgress_${userId}`);
      if (saved) {
        const progress = JSON.parse(saved);
        logger.debug('Progress loaded for user:', userId);
        return progress;
      }
      return null;
    } catch (error) {
      logger.error('Error loading progress:', error);
      return null;
    }
  }

  // Sync to cloud using Supabase
  private async syncToCloud(): Promise<void> {
    try {
      const currentUser = userAuth.getCurrentUser();
      if (!currentUser) return;

      const progressData = {
        user_id: currentUser.id,
        test_history: JSON.stringify(this.getAllProgress(currentUser.id)?.testHistory || []),
        study_time: this.getAllProgress(currentUser.id)?.studyTime || 0,
        average_score: this.getAllProgress(currentUser.id)?.averageScore || 0,
        // Add more detailed data
        total_tests: this.getAllProgress(currentUser.id)?.testHistory?.length || 0,
        mock_exam_results: JSON.stringify(this.getAllProgress(currentUser.id)?.mockExamResults || []),
        last_sync: new Date().toISOString()
      };

      // Upsert (insert or update) user progress
      const { error } = await supabase
        .from('user_progress')
        .upsert(progressData, { onConflict: 'user_id' });

      if (error) {
        logger.error('Supabase sync error:', error);
      } else {
        logger.debug('Progress synced to Supabase successfully');
      }
    } catch (error) {
      logger.error('Cloud sync error:', error);
    }
  }

  // Check if user has saved progress
  hasSavedProgress(userId: string): boolean {
    return localStorage.getItem(`userProgress_${userId}`) !== null;
  }

  // Get all saved progress for a user
  getAllProgress(userId: string): any {
    const saved = localStorage.getItem(`userProgress_${userId}`);
    return saved ? JSON.parse(saved) : null;
  }

  // Clear all progress (for testing)
  clearProgress(userId: string): void {
    localStorage.removeItem(`userProgress_${userId}`);
    logger.debug('Progress cleared for user:', userId);
  }
}

export const cloudSave = new CloudSaveService();
