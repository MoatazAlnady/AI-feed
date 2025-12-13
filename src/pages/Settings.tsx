import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Bell, User, Mail, Globe, Shield, Settings as SettingsIcon } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import SecuritySettings from '@/components/SecuritySettings';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    website: '',
    newsletter_subscription: false,
    contact_visible: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          bio: data.bio || '',
          website: data.website || '',
          newsletter_subscription: data.newsletter_subscription || false,
          contact_visible: data.contact_visible || false,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: t('common.error'),
        description: t('settings.loadError'),
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          bio: profile.bio,
          website: profile.website,
          newsletter_subscription: profile.newsletter_subscription,
          contact_visible: profile.contact_visible,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('settings.settingsSaved'),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.saveError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterToggle = async (checked: boolean) => {
    setProfile(prev => ({ ...prev, newsletter_subscription: checked }));
    
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          newsletter_subscription: checked,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: checked ? t('settings.subscribed') : t('settings.unsubscribed'),
        description: checked 
          ? t('settings.subscribeSuccess')
          : t('settings.unsubscribeSuccess'),
      });
    } catch (error) {
      console.error('Error updating newsletter subscription:', error);
      toast({
        title: t('common.error'),
        description: t('settings.newsletterError'),
        variant: "destructive"
      });
      setProfile(prev => ({ ...prev, newsletter_subscription: !checked }));
    }
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.pleaseLogIn')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('settings.profile')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.privacy')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('settings.security')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('settings.profileInfo')}
              </CardTitle>
              <CardDescription>
                {t('settings.profileInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('settings.fullName')}</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder={t('settings.fullNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">{t('settings.bio')}</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t('settings.bioPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('settings.websiteLabel')}</Label>
                <Input
                  id="website"
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                  placeholder={t('settings.websitePlaceholder')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('settings.newsletterSubscription')}
              </CardTitle>
              <CardDescription>
                {t('settings.newsletterBasic')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="newsletter">{t('settings.newsletterUpdates')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.newsletterUpdatesDesc')}
                  </p>
                </div>
                <Switch
                  id="newsletter"
                  checked={profile.newsletter_subscription}
                  onCheckedChange={handleNewsletterToggle}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('settings.saving') : t('settings.saveProfileChanges')}
            </Button>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings.privacySettings')}
              </CardTitle>
              <CardDescription>
                {t('settings.privacySettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="contact_visible">{t('settings.contactVisible')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.contactVisibleDesc')}
                  </p>
                </div>
                <Switch
                  id="contact_visible"
                  checked={profile.contact_visible}
                  onCheckedChange={(checked) => setProfile(prev => ({ ...prev, contact_visible: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('settings.saving') : t('settings.savePrivacySettings')}
            </Button>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;