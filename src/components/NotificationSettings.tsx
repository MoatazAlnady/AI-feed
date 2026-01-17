import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Shield, Eye, MessageSquare, Users, Calendar } from 'lucide-react';

const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    newsletter_frequency: 'weekly',
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    security_alerts: true,
    notify_followers_event_attendance: true
  });

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('newsletter_frequency, notification_preferences, account_type')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setAccountType(data.account_type);
        const notificationPrefs = (typeof data.notification_preferences === 'object' && data.notification_preferences) ? data.notification_preferences as Record<string, any> : {};
        setSettings({
          newsletter_frequency: data.newsletter_frequency || 'weekly',
          email_notifications: notificationPrefs.email_notifications ?? true,
          push_notifications: notificationPrefs.push_notifications ?? true,
          marketing_emails: notificationPrefs.marketing_emails ?? false,
          security_alerts: notificationPrefs.security_alerts ?? true,
          notify_followers_event_attendance: notificationPrefs.notify_followers_event_attendance ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const updateSettings = async (key: string, value: any) => {
    setLoading(true);
    try {
      let updateData: any = {};

      if (key === 'newsletter_frequency') {
        updateData.newsletter_frequency = value;
        updateData.newsletter_subscription = value !== 'off';
      } else {
        // Update notification preferences
        const newPrefs = { ...settings, [key]: value };
        delete newPrefs.newsletter_frequency;
        updateData.notification_preferences = newPrefs;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-muted-foreground">Manage how you receive updates and notifications</p>
      </div>

      <div className="grid gap-6">
        {/* Newsletter Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Newsletter Subscription
            </CardTitle>
            <CardDescription>
              Choose how often you'd like to receive our newsletter with the latest AI tools and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newsletter-frequency">Frequency</Label>
              <Select 
                value={settings.newsletter_frequency} 
                onValueChange={(value) => updateSettings('newsletter_frequency', value)}
                disabled={loading}
              >
                <SelectTrigger id="newsletter-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily - Latest updates every day</SelectItem>
                  <SelectItem value="weekly">Weekly - Summary every week</SelectItem>
                  <SelectItem value="monthly">Monthly - Monthly roundup</SelectItem>
                  <SelectItem value="off">Off - No newsletter emails</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings.newsletter_frequency !== 'off' && (
              <div className="text-sm text-muted-foreground">
                You'll receive our newsletter {settings.newsletter_frequency} with curated AI tools, insights, and community highlights.
              </div>
            )}
          </CardContent>
        </Card>

        {/* General Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              General Notifications
            </CardTitle>
            <CardDescription>
              Control how you receive notifications about platform activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Receive notifications via email
                </div>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => updateSettings('email_notifications', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </div>
              </div>
              <Switch
                checked={settings.push_notifications}
                onCheckedChange={(checked) => updateSettings('push_notifications', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <div className="text-sm text-muted-foreground">
                  Receive promotional emails and special offers
                </div>
              </div>
              <Switch
                checked={settings.marketing_emails}
                onCheckedChange={(checked) => updateSettings('marketing_emails', checked)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Important notifications about your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Security Alerts</Label>
                <div className="text-sm text-muted-foreground">
                  Get notified about login attempts and security changes
                </div>
              </div>
              <Switch
                checked={settings.security_alerts}
                onCheckedChange={(checked) => updateSettings('security_alerts', checked)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Creator Notification Settings */}
        {accountType === 'creator' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Creator Settings
              </CardTitle>
              <CardDescription>
                Control what your followers are notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event Attendance Notifications
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Notify your followers when you attend events so they can join you
                  </div>
                </div>
                <Switch
                  checked={settings.notify_followers_event_attendance}
                  onCheckedChange={(checked) => updateSettings('notify_followers_event_attendance', checked)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;