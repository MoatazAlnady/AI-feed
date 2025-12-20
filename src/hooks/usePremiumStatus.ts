import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PremiumState {
  isPremium: boolean;
  premiumUntil: string | null;
  isLoading: boolean;
  error: string | null;
}

export function usePremiumStatus(): PremiumState {
  const { user } = useAuth();
  const [state, setState] = useState<PremiumState>({
    isPremium: false,
    premiumUntil: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchPremiumStatus = async () => {
      // If no user, immediately set as not premium and not loading
      if (!user) {
        setState({
          isPremium: false,
          premiumUntil: null,
          isLoading: false,
          error: null
        });
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('user_profiles')
          .select('is_premium, premium_until, account_type, role_id')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching premium status:', fetchError);
          setState({
            isPremium: false,
            premiumUntil: null,
            isLoading: false,
            error: fetchError.message
          });
          return;
        }

        if (data) {
          // Check admin status - use Number() to handle potential string type from DB
          const roleIdNum = Number(data.role_id);
          const isAdminUser = roleIdNum === 1 || data.account_type === 'admin';
          
          console.log('Premium status check:', { 
            role_id: data.role_id, 
            roleIdNum, 
            account_type: data.account_type, 
            is_premium: data.is_premium, 
            isAdminUser 
          });
          
          // Admins automatically get premium access
          if (isAdminUser) {
            setState({
              isPremium: true,
              premiumUntil: null,
              isLoading: false,
              error: null
            });
          } else {
            // Check if premium is active and not expired
            const now = new Date();
            const premiumExpiry = data.premium_until ? new Date(data.premium_until) : null;
            const isActive = data.is_premium && (!premiumExpiry || premiumExpiry > now);
            
            setState({
              isPremium: isActive,
              premiumUntil: data.premium_until,
              isLoading: false,
              error: null
            });
          }
        } else {
          // No data found
          setState({
            isPremium: false,
            premiumUntil: null,
            isLoading: false,
            error: null
          });
        }
      } catch (err) {
        console.error('Error fetching premium status:', err);
        setState({
          isPremium: false,
          premiumUntil: null,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    };

    fetchPremiumStatus();
  }, [user]);

  return state;
}
