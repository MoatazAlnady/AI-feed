import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, DollarSign, Lock, Globe, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_photo?: string | null;
  cover_image?: string | null;
  category?: string | null;
  is_private?: boolean;
  rules?: string | null;
  welcome_message?: string | null;
  join_type?: string;
  require_approval?: boolean;
  who_can_post?: string;
  who_can_comment?: string;
  who_can_discuss?: string;
  who_can_invite?: string;
  who_can_chat?: string;
  posts_need_approval?: boolean;
  discussions_need_approval?: boolean;
  members_can_view_members?: boolean;
  posts_visibility?: string;
  membership_type?: string;
  membership_price?: number;
  membership_currency?: string;
  membership_frequency?: string | null;
}

interface GroupAdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onUpdate: () => void;
}

const GroupAdminSettingsModal: React.FC<GroupAdminSettingsModalProps> = ({
  isOpen,
  onClose,
  group,
  onUpdate
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();
  const isGold = isPremium; // Simplified - treat all premium as having access

  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || '',
    category: group.category || '',
    rules: group.rules || '',
    welcome_message: group.welcome_message || '',
    join_type: group.join_type || 'public',
    require_approval: group.require_approval || false,
    who_can_post: group.who_can_post || 'members',
    who_can_comment: group.who_can_comment || 'members',
    who_can_discuss: group.who_can_discuss || 'members',
    who_can_invite: group.who_can_invite || 'members',
    who_can_chat: group.who_can_chat || 'members',
    who_can_create_events: (group as any).who_can_create_events || 'admins',
    posts_need_approval: group.posts_need_approval || false,
    discussions_need_approval: group.discussions_need_approval || false,
    members_can_view_members: group.members_can_view_members !== false,
    posts_visibility: group.posts_visibility || 'members',
    allow_public_discussions: (group as any).allow_public_discussions || false,
    membership_type: group.membership_type || 'free',
    membership_price: group.membership_price || 0,
    membership_currency: group.membership_currency || 'USD',
    membership_frequency: group.membership_frequency || 'monthly'
  });

  const categories = [
    'AI Research',
    'Machine Learning',
    'Deep Learning',
    'Computer Vision',
    'Natural Language Processing',
    'AI Ethics',
    'AI Startups',
    'AI Tools & Resources',
    'AI News & Trends',
    'AI Education'
  ];

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `group-covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let coverUrl = group.cover_photo;
      
      if (coverImage) {
        coverUrl = await uploadCoverImage(coverImage);
      }

      // If membership is paid, force private
      const isPrivate = formData.membership_type !== 'free' ? true : formData.join_type === 'private';

      const { error } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          cover_photo: coverUrl,
          rules: formData.rules || null,
          welcome_message: formData.welcome_message || null,
          is_private: isPrivate,
          join_type: formData.join_type,
          require_approval: formData.require_approval,
          who_can_post: formData.who_can_post,
          who_can_comment: formData.who_can_comment,
          who_can_discuss: formData.who_can_discuss,
          who_can_invite: formData.who_can_invite,
          who_can_chat: formData.who_can_chat,
          who_can_create_events: formData.who_can_create_events,
          posts_need_approval: formData.posts_need_approval,
          discussions_need_approval: formData.discussions_need_approval,
          members_can_view_members: formData.members_can_view_members,
          posts_visibility: formData.posts_visibility,
          allow_public_discussions: formData.allow_public_discussions,
          membership_type: isGold ? formData.membership_type : 'free',
          membership_price: isGold ? formData.membership_price : 0,
          membership_currency: formData.membership_currency,
          membership_frequency: formData.membership_type === 'recurring' ? formData.membership_frequency : null
        })
        .eq('id', group.id);

      if (error) throw error;

      toast.success('Settings saved!');
      onUpdate();
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
      <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {t('groups.settings', 'Group Settings')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b border-border px-6">
            <TabsList className="grid w-full grid-cols-5 bg-transparent">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-0">
              <div>
                <Label>{t('groups.name', 'Group Name')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>{t('groups.description', 'Description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>{t('groups.category', 'Category')}</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('groups.coverImage', 'Cover Image')}</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4">
                  {coverImage ? (
                    <div className="text-center">
                      <img
                        src={URL.createObjectURL(coverImage)}
                        alt="Preview"
                        className="h-32 object-cover rounded-lg mx-auto mb-2"
                      />
                      <button
                        onClick={() => setCoverImage(null)}
                        className="text-destructive text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>{t('groups.rules', 'Group Rules')}</Label>
                <Textarea
                  value={formData.rules}
                  onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                  placeholder="Set rules for your group members..."
                  rows={4}
                />
              </div>

              <div>
                <Label>{t('groups.welcomeMessage', 'Welcome Message')}</Label>
                <Textarea
                  value={formData.welcome_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Message shown to new members..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4 mt-0">
              <div>
                <Label>{t('groups.joinType', 'Who can join')}</Label>
                <Select 
                  value={formData.join_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, join_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public - Anyone can join
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private - Invite only
                      </div>
                    </SelectItem>
                    <SelectItem value="connections_only">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Connections Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('groups.requireApproval', 'Require Approval')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Approve new members before they can join
                  </p>
                </div>
                <Switch
                  checked={formData.require_approval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_approval: checked }))}
                />
              </div>

              <div>
                <Label>{t('groups.postsVisibility', 'Posts Visibility')}</Label>
                <Select 
                  value={formData.posts_visibility} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, posts_visibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">Members Only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allow Public Discussions */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('groups.allowPublicDiscussions', 'Allow Public Discussions')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Members can mark their discussions as public (visible in Community tab)
                  </p>
                </div>
                <Switch
                  checked={formData.allow_public_discussions}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_public_discussions: checked }))}
                />
              </div>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-4 mt-0">
              {/* Who can create events */}
              <div>
                <Label>{t('groups.whoCanCreateEvents', 'Who can create events')}</Label>
                <Select 
                  value={formData.who_can_create_events} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    who_can_create_events: value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admins">Admins Only</SelectItem>
                    <SelectItem value="moderators">Admins & Moderators</SelectItem>
                    <SelectItem value="all_members">All Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {['post', 'comment', 'discuss', 'invite', 'chat'].map((action) => (
                <div key={action}>
                  <Label>Who can {action}</Label>
                  <Select 
                    value={(formData as any)[`who_can_${action}`]} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      [`who_can_${action}`]: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="members">Members Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Posts need approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Review posts before they appear
                  </p>
                </div>
                <Switch
                  checked={formData.posts_need_approval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, posts_need_approval: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Discussions need approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Review discussions before they appear
                  </p>
                </div>
                <Switch
                  checked={formData.discussions_need_approval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, discussions_need_approval: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Members can view member list</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to see other members
                  </p>
                </div>
                <Switch
                  checked={formData.members_can_view_members}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, members_can_view_members: checked }))}
                />
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="mt-0">
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>Use the "Manage Members" option from the group menu to manage members.</p>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-0">
              {!isGold ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
                  <DollarSign className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-medium text-foreground mb-1">Gold Members Only</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to Gold to create paid group memberships
                  </p>
                  <Button variant="outline" size="sm">
                    Upgrade to Gold
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label>{t('groups.membershipType', 'Membership Type')}</Label>
                    <Select 
                      value={formData.membership_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, membership_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="one_time">One-time Payment</SelectItem>
                        <SelectItem value="recurring">Recurring Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.membership_type !== 'free' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Price</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.membership_price}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              membership_price: parseFloat(e.target.value) || 0 
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Currency</Label>
                          <Select 
                            value={formData.membership_currency} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, membership_currency: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {formData.membership_type === 'recurring' && (
                        <div>
                          <Label>Billing Frequency</Label>
                          <Select 
                            value={formData.membership_frequency} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, membership_frequency: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                        <p>💡 Paid groups are automatically set to private. Only paying members can access content.</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
            {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupAdminSettingsModal;
