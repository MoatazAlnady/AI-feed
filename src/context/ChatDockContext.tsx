import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setGlobalChatController } from '../components/ChatController';

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  online: boolean;
  conversationId?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
}

interface Thread {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
    online: boolean;
  }[];
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  isFocused: boolean;
}

interface Message {
  id: string;
  threadId: string;
  content: string;
  senderId: string;
  timestamp: string;
  read: boolean;
}

interface ChatDockContextType {
  isOpen: boolean;
  toggleOpen: () => void;
  minimized: boolean;
  toggleMinimized: () => void;
  threads: Thread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  messages: Message[];
  sendMessage: (threadId: string, content: string) => Promise<void>;
  loadMoreMessages: (threadId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredThreads: Thread[];
  unreadCount: number;
  activeTab: 'focused' | 'other';
  setActiveTab: (tab: 'focused' | 'other') => void;
  loading: boolean;
  openChatWith: (userId: string, opts?: { createIfMissing?: boolean }) => Promise<boolean>;
  connections: Connection[];
  onlineUsers: Set<string>;
  refreshConnections: () => Promise<void>;
}

const ChatDockContext = createContext<ChatDockContextType | undefined>(undefined);

export const useChatDock = () => {
  const context = useContext(ChatDockContext);
  if (context === undefined) {
    throw new Error('useChatDock must be used within a ChatDockProvider');
  }
  return context;
};

export const ChatDockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'focused' | 'other'>('focused');
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Fetch connections with their chat history
  const fetchConnections = useCallback(async () => {
    if (!user) return;
    
    try {
      // First, get all connections for this user
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('id, user_1_id, user_2_id, created_at')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        return;
      }

      if (!connectionsData || connectionsData.length === 0) {
        setConnections([]);
        return;
      }

      // Get the other user IDs from connections
      const otherUserIds = connectionsData.map(conn => 
        conn.user_1_id === user.id ? conn.user_2_id : conn.user_1_id
      );

      // Fetch profiles for connected users
      const { data: profilesData } = await supabase.rpc('get_public_profiles_by_ids', {
        ids: otherUserIds
      });

      const profileMap = new Map();
      if (Array.isArray(profilesData)) {
        profilesData.forEach((profile: any) => {
          profileMap.set(profile.id, profile);
        });
      }

      // Fetch conversations for these users
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id, participant_1_id, participant_2_id, last_message_at')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

      // Create a map of other user ID -> conversation
      const conversationMap = new Map();
      if (conversationsData) {
        conversationsData.forEach(conv => {
          const otherUserId = conv.participant_1_id === user.id 
            ? conv.participant_2_id 
            : conv.participant_1_id;
          conversationMap.set(otherUserId, conv);
        });
      }

      // Get conversation IDs to fetch last messages
      const conversationIds = conversationsData?.map(c => c.id) || [];
      
      // Fetch last messages for each conversation
      const lastMessagesMap = new Map();
      const unreadCountMap = new Map();
      
      if (conversationIds.length > 0) {
        // Get the most recent message for each conversation
        for (const convId of conversationIds) {
          const { data: lastMsgData } = await supabase
            .from('conversation_messages')
            .select('id, body, sender_id, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (lastMsgData && lastMsgData.length > 0) {
            lastMessagesMap.set(convId, lastMsgData[0]);
          }

          // Get unread count (messages from other users that are not read)
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .eq('recipient_id', user.id)
            .is('read_at', null);

          unreadCountMap.set(convId, count || 0);
        }
      }

      // Build connections list with chat data
      const connectionsList: Connection[] = otherUserIds.map(otherUserId => {
        const profile = profileMap.get(otherUserId);
        const conversation = conversationMap.get(otherUserId);
        const lastMessage = conversation ? lastMessagesMap.get(conversation.id) : null;
        const unreadCount = conversation ? unreadCountMap.get(conversation.id) || 0 : 0;

        return {
          id: otherUserId,
          name: profile?.full_name || 'Unknown User',
          avatar: profile?.profile_photo,
          title: profile?.job_title || '',
          online: onlineUsers.has(otherUserId),
          conversationId: conversation?.id,
          lastMessage: lastMessage ? {
            content: lastMessage.body,
            timestamp: lastMessage.created_at,
            senderId: lastMessage.sender_id
          } : undefined,
          unreadCount
        };
      });

      // Sort: unread first, then by last message time, then alphabetically
      connectionsList.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        if (a.lastMessage && b.lastMessage) {
          return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
        }
        if (a.lastMessage && !b.lastMessage) return -1;
        if (!a.lastMessage && b.lastMessage) return 1;
        return a.name.localeCompare(b.name);
      });

