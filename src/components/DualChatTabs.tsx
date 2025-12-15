import React, { useState, useEffect } from 'react';
import { Bot, X, MessageCircle, Search, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import AIChat from './AIChat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface DualChatTabsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  participant: {
    id: string;
    full_name: string | null;
    profile_photo: string | null;
    job_title: string | null;
  } | null;
  lastMessage: {
    content: string;
    created_at: string;
  } | null;
  unreadCount: number;
  isOnline?: boolean;
}

const DualChatTabs: React.FC<DualChatTabsProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch conversations when tab opens
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false });

        if (convError) throw convError;

        if (!convData || convData.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        const otherUserIds = convData.map(conv => 
          conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
        );

        const { data: profiles } = await supabase
          .rpc('get_public_profiles_by_ids', { ids: otherUserIds });

        const conversationsWithDetails = await Promise.all(
          convData.map(async (conv) => {
            const otherUserId = conv.participant_1_id === user.id 
              ? conv.participant_2_id 
              : conv.participant_1_id;
            
            const participant = profiles?.find(p => p.id === otherUserId) || null;

            const { data: lastMsgData } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('recipient_id', user.id)
              .is('read_at', null);

            return {
              ...conv,
              participant: participant ? {
                id: participant.id,
                full_name: participant.full_name,
                profile_photo: participant.profile_photo,
                job_title: participant.job_title
              } : null,
              lastMessage: lastMsgData,
              unreadCount: count || 0,
              isOnline: Math.random() > 0.5 // Simulated - replace with real presence
            };
          })
        );

        setConversations(conversationsWithDetails);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('dual-chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user]);

  const handleOpenChat = (userId: string) => {
    // Open chat via MultiChatDock's global API
    if (window.chatDock?.openChatWith) {
      window.chatDock.openChatWith(userId);
    }
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

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] animate-slide-up">
      <Card className="h-full flex flex-col bg-background border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-primary/5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="chats" className="text-sm relative">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                Chats
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-sm">
                <Bot className="h-4 w-4 mr-1.5" />
                AI Assistant
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'chats' ? (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-3 border-b">
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

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : filteredConversations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => conv.participant && handleOpenChat(conv.participant.id)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative flex-shrink-0">
                            {conv.participant?.profile_photo ? (
                              <img
                                src={conv.participant.profile_photo}
                                alt={conv.participant.full_name || ''}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary-foreground" />
                              </div>
                            )}
                            {/* Online indicator */}
                            {conv.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-sm text-foreground truncate">
                                {conv.participant?.full_name || 'Unknown User'}
                              </h3>
                              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                {conv.lastMessage ? formatTime(conv.lastMessage.created_at) : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-muted-foreground truncate pr-2">
                                {conv.lastMessage?.content || 'No messages yet'}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-xs flex-shrink-0">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="font-medium text-foreground text-sm mb-1">No conversations</h3>
                    <p className="text-muted-foreground text-xs">
                      Start chatting with your connections
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
      openChatWith: (userId: string) => void;
    };
  }
}

export default DualChatTabs;
