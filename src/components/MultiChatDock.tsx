import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X, Minus, Users, Send, ArrowUp } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

interface ChatWindow {
  conversationId: string;
  minimized: boolean;
  zIndex: number;
  otherUser?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    handle?: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  participants: Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    handle?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
}

interface MultiChatDockProps {
  onOpenChat?: (userId: string) => void;
}

const MultiChatDock: React.FC<MultiChatDockProps> = ({ onOpenChat }) => {
  const [windows, setWindows] = useState<ChatWindow[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessages, setNewMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Screen size limits
  const getMaxWindows = () => {
    if (isMobile) return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: convData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants!inner(
            user_id,
            profiles_public_v(id, display_name, avatar_url, handle)
          )
        `)
        .eq('conversation_participants.user_id', user.id);

      if (!error && convData) {
        const formattedConversations: Conversation[] = convData.map(conv => {
          const otherParticipant = conv.conversation_participants.find(
            (p: any) => p.user_id !== user.id
          );
          return {
            id: conv.id,
            participants: conv.conversation_participants.map((p: any) => ({
              user_id: p.user_id,
              display_name: p.profiles_public_v?.display_name || 'Unknown User',
              avatar_url: p.profiles_public_v?.avatar_url,
              handle: p.profiles_public_v?.handle
            })),
            unreadCount: 0 // TODO: Implement unread count
          };
        });
        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(prev => ({ ...prev, [conversationId]: true }));
    
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          body,
          created_at,
          profiles_public_v!sender_id(display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const formattedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          body: msg.body,
          created_at: msg.created_at,
          sender: {
            display_name: (msg as any).profiles_public_v?.display_name || 'Unknown User',
            avatar_url: (msg as any).profiles_public_v?.avatar_url
          }
        }));
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: formattedMessages
        }));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(prev => ({ ...prev, [conversationId]: false }));
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (conversationId: string, body: string) => {
    if (!user || !body.trim()) return;

    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: body.trim()
        });

      if (!error) {
        setNewMessages(prev => ({ ...prev, [conversationId]: '' }));
        loadMessages(conversationId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [user, loadMessages]);

  // Open chat with a user
  const openChatWith = useCallback(async (userId: string) => {
    if (!user) return;
    
    try {
      // Find or create DM conversation
      const { data: conversationId, error } = await supabase.rpc('find_or_create_dm', {
        other_user_id: userId
      });

      if (!error && conversationId) {
        // Get user info
        const { data: userData } = await supabase
          .from('profiles_public_v')
          .select('*')
          .eq('id', userId)
          .single();

        const otherUser = userData ? {
          id: userId,
          display_name: userData.display_name,
          avatar_url: userData.avatar_url,
          handle: userData.handle
        } : undefined;

        openWindow(conversationId, otherUser);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  }, [user]);

  // Chat dock API
  const openWindow = useCallback((conversationId: string, otherUser?: any) => {
    setWindows(prev => {
      const existing = prev.find(w => w.conversationId === conversationId);
      if (existing) {
        // Focus existing window
        setActiveWindow(conversationId);
        return prev.map(w => 
          w.conversationId === conversationId 
            ? { ...w, minimized: false, zIndex: Math.max(...prev.map(p => p.zIndex)) + 1 }
            : w
        );
      }

      const maxWindows = getMaxWindows();
      let newWindows = [...prev];

      // Remove oldest if at limit
      if (newWindows.length >= maxWindows) {
        newWindows = newWindows.slice(1);
      }

      const newWindow: ChatWindow = {
        conversationId,
        minimized: false,
        zIndex: Math.max(0, ...prev.map(w => w.zIndex)) + 1,
        otherUser
      };

      setActiveWindow(conversationId);
      loadMessages(conversationId);
      return [...newWindows, newWindow];
    });
  }, [loadMessages]);

  const closeWindow = useCallback((conversationId: string) => {
    setWindows(prev => prev.filter(w => w.conversationId !== conversationId));
    if (activeWindow === conversationId) {
      setActiveWindow(null);
    }
  }, [activeWindow]);

  const minimizeWindow = useCallback((conversationId: string) => {
    setWindows(prev => prev.map(w => 
      w.conversationId === conversationId ? { ...w, minimized: true } : w
    ));
  }, []);

  const focusWindow = useCallback((conversationId: string) => {
    setWindows(prev => prev.map(w => 
      w.conversationId === conversationId 
        ? { ...w, minimized: false, zIndex: Math.max(...prev.map(p => p.zIndex)) + 1 }
        : w
    ));
    setActiveWindow(conversationId);
  }, []);

  // Expose API to parent
  useEffect(() => {
    if (onOpenChat) {
      // Store the function for global access
      (window as any).chatDock = {
        open: openChatWith,
        close: closeWindow,
        minimize: minimizeWindow,
        focus: focusWindow
      };
    }
  }, [onOpenChat, openChatWith, closeWindow, minimizeWindow, focusWindow]);

  // Load initial data
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    Object.keys(messages).forEach(conversationId => {
      const ref = messageRefs.current[conversationId];
      if (ref) {
        ref.scrollTop = ref.scrollHeight;
      }
    });
  }, [messages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeWindow) {
        minimizeWindow(activeWindow);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeWindow, minimizeWindow]);

  // Mobile overlay mode
  if (isMobile && windows.length > 0) {
    const activeWindowData = windows.find(w => !w.minimized);
    if (!activeWindowData) return null;

    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-800">
        <ChatWindowContent
          window={activeWindowData}
          messages={messages[activeWindowData.conversationId] || []}
          newMessage={newMessages[activeWindowData.conversationId] || ''}
          loading={loading[activeWindowData.conversationId] || false}
          onSendMessage={sendMessage}
          onNewMessageChange={(value) => setNewMessages(prev => ({ ...prev, [activeWindowData.conversationId]: value }))}
          onClose={() => closeWindow(activeWindowData.conversationId)}
          onMinimize={() => minimizeWindow(activeWindowData.conversationId)}
          isMobile={true}
        />
      </div>
    );
  }

  // Desktop multi-window mode
  return (
    <div className="fixed bottom-0 right-4 z-40 flex gap-2">
      {windows.map((window) => (
        <div
          key={window.conversationId}
          className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg shadow-lg transition-all duration-200 ${
            window.minimized ? 'w-64 h-12' : 'w-80 h-96'
          }`}
          style={{ zIndex: window.zIndex }}
        >
          {window.minimized ? (
            <MinimizedWindow
              window={window}
              onClick={() => focusWindow(window.conversationId)}
              onClose={() => closeWindow(window.conversationId)}
            />
          ) : (
            <ChatWindowContent
              window={window}
              messages={messages[window.conversationId] || []}
              newMessage={newMessages[window.conversationId] || ''}
              loading={loading[window.conversationId] || false}
              onSendMessage={sendMessage}
              onNewMessageChange={(value) => setNewMessages(prev => ({ ...prev, [window.conversationId]: value }))}
              onClose={() => closeWindow(window.conversationId)}
              onMinimize={() => minimizeWindow(window.conversationId)}
              isMobile={false}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Minimized window component
const MinimizedWindow: React.FC<{
  window: ChatWindow;
  onClick: () => void;
  onClose: () => void;
}> = ({ window, onClick, onClose }) => (
  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
    <div className="flex items-center space-x-2" onClick={onClick}>
      <Avatar className="h-6 w-6">
        <AvatarImage src={window.otherUser?.avatar_url} />
        <AvatarFallback className="text-xs">
          {window.otherUser?.display_name?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium truncate">
        {window.otherUser?.display_name || 'Chat'}
      </span>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="h-6 w-6 p-0"
    >
      <X className="h-3 w-3" />
    </Button>
  </div>
);

// Chat window content component
const ChatWindowContent: React.FC<{
  window: ChatWindow;
  messages: Message[];
  newMessage: string;
  loading: boolean;
  onSendMessage: (conversationId: string, body: string) => void;
  onNewMessageChange: (value: string) => void;
  onClose: () => void;
  onMinimize: () => void;
  isMobile: boolean;
}> = ({ 
  window, 
  messages, 
  newMessage, 
  loading, 
  onSendMessage, 
  onNewMessageChange, 
  onClose, 
  onMinimize, 
  isMobile 
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(window.conversationId, newMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex flex-col ${isMobile ? 'h-full' : 'h-96'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={window.otherUser?.avatar_url} />
            <AvatarFallback>
              {window.otherUser?.display_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">
              {window.otherUser?.display_name || 'Chat'}
            </h3>
          </div>
        </div>
        <div className="flex space-x-1">
          {!isMobile && (
            <Button variant="ghost" size="sm" onClick={onMinimize} className="h-6 w-6 p-0">
              <Minus className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p>{message.body}</p>
                  <p className={`text-xs mt-1 opacity-70`}>
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MultiChatDock;