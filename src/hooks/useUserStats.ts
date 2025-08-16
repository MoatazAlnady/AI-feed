import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface UserStats {
  toolsSubmitted: number;
  articlesWritten: number;
  totalEngagement: number;
  totalReach: number;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    toolsSubmitted: 0,
    articlesWritten: 0,
    totalEngagement: 0,
    totalReach: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch tools submitted by user
      const { count: toolsCount } = await supabase
        .from('tools')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Fetch articles written by user
      const { count: articlesCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Fetch user profile data for engagement and reach
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('total_engagement, total_reach')
        .eq('id', user.id)
        .single();

      setStats({
        toolsSubmitted: toolsCount || 0,
        articlesWritten: articlesCount || 0,
        totalEngagement: profileData?.total_engagement || 0,
        totalReach: profileData?.total_reach || 0
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchUserStats };
};