      setConnections(connectionsList);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  }, [user, onlineUsers]);

  // Set up Supabase Presence for online status
  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineUserIds = new Set<string>();
        Object.keys(state).forEach(userId => {
          onlineUserIds.add(userId);
        });
        setOnlineUsers(onlineUserIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  // Update connections when online status changes
  useEffect(() => {
    setConnections(prev => prev.map(conn => ({
      ...conn,
      online: onlineUsers.has(conn.id)
    })));
  }, [onlineUsers]);

  // Check URL params for deep-linking
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const withUserId = urlParams.get('with');
    
    if (withUserId && user) {
      openChatWith(withUserId, { createIfMissing: true })
        .catch(error => {
          console.error('Error opening chat from URL:', error);
          toast.error('Failed to open chat');
        });
    }
  }, [user]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('chatDockState');
      if (savedState) {
        const { isOpen: savedIsOpen, minimized: savedMinimized } = JSON.parse(savedState);
        setIsOpen(savedIsOpen);
        setMinimized(savedMinimized);
      }
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatDockState', JSON.stringify({ isOpen, minimized }));
    }
  }, [isOpen, minimized]);

  // Fetch threads and connections when user changes
  useEffect(() => {
    if (user) {
      fetchThreads();
      fetchConnections();
      
      // Set up realtime subscription for new messages
      const channel = supabase
        .channel(`user:${user.id}:messages`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        }, (payload) => {
          const newMessage = payload.new as any;
          
          if (newMessage.thread_id === activeThreadId) {
            setMessages(prev => [...prev, {
              id: newMessage.id,
              threadId: newMessage.thread_id,
              content: newMessage.content,
              senderId: newMessage.sender_id,
              timestamp: newMessage.created_at,
              read: false
            }]);
          }
          
          setThreads(prev => prev.map(thread => {
            if (thread.id === newMessage.thread_id) {
              return {
                ...thread,
                lastMessage: {
                  content: newMessage.content,
                  timestamp: newMessage.created_at,
                  senderId: newMessage.sender_id
                },
                unreadCount: thread.unreadCount + 1
              };
            }
            return thread;
          }));

          // Refresh connections to update last message
          fetchConnections();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeThreadId, fetchConnections]);

  // Fetch messages when active thread changes
  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
      markThreadAsRead(activeThreadId);
    }
  }, [activeThreadId]);

  const fetchThreads = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, participant_1_id, participant_2_id')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

      if (conversations && conversations.length > 0) {
        const otherUserIds = conversations.map(conv => 
          conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
        ).filter(Boolean);
        
        const uniqueUserIds = [...new Set(otherUserIds)];

        const { data: profilesData } = await supabase.rpc('get_public_profiles_by_ids', {
          ids: uniqueUserIds
        });

        const profileMap = new Map();
        if (Array.isArray(profilesData)) {
          profilesData.forEach((profile: any) => {
            profileMap.set(profile.id, profile);
          });
        }

        const realThreads: Thread[] = conversations.map(conv => {
          const otherUserId = conv.participant_1_id === user.id 
            ? conv.participant_2_id 
            : conv.participant_1_id;
          const profile = profileMap.get(otherUserId);

          return {
            id: conv.id,
            participants: [{
              id: otherUserId || '',
              name: profile?.full_name || 'Deleted User',
              avatar: profile?.profile_photo,
              title: profile?.job_title || '',
              online: onlineUsers.has(otherUserId || '')
            }],
            lastMessage: {
              content: 'No messages yet',
              timestamp: new Date().toISOString(),
              senderId: ''
            },
            unreadCount: 0,
            isFocused: true
          };
        });

        setThreads(realThreads);
      } else {
        setThreads([]);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: messagesData } = await supabase
        .from('conversation_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          body,
          created_at
        `)
        .eq('conversation_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
        const { data: profilesData } = await supabase.rpc('get_public_profiles_by_ids', {
          ids: senderIds
        });

        const profileMap = new Map();
        if (Array.isArray(profilesData)) {
          profilesData.forEach((profile: any) => {
            profileMap.set(profile.id, profile);
          });
        }

        const realMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          threadId: msg.conversation_id,
          content: msg.body,
          senderId: msg.sender_id,
          timestamp: msg.created_at,
          read: true
        }));

        setMessages(realMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markThreadAsRead = async (threadId: string) => {
    if (!user) return;
    
    try {
      setThreads(prev => prev.map(thread => {
        if (thread.id === threadId) {
          return { ...thread, unreadCount: 0 };
        }
        return thread;
      }));
      
      setMessages(prev => prev.map(message => ({
        ...message,
        read: true
      })));
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  };

  const sendMessage = async (threadId: string, content: string) => {
    if (!user || !content.trim()) return;
    
    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        threadId,
        content,
        senderId: user.id,
        timestamp: new Date().toISOString(),
        read: true
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      setThreads(prev => prev.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            lastMessage: {
              content,
              timestamp: new Date().toISOString(),
              senderId: user.id
            }
          };
        }
        return thread;
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const loadMoreMessages = async (threadId: string) => {
    return Promise.resolve();
  };

  const openChatWith = async (userId: string, opts?: { createIfMissing?: boolean }): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined' && (window as any).chatDock?.open) {
        const success = await (window as any).chatDock.open(userId);
        console.log('[ChatDockContext] MultiChatDock result:', success);
        return success;
      }

      let existingThread = threads.find(thread => 
        thread.participants.some(p => p.id === userId)
      );

      if (!existingThread && opts?.createIfMissing) {
        const { data: userProfiles, error } = await supabase.rpc('get_public_profiles_by_ids', {
          ids: [userId]
        });

        console.log('Chat: Fetching profile for user:', userId, 'Result:', userProfiles, 'Error:', error);

        let userProfile = null;

        if (error || !Array.isArray(userProfiles) || userProfiles.length === 0) {
          console.warn('Chat: RPC failed or returned empty, trying direct fetch...');
          
          const { data: directProfile, error: directError } = await supabase
            .from('user_profiles')
            .select('id, full_name, profile_photo, job_title')
            .eq('id', userId)
            .single();

          if (directError || !directProfile) {
            console.error('Chat: Direct profile fetch also failed:', directError);
            return false;
          }

          userProfile = directProfile;
          console.log('Chat: Using direct profile data:', userProfile);
        } else {
          userProfile = userProfiles[0];
          console.log('Chat: Using RPC profile data:', userProfile);
        }

        const newThread: Thread = {
          id: `thread_${Date.now()}`,
          participants: [{
            id: userId,
            name: userProfile.full_name || 'AI Enthusiast',
            avatar: userProfile.profile_photo,
            title: userProfile.job_title || '',
            online: onlineUsers.has(userId)
          }],
          lastMessage: {
            content: 'No messages yet',
            timestamp: new Date().toISOString(),
            senderId: ''
          },
          unreadCount: 0,
          isFocused: true
        };

        setThreads(prev => [newThread, ...prev]);
        existingThread = newThread;
      }

      if (existingThread) {
        setIsOpen(true);
        setMinimized(false);
        setActiveThreadId(existingThread.id);
        setActiveTab('focused');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      return false;
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setMinimized(false);
    }
  };

  const toggleMinimized = () => {
    setMinimized(!minimized);
  };

  const filteredThreads = threads.filter(thread => {
    if (activeTab === 'focused' && !thread.isFocused) return false;
    if (activeTab === 'other' && thread.isFocused) return false;
    
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    return thread.participants.some(participant => 
      participant.name.toLowerCase().includes(query) ||
      (participant.title && participant.title.toLowerCase().includes(query))
    ) || 
    thread.lastMessage.content.toLowerCase().includes(query);
  });

  const unreadCount = threads.reduce((count, thread) => count + thread.unreadCount, 0);

  const refreshConnections = useCallback(async () => {
    await fetchConnections();
  }, [fetchConnections]);

  const value = {
    isOpen,
    toggleOpen,
    minimized,
    toggleMinimized,
    threads,
    activeThreadId,
    setActiveThreadId,
    messages,
    sendMessage,
    loadMoreMessages,
    searchQuery,
    setSearchQuery,
    filteredThreads,
    unreadCount,
    activeTab,
    setActiveTab,
    loading,
    openChatWith,
    connections,
    onlineUsers,
    refreshConnections
  };

  // Register global chat controller
  useEffect(() => {
    setGlobalChatController(openChatWith);
  }, [openChatWith]);

  return (
    <ChatDockContext.Provider value={value}>
      {children}
    </ChatDockContext.Provider>
  );
};
