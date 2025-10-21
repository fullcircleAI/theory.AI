// Supabase Authentication Service
// Handles Google, Apple, Facebook login

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwwqvrcfsaahytkxqdck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d3F2cmNmc2FhaHl0a3hxZGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDkwMzcsImV4cCI6MjA3NjUyNTAzN30.NVGa5rSEMJ9ZGMLZtISHh2h9soQvBzGkNrcnESHg-Ec';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'google' | 'apple' | 'facebook' | 'email';
}

class SupabaseAuthService {
  // Sign in with Google
  async signInWithGoogle(): Promise<SupabaseUser | null> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign-in error:', error);
        return null;
      }

      // OAuth redirects to Google, user will be redirected back
      // The actual user data comes from the auth state change
      return null; // Will be handled by onAuthStateChange
    } catch (error) {
      console.error('Google sign-in error:', error);
      return null;
    }
  }

  // Sign in with Apple
  async signInWithApple(): Promise<SupabaseUser | null> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Apple sign-in error:', error);
        return null;
      }

      return null; // Will be handled by onAuthStateChange
    } catch (error) {
      console.error('Apple sign-in error:', error);
      return null;
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(): Promise<SupabaseUser | null> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Facebook sign-in error:', error);
        return null;
      }

      return null; // Will be handled by onAuthStateChange
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      return null;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Get current user
  async getCurrentUser(): Promise<SupabaseUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        provider: 'google' // Default, could be determined from user metadata
      };
    }
    return null;
  }

  // Listen for auth changes
  onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user: SupabaseUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
          avatar_url: session.user.user_metadata?.avatar_url,
          provider: 'google' // Default, could be determined from user metadata
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const supabaseAuth = new SupabaseAuthService();
