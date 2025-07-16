import React, { useState, useEffect } from 'react';
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
  Clock,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  jobMetrics: {
    totalJobs: number;
    activeJobs: number;
    totalApplicants: number;
    viewsThisMonth: number;
    applicationsThisMonth: number;
    averageTimeToHire: number;
  };
  topJobs: Array<{
    id: string;
    title: string;
    company: string;
    views: number;
    applicants: number;
    posted: string;
    status: 'active' | 'closed' | 'draft';
  }>;
  chartData: Array<{
    date: string;
    views: number;
    applications: number;
  }>;
  demographics: {
    experience: Array<{ level: string; percentage: number }>;
    locations: Array<{ location: string; percentage: number }>;
    workMode: Array<{ mode: string; percentage: number }>;
  };
}

const EmployerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch real jobs data
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id);
      
      if (jobsError) throw jobsError;
      
      // Generate analytics from real data
      const activeJobs = jobs?.filter(job => new Date(job.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) || [];
      const totalApplicants = jobs?.reduce((sum, job) => sum + (job.applicants || 0), 0) || 0;
      
      // Mock some additional data for demo
      const mockAnalytics: AnalyticsData = {
        jobMetrics: {
          totalJobs: jobs?.length || 0,
          activeJobs: activeJobs.length,
          totalApplicants,
          viewsThisMonth: Math.floor(Math.random() * 5000) + 1000,
          applicationsThisMonth: Math.floor(Math.random() * 200) + 50,
          averageTimeToHire: Math.floor(Math.random() * 20) + 5
        },
        topJobs: jobs?.slice(0, 5).map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          views: Math.floor(Math.random() * 1000) + 100,
          applicants: job.applicants || 0,
          posted: job.created_at,
          status: 'active' as const
        })) || [],
        chartData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 200) + 50,
          applications: Math.floor(Math.random() * 20) + 5
        })),
        demographics: {
          experience: [
            { level: 'Entry Level', percentage: 25 },
            { level: 'Mid Level', percentage: 40 },
            { level: 'Senior Level', percentage: 30 },
            { level: 'Executive', percentage: 5 }
          ],
          locations: [
            { location: 'Remote', percentage: 45 },
            { location: 'New York', percentage: 20 },
            { location: 'San Francisco', percentage: 15 },
            { location: 'London', percentage: 12 },
            { location: 'Others', percentage: 8 }
          ],
          workMode: [
            { mode: 'Full-time', percentage: 70 },
            { mode: 'Contract', percentage: 20 },
            { mode: 'Part-time', percentage: 10 }
          ]
        }
      };
      
      setAnalyticsData(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const csvContent = [
      ['Job Title', 'Company', 'Views', 'Applicants', 'Posted Date', 'Status'],
      ...analyticsData.topJobs.map(job => [
        job.title,
        job.company,
        job.views,
        job.applicants,
        job.posted,
        job.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-analytics-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-20">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Analytics Data
          </h3>
          <p className="text-gray-600">
            Post your first job to start seeing analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hiring Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your recruitment performance and insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.jobMetrics.totalJobs}</p>
              <div className="flex items-center mt-1">
                <ArrowUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">12%</span>
              </div>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.jobMetrics.viewsThisMonth.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <ArrowUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">8%</span>
              </div>
            </div>
            <Eye className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.jobMetrics.totalApplicants}</p>
              <div className="flex items-center mt-1">
                <ArrowUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">15%</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Time to Hire</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.jobMetrics.averageTimeToHire}d</p>
              <div className="flex items-center mt-1">
                <ArrowDown className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">3d faster</span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts and Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Views vs Applications</h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {analyticsData.chartData.slice(-14).map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '200px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-primary-500 rounded-t transition-all duration-500"
                    style={{ height: `${(data.views / Math.max(...analyticsData.chartData.map(d => d.views))) * 100}%` }}
                  />
                  <div 
                    className="absolute bottom-0 w-full bg-secondary-500 rounded-t transition-all duration-500 opacity-70"
                    style={{ height: `${(data.applications / Math.max(...analyticsData.chartData.map(d => d.applications))) * 80}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-secondary-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Applications</span>
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Candidate Demographics</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Experience Level</h4>
              {analyticsData.demographics.experience.map((exp, index) => (
                <div key={index} className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{exp.level}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${exp.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8">{exp.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Top Locations</h4>
              {analyticsData.demographics.locations.slice(0, 3).map((location, index) => (
                <div key={index} className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{location.location}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{location.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Jobs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Jobs</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Job Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Views</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Applications</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Conversion</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Posted</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topJobs.map((job, index) => (
                <tr key={job.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{job.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{job.applicants}</td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-green-600">
                      {job.views > 0 ? Math.round((job.applicants / job.views) * 100) : 0}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(job.posted).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployerAnalytics;