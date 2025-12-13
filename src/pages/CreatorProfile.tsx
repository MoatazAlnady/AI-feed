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
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';

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
}

const CreatorProfile: React.FC = () => {
  const { t } = useTranslation();
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

  const identifier = handleOrId || id || handle || userId;

  useEffect(() => {
    if (identifier) {
      fetchProfile(identifier);
    }
  }, [identifier]);

  useEffect(() => {
    if (user && profile) {
      checkConnectionStatus();
      checkFollowStatus();
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
          const fullProfile = {
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
            contact_visible: false
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
          <User className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('creatorProfile.notFound.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
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
          <Lock className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('creatorProfile.private.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
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
                <p className="text-sm text-gray-500">{t('creatorProfile.private.requestPending')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = user?.id === profile.id;
  const displayStats = [
    { label: t('creatorProfile.stats.toolsSubmitted'), value: profile.tools_submitted || 0, icon: Wrench },
    { label: t('creatorProfile.stats.articlesWritten'), value: profile.articles_written || 0, icon: FileText },
    { label: t('creatorProfile.stats.totalEngagement'), value: profile.total_engagement || 0, icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover & Profile Header */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary-600 to-primary-800 relative">
          {profile.cover_photo && (
            <img 
              src={profile.cover_photo} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6 pb-6">
            <div className="relative -mt-16 md:-mt-20">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
                {profile.profile_photo ? (
                  <img 
                    src={profile.profile_photo} 
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 mt-4 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      {profile.full_name || t('community.networking.aiEnthusiast')}
                    </h1>
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
                    <p className="text-gray-800 dark:text-white/90 text-lg mt-1">
                      {profile.job_title}
                      {profile.company && ` at ${profile.company}`}
                    </p>
                  )}
                  {profile.location && (
                    <div className="flex items-center space-x-1 text-gray-700 dark:text-white/80 mt-1">
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
                    </>
                  )}
                  {isOwnProfile && (
                    <Button asChild variant="outline">
                      <Link to="/profile">{t('creatorProfile.actions.editProfile')}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">{t('creatorProfile.sections.about')}</h2>
                {profile.bio ? (
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">{t('creatorProfile.sections.noBio')}</p>
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
                        <stat.icon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">{stat.label}</span>
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
                        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
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
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
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
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('creatorProfile.empty.noActivity')}</h3>
                      <p className="text-gray-500">{t('creatorProfile.empty.activityAppear')}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tools" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('creatorProfile.empty.noTools')}</h3>
                      <p className="text-gray-500">
                        {isOwnProfile ? t('creatorProfile.empty.toolsAppearOwn') : t('creatorProfile.empty.toolsAppear')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="articles" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('creatorProfile.empty.noArticles')}</h3>
                      <p className="text-gray-500">
                        {isOwnProfile ? t('creatorProfile.empty.articlesAppearOwn') : t('creatorProfile.empty.articlesAppear')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="groups" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('creatorProfile.empty.noGroups')}</h3>
                      <p className="text-gray-500">
                        {isOwnProfile ? t('creatorProfile.empty.groupsAppearOwn') : t('creatorProfile.empty.groupsAppear')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
