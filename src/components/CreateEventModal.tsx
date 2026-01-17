import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, Crown, Video, Copy, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';
import PremiumUpgradeModal from './PremiumUpgradeModal';
import InterestTagSelector from './InterestTagSelector';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: any) => void;
  groupId?: string;
}

const generateRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `event-live-${Date.now()}-${result}`;
};

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated, groupId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    location: '',
    type: 'online',
    category: '',
    isLiveVideo: false,
    liveVideoRoomId: '',
    liveVideoUrl: '',
    interests: [] as string[],
    tags: [] as string[],
    isPublic: true,
    maxAttendees: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Conference',
    'Workshop',
    'Webinar',
    'Meetup',
    'Hackathon',
    'Panel Discussion',
    'Networking',
    'Training',
    'Demo Day',
    'Research Presentation'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      
      if (name === 'isLiveVideo' && checked) {
        const roomId = generateRoomId();
        const liveUrl = `${window.location.origin}/live/${roomId}`;
        setFormData(prev => ({ 
          ...prev, 
          isLiveVideo: true,
          liveVideoRoomId: roomId,
          liveVideoUrl: liveUrl 
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const regenerateLiveLink = () => {
    const roomId = generateRoomId();
    const liveUrl = `${window.location.origin}/live/${roomId}`;
    setFormData(prev => ({ 
      ...prev, 
      liveVideoRoomId: roomId,
      liveVideoUrl: liveUrl 
    }));
    toast.success(t('community.events.form.linkRegenerated', 'New link generated'));
  };

  const copyLiveLink = () => {
    navigator.clipboard.writeText(formData.liveVideoUrl);
    toast.success(t('community.events.form.linkCopied', 'Link copied to clipboard'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to create an event');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = `${formData.date}T${formData.time}:00`;
      const endDateTime = formData.endDate && formData.endTime 
        ? `${formData.endDate}T${formData.endTime}:00` 
        : null;

      let newEventData;

      if (groupId) {
        // Create group event
        const { data, error } = await supabase
          .from('group_events')
          .insert({
            group_id: groupId,
            title: formData.title,
            description: formData.description,
            start_date: formData.date,
            start_time: formData.time,
            end_date: formData.endDate || null,
            end_time: formData.endTime || null,
            location: formData.isLiveVideo ? formData.liveVideoUrl : formData.location,
            is_online: formData.type === 'online' || formData.type === 'hybrid',
            online_link: formData.type === 'online' || formData.type === 'hybrid' ? formData.location : null,
            is_public: formData.isPublic,
            max_attendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
            created_by: user.id,
            interests: formData.interests,
            tags: formData.tags
          })
          .select()
          .single();

        if (error) throw error;
        newEventData = data;
      } else {
        // Create standalone event using events table
        const { data, error } = await supabase
          .from('events')
          .insert({
            title: formData.title,
            description: formData.description,
            event_date: startDateTime,
            event_end_date: endDateTime,
            location: formData.isLiveVideo ? formData.liveVideoUrl : formData.location,
            event_type: formData.type,
            category: formData.category,
            is_public: formData.isPublic,
            max_attendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
            organizer_id: user.id,
            is_live_video: formData.isLiveVideo,
            live_video_room_id: formData.liveVideoRoomId || null,
            live_video_url: formData.liveVideoUrl || null
          })
          .select()
          .single();

        if (error) throw error;
        newEventData = data;
      }

      toast.success('Event created successfully!');
      onEventCreated(newEventData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        endDate: '',
        endTime: '',
        location: '',
        type: 'online',
        category: '',
        isLiveVideo: false,
        liveVideoRoomId: '',
        liveVideoUrl: '',
        interests: [],
        tags: [],
        isPublic: true,
        maxAttendees: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (!isPremiumLoading && !isPremium) {
    return (
      <PremiumUpgradeModal
        isOpen={isOpen}
        onClose={onClose}
        featureName={t('community.events.createEvent', 'Event Creation')}
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
            <h2 className="text-2xl font-bold text-foreground">{t('community.events.createEvent', 'Create Event')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Event Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                {t('community.events.form.title', 'Event Title')} *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder={t('community.events.form.titlePlaceholder', 'Enter event title')}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                {t('community.events.form.description', 'Description')} *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
                placeholder={t('community.events.form.descriptionPlaceholder', 'Describe your event')}
              />
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
                label="Event Interests (max 5)"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                  {t('community.events.form.date', 'Start Date')} *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-foreground mb-2">
                  {t('community.events.form.time', 'Start Time')} *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* End Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-foreground mb-2">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Event Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('community.events.form.eventType', 'Event Type')} *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center text-foreground">
                  <input
                    type="radio"
                    name="type"
                    value="online"
                    checked={formData.type === 'online'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  {t('community.events.form.online', 'Online')}
                </label>
                <label className="flex items-center text-foreground">
                  <input
                    type="radio"
                    name="type"
                    value="in-person"
                    checked={formData.type === 'in-person'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  {t('community.events.form.inPerson', 'In-Person')}
                </label>
                <label className="flex items-center text-foreground">
                  <input
                    type="radio"
                    name="type"
                    value="hybrid"
                    checked={formData.type === 'hybrid'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  {t('community.events.form.hybrid', 'Hybrid')}
                </label>
              </div>
            </div>

            {/* Live Video Option */}
            {(formData.type === 'online' || formData.type === 'hybrid') && (
              <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-border">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    name="isLiveVideo"
                    checked={formData.isLiveVideo}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">
                      {t('community.events.form.liveVideo', 'This is a live video event')}
                    </span>
                  </div>
                </label>

                {formData.isLiveVideo && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.liveVideoUrl}
                        readOnly
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      />
                      <button
                        type="button"
                        onClick={copyLiveLink}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={t('common.copy', 'Copy')}
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={regenerateLiveLink}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={t('community.events.form.regenerate', 'Generate new link')}
                      >
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('community.events.form.liveVideoHelp', 'Share this link with attendees to join your live event')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Location */}
            <div className="mb-6">
              <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                {t('community.events.form.location', 'Location')} *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  placeholder={formData.type === 'online' ? 'Zoom, Teams, etc.' : t('community.events.form.locationPlaceholder', 'Venue address')}
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-6">
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                {t('community.events.form.category', 'Category')} *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="">{t('community.events.form.selectCategory', 'Select a category')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility */}
            <div className="mb-6">
              <label className="flex items-center gap-3 text-foreground">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Make this event public</span>
              </label>
            </div>

            {/* Max Attendees */}
            <div className="mb-8">
              <label htmlFor="maxAttendees" className="block text-sm font-medium text-foreground mb-2">
                Max Attendees (optional)
              </label>
              <input
                type="number"
                id="maxAttendees"
                name="maxAttendees"
                value={formData.maxAttendees}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="Leave empty for unlimited"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('community.events.creating', 'Creating Event...')}</span>
                </>
              ) : (
                <>
                  <Calendar className="h-5 w-5" />
                  <span>{t('community.events.createEvent', 'Create Event')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;