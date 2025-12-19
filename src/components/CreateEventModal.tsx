import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, Crown, Video, Copy, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PremiumUpgradeModal from './PremiumUpgradeModal';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: any) => void;
}

const generateRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `event-live-${Date.now()}-${result}`;
};

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'online',
    category: '',
    isLiveVideo: false,
    liveVideoRoomId: '',
    liveVideoUrl: ''
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
      
      // Auto-generate live video link when checkbox is enabled
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
    setIsSubmitting(true);

    const newEvent = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      location: formData.isLiveVideo ? formData.liveVideoUrl : formData.location,
      type: formData.type,
      category: formData.category,
      organizer: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
      attendees: 0,
      createdAt: 'Just now',
      isLiveVideo: formData.isLiveVideo,
      liveVideoRoomId: formData.liveVideoRoomId,
      liveVideoUrl: formData.liveVideoUrl
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    onEventCreated(newEvent);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      type: 'online',
      category: '',
      isLiveVideo: false,
      liveVideoRoomId: '',
      liveVideoUrl: ''
    });
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  // Show premium upgrade modal for non-premium users
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

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                  {t('community.events.form.date', 'Date')} *
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
                  {t('community.events.form.time', 'Time')} *
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
            <div className="mb-8">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
