import React, { useState } from 'react';
import { Crown, Check, Zap, MessageCircle, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Upgrade: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const features = [
    {
      icon: MessageCircle,
      title: 'Unlimited Messaging',
      description: 'Send unlimited messages to your network without monthly limits',
      free: '10 messages/month',
      premium: 'Unlimited'
    },
    {
      icon: Users,
      title: 'Unlimited Connection Requests',
      description: 'Connect with as many creators as you want',
      free: '50 requests/month',
      premium: 'Unlimited'
    },
    {
      icon: Star,
      title: 'Priority Support',
      description: 'Get priority customer support and feature requests',
      free: 'Standard support',
      premium: 'Priority support'
    },
    {
      icon: Crown,
      title: 'Premium Badge',
      description: 'Stand out with a premium badge on your profile',
      free: 'No badge',
      premium: 'Premium badge'
    },
    {
      icon: Zap,
      title: 'Advanced Analytics',
      description: 'Access detailed insights about your content performance',
      free: 'Basic analytics',
      premium: 'Advanced analytics'
    }
  ];

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Please sign in to upgrade');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          priceId: plan === 'monthly' ? 'price_monthly' : 'price_yearly',
          plan: plan
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="h-4 w-4" />
            <span>Premium Membership</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Unlock Your Full
            <span className="text-gradient block">Creative Potential</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join thousands of creators who've upgraded to premium and supercharged their networking and content creation.
          </p>
        </div>

        {/* Features Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            What's Included in Premium
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Free:</span>
                      <span className="text-gray-700 dark:text-gray-300">{feature.free}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-600 font-medium">Premium:</span>
                      <span className="text-primary-600 font-medium flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        {feature.premium}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Monthly</CardTitle>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                $9.99
                <span className="text-lg text-gray-500 font-normal">/month</span>
              </div>
              <CardDescription>Perfect for getting started with premium features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => handleUpgrade('monthly')}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Processing...' : (
                  <>
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                Cancel anytime. No questions asked.
              </p>
            </CardContent>
          </Card>

          {/* Yearly Plan */}
          <Card className="relative border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            </div>
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl">Yearly</CardTitle>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                $99.99
                <span className="text-lg text-gray-500 font-normal">/year</span>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                Save $19.89 (17% off)
              </div>
              <CardDescription>Best value for serious creators and networkers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => handleUpgrade('yearly')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                size="lg"
              >
                {loading ? 'Processing...' : (
                  <>
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                Cancel anytime. 30-day money-back guarantee.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Questions about Premium?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We're here to help! Contact our support team for any questions about premium features.
          </p>
          <Button variant="outline" size="lg">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;