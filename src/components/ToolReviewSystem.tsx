import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, Flag, User, Send, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import VerificationBadge from './VerificationBadge';

interface Review {
  id: number;
  userId: string;
  userName: string;
  userPhoto?: string;
  userTitle?: string;
  userVerified: boolean;
  userTopVoice: boolean;
  rating: number;
  comment: string;
  pros: string[];
  cons: string[];
  date: string;
  likes: number;
  dislikes: number;
  userLiked?: boolean;
  userDisliked?: boolean;
  replies?: Reply[];
}

interface Reply {
  id: number;
  userId: string;
  userName: string;
  userPhoto?: string;
  userVerified: boolean;
  comment: string;
  date: string;
  likes: number;
}

interface ToolReviewSystemProps {
  toolId: number;
  toolName: string;
  className?: string;
}

const ToolReviewSystem: React.FC<ToolReviewSystemProps> = ({ toolId, toolName, className = '' }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'positive' | 'negative' | 'verified'>('all');
  
  // Review form state
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    pros: [''],
    cons: ['']
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // In real app, fetch from API
        // const response = await fetch(`/api/tools/${toolId}/reviews`);
        // const data = await response.json();
        // setReviews(data.reviews);
        // setUserReview(data.userReview);
        
        // Mock data
        setReviews([]);
        setUserReview(null);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [toolId]);

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleProChange = (index: number, value: string) => {
    const newPros = [...formData.pros];
    newPros[index] = value;
    setFormData(prev => ({ ...prev, pros: newPros }));
  };

  const handleConChange = (index: number, value: string) => {
    const newCons = [...formData.cons];
    newCons[index] = value;
    setFormData(prev => ({ ...prev, cons: newCons }));
  };

  const addPro = () => {
    setFormData(prev => ({ ...prev, pros: [...prev.pros, ''] }));
  };

  const removePro = (index: number) => {
    if (formData.pros.length > 1) {
      const newPros = formData.pros.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, pros: newPros }));
    }
  };

  const addCon = () => {
    setFormData(prev => ({ ...prev, cons: [...prev.cons, ''] }));
  };

  const removeCon = (index: number) => {
    if (formData.cons.length > 1) {
      const newCons = formData.cons.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, cons: newCons }));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Filter out empty pros and cons
      const filteredPros = formData.pros.filter(pro => pro.trim());
      const filteredCons = formData.cons.filter(con => con.trim());
      
      const newReview: Review = {
        id: Date.now(),
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.user_metadata?.profile_photo,
        userTitle: user.user_metadata?.job_title,
        userVerified: user.user_metadata?.verified || false,
        userTopVoice: user.user_metadata?.ai_nexus_top_voice || false,
        rating: formData.rating,
        comment: formData.comment,
        pros: filteredPros,
        cons: filteredCons,
        date: 'Just now',
        likes: 0,
        dislikes: 0,
        replies: []
      };
      
      // In real app, send to API
      // await fetch(`/api/tools/${toolId}/reviews`, {
      //   method: 'POST',
      //   body: JSON.stringify(newReview)
      // });
      
      // Update local state
      setUserReview(newReview);
      setReviews([newReview, ...reviews]);
      setShowReviewForm(false);
      
      // Reset form
      setFormData({
        rating: 0,
        comment: '',
        pros: [''],
        cons: ['']
      });
      
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleReply = async (reviewId: number) => {
    if (!user || !replyText.trim()) return;
    
    try {
      const newReply: Reply = {
        id: Date.now(),
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.user_metadata?.profile_photo,
        userVerified: user.user_metadata?.verified || false,
        comment: replyText,
        date: 'Just now',
        likes: 0
      };
      
      // In real app, send to API
      // await fetch(`/api/tools/${toolId}/reviews/${reviewId}/replies`, {
      //   method: 'POST',
      //   body: JSON.stringify(newReply)
      // });
      
      // Update local state
      setReviews(reviews.map(review => 
        review.id === reviewId
          ? { 
              ...review, 
              replies: [...(review.replies || []), newReply] 
            }
          : review
      ));
      
      setReplyingTo(null);
      setReplyText('');
      
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleLikeReview = (reviewId: number, action: 'like' | 'dislike') => {
    if (!user) return;
    
    setReviews(reviews.map(review => {
      if (review.id !== reviewId) return review;
      
      let likes = review.likes;
      let dislikes = review.dislikes;
      let userLiked = review.userLiked;
      let userDisliked = review.userDisliked;
      
      if (action === 'like') {
        if (userLiked) {
          // Unlike
          likes--;
          userLiked = false;
        } else {
          // Like
          likes++;
          userLiked = true;
          
          // Remove dislike if exists
          if (userDisliked) {
            dislikes--;
            userDisliked = false;
          }
        }
      } else {
        if (userDisliked) {
          // Undislike
          dislikes--;
          userDisliked = false;
        } else {
          // Dislike
          dislikes++;
          userDisliked = true;
          
          // Remove like if exists
          if (userLiked) {
            likes--;
            userLiked = false;
          }
        }
      }
      
      return {
        ...review,
        likes,
        dislikes,
        userLiked,
        userDisliked
      };
    }));
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];
    
    // Apply filters
    if (filterBy === 'positive') {
      filtered = filtered.filter(review => review.rating >= 4);
    } else if (filterBy === 'negative') {
      filtered = filtered.filter(review => review.rating <= 2);
    } else if (filterBy === 'verified') {
      filtered = filtered.filter(review => review.userVerified);
    }
    
    // Apply sorting
    if (sortBy === 'recent') {
      // Already sorted by date (newest first)
    } else if (sortBy === 'helpful') {
      filtered.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    }
    
    return filtered;
  };

  const filteredReviews = getFilteredAndSortedReviews();
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? Math.round((reviews.filter(review => review.rating === rating).length / reviews.length) * 100) 
      : 0
  }));

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews & Ratings</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <p className="text-gray-600">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            
            {/* Rating Distribution */}
            <div className="col-span-2">
              <h3 className="font-semibold text-gray-900 mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {ratingCounts.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium text-gray-700">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-right text-sm text-gray-600">
                      {count} ({percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Write Review Button */}
          {user && !userReview && !showReviewForm && (
            <div className="mb-8">
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full md:w-auto px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Star className="h-5 w-5" />
                <span>Write a Review</span>
              </button>
            </div>
          )}
          
          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 animate-slide-up">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Write a Review for {toolName}
              </h3>
              
              <form onSubmit={handleSubmitReview}>
                {/* Rating Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Rating *
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="p-1 focus:outline-none"
                      >
                        <Star 
                          className={`h-8 w-8 ${
                            star <= formData.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {formData.rating > 0 ? (
                        formData.rating === 5 ? 'Excellent' :
                        formData.rating === 4 ? 'Very Good' :
                        formData.rating === 3 ? 'Good' :
                        formData.rating === 2 ? 'Fair' :
                        'Poor'
                      ) : 'Select a rating'}
                    </span>
                  </div>
                </div>
                
                {/* Review Comment */}
                <div className="mb-6">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Share your experience with this tool..."
                  />
                </div>
                
                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Pros */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pros
                    </label>
                    <div className="space-y-2">
                      {formData.pros.map((pro, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={pro}
                            onChange={(e) => handleProChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter a positive aspect"
                          />
                          {formData.pros.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePro(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addPro}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span className="text-sm">Add Pro</span>
                      </button>
                    </div>
                  </div>

                  {/* Cons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cons
                    </label>
                    <div className="space-y-2">
                      {formData.cons.map((con, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={con}
                            onChange={(e) => handleConChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter a limitation or drawback"
                          />
                          {formData.cons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCon(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCon}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span className="text-sm">Add Con</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Submit Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formData.rating === 0 || !formData.comment.trim()}
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* User's Review */}
          {userReview && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-8 animate-slide-up">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {userReview.userPhoto ? (
                    <img
                      src={userReview.userPhoto}
                      alt={userReview.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{userReview.userName}</h3>
                    {userReview.userVerified && (
                      <VerificationBadge 
                        type={userReview.userTopVoice ? 'both' : 'verified'} 
                        size="sm" 
                      />
                    )}
                    <span className="text-sm text-gray-500">
                      (Your review)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`h-4 w-4 ${
                          star <= userReview.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{userReview.date}</span>
                  </div>
                  
                  <p className="text-gray-800 mb-4">{userReview.comment}</p>
                  
                  {/* Pros and Cons */}
                  {(userReview.pros.length > 0 || userReview.cons.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {userReview.pros.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-700 mb-2 flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Pros
                          </h4>
                          <ul className="space-y-1">
                            {userReview.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {userReview.cons.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-2 flex items-center">
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Cons
                          </h4>
                          <ul className="space-y-1">
                            {userReview.cons.map((con, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div>
              {/* Filters and Sorting */}
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div className="flex items-center space-x-2 mb-4 md:mb-0">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <div className="flex space-x-2">
                    {[
                      { key: 'all', label: 'All Reviews' },
                      { key: 'positive', label: 'Positive' },
                      { key: 'negative', label: 'Negative' },
                      { key: 'verified', label: 'Verified Users' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilterBy(key as any)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          filterBy === key
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="helpful">Most Helpful</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                </div>
              </div>
              
              {/* Reviews */}
              <div className="space-y-6">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {review.userPhoto ? (
                          <img
                            src={review.userPhoto}
                            alt={review.userName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{review.userName}</h3>
                          {review.userVerified && (
                            <VerificationBadge 
                              type={review.userTopVoice ? 'both' : 'verified'} 
                              size="sm" 
                            />
                          )}
                          {review.userTitle && (
                            <span className="text-sm text-gray-500">
                              {review.userTitle}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">{review.date}</span>
                        </div>
                        
                        <p className="text-gray-800 mb-4">{review.comment}</p>
                        
                        {/* Pros and Cons */}
                        {(review.pros.length > 0 || review.cons.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {review.pros.length > 0 && (
                              <div>
                                <h4 className="font-medium text-green-700 mb-2 flex items-center">
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  Pros
                                </h4>
                                <ul className="space-y-1">
                                  {review.pros.map((pro, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {review.cons.length > 0 && (
                              <div>
                                <h4 className="font-medium text-red-700 mb-2 flex items-center">
                                  <ThumbsDown className="h-4 w-4 mr-1" />
                                  Cons
                                </h4>
                                <ul className="space-y-1">
                                  {review.cons.map((con, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <button 
                            onClick={() => handleLikeReview(review.id, 'like')}
                            className={`flex items-center space-x-1 ${
                              review.userLiked ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{review.likes}</span>
                          </button>
                          <button 
                            onClick={() => handleLikeReview(review.id, 'dislike')}
                            className={`flex items-center space-x-1 ${
                              review.userDisliked ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>{review.dislikes}</span>
                          </button>
                          <button 
                            onClick={() => setReplyingTo(review.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>Reply</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                            <Flag className="h-4 w-4" />
                            <span>Report</span>
                          </button>
                        </div>
                        
                        {/* Reply Form */}
                        {replyingTo === review.id && (
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
                                onClick={() => handleReply(review.id)}
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
                        {review.replies && review.replies.length > 0 && (
                          <div className="mt-4 pl-6 border-l-2 border-gray-200 space-y-4">
                            {review.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  {reply.userPhoto ? (
                                    <img
                                      src={reply.userPhoto}
                                      alt={reply.userName}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                      <User className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-gray-900 text-sm">{reply.userName}</h4>
                                    {reply.userVerified && (
                                      <VerificationBadge type="verified" size="sm" />
                                    )}
                                    <span className="text-xs text-gray-500">{reply.date}</span>
                                  </div>
                                  <p className="text-sm text-gray-800">{reply.comment}</p>
                                  <div className="mt-1 flex items-center space-x-2 text-xs">
                                    <button className="text-gray-500 hover:text-gray-700">
                                      Like ({reply.likes})
                                    </button>
                                    <button className="text-gray-500 hover:text-gray-700">
                                      Reply
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
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to review this tool and help others make informed decisions.
              </p>
              {user ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors"
                >
                  Write the First Review
                </button>
              ) : (
                <p className="text-gray-600">
                  Please <a href="#" className="text-primary-600 hover:text-primary-700">sign in</a> to write a review.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ToolReviewSystem;