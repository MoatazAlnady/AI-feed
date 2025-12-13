import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, User, Globe, Shield, Briefcase, MapPin, Phone, Link2, Calendar, Users } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import SecuritySettings from '@/components/SecuritySettings';
import InterestTagSelector from '@/components/InterestTagSelector';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [countryCodes, setCountryCodes] = useState<Array<{ id: string; country_name: string; country_code: string; phone_code: string }>>([]);
  const [profile, setProfile] = useState({
    full_name: '',
    display_name: '',
    handle: '',
    headline: '',
    bio: '',
    job_title: '',
    company: '',
    website: '',
    country: '',
    city: '',
    location: '',
    phone: '',
    phone_country_code: '',
    github: '',
    linkedin: '',
    twitter: '',
    birth_date: '',
    gender: '',
    interests: [] as string[],
    visibility: 'public',
    contact_visible: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCountryCodes();
    }
  }, [user]);

  const fetchCountryCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('country_codes')
        .select('*')
        .order('country_name');
      
      if (error) throw error;
      setCountryCodes(data || []);
    } catch (error) {
      console.error('Error fetching country codes:', error);
    }
  };

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
          display_name: data.display_name || '',
          handle: data.handle || '',
          headline: data.headline || '',
          bio: data.bio || '',
          job_title: data.job_title || '',
          company: data.company || '',
          website: data.website || '',
          country: data.country || '',
          city: data.city || '',
          location: data.location || '',
          phone: data.phone || '',
          phone_country_code: data.phone_country_code || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          birth_date: data.birth_date || '',
          gender: data.gender || '',
          interests: data.interests || [],
          visibility: data.visibility || 'public',
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
          display_name: profile.display_name,
          handle: profile.handle,
          headline: profile.headline,
          bio: profile.bio,
          job_title: profile.job_title,
          company: profile.company,
          website: profile.website,
          country: profile.country,
          city: profile.city,
          location: profile.location,
          phone: profile.phone,
          phone_country_code: profile.phone_country_code,
          github: profile.github,
          linkedin: profile.linkedin,
          twitter: profile.twitter,
          birth_date: profile.birth_date || null,
          gender: profile.gender,
          interests: profile.interests,
          visibility: profile.visibility,
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('settings.basicInfo')}
              </CardTitle>
              <CardDescription>
                {t('settings.basicInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="display_name">{t('settings.displayName')}</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder={t('settings.displayNamePlaceholder')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle">{t('settings.handle')}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="handle"
                    value={profile.handle}
                    onChange={(e) => setProfile(prev => ({ ...prev, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder={t('settings.handlePlaceholder')}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('settings.handleHelp')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="headline">{t('settings.headline')}</Label>
                <Input
                  id="headline"
                  value={profile.headline}
                  onChange={(e) => setProfile(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder={t('settings.headlinePlaceholder')}
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
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {t('settings.professionalInfo')}
              </CardTitle>
              <CardDescription>
                {t('settings.professionalInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">{t('settings.jobTitle')}</Label>
                  <Input
                    id="job_title"
                    value={profile.job_title}
                    onChange={(e) => setProfile(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder={t('settings.jobTitlePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t('settings.company')}</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    placeholder={t('settings.companyPlaceholder')}
                  />
                </div>
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

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('settings.locationInfo')}
              </CardTitle>
              <CardDescription>
                {t('settings.locationInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">{t('settings.country')}</Label>
                  <Select
                    value={profile.country}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.countryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.id} value={cc.country_name}>
                          {cc.country_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t('settings.city')}</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t('settings.cityPlaceholder')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t('settings.locationDisplay')}</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={t('settings.locationDisplayPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">{t('settings.locationDisplayHelp')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {t('settings.contactInfo')}
              </CardTitle>
              <CardDescription>
                {t('settings.contactInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.email')}</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">{t('settings.emailHelp')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('settings.phone')}</Label>
                <div className="flex gap-2">
                  <Select
                    value={profile.phone_country_code}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, phone_country_code: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="+1" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.id} value={cc.phone_code}>
                          {cc.phone_code} ({cc.country_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('settings.phonePlaceholder')}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {t('settings.socialLinks')}
              </CardTitle>
              <CardDescription>
                {t('settings.socialLinksDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github">{t('settings.github')}</Label>
                <Input
                  id="github"
                  value={profile.github}
                  onChange={(e) => setProfile(prev => ({ ...prev, github: e.target.value }))}
                  placeholder="https://github.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">{t('settings.linkedin')}</Label>
                <Input
                  id="linkedin"
                  value={profile.linkedin}
                  onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">{t('settings.twitter')}</Label>
                <Input
                  id="twitter"
                  value={profile.twitter}
                  onChange={(e) => setProfile(prev => ({ ...prev, twitter: e.target.value }))}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('settings.personalDetails')}
              </CardTitle>
              <CardDescription>
                {t('settings.personalDetailsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">{t('settings.birthDate')}</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profile.birth_date}
                    onChange={(e) => setProfile(prev => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">{t('settings.gender')}</Label>
                  <Select
                    value={profile.gender}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.genderPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prefer_not_to_say">{t('settings.genderOptions.preferNotToSay')}</SelectItem>
                      <SelectItem value="male">{t('settings.genderOptions.male')}</SelectItem>
                      <SelectItem value="female">{t('settings.genderOptions.female')}</SelectItem>
                      <SelectItem value="non_binary">{t('settings.genderOptions.nonBinary')}</SelectItem>
                      <SelectItem value="other">{t('settings.genderOptions.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interests & Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('settings.interestsSkills')}
              </CardTitle>
              <CardDescription>
                {t('settings.interestsSkillsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InterestTagSelector
                selectedTags={profile.interests}
                onTagsChange={(tags) => setProfile(prev => ({ ...prev, interests: tags }))}
              />
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
                {t('settings.profileVisibility')}
              </CardTitle>
              <CardDescription>
                {t('settings.profileVisibilityDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visibility">{t('settings.whoCanSee')}</Label>
                <Select
                  value={profile.visibility}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">{t('settings.visibilityOptions.public')}</SelectItem>
                    <SelectItem value="connections">{t('settings.visibilityOptions.connections')}</SelectItem>
                    <SelectItem value="private">{t('settings.visibilityOptions.private')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
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