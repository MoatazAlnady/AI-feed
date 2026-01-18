import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, MapPin, Users, Globe, Clock, ArrowLeft, 
  MessageCircle, MoreVertical, Image, Trash2, Share2, Crown, Radio
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EventChatWindow from '@/components/EventChatWindow';
import LoadingSpinner from '@/components/LoadingSpinner';
import ShareEventModal from '@/components/ShareEventModal';
import AddToCalendarButton from '@/components/AddToCalendarButton';

interface UnifiedEvent {
  id: string;
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
  max_attendees: number | null;
  category: string | null;
  creator_id: string | null;
  organizer_id: string | null;
  created_at: string | null;
  is_live_stream: boolean | null;
  live_stream_url: string | null;
  live_stream_room_id: string | null;
  timezone: string | null;
  rsvp_email_enabled: boolean | null;
  group_id: string | null;
  creator?: {
    id: string;
    full_name: string;
    profile_photo: string | null;
    handle: string | null;
  };
}

interface Attendee {
  id: string;
  user_id: string;
  status: string;
  user?: {
    full_name: string;
    profile_photo: string | null;
  };
}

const ITEMS_PER_PAGE = 20;

const StandaloneEventProfile: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<UnifiedEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [attendeesPage, setAttendeesPage] = useState(0);
  const [hasMoreAttendees, setHasMoreAttendees] = useState(true);
  const [loadingMoreAttendees, setLoadingMoreAttendees] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const isCreator = user?.id === event?.creator_id || user?.id === event?.organizer_id;

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchAttendees();
    }
  }, [eventId, user?.id]);

  const fetchEvent = async () => {
    try {
      // Query unified events table
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      // Fetch creator profile separately
      const creatorId = data.creator_id || data.organizer_id;
      if (creatorId) {
        const { data: creatorData } = await supabase
          .from('user_profiles')
          .select('id, full_name, profile_photo, handle')
          .eq('id', creatorId)
          .single();
        
        setEvent({ ...data, creator: creatorData || undefined });
      } else {
        setEvent(data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async (loadMore = false) => {
    if (!eventId) return;
    
    try {
      if (loadMore) {
        setLoadingMoreAttendees(true);
      }

      const currentPage = loadMore ? attendeesPage + 1 : 0;
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Query unified event_attendees table
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = data?.map(a => a.user_id) || [];
      let userProfiles: Record<string, { full_name: string; profile_photo: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, profile_photo')
          .in('id', userIds);
        
        profiles?.forEach(p => {
          userProfiles[p.id] = { full_name: p.full_name || '', profile_photo: p.profile_photo };
        });
      }
      
      const attendeesWithUsers = (data || []).map(a => ({
        ...a,
        user: userProfiles[a.user_id]
      }));
      
      if (loadMore) {
        setAttendees(prev => [...prev, ...attendeesWithUsers]);
        setAttendeesPage(currentPage);
      } else {
        setAttendees(attendeesWithUsers);
        setAttendeesPage(0);
        
        // Check if current user is attending
        if (user) {
          const userAttending = data?.some(a => a.user_id === user.id);
          setIsAttending(!!userAttending);
        }
      }
      
      setHasMoreAttendees(data?.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoadingMoreAttendees(false);
    }
  };

  const handleRSVP = async () => {
    if (!user) {
      toast.error('Please log in to RSVP');
      return;
    }

    setRsvpLoading(true);
    try {
      if (isAttending) {
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        setIsAttending(false);
        toast.success(t('events.rsvpCancelled', 'RSVP cancelled'));
      } else {
        const { error } = await supabase
          .from('event_attendees')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status: 'attending'
          });
        
        if (error) throw error;
        setIsAttending(true);
        toast.success(t('events.rsvpConfirmed', 'RSVP confirmed!'));

        // Send RSVP confirmation email
        if (event?.rsvp_email_enabled !== false) {
          try {
            await supabase.functions.invoke('send-rsvp-confirmation', {
              body: { event_id: eventId, user_id: user.id }
            });
          } catch (emailError) {
            console.error('Failed to send RSVP confirmation email:', emailError);
          }
        }
      }
      fetchAttendees();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      toast.success('Event deleted');
      navigate('/community');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `standalone-event-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('events')
        .update({ cover_image_url: publicUrl })
        .eq('id', eventId);

      if (updateError) throw updateError;

      setEvent(prev => prev ? { ...prev, cover_image_url: publicUrl } : null);
      toast.success('Cover photo updated');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover photo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const spotsLeft = event.max_attendees ? event.max_attendees - attendees.length : null;
  
  // Live stream info
  const isLiveStream = event.is_live_stream;
  const liveStreamUrl = event.live_stream_url || (event.live_stream_room_id 
    ? `${window.location.origin}/live/${event.live_stream_room_id}` 
    : null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 bg-gradient-to-br from-primary/20 to-primary/5 relative">
          {event.cover_image_url && (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        </div>

        {/* Back Button & Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back', 'Back')}
          </Button>

          {isCreator && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <label className="cursor-pointer flex items-center">
                    <Image className="h-4 w-4 mr-2" />
                    {t('events.changeCover', 'Change Cover Photo')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </label>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDeleteEvent}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('events.deleteEvent', 'Delete Event')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Gold Badge */}
        <Badge className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0">
          <Crown className="h-3 w-3 mr-1" />
          Gold Event
        </Badge>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-8">
        <Card>
          <CardContent className="p-6">
            {/* Category Badge */}
            {event.category && (
              <Badge variant="secondary" className="mb-3">
                {event.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {event.title}
            </h1>

            {/* Creator */}
            <div 
              className="flex items-center gap-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/creator/${event.creator?.handle || event.creator_id || event.organizer_id}`)}
            >
              <Avatar>
                <AvatarImage src={event.creator?.profile_photo || undefined} />
                <AvatarFallback>
                  {(event.creator?.full_name || 'U').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{event.creator?.full_name}</p>
                <p className="text-sm text-muted-foreground">{t('events.organizer', 'Organizer')}</p>
              </div>
            </div>

            {/* Event Info */}
            <div className="grid gap-4 mb-6">
              <div className="flex items-center gap-3 text-foreground">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">
                    {format(eventDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  {event.event_end_date && (
                    <p className="text-sm text-muted-foreground">
                      to {format(new Date(event.event_end_date), 'MMMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <p>{format(eventDate, 'h:mm a')}</p>
              </div>

              {event.is_online ? (
                <div className="flex items-center gap-3 text-foreground">
                  <Globe className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{t('events.onlineEvent', 'Online Event')}</p>
                    {event.online_link && isAttending && (
                      <a 
                        href={event.online_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {t('events.joinLink', 'Join Meeting')}
                      </a>
                    )}
                  </div>
                </div>
              ) : event.location && (
                <div className="flex items-center gap-3 text-foreground">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <p>{event.location}</p>
                </div>
              )}

              {/* Live Stream Badge */}
              {isLiveStream && (
                <div className="flex items-center gap-3 text-foreground">
                  <Radio className="h-5 w-5 text-destructive animate-pulse shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">{t('events.liveStreamEvent', 'Live Stream Event')}</p>
                    {liveStreamUrl && isAttending && (
                      <a 
                        href={liveStreamUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {t('events.joinStream', 'Join Stream')}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-foreground">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <p>
                  {attendees.length} {t('events.attending', 'attending')}
                  {spotsLeft !== null && spotsLeft > 0 && (
                    <span className="text-muted-foreground"> · {spotsLeft} spots left</span>
                  )}
                </p>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-2">
                  {t('events.about', 'About this event')}
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={handleRSVP}
                disabled={rsvpLoading || (spotsLeft !== null && spotsLeft <= 0 && !isAttending)}
                variant={isAttending ? 'outline' : 'default'}
                className="flex-1 sm:flex-none"
              >
                {rsvpLoading ? (
                  t('common.loading', 'Loading...')
                ) : isAttending ? (
                  t('events.cancelRSVP', 'Cancel RSVP')
                ) : (
                  t('events.rsvp', 'RSVP')
                )}
              </Button>

              {isAttending && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowChat(true)}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t('events.openChat', 'Open Chat')}
                  </Button>

                  {/* Add to Calendar Button */}
                  <AddToCalendarButton 
                    event={{
                      title: event.title,
                      description: event.description,
                      event_date: event.event_date,
                      event_end_date: event.event_end_date,
                      start_time: event.start_time,
                      end_time: event.end_time,
                      location: event.location,
                      is_online: event.is_online,
                      online_link: event.online_link || liveStreamUrl,
                      timezone: event.timezone,
                    }}
                    isAttending={true}
                  />
                </>
              )}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-foreground mb-3">
                  {t('events.attendees', 'Attendees')} ({attendees.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((attendee) => (
                    <Avatar key={attendee.id} className="border-2 border-background">
                      <AvatarImage src={attendee.user?.profile_photo || undefined} />
                      <AvatarFallback className="text-xs">
                        {(attendee.user?.full_name || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {/* Load More Attendees */}
                {hasMoreAttendees && (
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchAttendees(true)} 
                      disabled={loadingMoreAttendees}
                    >
                      {loadingMoreAttendees ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Sheet */}
      <Sheet open={showChat} onOpenChange={setShowChat}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('events.eventChat', 'Event Chat')}</SheetTitle>
          </SheetHeader>
          <EventChatWindow
            eventId={event.id}
            eventType="standalone_event"
            eventTitle={event.title}
            onClose={() => setShowChat(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Share Event Modal */}
      {event && (
        <ShareEventModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          event={event}
          eventType="standalone_event"
        />
      )}
    </div>
  );
};

export default StandaloneEventProfile;
