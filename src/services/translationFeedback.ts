// Translation Feedback System
import { logger } from '../utils/logger';

export interface TranslationFeedback {
  id: string;
  key: string;
  language: string;
  originalText: string;
  currentTranslation: string;
  suggestedTranslation: string;
  rating: number; // 1-5
  comment: string;
  userEmail?: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  votes: number;
  reportedBy: string;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  topContributors: Array<{ user: string; count: number }>;
  mostImprovedKeys: Array<{ key: string; improvement: number }>;
}

class TranslationFeedbackService {
  private feedback: TranslationFeedback[] = [];
  private analytics: FeedbackAnalytics = {
    totalFeedback: 0,
    averageRating: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    topContributors: [],
    mostImprovedKeys: []
  };

  // Submit translation feedback
  submitFeedback(
    key: string,
    language: string,
    originalText: string,
    currentTranslation: string,
    suggestedTranslation: string,
    rating: number,
    comment: string,
    userEmail?: string
  ): string {
    const feedback: TranslationFeedback = {
      id: this.generateId(),
      key,
      language,
      originalText,
      currentTranslation,
      suggestedTranslation,
      rating,
      comment,
      userEmail,
      submittedAt: new Date(),
      status: 'pending',
      votes: 0,
      reportedBy: userEmail || 'anonymous'
    };

    this.feedback.push(feedback);
    this.updateAnalytics();
    
    // Log feedback
    logger.debug(`Translation feedback submitted: ${key} (${language}) - Rating: ${rating}/5`);
    
    return feedback.id;
  }

  // Vote on feedback
  voteOnFeedback(feedbackId: string, vote: 'up' | 'down'): void {
    const feedback = this.feedback.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.votes += vote === 'up' ? 1 : -1;
    }
  }

  // Approve feedback
  approveFeedback(feedbackId: string): void {
    const feedback = this.feedback.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.status = 'approved';
      this.updateAnalytics();
    }
  }

  // Reject feedback
  rejectFeedback(feedbackId: string): void {
    const feedback = this.feedback.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.status = 'rejected';
      this.updateAnalytics();
    }
  }

  // Mark feedback as implemented
  markAsImplemented(feedbackId: string): void {
    const feedback = this.feedback.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.status = 'implemented';
      this.updateAnalytics();
    }
  }

  // Get feedback for a specific key
  getFeedbackForKey(key: string, language: string): TranslationFeedback[] {
    return this.feedback.filter(f => f.key === key && f.language === language);
  }

  // Get all pending feedback
  getPendingFeedback(): TranslationFeedback[] {
    return this.feedback.filter(f => f.status === 'pending');
  }

  // Get feedback analytics
  getAnalytics(): FeedbackAnalytics {
    return { ...this.analytics };
  }

  // Get top feedback by votes
  getTopFeedback(limit: number = 10): TranslationFeedback[] {
    return this.feedback
      .sort((a, b) => b.votes - a.votes)
      .slice(0, limit);
  }

  // Get feedback by user
  getFeedbackByUser(userEmail: string): TranslationFeedback[] {
    return this.feedback.filter(f => f.userEmail === userEmail);
  }

  // Search feedback
  searchFeedback(query: string): TranslationFeedback[] {
    const lowercaseQuery = query.toLowerCase();
    return this.feedback.filter(f => 
      f.key.toLowerCase().includes(lowercaseQuery) ||
      f.comment.toLowerCase().includes(lowercaseQuery) ||
      f.suggestedTranslation.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Update analytics
  private updateAnalytics(): void {
    this.analytics.totalFeedback = this.feedback.length;
    this.analytics.pendingCount = this.feedback.filter(f => f.status === 'pending').length;
    this.analytics.approvedCount = this.feedback.filter(f => f.status === 'approved').length;
    this.analytics.rejectedCount = this.feedback.filter(f => f.status === 'rejected').length;
    
    // Average rating
    const ratings = this.feedback.map(f => f.rating);
    this.analytics.averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    // Top contributors
    const contributorCounts = new Map<string, number>();
    this.feedback.forEach(f => {
      const count = contributorCounts.get(f.reportedBy) || 0;
      contributorCounts.set(f.reportedBy, count + 1);
    });
    
    this.analytics.topContributors = Array.from(contributorCounts.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Most improved keys
    const keyImprovements = new Map<string, number>();
    this.feedback.forEach(f => {
      if (f.status === 'approved') {
        const improvement = f.rating - 3; // Assume 3 is neutral
        const current = keyImprovements.get(f.key) || 0;
        keyImprovements.set(f.key, current + improvement);
      }
    });
    
    this.analytics.mostImprovedKeys = Array.from(keyImprovements.entries())
      .map(([key, improvement]) => ({ key, improvement }))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 10);
  }

  private generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export feedback data
  exportFeedback(): TranslationFeedback[] {
    return [...this.feedback];
  }

  // Import feedback data
  importFeedback(feedback: TranslationFeedback[]): void {
    this.feedback = [...feedback];
    this.updateAnalytics();
  }
}

export const translationFeedback = new TranslationFeedbackService();














