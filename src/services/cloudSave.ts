// Cloud Save Service - Free tier using Supabase
// No credit card required, free for up to 50,000 users

import { createClient } from '@supabase/supabase-js';
import { userAuth } from './userAuth';

// Your Supabase project details
const supabaseUrl = 'https://cwwqvrcfsaahytkxqdck.supabase.co';
const supabaseKey = 'your-anon-key-here'; // Get this from your Supabase dashboard

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

      console.log('💾 Progress saved locally for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      return false;
    }
  }

  // Load user progress from local storage
  async loadProgress(userId: string): Promise<UserProgress | null> {
    try {
      const saved = localStorage.getItem(`userProgress_${userId}`);
      if (saved) {
        const progress = JSON.parse(saved);
        console.log('📱 Progress loaded for user:', userId);
        return progress;
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading progress:', error);
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
        last_sync: new Date().toISOString()
      };

      // Upsert (insert or update) user progress
      const { error } = await supabase
        .from('user_progress')
        .upsert(progressData, { onConflict: 'user_id' });

      if (error) {
        console.error('❌ Supabase sync error:', error);
      } else {
        console.log('☁️ Progress synced to Supabase successfully');
      }
    } catch (error) {
      console.error('❌ Cloud sync error:', error);
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
    console.log('🗑️ Progress cleared for user:', userId);
  }
}

export const cloudSave = new CloudSaveService();
