import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  MapPin, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  Calendar,
  User,
  Shield,
  Star,
  Wrench,
  FileText,
  Lock,
  UserPlus,
  MessageCircle,
  UserCheck,
  UserMinus,
  Users,
  Check,
  Settings,
  Crown,
  Upload,
  Heart,
  Bookmark,
  Eye,
  TrendingUp,
  MessageSquare,
  Target,
  Briefcase,
  ExternalLink,
  Code,
  ArrowRight,
  Zap,
  Camera
} from 'lucide-react';
import UnsubscribeFromCreatorModal from '@/components/UnsubscribeFromCreatorModal';
import SubscribeToCreatorModal from '@/components/SubscribeToCreatorModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '@/components/LoadingSpinner';
import PremiumBadge, { type PremiumTier } from '@/components/PremiumBadge';
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader';
import ExperienceSection from '@/components/ExperienceSection';
import NetworkTab from '@/components/NetworkTab';
import PostsTab from '@/components/PostsTab';
import TodoSystem from '@/components/TodoSystem';
import PromoteContentModal from '@/components/PromoteContentModal';

interface CreatorProfile {
  id: string;
  handle: string;
  full_name: string;
  job_title: string;
  company: string;
  bio: string;
  location: string;
  profile_photo: string;
  cover_photo: string;
  verified: boolean;
  ai_feed_top_voice: boolean;
  visibility: string;
  total_engagement: number;
  total_reach: number;
  tools_submitted: number;
  articles_written: number;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  interests: string[];
  contact_visible: boolean;
  premium_tier?: PremiumTier;
  role_id?: number;
  account_type?: string;
  followers_count?: number;
}

interface CreatorTool {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  pricing: string;
  average_rating: number;
}

interface DashboardStats {
  toolsSubmitted: number;
  articlesWritten: number;
  postsCreated: number;
  savedItems: number;
  totalViews: number;
  followersCount: number;
  totalEngagement: number;
}

