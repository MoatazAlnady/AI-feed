import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Heart, Users, Calendar } from 'lucide-react';

interface NotificationPreferences {
  email_newsletter: boolean;
  email_messages: boolean;
  email_likes: boolean;
  email_comments: boolean;
  email_follows: boolean;
  email_events: boolean;
  push_messages: boolean;
  push_likes: boolean;
  push_comments: boolean;
  push_follows: boolean;
  push_events: boolean;
}

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_newsletter: true,
    email_messages: true,
    email_likes: false,
    email_comments: true,
    email_follows: true,
    email_events: true,
    push_messages: true,
    push_likes: true,
    push_comments: true,
    push_follows: true,
    push_events: true,
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && (data as any).notification_preferences) {
        setPreferences(prev => ({
          ...prev,
          ...(data as any).notification_preferences
        }));
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          notification_preferences: newPreferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Preference Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      // Revert the change
      setPreferences(preferences);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive"
      });
    }
  };

  const PreferenceSwitch: React.FC<{
    id: keyof NotificationPreferences;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = ({ id, label, description, icon }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="mt-1 text-gray-500 dark:text-gray-400">
          {icon}
        </div>
        <div className="space-y-1">
          <Label htmlFor={id} className="font-medium">{label}</Label>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={preferences[id]}
        onCheckedChange={(checked) => updatePreference(id, checked)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive via email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceSwitch
            id="email_newsletter"
            label="Newsletter Updates"
            description="Weekly newsletter with AI tools and industry insights"
            icon={<Mail className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="email_messages"
            label="Direct Messages"
            description="When someone sends you a direct message"
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="email_comments"
            label="Comments & Replies"
            description="When someone comments on or replies to your posts"
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="email_likes"
            label="Likes & Reactions"
            description="When someone likes or reacts to your content"
            icon={<Heart className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="email_follows"
            label="New Followers"
            description="When someone starts following you"
            icon={<Users className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="email_events"
            label="Event Updates"
            description="Event invitations and reminders"
            icon={<Calendar className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Real-time notifications in your browser or mobile app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceSwitch
            id="push_messages"
            label="Direct Messages"
            description="Real-time notifications for new messages"
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="push_comments"
            label="Comments & Replies"
            description="Real-time notifications for comments and replies"
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="push_likes"
            label="Likes & Reactions"
            description="Real-time notifications for likes and reactions"
            icon={<Heart className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="push_follows"
            label="New Followers"
            description="Real-time notifications for new followers"
            icon={<Users className="h-4 w-4" />}
          />
          <PreferenceSwitch
            id="push_events"
            label="Event Updates"
            description="Real-time notifications for events"
            icon={<Calendar className="h-4 w-4" />}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;