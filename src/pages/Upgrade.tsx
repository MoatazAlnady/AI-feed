import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Zap, MessageCircle, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Upgrade: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const features = [
    {
      icon: MessageCircle,
      titleKey: 'upgrade.features.unlimitedMessaging.title',
      descriptionKey: 'upgrade.features.unlimitedMessaging.description',
      freeKey: 'upgrade.features.unlimitedMessaging.free',
      premiumKey: 'upgrade.features.unlimitedMessaging.premium'
    },
    {
      icon: Users,
      titleKey: 'upgrade.features.unlimitedConnections.title',
      descriptionKey: 'upgrade.features.unlimitedConnections.description',
      freeKey: 'upgrade.features.unlimitedConnections.free',
      premiumKey: 'upgrade.features.unlimitedConnections.premium'
    },
    {
      icon: Star,
      titleKey: 'upgrade.features.prioritySupport.title',
      descriptionKey: 'upgrade.features.prioritySupport.description',
      freeKey: 'upgrade.features.prioritySupport.free',
      premiumKey: 'upgrade.features.prioritySupport.premium'
    },
    {
      icon: Crown,
      titleKey: 'upgrade.features.premiumBadge.title',
      descriptionKey: 'upgrade.features.premiumBadge.description',
      freeKey: 'upgrade.features.premiumBadge.free',
      premiumKey: 'upgrade.features.premiumBadge.premium'
    },
    {
      icon: Zap,
      titleKey: 'upgrade.features.advancedAnalytics.title',
      descriptionKey: 'upgrade.features.advancedAnalytics.description',
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="h-4 w-4" />
            <span>{t('upgrade.badge')}</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {t('upgrade.title')}
            <span className="text-gradient block">{t('upgrade.titleHighlight')}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('upgrade.subtitle')}
          </p>
        </div>

        {/* Features Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            {t('upgrade.whatsIncluded')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                  </div>
                  <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Free:</span>
                      <span className="text-gray-700 dark:text-gray-300">{t(feature.freeKey)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-600 font-medium">Premium:</span>
                      <span className="text-primary-600 font-medium flex items-center">
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('upgrade.plans.monthly.title')}</CardTitle>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {t('upgrade.plans.monthly.price')}
                <span className="text-lg text-gray-500 font-normal">{t('upgrade.plans.monthly.period')}</span>
              </div>
              <CardDescription>{t('upgrade.plans.monthly.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => handleUpgrade('monthly')}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? t('upgrade.processing') : (
                  <>
                    {t('upgrade.cta')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                {t('upgrade.plans.monthly.cancelAnytime')}
              </p>
            </CardContent>
          </Card>

          {/* Yearly Plan */}
          <Card className="relative border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                {t('upgrade.plans.yearly.mostPopular')}
              </div>
            </div>
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl">{t('upgrade.plans.yearly.title')}</CardTitle>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {t('upgrade.plans.yearly.price')}
                <span className="text-lg text-gray-500 font-normal">{t('upgrade.plans.yearly.period')}</span>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                {t('upgrade.plans.yearly.discount')}
              </div>
              <CardDescription>{t('upgrade.plans.yearly.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => handleUpgrade('yearly')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                size="lg"
              >
                {loading ? t('upgrade.processing') : (
                  <>
                    {t('upgrade.cta')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                {t('upgrade.plans.yearly.guarantee')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('upgrade.faq.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('upgrade.faq.description')}
          </p>
          <Button variant="outline" size="lg">
            {t('upgrade.faq.contactSupport')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
