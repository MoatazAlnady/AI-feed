import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface GroupMemberNotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

const GroupMemberNotificationSettings: React.FC<GroupMemberNotificationSettingsProps> = ({
  isOpen,
  onClose,
  groupId
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notify_new_posts: true,
    notify_mentions: true,
    notify_new_members: false,
    notify_admin_actions: false
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchSettings();
    }
  }, [isOpen, user, groupId]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('group_notification_preferences')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setSettings({
          notify_new_posts: data.notify_new_posts ?? true,
          notify_mentions: data.notify_mentions ?? true,
          notify_new_members: data.notify_new_members ?? false,
          notify_admin_actions: data.notify_admin_actions ?? false
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('group_notification_preferences')
        .upsert({
          group_id: groupId,
          user_id: user.id,
          ...settings
        }, {
          onConflict: 'group_id,user_id'
        });

      if (error) throw error;

      toast.success('Notification settings saved!');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {t('groups.notificationSettings', 'Notification Settings')}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Settings */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">New Posts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone posts in the group
              </p>
            </div>
            <Switch
              checked={settings.notify_new_posts}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notify_new_posts: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Mentions</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you're mentioned
              </p>
            </div>
            <Switch
              checked={settings.notify_mentions}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notify_mentions: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">New Members</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new members join
              </p>
            </div>
            <Switch
              checked={settings.notify_new_members}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notify_new_members: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Admin Actions</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about group updates
              </p>
            </div>
            <Switch
              checked={settings.notify_admin_actions}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notify_admin_actions: checked }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupMemberNotificationSettings;
