import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Bell, User, Mail, Globe } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
        title: "Error",
        description: "Failed to load profile settings",
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
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterToggle = async (checked: boolean) => {
    setProfile(prev => ({ ...prev, newsletter_subscription: checked }));
    
    // Auto-save newsletter preference
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
        title: checked ? "Subscribed" : "Unsubscribed",
        description: checked 
          ? "You'll receive our newsletter updates" 
          : "You won't receive newsletter updates anymore",
      });
    } catch (error) {
      console.error('Error updating newsletter subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update newsletter subscription",
        variant: "destructive"
      });
      // Revert the change
      setProfile(prev => ({ ...prev, newsletter_subscription: !checked }));
    }
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground">Please log in to access your settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and public profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={profile.website}
                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://your-website.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Newsletter Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Newsletter Subscription
            </CardTitle>
            <CardDescription>
              Manage your newsletter preferences and email notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="newsletter">Newsletter Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new AI tools, features, and industry insights.
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

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control how your information is displayed to other users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="contact_visible">Contact Information Visible</Label>
                <p className="text-sm text-muted-foreground">
                  Allow other users to see your contact information in your profile.
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

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;