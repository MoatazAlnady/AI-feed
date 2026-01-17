import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Video,
  Users,
  Check,
  X,
  MessageSquare,
  Image,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SEOHead from '@/components/SEOHead';

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
  created_by: string;
  created_at: string;
}

interface EventDiscussion {
  id: string;
  event_id: string;
  author_id: string;
  title: string;
  content: string | null;
  created_at: string;
  author?: {
    full_name: string;
    profile_photo: string | null;
  };
}

interface EventPost {
  id: string;
  event_id: string;
  author_id: string;
  content: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: {
    full_name: string;
    profile_photo: string | null;
  };
}

interface EventAttendee {
  id: string;
  user_id: string;
  status: string;
  user?: {
    full_name: string;
    profile_photo: string | null;
  };
}

const EventProfile: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<GroupEvent | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [discussions, setDiscussions] = useState<EventDiscussion[]>([]);
  const [posts, setPosts] = useState<EventPost[]>([]);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [userAttendance, setUserAttendance] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchDiscussions();
      fetchPosts();
      fetchAttendees();
    }
  }, [eventId]);

  useEffect(() => {
    if (user && eventId) {
      fetchUserAttendance();
    }
  }, [user, eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('group_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);

      // Fetch group name
      if (data.group_id) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('name')
          .eq('id', data.group_id)
          .single();
        
        if (groupData) {
          setGroupName(groupData.name);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('group_event_discussions')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author info
      const discussionsWithAuthors = await Promise.all(
        (data || []).map(async (discussion) => {
          const { data: authorData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', discussion.author_id)
            .single();
          return { ...discussion, author: authorData };
        })
      );

      setDiscussions(discussionsWithAuthors);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('group_event_posts')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author info
      const postsWithAuthors = await Promise.all(
        (data || []).map(async (post) => {
          const { data: authorData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', post.author_id)
            .single();
          return { ...post, author: authorData };
        })
      );

      setPosts(postsWithAuthors);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('group_event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'attending')
        .limit(10);

      if (error) throw error;

      // Fetch user info
      const attendeesWithUsers = await Promise.all(
        (data || []).map(async (attendee) => {
          const { data: userData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', attendee.user_id)
            .single();
          return { ...attendee, user: userData };
        })
      );

      setAttendees(attendeesWithUsers);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    }
  };

  const fetchUserAttendance = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('group_event_attendees')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      setUserAttendance(data?.status || null);
    } catch (error) {
      console.error('Error fetching user attendance:', error);
    }
  };

  const handleRSVP = async (status: 'attending' | 'maybe' | 'not_attending') => {
    if (!user) {
      toast.error('Please log in to RSVP');
      return;
    }

    try {
      if (userAttendance) {
        // Update existing
        const { error } = await supabase
          .from('group_event_attendees')
          .update({ status })
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('group_event_attendees')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status
          });

        if (error) throw error;
      }

      setUserAttendance(status);
      fetchAttendees();
      toast.success('RSVP updated!');
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP');
    }
  };

  const createPost = async () => {
    if (!user || !newPostContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('group_event_posts')
        .insert({
          event_id: eventId,
          author_id: user.id,
          content: newPostContent.trim()
        });

      if (error) throw error;

      setNewPostContent('');
      fetchPosts();
      toast.success('Post created!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const createDiscussion = async () => {
    if (!user || !newDiscussionTitle.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('group_event_discussions')
        .insert({
          event_id: eventId,
          author_id: user.id,
          title: newDiscussionTitle.trim(),
          content: newDiscussionContent.trim() || null
        });

      if (error) throw error;

      setNewDiscussionTitle('');
      setNewDiscussionContent('');
      setShowNewDiscussion(false);
      fetchDiscussions();
      toast.success('Discussion started!');
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Failed to create discussion');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Event not found</h2>
          <Button onClick={() => navigate('/community')}>Back to Community</Button>
        </div>
      </div>
    );
  }

  const formatEventDate = () => {
    const startDate = format(new Date(event.start_date), 'EEEE, MMMM d, yyyy');
    const endDate = event.end_date ? format(new Date(event.end_date), 'EEEE, MMMM d, yyyy') : null;
    
    if (endDate && event.end_date !== event.start_date) {
      return `${startDate} - ${endDate}`;
    }
    return startDate;
  };

  const formatEventTime = () => {
    if (!event.start_time) return null;
    
    const startTime = event.start_time;
    const endTime = event.end_time;
    
    if (endTime) {
      return `${startTime} - ${endTime}`;
    }
    return startTime;
  };

  const coverImage = event.cover_image || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <>
      <SEOHead
        title={`${event.title} - Event`}
        description={event.description || `Join ${event.title}`}
        url={`https://aifeed.app/event/${eventId}`}
      />

      <div className="min-h-screen bg-muted/50">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 lg:h-80">
          <img
            src={coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-black/30 text-white hover:bg-black/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Event Details */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-card rounded-2xl shadow-lg p-6 mb-6">
            {/* Group Badge */}
            {groupName && (
              <Badge 
                variant="secondary" 
                className="mb-3 cursor-pointer"
                onClick={() => navigate(`/group/${event.group_id}`)}
              >
                From: {groupName}
              </Badge>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {event.title}
            </h1>

            {/* Event Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{formatEventDate()}</span>
              </div>
              
              {formatEventTime() && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{formatEventTime()}</span>
                </div>
              )}

              {event.is_online ? (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Video className="h-5 w-5 text-primary" />
                  <span>Online Event</span>
                  {event.online_link && userAttendance === 'attending' && (
                    <a 
                      href={event.online_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Join Link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ) : event.location && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-muted-foreground">
                <Users className="h-5 w-5 text-primary" />
                <span>{attendees.length} attending</span>
                {event.max_attendees && (
                  <span className="text-xs">/ {event.max_attendees} max</span>
                )}
              </div>
            </div>

            {/* RSVP Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={userAttendance === 'attending' ? 'default' : 'outline'}
                onClick={() => handleRSVP('attending')}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Going
              </Button>
              <Button
                variant={userAttendance === 'maybe' ? 'default' : 'outline'}
                onClick={() => handleRSVP('maybe')}
                className="gap-2"
              >
                Maybe
              </Button>
              <Button
                variant={userAttendance === 'not_attending' ? 'default' : 'outline'}
                onClick={() => handleRSVP('not_attending')}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Can't Go
              </Button>
            </div>

            {/* Attendees Preview */}
            {attendees.length > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  {attendees.slice(0, 5).map((attendee) => (
                    <Avatar key={attendee.id} className="border-2 border-background w-8 h-8">
                      <AvatarImage src={attendee.user?.profile_photo || undefined} />
                      <AvatarFallback className="text-xs">
                        {(attendee.user?.full_name || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {attendees.length > 5 && (
                  <span className="text-sm text-muted-foreground">
                    +{attendees.length - 5} more
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">About this event</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Combined Feed - Discussions and Posts */}
          <div className="space-y-6 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Activity
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowNewDiscussion(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Discussion
              </Button>
            </div>

            {/* New Discussion Form */}
            {showNewDiscussion && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <Input
                  placeholder="Discussion title..."
                  value={newDiscussionTitle}
                  onChange={(e) => setNewDiscussionTitle(e.target.value)}
                  className="mb-3"
                />
                <Textarea
                  placeholder="What would you like to discuss? (optional)"
                  value={newDiscussionContent}
                  onChange={(e) => setNewDiscussionContent(e.target.value)}
                  rows={3}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button onClick={createDiscussion} disabled={!newDiscussionTitle.trim() || submitting}>
                    Create Discussion
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewDiscussion(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* New Post Form */}
            {user && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <Textarea
                  placeholder="Share something about this event..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={2}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button onClick={createPost} disabled={!newPostContent.trim() || submitting}>
                    <Image className="h-4 w-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            )}

            {/* Combined Feed */}
            {discussions.length === 0 && posts.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center border border-border">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
                <p className="text-muted-foreground">Be the first to post or start a discussion!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sort and display discussions and posts together by date */}
                {[
                  ...discussions.map(d => ({ type: 'discussion' as const, data: d, date: new Date(d.created_at) })),
                  ...posts.map(p => ({ type: 'post' as const, data: p, date: new Date(p.created_at) }))
                ]
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((item) => {
                    if (item.type === 'discussion') {
                      const discussion = item.data as EventDiscussion;
                      return (
                        <div key={`discussion-${discussion.id}`} className="bg-card rounded-xl p-4 border border-border">
                          <div className="flex items-center gap-1 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Discussion
                            </Badge>
                          </div>
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={discussion.author?.profile_photo || undefined} />
                              <AvatarFallback>
                                {(discussion.author?.full_name || 'U').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{discussion.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {discussion.author?.full_name} • {format(new Date(discussion.created_at), 'MMM d, yyyy')}
                              </p>
                              {discussion.content && (
                                <p className="text-foreground">{discussion.content}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const post = item.data as EventPost;
                      return (
                        <div key={`post-${post.id}`} className="bg-card rounded-xl p-4 border border-border">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={post.author?.profile_photo || undefined} />
                              <AvatarFallback>
                                {(post.author?.full_name || 'U').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground mb-2">
                                {post.author?.full_name} • {format(new Date(post.created_at), 'MMM d, yyyy')}
                              </p>
                              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                              {post.media_urls && post.media_urls.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  {post.media_urls.map((url, idx) => (
                                    <img 
                                      key={idx} 
                                      src={url} 
                                      alt="" 
                                      className="rounded-lg object-cover w-full h-48"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EventProfile;
