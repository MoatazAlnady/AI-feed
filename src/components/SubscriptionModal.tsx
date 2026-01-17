import React, { useState } from 'react';
import { X, Check, Crown, Star, Zap, Users, Briefcase, BarChart3, MessageCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionSuccess: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSubscriptionSuccess }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'enterprise'>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = {
    basic: {
      name: 'Basic',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      monthly: 29,
      yearly: 290,
      popular: false as const,
      priceId: {
        monthly: 'price_basic_monthly',
        yearly: 'price_basic_yearly'
      },
      features: [
        'Search up to 50 profiles per month',
        'Basic filters (location, experience)',
        'Contact up to 10 candidates per month',
        'Post up to 2 jobs per month',
        'Basic analytics',
        'Email support'
      ],
      limits: {
        profileSearches: 50,
        candidateContacts: 10,
        jobPosts: 2
      }
    },
    professional: {
      name: 'Professional',
      icon: Crown,
      color: 'from-purple-500 to-purple-600',
      monthly: 79,
      yearly: 790,
      popular: true as const,
      priceId: {
        monthly: 'price_professional_monthly',
        yearly: 'price_professional_yearly'
      },
      features: [
        'Search up to 200 profiles per month',
        'Advanced filters (skills, languages, age)',
        'Contact up to 50 candidates per month',
        'Post up to 10 jobs per month',
        'Advanced analytics & insights',
        'Boolean search capabilities',
        'Priority support',
        'Export candidate data'
      ],
      limits: {
        profileSearches: 200,
        candidateContacts: 50,
        jobPosts: 10
      }
    },
    enterprise: {
      name: 'Enterprise',
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      monthly: 199,
      yearly: 1990,
      popular: false as const,
      priceId: {
        monthly: 'price_enterprise_monthly',
        yearly: 'price_enterprise_yearly'
      },
      features: [
        'Unlimited profile searches',
        'All advanced filters',
        'Unlimited candidate contacts',
        'Unlimited job posts',
        'Custom analytics dashboard',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
        'Team collaboration tools',
        'White-label options'
      ],
      limits: {
        profileSearches: 'Unlimited',
        candidateContacts: 'Unlimited',
        jobPosts: 'Unlimited'
      }
    }
  };

  const currentPlan = plans[selectedPlan];
  const price = billingCycle === 'monthly' ? currentPlan.monthly : currentPlan.yearly;
  const yearlyDiscount = Math.round((1 - (currentPlan.yearly / (currentPlan.monthly * 12))) * 100);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planId: selectedPlan,
          billingCycle,
          priceId: currentPlan.priceId[billingCycle],
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-canceled`
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('There was an error processing your subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">Unlock powerful recruitment features to find the best AI talent</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-muted-foreground" />
            </button>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-muted p-1 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors relative ${
                  billingCycle === 'yearly'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                {yearlyDiscount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    -{yearlyDiscount}%
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {Object.entries(plans).map(([key, plan]) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === key;
              const planPrice = billingCycle === 'monthly' ? plan.monthly : plan.yearly;
              
              return (
                <div
                  key={key}
                  onClick={() => setSelectedPlan(key as any)}
                  className={`relative cursor-pointer rounded-2xl p-8 transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-primary shadow-xl scale-105'
                      : 'border border-border hover:shadow-lg hover:scale-102'
                  } ${plan.popular ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className={`inline-flex p-3 bg-gradient-to-r ${plan.color} rounded-xl mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-foreground mb-1">
                      ${planPrice}
                      <span className="text-lg text-muted-foreground font-normal">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-green-600 font-medium">
                        Save ${(plan.monthly * 12) - plan.yearly} per year
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-border pt-6">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex justify-between">
                        <span>Profile Searches:</span>
                        <span className="font-medium">{plan.limits.profileSearches}/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Candidate Contacts:</span>
                        <span className="font-medium">{plan.limits.candidateContacts}/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Job Posts:</span>
                        <span className="font-medium">{plan.limits.jobPosts}/month</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="bg-muted/50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">What's included in {currentPlan.name}?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Talent Search</span>
              </div>
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Job Posting</span>
              </div>
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Direct Messaging</span>
              </div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Analytics</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <Shield className="h-4 w-4 inline mr-1" />
              Secure payment • Cancel anytime • 30-day money-back guarantee
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-border text-foreground rounded-xl font-medium hover:bg-muted transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Crown className="h-5 w-5" />
                    <span>Subscribe to {currentPlan.name}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;