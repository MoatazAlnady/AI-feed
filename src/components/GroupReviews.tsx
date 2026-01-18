import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface GroupReviewsProps {
  groupId: string;
  isMember: boolean;
  averageRating?: number;
  reviewCount?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer?: {
    full_name: string;
    profile_photo: string | null;
    handle: string;
  };
}

const StarRating: React.FC<{
  rating: number;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}> = ({ rating, onRate, size = 'md', interactive = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const GroupReviews: React.FC<GroupReviewsProps> = ({
  groupId,
  isMember,
  averageRating = 0,
  reviewCount = 0
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [groupId, user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('group_reviews')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch reviewer profiles
      if (data && data.length > 0) {
        const reviewerIds = data.map(r => r.reviewer_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, profile_photo, handle')
          .in('id', reviewerIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        const enrichedReviews = data.map(review => ({
          ...review,
          reviewer: profileMap.get(review.reviewer_id)
        }));

        setReviews(enrichedReviews);
        
        // Check if user has already reviewed
        if (user) {
          const existing = enrichedReviews.find(r => r.reviewer_id === user.id);
          setUserReview(existing || null);
        }
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || newRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('group_reviews')
        .insert({
          group_id: groupId,
          reviewer_id: user.id,
          rating: newRating,
          comment: newComment.trim() || null
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this group');
        } else {
          throw error;
        }
      } else {
        toast.success('Review submitted!');
        setShowForm(false);
        setNewRating(0);
        setNewComment('');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Average Rating Display */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
          <div>
            <StarRating rating={Math.round(averageRating)} size="md" />
            <p className="text-sm text-muted-foreground">{reviewCount} reviews</p>
          </div>
        </div>
        
        {isMember && !userReview && (
          <Button onClick={() => setShowForm(true)} variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && isMember && !userReview && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              <StarRating rating={newRating} onRate={setNewRating} size="lg" interactive />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience with this group..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} disabled={submitting || newRating === 0}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewer?.profile_photo || undefined} />
                    <AvatarFallback>
                      {review.reviewer?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{review.reviewer?.full_name || 'Anonymous'}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No reviews yet</p>
          {isMember && <p className="text-sm">Be the first to review this group!</p>}
        </div>
      )}
    </div>
  );
};

export default GroupReviews;
