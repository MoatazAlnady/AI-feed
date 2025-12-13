import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2, Share, Flag, Copy, BookmarkPlus, Eye, EyeOff, TrendingUp, Bookmark } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import ReportModal from './ReportModal';
import PromoteContentModal from './PromoteContentModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PostOptionsMenuProps {
  postId: string;
  authorId?: string;
  contentType: 'post' | 'tool' | 'article' | 'event' | 'job';
  contentTitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  isHidden?: boolean;
  onHide?: () => void;
}

const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  postId,
  authorId,
  contentType,
  contentTitle = 'Content',
  onEdit,
  onDelete,
  onShare,
  isBookmarked: initialBookmarked = false,
  onBookmark,
  isHidden = false,
  onHide
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const isOwner = user?.id === authorId;

  // Check if item is already bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', postId)
        .maybeSingle();
      setIsBookmarked(!!data);
    };
    checkBookmark();
  }, [user?.id, contentType, postId]);

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/${contentType}s/${postId}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Content link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
    setIsOpen(false);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      const url = `${window.location.origin}/${contentType}s/${postId}`;
      if (navigator.share) {
        navigator.share({
          title: `Check out this ${contentType}`,
          url: url
        });
      } else {
        handleCopyLink();
      }
    }
    setIsOpen(false);
  };

  const handleReport = () => {
    setShowReportModal(true);
    setIsOpen(false);
  };

  const handleBookmark = async () => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items",
        variant: "destructive"
      });
      setIsOpen(false);
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('content_type', contentType)
          .eq('content_id', postId);
        setIsBookmarked(false);
        toast({
          title: "Removed from bookmarks",
          description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} removed from your saved items`
        });
      } else {
        // Add bookmark
        await supabase
          .from('saved_items')
          .insert({
            user_id: user.id,
            content_type: contentType,
            content_id: postId
          });
        setIsBookmarked(true);
        toast({
          title: "Added to bookmarks",
          description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} saved for later`
        });
      }
      if (onBookmark) onBookmark();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    } finally {
      setBookmarkLoading(false);
      setIsOpen(false);
    }
  };

  const handleHide = () => {
    if (onHide) {
      onHide();
    }
    toast({
      title: isHidden ? "Content shown" : "Content hidden",
      description: `This ${contentType} is now ${isHidden ? 'visible' : 'hidden'} from your feed`
    });
    setIsOpen(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setIsOpen(false);
  };

  const handlePromote = () => {
    setShowPromoteModal(true);
    setIsOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#0f172a]">
          {/* Owner actions */}
          {isOwner && (
            <>
              <DropdownMenuItem onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit {contentType}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePromote} className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
                Promote {contentType}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Delete {contentType}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Note: Share option removed from menu as per user request */}
          {/* Sharing is now handled by a separate share button on posts */}

          <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy link
          </DropdownMenuItem>

          {/* Bookmark action */}
          <DropdownMenuItem onClick={handleBookmark} disabled={bookmarkLoading} className="flex items-center gap-2">
            {isBookmarked ? <Bookmark className="h-4 w-4 fill-current" /> : <BookmarkPlus className="h-4 w-4" />}
            {bookmarkLoading ? 'Saving...' : isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          </DropdownMenuItem>

          {/* Hide/Show content */}
          {!isOwner && (
            <DropdownMenuItem onClick={handleHide} className="flex items-center gap-2">
              {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {isHidden ? 'Show this content' : 'Hide this content'}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Report action (for non-owners) */}
          {!isOwner && (
            <DropdownMenuItem onClick={handleReport} className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Flag className="h-4 w-4" />
              Report {contentType}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          type="content"
          targetId={postId}
        />
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <PromoteContentModal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          contentType={contentType}
          contentId={parseInt(postId)}
          contentTitle={contentTitle}
        />
      )}
    </>
  );
};

export default PostOptionsMenu;