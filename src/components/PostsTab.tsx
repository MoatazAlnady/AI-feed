import React, { useState, useEffect } from 'react';
import { MessageSquare, Share2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import PostReactions from './PostReactions';

interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url?: string;
  video_url?: string;
  link_url?: string;
  view_count?: number;
  share_count?: number;
  type?: 'original' | 'shared';
  shared_by?: string;
  share_text?: string;
  shared_at?: string;
}

interface PostsTabProps {
  userId?: string;
}

const PostsTab: React.FC<PostsTabProps> = ({ userId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>({});

  useEffect(() => {
    if (userId) {
      fetchUserPosts();
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, profile_photo')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserPosts = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch original posts by user
      const { data: originalPosts, error: originalError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (originalError) throw originalError;

      // Fetch posts shared by user
      const { data: sharedPosts, error: sharedError } = await supabase
        .from('shared_posts')
        .select(`
          *,
          original_post:posts!shared_posts_original_post_id_fkey(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (sharedError) throw sharedError;

      // Combine and format posts
      const allPosts = [];
      
      if (originalPosts) {
        allPosts.push(...originalPosts.map(post => ({ ...post, type: 'original' })));
      }
      
      if (sharedPosts) {
        allPosts.push(...sharedPosts.map(share => ({
          ...share.original_post,
          type: 'shared',
          shared_by: share.user_id,
          share_text: share.share_text,
          shared_at: share.created_at
        })));
      }

      // Sort by creation/share time
      allPosts.sort((a, b) => {
        const dateA = new Date(a.type === 'shared' ? a.shared_at : a.created_at);
        const dateB = new Date(b.type === 'shared' ? b.shared_at : b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setPosts(allPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posts</h3>
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No posts yet. Start sharing your thoughts and insights with the community!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posts & Shared Content</h3>
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={`${post.type}-${post.id}`} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            {/* Shared post indicator */}
            {post.type === 'shared' && (
              <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                <Share2 className="h-4 w-4" />
                <span>Shared on {new Date(post.shared_at).toLocaleDateString()}</span>
                {post.share_text && (
                  <div className="ml-4 p-2 bg-white dark:bg-gray-600 rounded text-sm">
                    "{post.share_text}"
                  </div>
                )}
              </div>
            )}

            {/* Post content */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0">
                {userProfile.profile_photo ? (
                  <img
                    src={userProfile.profile_photo}
                    alt={userProfile.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {userProfile.full_name || 'AI Enthusiast'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-4">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Media */}
            {post.image_url && (
              <div className="mb-4">
                <img
                  src={post.image_url}
                  alt="Post image"
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              </div>
            )}

            {post.video_url && (
              <div className="mb-4">
                <video
                  src={post.video_url}
                  controls
                  className="w-full max-h-96 rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {post.link_url && (
              <div className="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <a
                  href={post.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {post.link_url}
                </a>
              </div>
            )}

            {/* Post stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-4">
                <span>{post.view_count || 0} views</span>
                <span>{post.share_count || 0} shares</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Reactions</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostsTab;