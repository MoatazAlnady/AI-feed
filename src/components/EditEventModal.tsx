import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, Clock, MapPin, Link, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InterestTagSelector from './InterestTagSelector';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    description?: string;
    event_date?: string;
    start_date?: string; // Legacy support
    start_time?: string;
    event_end_date?: string;
    end_date?: string; // Legacy support
    end_time?: string;
    location?: string;
    is_online?: boolean;
    online_link?: string;
    max_attendees?: number;
    is_public?: boolean;
    cover_image_url?: string;
    cover_image?: string; // Legacy support
    interests?: string[];
  };
  onEventUpdated: () => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onEventUpdated
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    is_online: false,
    online_link: '',
    max_attendees: '',
    is_public: true,
    interests: [] as string[]
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      // Support both unified (event_date) and legacy (start_date) field names
      const startDate = event.event_date || event.start_date || '';
      const endDate = event.event_end_date || event.end_date || '';
      const coverImage = event.cover_image_url || event.cover_image || null;
      
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_date: startDate ? startDate.split('T')[0] : '',
        start_time: event.start_time || '',
        end_date: endDate ? endDate.split('T')[0] : '',
        end_time: event.end_time || '',
        location: event.location || '',
        is_online: event.is_online || false,
        online_link: event.online_link || '',
        max_attendees: event.max_attendees?.toString() || '',
        is_public: event.is_public !== false,
        interests: event.interests || []
      });
      setCoverPreview(coverImage);
    }
  }, [event, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const uploadCover = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `event-covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading cover:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let coverUrl = event.cover_image_url || event.cover_image;
      if (coverImage) {
        coverUrl = await uploadCover(coverImage) || coverUrl;
      }

      const updateData: any = {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.start_date,
        start_time: formData.start_time || null,
        event_end_date: formData.end_date || null,
        end_time: formData.end_time || null,
        location: formData.is_online ? null : formData.location,
        is_online: formData.is_online,
        online_link: formData.is_online ? formData.online_link : null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        is_public: formData.is_public,
        cover_image_url: coverUrl,
        interests: formData.interests,
        updated_at: new Date().toISOString()
      };

      // Use unified events table
      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', event.id);

      if (error) throw error;

      toast.success(t('events.eventUpdated', 'Event updated successfully'));
      onEventUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(t('events.updateError', 'Failed to update event'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('events.editEvent', 'Edit Event')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image */}
          <div>
            <Label>{t('events.coverImage', 'Cover Image')}</Label>
            <div className="mt-2 border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary transition-colors">
              {coverPreview ? (
                <div className="relative">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block py-6">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload cover image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">{t('events.title', 'Title')} *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t('events.description', 'Description')}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Interests */}
          <div>
            <InterestTagSelector
              selectedTags={formData.interests}
              onTagsChange={(interests) => setFormData(prev => ({ ...prev, interests }))}
              maxTags={5}
              label="Event Interests (max 5)"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">{t('events.startDate', 'Start Date')} *</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="start_time">{t('events.startTime', 'Start Time')}</Label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="end_date">{t('events.endDate', 'End Date')}</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_time">{t('events.endTime', 'End Time')}</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>

          {/* Online Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('events.onlineEvent', 'Online Event')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('events.onlineEventDesc', 'This event will be held online')}
              </p>
            </div>
            <Switch
              checked={formData.is_online}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_online: checked }))}
            />
          </div>

          {/* Location or Online Link */}
          {formData.is_online ? (
            <div>
              <Label htmlFor="online_link">{t('events.onlineLink', 'Meeting Link')}</Label>
              <div className="relative mt-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="online_link"
                  name="online_link"
                  value={formData.online_link}
                  onChange={handleInputChange}
                  placeholder="https://zoom.us/..."
                  className="pl-10"
                />
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="location">{t('events.location', 'Location')}</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter venue address"
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Max Attendees */}
          <div>
            <Label htmlFor="max_attendees">{t('events.maxAttendees', 'Max Attendees')}</Label>
            <div className="relative mt-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="max_attendees"
                name="max_attendees"
                type="number"
                value={formData.max_attendees}
                onChange={handleInputChange}
                placeholder="Unlimited"
                className="pl-10"
              />
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('events.publicEvent', 'Public Event')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('events.publicEventDesc', 'Anyone can see and join this event')}
              </p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;
