import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, Share2, Star, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention' | 'system';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
  metadata?: any;
}

interface NotificationDropdownProps {
  notificationCount: number;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notificationCount
}) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user } = useAuth();

  // Open/close handlers
  const toggle = () => {
    setOpen(v => !v);
    if (!open) {
      fetchNotifications();
    }
  };
  const close = () => setOpen(false);

  // Fetch notifications when dropdown opens
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data as Notification[]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Click-outside listener
  useEffect(() => {
    if (!open) return;
    
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      
      if (panelRef.current?.contains(target)) {
        return;   // inside panel
      }
      if (triggerRef.current?.contains(target)) {
        return; // the icon itself
      }
      
      close();
    };
    
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('touchstart', onDown, true);
    
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('touchstart', onDown, true);
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  // Close on route changes
  useEffect(() => {
    close();
  }, [location.pathname]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'follow': return UserPlus;
      case 'share': return Share2;
      case 'mention': return MessageCircle;
      case 'system': return CheckCircle;
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
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-700';
    }
  };

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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={toggle}
        type="button"
        className="relative p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted rounded-lg"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {notificationCount}
          </span>
        )}
      </button>
      
      {/* Backdrop */}
      {open && (
        <div 
          aria-hidden 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={close} 
        />
      )}
      
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <div 
            ref={panelRef}
            id="notification-panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="notification-title"
            className="relative z-50 bg-card rounded-lg shadow-lg border border-border w-80 max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h3 id="notification-title" className="text-lg font-semibold text-foreground">
                Notifications
              </h3>
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {notifications.slice(0, 4).map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClasses = getNotificationColor(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-muted transition-colors ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Notification Icon */}
                          <div className={`p-1.5 rounded-full ${colorClasses} flex-shrink-0`}>
                            <Icon className="h-3 w-3" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                            
                            {notification.action_url && (
                              <button
                                onClick={() => {
                                  markAsRead(notification.id);
                                  window.location.href = notification.action_url!;
                                }}
                                className="text-xs text-primary hover:text-primary/80 mt-1"
                              >
                                View →
                              </button>
                            )}
                          </div>
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-primary hover:text-primary/80"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No new notifications
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted/50">
              <Link
                to="/notifications"
                onClick={close}
                className="block w-full text-center text-sm text-primary hover:text-primary/80 font-medium"
              >
                See All Notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;