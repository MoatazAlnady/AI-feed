import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Users, 
  Lock, 
  Globe, 
  Calendar, 
  MessageSquare, 
  MoreVertical,
  Settings,
  Bell,
  UserMinus,
  Flag,
  MessageCircle,
  Image,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import GroupPostsFeed from '@/components/GroupPostsFeed';
import GroupDiscussionsEnhanced from '@/components/GroupDiscussionsEnhanced';
import GroupEventsTab from '@/components/GroupEventsTab';
import GroupAdminSettingsModal from '@/components/GroupAdminSettingsModal';
import GroupMemberNotificationSettings from '@/components/GroupMemberNotificationSettings';
import GroupMembersList from '@/components/GroupMembersList';

interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_photo?: string | null;
  cover_image?: string | null;
  category?: string | null;
  is_private?: boolean;
  member_count?: number;
  join_type?: string;
  membership_type?: string;
  membership_price?: number;
  membership_currency?: string;
  membership_frequency?: string | null;
  rules?: string | null;
  welcome_message?: string | null;
  creator_id: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
}

const GroupProfile: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<GroupMember | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [mutualConnections, setMutualConnections] = useState<number>(0);

  useEffect(() => {
    if (groupId) {
      fetchGroup();
      if (user) {
        fetchMembership();
        fetchMutualConnections();
      }
    }
  }, [groupId, user]);

  const fetchGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Failed to load group');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembership = async () => {
    if (!user || !groupId) return;
    
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error) {
        setMembership(data);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
    }
  };

  const fetchMutualConnections = async () => {
    if (!user || !groupId) return;
    
    try {
      // Get group members
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (!members || members.length === 0) {
        setMutualConnections(0);
        return;
      }

      // Get user's connections
      const { data: connections } = await supabase
        .from('connections')
        .select('user_1_id, user_2_id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      if (!connections) {
        setMutualConnections(0);
        return;
      }

      const connectedUserIds = connections.map(c => 
        c.user_1_id === user.id ? c.user_2_id : c.user_1_id
      );

      const memberIds = members.map(m => m.user_id);
      const mutual = memberIds.filter(id => connectedUserIds.includes(id));
      setMutualConnections(mutual.length);
    } catch (error) {
      console.error('Error fetching mutual connections:', error);
    }
  };

  const handleJoinGroup = async () => {
    if (!user) {
      toast.error('Please log in to join groups');
      return;
    }

    if (!group) return;

    try {
      // Check if paid group
      if (group.membership_type !== 'free') {
        // TODO: Redirect to payment
        toast.info('Paid group membership coming soon');
        return;
      }

      const status = group.join_type === 'public' ? 'active' : 'pending';
      
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          status
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('You are already a member of this group');
        } else {
          throw error;
        }
      } else {
        toast.success(status === 'active' ? 'Joined group!' : 'Join request sent!');
        fetchMembership();
        fetchGroup();
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !groupId) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Left group');
      setMembership(null);
      fetchGroup();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const isOwner = membership?.role === 'owner';
  const isAdmin = membership?.role === 'admin' || isOwner;
  const isModerator = membership?.role === 'moderator' || isAdmin;
  const isMember = membership?.status === 'active';

  const getPriceDisplay = () => {
    if (!group || group.membership_type === 'free') return null;
    
    const price = group.membership_price;
    const currency = group.membership_currency || 'USD';
    const frequency = group.membership_frequency;
    
    if (group.membership_type === 'one_time') {
      return `${currency} ${price}`;
    }
    
    return `${currency} ${price}/${frequency === 'yearly' ? 'year' : 'month'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Group not found</h2>
          <Button onClick={() => navigate('/community')}>Back to Community</Button>
        </div>
      </div>
    );
  }

  const coverImage = group.cover_photo || group.cover_image || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <>
      <SEOHead
        title={`${group.name} - AI Community Group`}
        description={group.description || `Join ${group.name} on AI Feed community`}
        url={`https://aifeed.app/group/${groupId}`}
      />

      <div className="min-h-screen bg-muted/50">
        {/* Cover Photo Section */}
        <div className="relative h-48 md:h-64 lg:h-80">
          <img
            src={coverImage}
            alt={group.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/community')}
            className="absolute top-4 left-4 bg-black/30 text-white hover:bg-black/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* 3-dots Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/30 text-white hover:bg-black/50"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => setShowAdminSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    {t('groups.settings', 'Group Settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowMembersList(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    {t('groups.manageMembers', 'Manage Members')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {isMember && (
                <>
                  <DropdownMenuItem onClick={() => setShowNotificationSettings(true)}>
                    <Bell className="h-4 w-4 mr-2" />
                    {t('groups.notifications', 'Notification Settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/messages?group=${groupId}`)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t('groups.openChat', 'Open Group Chat')}
                  </DropdownMenuItem>
                  {!isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLeaveGroup}
                        className="text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        {t('groups.leave', 'Leave Group')}
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Flag className="h-4 w-4 mr-2" />
                {t('common.report', 'Report Group')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Group Info Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-card rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {group.name}
                  </h1>
                  {group.is_private ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Public
                    </Badge>
                  )}
                </div>

                {group.category && (
                  <Badge variant="outline" className="mb-3">
                    {group.category}
                  </Badge>
                )}

                {group.description && (
                  <p className="text-muted-foreground mb-4">
                    {group.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {group.member_count || 0} members
                  </span>
                  {mutualConnections > 0 && (
                    <span className="text-primary">
                      {mutualConnections} mutual connections
                    </span>
                  )}
                  {getPriceDisplay() && (
                    <Badge className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500">
                      <DollarSign className="h-3 w-3" />
                      {getPriceDisplay()}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!isMember ? (
                  <Button onClick={handleJoinGroup} className="gap-2">
                    <Users className="h-4 w-4" />
                    {group.join_type === 'public' ? 'Join Group' : 'Request to Join'}
                  </Button>
                ) : membership?.status === 'pending' ? (
                  <Button disabled variant="secondary">
                    Request Pending
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Tabs for Posts, Discussions, Events */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                {t('groups.posts', 'Posts')}
              </TabsTrigger>
              <TabsTrigger value="discussions" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('groups.discussions', 'Discussions')}
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('groups.events', 'Events')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
              <GroupPostsFeed 
                groupId={groupId!} 
                isMember={isMember}
                canPost={isMember}
              />
            </TabsContent>

            <TabsContent value="discussions">
              <GroupDiscussionsEnhanced 
                groupId={groupId!}
                groupName={group.name}
                isMember={isMember}
                canDiscuss={isMember}
              />
            </TabsContent>

            <TabsContent value="events">
              <GroupEventsTab 
                groupId={groupId!}
                groupName={group.name}
                isAdmin={isAdmin}
                isMember={isMember}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {showAdminSettings && group && (
        <GroupAdminSettingsModal
          isOpen={showAdminSettings}
          onClose={() => setShowAdminSettings(false)}
          group={group}
          onUpdate={fetchGroup}
        />
      )}

      {showNotificationSettings && (
        <GroupMemberNotificationSettings
          isOpen={showNotificationSettings}
          onClose={() => setShowNotificationSettings(false)}
          groupId={groupId!}
        />
      )}

      {showMembersList && (
        <GroupMembersList
          isOpen={showMembersList}
          onClose={() => setShowMembersList(false)}
          groupId={groupId!}
          groupName={group.name}
          isAdmin={isAdmin}
          isOwner={isOwner}
        />
      )}
    </>
  );
};

export default GroupProfile;
