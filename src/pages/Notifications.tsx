import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ChatDock from '@/components/ChatDock';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share2, 
  Star,
  CheckCircle,
  X,
  Filter,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string | null;
  metadata?: Record<string, any> | null;
  user?: {
    name: string;
    avatar?: string;
  };
}

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []).map(n => ({
        ...n,
        metadata: typeof n.metadata === 'object' ? n.metadata : null
      })) as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'follow': return UserPlus;
      case 'share': return Share2;
      case 'mention': return MessageCircle;
      case 'system': return CheckCircle;
      case 'creator_update': return Sparkles;
      case 'event_invitation': return Calendar;
      case 'connection_request': return UserPlus;
      case 'creator_event_attendance': return Calendar;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'comment': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'follow': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'share': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'mention': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'system': return 'text-gray-500 bg-gray-50 dark:bg-gray-700';
      case 'creator_update': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'event_invitation': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
      case 'connection_request': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'creator_event_attendance': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-700';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read;
      case 'mentions': return notification.type === 'mention';
      default: return true;
    }
  });

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      setNotifications(notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
        
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="py-8 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {t('notifications.title')}
              </h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 
                  ? t('notifications.unreadCount', { count: unreadCount })
                  : t('notifications.noNotificationsDesc')
                }
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-primary hover:text-primary/80 font-medium"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex space-x-2">
              {[
                { key: 'all', label: t('notifications.filters.all') },
                { key: 'unread', label: t('notifications.filters.unread') },
                { key: 'mentions', label: t('notifications.filters.mentions') }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClasses = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`bg-card rounded-2xl shadow-sm p-6 transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${colorClasses}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {notification.user?.avatar && (
                      <img
                        src={notification.user.avatar}
                        alt={notification.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-primary hover:text-primary/80"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                            title="Delete notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {notification.action_url && (
                        <Link
                          to={notification.action_url}
                          onClick={() => markAsRead(notification.id)}
                          className="mt-3 text-primary hover:text-primary/80 text-sm font-medium inline-block"
                        >
                          {t('common.view')} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-card rounded-2xl shadow-sm p-12 text-center">
              <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('notifications.noNotifications')}
              </h3>
              <p className="text-muted-foreground">
                {t('notifications.noNotificationsDesc')}
              </p>
            </div>
          )}
        </div>
      </div>

      <ChatDock />
    </div>
  );
};

export default Notifications;
