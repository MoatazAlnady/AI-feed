import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Globe, Users, Share2, Sparkles, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import TranslateButton from '@/components/TranslateButton';
import { format } from 'date-fns';

interface FeedEventCardProps {
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
    created_by?: string;
    creator_id?: string;
    created_at?: string;
    group_id?: string | null;
    detected_language?: string | null;
  };
  creator?: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  groupName?: string;
  onShare: (event: any) => void;
  isNew?: boolean;
}

const FeedEventCard: React.FC<FeedEventCardProps> = ({ 
  event, 
  creator, 
  groupName,
  onShare, 
  isNew = false 
}) => {
  const navigate = useNavigate();
  const eventDate = event.event_date || event.start_date;
  // Use group_id presence to determine URL
  const eventUrl = event.group_id ? `/event/${event.id}` : `/standalone-event/${event.id}`;
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
      {creator && (
        <div className="px-6 py-3 bg-muted/50 border-b flex items-center gap-3">
          <ProfileHoverCard userId={creator.id}>
            <Link to={`/creator/${creator.handle || creator.id}`} className="flex items-center gap-2">
              {creator.avatar ? (
                <img src={creator.avatar} alt={creator.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">{creator.name.charAt(0)}</span>
                </div>
              )}
              <span className="font-medium text-sm hover:underline">{creator.name}</span>
            </Link>
          </ProfileHoverCard>
          <span className="text-muted-foreground text-sm">
            {isNew ? 'created an event' : 'shared an event'}
          </span>
          {isNew && (
            <Badge variant="secondary" className="ml-auto flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Sparkles className="h-3 w-3" />New
            </Badge>
          )}
          <Badge variant="outline" className={`${!isNew ? 'ml-auto' : ''} flex items-center gap-1`}>
            <Calendar className="h-3 w-3" />Event
          </Badge>
        </div>
      )}

      <div className="cursor-pointer" onClick={() => navigate(eventUrl)}>
        {event.cover_image && (
          <img src={event.cover_image} alt={event.title} className="w-full h-40 object-cover" />
        )}
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            {!event.cover_image && (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center shrink-0">
                {eventDate && (
                  <>
                    <span className="text-xs font-medium text-primary uppercase">
                      {format(new Date(eventDate), 'MMM')}
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {format(new Date(eventDate), 'd')}
                    </span>
                  </>
                )}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">
                {event.title}
              </h3>

              <div className="space-y-1 mb-3">
                {eventDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    {format(new Date(eventDate), 'EEEE, MMMM d · h:mm a')}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {event.is_online ? (
                    <>
                      <Globe className="h-4 w-4 shrink-0" />
                      Online Event
                    </>
                  ) : event.location ? (
                    <>
                      <MapPin className="h-4 w-4 shrink-0" />
                      {event.location}
                    </>
                  ) : null}
                </div>
              </div>

              {(translatedDescription || event.description) && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {translatedDescription || event.description}
                </p>
              )}

              {/* Translate Button */}
              {event.description && (
                <TranslateButton
                  contentType="event"
                  contentId={event.id}
                  originalText={event.description}
                  detectedLanguage={event.detected_language || undefined}
                  onTranslated={setTranslatedDescription}
                  className="mb-2"
                />
              )}

              <div className="flex flex-wrap items-center gap-2">
                {groupName && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {groupName}
                  </Badge>
                )}
                {event.interests?.slice(0, 4).map((interest, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5">{interest}</Badge>
                ))}
                {event.tags?.slice(0, 4).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onShare(event); }}>
          <Share2 className="h-4 w-4 mr-1" />Share
        </Button>
        <Link to={eventUrl}>
          <Button variant="outline" size="sm">RSVP</Button>
        </Link>
      </div>
    </div>
  );
};

export default FeedEventCard;
