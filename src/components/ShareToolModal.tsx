import React, { useState, useEffect } from 'react';
import { X, Share2, MessageSquare, Copy, Users, Search, Send, Globe, Lock, UsersRound } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
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

interface ShareToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    website?: string;
  };
  onShare?: () => void;
}

const ShareToolModal: React.FC<ShareToolModalProps> = ({
  isOpen,
  onClose,
  tool,
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
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'groups'>('public');
  const [showAuthModal, setShowAuthModal] = useState(false);
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
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('id, user_1_id, user_2_id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      if (connectionsError) throw connectionsError;

      if (!connectionsData || connectionsData.length === 0) {
        setConnections([]);
        return;
      }

      const connectionUserIds = connectionsData.map(conn => 
        conn.user_1_id === user.id ? conn.user_2_id : conn.user_1_id
      );

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
    } finally {
      setLoadingConnections(false);
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(connectionSearchTerm.toLowerCase()) ||
    (conn.title && conn.title.toLowerCase().includes(connectionSearchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  const toolUrl = `${window.location.origin}/tools/${tool.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(toolUrl);
      toast({
        title: "Link copied!",
        description: "Tool link has been copied to your clipboard.",
      });
    } catch (error) {
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
        title: `Check out ${tool.name} on AI Feed`,
        text: tool.description,
        url: toolUrl,
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
      // Record the share in shares table
      const { error: sharesError } = await supabase
        .from('shares')
        .insert({
          user_id: user.id,
          content_type: 'tool',
          content_id: tool.id,
          target_type: 'tool',
          target_id: tool.id
        });

      if (sharesError && !sharesError.message.includes('duplicate')) {
        throw sharesError;
      }

      // Insert into shared_posts for feed visibility
      const { error: sharePostError } = await supabase
        .from('shared_posts')
        .insert({
          user_id: user.id,
          original_tool_id: tool.id,
          share_text: shareText.trim() || null,
          visibility: visibility,
          content_type: 'tool'
        });

      if (sharePostError) throw sharePostError;

      // Update share count on tool
      await supabase
        .from('tools')
        .update({ share_count: (tool as any).share_count ? (tool as any).share_count + 1 : 1 })
        .eq('id', tool.id);

      toast({
        title: "Tool shared!",
        description: "Tool shared to your feed. Your followers will see it!",
      });

      onShare?.();
      onClose();
      setShareText('');
    } catch (error) {
      console.error('Error sharing tool:', error);
      toast({
        title: "Error",
        description: "Failed to share tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleSendToConnection = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!selectedConnection) return;

    setIsSendingToConnection(true);

    try {
      const chatOpened = await openChatWith(selectedConnection.id, { createIfMissing: true });
      
      if (!chatOpened) {
        throw new Error('Failed to open chat');
      }

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

      const messageContent = `🛠️ Shared an AI tool with you:\n\n**${tool.name}**\n${tool.description.substring(0, 150)}${tool.description.length > 150 ? '...' : ''}\n\n🔗 View tool: ${toolUrl}`;

      const { error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: messageContent
        });

      if (messageError) throw messageError;

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: selectedConnection.id,
          content: messageContent
        });

      toast({
        title: "Tool sent!",
        description: `Tool shared with ${selectedConnection.name}`,
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
        description: "Failed to send tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingToConnection(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-border">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Share Tool
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
            {/* Tool Preview */}
            <div className="p-3 bg-muted rounded-lg flex items-start gap-3">
              {tool.logo_url ? (
                <img 
                  src={tool.logo_url} 
                  alt={tool.name} 
                  className="w-12 h-12 rounded-lg object-contain"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{tool.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{tool.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {tool.description}
                </p>
              </div>
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
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">
                  Send to Connection
                </h3>
                
                {!showConnectionSearch ? (
                  <Button
                    onClick={() => {
                      if (!user) {
                        setShowAuthModal(true);
                        return;
                      }
                      setShowConnectionSearch(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Choose a Connection
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={connectionSearchTerm}
                        onChange={(e) => setConnectionSearchTerm(e.target.value)}
                        placeholder="Search connections..."
                        className="pl-10"
                      />
                    </div>

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

              {/* Share to Feed */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">
                  Share to Feed
                </h3>
                
                {/* Visibility Selector */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={visibility === 'public' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisibility('public')}
                    className="flex-1"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Button>
                  <Button
                    type="button"
                    variant={visibility === 'connections' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisibility('connections')}
                    className="flex-1"
                  >
                    <UsersRound className="h-3 w-3 mr-1" />
                    Connections
                  </Button>
                </div>
                
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
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </>
  );
};

export default ShareToolModal;
