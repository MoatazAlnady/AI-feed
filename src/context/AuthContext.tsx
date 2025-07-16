import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<any>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Add/remove logged-in class based on initial session
      if (session?.user) {
        document.body.classList.add('logged-in');
      } else {
        document.body.classList.remove('logged-in');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Add/remove logged-in class based on auth state
      if (session?.user) {
        document.body.classList.add('logged-in');
      } else {
        document.body.classList.remove('logged-in');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    // First, sign up the user with auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    
    if (authError) {
      return { data: authData, error: authError };
    }
    
    // If signup was successful, ensure a user profile exists
    if (authData.user) {
      try {
        // Create or update user profile using upsert
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: authData.user.id,
            full_name: userData?.full_name || null,
            job_title: userData?.job_title || null,
            company: userData?.company || null,
            bio: userData?.bio || null,
            location: userData?.location || null,
            website: userData?.website || null,
            github: userData?.github || null,
            linkedin: userData?.linkedin || null,
            twitter: userData?.twitter || null,
            profile_photo: userData?.profile_photo || null,
            interests: userData?.interests || [],
            account_type: userData?.account_type || 'creator',
            birth_date: userData?.birth_date || null,
            age: userData?.age || null,
            gender: userData?.gender || null,
            country: userData?.country || null,
            city: userData?.city || null,
            languages: userData?.languages || [],
            newsletter_subscription: userData?.newsletter_subscription || false,
            contact_visible: userData?.contact_visible || false,
            phone: userData?.phone || null
          });
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      } catch (profileError) {
        console.error('Error checking/creating user profile:', profileError);
      }
    }
    
    return { data: authData, error: authError };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      // Clear state first
      setUser(null);
      setSession(null);
      setLoading(false);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resendConfirmation = async (email: string) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    return { data, error };
  };

  // Check if user is admin - updated with your email
  const isAdmin = user?.email === 'moataz.elnady@gmail.com' || user?.user_metadata?.account_type === 'admin';

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};