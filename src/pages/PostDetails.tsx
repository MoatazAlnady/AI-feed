import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal, User, Send, Edit3, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import SharePostModal from '../components/SharePostModal';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentReactions from '../components/CommentReactions';
import ProfileHoverCard from '../components/ProfileHoverCard';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import PremiumBadge from '@/components/PremiumBadge';
import TranslateButton from '@/components/TranslateButton';

interface Author {
  name: string;
  avatar: string;
  title: string;
  verified: boolean;
  topVoice: boolean;
  handle: string;
  premium_tier?: string | null;
  role_id?: number;
  account_type?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_handle?: string;
  canEdit: boolean;
  reactions: { [key: string]: { count: number; users: string[] } };
  userReaction?: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  link_url?: string;
  likes: number;
  shares: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  author: Author;
  liked: boolean;
  canEdit: boolean;
}

const PostDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likingPost, setLikingPost] = useState(false);
  const [commentSort, setCommentSort] = useState<'relevant' | 'recent'>('recent');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
        navigate('/newsfeed');
        return;
      }

      if (!data) {
        toast.error(t('common.postNotFound'));
        navigate('/newsfeed');
        return;
      }

      // Get user profile separately using RPC function
      const { data: profileData } = await supabase.rpc('get_public_profiles_by_ids', {
        ids: [data.user_id]
      });

      const userProfile = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null;

      // Check if current user has liked this post
      let userLiked = false;
      if (user?.id) {
        const { data: reactionData } = await supabase
          .from('post_reactions')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .neq('reaction_type', 'unlike')
          .maybeSingle();
        userLiked = !!reactionData;
      }

      // Format the post data
      const formattedPost: Post = {
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        image_url: data.image_url,
        video_url: data.video_url,
        link_url: data.link_url,
        likes: data.likes || 0,
        shares: data.shares || 0,
        view_count: data.view_count || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author: {
          name: userProfile?.full_name || 'AI Enthusiast',
          avatar: userProfile?.profile_photo || '',
          title: userProfile?.job_title || 'AI Enthusiast',
          verified: userProfile?.verified || false,
          topVoice: userProfile?.ai_feed_top_voice || false,
          handle: userProfile?.handle || `user-${data.user_id.slice(0, 8)}`,
          premium_tier: userProfile?.premium_tier || null,
          role_id: userProfile?.role_id,
          account_type: userProfile?.account_type
        },
        liked: userLiked,
        canEdit: user?.id === data.user_id
      };

      setPost(formattedPost);

      // Increment view count
      if (user?.id !== data.user_id) {
        await supabase
          .from('post_views')
          .insert({
            post_id: data.id,
            user_id: user?.id || null
          });
      }

    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      navigate('/newsfeed');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;

    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        // Get user profiles for comments
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', { ids: userIds });

        // Fetch comment reactions
        const commentIds = commentsData.map(c => c.id);
        const { data: reactionsData } = await supabase
          .from('comment_reactions')
          .select('*')
          .in('comment_id', commentIds);

        const formattedComments: Comment[] = commentsData.map(comment => {
          const profile = profiles?.find((p: any) => p.id === comment.user_id);
          
          // Group reactions by type
          const commentReactions = reactionsData?.filter(r => r.comment_id === comment.id) || [];
          const reactions: { [key: string]: { count: number; users: string[] } } = {};
          commentReactions.forEach(r => {
            if (!reactions[r.reaction_type]) {
              reactions[r.reaction_type] = { count: 0, users: [] };
            }
            reactions[r.reaction_type].count++;
            reactions[r.reaction_type].users.push(r.user_id);
          });

          const userReaction = user ? commentReactions.find(r => r.user_id === user.id)?.reaction_type : undefined;

          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            user_name: profile?.full_name || 'Anonymous',
            user_avatar: profile?.profile_photo,
            user_handle: profile?.handle,
            canEdit: user?.id === comment.user_id,
            reactions,
            userReaction
          };
        });

        setComments(formattedComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error(t('post.loginToLike'));
      return;
    }

    if (!post || likingPost) return;

    setLikingPost(true);
    try {
      if (post.liked) {
        // Remove like
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        setPost(prev => prev ? { ...prev, liked: false, likes: Math.max(0, prev.likes - 1) } : null);
        toast.success(t('post.likeRemoved'));
      } else {
        // Add like
        await supabase
          .from('post_reactions')
          .insert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: 'like'
          });

        setPost(prev => prev ? { ...prev, liked: true, likes: prev.likes + 1 } : null);
        toast.success(t('post.likeAdded'));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('common.error'));
    } finally {
      setLikingPost(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error(t('post.loginToComment'));
      return;
    }

    if (!newComment.trim() || !post) return;

    setSubmittingComment(true);
    try {
      const { data: commentData, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Get current user's profile
      const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', { ids: [user.id] });
      const profile = profiles?.[0];

      const newCommentObj: Comment = {
        id: commentData.id,
        content: commentData.content,
        created_at: commentData.created_at,
        user_id: commentData.user_id,
        user_name: profile?.full_name || 'You',
        user_avatar: profile?.profile_photo,
        user_handle: profile?.handle,
        canEdit: true,
        reactions: {},
        userReaction: undefined
      };

      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(t('common.error'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingComment(commentId);
    setEditCommentContent(content);
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ content: editCommentContent, updated_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, content: editCommentContent } : c
      ));
      setEditingComment(null);
      setEditCommentContent('');
      toast.success('Comment updated!');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(t('common.error'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(t('common.error'));
    }
  };

  const handleCommentReaction = async (commentId: string, reactionType: string) => {
    if (!user) return;

    try {
      const { data: existingReaction, error: fetchError } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing reaction:', fetchError);
        return;
      }

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          await supabase.from('comment_reactions').delete().eq('id', existingReaction.id);
        } else {
          await supabase.from('comment_reactions').update({ reaction_type: reactionType }).eq('id', existingReaction.id);
        }
      } else {
        await supabase.from('comment_reactions').insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType
        });
      }

      // Refresh comments
      fetchComments();
    } catch (error) {
      console.error('Error handling comment reaction:', error);
    }
  };

  const getSortedComments = () => {
    if (commentSort === 'relevant') {
      return [...comments].sort((a, b) => {
        const aReactions = Object.values(a.reactions || {}).reduce((sum, r) => sum + r.count, 0);
        const bReactions = Object.values(b.reactions || {}).reduce((sum, r) => sum + r.count, 0);
        return bReactions - aReactions;
      });
    }
    return [...comments].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('common.justNow');
    if (diffInHours < 24) return t('common.hoursAgo', { hours: diffInHours });
    if (diffInHours < 48) return t('common.yesterday');
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('common.postNotFound')}</h2>
          <button
            onClick={() => navigate('/newsfeed')}
            className="text-primary hover:underline"
          >
            {t('common.returnToNewsfeed')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t('common.back')}</span>
          </button>
        </div>

        {/* Post Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          {/* Author Info with ProfileHoverCard */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ProfileHoverCard userId={post.user_id}>
                <Link to={getCreatorProfileLink({ id: post.user_id, handle: post.author.handle })} className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center hover:ring-2 hover:ring-primary transition-all">
                  {post.author.avatar ? (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-primary-foreground" />
                  )}
                </Link>
              </ProfileHoverCard>
              <div>
                <div className="flex items-center gap-1.5">
                  <ProfileHoverCard userId={post.user_id}>
                    <Link to={getCreatorProfileLink({ id: post.user_id, handle: post.author.handle })} className="font-semibold text-foreground hover:underline">
                      {post.author.name}
                    </Link>
                  </ProfileHoverCard>
                  <PremiumBadge 
                    tier={
                      (post.author.role_id === 1 || post.author.account_type === 'admin') 
                        ? 'gold' 
                        : (post.author.premium_tier as 'silver' | 'gold' | null)
                    } 
                    size="sm" 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {post.author.title} • {formatDate(post.created_at)}
                </p>
              </div>
            </div>
            {post.canEdit && (
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {translatedContent || post.content}
            </p>
            <TranslateButton
              contentType="post"
              contentId={post.id}
              originalText={post.content}
              onTranslated={setTranslatedContent}
              className="mt-2"
            />
          </div>

          {/* Media */}
          {post.image_url && (
            <div className="mb-6">
              <img
                src={post.image_url}
                alt="Post content"
                className="w-full rounded-xl object-cover"
              />
            </div>
          )}

          {post.video_url && (
            <div className="mb-6">
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src={post.video_url}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {post.link_url && (
            <div className="mb-6">
              <a
                href={post.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-border rounded-xl hover:bg-muted transition-colors"
              >
                <p className="text-primary hover:underline">
                  {post.link_url}
                </p>
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                disabled={likingPost}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  post.liked 
                    ? 'text-red-500 bg-red-500/10' 
                    : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                }`}
              >
                <Heart className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{post.likes}</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{comments.length}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm font-medium">{post.shares}</span>
              </button>
            </div>

            <div className="text-sm text-muted-foreground">
              {post.view_count} {t('common.views')}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t('post.comments')} ({comments.length})
            </h3>
            {comments.length > 1 && (
              <select
                value={commentSort}
                onChange={(e) => setCommentSort(e.target.value as 'relevant' | 'recent')}
                className="text-sm border border-border rounded-lg px-2 py-1 bg-background text-foreground"
              >
                <option value="recent">Most Recent</option>
                <option value="relevant">Most Relevant</option>
              </select>
            )}
          </div>

          {/* Comment Input */}
          {user ? (
            <div className="flex gap-3 mb-6">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('post.addComment')}
                className="flex-1 min-h-[80px]"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground mb-6">{t('post.loginToComment')}</p>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('post.noComments')}
            </div>
          ) : (
            <div className="space-y-4">
              {getSortedComments().map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <Link to={getCreatorProfileLink({ id: comment.user_id, handle: comment.user_handle })}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80">
                      {comment.user_avatar ? (
                        <img src={comment.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    {editingComment === comment.id ? (
                      <div>
                        <input
                          type="text"
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          className="w-full px-2 py-1 border border-border rounded bg-background text-sm"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => handleSaveCommentEdit(comment.id)} className="text-xs text-green-600 flex items-center">
                            <Check className="h-3 w-3 mr-1" /> Save
                          </button>
                          <button onClick={() => setEditingComment(null)} className="text-xs text-muted-foreground flex items-center">
                            <X className="h-3 w-3 mr-1" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Link to={getCreatorProfileLink({ id: comment.user_id, handle: comment.user_handle })} className="font-medium text-sm hover:underline">
                              {comment.user_name}
                            </Link>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                          </div>
                          {comment.canEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-muted rounded"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}><Edit3 className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className="text-sm text-foreground mt-1">{comment.content}</p>
                        <div className="mt-2">
                          <CommentReactions
                            commentId={comment.id}
                            reactions={comment.reactions || {}}
                            userReaction={comment.userReaction}
                            onReact={handleCommentReaction}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <SharePostModal
          post={post}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default PostDetails;