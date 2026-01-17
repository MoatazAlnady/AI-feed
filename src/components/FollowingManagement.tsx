import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowStatusDropdown, FollowStatus } from './FollowStatusDropdown';
import { Search, Users, Star, Bell, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import { toast } from 'sonner';

interface FollowedCreator {
  id: string;
  following_id: string;
  follow_status: FollowStatus;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    handle: string;
    profile_photo: string;
    job_title: string;
  };
}

export function FollowingManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [followedCreators, setFollowedCreators] = useState<FollowedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchFollowedCreators();
    }
  }, [user]);

  const fetchFollowedCreators = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          following_id,
          follow_status,
          created_at,
          profile:user_profiles!follows_following_id_fkey(
            id,
            full_name,
            handle,
            profile_photo,
            job_title
          )
        `)
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to handle the profile object
      const transformedData = (data || []).map(item => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
      })).filter(item => item.profile) as FollowedCreator[];

      setFollowedCreators(transformedData);
    } catch (error) {
      console.error('Error fetching followed creators:', error);
      toast.error(t('common.error', 'Failed to load followed creators'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (creatorId: string, newStatus: FollowStatus) => {
    if (newStatus === null) {
      // Remove from list if unfollowed
      setFollowedCreators(prev => prev.filter(c => c.following_id !== creatorId));
    } else {
      // Update status in list
      setFollowedCreators(prev =>
        prev.map(c =>
          c.following_id === creatorId ? { ...c, follow_status: newStatus } : c
        )
      );
    }
  };

  // Filter creators based on search and status filter
  const filteredCreators = followedCreators.filter(creator => {
    const matchesSearch =
      !searchQuery ||
      creator.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.profile?.handle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' || creator.follow_status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: followedCreators.length,
    favorite: followedCreators.filter(c => c.follow_status === 'favorite').length,
    notify: followedCreators.filter(c => c.follow_status === 'notify').length,
    following: followedCreators.filter(c => c.follow_status === 'following').length,
    normal: followedCreators.filter(c => c.follow_status === 'normal').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('following.searchPlaceholder', 'Search creators...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="gap-1">
            <Users className="h-4 w-4" />
            {t('following.all', 'All')} ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="favorite" className="gap-1">
            <Star className="h-4 w-4" />
            {t('following.favorites', 'Favorites')} ({statusCounts.favorite})
          </TabsTrigger>
          <TabsTrigger value="notify" className="gap-1">
            <Bell className="h-4 w-4" />
            {t('following.notify', 'Notify')} ({statusCounts.notify})
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-1">
            <UserCheck className="h-4 w-4" />
            {t('following.following', 'Following')} ({statusCounts.following})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {filteredCreators.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery
                    ? t('following.noResults', 'No creators found')
                    : t('following.noFollowing', "You're not following anyone yet")}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? t('following.tryDifferentSearch', 'Try a different search term')
                    : t('following.startFollowing', 'Start following creators to see them here')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCreators.map(creator => (
                <Card key={creator.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Link to={getCreatorProfileLink(creator.profile)}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={creator.profile?.profile_photo} />
                          <AvatarFallback>
                            {creator.profile?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={getCreatorProfileLink(creator.profile)}
                          className="font-medium hover:text-primary truncate block"
                        >
                          {creator.profile?.full_name || 'Unknown User'}
                        </Link>
                        {creator.profile?.handle && (
                          <p className="text-sm text-muted-foreground truncate">
                            @{creator.profile.handle}
                          </p>
                        )}
                        {creator.profile?.job_title && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {creator.profile.job_title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {creator.follow_status === 'favorite' && (
                          <Star className="h-3 w-3 mr-1 text-amber-500" />
                        )}
                        {creator.follow_status === 'notify' && (
                          <Bell className="h-3 w-3 mr-1 text-yellow-600" />
                        )}
                        {creator.follow_status}
                      </Badge>
                      <FollowStatusDropdown
                        userId={creator.following_id}
                        currentStatus={creator.follow_status}
                        onStatusChange={newStatus =>
                          handleStatusChange(creator.following_id, newStatus)
                        }
                        size="sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
