import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, User, Send, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import ProfileHoverCard from './ProfileHoverCard';
import { Link } from 'react-router-dom';
import { getCreatorProfileLink } from '@/utils/profileUtils';

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  user_photo?: string;
  user_handle?: string;
  user_title?: string;
  rating: number;
  title?: string;
  comment: string;
  pros: string[];
  cons: string[];
  created_at: string;
  likes: number;
  dislikes: number;
  userLiked?: boolean;
  userDisliked?: boolean;
}

interface ArticleReviewSystemProps {
  articleId: string;
  articleTitle: string;
  className?: string;
}

const ArticleReviewSystem: React.FC<ArticleReviewSystemProps> = ({ 
  articleId, 
  articleTitle, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'positive' | 'negative'>('all');
  
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    pros: [''],
    cons: ['']
  });

  useEffect(() => {
    fetchReviews();
  }, [articleId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Use type assertion since table was just created
      const { data: reviewsData, error } = await (supabase
        .from('article_reviews' as any)
        .select('*')
        .eq('article_id', articleId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map((r: any) => r.user_id))] as string[];
        const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', { ids: userIds });

        const formattedReviews: Review[] = reviewsData.map((review: any) => {
          const profile = profiles?.find((p: any) => p.id === review.user_id);
          return {
            id: review.id,
            user_id: review.user_id,
            user_name: profile?.full_name || 'Anonymous',
            user_photo: profile?.profile_photo,
            user_handle: profile?.handle,
            user_title: profile?.job_title,
            rating: review.rating,
            title: review.title,
            comment: review.comment || '',
            pros: review.pros || [],
            cons: review.cons || [],
            created_at: review.created_at,
            likes: review.likes || 0,
            dislikes: review.dislikes || 0
          };
        });

        setReviews(formattedReviews);
        
        if (user) {
          const existingReview = formattedReviews.find(r => r.user_id === user.id);
          if (existingReview) {
            setUserReview(existingReview);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }
    
    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      const filteredPros = formData.pros.filter(pro => pro.trim());
      const filteredCons = formData.cons.filter(con => con.trim());
      
      // Use type assertion for newly created table
      const { data, error } = await (supabase
        .from('article_reviews' as any)
        .insert({
          article_id: articleId,
          user_id: user.id,
          rating: formData.rating,
          title: formData.title || null,
          comment: formData.comment,
          pros: filteredPros,
          cons: filteredCons
        })
        .select()
        .single() as any);

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this article');
          return;
        }
        throw error;
      }
      
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setFormData({ rating: 0, title: '', comment: '', pros: [''], cons: [''] });
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];
    
    if (filterBy === 'positive') {
      filtered = filtered.filter(review => review.rating >= 4);
    } else if (filterBy === 'negative') {
      filtered = filtered.filter(review => review.rating <= 2);
    }
    
    if (sortBy === 'helpful') {
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
    <div className={`bg-card rounded-2xl shadow-sm border border-border p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-foreground mb-6">Reviews & Ratings</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-foreground mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                ))}
              </div>
              <p className="text-muted-foreground">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            
            <div className="col-span-2">
              <h3 className="font-semibold text-foreground mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {ratingCounts.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium text-foreground">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-right text-sm text-muted-foreground">
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
              <Button onClick={() => setShowReviewForm(true)} className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Write a Review</span>
              </Button>
            </div>
          )}
          
          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-muted rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Write a Review for {articleTitle}
              </h3>
              
              <form onSubmit={handleSubmitReview}>
                {/* Rating Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
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
                              : 'text-muted-foreground'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Review Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Review Title (optional)
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Summarize your review"
                  />
                </div>
                
                {/* Review Comment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Review *
                  </label>
                  <Textarea
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    required
                    rows={4}
                    placeholder="Share your experience with this article..."
                  />
                </div>
                
                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Pros</label>
                    <div className="space-y-2">
                      {formData.pros.map((pro, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={pro}
                            onChange={(e) => handleProChange(index, e.target.value)}
                            placeholder="Enter a positive aspect"
                          />
                          {formData.pros.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePro(index)}
                              className="text-destructive"
                            >
                              −
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={addPro} className="text-green-600">
                        + Add Pro
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cons</label>
                    <div className="space-y-2">
                      {formData.cons.map((con, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={con}
                            onChange={(e) => handleConChange(index, e.target.value)}
                            placeholder="Enter a negative aspect"
                          />
                          {formData.cons.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCon(index)}
                              className="text-destructive"
                            >
                              −
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={addCon} className="text-red-600">
                        + Add Con
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Review
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          {/* Filters */}
          {reviews.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="all">All Reviews</option>
                  <option value="positive">Positive (4-5★)</option>
                  <option value="negative">Critical (1-2★)</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Reviews List */}
          <div className="space-y-6">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reviews yet. Be the first to review this article!
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-start space-x-3 mb-3">
                    <ProfileHoverCard userId={review.user_id}>
                      <Link to={getCreatorProfileLink({ id: review.user_id, handle: review.user_handle })}>
                        <Avatar className="h-10 w-10">
                          {review.user_photo ? (
                            <AvatarImage src={review.user_photo} />
                          ) : (
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </Link>
                    </ProfileHoverCard>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <ProfileHoverCard userId={review.user_id}>
                            <Link 
                              to={getCreatorProfileLink({ id: review.user_id, handle: review.user_handle })}
                              className="font-semibold text-foreground hover:underline"
                            >
                              {review.user_name}
                            </Link>
                          </ProfileHoverCard>
                          {review.user_title && (
                            <p className="text-sm text-muted-foreground">{review.user_title}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-muted-foreground'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {review.title && (
                    <h4 className="font-semibold text-foreground mb-2">{review.title}</h4>
                  )}
                  
                  <p className="text-foreground mb-4">{review.comment}</p>
                  
                  {(review.pros.length > 0 || review.cons.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {review.pros.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-green-600 mb-2">Pros</h5>
                          <ul className="space-y-1">
                            {review.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start">
                                <span className="text-green-500 mr-2">+</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.cons.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-red-600 mb-2">Cons</h5>
                          <ul className="space-y-1">
                            {review.cons.map((con, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start">
                                <span className="text-red-500 mr-2">−</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">{review.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsDown className="h-4 w-4" />
                      <span className="text-sm">{review.dislikes}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ArticleReviewSystem;