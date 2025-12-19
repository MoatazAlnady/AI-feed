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
  MessageCircle
} from 'lucide-react';
import ChatDock from '../components/ChatDock';
import CreateEventModal from '../components/CreateEventModal';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupDiscussions from '../components/GroupDiscussions';
import GroupChatWindow from '../components/GroupChatWindow';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useChatDock } from '../context/ChatDockContext';
import { toast } from 'sonner';

const Community: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openChatWith } = useChatDock();
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
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string; view: 'discussions' | 'chat' } | null>(null);

  // Fetch groups from database
  useEffect(() => {
    if (activeTab === 'groups') {
      fetchGroups();
    }
  }, [activeTab]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
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
          .rpc('are_users_connected', { user1_id: user.id, user2_id: creator.id });

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

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase.rpc('get_public_user_profiles', {
        search: searchTerm || null,
        limit_param: 20,
        offset_param: 0,
      });

      if (error) {
        console.error('Error fetching creators:', error);
        toast.error('Failed to load creators');
      } else {
        console.log('Fetched creators:', profiles);
        setCreators(profiles || []);
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast.error('Failed to load creators');
    } finally {
      setLoading(false);
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
      <div className="bg-card rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4 text-foreground">{t('community.discussion.title', 'Community Discussions')}</h3>
        <p className="text-muted-foreground">
          {t('community.discussion.subtitle', 'Join discussions about AI tools, share insights, and learn from the community.')}
        </p>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">{t('community.events.title')}</h3>
        <button 
          onClick={() => setShowCreateEventModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>{t('community.events.createEvent')}</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <>
            <div className="bg-card rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t('community.events.sample.tomorrow')}</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{t('community.events.sample.aiToolsShowcase')}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('community.events.sample.aiToolsShowcaseDesc')}
              </p>
              <button className="text-primary hover:underline text-sm">{t('community.events.joinEvent')} →</button>
            </div>
            
            <div className="bg-card rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t('community.events.sample.friday')}</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{t('community.events.sample.networkingMixer')}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('community.events.sample.networkingMixerDesc')}
              </p>
              <button className="text-primary hover:underline text-sm">{t('community.events.rsvp')} →</button>
            </div>
          </>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-card rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {event.date} at {event.time}
                </span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{event.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {event.description}
              </p>
              <button className="text-primary hover:underline text-sm">Join Event →</button>
            </div>
          ))
        )}
      </div>
    </div>
  );

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
              <div key={group.id} className="bg-card rounded-2xl shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Hash className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">{group.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {group.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">{group.member_count || 0} {t('community.groups.members')}</span>
                  <button 
                    onClick={() => joinGroup(group.id)}
                    className="text-primary hover:underline text-sm"
                  >
                    {t('community.groups.join', 'Join')}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedGroup({ id: group.id, name: group.name, view: 'discussions' })}
                    className="flex-1 px-3 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    {t('groups.discussions', 'Discussions')}
                  </button>
                  <button 
                    onClick={() => setSelectedGroup({ id: group.id, name: group.name, view: 'chat' })}
                    className="flex-1 px-3 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 inline mr-1" />
                    {t('groups.chat', 'Chat')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
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
                  {/* Connection status button */}
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
                  
                  {/* Always show Message button */}
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
    </div>
  );

  return (
    <div className="py-8 bg-background min-h-screen">
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
    </div>
  );
};

export default Community;