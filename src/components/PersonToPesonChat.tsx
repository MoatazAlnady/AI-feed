import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Users, 
  Phone, 
  Video, 
  MoreHorizontal,
  ArrowLeft,
  Check,
  CheckCheck,
  User
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  conversation_id: string;
  created_at: string;
  read_at?: string;
  sender?: {
    full_name: string;
    profile_photo?: string;
  };
}

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  participant_1?: {
    full_name: string;
    profile_photo?: string;
  };
  participant_2?: {
    full_name: string;
    profile_photo?: string;
  };
  messages?: Message[];
}

interface UserProfile {
  id: string;
  full_name: string;
  profile_photo?: string;
  job_title?: string;
  verified?: boolean;
}

const PersonToPersonChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1:user_profiles!conversations_participant_1_id_fkey(
            full_name,
            profile_photo
          ),
          participant_2:user_profiles!conversations_participant_2_id_fkey(
            full_name,
            profile_photo
          )
        `)
        .or(`participant_1_id.eq.${user?.id},participant_2_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(
            full_name,
            profile_photo
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', user?.id)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user?.id}`
        },
        async (payload) => {
          // Fetch the complete message with sender data
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles!messages_sender_id_fkey(
                full_name,
                profile_photo
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data && activeConversation?.id === data.conversation_id) {
            setMessages(prev => [...prev, data]);
          }

          // Refresh conversations to update last message time
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const searchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_user_profiles', {
        search: searchTerm,
        limit_param: 10,
        offset_param: 0,
      });

      if (error) throw error;
      const filtered = (data || []).filter((u: any) => u.id !== user?.id);
      setSearchResults(filtered as any);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startConversation = async (recipientId: string) => {
    try {
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        (conv.participant_1_id === user?.id && conv.participant_2_id === recipientId) ||
        (conv.participant_2_id === user?.id && conv.participant_1_id === recipientId)
      );

      if (existingConv) {
        setActiveConversation(existingConv);
        await fetchMessages(existingConv.id);
        setSearchTerm('');
        setSearchResults([]);
        return;
      }

      // Create new conversation by sending a message
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user?.id,
          participant_2_id: recipientId
        })
        .select()
        .single();

      if (convError) throw convError;

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipientId,
          conversation_id: conversationData.id,
          content: 'Hi there! 👋'
        });

      if (messageError) throw messageError;

      await fetchConversations();
      setSearchTerm('');
      setSearchResults([]);
      
      toast({
        title: "Success",
        description: "Conversation started!",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const recipientId = activeConversation.participant_1_id === user?.id 
        ? activeConversation.participant_2_id 
        : activeConversation.participant_1_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipientId,
          conversation_id: activeConversation.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participant_1_id === user?.id 
      ? conversation.participant_2 
      : conversation.participant_1;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white dark:bg-[hsl(var(--dark-1))] border border-gray-200 dark:border-[hsl(var(--c-indigo))] rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-gray-200 dark:border-[hsl(var(--c-indigo))] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-[hsl(var(--c-indigo))]">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5" />
            <h2 className="font-semibold">Messages</h2>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-[hsl(var(--c-indigo))] border-gray-200 dark:border-[hsl(var(--c-violet))]"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white dark:bg-[hsl(var(--dark-1))] border border-gray-200 dark:border-[hsl(var(--c-indigo))] rounded-md shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => startConversation(user.id)}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-[hsl(var(--c-indigo))] flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile_photo} />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate">{user.full_name}</span>
                      {user.verified && <Check className="h-3 w-3 text-blue-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.job_title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Users className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground">Search for people to start chatting</p>
            </div>
          ) : (
            conversations.map(conversation => {
              const otherParticipant = getOtherParticipant(conversation);
              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setActiveConversation(conversation);
                    fetchMessages(conversation.id);
                  }}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-[hsl(var(--c-indigo))] flex items-center gap-3 border-b border-gray-200 dark:border-[hsl(var(--c-indigo))] transition-colors ${
                    activeConversation?.id === conversation.id ? 'bg-gray-50 dark:bg-[hsl(var(--c-indigo))]' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherParticipant?.profile_photo} />
                    <AvatarFallback>{otherParticipant?.full_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{otherParticipant?.full_name || 'Deleted User'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Click to view conversation</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[hsl(var(--c-indigo))] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getOtherParticipant(activeConversation)?.profile_photo} />
                  <AvatarFallback>{getOtherParticipant(activeConversation)?.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{getOtherParticipant(activeConversation)?.full_name || 'Deleted User'}</h3>
                  <p className="text-sm text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-gray-200 dark:border-[hsl(var(--c-indigo))] hover:bg-gray-50 dark:hover:bg-[hsl(var(--c-indigo))]">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-200 dark:border-[hsl(var(--c-indigo))] hover:bg-gray-50 dark:hover:bg-[hsl(var(--c-indigo))]">
                  <Video className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-200 dark:border-[hsl(var(--c-indigo))] hover:bg-gray-50 dark:hover:bg-[hsl(var(--c-indigo))]">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-300px)]">
              {messages.map(message => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div className={`p-3 rounded-lg ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground ml-4' 
                          : 'bg-gray-100 dark:bg-[hsl(var(--c-indigo))] mr-4'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs opacity-70">{formatTime(message.created_at)}</span>
                          {isOwn && (
                            message.read_at ? (
                              <CheckCheck className="h-3 w-3 opacity-70" />
                            ) : (
                              <Check className="h-3 w-3 opacity-70" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-[hsl(var(--c-indigo))]">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={sending}
                  className="bg-white dark:bg-[hsl(var(--c-indigo))] border-gray-200 dark:border-[hsl(var(--c-violet))]"
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonToPersonChat;