import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Users, 
  Calendar,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  Target,
  Globe,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalReach: number;
    totalEngagement: number;
    growthRate: number;
  };
  content: Array<{
    id: number;
    title: string;
    type: 'tool' | 'article' | 'post';
    views: number;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    engagement: number;
    publishedAt: string;
    performance: 'excellent' | 'good' | 'average' | 'poor';
  }>;
  demographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    locations: Array<{ country: string; percentage: number }>;
    interests: Array<{ interest: string; percentage: number }>;
  };
  timeData: Array<{
    date: string;
    views: number;
    engagement: number;
    reach: number;
  }>;
}

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [contentFilter, setContentFilter] = useState<'all' | 'tool' | 'article' | 'post'>('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const mockData: AnalyticsData = {
          overview: {
            totalViews: 45230,
            totalLikes: 3420,
            totalComments: 890,
            totalShares: 567,
            totalReach: 125000,
            totalEngagement: 15600,
            growthRate: 23.5
          },
          content: [
            {
              id: 1,
              title: 'AI Image Generator Tool',
              type: 'tool',
              views: 12500,
              likes: 890,
              comments: 234,
              shares: 156,
              reach: 35000,
              engagement: 4200,
              publishedAt: '2025-01-10',
              performance: 'excellent'
            },
            {
              id: 2,
              title: 'Getting Started with Machine Learning',
              type: 'article',
              views: 8900,
              likes: 567,
              comments: 123,
              shares: 89,
              reach: 25000,
              engagement: 2800,
              publishedAt: '2025-01-08',
              performance: 'good'
            },
            {
              id: 3,
              title: 'Future of AI in Healthcare',
              type: 'post',
              views: 5600,
              likes: 234,
              comments: 67,
              shares: 45,
              reach: 15000,
              engagement: 1200,
              publishedAt: '2025-01-05',
              performance: 'average'
            }
          ],
          demographics: {
            ageGroups: [
              { range: '18-24', percentage: 15 },
              { range: '25-34', percentage: 35 },
              { range: '35-44', percentage: 28 },
              { range: '45-54', percentage: 15 },
              { range: '55+', percentage: 7 }
            ],
            locations: [
              { country: 'United States', percentage: 35 },
              { country: 'United Kingdom', percentage: 18 },
              { country: 'Germany', percentage: 12 },
              { country: 'Canada', percentage: 10 },
              { country: 'Others', percentage: 25 }
            ],
            interests: [
              { interest: 'Machine Learning', percentage: 45 },
              { interest: 'AI Tools', percentage: 38 },
              { interest: 'Data Science', percentage: 32 },
              { interest: 'Deep Learning', percentage: 28 },
              { interest: 'Computer Vision', percentage: 22 }
            ]
          },
          timeData: [
            { date: '2025-01-01', views: 1200, engagement: 180, reach: 3500 },
            { date: '2025-01-02', views: 1450, engagement: 220, reach: 4200 },
            { date: '2025-01-03', views: 1680, engagement: 280, reach: 4800 },
            { date: '2025-01-04', views: 1890, engagement: 340, reach: 5200 },
            { date: '2025-01-05', views: 2100, engagement: 420, reach: 6100 },
            { date: '2025-01-06', views: 1950, engagement: 380, reach: 5800 },
            { date: '2025-01-07', views: 2250, engagement: 450, reach: 6500 }
          ]
        };
        
        setAnalyticsData(mockData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, contentFilter]);

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceLabel = (performance: string) => {
    return t(`analytics.performance.${performance}`);
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const csvContent = [
      ['Content', 'Type', 'Views', 'Likes', 'Comments', 'Shares', 'Reach', 'Engagement', 'Published'],
      ...analyticsData.content.map(item => [
        item.title,
        item.type,
        item.views,
        item.likes,
        item.comments,
        item.shares,
        item.reach,
        item.engagement,
        item.publishedAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('analytics.noData')}
            </h3>
            <p className="text-gray-600">
              {t('analytics.noDataDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {t('analytics.title')}
              </h1>
              <p className="text-xl text-gray-600">
                {t('analytics.subtitle')}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>{t('analytics.export')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="7d">{t('analytics.timeRanges.7d')}</option>
                <option value="30d">{t('analytics.timeRanges.30d')}</option>
                <option value="90d">{t('analytics.timeRanges.90d')}</option>
                <option value="1y">{t('analytics.timeRanges.1y')}</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={contentFilter}
                onChange={(e) => setContentFilter(e.target.value as any)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">{t('analytics.contentTypes.all')}</option>
                <option value="tool">{t('analytics.contentTypes.tool')}</option>
                <option value="article">{t('analytics.contentTypes.article')}</option>
                <option value="post">{t('analytics.contentTypes.post')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.overview.totalViews')}</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalViews.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <ArrowUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">{analyticsData.overview.growthRate}%</span>
                </div>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.overview.totalReach')}</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalReach.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <ArrowUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">18.2%</span>
                </div>
              </div>
              <Globe className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.overview.engagement')}</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalEngagement.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <ArrowUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">12.5%</span>
                </div>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.overview.avgPerformance')}</p>
                <p className="text-2xl font-bold text-gray-900">8.2/10</p>
                <div className="flex items-center mt-1">
                  <ArrowUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">5.3%</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Chart */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.charts.performanceOverTime')}</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analyticsData.timeData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-primary-500 rounded-t transition-all duration-500"
                      style={{ height: `${(data.views / Math.max(...analyticsData.timeData.map(d => d.views))) * 100}%` }}
                    />
                    <div 
                      className="absolute bottom-0 w-full bg-secondary-500 rounded-t transition-all duration-500 opacity-70"
                      style={{ height: `${(data.engagement / Math.max(...analyticsData.timeData.map(d => d.engagement))) * 40}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-500 rounded"></div>
                <span className="text-sm text-gray-600">{t('analytics.charts.views')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-secondary-500 rounded"></div>
                <span className="text-sm text-gray-600">{t('analytics.charts.engagement')}</span>
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.charts.audienceDemographics')}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('analytics.charts.ageGroups')}</h4>
                {analyticsData.demographics.ageGroups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{group.range}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${group.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{group.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">{t('analytics.charts.topLocations')}</h4>
                {analyticsData.demographics.locations.slice(0, 3).map((location, index) => (
                  <div key={index} className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{location.country}</span>
                    <span className="text-sm font-medium text-gray-900">{location.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Performance */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('analytics.contentPerformance.title')}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{t('analytics.contentPerformance.sortBy')}</span>
              <select className="border border-gray-200 rounded-lg px-3 py-1 text-sm">
                <option>{t('analytics.contentPerformance.views')}</option>
                <option>{t('analytics.contentPerformance.engagement')}</option>
                <option>{t('analytics.contentPerformance.reach')}</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('analytics.contentPerformance.content')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('analytics.contentPerformance.type')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('analytics.contentPerformance.views')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('analytics.contentPerformance.engagement')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('analytics.contentPerformance.reach')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('analytics.contentPerformance.published')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('analytics.contentPerformance.performance')}</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.content.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.title}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{item.type}</td>
                    <td className="py-3 px-4 text-gray-600">{item.views.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">{item.engagement.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">{item.reach.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">{item.publishedAt}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(item.performance)}`}>
                        {getPerformanceLabel(item.performance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
