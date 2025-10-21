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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign-in error:', error);
        return null;
      }

      return data.user as SupabaseUser;
    } catch (error) {
      console.error('Google sign-in error:', error);
      return null;
    }
  }

  // Sign in with Apple
  async signInWithApple(): Promise<SupabaseUser | null> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Apple sign-in error:', error);
        return null;
      }

      return data.user as SupabaseUser;
    } catch (error) {
      console.error('Apple sign-in error:', error);
      return null;
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(): Promise<SupabaseUser | null> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Facebook sign-in error:', error);
        return null;
      }

      return data.user as SupabaseUser;
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
  getCurrentUser(): SupabaseUser | null {
    const { data: { user } } = supabase.auth.getUser();
    return user as SupabaseUser;
  }

  // Listen for auth changes
  onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user as SupabaseUser || null);
    });
  }
}

export const supabaseAuth = new SupabaseAuthService();
