// Simple User Authentication - No credit card required
// Uses localStorage for now, can be upgraded to cloud auth later

import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isGuest: boolean;
}

class UserAuthService {
  private currentUser: User | null = null;

  constructor() {
    this.loadUserFromStorage();
  }

  // Create a new user account (free)
  async createUser(email: string, name: string): Promise<User> {
    const user: User = {
      id: this.generateUserId(),
      email,
      name,
      createdAt: new Date().toISOString(),
      isGuest: false
    };

    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser = user;
    
    logger.debug('User created:', user.name);
    return user;
  }

  // Sign in existing user
  async signIn(email: string): Promise<User | null> {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.email === email) {
        this.currentUser = user;
        logger.debug('User signed in:', user.name);
        return user;
      }
    }
    return null;
  }

  // Create guest user (no email required)
  createGuestUser(): User {
    const guestUser: User = {
      id: 'guest_' + this.generateUserId(),
      email: '',
      name: 'Guest User',
      createdAt: new Date().toISOString(),
      isGuest: true
    };

    localStorage.setItem('currentUser', JSON.stringify(guestUser));
    this.currentUser = guestUser;
    
    logger.debug('Guest user created');
    return guestUser;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  // Sign out
  signOut(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    logger.debug('User signed out');
  }

  // Load user from storage
  private loadUserFromStorage(): void {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  }

  // Generate unique user ID
  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Update user profile
  updateProfile(name: string): void {
    if (this.currentUser) {
      this.currentUser.name = name;
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      logger.debug('Profile updated:', name);
    }
  }
}

export const userAuth = new UserAuthService();