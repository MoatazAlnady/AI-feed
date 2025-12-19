import React, { useState } from 'react';
import { X, Users, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PremiumUpgradeModal from './PremiumUpgradeModal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public'
  });
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Create the group in Supabase
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
          auto_approve_posts: true
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
      setFormData({ name: '', description: '', category: '', privacy: 'public' });
      setImage(null);
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

            {/* Group Image */}
            <div className="mb-8">
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
