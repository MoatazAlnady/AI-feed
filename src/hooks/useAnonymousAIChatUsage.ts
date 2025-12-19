import { useState, useCallback, useEffect } from 'react';
import { getDeviceFingerprint } from '@/utils/deviceFingerprint';

const ANONYMOUS_USAGE_KEY = 'ai_feed_anon_usage';
const ANONYMOUS_LIMIT = 1; // 1 prompt per day for anonymous users

interface AnonymousUsage {
  date: string;
  count: number;
}

export interface AnonymousAIChatUsage {
  promptsUsed: number;
  dailyLimit: number;
  remainingPrompts: number;
  isLimitReached: boolean;
  isLoading: boolean;
  deviceFingerprint: string;
  incrementUsage: () => Promise<boolean>;
  refreshUsage: () => void;
}

export const useAnonymousAIChatUsage = (): AnonymousAIChatUsage => {
  const [promptsUsed, setPromptsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const deviceFingerprint = getDeviceFingerprint();

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getStoredUsage = useCallback((): AnonymousUsage | null => {
    try {
      const stored = localStorage.getItem(ANONYMOUS_USAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);

  const refreshUsage = useCallback(() => {
    const today = getTodayString();
    const stored = getStoredUsage();
    
    if (stored && stored.date === today) {
      setPromptsUsed(stored.count);
    } else {
      // Reset for new day
      setPromptsUsed(0);
      localStorage.setItem(ANONYMOUS_USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
    }
    setIsLoading(false);
  }, [getStoredUsage]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    const today = getTodayString();
    const stored = getStoredUsage();
    
    let currentCount = 0;
    if (stored && stored.date === today) {
      currentCount = stored.count;
    }

    if (currentCount >= ANONYMOUS_LIMIT) {
      return false;
    }

    const newCount = currentCount + 1;
    localStorage.setItem(ANONYMOUS_USAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    setPromptsUsed(newCount);
    
    return true;
  }, [getStoredUsage]);

  const remainingPrompts = Math.max(0, ANONYMOUS_LIMIT - promptsUsed);
  const isLimitReached = promptsUsed >= ANONYMOUS_LIMIT;

  return {
    promptsUsed,
    dailyLimit: ANONYMOUS_LIMIT,
    remainingPrompts,
    isLimitReached,
    isLoading,
    deviceFingerprint,
    incrementUsage,
    refreshUsage
  };
};
