import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReviewsProps {
  toolId: string;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
  user_profiles?: {
    full_name: string;
    profile_photo?: string;
  };
}

const ToolReviews: React.FC<ReviewsProps> = ({ toolId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  useEffect(() => {
    fetchReviews();
  }, [toolId]);

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('tool_reviews')
        .select(`
          id,
          user_id,
          rating,
          title,
          comment,
          created_at
        `)
        .eq('tool_id', toolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const reviewsWithProfiles = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', review.user_id)
            .single();

          return {
            ...review,
            user_profiles: profileData || { full_name: 'Anonymous', profile_photo: null }
          };
        })
      );

      setReviews(reviewsWithProfiles);
      
      // Check if current user has already reviewed
      if (user) {
        const userExistingReview = reviewsWithProfiles.find(r => r.user_id === user.id);
        setUserReview(userExistingReview || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to leave a review');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        tool_id: toolId,
        user_id: user.id,
        rating: newReview.rating,
        title: newReview.title.trim() || null,
        comment: newReview.comment.trim() || null
      };

      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('tool_reviews')
          .update(reviewData)
          .eq('id', userReview.id);
        
        if (error) throw error;
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        const { error } = await supabase
          .from('tool_reviews')
          .insert(reviewData);
        
        if (error) throw error;
        toast.success('Review submitted successfully!');
      }

      setShowReviewForm(false);
      setNewReview({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, editable = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={editable ? "button" : undefined}
            onClick={editable && onRatingChange ? () => onRatingChange(star) : undefined}
            className={editable ? "cursor-pointer" : "cursor-default"}
            disabled={!editable}
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              } ${editable ? 'hover:text-yellow-300' : ''}`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with review button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews ({reviews.length})
        </h3>
        
        {user && (
          <button
            onClick={() => {
              if (userReview) {
                setNewReview({
                  rating: userReview.rating,
                  title: userReview.title || '',
                  comment: userReview.comment || ''
                });
              }
              setShowReviewForm(!showReviewForm);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all duration-200 text-sm font-medium"
          >
            {userReview ? 'Edit Review' : 'Write Review'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </h4>
          
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              {renderStars(newReview.rating, true, (rating) => 
                setNewReview(prev => ({ ...prev, rating }))
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Summarize your experience..."
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comment (optional)
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Share your detailed thoughts about this tool..."
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : (userReview ? 'Update Review' : 'Submit Review')}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No reviews yet. Be the first to review this tool!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {review.user_profiles?.profile_photo ? (
                    <img
                      src={review.user_profiles.profile_photo}
                      alt={review.user_profiles.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {review.user_profiles?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {review.user_profiles?.full_name || 'Anonymous'}
                    </h5>
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {review.title && (
                    <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                      {review.title}
                    </h6>
                  )}
                  
                  {review.comment && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ToolReviews;