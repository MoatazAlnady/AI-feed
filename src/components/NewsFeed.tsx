import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Image,
  Video,
  Link as LinkIcon,
  Send,
  User,
  Edit3,
  Trash2,
  Check,
  X,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { makeHashtagsClickable } from '@/utils/hashtagUtils';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';
import PostReactions from './PostReactions';
import CommentReactions from './CommentReactions';
import PostOptionsMenu from './PostOptionsMenu';
import SharePostModal from './SharePostModal';
import LinkPreview from './LinkPreview';

interface Post {
  id: string;
  user_id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
    verified: boolean;
    topVoice: boolean;
    handle?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  shares: number;
  share_count?: number;
  image?: string;
  video?: string;
  link?: string;
  tags: string[];
  liked: boolean;
  bookmarked: boolean;
  created_at: string;
  updated_at: string;
  canEdit: boolean;
  view_count?: number;
  reach_score?: number;
}

interface Comment {
  id: string;
  user_id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    handle?: string;
  };
  content: string;
  timestamp: string;
  created_at: string;
  likes: number;
  canEdit: boolean;
  reactions: { [key: string]: { count: number; users: string[] } };
  userReaction?: string;
}

const NewsFeed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [postReactions, setPostReactions] = useState<{ [key: string]: { [key: string]: { count: number; users: string[] } } }>({});
  const [userReactions, setUserReactions] = useState<{ [key: string]: string }>({});
  const [commentSort, setCommentSort] = useState<{ [key: string]: 'relevant' | 'recent' }>({});
  const [editingComment, setEditingComment] = useState<{ postId: string; commentId: string } | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // Get user interests for personalized feed
  const userInterests = user?.user_metadata?.interests || [];

  useEffect(() => {
    console.log('Current user:', user);
    // Show newsletter popup for unsubscribed registered users
    if (user && !user.user_metadata?.newsletter_subscription) {
      setShowNewsletterPopup(true);
    }
    ensureUserProfile();
    fetchPosts();

    // Set up real-time subscriptions
    let postsChannel: any;
    let sharedPostsChannel: any;
    let refreshInterval: NodeJS.Timeout;

    if (user) {
      // Subscribe to new posts
      postsChannel = supabase
        .channel('posts_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        }, (payload) => {
          console.log('New post detected:', payload);
          // Fetch posts again to include the new post
          fetchPosts();
        })
        .subscribe();

      // Subscribe to new shared posts
      sharedPostsChannel = supabase
        .channel('shared_posts_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_posts'
        }, (payload) => {
          console.log('New shared post detected:', payload);
          // Fetch posts again to include the new shared post
          fetchPosts();
        })
        .subscribe();

      // Set up automatic refresh every 10 minutes
      refreshInterval = setInterval(() => {
        console.log('Auto-refreshing newsfeed...');
        fetchPosts();
      }, 10 * 60 * 1000); // 10 minutes
    }

    return () => {
      // Clean up subscriptions and interval
      if (postsChannel) {
        supabase.removeChannel(postsChannel);
      }
      if (sharedPostsChannel) {
        supabase.removeChannel(sharedPostsChannel);
      }
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user]);

  const ensureUserProfile = async () => {
    if (!user) return;
    
    try {
      // Check if user profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('Creating user profile for:', user.id);
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'AI Enthusiast',
            account_type: 'creator'
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          console.log('User profile created successfully');
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const fetchPosts = async () => {
    setIsRefreshing(true);
    try {
      console.log('Fetching posts...');
      
      // Fetch regular posts with reach score, view count, and share count
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, reach_score, view_count, share_count')
        .order('reach_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
      }

      // Fetch shared posts with original post data
      const { data: sharedPostsData, error: sharedError } = await supabase
        .from('shared_posts')
        .select(`
          *,
          original_post:posts!shared_posts_original_post_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sharedError) {
        console.error('Error fetching shared posts:', sharedError);
      }

      const allPosts = [];
      if (postsData) allPosts.push(...postsData.map(post => ({ ...post, type: 'original' })));
      if (sharedPostsData) allPosts.push(...sharedPostsData.map(share => ({ 
        ...share.original_post, 
        type: 'shared',
        shared_by: share.user_id,
        share_text: share.share_text,
        shared_at: share.created_at
      })));

      // Sort all posts by creation time
      allPosts.sort((a, b) => {
        const dateA = new Date(a.type === 'shared' ? a.shared_at : a.created_at);
        const dateB = new Date(b.type === 'shared' ? b.shared_at : b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('All posts data:', allPosts);

      if (!allPosts || allPosts.length === 0) {
        console.log('No posts found');
        setPosts([]);
        return;
      }

      // Fetch user profiles for each post
      const userIds = [...new Set(allPosts.flatMap(post => [
        post.user_id, 
        post.type === 'shared' ? post.shared_by : null
      ]).filter(Boolean))];
      console.log('User IDs from posts:', userIds);
      let userProfiles = [];
      
      if (userIds.length > 0) {
        console.log('Querying user_profiles for IDs:', userIds);
        const { data: profiles, error: profileError } = await supabase
          .rpc('get_public_profiles_by_ids', { ids: userIds });

        console.log('Profile query result:', { profiles, profileError });
        
        if (profileError) {
          console.error('Error fetching user profiles:', profileError);
        } else {
          console.log('Fetched profiles:', profiles);
          userProfiles = profiles || [];
        }
      }

      const profilesMap = new Map(userProfiles.map(profile => [profile.id, profile]));

      // Filter posts based on user interests if user has interests
      let filteredPosts = allPosts;
      if (userInterests.length > 0) {
        filteredPosts = allPosts.filter(post => {
          // Always show user's own posts
          if (user && (post.user_id === user.id || post.shared_by === user.id)) {
            return true;
          }

          // Check if post content matches user interests
          const postContent = post.content.toLowerCase();
          const matchesInterests = userInterests.some(interest => 
            postContent.includes(interest.toLowerCase())
          );

          // Check if post author has similar interests
          const authorProfile = profilesMap.get(post.user_id);
          const authorInterests = authorProfile?.interests || [];
          const hasCommonInterests = userInterests.some(interest =>
            authorInterests.includes(interest)
          );

          return matchesInterests || hasCommonInterests;
        });
      }

      const formattedPosts = filteredPosts.map(post => {
        const profile = profilesMap.get(post.user_id);
        const sharedByProfile = post.type === 'shared' ? profilesMap.get(post.shared_by) : null;
        console.log(`Post ${post.id}: user_id = ${post.user_id}, found profile:`, profile);
        
        // If no profile found, try to get user data from auth context for current user
        let authorName = 'Anonymous User';
        let authorTitle = 'AI Enthusiast';
        
        if (profile) {
          authorName = profile.full_name || 'Anonymous User';
          authorTitle = profile.job_title || 'AI Enthusiast';
        } else if (user && post.user_id === user.id) {
          // Use auth user data if it's the current user's post
          authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous User';
          authorTitle = 'AI Enthusiast';
        }
        
        return {
          id: post.id,
          user_id: post.user_id,
          author: {
            name: authorName,
            avatar: profile?.profile_photo || '',
            title: authorTitle,
            verified: profile?.verified || false,
            topVoice: profile?.ai_feed_top_voice || false,
            handle: profile?.handle // Add handle for profile linking
          },
          content: post.content,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          likes: post.likes || 0,
          comments: [],
          shares: post.shares || 0,
          share_count: post.share_count || 0,
          image: post.image_url,
          video: post.video_url,
          link: post.link_url,
          tags: [],
          liked: false,
          bookmarked: false,
          created_at: post.created_at,
          updated_at: post.updated_at,
          canEdit: user ? post.user_id === user.id : false,
          view_count: post.view_count || 0,
          reach_score: post.reach_score || 0,
          // Shared post specific fields
          type: post.type || 'original',
          sharedBy: post.type === 'shared' ? {
            name: sharedByProfile?.full_name || 'Someone',
            avatar: sharedByProfile?.profile_photo || '',
            title: sharedByProfile?.job_title || 'AI Enthusiast',
            handle: sharedByProfile?.handle
          } : undefined,
          shareText: post.share_text || '',
          sharedAt: post.shared_at ? new Date(post.shared_at).toLocaleDateString() : undefined
        } as Post & { 
          type?: 'original' | 'shared';
          sharedBy?: { name: string; avatar: string; title: string; handle?: string };
          shareText?: string;
          sharedAt?: string;
        };
      });

      console.log('Formatted posts:', formattedPosts);
      setPosts(formattedPosts);

      // Fetch reactions for all posts
      formattedPosts.forEach(post => {
        fetchPostReactions(post.id);
        // Check user's existing reactions
        if (user) {
          fetchUserReaction(post.id);
        }
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to search with hashtag
    window.location.href = `/tools?search=${encodeURIComponent(hashtag)}`;
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            liked: !post.liked, 
            likes: post.liked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, bookmarked: !post.bookmarked }
        : post
    ));
  };

  const handleShare = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setShareModalPost(post);
    }
  };

  const handleShareComplete = (postId: string) => {
    // Update the post share_count immediately in local state
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { ...post, share_count: (post.share_count || 0) + 1 }
        : post
    ));
  };

  const handleEditPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(postId);
      setEditContent(post.content);
    }
  };

  const handleSaveEdit = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, content: editContent }
          : post
      ));
      setEditingPost(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleComment = async (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim() || !user) return;

    try {
      const { data: commentData, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentText.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Get current user's profile
      const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', { ids: [user.id] });
      const profile = profiles?.[0];

      const newCommentObj: Comment = {
        id: commentData.id,
        user_id: user.id,
        author: {
          id: user.id,
          name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
          avatar: profile?.profile_photo || user?.user_metadata?.profile_photo || '',
          handle: profile?.handle
        },
        content: commentText,
        timestamp: 'Just now',
        created_at: commentData.created_at,
        likes: 0,
        canEdit: true,
        reactions: {},
        userReaction: undefined
      };

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, newCommentObj] }
          : post
      ));

      setNewComment({ ...newComment, [postId]: '' });
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleEditComment = (postId: string, commentId: string, content: string) => {
    setEditingComment({ postId, commentId });
    setEditCommentContent(content);
  };

  const handleSaveCommentEdit = async (postId: string, commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ content: editCommentContent, updated_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: post.comments.map(c => 
                c.id === commentId ? { ...c, content: editCommentContent } : c
              ) 
            }
          : post
      ));
      setEditingComment(null);
      setEditCommentContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: post.comments.filter(c => c.id !== commentId) }
          : post
      ));
    } catch (error) {
      console.error('Error deleting comment:', error);
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

      // Refresh comments to get updated reactions
      fetchPosts();
    } catch (error) {
      console.error('Error handling comment reaction:', error);
    }
  };

  const getSortedComments = (comments: Comment[], postId: string) => {
    const sortBy = commentSort[postId] || 'recent';
    if (sortBy === 'relevant') {
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

  const toggleComments = (postId: string) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!user) return;

    try {
      // Check if user already has a reaction on this post
      const { data: existingReaction, error: fetchError } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing reaction:', fetchError);
        return;
      }

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction if clicking the same type
          const { error: deleteError } = await supabase
            .from('post_reactions')
            .delete()
            .eq('id', existingReaction.id);

          if (deleteError) throw deleteError;

          // Update local state
          setUserReactions(prev => {
            const newState = { ...prev };
            delete newState[postId];
            return newState;
          });
        } else {
          // Update reaction type
          const { error: updateError } = await supabase
            .from('post_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);

          if (updateError) throw updateError;

          // Update local state
          setUserReactions(prev => ({ ...prev, [postId]: reactionType }));
        }
      } else {
        // Create new reaction
        const { error: insertError } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          });

        if (insertError) throw insertError;

        // Update local state
        setUserReactions(prev => ({ ...prev, [postId]: reactionType }));
      }

      // Refresh post reactions
      fetchPostReactions(postId);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const fetchPostReactions = async (postId: string) => {
    try {
      const { data: reactions, error } = await supabase
        .from('post_reactions')
        .select('reaction_type, user_id')
        .eq('post_id', postId);

      if (error) throw error;

      // Group reactions by type
      const groupedReactions: { [key: string]: { count: number; users: string[] } } = {};
      
      reactions?.forEach(reaction => {
        if (!groupedReactions[reaction.reaction_type]) {
          groupedReactions[reaction.reaction_type] = { count: 0, users: [] };
        }
        groupedReactions[reaction.reaction_type].count++;
        groupedReactions[reaction.reaction_type].users.push(reaction.user_id);
      });

      setPostReactions(prev => ({ ...prev, [postId]: groupedReactions }));
    } catch (error) {
      console.error('Error fetching post reactions:', error);
    }
  };

  const fetchUserReaction = async (postId: string) => {
    if (!user) return;

    try {
      const { data: reaction, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user reaction:', error);
        return;
      }

      if (reaction) {
        setUserReactions(prev => ({ ...prev, [postId]: reaction.reaction_type }));
      }
    } catch (error) {
      console.error('Error fetching user reaction:', error);
    }
  };

  const trackPostView = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('track_post_view', {
        post_id_param: postId,
        user_id_param: user.id,
        ip_address_param: null,
        user_agent_param: navigator.userAgent
      });

      if (error) {
        console.error('Error tracking post view:', error);
      }
    } catch (error) {
      console.error('Error tracking post view:', error);
    }
  };

  // Track view when post comes into view
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId) {
              trackPostView(postId);
            }
          }
        });
      },
      { threshold: 0.5 } // Track when 50% of post is visible
    );

    Object.values(postRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [posts, user]);

  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Personalized Feed Header */}
        {userInterests.length > 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-4 border border-primary-200 dark:border-primary-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalized for You</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on your interests: {userInterests.slice(0, 3).join(', ')}
              {userInterests.length > 3 && ` and ${userInterests.length - 3} more`}
            </p>
          </div>
        )}

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
          <MessageCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Be the first to share something with the community! Posts from people you follow and content matching your interests will appear here.
          </p>
          <button className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">
            Create Your First Post
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personalized Feed Header */}
      {userInterests.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-4 border border-primary-200 dark:border-primary-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalized for You</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on your interests: {userInterests.slice(0, 3).join(', ')}
            {userInterests.length > 3 && ` and ${userInterests.length - 3} more`}
          </p>
        </div>
      )}

      {/* Refresh Indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center space-x-2 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-sm text-blue-700 dark:text-blue-300">Refreshing feed...</span>
        </div>
      )}

      {posts.map((post: any, index: number) => (
        <div 
          key={post.type === 'shared' ? `shared-${post.id}-${index}` : post.id}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6"
          ref={(el) => { postRefs.current[post.id] = el; }}
          data-post-id={post.id}
        >
          {/* Shared Post Header */}
          {post.type === 'shared' && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center space-x-2">
                <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>{post.sharedBy?.name || 'Someone'}</strong> shared this post
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">• {post.sharedAt}</span>
              </div>
              {post.shareText && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  "{post.shareText}"
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-start space-x-4">
            {/* Clickable Avatar */}
            <Link to={getCreatorProfileLink({ id: post.user_id, handle: post.author.handle })} className="flex-shrink-0">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-primary-500 transition-all"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary-500 transition-all">
                  <User className="h-6 w-6 text-white" />
                </div>
              )}
            </Link>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {/* Clickable Author Name */}
                <Link to={getCreatorProfileLink({ id: post.user_id, handle: post.author.handle })} className="hover:underline">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{post.author.name}</h3>
                </Link>
                {post.author.verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{post.author.title} • {post.timestamp}</p>
                  {/* Show view count only to post author */}
                  {user && post.user_id === user.id && post.view_count !== undefined && (
                    <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
                      <Eye className="h-3 w-3" />
                      <span>{post.view_count} views</span>
                    </div>
                  )}
                </div>
                <PostOptionsMenu
                  postId={post.id}
                  authorId={post.user_id}
                  contentType="post"
                  contentTitle={post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')}
                  onEdit={() => handleEditPost(post.id)}
                  onDelete={() => handleDeletePost(post.id)}
                  onShare={() => handleShare(post.id)}
                  isBookmarked={post.bookmarked}
                  onBookmark={() => handleBookmark(post.id)}
                />
              </div>
              
              <div className="text-gray-800 dark:text-gray-200 mb-4">
                {editingPost === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveEdit(post.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  post.content
                )}
              </div>
              
              {post.image && (
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-64 object-cover rounded-xl mb-4"
                />
              )}

              {post.video && (
                <div className="w-full rounded-xl overflow-hidden mb-4 aspect-video">
                  <iframe 
                    src={post.video} 
                    className="w-full h-full" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {post.link && (
                <div className="mb-4">
                  <LinkPreview url={post.link} />
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex space-x-6">
                  {/* Post Reactions */}
                  <PostReactions
                    postId={post.id}
                    reactions={postReactions[post.id] || {}}
                    userReaction={userReactions[post.id]}
                    onReact={handleReaction}
                  />
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.comments.length}</span>
                  </button>
                  <button 
                    onClick={() => handleShare(post.id)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                    <span>{post.share_count || 0}</span>
                  </button>
                  {/* Show view count to the left of bookmark */}
                  {user && post.user_id === user.id && post.view_count !== undefined && (
                    <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                      <Eye className="h-4 w-4" />
                      <span>{post.view_count}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleBookmark(post.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.bookmarked 
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' 
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${post.bookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <PostOptionsMenu
                    postId={post.id}
                    authorId={post.user_id}
                    contentType="post"
                    contentTitle={post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')}
                    onEdit={() => handleEditPost(post.id)}
                    onDelete={() => handleDeletePost(post.id)}
                    onShare={() => handleShare(post.id)}
                    isBookmarked={post.bookmarked}
                    onBookmark={() => handleBookmark(post.id)}
                  />
                </div>
              </div>

              {/* Comments Section */}
              {showComments[post.id] && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {/* Comment Sorting */}
                  {post.comments.length > 1 && (
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {post.comments.length} comments
                      </span>
                      <select
                        value={commentSort[post.id] || 'recent'}
                        onChange={(e) => setCommentSort({ ...commentSort, [post.id]: e.target.value as 'relevant' | 'recent' })}
                        className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <option value="recent">Most Recent</option>
                        <option value="relevant">Most Relevant</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-4 mb-4">
                    {getSortedComments(post.comments, post.id).map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        {/* Avatar with fallback */}
                        {comment.author.avatar ? (
                          <Link to={getCreatorProfileLink({ id: comment.author.id, handle: comment.author.handle })}>
                            <img
                              src={comment.author.avatar}
                              alt={comment.author.name}
                              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </Link>
                        ) : (
                          <Link to={getCreatorProfileLink({ id: comment.author.id, handle: comment.author.handle })}>
                            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          </Link>
                        )}
                        <div className="flex-1">
                          {editingComment?.postId === post.id && editingComment?.commentId === comment.id ? (
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                              <input
                                type="text"
                                value={editCommentContent}
                                onChange={(e) => setEditCommentContent(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                                autoFocus
                              />
                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => handleSaveCommentEdit(post.id, comment.id)}
                                  className="text-xs text-green-600 hover:text-green-700 flex items-center"
                                >
                                  <Check className="h-3 w-3 mr-1" /> Save
                                </button>
                                <button
                                  onClick={() => setEditingComment(null)}
                                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                                >
                                  <X className="h-3 w-3 mr-1" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <Link 
                                      to={getCreatorProfileLink({ id: comment.author.id, handle: comment.author.handle })}
                                      className="font-medium text-sm text-gray-900 dark:text-white hover:underline"
                                    >
                                      {comment.author.name}
                                    </Link>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {comment.timestamp}
                                    </span>
                                  </div>
                                  {comment.canEdit && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditComment(post.id, comment.id, comment.content)}>
                                          <Edit3 className="h-4 w-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                                <div className="text-sm text-gray-800 dark:text-gray-200">
                                  {comment.content}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 mt-1 ml-3">
                                <CommentReactions
                                  commentId={comment.id}
                                  reactions={comment.reactions || {}}
                                  userReaction={comment.userReaction}
                                  onReact={handleCommentReaction}
                                />
                                <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                  Reply
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Share Modal */}
      {shareModalPost && (
        <SharePostModal
          isOpen={!!shareModalPost}
          onClose={() => setShareModalPost(null)}
          post={shareModalPost}
          onShare={() => {
            handleShareComplete(shareModalPost.id); // Update share count
            fetchPosts(); // Refresh posts to show the shared post
            setShareModalPost(null);
          }}
        />
      )}
    </div>
  );
};

export default NewsFeed;