const CreatorProfile: React.FC = () => {
  const { t } = useTranslation('common');
  const { handleOrId, id, handle, userId } = useParams<{ handleOrId?: string; id?: string; handle?: string; userId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [creatorTools, setCreatorTools] = useState<CreatorTool[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [hasTiers, setHasTiers] = useState(false);
  
  // Owner-specific state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [recentTools, setRecentTools] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [userContent, setUserContent] = useState<any[]>([]);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [activeOwnerTab, setActiveOwnerTab] = useState<string>('dashboard');

  const identifier = handleOrId || id || handle || userId;
  const isOwnProfile = user?.id === profile?.id;

  // Auto-sync subscription status from Stripe on page load (for own profile)
  useEffect(() => {
    const syncSubscriptionStatus = async () => {
      if (!isOwnProfile || !user) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        await supabase.functions.invoke('check-subscription', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } catch (error) {
        console.error('Error syncing subscription:', error);
      }
    };

    if (isOwnProfile) {
      syncSubscriptionStatus();
    }
  }, [isOwnProfile, user]);

  // Fetch dashboard data for own profile
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isOwnProfile || !user) return;
      
      setDashboardLoading(true);
      try {
        // Fetch user profile stats
        const { data: profileData } = await supabase
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

        setDashboardStats({
          toolsSubmitted: profileData?.tools_submitted || 0,
          articlesWritten: profileData?.articles_written || 0,
          postsCreated: postsCount || 0,
          savedItems: savedCount || 0,
          totalViews: profileData?.total_reach || 0,
          followersCount: profileData?.followers_count || 0,
          totalEngagement: profileData?.total_engagement || 0,
        });

        setRecentTools(tools || []);
        setRecentPosts(posts || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (isOwnProfile) {
      fetchDashboardData();
    }
  }, [isOwnProfile, user]);

  // Fetch saved items and user content for own profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isOwnProfile || !user) return;

      try {
        // Fetch saved items
        const { data: savedData } = await supabase
          .from('saved_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch the actual content for each saved item
        const enrichedItems = await Promise.all(
          (savedData || []).map(async (item) => {
            let content = null;
            if (item.content_type === 'tool') {
              const { data } = await supabase.from('tools').select('id, name, description, logo_url').eq('id', item.content_id).single();
              content = data ? { ...data, title: data.name, type: 'tool', url: `/tools/${data.id}` } : null;
            } else if (item.content_type === 'article') {
              const { data } = await supabase.from('articles').select('id, title, excerpt').eq('id', item.content_id).single();
              content = data ? { ...data, type: 'article', url: `/blog/${data.id}` } : null;
            } else if (item.content_type === 'job') {
              const { data } = await supabase.from('jobs').select('id, title, company').eq('id', item.content_id).single();
              content = data ? { ...data, type: 'job', url: `/jobs/${data.id}` } : null;
            } else if (item.content_type === 'post') {
              const { data } = await supabase.from('posts').select('id, content').eq('id', item.content_id).single();
              content = data ? { ...data, title: data.content?.substring(0, 50) + '...', type: 'post', url: `/posts/${data.id}` } : null;
            }
            return content ? { ...item, content } : null;
          })
        );
        
        setSavedItems(enrichedItems.filter(Boolean));

        // Fetch user's tools and articles for content tab
        const [toolsResponse, articlesResponse] = await Promise.all([
          supabase
            .from('tools')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'published'),
          supabase
            .from('articles')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'published')
        ]);

        const userContentData = [
          ...(toolsResponse.data || []).map(tool => ({
            ...tool,
            type: 'tool',
            title: tool.name,
            url: `/tools/${tool.id}`
          })),
          ...(articlesResponse.data || []).map(article => ({
            ...article,
            type: 'article',
            url: `/articles/${article.id}`
          }))
        ];

        setUserContent(userContentData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (isOwnProfile) {
      fetchUserData();
    }
  }, [isOwnProfile, user]);

  useEffect(() => {
    if (identifier) {
      fetchProfile(identifier);
    }
  }, [identifier]);

  useEffect(() => {
    if (user && profile) {
      checkConnectionStatus();
      checkFollowStatus();
      checkSubscriptionStatus();
      checkHasActiveTiers();
    } else if (profile) {
      checkHasActiveTiers();
    }
    
    const handleConnectionRequestProcessed = () => {
      if (user && profile) {
        checkConnectionStatus();
      }
    };
    window.addEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);

    return () => {
      window.removeEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);
    };
  }, [user, profile]);

  const checkSubscriptionStatus = async () => {
    if (!user || !profile) return;
    
    try {
      const { data } = await supabase
        .from('creator_subscriptions')
        .select('id')
        .eq('subscriber_id', user.id)
        .eq('creator_id', profile.id)
        .eq('status', 'active')
        .maybeSingle();
      
      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const checkHasActiveTiers = async () => {
    if (!profile) return;
    
    try {
      const { data } = await supabase
        .from('creator_subscription_tiers')
        .select('id')
        .eq('creator_id', profile.id)
        .eq('is_active', true)
        .limit(1);
      
      setHasTiers((data?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking creator tiers:', error);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchCreatorTools(profile.id);
    }
  }, [profile]);

  const fetchCreatorTools = async (userId: string) => {
    setLoadingTools(true);
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, description, logo_url, pricing, average_rating')
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (!error && data) {
        setCreatorTools(data);
      }
    } catch (error) {
      console.error('Error fetching creator tools:', error);
    } finally {
      setLoadingTools(false);
    }
  };

  const fetchProfile = async (id: string) => {
    try {
      setLoading(true);
      setNotFound(false);
      setIsPrivate(false);

      const { data, error } = await supabase.rpc('get_profile_by_handle_or_id', {
        identifier: id
      });

      if (error) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
          const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_public_profiles_by_ids', {
            ids: [id]
          });
          
          if (fallbackError || !Array.isArray(fallbackData) || fallbackData.length === 0) {
            setNotFound(true);
            return;
          }
          
          const publicProfile = fallbackData[0];
          const fullProfile: CreatorProfile = {
            ...publicProfile,
            handle: `user-${publicProfile.id.slice(0, 8)}`,
            visibility: 'public',
            job_title: publicProfile.job_title || '',
            company: '',
            bio: '',
            location: '',
            cover_photo: '',
            total_engagement: 0,
            total_reach: 0,
            tools_submitted: 0,
            articles_written: 0,
            website: '',
            github: '',
            linkedin: '',
            twitter: '',
            contact_visible: false,
            premium_tier: (publicProfile.premium_tier === 'silver' || publicProfile.premium_tier === 'gold') 
              ? publicProfile.premium_tier as PremiumTier 
              : undefined,
            role_id: publicProfile.role_id,
            account_type: publicProfile.account_type
          };
          
          setProfile(fullProfile);
          return;
        } else {
          setNotFound(true);
          return;
        }
      }

      if (!data || data.length === 0) {
        setNotFound(true);
        return;
      }

      const profileData = data[0];

      if (id !== profileData.handle && profileData.handle) {
        navigate(`/creator/${profileData.handle}`, { replace: true });
        return;
      }

      if (profileData.visibility === 'private' && user?.id !== profileData.id) {
        setIsPrivate(true);
      }

      setProfile(profileData);
    } catch (error) {
      console.error('CreatorProfile: Error fetching profile:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!user || !profile) return;

    try {
      const { data: connection } = await supabase
        .from('connections')
        .select('id')
        .or(`and(user_1_id.eq.${user.id},user_2_id.eq.${profile.id}),and(user_1_id.eq.${profile.id},user_2_id.eq.${user.id})`)
        .single();

      if (connection) {
        setConnectionStatus('connected');
        return;
      }

      const { data: request } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('recipient_id', profile.id)
        .eq('status', 'pending')
        .limit(1);

      if (request && request.length > 0) {
        setConnectionStatus('pending');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await (supabase as any)
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .maybeSingle();

      if (!error) {
        setIsFollowing(!!data);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) {
      toast.error(t('creatorProfile.toast.loginToFollow'));
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await (supabase as any)
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success(t('creatorProfile.toast.unfollowed'));
      } else {
        const { error } = await (supabase as any)
          .from('follows')
          .insert([{
            follower_id: user.id,
            following_id: profile.id
          }]);

        if (error) throw error;
        setIsFollowing(true);
        toast.success(t('creatorProfile.toast.following'));
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error(error?.message || t('creatorProfile.toast.failedFollow'));
    } finally {
      setFollowLoading(false);
    }
  };

  const sendConnectionRequest = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          recipient_id: profile.id,
          status: 'pending',
          message: `Hi ${profile.full_name}, I'd like to connect with you on AI Feed.`
        });

      if (error) {
        if (error.code === '23505') {
          await checkConnectionStatus();
          toast.info(t('creatorProfile.toast.connectionExists'));
          return;
        }
        throw error;
      }

      setConnectionStatus('pending');
      toast.success(t('creatorProfile.toast.connectionSent'));
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error(t('creatorProfile.toast.connectionFailed'));
    }
  };

  const withdrawConnectionRequest = async () => {
    if (!user || !profile) return;
    
    try {
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('requester_id', user.id)
        .eq('recipient_id', profile.id)
        .eq('status', 'pending');

      if (error) throw error;

      setConnectionStatus('none');
      toast.success(t('creatorProfile.toast.connectionWithdrawn'));
    } catch (error) {
      console.error('Error withdrawing connection request:', error);
      toast.error(t('creatorProfile.toast.withdrawFailed'));
    }
  };

  const handlePromoteContent = (content: any) => {
    setSelectedContent(content);
    setShowPromoteModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">{t('creatorProfile.notFound.title')}</h2>
          <p className="text-muted-foreground">
            {t('creatorProfile.notFound.description')}
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            {t('creatorProfile.notFound.returnHome')}
          </Button>
        </div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">{t('creatorProfile.private.title')}</h2>
          <p className="text-muted-foreground">
            {t('creatorProfile.private.description', { name: profile?.full_name || 'This user' })}
          </p>
          {user && user.id !== profile?.id && (
            <div className="space-y-2">
              <Button 
                onClick={sendConnectionRequest}
                disabled={connectionStatus !== 'none'}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {connectionStatus === 'pending' ? t('creatorProfile.private.requestSent') : t('creatorProfile.private.sendRequest')}
              </Button>
              {connectionStatus === 'pending' && (
                <p className="text-sm text-muted-foreground">{t('creatorProfile.private.requestPending')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const displayStats = [
    { label: t('creatorProfile.stats.toolsSubmitted'), value: profile.tools_submitted || 0, icon: Wrench },
    { label: t('creatorProfile.stats.articlesWritten'), value: profile.articles_written || 0, icon: FileText },
    { label: t('creatorProfile.stats.totalEngagement'), value: profile.total_engagement || 0, icon: Star },
  ];

  // Owner tabs configuration
  const ownerTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'experience', label: 'Experience' },
    { key: 'posts', label: 'Posts' },
    { key: 'tools', label: 'Tools' },
    { key: 'content', label: 'My Content' },
    { key: 'saved', label: 'Saved' },
    { key: 'network', label: 'Network' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Cover & Profile Header */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary/60 to-primary/80 relative">
          {isOwnProfile ? (
            <ProfilePhotoUploader
              type="cover"
              currentPhoto={profile.cover_photo}
              className="w-full h-full"
            />
          ) : profile.cover_photo ? (
            <img 
              src={profile.cover_photo} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6 pb-6">
            <div className="relative -mt-16 md:-mt-20">
              {isOwnProfile ? (
                <ProfilePhotoUploader
                  type="profile"
                  currentPhoto={profile.profile_photo}
                  className="w-32 h-32 md:w-40 md:h-40"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-background overflow-hidden">
                  {profile.profile_photo ? (
                    <img 
                      src={profile.profile_photo} 
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 mt-4 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {profile.full_name || t('community.networking.aiEnthusiast')}
                    </h1>
                    <PremiumBadge 
                      tier={
                        (profile.role_id === 1 || profile.account_type === 'admin') 
                          ? 'gold' 
                          : profile.premium_tier
                      } 
                      size="lg" 
                    />
                    {profile.verified && (
                      <Shield className="h-6 w-6 text-blue-500" />
                    )}
                    {profile.ai_feed_top_voice && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {t('creatorProfile.badges.topVoice')}
                      </Badge>
                    )}
                  </div>
                  {profile.job_title && (
                    <p className="text-lg mt-1 text-foreground/90">
                      {profile.job_title}
                      {profile.company && ` at ${profile.company}`}
                    </p>
                  )}
                  {profile.location && (
                    <div className="flex items-center space-x-1 text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                  {!isOwnProfile && user && (
                    <>
                      <Button 
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant="outline"
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            {t('creatorProfile.actions.following')}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t('creatorProfile.actions.follow')}
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={connectionStatus === 'pending' ? withdrawConnectionRequest : sendConnectionRequest}
                        disabled={connectionStatus === 'connected'}
                        variant={connectionStatus === 'connected' ? 'outline' : connectionStatus === 'pending' ? 'outline' : 'default'}
                      >
                        {connectionStatus === 'connected' ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            {t('creatorProfile.actions.connected')}
                          </>
                        ) : connectionStatus === 'pending' ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {t('creatorProfile.actions.requestSent')}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t('creatorProfile.actions.connect')}
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            if (typeof window !== 'undefined' && (window as any).chatDock?.open) {
                              const success = await (window as any).chatDock.open(profile.id);
                              if (success) {
                                toast.success(t('creatorProfile.toast.openingChat', { name: profile.full_name }));
                              } else {
                                toast.error(t('creatorProfile.toast.chatFailed'));
                              }
                            } else {
                              toast.error(t('creatorProfile.toast.chatNotReady'));
                            }
                          } catch (error) {
                            console.error('Error opening chat:', error);
                            toast.error(t('creatorProfile.toast.chatFailed'));
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {t('creatorProfile.actions.message')}
                      </Button>
                      
                      {isSubscribed && (
                        <Button 
                          variant="outline"
                          onClick={() => setShowUnsubscribeModal(true)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Subscription
                        </Button>
                      )}
                      
                      {!isSubscribed && hasTiers && (
                        <Button 
                          onClick={() => setShowSubscribeModal(true)}
                          className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Subscribe
                        </Button>
                      )}
                    </>
                  )}
                  {isOwnProfile && (
                    <Button asChild variant="outline">
                      <Link to="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        {t('profile.editProfile')}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe Modal */}
      {showSubscribeModal && profile && (
        <SubscribeToCreatorModal
          isOpen={showSubscribeModal}
          onClose={() => setShowSubscribeModal(false)}
          creatorId={profile.id}
          creatorName={profile.full_name}
        />
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">{t('creatorProfile.sections.about')}</h2>
                {profile.bio ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">{t('creatorProfile.sections.noBio')}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">{t('creatorProfile.sections.stats')}</h2>
                <div className="space-y-4">
                  {displayStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{stat.label}</span>
                      </div>
                      <span className="font-semibold">{stat.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {(profile.contact_visible || isOwnProfile) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{t('creatorProfile.sections.contact')}</h2>
                  <div className="space-y-3">
                    {profile.website && (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-primary hover:text-primary/80"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                    {profile.github && (
                      <a 
                        href={`https://github.com/${profile.github}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {profile.linkedin && (
                      <a 
                        href={`https://linkedin.com/in/${profile.linkedin}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {profile.twitter && (
                      <a 
                        href={`https://twitter.com/${profile.twitter}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-500"
                      >
                        <Twitter className="h-4 w-4" />
                        <span>Twitter</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{t('creatorProfile.sections.interests')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {isOwnProfile ? (
              /* Owner View - Custom Tabs */
              <div className="bg-card rounded-2xl shadow-sm">
                <div className="flex border-b border-border overflow-x-auto">
                  {ownerTabs.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveOwnerTab(key)}
                      className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                        activeOwnerTab === key
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {activeOwnerTab === 'dashboard' && (
                    <div className="space-y-6">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {dashboardLoading ? (
                          Array(4).fill(0).map((_, i) => (
                            <Card key={i}>
                              <CardContent className="p-6">
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-4 w-24" />
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          [
                            { label: 'Tools Submitted', value: dashboardStats?.toolsSubmitted || 0, icon: Wrench, color: 'text-blue-500', link: '/tools' },
                            { label: 'Articles Written', value: dashboardStats?.articlesWritten || 0, icon: FileText, color: 'text-green-500', link: '/blog' },
                            { label: 'Posts Created', value: dashboardStats?.postsCreated || 0, icon: MessageSquare, color: 'text-purple-500', link: '/newsfeed' },
                            { label: 'Saved Items', value: dashboardStats?.savedItems || 0, icon: Bookmark, color: 'text-yellow-500' },
                          ].map((stat) => (
                            <Link to={stat.link || '#'} key={stat.label}>
                              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-2xl font-bold">{stat.value}</p>
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
                      <div className="grid grid-cols-3 gap-4">
                        {dashboardLoading ? (
                          Array(3).fill(0).map((_, i) => (
                            <Card key={i}>
                              <CardContent className="p-4 text-center">
                                <Skeleton className="h-6 w-12 mx-auto mb-1" />
                                <Skeleton className="h-3 w-16 mx-auto" />
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          [
                            { label: 'Total Views', value: dashboardStats?.totalViews || 0, icon: Eye, color: 'text-cyan-500' },
                            { label: 'Followers', value: dashboardStats?.followersCount || 0, icon: Users, color: 'text-pink-500' },
                            { label: 'Engagement', value: dashboardStats?.totalEngagement || 0, icon: TrendingUp, color: 'text-orange-500' },
                          ].map((stat) => (
                            <Card key={stat.label}>
                              <CardContent className="p-4 text-center">
                                <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                                <p className="text-xl font-semibold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>

                      {/* Recent Content */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Recent Tools */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Recent Tools</CardTitle>
                            <Link to="/tools" className="text-sm text-primary hover:underline flex items-center gap-1">
                              View all <ArrowRight className="h-3 w-3" />
                            </Link>
                          </CardHeader>
                          <CardContent>
                            {dashboardLoading ? (
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
                                      <p className="text-sm font-medium truncate">{tool.name}</p>
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
                            <Link to="/newsfeed" className="text-sm text-primary hover:underline flex items-center gap-1">
                              View all <ArrowRight className="h-3 w-3" />
                            </Link>
                          </CardHeader>
                          <CardContent>
                            {dashboardLoading ? (
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
                                    to={`/posts/${post.id}`}
                                    className="block p-2 rounded-lg hover:bg-muted transition-colors"
                                  >
                                    <p className="text-sm line-clamp-2">{post.content}</p>
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
                      <TodoSystem />
                    </div>
                  )}

                  {activeOwnerTab === 'experience' && (
                    <ExperienceSection />
                  )}

                  {activeOwnerTab === 'posts' && (
                    <PostsTab userId={user?.id} />
                  )}

                  {activeOwnerTab === 'tools' && (
                    <div>
                      {loadingTools ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : creatorTools.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {creatorTools.map(tool => (
                              <div
                                key={tool.id}
                                onClick={() => navigate(`/tools/${tool.id}`)}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              >
                                {tool.logo_url ? (
                                  <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 rounded-lg object-contain bg-muted" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <Wrench className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{tool.name}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{(tool.average_rating || 0).toFixed(1)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-center pt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => navigate(`/tools?creator=${profile.id}`)}
                            >
                              View All Tools
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium">{t('creatorProfile.empty.noTools')}</h3>
                          <p className="text-muted-foreground mb-4">
                            {t('creatorProfile.empty.toolsAppearOwn')}
                          </p>
                          <Button asChild>
                            <Link to="/submit-tool">Submit Your First Tool</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeOwnerTab === 'content' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('profile.content.title')}</h3>
                      {userContent.length > 0 ? (
                        <div className="space-y-4">
                          {userContent.map((content) => (
                            <div key={content.id} className="border rounded-xl p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      content.type === 'tool' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    }`}>
                                      {content.type}
                                    </span>
                                  </div>
                                  <h4 className="font-semibold mb-2">{content.title}</h4>
                                  <p className="text-muted-foreground text-sm mb-3">{content.description || content.excerpt}</p>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span>{(content.views || 0).toLocaleString()} views</span>
                                    <span>{content.likes || 0} likes</span>
                                  </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                  <button
                                    onClick={() => handlePromoteContent(content)}
                                    className="flex items-center space-x-1 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                  >
                                    <Target className="h-4 w-4" />
                                    <span>{t('profile.content.promote')}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground mb-4">
                            {t('profile.content.noContent')}
                          </p>
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button asChild>
                              <Link to="/submit-tool">Submit Tool</Link>
                            </Button>
                            <Button asChild variant="outline">
                              <Link to="/submit-article">Write Article</Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeOwnerTab === 'saved' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('profile.saved.title')}</h3>
                      {savedItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedItems.map((item: any) => (
                            <div key={item.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                                  {item.content?.type === 'tool' ? (
                                    <Zap className="h-6 w-6 text-white" />
                                  ) : item.content?.type === 'job' ? (
                                    <Briefcase className="h-6 w-6 text-white" />
                                  ) : (
                                    <FileText className="h-6 w-6 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{item.content?.title}</h4>
                                    <button 
                                      onClick={async () => {
                                        await supabase.from('saved_items').delete().eq('id', item.id);
                                        setSavedItems(savedItems.filter((i: any) => i.id !== item.id));
                                      }}
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <Bookmark className="h-4 w-4 fill-current" />
                                    </button>
                                  </div>
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                    item.content?.type === 'tool' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                    item.content?.type === 'job' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                    item.content?.type === 'article' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {item.content?.type}
                                  </span>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {item.content?.description || item.content?.excerpt || item.content?.company}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-muted-foreground">
                                      Saved {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                    <Link 
                                      to={item.content?.url || '#'} 
                                      className="text-primary text-sm hover:underline"
                                    >
                                      View
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-xl font-semibold mb-2">
                            {t('profile.saved.noSaved')}
                          </h3>
                        </div>
                      )}
                    </div>
                  )}

                  {activeOwnerTab === 'network' && (
                    <NetworkTab />
                  )}
                </div>
              </div>
            ) : (
              /* Viewer View - Standard Tabs */
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-card">
                  <TabsTrigger value="activity">{t('creatorProfile.tabs.activity')}</TabsTrigger>
                  <TabsTrigger value="tools">{t('creatorProfile.tabs.tools')}</TabsTrigger>
                  <TabsTrigger value="articles">{t('creatorProfile.tabs.articles')}</TabsTrigger>
                  <TabsTrigger value="groups">{t('creatorProfile.tabs.groups')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="activity" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">{t('creatorProfile.empty.noActivity')}</h3>
                        <p className="text-muted-foreground">{t('creatorProfile.empty.activityAppear')}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tools" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      {loadingTools ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : creatorTools.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {creatorTools.map(tool => (
                              <div
                                key={tool.id}
                                onClick={() => navigate(`/tools/${tool.id}`)}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              >
                                {tool.logo_url ? (
                                  <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 rounded-lg object-contain bg-muted" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <Wrench className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{tool.name}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{(tool.average_rating || 0).toFixed(1)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-center pt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => navigate(`/tools?creator=${profile.id}`)}
                            >
                              View All Tools
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium">{t('creatorProfile.empty.noTools')}</h3>
                          <p className="text-muted-foreground">
                            {t('creatorProfile.empty.toolsAppear')}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="articles" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">{t('creatorProfile.empty.noArticles')}</h3>
                        <p className="text-muted-foreground">
                          {t('creatorProfile.empty.articlesAppear')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="groups" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">{t('creatorProfile.empty.noGroups')}</h3>
                        <p className="text-muted-foreground">
                          {t('creatorProfile.empty.groupsAppear')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
      
      {/* Unsubscribe Modal */}
      {profile && (
        <UnsubscribeFromCreatorModal
          isOpen={showUnsubscribeModal}
          onClose={() => {
            setShowUnsubscribeModal(false);
            checkSubscriptionStatus();
          }}
          creatorId={profile.id}
          creatorName={profile.full_name}
        />
      )}

      {/* Promote Content Modal */}
      {showPromoteModal && selectedContent && (
        <PromoteContentModal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          contentType={selectedContent.type}
          contentId={selectedContent.id}
          contentTitle={selectedContent.title}
        />
      )}
    </div>
  );
};

export default CreatorProfile;
