import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, MessageSquare, Heart, Users, Calendar } from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'like' | 'comment' | 'follow' | 'event';
  title: string;
  message: string;
  userId: string;
  createdAt: string;
  read: boolean;
}

const RealTimeNotifications: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const message = payload.new;
          showNotification({
            id: message.id,
            type: 'message',
            title: 'New Message',
            message: 'You have received a new message',
            userId: message.sender_id,
            createdAt: message.created_at,
            read: false
          });
        }
      )
      .subscribe();

    // Subscribe to post reactions
    const reactionsChannel = supabase
      .channel('post-reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_reactions'
        },
        async (payload) => {
          const reaction = payload.new;
          
          // Check if this reaction is on user's post
          const { data: post } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', reaction.post_id)
            .single();

          if (post?.user_id === user.id && reaction.user_id !== user.id) {
            showNotification({
              id: reaction.id,
              type: 'like',
              title: 'New Reaction',
              message: `Someone ${reaction.reaction_type}d your post`,
              userId: reaction.user_id,
              createdAt: reaction.created_at,
              read: false
            });
          }
        }
      )
      .subscribe();

    // Subscribe to post comments
    const commentsChannel = supabase
      .channel('post-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments'
        },
        async (payload) => {
          const comment = payload.new;
          
          // Check if this comment is on user's post
          const { data: post } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', comment.post_id)
            .single();

          if (post?.user_id === user.id && comment.user_id !== user.id) {
            showNotification({
              id: comment.id,
              type: 'comment',
              title: 'New Comment',
              message: 'Someone commented on your post',
              userId: comment.user_id,
              createdAt: comment.created_at,
              read: false
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [user]);

  const showNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);

    const getIcon = () => {
      switch (notification.type) {
        case 'message': return <MessageSquare className="h-4 w-4" />;
        case 'like': return <Heart className="h-4 w-4" />;
        case 'comment': return <MessageSquare className="h-4 w-4" />;
        case 'follow': return <Users className="h-4 w-4" />;
        case 'event': return <Calendar className="h-4 w-4" />;
        default: return <Bell className="h-4 w-4" />;
      }
    };

    toast({
      title: notification.title,
      description: notification.message,
      action: getIcon(),
    });

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  return null; // This component only handles notifications, no UI
};

export default RealTimeNotifications;