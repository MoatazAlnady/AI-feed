import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setGlobalChatController } from '../components/ChatController';

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
  openChatWith: (userId: string, opts?: { createIfMissing?: boolean }) => Promise<void>;
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

  // Check URL params for deep-linking
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const withUserId = urlParams.get('with');
    
    if (withUserId && user) {
      // Auto-open chat with specified user
      openChatWith(withUserId, { createIfMissing: true })
        .catch(error => {
          console.error('Error opening chat from URL:', error);
          toast.error('Failed to open chat');
        });
    }
  }, [user]); // Run when user changes

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

  // Fetch threads when user changes
  useEffect(() => {
    if (user) {
      fetchThreads();
      
      // Set up realtime subscription for new messages
      const channel = supabase
        .channel(`user:${user.id}:messages`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        }, (payload) => {
          // Handle new message
          const newMessage = payload.new as any;
          
          // Update messages if this thread is active
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
          
          // Update thread's last message and unread count
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
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeThreadId]);

  // Fetch messages when active thread changes
  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
      
      // Mark messages as read
      markThreadAsRead(activeThreadId);
    }
  }, [activeThreadId]);

  const fetchThreads = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch real conversations from database
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants!inner(user_id)
        `)
        .eq('conversation_participants.user_id', user.id);

      if (conversations && conversations.length > 0) {
        // Get all participant IDs and fetch their safe profiles
        const allParticipantIds = conversations.flatMap(conv => 
          conv.conversation_participants.map((p: any) => p.user_id)
        );
        const uniqueParticipantIds = [...new Set(allParticipantIds)];

        const { data: profilesData } = await supabase.rpc('get_public_profiles_by_ids', {
          ids: uniqueParticipantIds
        });

        const profileMap = new Map();
        if (Array.isArray(profilesData)) {
          profilesData.forEach((profile: any) => {
            profileMap.set(profile.id, profile);
          });
        }

        const realThreads: Thread[] = conversations.map(conv => {
          const otherParticipant = conv.conversation_participants.find(
            (p: any) => p.user_id !== user.id
          );
          const profile = profileMap.get(otherParticipant?.user_id);

          return {
            id: conv.id,
            participants: [{
              id: otherParticipant?.user_id || '',
              name: profile?.full_name || 'Deleted User',
              avatar: profile?.profile_photo,
              title: '', // Not available in public profiles
              online: false
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
      
      // Fetch real messages from database
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
        // Get sender profiles safely
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
      // In a real implementation, update in Supabase
      // For now, just update local state
      setThreads(prev => prev.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            unreadCount: 0
          };
        }
        return thread;
      }));
      
      // Mark messages as read
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
      // In a real implementation, send to Supabase
      // For now, just update local state
      const newMessage: Message = {
        id: Date.now().toString(),
        threadId,
        content,
        senderId: user.id,
        timestamp: new Date().toISOString(),
        read: true
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Update thread's last message
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
    // In a real implementation, fetch more messages from Supabase
    // For now, just return a promise
    return Promise.resolve();
  };

  const openChatWith = async (userId: string, opts?: { createIfMissing?: boolean }) => {
    try {
      // Find existing thread with this user
      let existingThread = threads.find(thread => 
        thread.participants.some(p => p.id === userId)
      );

      if (!existingThread && opts?.createIfMissing) {
        // Get user profile safely using RPC
        const { data: userProfiles, error } = await supabase.rpc('get_public_profiles_by_ids', {
          ids: [userId]
        });

        console.log('Chat: Fetching profile for user:', userId, 'Result:', userProfiles, 'Error:', error);

        if (error || !Array.isArray(userProfiles) || userProfiles.length === 0) {
          throw new Error('User not found or profile not accessible');
        }

        const userProfile = userProfiles[0];
        console.log('Chat: Using profile data:', userProfile);

        // Create new thread with proper name handling
        const newThread: Thread = {
          id: `thread_${Date.now()}`,
          participants: [{
            id: userId,
            name: userProfile.full_name || 'AI Enthusiast', // Better fallback
            avatar: userProfile.profile_photo,
            title: userProfile.job_title || '',
            online: false
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
        // Open chat dock and focus thread
        setIsOpen(true);
        setMinimized(false);
        setActiveThreadId(existingThread.id);
        setActiveTab('focused');
      } else {
        throw new Error('No existing conversation found');
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      throw error;
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

  // Filter threads based on search query and active tab
  const filteredThreads = threads.filter(thread => {
    // Filter by tab
    if (activeTab === 'focused' && !thread.isFocused) return false;
    if (activeTab === 'other' && thread.isFocused) return false;
    
    // Filter by search query
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in participant names and titles
    return thread.participants.some(participant => 
      participant.name.toLowerCase().includes(query) ||
      (participant.title && participant.title.toLowerCase().includes(query))
    ) || 
    // Search in last message
    thread.lastMessage.content.toLowerCase().includes(query);
  });

  // Calculate total unread count
  const unreadCount = threads.reduce((count, thread) => count + thread.unreadCount, 0);

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
    openChatWith
  };

  // Set global controller
  useEffect(() => {
    setGlobalChatController(openChatWith);
  }, [openChatWith]);

  return (
    <ChatDockContext.Provider value={value}>
      {children}
    </ChatDockContext.Provider>
  );
};