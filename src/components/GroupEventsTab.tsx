import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Plus, 
  Users,
  Check,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GroupEvent {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_online: boolean;
  online_link: string | null;
  is_public: boolean;
  max_attendees: number | null;
  created_at: string;
  attendee_count?: number;
}

interface GroupEventsTabProps {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  isMember: boolean;
  whoCanCreateEvents?: string;
  userRole?: string;
}

const ITEMS_PER_PAGE = 10;

const GroupEventsTab: React.FC<GroupEventsTabProps> = ({ 
  groupId, 
  groupName, 
  isAdmin, 
  isMember,
  whoCanCreateEvents = 'admins',
  userRole = 'member'
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userAttendance, setUserAttendance] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Create event form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_image: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    is_online: false,
    online_link: '',
    is_public: false,
    max_attendees: ''
  });
  const [uploadingCover, setUploadingCover] = useState(false);

  // Check if user can create events
  const canCreateEvents = isAdmin || 
    whoCanCreateEvents === 'all_members' ||
    (whoCanCreateEvents === 'moderators' && (userRole === 'moderator' || userRole === 'admin'));

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchUserAttendance();
    }
  }, [groupId, user]);

  const fetchEvents = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      }
      
      const currentPage = loadMore ? page + 1 : 0;
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('group_events')
        .select('*')
        .eq('group_id', groupId)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const newEvents = data || [];
      const eventIds = newEvents.map(e => e.id);

      // Batch fetch attendee counts - NO N+1!
      let countMap: Record<string, number> = {};
      if (eventIds.length > 0) {
        const { data: attendeeCounts } = await supabase
          .from('group_event_attendees')
          .select('event_id')
          .in('event_id', eventIds)
          .eq('status', 'attending');
        
        // Count in memory
        eventIds.forEach(id => { countMap[id] = 0; });
        (attendeeCounts || []).forEach(a => {
          countMap[a.event_id] = (countMap[a.event_id] || 0) + 1;
        });
      }

      const eventsWithCounts = newEvents.map(event => ({
        ...event,
        attendee_count: countMap[event.id] || 0
      }));

      if (loadMore) {
        setEvents(prev => [...prev, ...eventsWithCounts]);
        setPage(currentPage);
      } else {
        setEvents(eventsWithCounts);
        setPage(0);
      }
      
      setHasMore(newEvents.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchUserAttendance = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('group_event_attendees')
        .select('event_id, status')
        .eq('user_id', user.id);

      const attendance: Record<string, string> = {};
      data?.forEach(a => {
        attendance[a.event_id] = a.status;
      });
      setUserAttendance(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) {
      toast.error('Please log in to RSVP');
      return;
    }

    try {
      const currentStatus = userAttendance[eventId];
      
      if (currentStatus === 'attending') {
        // Remove RSVP
        await supabase
          .from('group_event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        setUserAttendance(prev => {
          const newState = { ...prev };
          delete newState[eventId];
          return newState;
        });
        toast.success('RSVP cancelled');
      } else {
        // Add RSVP
        if (currentStatus) {
          await supabase
            .from('group_event_attendees')
            .update({ status: 'attending' })
            .eq('event_id', eventId)
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('group_event_attendees')
            .insert({
              event_id: eventId,
              user_id: user.id,
              status: 'attending'
            });
        }
        
        setUserAttendance(prev => ({ ...prev, [eventId]: 'attending' }));
        toast.success("You're attending!");
      }
      
      fetchEvents();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `event-covers/${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
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

  const createEvent = async () => {
    if (!user || !formData.title.trim() || !formData.start_date) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('group_events')
        .insert({
          group_id: groupId,
          created_by: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          cover_image: formData.cover_image || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          location: formData.is_online ? null : formData.location || null,
          is_online: formData.is_online,
          online_link: formData.is_online ? formData.online_link || null : null,
          is_public: formData.is_public,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null
        });

      if (error) throw error;

      toast.success('Event created!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        cover_image: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        location: '',
        is_online: false,
        online_link: '',
        is_public: false,
        max_attendees: ''
      });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {t('groups.upcomingEvents', 'Upcoming Events')}
        </h3>
        {canCreateEvents && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('groups.createEvent', 'Create Event')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('groups.newEvent', 'New Event')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Cover Photo Upload */}
                <div>
                  <Label>{t('groups.coverPhoto', 'Cover Photo')}</Label>
                  {formData.cover_image ? (
                    <div className="relative">
                      <img 
                        src={formData.cover_image} 
                        alt="Cover" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={uploadingCover}
                        className="hidden"
                        id="event-cover-upload"
                      />
                      <label htmlFor="event-cover-upload" className="cursor-pointer">
                        {uploadingCover ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">Click to upload cover photo</p>
                            <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x630px</p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <Label>{t('common.title', 'Title')} *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <Label>{t('common.description', 'Description')}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('groups.startDate', 'Start Date')} *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>{t('groups.endDate', 'End Date')}</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('groups.startTime', 'Start Time')}</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>{t('groups.endTime', 'End Time')}</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_online}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_online: checked }))}
                  />
                  <Label>{t('groups.onlineEvent', 'Online Event')}</Label>
                </div>

                {formData.is_online ? (
                  <div>
                    <Label>{t('groups.onlineLink', 'Online Link')}</Label>
                    <Input
                      value={formData.online_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, online_link: e.target.value }))}
                      placeholder="https://zoom.us/..."
                    />
                  </div>
                ) : (
                  <div>
                    <Label>{t('common.location', 'Location')}</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Event location"
                    />
                  </div>
                )}

                <div>
                  <Label>{t('groups.maxAttendees', 'Max Attendees')}</Label>
                  <Input
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_attendees: e.target.value }))}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                  />
                  <Label>{t('groups.publicEvent', 'Make this event public')}</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Public events will appear in the main Events tab for everyone to see
                </p>

                <Button 
                  onClick={createEvent} 
                  disabled={!formData.title.trim() || !formData.start_date || submitting}
                  className="w-full"
                >
                  {submitting ? t('common.creating', 'Creating...') : t('groups.createEvent', 'Create Event')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center border border-border">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t('groups.noEvents', 'No upcoming events')}
          </h3>
          <p className="text-muted-foreground">
            {isAdmin 
              ? t('groups.createFirstEvent', 'Create an event for your group!')
              : t('groups.checkBackLater', 'Check back later for upcoming events')
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/event/${event.id}`)}
            >
              {event.cover_image && (
                <img 
                  src={event.cover_image} 
                  alt={event.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {event.is_public && (
                    <Badge variant="secondary" className="text-xs">Public</Badge>
                  )}
                  {event.is_online && (
                    <Badge variant="outline" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  )}
                </div>

                <h4 className="font-semibold text-foreground mb-2">{event.title}</h4>

                <div className="space-y-1 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.start_date), 'MMM d, yyyy')}</span>
                    {event.start_time && (
                      <>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>{event.start_time}</span>
                      </>
                    )}
                  </div>
                  {!event.is_online && event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.attendee_count} attending</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant={userAttendance[event.id] === 'attending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRSVP(event.id);
                    }}
                    className="gap-1"
                  >
                    <Check className="h-3 w-3" />
                    {userAttendance[event.id] === 'attending' ? 'Going' : 'RSVP'}
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && events.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => fetchEvents(true)} 
            disabled={loadingMore}
          >
            {loadingMore ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupEventsTab;
