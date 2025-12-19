import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Mail, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UnsubscribeFromCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
}

interface SubscriptionData {
  id: string;
  tier_name: string;
  started_at: string;
  receive_newsletter: boolean;
}

interface NewsletterData {
  id: string;
  is_active: boolean;
}

const UnsubscribeFromCreatorModal: React.FC<UnsubscribeFromCreatorModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  creatorName,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null);
  const [cancelSubscription, setCancelSubscription] = useState(false);
  const [unsubscribeNewsletter, setUnsubscribeNewsletter] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchSubscriptionData();
    }
  }, [isOpen, user, creatorId]);

  const fetchSubscriptionData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch subscription
      const { data: subData } = await supabase
        .from('creator_subscriptions')
        .select(`
          id,
          started_at,
          receive_newsletter,
          creator_subscription_tiers (name)
        `)
        .eq('subscriber_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .single();

      if (subData) {
        setSubscription({
          id: subData.id,
          tier_name: (subData.creator_subscription_tiers as any)?.name || 'Premium',
          started_at: subData.started_at,
          receive_newsletter: subData.receive_newsletter ?? true,
        });
      }

      // Fetch newsletter subscription
      const { data: newsData } = await supabase
        .from('creator_newsletter_subscribers')
        .select('id, is_active')
        .eq('subscriber_id', user.id)
        .eq('creator_id', creatorId)
        .single();

      if (newsData) {
        setNewsletter({
          id: newsData.id,
          is_active: newsData.is_active ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!cancelSubscription && !unsubscribeNewsletter) {
      toast.error(t('creator.unsubscribe.selectOption', 'Please select at least one option'));
      return;
    }
    setConfirmStep(true);
  };

  const handleConfirm = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      if (cancelSubscription && subscription) {
        await supabase
          .from('creator_subscriptions')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', subscription.id);
      }

      if (unsubscribeNewsletter) {
        if (newsletter) {
          await supabase
            .from('creator_newsletter_subscribers')
            .update({ is_active: false })
            .eq('id', newsletter.id);
        }
        
        if (subscription && !cancelSubscription) {
          await supabase
            .from('creator_subscriptions')
            .update({ receive_newsletter: false })
            .eq('id', subscription.id);
        }
      }

      toast.success(t('creator.unsubscribe.success', 'Successfully updated your preferences'));
      onClose();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error(t('creator.unsubscribe.error', 'Failed to update preferences'));
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {t('creator.unsubscribe.title', 'Manage Subscription')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : confirmStep ? (
            /* Confirmation Step */
            <div className="space-y-6">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {t('creator.unsubscribe.confirmTitle', 'Confirm Your Changes')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('creator.unsubscribe.confirmMessage', 'You are about to make the following changes:')}
                    </p>
                    <ul className="mt-2 text-sm text-foreground space-y-1">
                      {cancelSubscription && (
                        <li>• {t('creator.unsubscribe.cancelSub', 'Cancel premium subscription')}</li>
                      )}
                      {unsubscribeNewsletter && (
                        <li>• {t('creator.unsubscribe.unsubNews', 'Unsubscribe from newsletter')}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmStep(false)}
                  className="flex-1"
                >
                  {t('common.back', 'Back')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    t('common.confirm', 'Confirm')
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Selection Step */
            <div className="space-y-6">
              <p className="text-muted-foreground">
                {t('creator.unsubscribe.description', 'Manage your subscription to {{name}}', { name: creatorName })}
              </p>

              {/* Current Subscription Info */}
              {subscription && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{subscription.tier_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('creator.unsubscribe.memberSince', 'Member since {{date}}', {
                      date: format(new Date(subscription.started_at), 'MMM d, yyyy')
                    })}
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="space-y-4">
                {subscription && (
                  <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={cancelSubscription}
                      onCheckedChange={(checked) => setCancelSubscription(checked as boolean)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {t('creator.unsubscribe.cancelSubscription', 'Cancel Subscription')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('creator.unsubscribe.cancelDesc', 'Stop access to premium content and end billing')}
                      </p>
                    </div>
                  </label>
                )}

                {(newsletter?.is_active || subscription?.receive_newsletter) && (
                  <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={unsubscribeNewsletter}
                      onCheckedChange={(checked) => setUnsubscribeNewsletter(checked as boolean)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {t('creator.unsubscribe.unsubscribeNewsletter', 'Unsubscribe from Newsletter')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('creator.unsubscribe.newsletterDesc', 'Stop receiving email updates from this creator')}
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button onClick={handleProceed} className="flex-1">
                  {t('common.continue', 'Continue')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnsubscribeFromCreatorModal;
