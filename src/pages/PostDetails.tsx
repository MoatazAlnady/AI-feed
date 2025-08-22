import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import PostReactions from '../components/PostReactions';
import SharePostModal from '../components/SharePostModal';
import LoadingSpinner from '../components/LoadingSpinner';

interface Author {
  name: string;
  avatar: string;
  title: string;
  verified: boolean;
  topVoice: boolean;
  handle: string;
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
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
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
        toast.error('Post not found');
        navigate('/newsfeed');
        return;
      }

      // Get user profile separately using RPC function
      const { data: profileData } = await supabase.rpc('get_public_profiles_by_ids', {
        ids: [data.user_id]
      });

      const userProfile = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null;

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
          topVoice: userProfile?.ai_nexus_top_voice || false,
          handle: `user-${data.user_id.slice(0, 8)}`
        },
        liked: false, // TODO: Check if user has liked this post
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

  const handleLike = async () => {
    // TODO: Implement like functionality
    toast.info('Like functionality coming soon!');
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Post not found</h2>
          <button
            onClick={() => navigate('/newsfeed')}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Return to newsfeed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Post Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Author Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                {post.author.avatar ? (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {post.author.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.author.title} • {formatDate(post.created_at)}
                </p>
              </div>
            </div>
            {post.canEdit && (
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
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
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <p className="text-primary-600 dark:text-primary-400 hover:underline">
                  {post.link_url}
                </p>
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  post.liked 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <Heart className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{post.likes}</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Comment</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm font-medium">{post.shares}</span>
              </button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {post.view_count} views
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Comments
          </h3>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Comments functionality coming soon!
          </div>
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