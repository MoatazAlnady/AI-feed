import React, { useState } from 'react';
import { X, Link as LinkIcon, Share2, MessageSquare, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

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
  const { user } = useAuth();
  const { toast } = useToast();

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
        title: 'Check out this post on AI Nexus',
        url: postUrl,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
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
      const { error } = await supabase
        .from('shared_posts')
        .insert({
          user_id: user.id,
          original_post_id: post.id,
          share_text: shareText.trim() || null,
        });

      if (error) throw error;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Post
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Post Preview */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
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
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
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

            {/* Internal Share */}
            {user && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Share to AI Nexus
                </h3>
                
                {/* Optional text input */}
                <div className="space-y-2">
                  <Textarea
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    placeholder="Add your thoughts (optional)..."
                    className="resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {shareText.length}/500 characters
                    </span>
                  </div>
                </div>

                {/* Share Button */}
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
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sign in to share this post to your AI Nexus feed
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