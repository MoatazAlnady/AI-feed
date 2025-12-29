import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Eye, EyeOff, Link2, Mail, Chrome, Linkedin, Github, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface Identity {
  id: string;
  provider: string;
  created_at: string;
  identity_data: {
    email?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

const providerIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-5 w-5" />,
  google: <Chrome className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  linkedin_oidc: <Linkedin className="h-5 w-5" />,
  github: <Github className="h-5 w-5" />,
};

const providerNames: Record<string, string> = {
  email: 'Email & Password',
  google: 'Google',
  linkedin: 'LinkedIn',
  linkedin_oidc: 'LinkedIn',
  github: 'GitHub',
};

const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user?.identities) {
      setIdentities(user.identities as unknown as Identity[]);
    }
  }, [user]);

  const linkedProviders = identities.map(i => i.provider);
  const availableProviders = ['google', 'linkedin_oidc', 'github'].filter(
    p => !linkedProviders.includes(p)
  );

  const handleLinkProvider = async (provider: string) => {
    setLinkingProvider(provider);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider as 'google' | 'linkedin_oidc' | 'github',
        options: {
          redirectTo: `${window.location.origin}/settings`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error linking provider:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('settings.security.linkError', 'Failed to link account'),
        variant: "destructive"
      });
    } finally {
      setLinkingProvider(null);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.security.passwordMismatch', "New passwords don't match"),
        variant: "destructive"
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.security.passwordTooShort', 'Password must be at least 6 characters long'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;

      toast({
        title: t('common.success', 'Success'),
        description: t('settings.security.passwordUpdated', 'Password updated successfully'),
      });

      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('settings.security.passwordUpdateError', 'Failed to update password'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!confirm(t('settings.security.signOutConfirm', 'This will sign you out of all devices. Continue?'))) return;

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) throw error;

      toast({
        title: t('common.success', 'Success'),
        description: t('settings.security.signOutSuccess', 'Signed out of all devices successfully'),
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('settings.security.signOutError', 'Failed to sign out of all devices'),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {t('settings.security.linkedAccounts', 'Linked Accounts')}
          </CardTitle>
          <CardDescription>
            {t('settings.security.linkedAccountsDescription', 'Manage your connected login methods')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* List of linked identities */}
          <div className="space-y-3">
            {identities.map((identity) => (
              <div 
                key={identity.id} 
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    {providerIcons[identity.provider] || <Mail className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">
                      {providerNames[identity.provider] || identity.provider}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {identity.identity_data?.email || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.security.linkedOn', 'Linked on')} {format(new Date(identity.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {identity.provider === 'email' && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {t('settings.security.primary', 'Primary')}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Link additional providers */}
          {availableProviders.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium mb-3">
                {t('settings.security.linkAnother', 'Link Another Account')}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableProviders.map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkProvider(provider)}
                    disabled={linkingProvider === provider}
                    className="gap-2"
                  >
                    {providerIcons[provider]}
                    {linkingProvider === provider ? (
                      t('common.loading', 'Loading...')
                    ) : (
                      providerNames[provider]
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Helper text */}
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Plus className="h-3 w-3 mt-0.5 flex-shrink-0" />
              {t('settings.security.autoLinkHint', 'Tip: Accounts with the same verified email are automatically linked when you sign in.')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('settings.security.changePassword', 'Change Password')}
          </CardTitle>
          <CardDescription>
            {t('settings.security.changePasswordDescription', 'Update your password to keep your account secure.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('settings.security.currentPassword', 'Current Password')}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwords.currentPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder={t('settings.security.enterCurrentPassword', 'Enter current password')}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('settings.security.newPassword', 'New Password')}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwords.newPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder={t('settings.security.enterNewPassword', 'Enter new password')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('settings.security.confirmNewPassword', 'Confirm New Password')}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder={t('settings.security.confirmNewPasswordPlaceholder', 'Confirm new password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <Button 
            onClick={handlePasswordChange} 
            disabled={loading || !passwords.newPassword || !passwords.confirmPassword}
            className="w-full"
          >
            {loading ? t('common.updating', 'Updating...') : t('settings.security.updatePassword', 'Update Password')}
          </Button>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.security.accountSecurity', 'Account Security')}
          </CardTitle>
          <CardDescription>
            {t('settings.security.accountSecurityDescription', 'Manage your account security and active sessions.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">{t('settings.security.signOutAll', 'Sign Out All Devices')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('settings.security.signOutAllDescription', "This will sign you out of all devices and browsers. You'll need to sign in again.")}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOutAllDevices}>
              {t('settings.security.signOutAllButton', 'Sign Out All')}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">{t('settings.security.accountEmail', 'Account Email')}</h4>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <Button variant="outline" disabled>
              {t('settings.security.verified', 'Verified')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;