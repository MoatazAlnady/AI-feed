import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

const PaymentSuccess: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, subscription } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Refresh subscription status after successful payment
    const refreshSubscription = async () => {
      await checkSubscription();
      setLoading(false);
    };
    
    refreshSubscription();
  }, [checkSubscription]);

  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center py-12 px-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            {t('paymentSuccess.title', 'Welcome to Premium!')}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {t('paymentSuccess.description', 'Your payment was successful. You now have access to all premium features.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                {t('paymentSuccess.activating', 'Activating your subscription...')}
              </span>
            </div>
          ) : (
            <>
              {subscription.subscribed && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('paymentSuccess.plan', 'Your Plan')}
                  </p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    Premium {subscription.subscriptionTier}
                    {subscription.isTrialing && (
                      <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400">
                        ({t('paymentSuccess.trial', '7-day trial')})
                      </span>
                    )}
                  </p>
                  {subscription.subscriptionEnd && (
                    <p className="text-sm text-muted-foreground">
                      {subscription.isTrialing 
                        ? t('paymentSuccess.trialEnds', 'Trial ends: ') 
                        : t('paymentSuccess.renewsOn', 'Renews on: ')}
                      {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('paymentSuccess.features', 'You now have access to:')}
                </p>
                <ul className="text-left space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{t('paymentSuccess.feature1', '10 AI prompts per day')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{t('paymentSuccess.feature2', 'Unlimited groups and events')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{t('paymentSuccess.feature3', 'Video uploads and live streaming')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{t('paymentSuccess.feature4', 'Creator newsletter and monetization')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{t('paymentSuccess.feature5', 'Premium badge and priority support')}</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => navigate('/newsfeed')}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
              size="lg"
            >
              {t('paymentSuccess.explore', 'Start Exploring')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/settings')}
              className="w-full"
            >
              {t('paymentSuccess.manageSubscription', 'Manage Subscription')}
            </Button>
          </div>

          {sessionId && (
            <p className="text-xs text-muted-foreground">
              {t('paymentSuccess.reference', 'Reference: ')}{sessionId.slice(0, 20)}...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
