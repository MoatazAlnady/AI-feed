import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';

interface NewsletterPopupProps {
  onClose: () => void;
}

const NewsletterPopup: React.FC<NewsletterPopupProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user) {
      fetchPremiumStatus();
    }
  }, [user]);

  const fetchPremiumStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('is_premium, premium_until')
      .eq('id', user.id)
      .single();
    
    const isActive = data?.is_premium && 
      (!data.premium_until || new Date(data.premium_until) > new Date());
    setIsPremium(!!isActive);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Insert into newsletter_subscribers table
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .upsert({
          email: email.trim().toLowerCase(),
          subscribed_at: new Date().toISOString(),
          status: 'active',
          frequency,
          user_id: user?.id || null
        }, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        });

      if (insertError) {
        // Check if it's a duplicate - that's okay
        if (!insertError.message.includes('duplicate')) {
          throw insertError;
        }
      }
      
      setIsSuccess(true);
      sessionStorage.setItem('newsletter_shown', 'true');
      
      // If user is logged in, update their profile
      if (user) {
        try {
          await supabase.auth.updateUser({
            data: { 
              newsletter_subscription: true,
              newsletter_frequency: frequency
            }
          });
          
          await supabase
            .from('user_profiles')
            .update({ newsletter_subscription: true })
            .eq('id', user.id);
        } catch (error) {
          console.error('Error updating user profile:', error);
        }
      }

      toast.success('Successfully subscribed to newsletter!');
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full relative overflow-hidden animate-slide-up border border-border">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Colorful top banner */}
        <div className="h-3 bg-gradient-to-r from-primary to-secondary"></div>

        <div className="p-8">
          {isSuccess ? (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                Thanks for subscribing!
              </h3>
              <p className="text-muted-foreground mb-6">
                You're now subscribed to our newsletter. We'll keep you updated with the latest AI tools and trends.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-md transition-all"
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex p-3 bg-primary/10 rounded-full mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Stay Ahead in AI
                </h3>
                <p className="text-muted-foreground">
                  Subscribe to our newsletter for the latest AI tools, trends, and insights delivered to your inbox.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    required
                  />
                  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                </div>

                {/* Frequency Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    How often would you like to hear from us?
                  </label>
                  <div className="space-y-2">
                    <TooltipProvider>
                      {[
                        { value: 'daily', label: 'Daily', premium: true },
                        { value: 'semiweekly', label: 'Semi-weekly (2x/week)', premium: false },
                        { value: 'weekly', label: 'Weekly', premium: false },
                        { value: 'biweekly', label: 'Bi-weekly (every 2 weeks)', premium: false },
                        { value: 'monthly', label: 'Monthly', premium: false }
                      ].map(({ value, label, premium }) => {
                        const isDisabled = premium && !isPremium;
                        const radioOption = (
                          <label 
                            key={value} 
                            className={`flex items-center space-x-2 text-foreground ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <input
                              type="radio"
                              name="frequency"
                              value={value}
                              checked={frequency === value}
                              onChange={(e) => !isDisabled && setFrequency(e.target.value)}
                              disabled={isDisabled}
                              className="text-primary focus:ring-primary"
                            />
                            <span>{label}</span>
                            {premium && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                <Crown className="h-3 w-3" />
                                Premium
                              </Badge>
                            )}
                          </label>
                        );

                        if (isDisabled) {
                          return (
                            <Tooltip key={value}>
                              <TooltipTrigger asChild>
                                {radioOption}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Upgrade to Premium for daily updates</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return radioOption;
                      })}
                    </TooltipProvider>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
                </button>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Join 50,000+ professionals. {user ? 'Personalized content based on your interests.' : 'No spam, unsubscribe anytime.'}
                </p>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  Join 50,000+ AI enthusiasts who get our weekly updates
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;