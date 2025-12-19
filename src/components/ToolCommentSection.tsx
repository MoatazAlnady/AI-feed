import React, { useState, useEffect } from 'react';
import { MessageCircle, User, Send, ThumbsUp, Flag, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VerificationBadge from './VerificationBadge';
import ProfileHoverCard from './ProfileHoverCard';

interface Comment {
  id: number;
  userId: string;
  userName: string;
  userPhoto?: string;
  userVerified: boolean;
  userTopVoice: boolean;
  content: string;
  timestamp: string;
  likes: number;
  userLiked?: boolean;
  replies?: Reply[];
}

interface Reply {
  id: number;
  userId: string;
  userName: string;
  userPhoto?: string;
  userVerified: boolean;
  content: string;
  timestamp: string;
  likes: number;
  userLiked?: boolean;
}

interface ToolCommentSectionProps {
  toolId: number;
  className?: string;
}

const ToolCommentSection: React.FC<ToolCommentSectionProps> = ({ toolId, className = '' }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // In real app, fetch from API
        // const response = await fetch(`/api/tools/${toolId}/comments`);
        // const data = await response.json();
        // setComments(data);
        
        // Mock data
        setComments([]);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [toolId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    
    try {
      const newCommentObj: Comment = {
        id: Date.now(),
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.user_metadata?.profile_photo,
        userVerified: user.user_metadata?.verified || false,
        userTopVoice: user.user_metadata?.ai_feed_top_voice || false,
        content: newComment,
        timestamp: 'Just now',
        likes: 0,
        replies: []
      };
      
      // In real app, send to API
      // await fetch(`/api/tools/${toolId}/comments`, {
      //   method: 'POST',
      //   body: JSON.stringify(newCommentObj)
      // });
      
      setComments([newCommentObj, ...comments]);
      setNewComment('');
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleSubmitReply = async (commentId: number) => {
    if (!user || !replyText.trim()) return;
    
    try {
      const newReply: Reply = {
        id: Date.now(),
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.user_metadata?.profile_photo,
        userVerified: user.user_metadata?.verified || false,
        content: replyText,
        timestamp: 'Just now',
        likes: 0
      };
      
      // In real app, send to API
      // await fetch(`/api/tools/${toolId}/comments/${commentId}/replies`, {
      //   method: 'POST',
      //   body: JSON.stringify(newReply)
      // });
      
      setComments(comments.map(comment => 
        comment.id === commentId
          ? { 
              ...comment, 
              replies: [...(comment.replies || []), newReply] 
            }
          : comment
      ));
      
      setReplyingTo(null);
      setReplyText('');
      
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleLikeComment = (commentId: number) => {
    if (!user) return;
    
    setComments(comments.map(comment => {
      if (comment.id !== commentId) return comment;
      
      const userLiked = !comment.userLiked;
      const likes = userLiked ? comment.likes + 1 : comment.likes - 1;
      
      return {
        ...comment,
        likes,
        userLiked
      };
    }));
  };

  const handleLikeReply = (commentId: number, replyId: number) => {
    if (!user) return;
    
    setComments(comments.map(comment => {
      if (comment.id !== commentId) return comment;
      
      const updatedReplies = comment.replies?.map(reply => {
        if (reply.id !== replyId) return reply;
        
        const userLiked = !reply.userLiked;
        const likes = userLiked ? reply.likes + 1 : reply.likes - 1;
        
        return {
          ...reply,
          likes,
          userLiked
        };
      });
      
      return {
        ...comment,
        replies: updatedReplies
      };
    }));
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'recent') {
      // Sort by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      // Sort by likes (most liked first)
      return b.likes - a.likes;
    }
  });

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
      
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {user.user_metadata?.profile_photo ? (
                <img
                  src={user.user_metadata.profile_photo}
                  alt={user.user_metadata?.full_name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this tool..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Post Comment</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      {/* Comments Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
            className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>
      
      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <ProfileHoverCard userId={comment.userId}>
                  <div className="flex-shrink-0 cursor-pointer">
                    {comment.userPhoto ? (
                      <img
                        src={comment.userPhoto}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-primary transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary transition-all">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </ProfileHoverCard>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <ProfileHoverCard userId={comment.userId}>
                      <h4 className="font-semibold text-gray-900 cursor-pointer hover:underline">{comment.userName}</h4>
                    </ProfileHoverCard>
                    {comment.userVerified && (
                      <VerificationBadge 
                        type={comment.userTopVoice ? 'both' : 'verified'} 
                        size="sm" 
                      />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">{comment.timestamp}</p>
                  <p className="text-gray-800 mb-4">{comment.content}</p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <button 
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center space-x-1 ${
                        comment.userLiked ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{comment.likes}</span>
                    </button>
                    <button 
                      onClick={() => setReplyingTo(comment.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Reply</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                      <Flag className="h-4 w-4" />
                      <span>Report</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 flex space-x-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyText.trim()}
                          className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-6 border-l-2 border-gray-200 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start space-x-3">
                          <ProfileHoverCard userId={reply.userId}>
                            <div className="flex-shrink-0 cursor-pointer">
                              {reply.userPhoto ? (
                                <img
                                  src={reply.userPhoto}
                                  alt={reply.userName}
                                  className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-primary transition-all"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary transition-all">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                          </ProfileHoverCard>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <ProfileHoverCard userId={reply.userId}>
                                <h5 className="font-medium text-gray-900 text-sm cursor-pointer hover:underline">{reply.userName}</h5>
                              </ProfileHoverCard>
                              {reply.userVerified && (
                                <VerificationBadge type="verified" size="sm" />
                              )}
                              <span className="text-xs text-gray-500">{reply.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-800 mb-2">{reply.content}</p>
                            <div className="flex items-center space-x-3 text-xs">
                              <button 
                                onClick={() => handleLikeReply(comment.id, reply.id)}
                                className={`flex items-center space-x-1 ${
                                  reply.userLiked ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                <ThumbsUp className="h-3 w-3" />
                                <span>{reply.likes}</span>
                              </button>
                              <button className="text-gray-500 hover:text-gray-700">
                                Reply
                              </button>
                              <button className="text-gray-500 hover:text-gray-700">
                                Report
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Comments Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Be the first to comment on this tool and start a discussion.
          </p>
          {user ? (
            <p className="text-gray-600">
              Share your thoughts in the comment box above.
            </p>
          ) : (
            <p className="text-gray-600">
              Please <a href="#" className="text-primary-600 hover:text-primary-700">sign in</a> to leave a comment.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolCommentSection;