import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Wrench, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Eye,
  Briefcase,
  Building
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalTools: number;
  totalArticles: number;
  totalPosts: number;
  totalJobs: number;
  totalOrganizations: number;
  newUsersThisMonth: number;
  newToolsThisMonth: number;
}

const AdminAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTools: 0,
    totalArticles: 0,
    totalPosts: 0,
    totalJobs: 0,
    totalOrganizations: 0,
    newUsersThisMonth: 0,
    newToolsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const [
        { count: usersCount },
        { count: toolsCount },
        { count: articlesCount },
        { count: postsCount },
        { count: jobsCount },
        { count: orgsCount },
        { count: newUsersCount },
        { count: newToolsCount }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tools').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        supabase.from('tools').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString())
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalTools: toolsCount || 0,
        totalArticles: articlesCount || 0,
        totalPosts: postsCount || 0,
        totalJobs: jobsCount || 0,
        totalOrganizations: orgsCount || 0,
        newUsersThisMonth: newUsersCount || 0,
        newToolsThisMonth: newToolsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Total Tools', value: stats.totalTools, icon: Wrench, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Total Articles', value: stats.totalArticles, icon: FileText, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'Total Posts', value: stats.totalPosts, icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Organizations', value: stats.totalOrganizations, icon: Building, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Analytics</h2>
        <p className="text-muted-foreground">Overview of platform statistics</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              New Users This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.newUsersThisMonth}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalUsers > 0 
                ? `${((stats.newUsersThisMonth / stats.totalUsers) * 100).toFixed(1)}% of total users`
                : 'No users yet'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              New Tools This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.newToolsThisMonth}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalTools > 0 
                ? `${((stats.newToolsThisMonth / stats.totalTools) * 100).toFixed(1)}% of total tools`
                : 'No tools yet'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Content Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Tools', value: stats.totalTools, max: Math.max(stats.totalTools, stats.totalArticles, stats.totalPosts), color: 'bg-primary' },
              { label: 'Articles', value: stats.totalArticles, max: Math.max(stats.totalTools, stats.totalArticles, stats.totalPosts), color: 'bg-green-500' },
              { label: 'Posts', value: stats.totalPosts, max: Math.max(stats.totalTools, stats.totalArticles, stats.totalPosts), color: 'bg-purple-500' }
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} transition-all`}
                    style={{ width: item.max > 0 ? `${(item.value / item.max) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;