import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, MapPin, Video, Upload, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import PremiumUpgradeModal from './PremiumUpgradeModal';
import InterestTagSelector from './InterestTagSelector';

interface CreateStandaloneEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

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
  'AI Education',
  'Networking',
  'Workshop',
  'Conference',
  'Meetup'
];

const CreateStandaloneEventModal: React.FC<CreateStandaloneEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium, premiumTier, isLoading: isPremiumLoading } = usePremiumStatus();
  const isGold = premiumTier === 'gold';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    cover_image: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    is_online: false,
    online_link: '',
    is_public: true,
    max_attendees: '',
    interests: [] as string[],
    tags: [] as string[]
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `standalone-event-covers/${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_image: publicUrl }));
      toast.success('Cover photo uploaded!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.start_date) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('standalone_events')
        .insert({
          creator_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category || null,
          cover_image: formData.cover_image || null,
          event_date: formData.start_date,
          event_end_date: formData.end_date || null,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          location: formData.is_online ? null : formData.location || null,
          is_online: formData.is_online,
          online_link: formData.is_online ? formData.online_link || null : null,
          is_public: formData.is_public,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          interests: formData.interests,
          tags: formData.tags
        });

      if (error) throw error;

      toast.success('Event created successfully!');
      onEventCreated?.();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        cover_image: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        location: '',
        is_online: false,
        online_link: '',
        is_public: true,
        max_attendees: '',
        interests: [],
        tags: []
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Show premium upgrade modal for non-Gold users
  if (!isPremiumLoading && !isGold) {
    return (
      <PremiumUpgradeModal
        isOpen={isOpen}
        onClose={onClose}
        featureName={t('events.createStandaloneEvent', 'Standalone Event Creation')}
        trigger="premium_feature"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              {t('events.createEvent', 'Create Event')}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cover Photo Upload */}
          <div>
            <Label>{t('events.coverPhoto', 'Cover Photo')}</Label>
            {formData.cover_image ? (
              <div className="relative mt-2">
                <img 
                  src={formData.cover_image} 
                  alt="Cover" 
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                  id="standalone-event-cover"
                />
                <label htmlFor="standalone-event-cover" className="cursor-pointer">
                  {uploadingCover ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload cover photo</p>
                      <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x630px</p>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <Label>{t('common.title', 'Title')} *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              required
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label>{t('common.description', 'Description')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Event description"
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label>{t('common.category', 'Category')}</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interests & Tags */}
          <div>
            <InterestTagSelector
              selectedTags={[...formData.interests, ...formData.tags]}
              onTagsChange={(allTags) => {
                setFormData(prev => ({ 
                  ...prev, 
                  interests: allTags,
                  tags: allTags 
                }));
              }}
              maxTags={5}
              label="Event Interests & Tags (max 5)"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('events.startDate', 'Start Date')} *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t('events.endDate', 'End Date')}</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('events.startTime', 'Start Time')}</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t('events.endTime', 'End Time')}</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Online Event Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.is_online}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_online: checked }))}
            />
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <Label>{t('events.onlineEvent', 'Online Event')}</Label>
            </div>
          </div>

          {/* Location or Online Link */}
          {formData.is_online ? (
            <div>
              <Label>{t('events.onlineLink', 'Online Link')}</Label>
              <Input
                value={formData.online_link}
                onChange={(e) => setFormData(prev => ({ ...prev, online_link: e.target.value }))}
                placeholder="https://zoom.us/..."
                className="mt-1"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Label>{t('common.location', 'Location')}</Label>
              </div>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Event location"
              />
            </div>
          )}

          {/* Max Attendees */}
          <div>
            <Label>{t('events.maxAttendees', 'Max Attendees')}</Label>
            <Input
              type="number"
              value={formData.max_attendees}
              onChange={(e) => setFormData(prev => ({ ...prev, max_attendees: e.target.value }))}
              placeholder="Leave empty for unlimited"
              className="mt-1"
            />
          </div>

          {/* Public Event Toggle */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
            />
            <div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label>{t('events.publicEvent', 'Public Event')}</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Public events appear in the main Events tab for everyone to see
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!formData.title.trim() || !formData.start_date || submitting}
            className="w-full"
          >
            {submitting ? t('common.creating', 'Creating...') : t('events.createEvent', 'Create Event')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateStandaloneEventModal;
