import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useChatDock } from '../context/ChatDockContext';
import { toast } from 'sonner';

const Community: React.FC = () => {
  const { user } = useAuth();
  const { openChatWith } = useChatDock(); // Move hook to component level
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'networking' | 'feed' | 'events' | 'groups'>('networking');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStates, setConnectionStates] = useState<{[key: string]: {isConnected: boolean, hasPendingRequest: boolean}}>({});
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

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
        toast.error('Monthly connection request limit reached (50). Upgrade to premium for unlimited requests.');
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

      toast.success('Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const handleMessage = async (userId: string, userName: string) => {
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    try {
      await openChatWith(userId, { createIfMissing: true });
      // Removed the notification toast - chat opening should be silent
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Failed to open chat');
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

  const renderFeed = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Community Feed</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect with other creators, share insights, and discover new opportunities.
        </p>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Community Events</h3>
        <button 
          onClick={() => setShowCreateEventModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="text-sm text-gray-500 dark:text-gray-500">Tomorrow, 2:00 PM</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Tools Showcase</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Discover the latest AI tools and their real-world applications.
              </p>
              <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Event →</button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="text-sm text-gray-500 dark:text-gray-500">Friday, 5:00 PM</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Networking Mixer</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Connect with fellow AI enthusiasts and industry professionals.
              </p>
              <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">RSVP →</button>
            </div>
          </>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  {event.date} at {event.time}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {event.description}
              </p>
              <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Event →</button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Discussion Groups</h3>
        <button 
          onClick={() => setShowCreateGroupModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Create Group</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="font-semibold text-gray-900 dark:text-white">Machine Learning</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Discuss ML algorithms, techniques, and latest research.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-500">2.4k members</span>
                <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Discussion →</button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="font-semibold text-gray-900 dark:text-white">AI Tools</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Share and discover new AI tools and platforms.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-500">5.1k members</span>
                <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Discussion →</button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="font-semibold text-gray-900 dark:text-white">Startups & AI</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Connect with AI startup founders and innovators.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-500">1.8k members</span>
                <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Discussion →</button>
              </div>
            </div>
          </>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="font-semibold text-gray-900 dark:text-white">{group.name}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {group.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-500">{group.members} members</span>
                <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Discussion →</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderNetworking = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Find Creators</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredCreators.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-500">
            {searchTerm ? 'No creators found matching your search.' : 'No creators available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <div key={creator.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
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
                      className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => navigate(`/profile/${creator.id}`)}
                    >
                      {creator.full_name || 'Anonymous User'}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {creator.job_title || 'AI Enthusiast'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {creator.bio || 'Passionate about AI and technology.'}
              </p>
              {user?.id !== creator.id && (
                <div className="mt-6 flex w-full items-center justify-center gap-3">
                  {/* Connection status button */}
                  {connectionStates[creator.id]?.isConnected ? (
                    <div className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm font-medium">
                      <UserCheck className="h-4 w-4" />
                      <span>Connected</span>
                    </div>
                  ) : connectionStates[creator.id]?.hasPendingRequest ? (
                    <button 
                      disabled
                      className="px-3 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-200"
                    >
                      <UserCheck className="h-4 w-4 inline mr-1" />
                      Request Sent
                    </button>
                  ) : (
                    <button 
                      onClick={() => sendConnectionRequest(creator.id, creator.full_name)}
                      className="px-3 py-2 border rounded-lg text-sm font-medium transition-colors bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <UserPlus className="h-4 w-4 inline mr-1" />
                      Connect
                    </button>
                  )}
                  
                  {/* Always show Message button */}
                  <button 
                    onClick={() => handleMessage(creator.id, creator.full_name)}
                    className="px-3 py-2 border rounded-lg text-sm font-medium transition-colors bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <MessageCircle className="h-4 w-4 inline mr-1" />
                    Message
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
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Feed Community
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Connect with like-minded AI enthusiasts, share knowledge, and build the future together.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <Users className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Active Members</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <MessageSquare className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Discussions</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <Lightbulb className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Shared Projects</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">95%</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Success Rate</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-0 px-6">
              {[
                { id: 'networking', label: 'Networking', icon: Users },
                { id: 'feed', label: 'Feed', icon: MessageSquare },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'groups', label: 'Groups', icon: Hash }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center space-x-2 py-4 px-6 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-gray-700 rounded-t-xl border-b-2 border-primary-600 dark:border-primary-400'
                        : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-xl'
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
          {activeTab === 'feed' && renderFeed()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'groups' && renderGroups()}
          {activeTab === 'networking' && renderNetworking()}
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