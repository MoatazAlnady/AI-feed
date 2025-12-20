import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PremiumStatus {
  isPremium: boolean;
  premiumUntil: string | null;
  isLoading: boolean;
  error: string | null;
}

export function usePremiumStatus(): PremiumStatus {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setPremiumUntil(null);
        setIsLoading(false);
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
          setError(fetchError.message);
          setIsPremium(false);
        } else if (data) {
          // Check admin status directly from database
          const isAdminUser = data.role_id === 1 || data.account_type === 'admin';
          
          // Admins automatically get premium access
          if (isAdminUser) {
            setIsPremium(true);
            setPremiumUntil(null);
          } else {
            // Check if premium is active and not expired
            const now = new Date();
            const premiumExpiry = data.premium_until ? new Date(data.premium_until) : null;
            const isActive = data.is_premium && (!premiumExpiry || premiumExpiry > now);
            
            setIsPremium(isActive);
            setPremiumUntil(data.premium_until);
          }
        }
      } catch (err) {
        console.error('Error fetching premium status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPremiumStatus();
  }, [user]);

  return { isPremium, premiumUntil, isLoading, error };
}
