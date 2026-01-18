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
  ChevronRight,
  UserPlus
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import InviteToEventModal from './InviteToEventModal';

interface GroupEvent {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string;
  event_end_date: string | null;
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
  const [inviteModal, setInviteModal] = useState<{
    isOpen: boolean;
    eventId: string;
    isPublic: boolean;
    title: string;
  } | null>(null);

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

      // Query unified events table with group_id filter
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('group_id', groupId)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const newEvents = data || [];
      const eventIds = newEvents.map(e => e.id);

      // Batch fetch attendee counts from unified event_attendees table
      let countMap: Record<string, number> = {};
      if (eventIds.length > 0) {
        const { data: attendeeCounts } = await supabase
          .from('event_attendees')
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
      // Get all events for this group first
      const { data: groupEvents } = await supabase
        .from('events')
        .select('id')
        .eq('group_id', groupId);

      if (!groupEvents || groupEvents.length === 0) {
        setUserAttendance({});
        return;
      }

      const eventIds = groupEvents.map(e => e.id);

      // Query unified event_attendees table
      const { data } = await supabase
        .from('event_attendees')
        .select('event_id, status')
        .eq('user_id', user.id)
        .in('event_id', eventIds);

      const attendance: Record<string, string> = {};
      data?.forEach(a => {
        attendance[a.event_id] = a.status;
      });
      setUserAttendance(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleRSVP = async (eventId: string, newStatus?: string) => {
    if (!user) {
      toast.error('Please log in to RSVP');
      return;
    }

    try {
      const currentStatus = userAttendance[eventId];
      const targetStatus = newStatus || (currentStatus === 'attending' ? 'not_attending' : 'attending');
      
      if (targetStatus === 'not_attending' || targetStatus === 'undecided') {
        // Remove RSVP from unified event_attendees table
        await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        setUserAttendance(prev => {
          const newState = { ...prev };
          delete newState[eventId];
          return newState;
        });
        toast.success('RSVP updated');
      } else {
        // Add/Update RSVP in unified event_attendees table
        if (currentStatus) {
          await supabase
            .from('event_attendees')
            .update({ status: targetStatus })
            .eq('event_id', eventId)
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('event_attendees')
            .insert({
              event_id: eventId,
              user_id: user.id,
              status: targetStatus
            });
        }
        
        setUserAttendance(prev => ({ ...prev, [eventId]: targetStatus }));
        toast.success(targetStatus === 'attending' ? "You're attending!" : 'RSVP updated');
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
      // Insert into unified events table with group_id
      const { error } = await supabase
        .from('events')
        .insert({
          group_id: groupId,
          creator_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          cover_image_url: formData.cover_image || null,
          event_date: formData.start_date,
          event_end_date: formData.end_date || null,
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
                  <Label>{t('groups.publicEvent', 'Public Event')}</Label>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button 
                    onClick={createEvent} 
                    disabled={!formData.title.trim() || !formData.start_date || submitting}
                  >
                    {submitting ? t('common.creating', 'Creating...') : t('groups.createEvent', 'Create Event')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {t('groups.noUpcomingEvents', 'No upcoming events')}
          </p>
          {canCreateEvents && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('groups.createFirstEvent', 'Create the first event')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isAttending = userAttendance[event.id] === 'attending';
            
            return (
              <div 
                key={event.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
              >
                {/* Cover Image */}
                {event.cover_image_url && (
                  <img 
                    src={event.cover_image_url} 
                    alt={event.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Title */}
                      <h4 
                        className="font-semibold text-foreground hover:text-primary cursor-pointer"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        {event.title}
                      </h4>
                      
                      {/* Date & Time */}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(event.event_date), 'MMM d, yyyy')}
                            {event.event_end_date && event.event_end_date !== event.event_date && (
                              <> - {format(new Date(event.event_end_date), 'MMM d, yyyy')}</>
                            )}
                          </span>
                        </div>
                        
                        {event.start_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {event.start_time}
                              {event.end_time && ` - ${event.end_time}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        {event.is_online ? (
                          <>
                            <Video className="h-4 w-4" />
                            <span>{t('groups.onlineEvent', 'Online Event')}</span>
                          </>
                        ) : event.location ? (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </>
                        ) : null}
                      </div>

                      {/* Attendees */}
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.attendee_count} {t('groups.attending', 'attending')}
                          {event.max_attendees && ` / ${event.max_attendees} max`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant={isAttending ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRSVP(event.id)}
                        className="gap-1"
                      >
                        {isAttending ? (
                          <>
                            <Check className="h-4 w-4" />
                            {t('groups.attending', 'Attending')}
                          </>
                        ) : (
                          t('groups.rsvp', 'RSVP')
                        )}
                      </Button>

                      {isMember && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInviteModal({
                            isOpen: true,
                            eventId: event.id,
                            isPublic: event.is_public,
                            title: event.title
                          })}
                          className="gap-1"
                        >
                          <UserPlus className="h-4 w-4" />
                          {t('groups.invite', 'Invite')}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/event/${event.id}`)}
                        className="gap-1"
                      >
                        <ChevronRight className="h-4 w-4" />
                        {t('common.viewDetails', 'View')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchEvents(true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    {t('common.loading', 'Loading...')}
                  </>
                ) : (
                  t('common.loadMore', 'Load More')
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModal && (
        <InviteToEventModal
          isOpen={inviteModal.isOpen}
          onClose={() => setInviteModal(null)}
          eventId={inviteModal.eventId}
          groupId={groupId}
          isPublic={inviteModal.isPublic}
          eventTitle={inviteModal.title}
        />
      )}
    </div>
  );
};

export default GroupEventsTab;