import React, { useState, useEffect } from 'react';
import { X, Share2, MessageSquare, Copy, Users, Search, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useChatDock } from '../context/ChatDockContext';

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
}

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    user_id: string;
    image_url?: string;
    video_url?: string;
    link_url?: string;
    shares?: number;
  };
  onShare?: () => void;
}

const SharePostModal: React.FC<SharePostModalProps> = ({
  isOpen,
  onClose,
  post,
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { openChatWith } = useChatDock();

  useEffect(() => {
    if (showConnectionSearch && user) {
      fetchConnections();
    }
  }, [showConnectionSearch, user]);

  const fetchConnections = async () => {
    if (!user) return;
    setLoadingConnections(true);
    
    try {
      // Fetch connections where user is either user_1 or user_2
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('id, user_1_id, user_2_id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      if (connectionsError) throw connectionsError;

      if (!connectionsData || connectionsData.length === 0) {
        setConnections([]);
        return;
      }

      // Get the other user's ID from each connection
      const connectionUserIds = connectionsData.map(conn => 
        conn.user_1_id === user.id ? conn.user_2_id : conn.user_1_id
      );

      // Fetch profiles for connected users
      const { data: profilesData, error: profilesError } = await supabase.rpc(
        'get_public_profiles_by_ids',
        { ids: connectionUserIds }
      );

      if (profilesError) throw profilesError;

      const formattedConnections: Connection[] = (profilesData || []).map((profile: any) => ({
        id: profile.id,
        name: profile.full_name || 'Unknown User',
        avatar: profile.profile_photo,
        title: profile.job_title || ''
      }));

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "Failed to load connections.",
        variant: "destructive",
      });
    } finally {
      setLoadingConnections(false);
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(connectionSearchTerm.toLowerCase()) ||
    (conn.title && conn.title.toLowerCase().includes(connectionSearchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  const postUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExternalShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post on AI Feed',
        url: postUrl,
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  const handleInternalShare = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to share posts.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);

    try {
      const { error: sharesError } = await supabase
        .from('shares')
        .insert({
          user_id: user.id,
          content_type: 'post',
          content_id: post.id,
          target_type: 'post',
          target_id: post.id
        });

      if (sharesError && !sharesError.message.includes('duplicate')) {
        throw sharesError;
      }

      const { error: shareError } = await supabase
        .from('shared_posts')
        .insert({
          user_id: user.id,
          original_post_id: post.id,
          share_text: shareText.trim() || null,
        });

      if (shareError) throw shareError;

      toast({
        title: "Post shared!",
        description: "The post has been shared to your followers.",
      });

      onShare?.();
      onClose();
      setShareText('');
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleSendToConnection = async () => {
    if (!user || !selectedConnection) return;

    setIsSendingToConnection(true);

    try {
      // Open chat with the selected connection
      const chatOpened = await openChatWith(selectedConnection.id, { createIfMissing: true });
      
      if (!chatOpened) {
        throw new Error('Failed to open chat');
      }

      // Find or create conversation
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${selectedConnection.id}),and(participant_1_id.eq.${selectedConnection.id},participant_2_id.eq.${user.id})`)
        .single();

      let conversationId = existingConvo?.id;

      if (!conversationId) {
        const { data: newConvo, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: user.id,
            participant_2_id: selectedConnection.id
          })
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = newConvo.id;
      }

      // Format the message with the shared post
      const messageContent = `📢 Shared a post with you:\n\n"${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}"\n\n🔗 View post: ${postUrl}`;

      // Send the message
      const { error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: messageContent
        });

      if (messageError) throw messageError;

      // Also insert into messages table for compatibility
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: selectedConnection.id,
          content: messageContent
        });

      toast({
        title: "Post sent!",
        description: `Post shared with ${selectedConnection.name}`,
      });

      onShare?.();
      onClose();
      setSelectedConnection(null);
      setShowConnectionSearch(false);
      setConnectionSearchTerm('');
    } catch (error) {
      console.error('Error sending to connection:', error);
      toast({
        title: "Error",
        description: "Failed to send post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingToConnection(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Share Post
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Post Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.content}
            </p>
            {post.image_url && (
              <div className="mt-2">
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            {/* External Share */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Share Externally
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleExternalShare}
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Send to Connection */}
            {user && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">
                  Send to Connection
                </h3>
                
                {!showConnectionSearch ? (
                  <Button
                    onClick={() => setShowConnectionSearch(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Choose a Connection
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={connectionSearchTerm}
                        onChange={(e) => setConnectionSearchTerm(e.target.value)}
                        placeholder="Search connections..."
                        className="pl-10"
                      />
                    </div>

                    {/* Connection List */}
                    <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                      {loadingConnections ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Loading connections...
                        </div>
                      ) : filteredConnections.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          {connections.length === 0 
                            ? "No connections yet" 
                            : "No matches found"}
                        </div>
                      ) : (
                        filteredConnections.map(conn => (
                          <button
                            key={conn.id}
                            onClick={() => setSelectedConnection(conn)}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors ${
                              selectedConnection?.id === conn.id ? 'bg-primary/10' : ''
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={conn.avatar} />
                              <AvatarFallback>
                                {conn.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {conn.name}
                              </p>
                              {conn.title && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {conn.title}
                                </p>
                              )}
                            </div>
                            {selectedConnection?.id === conn.id && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Send Button */}
                    {selectedConnection && (
                      <Button
                        onClick={handleSendToConnection}
                        disabled={isSendingToConnection}
                        className="w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSendingToConnection 
                          ? 'Sending...' 
                          : `Send to ${selectedConnection.name}`}
                      </Button>
                    )}

                    <Button
                      onClick={() => {
                        setShowConnectionSearch(false);
                        setSelectedConnection(null);
                        setConnectionSearchTerm('');
                      }}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Internal Share */}
            {user && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">
                  Share to AI Feed
                </h3>
                
                <Textarea
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  placeholder="Add your thoughts (optional)..."
                  className="resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {shareText.length}/500 characters
                  </span>
                </div>

                <Button
                  onClick={handleInternalShare}
                  disabled={isSharing}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isSharing ? 'Sharing...' : 'Share to Feed'}
                </Button>
              </div>
            )}

            {!user && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Sign in to share this post to your AI Feed feed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
