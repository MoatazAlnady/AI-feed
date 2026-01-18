import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Users, Search, Send, Globe, UsersRound, Calendar, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useChatDock } from '../context/ChatDockContext';
import AuthModal from './AuthModal';
import { format } from 'date-fns';

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
}

interface ShareEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    description?: string | null;
    cover_image?: string | null;
    event_date?: string;
    start_date?: string;
    location?: string | null;
    is_online?: boolean;
  };
  eventType: 'group_event' | 'standalone_event';
  onShare?: () => void;
}

const ShareEventModal: React.FC<ShareEventModalProps> = ({
  isOpen,
  onClose,
  event,
  eventType,
  onShare
}) => {
  const [shareText, setShareText] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showConnectionSearch, setShowConnectionSearch] = useState(false);
  const [connectionSearchTerm, setConnectionSearchTerm] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isSendingToConnection, setIsSendingToConnection] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'connections'>('public');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { openChatWith } = useChatDock();

  const eventDate = event.event_date || event.start_date;
  const eventUrl = eventType === 'group_event' 
    ? `${window.location.origin}/event/${event.id}` 
    : `${window.location.origin}/standalone-event/${event.id}`;

  useEffect(() => {
    if (showConnectionSearch && user) {
      fetchConnections();
    }
  }, [showConnectionSearch, user]);

  const fetchConnections = async () => {
    if (!user) return;
    setLoadingConnections(true);
    
    try {
      const { data: connectionsData } = await supabase
        .from('connections')
        .select('id, user_1_id, user_2_id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      if (!connectionsData || connectionsData.length === 0) {
        setConnections([]);
        return;
      }

      const connectionUserIds = connectionsData.map(conn => 
        conn.user_1_id === user.id ? conn.user_2_id : conn.user_1_id
      );

      const { data: profilesData } = await supabase.rpc(
        'get_public_profiles_by_ids',
        { ids: connectionUserIds }
      );

      const formattedConnections: Connection[] = (profilesData || []).map((profile: any) => ({
        id: profile.id,
        name: profile.full_name || 'Unknown User',
        avatar: profile.profile_photo,
        title: profile.job_title || ''
      }));

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(connectionSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast({ title: "Link copied!", description: "Event link copied to clipboard." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
    }
  };

  const handleExternalShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description || `Check out this event: ${event.title}`,
        url: eventUrl,
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  const handleInternalShare = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsSharing(true);

    try {
      const insertData: any = {
        user_id: user.id,
        share_text: shareText.trim() || null,
        visibility: visibility,
        content_type: 'event',
        original_event_id: event.id
      };

      const { error } = await supabase.from('shared_posts').insert(insertData);

      if (error) throw error;

      toast({ title: "Event shared!", description: "Event shared to your feed!" });
      onShare?.();
      onClose();
      setShareText('');
    } catch (error) {
      console.error('Error sharing event:', error);
      toast({ title: "Error", description: "Failed to share event.", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const handleSendToConnection = async () => {
    if (!user || !selectedConnection) return;

    setIsSendingToConnection(true);

    try {
      await openChatWith(selectedConnection.id, { createIfMissing: true });

      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${selectedConnection.id}),and(participant_1_id.eq.${selectedConnection.id},participant_2_id.eq.${user.id})`)
        .single();

      let conversationId = existingConvo?.id;

      if (!conversationId) {
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert({ participant_1_id: user.id, participant_2_id: selectedConnection.id })
          .select('id')
          .single();
        conversationId = newConvo?.id;
      }

      const dateStr = eventDate ? format(new Date(eventDate), 'MMM d, yyyy') : '';
      const messageContent = `📅 Shared an event with you:\n\n**${event.title}**\n${dateStr}\n${event.location || (event.is_online ? 'Online' : '')}\n\n🔗 View event: ${eventUrl}`;

      await supabase.from('conversation_messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: messageContent
      });

      toast({ title: "Event sent!", description: `Event shared with ${selectedConnection.name}` });
      onShare?.();
      onClose();
    } catch (error) {
      console.error('Error sending to connection:', error);
      toast({ title: "Error", description: "Failed to send event.", variant: "destructive" });
    } finally {
      setIsSendingToConnection(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Share Event</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              {event.cover_image && (
                <img src={event.cover_image} alt={event.title} className="w-full h-24 object-cover rounded-lg mb-2" />
              )}
              <h3 className="font-medium text-foreground">{event.title}</h3>
              {eventDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(eventDate), 'EEEE, MMMM d, yyyy')}
                </div>
              )}
              {(event.location || event.is_online) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  {event.is_online ? 'Online Event' : event.location}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Share Externally</h3>
                <div className="flex gap-2">
                  <Button onClick={handleExternalShare} variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />Share
                  </Button>
                  <Button onClick={handleCopyLink} variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />Copy Link
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Send to Connection</h3>
                {!showConnectionSearch ? (
                  <Button onClick={() => user ? setShowConnectionSearch(true) : setShowAuthModal(true)} variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />Choose a Connection
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={connectionSearchTerm} onChange={(e) => setConnectionSearchTerm(e.target.value)} placeholder="Search..." className="pl-10" />
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                      {loadingConnections ? (
                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                      ) : filteredConnections.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No connections</div>
                      ) : (
                        filteredConnections.map(conn => (
                          <button key={conn.id} onClick={() => setSelectedConnection(conn)} className={`w-full flex items-center gap-3 p-3 hover:bg-muted ${selectedConnection?.id === conn.id ? 'bg-primary/10' : ''}`}>
                            <Avatar className="h-8 w-8"><AvatarImage src={conn.avatar} /><AvatarFallback>{conn.name.charAt(0)}</AvatarFallback></Avatar>
                            <span className="text-sm font-medium text-foreground truncate">{conn.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                    {selectedConnection && (
                      <Button onClick={handleSendToConnection} disabled={isSendingToConnection} className="w-full">
                        <Send className="h-4 w-4 mr-2" />{isSendingToConnection ? 'Sending...' : `Send to ${selectedConnection.name}`}
                      </Button>
                    )}
                    <Button onClick={() => { setShowConnectionSearch(false); setSelectedConnection(null); }} variant="ghost" size="sm" className="w-full">Cancel</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Share to Feed</h3>
                <div className="flex gap-2">
                  <Button type="button" variant={visibility === 'public' ? 'default' : 'outline'} size="sm" onClick={() => setVisibility('public')} className="flex-1">
                    <Globe className="h-3 w-3 mr-1" />Public
                  </Button>
                  <Button type="button" variant={visibility === 'connections' ? 'default' : 'outline'} size="sm" onClick={() => setVisibility('connections')} className="flex-1">
                    <UsersRound className="h-3 w-3 mr-1" />Connections
                  </Button>
                </div>
                <Textarea value={shareText} onChange={(e) => setShareText(e.target.value)} placeholder="Add your thoughts..." className="resize-none" rows={3} maxLength={500} />
                <Button onClick={handleInternalShare} disabled={isSharing} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />{isSharing ? 'Sharing...' : 'Share to Feed'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default ShareEventModal;
