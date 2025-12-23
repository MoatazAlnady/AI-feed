import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PromotionAnalytics {
  totalPromotions: number;
  completedPromotions: number;
  averageCPM: number;
  averageCPC: number;
  averageCTR: number;
  totalImpressions: number;
  totalClicks: number;
  hasRealData: boolean;
}

export const usePromotionAnalytics = (objective?: string) => {
  return useQuery({
    queryKey: ['promotion-analytics', objective],
    queryFn: async (): Promise<PromotionAnalytics> => {
      // Fetch completed promotions with performance data
      let query = supabase
        .from('promotions')
        .select('impressions, clicks, budget, objective, status')
        .eq('status', 'completed')
        .gt('impressions', 0);

      if (objective) {
        query = query.eq('objective', objective);
      }

      const { data: promotions, error } = await query;

      if (error) {
        console.error('Error fetching promotion analytics:', error);
        throw error;
      }

      // Calculate aggregates
      const totalPromotions = promotions?.length || 0;
      const totalImpressions = promotions?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0;
      const totalClicks = promotions?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0;
      const totalBudget = promotions?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;

      // Calculate averages only if we have real data
      const hasRealData = totalPromotions >= 3 && totalImpressions > 1000;
      
      let averageCPM = 0;
      let averageCPC = 0;
      let averageCTR = 0;

      if (hasRealData && totalImpressions > 0) {
        // CPM = (Total Cost / Total Impressions) * 1000
        averageCPM = (totalBudget / totalImpressions) * 1000;
        
        // CPC = Total Cost / Total Clicks
        averageCPC = totalClicks > 0 ? totalBudget / totalClicks : 0;
        
        // CTR = (Total Clicks / Total Impressions) * 100
        averageCTR = (totalClicks / totalImpressions) * 100;
      }

      return {
        totalPromotions,
        completedPromotions: totalPromotions,
        averageCPM: Math.round(averageCPM * 100) / 100,
        averageCPC: Math.round(averageCPC * 100) / 100,
        averageCTR: Math.round(averageCTR * 100) / 100,
        totalImpressions,
        totalClicks,
        hasRealData,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
