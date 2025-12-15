import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wrench, 
  FileText, 
  MessageSquare, 
  Bookmark, 
  Eye, 
  Users, 
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TodoSystem from '@/components/TodoSystem';

interface DashboardStats {
  toolsSubmitted: number;
  articlesWritten: number;
  postsCreated: number;
  savedItems: number;
  totalViews: number;
  followersCount: number;
  totalEngagement: number;
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTools, setRecentTools] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch user profile stats
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tools_submitted, articles_written, total_engagement, followers_count, total_reach')
        .eq('id', user.id)
        .single();

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch saved items count
      const { count: savedCount } = await supabase
        .from('saved_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch recent tools
      const { data: tools } = await supabase
        .from('tools')
        .select('id, name, logo_url, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent posts
      const { data: posts } = await supabase
        .from('posts')
        .select('id, content, likes, view_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        toolsSubmitted: profile?.tools_submitted || 0,
        articlesWritten: profile?.articles_written || 0,
        postsCreated: postsCount || 0,
        savedItems: savedCount || 0,
        totalViews: profile?.total_reach || 0,
        followersCount: profile?.followers_count || 0,
        totalEngagement: profile?.total_engagement || 0,
      });

      setRecentTools(tools || []);
      setRecentPosts(posts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Tools Submitted', value: stats?.toolsSubmitted || 0, icon: Wrench, color: 'text-blue-500', link: '/tools' },
    { label: 'Articles Written', value: stats?.articlesWritten || 0, icon: FileText, color: 'text-green-500', link: '/blog' },
    { label: 'Posts Created', value: stats?.postsCreated || 0, icon: MessageSquare, color: 'text-purple-500', link: '/feed' },
    { label: 'Saved Items', value: stats?.savedItems || 0, icon: Bookmark, color: 'text-yellow-500', link: '/projects' },
  ];

  const engagementCards = [
    { label: 'Total Views', value: stats?.totalViews || 0, icon: Eye, color: 'text-cyan-500' },
    { label: 'Followers', value: stats?.followersCount || 0, icon: Users, color: 'text-pink-500' },
    { label: 'Engagement', value: stats?.totalEngagement || 0, icon: TrendingUp, color: 'text-orange-500' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your content and engagement</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/submit-tool">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <Plus className="h-5 w-5" />
              <span className="text-sm">Submit Tool</span>
            </Button>
          </Link>
          <Link to="/submit-article">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm">Write Article</span>
            </Button>
          </Link>
          <Link to="/create-post">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="text-sm">Create Post</span>
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm">Edit Profile</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat) => (
              <Link to={stat.link} key={stat.label}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <Skeleton className="h-6 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </CardContent>
              </Card>
            ))
          ) : (
            engagementCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                  <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Tools */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Tools</CardTitle>
              <Link to="/tools" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentTools.length > 0 ? (
                <div className="space-y-3">
                  {recentTools.map((tool) => (
                    <Link 
                      key={tool.id} 
                      to={`/tools/${tool.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      {tool.logo_url ? (
                        <img src={tool.logo_url} alt={tool.name} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{tool.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tools submitted yet. <Link to="/submit-tool" className="text-primary hover:underline">Submit your first tool</Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Posts</CardTitle>
              <Link to="/feed" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentPosts.length > 0 ? (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <Link 
                      key={post.id} 
                      to={`/post/${post.id}`}
                      className="block p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{post.likes || 0} likes</span>
                        <span>{post.view_count || 0} views</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No posts yet. <Link to="/create-post" className="text-primary hover:underline">Create your first post</Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Todo System */}
        <div className="mt-8">
          <TodoSystem />
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
