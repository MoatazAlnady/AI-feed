import React, { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { makeHashtagsClickable } from '../utils/hashtagUtils';
import PostReactions from './PostReactions';

interface Post {
  id: number;
  author: {
    name: string;
    avatar: string;
    title: string;
    verified: boolean;
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
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});

  // Get user interests for personalized feed
  const userInterests = user?.user_metadata?.interests || [];

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_profiles!posts_user_id_fkey(
            full_name,
            profile_photo,
            job_title,
            verified,
            ai_nexus_top_voice
          ),
          post_reactions(
            reaction_type,
            user_id
          ),
          post_comments(
            id,
            content,
            created_at,
            user_profiles!post_comments_user_id_fkey(
              full_name,
              profile_photo
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedPosts = postsData?.map(post => ({
        id: parseInt(post.id),
        author: {
          name: post.user_profiles?.full_name || 'Anonymous User',
          avatar: post.user_profiles?.profile_photo || '',
          title: post.user_profiles?.job_title || 'AI Enthusiast',
          verified: post.user_profiles?.verified || false,
          topVoice: post.user_profiles?.ai_nexus_top_voice || false
        },
        content: post.content,
        timestamp: new Date(post.created_at).toLocaleDateString(),
        likes: post.likes || 0,
        comments: post.post_comments?.map(comment => ({
          id: parseInt(comment.id),
          author: {
            name: comment.user_profiles?.full_name || 'Anonymous',
            avatar: comment.user_profiles?.profile_photo || ''
          },
          content: comment.content,
          timestamp: new Date(comment.created_at).toLocaleDateString(),
          likes: 0
        })) || [],
        shares: post.shares || 0,
        image: post.image_url,
        video: post.video_url,
        link: post.link_url,
        tags: [],
        liked: post.post_reactions?.some(r => r.user_id === user?.id && r.reaction_type === 'like') || false,
        bookmarked: false
      })) || [];

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

  const handleLike = (postId: number) => {
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

  const handleBookmark = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, bookmarked: !post.bookmarked }
        : post
    ));
  };

  const handleShare = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ));
    // In a real app, this would open a share dialog
    alert('Post shared!');
  };

  const handleComment = (postId: number) => {
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

  const toggleComments = (postId: number) => {
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

      {posts.map((post) => (
        <div key={post.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-start space-x-4">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{post.author.name}</h3>
                {post.author.verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{post.author.title} • {post.timestamp}</p>
              
              <div className="text-gray-800 dark:text-gray-200 mb-4">
                {post.content}
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
                  <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
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
    </div>
  );
};

export default NewsFeed;