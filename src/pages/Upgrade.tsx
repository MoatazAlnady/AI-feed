import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Zap, MessageSquare, Users, Calendar, Wrench, BarChart3, ArrowRight, X, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Upgrade: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const features = [
    {
      icon: MessageSquare,
      titleKey: 'upgrade.features.aiChat.title',
      freeKey: 'upgrade.features.aiChat.free',
      premiumKey: 'upgrade.features.aiChat.premium'
    },
    {
      icon: Users,
      titleKey: 'upgrade.features.createGroups.title',
      freeKey: 'upgrade.features.createGroups.free',
      premiumKey: 'upgrade.features.createGroups.premium'
    },
    {
      icon: Calendar,
      titleKey: 'upgrade.features.createEvents.title',
      freeKey: 'upgrade.features.createEvents.free',
      premiumKey: 'upgrade.features.createEvents.premium'
    },
    {
      icon: Wrench,
      titleKey: 'upgrade.features.submitTools.title',
      freeKey: 'upgrade.features.submitTools.free',
      premiumKey: 'upgrade.features.submitTools.premium'
    },
    {
      icon: TrendingUp,
      titleKey: 'upgrade.features.promoteContent.title',
      freeKey: 'upgrade.features.promoteContent.free',
      premiumKey: 'upgrade.features.promoteContent.premium'
    },
    {
      icon: Crown,
      titleKey: 'upgrade.features.premiumBadge.title',
      freeKey: 'upgrade.features.premiumBadge.free',
      premiumKey: 'upgrade.features.premiumBadge.premium'
    },
    {
      icon: BarChart3,
      titleKey: 'upgrade.features.advancedAnalytics.title',
      freeKey: 'upgrade.features.advancedAnalytics.free',
      premiumKey: 'upgrade.features.advancedAnalytics.premium'
    }
  ];

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error(t('upgrade.toast.signInRequired'));
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
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(t('upgrade.toast.paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="h-4 w-4" />
            <span>{t('upgrade.badge', 'Premium')}</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
            {t('upgrade.title', 'Unlock Your Full')}
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {t('upgrade.titleHighlight', 'Potential')}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('upgrade.subtitle', 'Get unlimited access to all premium features and take your AI journey to the next level.')}
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader className="text-center pb-8">
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
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    {index < 1 ? (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={index < 1 ? 'text-foreground' : 'text-muted-foreground'}>
                      {t(feature.freeKey)}
                    </span>
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline"
                className="w-full mt-6"
                size="lg"
                disabled
              >
                {t('upgrade.currentPlan', 'Current Plan')}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-yellow-400 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                {t('upgrade.mostPopular', 'Most Popular')}
              </div>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                {t('upgrade.plans.premium.title', 'Premium')}
              </CardTitle>
              <div className="text-4xl font-bold text-foreground mt-4">
                {billingPeriod === 'monthly' ? '$20' : '$200'}
                <span className="text-lg text-muted-foreground font-normal">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
                  {t('upgrade.plans.yearly.discount', 'Save $40/year (2 months free!)')}
                </div>
              )}
              <CardDescription className="mt-2">
                {t('upgrade.plans.premium.description', 'Full access to all premium features')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-foreground font-medium">
                      {t(feature.premiumKey)}
                    </span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => handleUpgrade(billingPeriod)}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                size="lg"
              >
                {loading ? t('upgrade.processing', 'Processing...') : (
                  <>
                    {t('upgrade.cta', 'Get Premium Now')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {t('upgrade.guarantee', '30-day money-back guarantee')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            {t('upgrade.whatsIncluded', "What's Included")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Free:</span>
                      <span className="text-foreground">{t(feature.freeKey)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">Premium:</span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        {t(feature.premiumKey)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
};

export default Upgrade;
