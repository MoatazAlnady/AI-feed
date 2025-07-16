'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

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
      
      // In a real implementation, fetch from Supabase
      // For now, use mock data
      const mockThreads: Thread[] = [
        {
          id: '1',
          participants: [
            {
              id: '2',
              name: 'Jane Smith',
              avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
              title: 'AI Product Manager',
              online: true
            }
          ],
          lastMessage: {
            content: 'Hi there! I saw your profile and I think you would be a great fit for our team.',
            timestamp: '2025-01-15T10:30:00Z',
            senderId: '2'
          },
          unreadCount: 1,
          isFocused: true
        },
        {
          id: '2',
          participants: [
            {
              id: '3',
              name: 'Alex Johnson',
              avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
              title: 'CTO at TechCorp',
              online: false
            }
          ],
          lastMessage: {
            content: 'Thanks for your application. When would you be available for an interview?',
            timestamp: '2025-01-14T15:45:00Z',
            senderId: '3'
          },
          unreadCount: 0,
          isFocused: true
        },
        {
          id: '3',
          participants: [
            {
              id: '4',
              name: 'Sarah Williams',
              avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
              title: 'HR Manager',
              online: true
            }
          ],
          lastMessage: {
            content: 'Your application has been received. We will review it shortly.',
            timestamp: '2025-01-13T09:20:00Z',
            senderId: '4'
          },
          unreadCount: 0,
          isFocused: false
        }
      ];
      
      setThreads(mockThreads);
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
      
      // In a real implementation, fetch from Supabase
      // For now, use mock data
      const mockMessages: Message[] = [
        {
          id: '1',
          threadId,
          content: 'Hi there! I saw your profile and I think you would be a great fit for our team.',
          senderId: threadId === '1' ? '2' : (threadId === '2' ? '3' : '4'),
          timestamp: '2025-01-15T10:30:00Z',
          read: false
        },
        {
          id: '2',
          threadId,
          content: 'We are looking for someone with your skills and experience.',
          senderId: threadId === '1' ? '2' : (threadId === '2' ? '3' : '4'),
          timestamp: '2025-01-15T10:31:00Z',
          read: false
        },
        {
          id: '3',
          threadId,
          content: 'Would you be interested in discussing this opportunity further?',
          senderId: threadId === '1' ? '2' : (threadId === '2' ? '3' : '4'),
          timestamp: '2025-01-15T10:32:00Z',
          read: false
        }
      ];
      
      setMessages(mockMessages);
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
    loading
  };

  return (
    <ChatDockContext.Provider value={value}>
      {children}
    </ChatDockContext.Provider>
  );
};