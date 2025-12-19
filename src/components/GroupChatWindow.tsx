import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface GroupMessage {
  id: string;
  group_conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: {
    full_name: string;
    profile_photo: string | null;
  };
}

interface GroupChatWindowProps {
  groupId: string;
  groupName: string;
  onClose?: () => void;
  onBack?: () => void;
}

const GroupChatWindow: React.FC<GroupChatWindowProps> = ({ groupId, groupName, onClose, onBack }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, [groupId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      // Check if group conversation exists
      let { data: conversation, error } = await supabase
        .from('group_conversations')
        .select('id')
        .eq('group_id', groupId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create conversation if it doesn't exist
        const { data: newConversation, error: createError } = await supabase
          .from('group_conversations')
          .insert({ group_id: groupId, name: groupName })
          .select('id')
          .single();

        if (createError) throw createError;
        conversation = newConversation;
      } else if (error) {
        throw error;
      }

      setConversationId(conversation?.id || null);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch sender info for each message
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (message) => {
          const { data: senderData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', message.sender_id)
            .single();
          return { ...message, sender: senderData };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`group-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as GroupMessage;
          // Fetch sender info
          const { data: senderData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', newMsg.sender_id)
            .single();
          
          setMessages((prev) => [...prev, { ...newMsg, sender: senderData }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!user || !conversationId || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from('group_messages').insert({
        group_conversation_id: conversationId,
        sender_id: user.id,
        body: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{groupName}</h3>
            <p className="text-xs text-muted-foreground">{t('groups.groupChat', 'Group Chat')}</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('groups.noMessages', 'No messages yet. Start the conversation!')}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    {!isOwnMessage && (
                      message.sender?.profile_photo ? (
                        <img
                          src={message.sender.profile_photo}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {message.sender?.full_name?.charAt(0) || '?'}
                        </div>
                      )
                    )}
                    <div>
                      {!isOwnMessage && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.sender?.full_name || 'Unknown'}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.body}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('groups.typeMessage', 'Type a message...')}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatWindow;
