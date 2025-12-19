import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
      // In a real app, this would be an API call to your newsletter service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSuccess(true);
      
      // Store in sessionStorage that user has subscribed for this session
      sessionStorage.setItem('newsletter_shown', 'true');
      
      // If user is logged in, update their profile
      if (user) {
        try {
          const { error } = await supabase.auth.updateUser({
            data: { 
              newsletter_subscription: true,
              newsletter_frequency: frequency
            }
          });
          
          if (error) throw error;
        } catch (error) {
          console.error('Error updating user profile:', error);
        }
      }
    } catch (error) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-xl max-w-md w-full relative overflow-hidden animate-slide-up border border-gray-200 dark:border-gray-700">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Colorful top banner */}
        <div className="h-3 bg-gradient-primary"></div>

        <div className="p-8">
          {isSuccess ? (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Thanks for subscribing!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You're now subscribed to our newsletter. We'll keep you updated with the latest AI tools and trends.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-md transition-all"
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Stay Ahead in AI
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-[#091527] text-gray-900 dark:text-white"
                    required
                  />
                  {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>

                {/* Frequency Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    How often would you like to hear from us?
                  </label>
                  <div className="flex space-x-4">
                    <TooltipProvider>
                      {[
                        { value: 'daily', label: 'Daily', premium: true },
                        { value: 'weekly', label: 'Weekly', premium: false },
                        { value: 'monthly', label: 'Monthly', premium: false }
                      ].map(({ value, label, premium }) => {
                        const isDisabled = premium && !isPremium;
                        const radioOption = (
                          <label 
                            key={value} 
                            className={`flex items-center space-x-2 text-gray-700 dark:text-gray-300 ${
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
                              className="text-primary-600 focus:ring-primary-500"
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
                  className="w-full bg-gradient-primary text-white py-3 rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
                </button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  Join 50,000+ professionals. {user ? 'Personalized content based on your interests.' : 'No spam, unsubscribe anytime.'}
                </p>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
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