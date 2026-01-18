import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, ArrowLeft, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface EventMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: {
    full_name: string;
    profile_photo: string | null;
  };
}

interface EventChatWindowProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

const EventChatWindow: React.FC<EventChatWindowProps> = ({
  eventId,
  eventTitle,
  onClose
}) => {
  // Unified event type for all events
  const eventType = 'event';
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAttendee, setIsAttendee] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAttendance();
    initializeChat();
  }, [eventId, eventType]);

  useEffect(() => {
    if (conversationId) {
      const channel = supabase
        .channel(`event-chat-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'event_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            const newMsg = payload.new as EventMessage;
            // Fetch sender info
            const { data: senderData } = await supabase
              .from('user_profiles')
              .select('full_name, profile_photo')
              .eq('id', newMsg.sender_id)
              .single();
            
            setMessages(prev => [...prev, { ...newMsg, sender: senderData || undefined }]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId]);

  const checkAttendance = async () => {
    if (!user) {
      setIsAttendee(false);
      setCheckingAttendance(false);
      return;
    }

    try {
      // Use unified event_attendees table for all event types
      const { data } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'attending')
        .maybeSingle();
      
      setIsAttendee(!!data);
    } catch (error) {
      console.error('Error checking attendance:', error);
      setIsAttendee(false);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const initializeChat = async () => {
    try {
      // Find or create conversation
      let { data: existingConversation } = await supabase
        .from('event_conversations')
        .select('id')
        .eq('event_id', eventId)
        .eq('event_type', eventType)
        .maybeSingle();

      if (!existingConversation) {
        const { data: newConversation, error } = await supabase
          .from('event_conversations')
          .insert({
            event_id: eventId,
            event_type: eventType
          })
          .select('id')
          .single();

        if (error) throw error;
        existingConversation = newConversation;
      }

      setConversationId(existingConversation.id);
      await fetchMessages(existingConversation.id);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Batch fetch sender info
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: senders } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo')
        .in('id', senderIds);

      const senderMap = new Map(senders?.map(s => [s.id, s]) || []);

      const messagesWithSenders = (data || []).map(msg => ({
        ...msg,
        sender: senderMap.get(msg.sender_id) || undefined
      }));

      setMessages(messagesWithSenders);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || !conversationId) return;

    // Check attendance before sending
    if (!isAttendee) {
      toast.error(t('events.mustRSVPToChat', 'You must RSVP to this event to send messages'));
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('event_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: newMessage.trim()
        });

      if (error) throw error;

      // Update last_message_at
      await supabase
        .from('event_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background border rounded-xl">
        <div className="p-4 border-b flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="animate-pulse h-4 bg-muted rounded w-32" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-card">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground truncate">{eventTitle}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {t('events.attendeeChat', 'Attendee Chat')}
          </p>
        </div>
      </div>

      {/* Not Attendee Warning */}
      {!checkingAttendance && !isAttendee && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-600">
            <Lock className="h-4 w-4" />
            <p className="text-sm">{t('events.rsvpToJoinChat', 'RSVP to this event to join the conversation')}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('events.noChatMessages', 'No messages yet. Start the conversation!')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={msg.sender?.profile_photo || undefined} />
                    <AvatarFallback className="text-xs">
                      {(msg.sender?.full_name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                    <p className="text-xs text-muted-foreground mb-1">
                      {isOwn ? t('common.you', 'You') : msg.sender?.full_name || 'Unknown'} ·{' '}
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                    <div
                      className={`inline-block rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {user ? (
        <div className="p-4 border-t bg-card">
          {isAttendee ? (
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('events.typeMessage', 'Type a message...')}
                disabled={sending}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 inline mr-1" />
              {t('events.rsvpRequired', 'RSVP to send messages')}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border-t bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            {t('events.loginToChat', 'Please log in to chat')}
          </p>
        </div>
      )}
    </div>
  );
};

export default EventChatWindow;
