import React from 'react';
import { TrendingUp, DollarSign, Calendar, Target, Eye, MousePointer, Zap, Users } from 'lucide-react';
import { format } from 'date-fns';
import { usePromotionAnalytics } from '@/hooks/usePromotionAnalytics';

interface DetailedReach {
  impressions: number;
  impressionsPerDay: number;
  clicks: number;
  cpm: string;
  cpc: string;
  targetingScore: number;
}

interface CampaignSummaryProps {
  formData: {
    budget: string;
    selectedCountries: string[];
    interests: string[];
    industries: string[];
    devices: string[];
    languages: string[];
    objective: string;
    gender: string;
    ageFrom: string;
    ageTo: string;
  };
  duration: number;
  startDate: Date;
  endDate: Date;
  calculateDetailedReach: DetailedReach;
  objective: string;
}

const CampaignSummary: React.FC<CampaignSummaryProps> = ({
  formData,
  duration,
  startDate,
  endDate,
  calculateDetailedReach,
  objective,
}) => {
  const { data: analytics } = usePromotionAnalytics(objective);

  // Use real data if available, otherwise use estimates
  const displayCPM = analytics?.hasRealData ? analytics.averageCPM : parseFloat(calculateDetailedReach.cpm);
  const displayCPC = analytics?.hasRealData ? analytics.averageCPC : parseFloat(calculateDetailedReach.cpc);

  const getTargetingSummary = () => {
    const parts: string[] = [];
    if (formData.selectedCountries.length > 0) {
      parts.push(`${formData.selectedCountries.length} ${formData.selectedCountries.length === 1 ? 'country' : 'countries'}`);
    }
    if (formData.interests.length > 0) {
      parts.push(`${formData.interests.length} ${formData.interests.length === 1 ? 'interest' : 'interests'}`);
    }
    if (formData.industries.length > 0) {
      parts.push(`${formData.industries.length} ${formData.industries.length === 1 ? 'industry' : 'industries'}`);
    }
    if (formData.devices.length > 0) {
      parts.push(`${formData.devices.length} ${formData.devices.length === 1 ? 'device' : 'devices'}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'All audiences';
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/10 dark:from-primary/15 dark:via-secondary/10 dark:to-accent/15 rounded-xl p-6 mb-6 border border-border/50">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Campaign Summary
        </h3>
        {analytics?.hasRealData && (
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center">
            <Zap className="h-3 w-3 mr-1" />
            Platform Data
          </span>
        )}
      </div>

      {/* Budget & Duration Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="text-center p-3 bg-background/60 dark:bg-slate-800/60 rounded-lg border border-border/30">
          <div className="flex items-center justify-center mb-1">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-primary">
            ${parseFloat(formData.budget) || 0}
          </div>
          <div className="text-xs text-muted-foreground">Total Budget</div>
        </div>
        <div className="text-center p-3 bg-background/60 dark:bg-slate-800/60 rounded-lg border border-border/30">
          <div className="flex items-center justify-center mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600">
            {duration}
          </div>
          <div className="text-xs text-muted-foreground">Days</div>
        </div>
        <div className="text-center p-3 bg-background/60 dark:bg-slate-800/60 rounded-lg border border-border/30">
          <div className="flex items-center justify-center mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-xl font-bold text-green-600">
            ${((parseFloat(formData.budget) || 0) / duration).toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Daily Budget</div>
        </div>
        <div className="text-center p-3 bg-background/60 dark:bg-slate-800/60 rounded-lg border border-border/30">
          <div className="flex items-center justify-center mb-1">
            <Target className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-600 capitalize">
            {formData.objective}
          </div>
          <div className="text-xs text-muted-foreground">Objective</div>
        </div>
      </div>

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="text-center p-3 bg-background/60 dark:bg-slate-800/60 rounded-lg border border-border/30">
          <div className="flex items-center justify-center mb-1">
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-primary">
            {calculateDetailedReach.impressions.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Est. Impressions</div>
        </div>
        <div className="text-center p-3 bg-background/60 dark:bg-slate-800/60 rounded-lg border border-border/30">
          <div className="flex items-center justify-center mb-1">
            <MousePointer className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-xl font-bold text-green-600">
            {calculateDetailedReach.clicks.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Est. Clicks</div>
        </div>
        <div className="text-center p-3 bg-background/60 dark:bg-slate-800/60 rounded-lg border border-border/30">
          <div className="flex items-center justify-center mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600">
            ${displayCPM.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            CPM {analytics?.hasRealData ? '(avg)' : '(est)'}
          </div>
        </div>
        <div className="text-center p-3 bg-background/60 dark:bg-slate-800/60 rounded-lg border border-border/30">
          <div className="flex items-center justify-center mb-1">
            <Zap className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-600">
            ${displayCPC.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            CPC {analytics?.hasRealData ? '(avg)' : '(est)'}
          </div>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="text-sm text-muted-foreground space-y-2 border-t border-border/30 pt-4">
        <p className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-primary" />
          <span className="font-medium text-foreground">Period:</span>
          <span className="ml-2">{format(startDate, 'MMM dd, yyyy')} → {format(endDate, 'MMM dd, yyyy')}</span>
        </p>
        <p className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-primary" />
          <span className="font-medium text-foreground">Targeting:</span>
          <span className="ml-2">{getTargetingSummary()}</span>
        </p>
        <p className="flex items-center">
          <Target className="h-4 w-4 mr-2 text-primary" />
          <span className="font-medium text-foreground">Daily Reach:</span>
          <span className="ml-2">~{calculateDetailedReach.impressionsPerDay.toLocaleString()} impressions/day</span>
        </p>
        {analytics?.hasRealData && (
          <p className="flex items-center text-green-600 dark:text-green-400">
            <Zap className="h-4 w-4 mr-2" />
            <span className="text-xs">
              Based on {analytics.totalPromotions} completed campaigns ({analytics.totalImpressions.toLocaleString()} impressions)
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default CampaignSummary;
