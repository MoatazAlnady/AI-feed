import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Calendar, MapPin, Globe, Share2, Heart, MessageCircle, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import { format } from 'date-fns';

interface SharedEventCardProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    cover_image?: string | null;
    event_date?: string;
    start_date?: string;
    location?: string | null;
    is_online?: boolean;
    interests?: string[];
    tags?: string[];
  };
  eventType: 'group_event' | 'standalone_event';
  sharedBy: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  shareText: string;
  sharedAt: string;
  groupName?: string;
  onShare: (event: any, eventType: string) => void;
}

const SharedEventCard: React.FC<SharedEventCardProps> = ({
  event,
  eventType,
  sharedBy,
  shareText,
  sharedAt,
  groupName,
  onShare
}) => {
  const navigate = useNavigate();
  const eventDate = event.event_date || event.start_date;
  const eventUrl = eventType === 'group_event' ? `/event/${event.id}` : `/standalone-event/${event.id}`;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-3 bg-muted/50 flex items-center gap-2 text-sm border-b">
        <RefreshCw className="h-3 w-3 text-muted-foreground" />
        <ProfileHoverCard userId={sharedBy.id}>
          <Link to={getCreatorProfileLink({ id: sharedBy.id, handle: sharedBy.handle })} className="font-medium hover:underline">
            {sharedBy.name}
          </Link>
        </ProfileHoverCard>
        <span className="text-muted-foreground">shared an event • {sharedAt}</span>
        <Badge variant="outline" className="ml-auto flex items-center gap-1">
          <Calendar className="h-3 w-3" />Event
        </Badge>
      </div>

      {shareText && (
        <div className="px-6 py-3 border-b">
          <p className="text-sm text-foreground italic">"{shareText}"</p>
        </div>
      )}

      <div className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(eventUrl)}>
        {event.cover_image && (
          <img src={event.cover_image} alt={event.title} className="w-full h-36 object-cover" />
        )}
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            {!event.cover_image && eventDate && (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-medium text-primary uppercase">{format(new Date(eventDate), 'MMM')}</span>
                <span className="text-xl font-bold text-primary">{format(new Date(eventDate), 'd')}</span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-2 mb-2">{event.title}</h3>

              <div className="space-y-1 mb-2">
                {eventDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(eventDate), 'EEEE, MMMM d · h:mm a')}
                  </div>
                )}
                {event.is_online ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />Online Event
                  </div>
                ) : event.location ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />{event.location}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {groupName && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />{groupName}
                  </Badge>
                )}
                {event.interests?.slice(0, 2).map((interest, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5">{interest}</Badge>
                ))}
                {event.tags?.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t flex gap-4">
        <Button variant="ghost" size="sm"><Heart className="h-4 w-4 mr-1" />Like</Button>
        <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4 mr-1" />Comment</Button>
        <Button variant="ghost" size="sm" onClick={() => onShare(event, eventType)}><Share2 className="h-4 w-4 mr-1" />Share</Button>
        <Link to={eventUrl} className="ml-auto">
          <Button variant="outline" size="sm">RSVP</Button>
        </Link>
      </div>
    </div>
  );
};

export default SharedEventCard;
