import React, { useState } from 'react';
import { X, Users, Upload, ChevronDown, ChevronUp, Settings, Shield, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import PremiumUpgradeModal from './PremiumUpgradeModal';
import InterestTagSelector from './InterestTagSelector';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium, isLoading: isPremiumLoading, premiumTier } = usePremiumStatus();
  const isGold = premiumTier === 'gold';
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public',
    interests: [] as string[],
    tags: [] as string[]
  });
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState({
    rules: '',
    welcome_message: '',
    who_can_post: 'members',
    who_can_comment: 'members',
    who_can_discuss: 'members',
    who_can_invite: 'members',
    who_can_chat: 'members',
    who_can_create_events: 'admins',
    posts_need_approval: false,
    discussions_need_approval: false,
    members_can_view_members: true,
    posts_visibility: 'members',
    allow_public_discussions: false,
    // Pricing (Gold only)
    membership_type: 'free',
    membership_price: 0,
    membership_currency: 'USD',
    membership_frequency: 'monthly'
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

  const permissionOptions = [
    { value: 'admins', label: t('groups.permissions.adminsOnly', 'Admins Only') },
    { value: 'moderators', label: t('groups.permissions.moderators', 'Admins & Moderators') },
    { value: 'members', label: t('groups.permissions.allMembers', 'All Members') }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: t('common.error'),
        description: t('common.pleaseLogIn', 'Please log in to create a group'),
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if provided
      let coverImageUrl = null;
      if (image) {
        coverImageUrl = await uploadImage(image);
      }

      // Create the group in Supabase with advanced settings
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          is_private: formData.privacy === 'private',
          cover_image: coverImageUrl,
          creator_id: user.id,
          member_count: 1,
          auto_approve_members: formData.privacy === 'public',
          auto_approve_posts: !advancedSettings.posts_need_approval,
          interests: formData.interests,
          tags: formData.tags,
          // Advanced settings
          rules: advancedSettings.rules || null,
          welcome_message: advancedSettings.welcome_message || null,
          who_can_post: advancedSettings.who_can_post,
          who_can_comment: advancedSettings.who_can_comment,
          who_can_discuss: advancedSettings.who_can_discuss,
          who_can_invite: advancedSettings.who_can_invite,
          who_can_chat: advancedSettings.who_can_chat,
          who_can_create_events: advancedSettings.who_can_create_events,
          posts_need_approval: advancedSettings.posts_need_approval,
          discussions_need_approval: advancedSettings.discussions_need_approval,
          members_can_view_members: advancedSettings.members_can_view_members,
          posts_visibility: advancedSettings.posts_visibility,
          allow_public_discussions: advancedSettings.allow_public_discussions,
          // Pricing (Gold only)
          membership_type: isGold ? advancedSettings.membership_type : 'free',
          membership_price: isGold && advancedSettings.membership_type !== 'free' ? advancedSettings.membership_price : null,
          membership_currency: isGold ? advancedSettings.membership_currency : null,
          membership_frequency: isGold && advancedSettings.membership_type === 'recurring' ? advancedSettings.membership_frequency : null
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as group member with 'owner' role
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding creator as member:', memberError);
      }

      // Create group conversation for chat
      const { error: convError } = await supabase
        .from('group_conversations')
        .insert({
          group_id: groupData.id,
          name: formData.name
        });

      if (convError) {
        console.error('Error creating group conversation:', convError);
      }

      toast({
        title: t('common.success'),
        description: t('community.groups.groupCreated', 'Group created successfully!')
      });

      onGroupCreated({
        ...groupData,
        members: 1,
        creator: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        image: coverImageUrl || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=300',
        createdAt: 'Just now'
      });

      // Reset form
      setFormData({ name: '', description: '', category: '', privacy: 'public', interests: [], tags: [] });
      setAdvancedSettings({
        rules: '',
        welcome_message: '',
        who_can_post: 'members',
        who_can_comment: 'members',
        who_can_discuss: 'members',
        who_can_invite: 'members',
        who_can_chat: 'members',
        who_can_create_events: 'admins',
        posts_need_approval: false,
        discussions_need_approval: false,
        members_can_view_members: true,
        posts_visibility: 'members',
        allow_public_discussions: false,
        membership_type: 'free',
        membership_price: 0,
        membership_currency: 'USD',
        membership_frequency: 'monthly'
      });
      setImage(null);
      setShowAdvanced(false);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: t('common.error'),
        description: t('community.groups.createError', 'Failed to create group'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Show premium upgrade modal for non-premium users
  if (!isPremiumLoading && !isPremium) {
    return (
      <PremiumUpgradeModal
        isOpen={isOpen}
        onClose={onClose}
        featureName={t('community.groups.createGroup', 'Group Creation')}
        trigger="premium_feature"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">{t('community.groups.createGroup', 'Create Group')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Group Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                {t('community.groups.form.name', 'Group Name')} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder={t('community.groups.form.namePlaceholder', 'Enter group name')}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                {t('community.groups.form.description', 'Description')} *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
                placeholder={t('community.groups.form.descriptionPlaceholder', 'Describe what this group is about')}
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                {t('community.groups.form.category', 'Category')} *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="">{t('community.groups.form.selectCategory', 'Select a category')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Privacy */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('community.groups.form.privacy', 'Privacy')} *
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy === 'public'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-foreground">{t('community.groups.form.public', 'Public')}</div>
                    <div className="text-sm text-muted-foreground">{t('community.groups.form.publicDesc', 'Anyone can see and join this group')}</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === 'private'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-foreground">{t('community.groups.form.private', 'Private')}</div>
                    <div className="text-sm text-muted-foreground">{t('community.groups.form.privateDesc', 'Only members can see posts and join by invitation')}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Interests */}
            <div className="mb-6">
              <InterestTagSelector
                selectedTags={formData.interests}
                onTagsChange={(interests) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    interests
                  }));
                }}
                maxTags={5}
                label="Group Interests (max 5)"
              />
            </div>

            {/* Group Image */}
            <div className="mb-6">
              <label htmlFor="image" className="block text-sm font-medium text-foreground mb-2">
                {t('community.groups.form.image', 'Group Image')}
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
                {image ? (
                  <div>
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="text-destructive text-sm hover:underline"
                    >
                      {t('common.removeImage', 'Remove image')}
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('community.groups.form.uploadImage', 'Upload a group image')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="mt-2 inline-block bg-primary/10 text-primary px-4 py-2 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      {t('common.chooseImage', 'Choose Image')}
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Advanced Settings Collapsible */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="mb-6">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">{t('groups.advancedSettings', 'Advanced Settings')}</span>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4 space-y-6 p-4 bg-muted/30 rounded-xl">
                {/* Rules & Welcome */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {t('groups.rulesAndWelcome', 'Rules & Welcome')}
                  </h4>
                  
                  <div>
                    <Label>{t('groups.rules', 'Group Rules')}</Label>
                    <textarea
                      value={advancedSettings.rules}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, rules: e.target.value }))}
                      rows={3}
                      className="w-full mt-1 px-4 py-3 border border-border rounded-xl bg-background text-foreground resize-none"
                      placeholder={t('groups.rulesPlaceholder', 'Enter group rules (one per line)')}
                    />
                  </div>
                  
                  <div>
                    <Label>{t('groups.welcomeMessage', 'Welcome Message')}</Label>
                    <textarea
                      value={advancedSettings.welcome_message}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
                      rows={2}
                      className="w-full mt-1 px-4 py-3 border border-border rounded-xl bg-background text-foreground resize-none"
                      placeholder={t('groups.welcomePlaceholder', 'Message shown to new members')}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">{t('groups.permissions', 'Permissions')}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>{t('groups.whoCanPost', 'Who can post')}</Label>
                      <Select 
                        value={advancedSettings.who_can_post} 
                        onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, who_can_post: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>{t('groups.whoCanComment', 'Who can comment')}</Label>
                      <Select 
                        value={advancedSettings.who_can_comment} 
                        onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, who_can_comment: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>{t('groups.whoCanDiscuss', 'Who can start discussions')}</Label>
                      <Select 
                        value={advancedSettings.who_can_discuss} 
                        onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, who_can_discuss: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>{t('groups.whoCanInvite', 'Who can invite')}</Label>
                      <Select 
                        value={advancedSettings.who_can_invite} 
                        onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, who_can_invite: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>{t('groups.whoCanChat', 'Who can use chat')}</Label>
                      <Select 
                        value={advancedSettings.who_can_chat} 
                        onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, who_can_chat: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>{t('groups.whoCanCreateEvents', 'Who can create events')}</Label>
                      <Select 
                        value={advancedSettings.who_can_create_events} 
                        onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, who_can_create_events: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Approval Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">{t('groups.approvalSettings', 'Approval Settings')}</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t('groups.postsNeedApproval', 'Posts need approval')}</Label>
                        <p className="text-xs text-muted-foreground">{t('groups.postsNeedApprovalDesc', 'New posts must be approved by admins')}</p>
                      </div>
                      <Switch
                        checked={advancedSettings.posts_need_approval}
                        onCheckedChange={(checked) => setAdvancedSettings(prev => ({ ...prev, posts_need_approval: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t('groups.discussionsNeedApproval', 'Discussions need approval')}</Label>
                        <p className="text-xs text-muted-foreground">{t('groups.discussionsNeedApprovalDesc', 'New discussions must be approved')}</p>
                      </div>
                      <Switch
                        checked={advancedSettings.discussions_need_approval}
                        onCheckedChange={(checked) => setAdvancedSettings(prev => ({ ...prev, discussions_need_approval: checked }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">{t('groups.privacySettings', 'Privacy Settings')}</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t('groups.membersCanViewMembers', 'Members can view member list')}</Label>
                        <p className="text-xs text-muted-foreground">{t('groups.membersCanViewMembersDesc', 'Allow members to see who else is in the group')}</p>
                      </div>
                      <Switch
                        checked={advancedSettings.members_can_view_members}
                        onCheckedChange={(checked) => setAdvancedSettings(prev => ({ ...prev, members_can_view_members: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t('groups.allowPublicDiscussions', 'Allow public discussions')}</Label>
                        <p className="text-xs text-muted-foreground">{t('groups.allowPublicDiscussionsDesc', 'Let members mark discussions as public')}</p>
                      </div>
                      <Switch
                        checked={advancedSettings.allow_public_discussions}
                        onCheckedChange={(checked) => setAdvancedSettings(prev => ({ ...prev, allow_public_discussions: checked }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Settings (Gold Only) */}
                {isGold && (
                  <div className="space-y-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-500" />
                      {t('groups.membershipPricing', 'Membership Pricing')}
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Gold</span>
                    </h4>
                    
                    <div>
                      <Label>{t('groups.membershipType', 'Membership Type')}</Label>
                      <Select 
                        value={advancedSettings.membership_type} 
                        onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, membership_type: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">{t('groups.free', 'Free')}</SelectItem>
                          <SelectItem value="one_time">{t('groups.oneTimePayment', 'One-time Payment')}</SelectItem>
                          <SelectItem value="recurring">{t('groups.recurring', 'Recurring Subscription')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {advancedSettings.membership_type !== 'free' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t('groups.price', 'Price')}</Label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={advancedSettings.membership_price}
                            onChange={(e) => setAdvancedSettings(prev => ({ ...prev, membership_price: parseFloat(e.target.value) || 0 }))}
                            className="w-full mt-1 px-4 py-3 border border-border rounded-xl bg-background text-foreground"
                            placeholder="9.99"
                          />
                        </div>
                        
                        <div>
                          <Label>{t('groups.currency', 'Currency')}</Label>
                          <Select 
                            value={advancedSettings.membership_currency} 
                            onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, membership_currency: v }))}
                          >
                            <SelectTrigger className="mt-1">
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
                    )}
                    
                    {advancedSettings.membership_type === 'recurring' && (
                      <div>
                        <Label>{t('groups.billingFrequency', 'Billing Frequency')}</Label>
                        <Select 
                          value={advancedSettings.membership_frequency} 
                          onValueChange={(v) => setAdvancedSettings(prev => ({ ...prev, membership_frequency: v }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">{t('groups.monthly', 'Monthly')}</SelectItem>
                            <SelectItem value="yearly">{t('groups.yearly', 'Yearly')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  <span>{t('community.groups.creating', 'Creating Group...')}</span>
                </>
              ) : (
                <>
                  <Users className="h-5 w-5" />
                  <span>{t('community.groups.createGroup', 'Create Group')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
