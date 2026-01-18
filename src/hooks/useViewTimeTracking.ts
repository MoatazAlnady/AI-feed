import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TrackingOptions {
  contentId: string;
  contentType: 'post' | 'article' | 'tool' | 'event' | 'discussion' | 'group';
  creatorId?: string;
  tags?: string[];
  minTimeMs?: number; // Minimum time before tracking (default: 3000ms)
}

/**
 * Helper to update engagement preferences in the database.
 * Uses upsert pattern since the RPC may not exist yet.
 */
async function updateEngagement(
  userId: string,
  preferenceType: string,
  preferenceValue: string,
  scoreIncrement: number
) {
  try {
    // Try to upsert into user_engagement_preferences table
    // If table doesn't exist, this will fail silently
    const { error } = await supabase
      .from('user_engagement_preferences' as any)
      .upsert({
        user_id: userId,
        preference_type: preferenceType,
        preference_value: preferenceValue,
        engagement_score: scoreIncrement,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,preference_type,preference_value'
      });

    if (error && !error.message.includes('does not exist')) {
      console.error('Error updating engagement:', error);
    }
  } catch (err) {
    // Table may not exist yet, ignore silently
    console.debug('Engagement tracking not available:', err);
  }
}

/**
 * Hook to track how long a user views content.
 * Uses IntersectionObserver to detect when content is in viewport.
 * Records engagement when user scrolls away or leaves page.
 */
export function useViewTimeTracking(options: TrackingOptions) {
  const { user } = useAuth();
  const elementRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const isVisibleRef = useRef(false);
  const hasTrackedRef = useRef(false);

  const { contentId, contentType, creatorId, tags, minTimeMs = 3000 } = options;

  const trackEngagement = useCallback(async (timeSpentMs: number) => {
    if (!user || hasTrackedRef.current || timeSpentMs < minTimeMs) return;

    hasTrackedRef.current = true;
    const timeSpentSeconds = Math.floor(timeSpentMs / 1000);
    const scoreMultiplier = Math.min(timeSpentSeconds / 10, 5); // Cap at 5x

    try {
      // Track creator engagement
      if (creatorId && creatorId !== user.id) {
        await updateEngagement(user.id, 'creator', creatorId, 1 * scoreMultiplier);
      }

      // Track content type engagement
      await updateEngagement(user.id, 'content_type', contentType, 1);

      // Track hashtag/tag engagement
      if (tags && tags.length > 0) {
        for (const tag of tags.slice(0, 5)) { // Limit to first 5 tags
          await updateEngagement(user.id, 'hashtag', tag.toLowerCase(), 1);
        }
      }
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  }, [user, contentId, contentType, creatorId, tags, minTimeMs]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisibleRef.current) {
            // Started viewing
            isVisibleRef.current = true;
            startTimeRef.current = Date.now();
          } else if (!entry.isIntersecting && isVisibleRef.current && startTimeRef.current) {
            // Stopped viewing
            isVisibleRef.current = false;
            const timeSpent = Date.now() - startTimeRef.current;
            trackEngagement(timeSpent);
            startTimeRef.current = null;
          }
        });
      },
      { threshold: 0.5 } // At least 50% visible
    );

    observer.observe(element);

    // Track on page unload
    const handleUnload = () => {
      if (isVisibleRef.current && startTimeRef.current) {
        const timeSpent = Date.now() - startTimeRef.current;
        trackEngagement(timeSpent);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('beforeunload', handleUnload);
      // Final tracking on unmount
      if (isVisibleRef.current && startTimeRef.current) {
        const timeSpent = Date.now() - startTimeRef.current;
        trackEngagement(timeSpent);
      }
    };
  }, [user, trackEngagement]);

  return elementRef;
}

/**
 * Track a user action (like, comment, share) for engagement learning.
 */
export async function trackUserAction(
  userId: string,
  actionType: 'like' | 'comment' | 'share',
  contentInfo: {
    creatorId?: string;
    contentType: string;
    tags?: string[];
  }
) {
  const { creatorId, contentType, tags } = contentInfo;

  // Action weights
  const weights: { [key: string]: number } = {
    like: 5,
    comment: 10,
    share: 15
  };
  const weight = weights[actionType] || 1;

  try {
    // Track creator preference
    if (creatorId && creatorId !== userId) {
      await updateEngagement(userId, 'creator', creatorId, weight);
    }

    // Track content type preference
    await updateEngagement(userId, 'content_type', contentType, weight);

    // Track tag preferences
    if (tags && tags.length > 0) {
      for (const tag of tags.slice(0, 5)) {
        await updateEngagement(userId, 'hashtag', tag.toLowerCase(), weight);
      }
    }
  } catch (error) {
    console.error('Error tracking user action:', error);
  }
}

export default useViewTimeTracking;
