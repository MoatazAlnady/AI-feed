import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, MessageCircle, Search, User, ArrowLeft, Maximize2, Minimize2, Send, Circle, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AIChat from './AIChat';
import { useAuth } from '@/context/AuthContext';
import { useChatDock } from '@/context/ChatDockContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface DualChatTabsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
}

interface ActiveConversation {
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isConnection: boolean;
}

const DualChatTabs: React.FC<DualChatTabsProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { conversationUsers, onlineUsers, refreshConnections, loading, myOnlineStatusMode, updateMyStatusMode, getEffectiveOnlineStatus } = useChatDock();
  const [activeTab, setActiveTab] = useState('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refresh connections when tab opens
  useEffect(() => {
    if (isOpen && user) {
      refreshConnections();
    }
  }, [isOpen, user, refreshConnections]);

  // Fetch messages when conversation is opened
  useEffect(() => {
    if (activeConversation?.conversationId) {
      fetchMessages(activeConversation.conversationId);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`conversation:${activeConversation.conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${activeConversation.conversationId}`
        }, (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMsg]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeConversation?.conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('id, body, sender_id, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleOpenChat = async (userItem: typeof conversationUsers[0]) => {
    // If no conversation exists, create one first
    let conversationId = userItem.conversationId;
    
    if (!conversationId) {
      try {
        const { data, error } = await supabase.rpc('find_or_create_dm', {
          other_user_id: userItem.id
        });
        if (error) throw error;
        conversationId = data;
        // Refresh connections to get the new conversation
        refreshConnections();
      } catch (error) {
        console.error('Error creating conversation:', error);
        return;
      }
    }

    setActiveConversation({
      conversationId,
      userId: userItem.id,
      userName: userItem.name,
      userAvatar: userItem.avatar,
      isConnection: userItem.isConnection
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation?.conversationId || !user) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: activeConversation.conversationId,
          sender_id: user.id,
          body: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
      refreshConnections(); // Refresh to update last message
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleBack = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return format(date, 'HH:mm');
      if (days === 1) return 'Yesterday';
      if (days < 7) return format(date, 'EEE');
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  // Filter users based on search term
  const filteredUsers = conversationUsers.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversationUsers.reduce((acc, u) => acc + u.unreadCount, 0);

  if (!isOpen) return null;

  const windowHeight = isExpanded ? 'h-[700px]' : 'h-[500px]';
  const windowWidth = isExpanded ? 'w-[450px]' : 'w-96';

  return (
    <div className={`fixed bottom-24 right-6 z-40 ${windowWidth} ${windowHeight} animate-slide-up transition-all duration-300`}>
      <Card className="h-full flex flex-col bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-primary/5">
          {activeConversation ? (
            // Chat header with back button
            <div className="flex items-center space-x-2 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  {activeConversation.userAvatar ? (
                    <img
                      src={activeConversation.userAvatar}
                      alt={activeConversation.userName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  {/* Only show online status for connections */}
                  {activeConversation.isConnection && (
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-card rounded-full ${
                      onlineUsers.has(activeConversation.userId) ? 'bg-green-500' : 'bg-muted-foreground/50'
                    }`} />
                  )}
                </div>
                <span className="font-medium text-sm text-foreground truncate">
                  {activeConversation.userName}
                </span>
              </div>
            </div>
          ) : (
            // Normal tabs header with status toggle
            <div className="flex items-center space-x-2 flex-1">
              {/* Status indicator dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 w-6 p-0 flex flex-col items-center justify-center gap-0.5">
                    <Circle className={`h-3 w-3 ${
                      myOnlineStatusMode === 'offline' ? 'fill-muted-foreground text-muted-foreground' :
                      myOnlineStatusMode === 'online' ? 'fill-green-500 text-green-500' :
                      'fill-green-500 text-green-500'
                    }`} />
                    <ChevronDown className="h-2 w-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => updateMyStatusMode('auto')}
                    className={myOnlineStatusMode === 'auto' ? 'bg-muted' : ''}
                  >
                    <Circle className="h-3 w-3 mr-2 fill-green-500 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{t('onlineStatus.auto')}</p>
                      <p className="text-xs text-muted-foreground">{t('onlineStatus.autoDesc')}</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateMyStatusMode('online')}
                    className={myOnlineStatusMode === 'online' ? 'bg-muted' : ''}
                  >
                    <Circle className="h-3 w-3 mr-2 fill-green-500 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{t('onlineStatus.online')}</p>
                      <p className="text-xs text-muted-foreground">{t('onlineStatus.onlineDesc')}</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateMyStatusMode('offline')}
                    className={myOnlineStatusMode === 'offline' ? 'bg-muted' : ''}
                  >
                    <Circle className="h-3 w-3 mr-2 fill-muted-foreground text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t('onlineStatus.offline')}</p>
                      <p className="text-xs text-muted-foreground">{t('onlineStatus.offlineDesc')}</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="chats" className="text-sm relative">
                    <MessageCircle className="h-4 w-4 mr-1.5" />
                    {t('chat.chats') || 'Chats'}
                    {totalUnread > 0 && (
                      <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs">
                        {totalUnread}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-sm">
                    <Bot className="h-4 w-4 mr-1.5" />
                    {t('chat.aiAssistant') || 'AI Assistant'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
          
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 bg-card flex flex-col">
          {activeConversation ? (
            // Inline chat view
            <>
              <ScrollArea className="flex-1 p-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                            isOwn 
                              ? 'bg-primary text-primary-foreground rounded-br-md' 
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                            <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </ScrollArea>
              
              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t bg-card">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sendingMessage}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="h-9 w-9 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : activeTab === 'chats' ? (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-3 border-b bg-card">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Users List */}
              <ScrollArea className="flex-1 bg-card">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredUsers.map((userItem) => {
                      // Use getEffectiveOnlineStatus for connections to respect status mode
                      const isOnline = userItem.showOnlineStatus && getEffectiveOnlineStatus(userItem.id);
                      
                      return (
                        <button
                          key={userItem.id}
                          onClick={() => handleOpenChat(userItem)}
                          className="w-full p-3 text-left hover:bg-muted/50 transition-colors bg-card"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative flex-shrink-0">
                              {userItem.avatar ? (
                                <img
                                  src={userItem.avatar}
                                  alt={userItem.name || ''}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary-foreground" />
                                </div>
                              )}
                              {/* Only show online indicator for connections */}
                              {userItem.showOnlineStatus && (
                                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-card rounded-full ${
                                  isOnline ? 'bg-green-500' : 'bg-muted-foreground/50'
                                }`} />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm text-foreground truncate">
                                  {userItem.name || 'Unknown User'}
                                  {!userItem.isConnection && (
                                    <span className="text-xs text-muted-foreground ml-1">(not connected)</span>
                                  )}
                                </h3>
                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                  {userItem.lastMessage ? formatTime(userItem.lastMessage.timestamp) : ''}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-xs text-muted-foreground truncate pr-2">
                                  {userItem.lastMessage?.content || 'Start a conversation'}
                                </p>
                                {userItem.unreadCount > 0 && (
                                  <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-xs flex-shrink-0">
                                    {userItem.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-card">
                    <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="font-medium text-foreground text-sm mb-1">No conversations</h3>
                    <p className="text-muted-foreground text-xs">
                      Connect with people to start chatting
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <AIChat context="general" />
          )}
        </div>
      </Card>
    </div>
  );
};

// Extend window for global chat API
declare global {
  interface Window {
    chatDock?: {
      open: (userId: string) => Promise<boolean>;
      openChatWith: (userId: string) => Promise<boolean>;
      close: (conversationId: string) => void;
      minimize: (conversationId: string) => void;
      focus: (conversationId: string) => void;
    };
  }
}

export default DualChatTabs;
