import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  Users, 
  Lightbulb, 
  TrendingUp, 
  Star, 
  Calendar, 
  Plus, 
  Search, 
  Hash,
  UserPlus,
  UserCheck,
  MessageCircle,
  MapPin,
  Clock,
  Check,
  Pin,
  Lock,
  Globe,
  DollarSign,
  Video,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ChatDock from '../components/ChatDock';
import SEOHead from '../components/SEOHead';
import CreateEventModal from '../components/CreateEventModal';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupDiscussions from '../components/GroupDiscussions';
import GroupChatWindow from '../components/GroupChatWindow';
import InviteToEventModal from '../components/InviteToEventModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useChatDock } from '../context/ChatDockContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Community: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openChatWith } = useChatDock();
  const { isPremium, premiumTier } = usePremiumStatus();
  const isGold = premiumTier === 'gold';
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'networking' | 'discussion' | 'events' | 'groups'>('networking');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStates, setConnectionStates] = useState<{[key: string]: {isConnected: boolean, hasPendingRequest: boolean}}>({});
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [publicGroupDiscussions, setPublicGroupDiscussions] = useState<any[]>([]);
  const [userAttendance, setUserAttendance] = useState<{[key: string]: string}>({});
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string; view: 'discussions' | 'chat' } | null>(null);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [userGroupMemberships, setUserGroupMemberships] = useState<string[]>([]);
  const [mutualConnections, setMutualConnections] = useState<Record<string, number>>({});
  const [inviteEventModal, setInviteEventModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventType: 'group_event' | 'standalone_event';
    groupId?: string;
    isPublic: boolean;
    eventTitle?: string;
  } | null>(null);

  // Pagination constants
  const ITEMS_PER_PAGE = 20;

  // Events pagination
  const [eventsPage, setEventsPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);

  // Groups pagination
  const [groupsPage, setGroupsPage] = useState(0);
  const [hasMoreGroups, setHasMoreGroups] = useState(true);
  const [loadingMoreGroups, setLoadingMoreGroups] = useState(false);

  // Discussions pagination
  const [discussionsPage, setDiscussionsPage] = useState(0);
  const [hasMoreDiscussions, setHasMoreDiscussions] = useState(true);
  const [loadingMoreDiscussions, setLoadingMoreDiscussions] = useState(false);

  // Creators pagination
  const [creatorsPage, setCreatorsPage] = useState(0);
  const [hasMoreCreators, setHasMoreCreators] = useState(true);
  const [loadingMoreCreators, setLoadingMoreCreators] = useState(false);

  // Fetch events from database
  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    }
  }, [activeTab]);

  // Fetch discussions from database
  useEffect(() => {
    if (activeTab === 'discussion') {
      fetchDiscussions();
    }
  }, [activeTab]);

  const fetchEvents = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMoreEvents(true);
    }
    
    try {
      const page = loadMore ? eventsPage + 1 : 0;
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Fetch all events from unified events table
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .range(from, to);

      if (eventsError) throw eventsError;

      // Check if there's more data
      const hasMore = (eventsData?.length === ITEMS_PER_PAGE);
      setHasMoreEvents(hasMore);
      
      if (loadMore) {
        setEvents(prev => [...prev, ...(eventsData || [])]);
        setEventsPage(page);
      } else {
        setEvents(eventsData || []);
        setEventsPage(0);
      }
      
      // Fetch user attendance if logged in
      if (user) {
        const allEventIds = (eventsData || []).map(e => e.id);
        
        if (allEventIds.length > 0) {
          const { data: attendanceData } = await supabase
            .from('event_attendees')
            .select('event_id, status')
            .eq('user_id', user.id)
            .in('event_id', allEventIds);
          
          const attendanceMap: {[key: string]: string} = {};
          attendanceData?.forEach(a => {
            attendanceMap[a.event_id] = a.status;
          });
          setUserAttendance(prev => loadMore ? { ...prev, ...attendanceMap } : attendanceMap);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingMoreEvents(false);
    }
  };

  const fetchDiscussions = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMoreDiscussions(true);
    }
    
    try {
      const page = loadMore ? discussionsPage + 1 : 0;
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // 1. Fetch community discussions
      const { data: communityData, error } = await supabase
        .from('community_discussions')
        .select(`
          *,
          author:user_profiles(id, full_name, profile_photo)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // 2. Fetch public group discussions
      const { data: publicData } = await supabase
        .from('group_discussions')
        .select(`
          *,
          group:groups(id, name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Check if there's more data
      const hasMore = (communityData?.length === ITEMS_PER_PAGE) || 
                      (publicData?.length === ITEMS_PER_PAGE);
      setHasMoreDiscussions(hasMore);

      // Optimized: Batch fetch author info for public discussions instead of N+1
      const authorIds = [...new Set((publicData || []).map(d => d.author_id))];
      let authorMap = new Map();
      
      if (authorIds.length > 0) {
        const { data: authors } = await supabase
          .from('user_profiles')
          .select('id, full_name, profile_photo')
          .in('id', authorIds);
        
        authorMap = new Map(authors?.map(a => [a.id, a]) || []);
      }

      const publicWithAuthors = (publicData || []).map(d => ({
        ...d,
        author: authorMap.get(d.author_id) || null
      }));

      if (loadMore) {
        setDiscussions(prev => [...prev, ...(communityData || [])]);
        setPublicGroupDiscussions(prev => [...prev, ...publicWithAuthors]);
        setDiscussionsPage(page);
      } else {
        setDiscussions(communityData || []);
        setPublicGroupDiscussions(publicWithAuthors);
        setDiscussionsPage(0);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoadingMoreDiscussions(false);
    }
  };

  const handleRSVP = async (eventId: string, status: 'attending' | 'not_attending' | 'maybe' | 'undecided') => {
    if (!user) {
      toast.error(t('community.networking.pleaseLogIn'));
      return;
    }

    try {
      const currentStatus = userAttendance[eventId];
      
      if (status === 'undecided') {
        // Remove attendance
        await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        setUserAttendance(prev => {
          const newState = { ...prev };
          delete newState[eventId];
          return newState;
        });
        toast.success(t('communityEvents.rsvpRemoved', 'RSVP removed'));
      } else if (currentStatus) {
        // Update existing attendance
        await supabase
          .from('event_attendees')
          .update({ status })
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        setUserAttendance(prev => ({ ...prev, [eventId]: status }));
        toast.success(t('communityEvents.rsvpUpdated', 'RSVP updated'));
      } else {
        // Create new attendance
        await supabase
          .from('event_attendees')
          .insert({ event_id: eventId, user_id: user.id, status });
        
        setUserAttendance(prev => ({ ...prev, [eventId]: status }));
        toast.success(t('communityEvents.rsvpUpdated', 'RSVP updated'));
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP');
    }
  };

  const createDiscussion = async () => {
    if (!user) {
      toast.error(t('community.networking.pleaseLogIn'));
      return;
    }

    if (!newDiscussionTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_discussions')
        .insert({
          author_id: user.id,
          title: newDiscussionTitle.trim(),
          content: newDiscussionContent.trim() || null
        });

      if (error) throw error;
      
      toast.success('Discussion created!');
      setNewDiscussionTitle('');
      setNewDiscussionContent('');
      setShowNewDiscussion(false);
      fetchDiscussions();
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Failed to create discussion');
    }
  };

  // Fetch groups from database
  useEffect(() => {
    if (activeTab === 'groups') {
      fetchGroups();
    }
  }, [activeTab]);

  const fetchGroups = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMoreGroups(true);
    }
    
    try {
      const page = loadMore ? groupsPage + 1 : 0;
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      // Check if there's more data
      setHasMoreGroups((data?.length || 0) === ITEMS_PER_PAGE);
      
      // If logged in, fetch user's group memberships
      let memberships: string[] = userGroupMemberships;
      if (user && !loadMore) {
        const { data: membershipData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);
        
        memberships = membershipData?.map(m => m.group_id) || [];
        setUserGroupMemberships(memberships);
      }

      // Filter out private groups user is not a member of
      const visibleGroups = (data || []).filter(group => {
        if (!group.is_private) return true; // Public groups visible to all
        if (!user) return false; // Private groups hidden from non-logged-in users
        return memberships.includes(group.id); // Private groups visible to members
      });

      if (loadMore) {
        setGroups(prev => [...prev, ...visibleGroups]);
        setGroupsPage(page);
      } else {
        setGroups(visibleGroups);
        setGroupsPage(0);
      }

      // Optimized: Fetch mutual connections in batch instead of N+1
      if (user && visibleGroups.length > 0) {
        const groupIds = visibleGroups.map(g => g.id);
        
        // Get user's connections first (single query)
        const { data: connections } = await supabase
          .from('connections')
          .select('user_1_id, user_2_id')
          .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);
        
        const connectedUserIds = (connections || []).map(c => 
          c.user_1_id === user.id ? c.user_2_id : c.user_1_id
        );

        if (connectedUserIds.length > 0) {
          // Single query to get all group members for all groups
          const { data: allMembers } = await supabase
            .from('group_members')
            .select('group_id, user_id')
            .in('group_id', groupIds)
            .eq('status', 'active')
            .neq('user_id', user.id);

          // Calculate mutuals in memory
          const mutuals: Record<string, number> = {};
          groupIds.forEach(gid => { mutuals[gid] = 0; });
          
          (allMembers || []).forEach(member => {
            if (connectedUserIds.includes(member.user_id)) {
              mutuals[member.group_id] = (mutuals[member.group_id] || 0) + 1;
            }
          });
          
          setMutualConnections(prev => loadMore ? { ...prev, ...mutuals } : mutuals);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingMoreGroups(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) {
      toast.error(t('community.networking.pleaseLogIn'));
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id, role: 'member' });

      if (error) {
        if (error.code === '23505') {
          toast.info(t('groups.alreadyMember', 'You are already a member of this group'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('groups.joined', 'Joined group successfully!'));
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    }
  };

  useEffect(() => {
    if (activeTab === 'networking') {
      fetchCreators();
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    // Listen for header create events
    const handleCreateEvent = () => setShowCreateEventModal(true);
    const handleCreateGroup = () => setShowCreateGroupModal(true);
    
    // Listen for connection request processing events to refresh connection states
    const handleConnectionRequestProcessed = () => {
      if (activeTab === 'networking' && creators.length > 0 && user) {
        checkConnectionStates();
      }
    };

    window.addEventListener('openCreateEventModal', handleCreateEvent);
    window.addEventListener('openCreateGroupModal', handleCreateGroup);
    window.addEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);

    return () => {
      window.removeEventListener('openCreateEventModal', handleCreateEvent);
      window.removeEventListener('openCreateGroupModal', handleCreateGroup);
      window.removeEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);
    };
  }, [activeTab, creators, user, navigate]);

  useEffect(() => {
    if (creators.length > 0 && user) {
      checkConnectionStates();
    }
  }, [creators, user]);

  const checkConnectionStates = async () => {
    if (!user) return;

    const states: {[key: string]: {isConnected: boolean, hasPendingRequest: boolean}} = {};
    
    for (const creator of creators) {
      if (creator.id === user.id) continue;

      try {
        // Check if connected
        const { data: connectionData } = await supabase
          .rpc('are_users_connected', { user_a: user.id, user_b: creator.id });

        // Check for pending request
        const { data: requestData } = await supabase
          .from('connection_requests')
          .select('id')
          .eq('requester_id', user.id)
          .eq('recipient_id', creator.id)
          .eq('status', 'pending')
          .maybeSingle();

        states[creator.id] = {
          isConnected: connectionData || false,
          hasPendingRequest: !!requestData
        };
      } catch (error) {
        console.error('Error checking connection status:', error);
        states[creator.id] = { isConnected: false, hasPendingRequest: false };
      }
    }

    setConnectionStates(states);
  };

  const sendConnectionRequest = async (creatorId: string, creatorName: string) => {
    if (!user) return;

    try {
      // Check usage limits
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('connection_requests_sent')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .maybeSingle();

      const currentRequests = usageData?.connection_requests_sent || 0;
      if (currentRequests >= 50) {
        toast.error(t('community.networking.connectionLimitReached'));
        return;
      }

      // Send connection request
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          recipient_id: creatorId,
          message: `Hi ${creatorName}, I'd like to connect with you!`
        });

      if (error) throw error;

      // Update usage
      await supabase
        .from('user_usage')
        .upsert({
          user_id: user.id,
          month_year: currentMonth,
          connection_requests_sent: currentRequests + 1
        });

      // Update local state
      setConnectionStates(prev => ({
        ...prev,
        [creatorId]: { ...prev[creatorId], hasPendingRequest: true }
      }));

      toast.success(t('community.networking.connectionRequestSent'));
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const handleMessage = async (userId: string, userName: string) => {
    if (!user) {
      toast.error(t('community.networking.pleaseLogIn'));
      return;
    }

    const success = await openChatWith(userId, { createIfMissing: true });
    if (!success) {
      toast.error(t('community.networking.failedToOpenChat'));
    }
  };

  const getProfileLink = (creator: any) => {
    // Use handle if available, otherwise fallback to ID
    if (creator.handle) {
      return `/creator/${creator.handle}`;
    }
    return `/creator/${creator.id}`;
  };

  const fetchCreators = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMoreCreators(true);
    } else {
      setLoading(true);
    }
    
    try {
      const page = loadMore ? creatorsPage + 1 : 0;
      const offset = page * ITEMS_PER_PAGE;

      const { data: profiles, error } = await supabase.rpc('get_public_user_profiles', {
        search: searchTerm || null,
        limit_param: ITEMS_PER_PAGE,
        offset_param: offset,
      });

      if (error) {
        console.error('Error fetching creators:', error);
        toast.error('Failed to load creators');
      } else {
        // Check if there's more data
        setHasMoreCreators((profiles?.length || 0) === ITEMS_PER_PAGE);
        
        if (loadMore) {
          setCreators(prev => [...prev, ...(profiles || [])]);
          setCreatorsPage(page);
        } else {
          setCreators(profiles || []);
          setCreatorsPage(0);
        }
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast.error('Failed to load creators');
    } finally {
      setLoading(false);
      setLoadingMoreCreators(false);
    }
  };

  const filteredCreators = creators.filter(creator => {
    // Hide current user from networking tab
    if (user?.id === creator.id) return false;
    
    if (!searchTerm) return true;
    return creator.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           creator.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           creator.bio?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderDiscussion = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">{t('communityDiscussions.title', 'Community Discussions')}</h3>
        <button 
          onClick={() => setShowNewDiscussion(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>{t('communityDiscussions.startDiscussion', 'Start Discussion')}</span>
        </button>
      </div>

      {showNewDiscussion && (
        <div className="bg-card rounded-2xl shadow-sm p-6">
          <input
            type="text"
            placeholder={t('communityDiscussions.titlePlaceholder', 'Discussion title...')}
            value={newDiscussionTitle}
            onChange={(e) => setNewDiscussionTitle(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground mb-3"
          />
          <textarea
            placeholder={t('communityDiscussions.contentPlaceholder', 'Share your thoughts... (optional)')}
            value={newDiscussionContent}
            onChange={(e) => setNewDiscussionContent(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground mb-3 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={createDiscussion}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              {t('common.submit', 'Submit')}
            </button>
            <button
              onClick={() => setShowNewDiscussion(false)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {discussions.length === 0 && publicGroupDiscussions.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-sm p-6 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('communityDiscussions.noDiscussions', 'No discussions yet. Be the first to start one!')}</p>
          </div>
        ) : (
          <>
            {/* Community Discussions */}
            {discussions.map((discussion) => (
              <div key={`community-${discussion.id}`} className="bg-card rounded-2xl shadow-sm p-6">
                <div className="flex items-start gap-3">
                  {discussion.author?.profile_photo ? (
                    <img src={discussion.author.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {(discussion.author?.full_name || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {discussion.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                      <h4 className="font-semibold text-foreground">{discussion.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {discussion.author?.full_name} • {format(new Date(discussion.created_at), 'MMM d, yyyy')}
                    </p>
                    {discussion.content && (
                      <p className="text-muted-foreground line-clamp-2">{discussion.content}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {discussion.reply_count || 0} {t('communityDiscussions.replies', 'replies')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Public Group Discussions */}
            {publicGroupDiscussions.map((discussion) => (
              <div 
                key={`group-${discussion.id}`} 
                className="bg-card rounded-2xl shadow-sm p-6 cursor-pointer hover:border-primary/50 border border-transparent transition-colors"
                onClick={() => navigate(`/group/${discussion.group_id}`)}
              >
                <div className="flex items-start gap-3">
                  {discussion.author?.profile_photo ? (
                    <img src={discussion.author.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {(discussion.author?.full_name || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        <Hash className="h-3 w-3 mr-1" />
                        {discussion.group?.name || 'Group'}
                      </Badge>
                      {discussion.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                    </div>
                    <h4 className="font-semibold text-foreground">{discussion.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {discussion.author?.full_name} • {format(new Date(discussion.created_at), 'MMM d, yyyy')}
                    </p>
                    {discussion.content && (
                      <p className="text-muted-foreground line-clamp-2">{discussion.content}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {discussion.reply_count || 0} {t('communityDiscussions.replies', 'replies')}
                      </span>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Load More Discussions Button */}
      {hasMoreDiscussions && (discussions.length > 0 || publicGroupDiscussions.length > 0) && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => fetchDiscussions(true)} 
            disabled={loadingMoreDiscussions}
          >
            {loadingMoreDiscussions ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
          </Button>
        </div>
      )}
    </div>
  );

  const renderEvents = () => {
    // All events from unified table - categorize by group_id presence
    const allEvents = events.map(e => ({ 
      ...e, 
      eventType: e.group_id ? 'group' : 'standalone', 
      dateField: e.event_date 
    })).sort((a, b) => new Date(a.dateField).getTime() - new Date(b.dateField).getTime());

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h3 className="text-xl font-semibold text-foreground">{t('community.events.title')}</h3>
          <button 
            onClick={() => setShowCreateEventModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>{t('community.events.createEvent', 'Create Event')}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allEvents.length === 0 ? (
            <div className="col-span-full bg-card rounded-2xl shadow-sm p-6 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('communityEvents.noEvents', 'No upcoming events. Create one!')}</p>
            </div>
          ) : (
            allEvents.map((event) => (
              <div 
                key={`${event.eventType}-${event.id}`} 
                className="bg-card rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (event.eventType === 'group') {
                    navigate(`/event/${event.id}`);
                  } else if (event.eventType === 'standalone') {
                    navigate(`/standalone-event/${event.id}`);
                  }
                }}
              >
                {/* Cover Image */}
                {(event.cover_image_url || event.cover_image) && (
                  <img 
                    src={event.cover_image_url || event.cover_image} 
                    alt={event.title} 
                    className="w-full h-32 object-cover" 
                  />
                )}
                
                <div className="p-5">
                  {/* Event Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    {event.eventType === 'standalone' && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                        <Star className="h-3 w-3 mr-1" />
                        Gold Event
                      </Badge>
                    )}
                    {event.eventType === 'group' && event.group && (
                      <Badge variant="secondary">
                        <Hash className="h-3 w-3 mr-1" />
                        {event.group.name}
                      </Badge>
                    )}
                    {event.is_online && (
                      <Badge variant="outline" className="gap-1">
                        <Video className="h-3 w-3" />
                        Online
                      </Badge>
                    )}
                  </div>

                  {/* Date */}
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(event.event_date || event.start_date), 'MMM d, yyyy')}
                      {event.start_time && ` • ${event.start_time}`}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-semibold text-foreground mb-2">{event.title}</h4>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Attendance Status Dropdown + Invite Button */}
                  <div className="flex gap-2 flex-wrap">
                    <Select
                      value={userAttendance[event.id] || 'undecided'}
                      onValueChange={(value) => handleRSVP(event.id, value as any)}
                    >
                      <SelectTrigger className="flex-1 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder={t('events.attendanceNotDecided', 'Not Decided')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="undecided">{t('events.attendanceNotDecided', 'Not Decided')}</SelectItem>
                        <SelectItem value="attending">{t('events.willAttend', 'Will Attend')}</SelectItem>
                        <SelectItem value="maybe">{t('events.maybeAttending', 'Maybe')}</SelectItem>
                        <SelectItem value="not_attending">{t('events.notAttending', 'Not Attending')}</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInviteEventModal({
                          isOpen: true,
                          eventId: event.id,
                          eventType: event.eventType === 'group' ? 'group_event' : 'standalone_event',
                          groupId: event.group?.id,
                          isPublic: event.is_public !== false,
                          eventTitle: event.title
                        });
                      }}
                      className="gap-1"
                    >
                      <UserPlus className="h-4 w-4" />
                      {t('events.invite', 'Invite')}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Events Button */}
        {hasMoreEvents && allEvents.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => fetchEvents(true)} 
              disabled={loadingMoreEvents}
            >
              {loadingMoreEvents ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
            </Button>
          </div>
      )}
      </div>
    );
  };

  const renderGroups = () => {
    // If a group is selected, show discussions or chat
    if (selectedGroup) {
      if (selectedGroup.view === 'discussions') {
        return (
          <GroupDiscussions
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
            onBack={() => setSelectedGroup(null)}
          />
        );
      }
      if (selectedGroup.view === 'chat') {
        return (
          <div className="h-[600px]">
            <GroupChatWindow
              groupId={selectedGroup.id}
              groupName={selectedGroup.name}
              onBack={() => setSelectedGroup(null)}
            />
          </div>
        );
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-foreground">{t('community.groups.title')}</h3>
          <button 
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>{t('community.groups.createGroup')}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 ? (
            <>
              <div className="bg-card rounded-2xl shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Hash className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">{t('community.groups.sample.machineLearning')}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('community.groups.sample.machineLearningDesc')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">2.4k {t('community.groups.members')}</span>
                  <button className="text-primary hover:underline text-sm">{t('community.groups.joinDiscussion')} →</button>
                </div>
              </div>
              
              <div className="bg-card rounded-2xl shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Hash className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">{t('community.groups.sample.aiTools')}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('community.groups.sample.aiToolsDesc')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">5.1k {t('community.groups.members')}</span>
                  <button className="text-primary hover:underline text-sm">{t('community.groups.joinDiscussion')} →</button>
                </div>
              </div>
              
              <div className="bg-card rounded-2xl shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Hash className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">{t('community.groups.sample.startupsAI')}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('community.groups.sample.startupsAIDesc')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">1.8k {t('community.groups.members')}</span>
                  <button className="text-primary hover:underline text-sm">{t('community.groups.joinDiscussion')} →</button>
                </div>
              </div>
            </>
          ) : (
            groups.map((group) => (
              <div 
                key={group.id} 
                className="bg-card rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/group/${group.id}`)}
              >
                {/* Cover Photo */}
                {(group.cover_photo || group.cover_image) && (
                  <img 
                    src={group.cover_photo || group.cover_image} 
                    alt={group.name} 
                    className="w-full h-32 object-cover" 
                  />
                )}
                
                <div className="p-5">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {group.is_private ? (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        Public
                      </Badge>
                    )}
                    {group.membership_type && group.membership_type !== 'free' ? (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                        <DollarSign className="h-3 w-3" />
                        {group.membership_price}/{group.membership_frequency || 'mo'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </div>

                  {/* Group Name */}
                  <h4 className="font-semibold text-foreground mb-2">{group.name}</h4>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {group.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group.member_count || 0} members
                    </span>
                    {mutualConnections[group.id] > 0 && (
                      <span className="text-primary">
                        {mutualConnections[group.id]} mutual
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        joinGroup(group.id);
                      }}
                    >
                      {userGroupMemberships.includes(group.id) ? 'View' : 'Join'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Groups Button */}
        {hasMoreGroups && groups.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => fetchGroups(true)} 
              disabled={loadingMoreGroups}
            >
              {loadingMoreGroups ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderNetworking = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">{t('community.networking.title')}</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('community.networking.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredCreators.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? t('community.networking.noCreatorsFound') : t('community.networking.noCreatorsYet')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <div key={creator.id} className="bg-card rounded-2xl shadow-sm p-6">
              {/* ... existing creator card content ... */}
              <div className="flex items-center space-x-3 mb-4">
                {creator.profile_photo ? (
                  <img 
                    src={creator.profile_photo} 
                    alt={creator.full_name || 'User'} 
                    className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() => navigate(getProfileLink(creator))}
                  />
                ) : (
                  <div 
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() => navigate(getProfileLink(creator))}
                  >
                    <span className="text-white font-semibold">
                      {(creator.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 
                      className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/profile/${creator.id}`)}
                    >
                    {creator.full_name || t('community.networking.anonymousUser')}
                  </h4>
                  {creator.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {creator.ai_nexus_top_voice && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {creator.job_title || t('community.networking.aiEnthusiast')}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {creator.bio || t('community.networking.defaultBio')}
            </p>
              {user?.id !== creator.id && (
                <div className="mt-6 flex w-full items-center justify-center gap-3">
                  {connectionStates[creator.id]?.isConnected ? (
                    <div className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm font-medium">
                      <UserCheck className="h-4 w-4" />
                      <span>{t('community.networking.connected')}</span>
                    </div>
                  ) : connectionStates[creator.id]?.hasPendingRequest ? (
                    <button 
                      disabled
                      className="px-3 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-card border-border text-foreground"
                    >
                      <UserCheck className="h-4 w-4 inline mr-1" />
                      {t('community.networking.requestSent')}
                    </button>
                  ) : (
                    <button 
                      onClick={() => sendConnectionRequest(creator.id, creator.full_name)}
                      className="px-3 py-2 border rounded-lg text-sm font-medium transition-colors bg-card border-border text-foreground hover:bg-muted"
                    >
                      <UserPlus className="h-4 w-4 inline mr-1" />
                      {t('community.networking.connect')}
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleMessage(creator.id, creator.full_name)}
                    className="px-3 py-2 border rounded-lg text-sm font-medium transition-colors bg-card border-border text-foreground hover:bg-muted"
                  >
                    <MessageCircle className="h-4 w-4 inline mr-1" />
                    {t('community.networking.message')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More Creators Button */}
      {hasMoreCreators && filteredCreators.length > 0 && !loading && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => fetchCreators(true)} 
            disabled={loadingMoreCreators}
          >
            {loadingMoreCreators ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <SEOHead
        title="AI Community - Connect, Discuss & Network"
        description="Join the AI Feed community. Connect with AI professionals, participate in discussions, attend events, and join groups focused on artificial intelligence and machine learning."
        keywords="AI community, AI networking, AI discussions, AI events, AI groups, machine learning community"
        url="https://aifeed.app/community"
        type="website"
      />
    <div className="py-8 min-h-screen bg-muted/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('community.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('community.feed.subtitle')}
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-card rounded-2xl shadow-sm">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">10K+</div>
            <div className="text-sm text-muted-foreground">{t('community.stats.activeCreators')}</div>
          </div>
          <div className="text-center p-6 bg-card rounded-2xl shadow-sm">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">50K+</div>
            <div className="text-sm text-muted-foreground">{t('community.stats.discussionGroups')}</div>
          </div>
          <div className="text-center p-6 bg-card rounded-2xl shadow-sm">
            <Lightbulb className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">500+</div>
            <div className="text-sm text-muted-foreground">{t('community.stats.weeklyEvents')}</div>
          </div>
          <div className="text-center p-6 bg-card rounded-2xl shadow-sm">
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">95%</div>
            <div className="text-sm text-muted-foreground">{t('community.stats.successRate')}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-card rounded-2xl shadow-sm mb-8">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-0 px-6">
              {[
                { id: 'networking', label: t('community.tabs.networking'), icon: Users },
                { id: 'events', label: t('community.tabs.events'), icon: Calendar },
                { id: 'groups', label: t('community.tabs.groups'), icon: Hash },
                { id: 'discussion', label: t('community.tabs.discussion', 'Discussion'), icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center space-x-2 py-4 px-6 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-primary bg-primary/10 rounded-t-xl border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-xl'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'networking' && renderNetworking()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'groups' && renderGroups()}
          {activeTab === 'discussion' && renderDiscussion()}
        </div>
      </div>

      {/* Chat Dock */}
      <ChatDock />

      {/* Modals */}
      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onEventCreated={(event) => {
          setEvents(prev => [event, ...prev]);
          toast.success('Event created successfully!');
        }}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={(group) => {
          setGroups(prev => [group, ...prev]);
          toast.success('Group created successfully!');
        }}
      />

      {/* Invite to Event Modal */}
      {inviteEventModal && (
        <InviteToEventModal
          isOpen={inviteEventModal.isOpen}
          onClose={() => setInviteEventModal(null)}
          eventId={inviteEventModal.eventId}
          groupId={inviteEventModal.groupId}
          isPublic={inviteEventModal.isPublic}
          eventTitle={inviteEventModal.eventTitle}
        />
      )}
    </div>
    </>
  );
};

export default Community;