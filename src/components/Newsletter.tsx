import React, { useState } from 'react';
import { Mail, CheckCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Newsletter: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('weekly');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get user interests for personalization
  const userInterests = user?.user_metadata?.interests || [];
  const isUserSubscribed = user?.user_metadata?.newsletter_subscription || false;

  const availableInterests = [
    'AI Research', 'Machine Learning', 'Deep Learning', 'Computer Vision',
    'Natural Language Processing', 'AI Ethics', 'Robotics', 'Data Science',
    'AI Tools', 'Startups', 'Industry News', 'Tutorials', 'Case Studies'
  ];

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email || user) {
      setIsLoading(true);
      
      // Simulate API call to subscribe user with personalized preferences
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const subscriptionData = {
        email: email || user?.email,
        interests: user ? userInterests : interests,
        frequency,
        userId: user?.id,
        personalizedContent: true,
        subscribedAt: new Date().toISOString()
      };
      
      console.log('Newsletter subscription:', subscriptionData);
      
      setIsSubscribed(true);
      setEmail('');
      setIsLoading(false);
    }
  };

  if (isSubscribed || isUserSubscribed) {
    return (
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-600 dark:from-primary-900 dark:to-secondary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-md mx-auto bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <CheckCircle className="h-12 w-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {isUserSubscribed ? 'You\'re subscribed!' : 'Welcome aboard!'}
            </h3>
            <p className="text-white/90 mb-6">
              {user ? (
                <>
                  You'll receive personalized AI updates based on your interests: {' '}
                  <span className="font-medium">
                    {userInterests.slice(0, 3).join(', ')}
                    {userInterests.length > 3 && ` and ${userInterests.length - 3} more`}
                  </span>
                </>
              ) : (
                'Thank you for subscribing. You\'ll receive updates about new AI tools, featured articles, and the latest trends in artificial intelligence.'
              )}
            </p>
            {user && (
              <button
                onClick={() => window.location.href = '/settings'}
                className="flex items-center space-x-2 px-6 py-2 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors mx-auto"
              >
                <Settings className="h-4 w-4" />
                <span>Manage Preferences</span>
              </button>
            )}
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-white/80">
            <div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm">Subscribers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Personalized</div>
              <div className="text-sm">Content</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">No Spam</div>
              <div className="text-sm">Guaranteed</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-600 dark:from-primary-900 dark:to-secondary-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="inline-flex p-3 bg-white/20 dark:bg-white/10 rounded-full mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Stay Ahead of the AI Curve
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Get personalized updates on AI tools, trends, and breakthroughs tailored to your interests. 
            Be the first to know about new tools and featured articles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          {!user && (
            <>
              {/* Email Input for non-authenticated users */}
              <div className="mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-6 py-4 text-gray-900 dark:text-white rounded-xl border-0 focus:ring-2 focus:ring-white/50 focus:outline-none bg-white dark:bg-gray-800"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Interest Selection for non-authenticated users */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">Select your interests (optional):</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableInterests.slice(0, 9).map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        interests.includes(interest)
                          ? 'bg-white text-primary-600 border-white'
                          : 'bg-white/20 dark:bg-white/10 text-white border-white/30 hover:bg-white/30'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Frequency Selection */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">How often would you like to hear from us?</h3>
            <div className="flex justify-center space-x-4">
              {[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' }
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-2 text-white cursor-pointer">
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
            disabled={isLoading || (!email && !user)}
            className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span>Subscribing...</span>
              </div>
            ) : (
              user ? 'Subscribe to Personalized Newsletter' : 'Subscribe'
            )}
          </button>
          
          <p className="text-white/70 text-sm mt-4">
            Join 50,000+ professionals. {user ? 'Personalized content based on your interests.' : 'No spam, unsubscribe anytime.'}
          </p>
        </form>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-white/80">
          <div>
            <div className="text-2xl font-bold text-white">50K+</div>
            <div className="text-sm">Subscribers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{user ? 'Personalized' : 'Weekly'}</div>
            <div className="text-sm">{user ? 'Content' : 'Updates'}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">No Spam</div>
            <div className="text-sm">Guaranteed</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;