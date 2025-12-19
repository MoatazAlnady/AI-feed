import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface SubscriptionStatus {
  subscribed: boolean;
  subscriptionTier: 'monthly' | 'yearly' | null;
  subscriptionEnd: string | null;
  isTrialing: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<any>;
  isAdmin: boolean;
  isEmployer: boolean;
  companyPageId: string | null;
  subscription: SubscriptionStatus;
  checkSubscription: () => Promise<void>;
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
        emailRedirectTo: `${window.location.origin}/`,
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

  // Check if user is admin based on role_id (1 = product_admin) OR account_type = 'admin'
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);
  const [companyPageId, setCompanyPageId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    subscriptionTier: null,
    subscriptionEnd: null,
    isTrialing: false,
  });
  
  // Check subscription status from Stripe
  const checkSubscription = async () => {
    if (!user) {
      setSubscription({
        subscribed: false,
        subscriptionTier: null,
        subscriptionEnd: null,
        isTrialing: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data) {
        setSubscription({
          subscribed: data.subscribed || false,
          subscriptionTier: data.subscription_tier || null,
          subscriptionEnd: data.subscription_end || null,
          isTrialing: data.is_trialing || false,
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    const checkUserAccess = async () => {
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('account_type, role_id, company_page_id')
            .eq('id', user.id)
            .single();
          
          if (!error && profile) {
            // Admin access: role_id = 1 (product_admin) OR account_type = 'admin'
            setIsAdmin(profile.role_id === 1 || profile.account_type === 'admin');
            // Employer access: has company_page_id
            setIsEmployer(!!profile.company_page_id);
            setCompanyPageId(profile.company_page_id);
          }
        } catch (error) {
          console.error('Error checking user access:', error);
          setIsAdmin(false);
          setIsEmployer(false);
          setCompanyPageId(null);
        }
        
        // Check subscription status
        await checkSubscription();
      } else {
        setIsAdmin(false);
        setIsEmployer(false);
        setCompanyPageId(null);
        setSubscription({
          subscribed: false,
          subscriptionTier: null,
          subscriptionEnd: null,
          isTrialing: false,
        });
      }
    };
    
    checkUserAccess();
  }, [user]);

  // Refresh subscription status periodically (every minute)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    isAdmin,
    isEmployer,
    companyPageId,
    subscription,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};