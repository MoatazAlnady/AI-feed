import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Heart, MessageCircle, Share2, MoreHorizontal, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  is_approved: boolean;
  created_at: string;
  author?: {
    full_name: string;
    profile_photo: string | null;
    handle: string | null;
  };
}

interface GroupPostsFeedProps {
  groupId: string;
  isMember: boolean;
  canPost: boolean;
}

const GroupPostsFeed: React.FC<GroupPostsFeedProps> = ({ groupId, isMember, canPost }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [groupId]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author info
      const postsWithAuthors = await Promise.all(
        (data || []).map(async (post) => {
          const { data: authorData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo, handle')
            .eq('id', post.author_id)
            .single();
          return { ...post, author: authorData };
        })
      );

      setPosts(postsWithAuthors);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!user || !newPostContent.trim()) return;

    setSubmitting(true);
    try {
      // Fetch group settings to check approval requirement
      const { data: groupSettings } = await supabase
        .from('groups')
        .select('posts_need_approval, auto_approve_posts')
        .eq('id', groupId)
        .single();

      const needsApproval = groupSettings?.posts_need_approval || 
        (groupSettings?.auto_approve_posts === false);

      const { error } = await supabase
        .from('group_posts')
        .insert({
          group_id: groupId,
          author_id: user.id,
          content: newPostContent.trim(),
          is_approved: !needsApproval
        });

      if (error) throw error;

      setNewPostContent('');
      fetchPosts();
      
      if (needsApproval) {
        toast.info('Your post has been submitted for approval');
      } else {
        toast.success('Post created!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    // Optimistic update
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
    ));

    try {
      // In a real app, you'd have a post_likes table
      const { error } = await supabase
        .from('group_posts')
        .update({ likes_count: posts.find(p => p.id === postId)!.likes_count + 1 })
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      fetchPosts();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      {canPost && user && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={t('groups.writePost', "What's on your mind?")}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={3}
                className="mb-3 resize-none"
              />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" disabled>
                  <Image className="h-4 w-4 mr-2" />
                  {t('common.photo', 'Photo')}
                </Button>
                <Button 
                  onClick={createPost} 
                  disabled={!newPostContent.trim() || submitting}
                  size="sm"
                >
                  {submitting ? t('common.posting', 'Posting...') : t('common.post', 'Post')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center border border-border">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t('groups.noPosts', 'No posts yet')}
          </h3>
          <p className="text-muted-foreground">
            {canPost 
              ? t('groups.beFirstToPost', 'Be the first to share something!')
              : t('groups.joinToPost', 'Join the group to start posting')
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-card rounded-xl p-4 border border-border">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.author?.profile_photo || undefined} />
                    <AvatarFallback>
                      {(post.author?.full_name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {post.author?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      {t('common.report', 'Report')}
                    </DropdownMenuItem>
                    {post.author_id === user?.id && (
                      <DropdownMenuItem className="text-destructive">
                        {t('common.delete', 'Delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Post Content */}
              <p className="text-foreground whitespace-pre-wrap mb-3">
                {post.content}
              </p>

              {/* Post Media */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className={`grid gap-2 mb-3 ${
                  post.media_urls.length === 1 ? 'grid-cols-1' : 
                  post.media_urls.length === 2 ? 'grid-cols-2' : 
                  'grid-cols-2'
                }`}>
                  {post.media_urls.map((url, idx) => (
                    <img 
                      key={idx}
                      src={url}
                      alt=""
                      className="rounded-lg object-cover w-full h-64"
                    />
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => handleLike(post.id)}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  {post.likes_count || 0}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.comments_count || 0}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Share2 className="h-4 w-4 mr-1" />
                  {t('common.share', 'Share')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupPostsFeed;
