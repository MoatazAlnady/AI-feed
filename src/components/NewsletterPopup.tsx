import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';

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

  useEffect(() => {
    // Pre-fill email if user is logged in
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full relative overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Colorful top banner */}
        <div className="h-3 bg-gradient-to-r from-primary-500 to-secondary-500"></div>

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
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    {[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="radio"
                          name="frequency"
                          value={value}
                          checked={frequency === value}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
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