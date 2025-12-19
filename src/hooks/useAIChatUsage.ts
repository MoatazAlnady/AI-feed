import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { supabase } from '@/integrations/supabase/client';

const FREE_DAILY_LIMIT = 1;
const PREMIUM_DAILY_LIMIT = 10;

interface AIChatUsage {
  promptsUsed: number;
  dailyLimit: number;
  remainingPrompts: number;
  isLimitReached: boolean;
  isLoading: boolean;
  incrementUsage: () => Promise<boolean>;
  refreshUsage: () => Promise<void>;
}

export function useAIChatUsage(): AIChatUsage {
  const { user } = useAuth();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const [promptsUsed, setPromptsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const remainingPrompts = Math.max(0, dailyLimit - promptsUsed);
  const isLimitReached = promptsUsed >= dailyLimit;

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setPromptsUsed(0);
      setIsLoading(false);
      return;
    }

    try {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from('ai_chat_daily_usage')
        .select('prompts_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching AI chat usage:', error);
      } else {
        setPromptsUsed(data?.prompts_count || 0);
      }
    } catch (err) {
      console.error('Error fetching AI chat usage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isPremiumLoading) {
      fetchUsage();
    }
  }, [fetchUsage, isPremiumLoading]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    // Check if limit is already reached
    if (promptsUsed >= dailyLimit) {
      return false;
    }

    try {
      const today = getTodayDate();
      
      // Try to upsert the usage record
      const { error } = await supabase
        .from('ai_chat_daily_usage')
        .upsert(
          {
            user_id: user.id,
            usage_date: today,
            prompts_count: promptsUsed + 1,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,usage_date'
          }
        );

      if (error) {
        console.error('Error incrementing AI chat usage:', error);
        return false;
      }

      setPromptsUsed(prev => prev + 1);
      return true;
    } catch (err) {
      console.error('Error incrementing AI chat usage:', err);
      return false;
    }
  }, [user, promptsUsed, dailyLimit]);

  const refreshUsage = useCallback(async () => {
    setIsLoading(true);
    await fetchUsage();
  }, [fetchUsage]);

  return {
    promptsUsed,
    dailyLimit,
    remainingPrompts,
    isLimitReached,
    isLoading: isLoading || isPremiumLoading,
    incrementUsage,
    refreshUsage
  };
}
