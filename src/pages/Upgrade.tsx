import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Zap, MessageSquare, Users, Calendar, Wrench, BarChart3, ArrowRight, X, TrendingUp, Video, Radio, Lock, Mail, DollarSign, Headphones, Gift, Ticket, UserPlus, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RedeemPromoCodeModal } from '@/components/RedeemPromoCodeModal';
import PremiumBadge from '@/components/PremiumBadge';

const Upgrade: React.FC = () => {
  const { t } = useTranslation();
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Base features available to all premium users
  const baseFeatures = [
    { icon: MessageSquare, title: 'AI Chat', free: '1 prompt/day', premium: '10 prompts/day' },
    { icon: Users, title: 'Create Groups', free: 'Not available', premium: 'Unlimited groups' },
    { icon: Calendar, title: 'Create Events', free: 'Not available', premium: 'Unlimited events' },
    { icon: Wrench, title: 'Tools Comparison', free: '1 comparison/month', premium: 'Unlimited' },
    { icon: TrendingUp, title: 'Content Promotion', free: 'Not available', premium: 'AI-powered targeting' },
    { icon: BarChart3, title: 'Advanced Analytics', free: 'Not available', premium: 'Full analytics' },
    { icon: Video, title: 'Video Upload & Recording', free: 'Not available', premium: 'Upload, record & share videos' },
    { icon: Radio, title: 'Live Video', free: 'Not available', premium: 'Go live with your audience' },
    { icon: Lock, title: 'Post Privacy Controls', free: 'Public only', premium: 'Connections & groups visibility' },
    { icon: Mail, title: 'Creator Newsletter', free: 'Not available', premium: 'Send newsletters to subscribers' },
    { icon: Headphones, title: 'Priority Support', free: 'Community support', premium: 'Direct support channel' }
  ];

  // Gold-exclusive features
  const goldExclusiveFeatures = [
    { icon: DollarSign, title: 'Paid Subscriptions', description: 'Monetize with subscriber tiers' },
    { icon: UserPlus, title: 'Subscriber Management', description: 'Full Professional Dashboard access' },
    { icon: Shield, title: 'Private Groups', description: 'Create exclusive private communities' }
  ];

  const pricing = {
    silver: { monthly: 20, yearly: 200 },
    gold: { monthly: 30, yearly: 300 }
  };

  const handleUpgrade = async (tier: 'silver' | 'gold') => {
    if (!user) {
      toast.error(t('upgrade.toast.signInRequired', 'Please sign in to upgrade'));
      return;
    }

    setLoading(true);
    setLoadingTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          billingPeriod,
          tier
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(t('upgrade.toast.paymentFailed', 'Failed to start checkout. Please try again.'));
    } finally {
      setLoading(false);
      setLoadingTier(null);
    }
  };

  const isCurrentPlan = (tier: 'free' | 'silver' | 'gold') => {
    if (tier === 'free') return !subscription.subscribed;
    return subscription.premiumTier === tier;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="h-4 w-4" />
            <span>{t('upgrade.badge', 'Premium Memberships')}</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
            {t('upgrade.title', 'Choose Your')}
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {t('upgrade.titleHighlight', 'Membership')}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('upgrade.subtitle', 'Unlock premium features and take your AI journey to the next level.')}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('upgrade.monthly', 'Monthly')}
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
              billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('upgrade.yearly', 'Yearly')}
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              {t('upgrade.save2Months', 'Save 2 months')}
            </span>
          </button>
        </div>

        {/* Pricing Cards - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="relative border-2 border-muted">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">{t('upgrade.plans.free.title', 'Free')}</CardTitle>
              <div className="text-4xl font-bold text-foreground mt-4">
                $0
                <span className="text-lg text-muted-foreground font-normal">/month</span>
              </div>
              <CardDescription className="mt-2">
                {t('upgrade.plans.free.description', 'Basic access to explore the platform')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">1 AI prompt/day</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">1 Tool Comparison/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Create groups</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Video features</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Premium badge</span>
                </li>
              </ul>
              <Button 
                variant="outline"
                className="w-full mt-6"
                size="lg"
                disabled={isCurrentPlan('free')}
              >
                {isCurrentPlan('free') ? t('upgrade.currentPlan', 'Current Plan') : t('upgrade.freePlan', 'Free Plan')}
              </Button>
            </CardContent>
          </Card>

          {/* Silver Plan */}
          <Card className={`relative border-2 ${isCurrentPlan('silver') ? 'border-gray-400' : 'border-gray-300 dark:border-gray-600'}`}>
            {isCurrentPlan('silver') && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {t('upgrade.yourPlan', 'Your Plan')}
                </div>
              </div>
            )}
            <CardHeader className="text-center pb-6 pt-6">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <PremiumBadge tier="silver" size="md" />
                {t('upgrade.plans.silver.title', 'Silver')}
              </CardTitle>
              {/* 7-Day Free Trial Badge */}
              <div className="flex items-center justify-center gap-2 mt-2 py-1.5 px-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto">
                <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                  {t('upgrade.freeTrial', '7-Day Free Trial')}
                </span>
              </div>
              <div className="text-4xl font-bold text-foreground mt-4">
                ${billingPeriod === 'monthly' ? pricing.silver.monthly : pricing.silver.yearly}
                <span className="text-lg text-muted-foreground font-normal">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
                  {t('upgrade.plans.silver.discount', 'Save $40/year')}
                </div>
              )}
              <CardDescription className="mt-2">
                {t('upgrade.plans.silver.description', 'All premium features for creators')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">10 AI prompts/day</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">Unlimited tool comparisons</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">Unlimited groups & events</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">Video upload & live streaming</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">Creator newsletter</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground flex items-center gap-1">
                    <PremiumBadge tier="silver" size="sm" />
                    Silver badge
                  </span>
                </li>
                <li className="flex items-center gap-3 pt-2 border-t border-border mt-2">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Paid subscriptions</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Private groups</span>
                </li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('silver')}
                disabled={loading || isCurrentPlan('silver')}
                variant={isCurrentPlan('silver') ? "outline" : "default"}
                className={`w-full mt-6 ${!isCurrentPlan('silver') ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white' : ''}`}
                size="lg"
              >
                {loadingTier === 'silver' ? t('upgrade.processing', 'Processing...') : 
                  isCurrentPlan('silver') ? t('upgrade.currentPlan', 'Current Plan') : (
                  <>
                    {t('upgrade.getSilver', 'Get Silver')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Gold Plan */}
          <Card className={`relative border-2 border-yellow-400 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10`}>
            {isCurrentPlan('gold') && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {t('upgrade.yourPlan', 'Your Plan')}
                </div>
              </div>
            )}
            <CardHeader className="text-center pb-6 pt-6">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <PremiumBadge tier="gold" size="md" />
                {t('upgrade.plans.gold.title', 'Gold')}
              </CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2 py-1.5 px-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto">
                <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                  {t('upgrade.freeTrial', '7-Day Free Trial')}
                </span>
              </div>
              <div className="text-4xl font-bold text-foreground mt-4">
                ${billingPeriod === 'monthly' ? pricing.gold.monthly : pricing.gold.yearly}
                <span className="text-lg text-muted-foreground font-normal">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
                  {t('upgrade.plans.gold.discount', 'Save $60/year')}
                </div>
              )}
              <CardDescription className="mt-2">
                {t('upgrade.plans.gold.description', 'Full creator monetization suite')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3 pb-2 border-b border-border">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground font-medium">All Silver features included</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-foreground flex items-center gap-1">
                    <PremiumBadge tier="gold" size="sm" />
                    Gold creator badge
                  </span>
                </li>
                <li className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 pt-1">
                  Gold Exclusive:
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-foreground">Accept paid subscriptions from fans</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-foreground">Full Professional Dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-foreground">Create private exclusive groups</span>
                </li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('gold')}
                disabled={loading || isCurrentPlan('gold')}
                className={`w-full mt-6 ${isCurrentPlan('gold') ? '' : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'}`}
                variant={isCurrentPlan('gold') ? "outline" : "default"}
                size="lg"
              >
                {loadingTier === 'gold' ? t('upgrade.processing', 'Processing...') :
                  isCurrentPlan('gold') ? t('upgrade.currentPlan', 'Current Plan') : (
                  <>
                    {t('upgrade.getGold', 'Get Gold Now')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              {!isCurrentPlan('gold') && (
                <p className="text-xs text-center text-muted-foreground">
                  {t('upgrade.guarantee', '30-day money-back guarantee')}
                </p>
              )}
              
              {/* Promo Code Link */}
              <div className="mt-4 pt-4 border-t border-border text-center">
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setIsPromoModalOpen(true)}
                  disabled={!user}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Ticket className="h-4 w-4 mr-1" />
                  {t('upgrade.havePromoCode', 'Have a promo code?')}
                </Button>
                {!user && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('upgrade.signInToRedeem', 'Sign in to redeem a promo code')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            {t('upgrade.whatsIncluded', "Feature Comparison")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <PremiumBadge tier="silver" size="sm" />
                      Silver
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <PremiumBadge tier="gold" size="sm" />
                      Gold
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {baseFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 px-4 text-foreground">
                      <div className="flex items-center gap-2">
                        <feature.icon className="h-4 w-4 text-muted-foreground" />
                        {feature.title}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{feature.free}</td>
                    <td className="py-3 px-4 text-center text-green-600 dark:text-green-400">
                      <Check className="h-5 w-5 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center text-green-600 dark:text-green-400">
                      <Check className="h-5 w-5 mx-auto" />
                    </td>
                  </tr>
                ))}
                {goldExclusiveFeatures.map((feature, index) => (
                  <tr key={`gold-${index}`} className="border-b border-border/50 bg-yellow-50/30 dark:bg-yellow-900/10">
                    <td className="py-3 px-4 text-foreground">
                      <div className="flex items-center gap-2">
                        <feature.icon className="h-4 w-4 text-yellow-500" />
                        {feature.title}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <X className="h-5 w-5 mx-auto text-muted-foreground" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <X className="h-5 w-5 mx-auto text-muted-foreground" />
                    </td>
                    <td className="py-3 px-4 text-center text-yellow-500">
                      <Check className="h-5 w-5 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Promo Code Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-muted-foreground mb-4">
            <Ticket className="h-5 w-5" />
            <span>{t('upgrade.havePromoCode', 'Have a promo code?')}</span>
          </div>
          <div>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setIsPromoModalOpen(true)}
              disabled={!user}
            >
              <Ticket className="h-4 w-4 mr-2" />
              {t('upgrade.redeemCode', 'Redeem Promo Code')}
            </Button>
            {!user && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('upgrade.signInToRedeem', 'Sign in to redeem a promo code')}
              </p>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t('upgrade.faq.title', 'Have Questions?')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t('upgrade.faq.description', "We're here to help! Contact our support team for any questions.")}
          </p>
          <Button variant="outline" size="lg">
            {t('upgrade.faq.contactSupport', 'Contact Support')}
          </Button>
        </div>
      </div>

      {/* Promo Code Modal */}
      <RedeemPromoCodeModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        onSuccess={() => {
          setIsPromoModalOpen(false);
          // Refresh the page to reflect new premium status
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Upgrade;
