import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Image,
  Video,
  Link,
  Send,
  User,
  Edit3,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { makeHashtagsClickable } from '../utils/hashtagUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import PostReactions from './PostReactions';
import PostOptionsMenu from './PostOptionsMenu';
import SharePostModal from './SharePostModal';

interface Post {
  id: string;
  user_id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
    verified: boolean;
    topVoice: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  shares: number;
  image?: string;
  video?: string;
  link?: string;
  tags: string[];
  liked: boolean;
  bookmarked: boolean;
  created_at: string;
  updated_at: string;
  canEdit: boolean;
}

interface Comment {
  id: number;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
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
    try {
      console.log('Fetching posts...');
      
      // Fetch regular posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
      }

      // Fetch shared posts
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
          .from('user_profiles')
          .select('id, full_name, profile_photo, job_title, verified, ai_nexus_top_voice')
          .in('id', userIds);

        console.log('Profile query result:', { profiles, profileError });
        
        if (profileError) {
          console.error('Error fetching user profiles:', profileError);
        } else {
          console.log('Fetched profiles:', profiles);
          userProfiles = profiles || [];
        }
      }

      const profilesMap = new Map(userProfiles.map(profile => [profile.id, profile]));

      const formattedPosts = allPosts.map(post => {
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
            topVoice: profile?.ai_nexus_top_voice || false
          },
          content: post.content,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          likes: post.likes || 0,
          comments: [],
          shares: post.shares || 0,
          image: post.image_url,
          video: post.video_url,
          link: post.link_url,
          tags: [],
          liked: false,
          bookmarked: false,
          created_at: post.created_at,
          updated_at: post.updated_at,
          canEdit: user ? post.user_id === user.id : false,
          // Shared post specific fields
          type: post.type || 'original',
          sharedBy: post.type === 'shared' ? {
            name: sharedByProfile?.full_name || 'Someone',
            avatar: sharedByProfile?.profile_photo || '',
            title: sharedByProfile?.job_title || 'AI Enthusiast'
          } : undefined,
          shareText: post.share_text || '',
          sharedAt: post.shared_at ? new Date(post.shared_at).toLocaleDateString() : undefined
        } as Post & { 
          type?: 'original' | 'shared';
          sharedBy?: { name: string; avatar: string; title: string };
          shareText?: string;
          sharedAt?: string;
        };
      });

      console.log('Formatted posts:', formattedPosts);
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
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

  const handleComment = (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now(),
      author: {
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        avatar: user?.user_metadata?.profile_photo || ''
      },
      content: commentText,
      timestamp: 'Just now',
      likes: 0
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: [...post.comments, newCommentObj] }
        : post
    ));

    setNewComment({ ...newComment, [postId]: '' });
  };

  const toggleComments = (postId: string) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
  };

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

      {posts.map((post: any) => (
        <div key={post.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
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
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{post.author.name}</h3>
                {post.author.verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{post.author.title} • {post.timestamp}</p>
                <PostOptionsMenu
                  postId={post.id}
                  authorId={post.user_id}
                  contentType="post"
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
                <a 
                  href={post.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
                    <Link className="h-4 w-4" />
                    <span className="text-sm font-medium truncate">{post.link}</span>
                  </div>
                </a>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex space-x-6">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.liked ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
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
                    <span>{post.shares}</span>
                  </button>
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
                  <div className="space-y-4 mb-4">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {comment.author.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {comment.timestamp}
                              </span>
                            </div>
                            <div className="text-sm text-gray-800 dark:text-gray-200">
                              {comment.content}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-1 ml-3">
                            <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                              Like ({comment.likes})
                            </button>
                            <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                              Reply
                            </button>
                          </div>
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
            fetchPosts(); // Refresh posts to show the shared post
            setShareModalPost(null);
          }}
        />
      )}
    </div>
  );
};

export default NewsFeed;