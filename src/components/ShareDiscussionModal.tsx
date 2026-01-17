import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Users, Search, Send, Globe, UsersRound, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useChatDock } from '../context/ChatDockContext';
import AuthModal from './AuthModal';

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
}

interface ShareDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  discussion: {
    id: string;
    title: string;
    subtitle?: string | null;
    content?: string | null;
    poll_options?: any[] | null;
    group_id: string;
  };
  groupName: string;
  onShare?: () => void;
}

const ShareDiscussionModal: React.FC<ShareDiscussionModalProps> = ({
  isOpen,
  onClose,
  discussion,
  groupName,
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

  const discussionUrl = `${window.location.origin}/group/${discussion.group_id}?discussion=${discussion.id}`;
  const hasPoll = discussion.poll_options && discussion.poll_options.length > 0;

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

      setConnections((profilesData || []).map((profile: any) => ({
        id: profile.id,
        name: profile.full_name || 'Unknown User',
        avatar: profile.profile_photo,
        title: profile.job_title || ''
      })));
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
      await navigator.clipboard.writeText(discussionUrl);
      toast({ title: "Link copied!" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleExternalShare = () => {
    if (navigator.share) {
      navigator.share({
        title: discussion.title,
        text: `Check out this discussion: ${discussion.title}`,
        url: discussionUrl,
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
      const { error } = await supabase.from('shared_posts').insert({
        user_id: user.id,
        original_discussion_id: discussion.id,
        share_text: shareText.trim() || null,
        visibility: visibility,
        content_type: 'discussion'
      });

      if (error) throw error;

      toast({ title: "Discussion shared!", description: "Your followers will see it!" });
      onShare?.();
      onClose();
      setShareText('');
    } catch (error) {
      console.error('Error sharing discussion:', error);
      toast({ title: "Error", description: "Failed to share.", variant: "destructive" });
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

      const messageContent = `💬 Shared a discussion with you:\n\n**${discussion.title}**\n${hasPoll ? '📊 Includes a poll\n' : ''}From: ${groupName}\n\n🔗 View: ${discussionUrl}`;

      await supabase.from('conversation_messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: messageContent
      });

      toast({ title: "Discussion sent!", description: `Shared with ${selectedConnection.name}` });
      onShare?.();
      onClose();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSendingToConnection(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Share Discussion</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>

          <div className="p-4 space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {hasPoll ? <BarChart3 className="h-5 w-5 text-primary" /> : <MessageSquare className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground line-clamp-2">{discussion.title}</h3>
                  {discussion.subtitle && <p className="text-sm text-muted-foreground line-clamp-1">{discussion.subtitle}</p>}
                  <Badge variant="outline" className="mt-2 text-xs">{groupName}</Badge>
                  {hasPoll && <Badge className="mt-2 ml-2 bg-primary/10 text-primary text-xs">Poll</Badge>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={handleExternalShare} variant="outline" className="flex-1"><Share2 className="h-4 w-4 mr-2" />Share</Button>
                <Button onClick={handleCopyLink} variant="outline" className="flex-1"><Copy className="h-4 w-4 mr-2" />Copy Link</Button>
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
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                            <span className="text-sm font-medium truncate">{conn.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                    {selectedConnection && (
                      <Button onClick={handleSendToConnection} disabled={isSendingToConnection} className="w-full">
                        <Send className="h-4 w-4 mr-2" />{isSendingToConnection ? 'Sending...' : `Send`}
                      </Button>
                    )}
                    <Button onClick={() => { setShowConnectionSearch(false); setSelectedConnection(null); }} variant="ghost" size="sm" className="w-full">Cancel</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Share to Feed</h3>
                <div className="flex gap-2">
                  <Button variant={visibility === 'public' ? 'default' : 'outline'} size="sm" onClick={() => setVisibility('public')} className="flex-1">
                    <Globe className="h-3 w-3 mr-1" />Public
                  </Button>
                  <Button variant={visibility === 'connections' ? 'default' : 'outline'} size="sm" onClick={() => setVisibility('connections')} className="flex-1">
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

export default ShareDiscussionModal;
