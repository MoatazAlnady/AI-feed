import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChatDock } from '@/context/ChatDockContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  User,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

// Message interface - maps to conversation_messages table
interface Message {
  id: string;
  sender_id: string;
  content: string; // Mapped from 'body' in conversation_messages
  created_at: string;
}

interface Participant {
  id: string;
  full_name: string | null;
  profile_photo: string | null;
  job_title: string | null;
}

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  participant: Participant | null;
  lastMessage: Message | null;
  unreadCount: number;
}

const Messages: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { openChatWith, toggleOpen, onlineUsers } = useChatDock();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Handle deep-linking
  useEffect(() => {
    const withUserId = searchParams.get('with');
    if (withUserId) {
      openChatWith(withUserId, { createIfMissing: true })
        .then(() => toggleOpen())
        .catch(() => toast.error('Failed to open chat'));
    }
  }, [searchParams, openChatWith, toggleOpen]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        // Fetch conversations where user is participant
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

        // Get other participant IDs
        const otherUserIds = convData.map(conv => 
          conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
        );

        // Fetch participant profiles
        const { data: profiles } = await supabase
          .rpc('get_public_profiles_by_ids', { ids: otherUserIds });

        // Fetch last messages for each conversation
        const conversationsWithDetails = await Promise.all(
          convData.map(async (conv) => {
            const otherUserId = conv.participant_1_id === user.id 
              ? conv.participant_2_id 
              : conv.participant_1_id;
            
            const participant = profiles?.find(p => p.id === otherUserId) || null;

            // Get last message from conversation_messages table
            const { data: lastMsgData } = await supabase
              .from('conversation_messages')
              .select('id, body, sender_id, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get unread count from messages table (still needed for read tracking)
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
              lastMessage: lastMsgData ? {
                id: lastMsgData.id,
                sender_id: lastMsgData.sender_id,
                content: lastMsgData.body, // Map body to content
                created_at: lastMsgData.created_at
              } : null,
              unreadCount: count || 0
            };
          })
        );

        setConversations(conversationsWithDetails);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to new messages in conversation_messages table
    const channel = supabase
      .channel('conversation-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const fetchMessages = async () => {
      // Fetch from conversation_messages table
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('id, sender_id, body, created_at')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Map body to content for the Message interface
      const mappedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        content: msg.body,
        created_at: msg.created_at
      }));

      setMessages(mappedMessages);

      // Mark messages as read in the messages table (legacy, still needed for unread tracking)
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConversation)
        .eq('recipient_id', user.id)
        .is('read_at', null);
    };

    fetchMessages();

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`conv-messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            content: newMsg.body, // Map body to content
            created_at: newMsg.created_at
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user || !selectedConv) return;

    setSendingMessage(true);
    const recipientId = selectedConv.participant_1_id === user.id 
      ? selectedConv.participant_2_id 
      : selectedConv.participant_1_id;

    try {
      // Insert into conversation_messages table
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          body: newMessage.trim(),
          sender_id: user.id,
          conversation_id: selectedConversation
        });

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return formatTime(timestamp);
      if (days === 1) return 'Yesterday';
      if (days < 7) return format(date, 'EEE');
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="py-8 bg-muted/20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-muted/20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-border flex flex-col bg-card/80">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground mb-4">{t('messages.title')}</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('messages.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b border-border ${
                        selectedConversation === conversation.id ? 'bg-primary/10 border-primary/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          {conversation.participant?.profile_photo ? (
                            <img
                              src={conversation.participant.profile_photo}
                              alt={conversation.participant.full_name || ''}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-primary-foreground" />
                            </div>
                          )}
                          {/* Online status indicator */}
                          {conversation.participant && (
                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-card rounded-full ${
                              onlineUsers.has(conversation.participant.id) ? 'bg-green-500' : 'bg-muted-foreground/50'
                            }`} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground truncate">
                              {conversation.participant?.full_name || 'Unknown User'}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {conversation.lastMessage ? formatDate(conversation.lastMessage.created_at) : ''}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.participant?.job_title}
                          </p>
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">{t('messages.noConversations')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('messages.startConnecting')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-card/80">
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {selectedConv.participant?.profile_photo ? (
                          <img
                            src={selectedConv.participant.profile_photo}
                            alt={selectedConv.participant.full_name || ''}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-foreground" />
                          </div>
                        )}
                        {/* Online status indicator */}
                        {selectedConv.participant && (
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-card rounded-full ${
                            onlineUsers.has(selectedConv.participant.id) ? 'bg-green-500' : 'bg-muted-foreground/50'
                          }`} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {selectedConv.participant?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConv.participant && onlineUsers.has(selectedConv.participant.id) 
                            ? 'Online' 
                            : selectedConv.participant?.job_title || 'Offline'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        <Phone className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        <Video className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={t('messages.typeMessage')}
                          className="w-full px-4 py-2 border border-border rounded-full bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* No conversation selected */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('messages.selectConversation')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('messages.chooseConversation')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
