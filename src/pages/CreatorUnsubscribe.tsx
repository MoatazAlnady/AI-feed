import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, CreditCard, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreatorInfo {
  id: string;
  full_name: string;
  profile_photo: string | null;
  job_title: string | null;
}

interface SubscriberInfo {
  id: string;
  is_active: boolean;
  subscriber_id: string;
}

const CreatorUnsubscribe: React.FC = () => {
  const { t } = useTranslation();
  const { creatorId } = useParams<{ creatorId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'verifying' | 'ready' | 'success' | 'error' | 'not_found'>('verifying');
  const [creator, setCreator] = useState<CreatorInfo | null>(null);
  const [subscriber, setSubscriber] = useState<SubscriberInfo | null>(null);
  const [unsubscribeNewsletter, setUnsubscribeNewsletter] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token && creatorId) {
      verifyToken();
    } else {
      setStatus('error');
      setErrorMessage(t('creator.unsubscribe.invalidLink', 'Invalid unsubscribe link'));
      setLoading(false);
    }
  }, [token, creatorId]);

  const verifyToken = async () => {
    try {
      // Verify the unsubscribe token
      // @ts-ignore - Avoid deep type instantiation
      const { data: subscriberData, error: subError } = await supabase
        .from('creator_newsletter_subscribers')
        .select('id, is_active, subscriber_id, creator_id')
        .eq('unsubscribe_token', token)
        .eq('creator_id', creatorId)
        .limit(1);

      if (subError || !subscriberData || subscriberData.length === 0) {
        setStatus('not_found');
        setLoading(false);
        return;
      }

      const sub = subscriberData[0] as SubscriberInfo & { creator_id: string };
      setSubscriber(sub);

      if (!sub.is_active) {
        setStatus('success');
        setLoading(false);
        return;
      }

      // Fetch creator info
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo, job_title')
        .eq('id', creatorId)
        .single();

      if (creatorError || !creatorData) {
        setStatus('error');
        setErrorMessage(t('creator.unsubscribe.creatorNotFound', 'Creator not found'));
        setLoading(false);
        return;
      }

      setCreator(creatorData);
      setStatus('ready');
    } catch (error) {
      console.error('Error verifying token:', error);
      setStatus('error');
      setErrorMessage(t('creator.unsubscribe.verificationError', 'Failed to verify unsubscribe link'));
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscriber) return;
    setProcessing(true);

    try {
      if (unsubscribeNewsletter) {
        await supabase
          .from('creator_newsletter_subscribers')
          .update({ is_active: false })
          .eq('id', subscriber.id);
      }

      setStatus('success');
      toast.success(t('creator.unsubscribe.successMessage', 'Successfully unsubscribed'));
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error(t('creator.unsubscribe.errorMessage', 'Failed to unsubscribe'));
    } finally {
      setProcessing(false);
    }
  };

  const handleResubscribe = async () => {
    if (!subscriber) return;
    setProcessing(true);

    try {
      await supabase
        .from('creator_newsletter_subscribers')
        .update({ is_active: true })
        .eq('id', subscriber.id);

      setStatus('ready');
      toast.success(t('creator.unsubscribe.resubscribed', 'Successfully resubscribed'));
    } catch (error) {
      console.error('Error resubscribing:', error);
      toast.error(t('creator.unsubscribe.resubscribeError', 'Failed to resubscribe'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background py-12 px-4">
      <div className="max-w-md mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.backToHome', 'Back to Home')}
        </Link>

        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">
              {t('creator.unsubscribe.pageTitle', 'Manage Newsletter Subscription')}
            </h1>
          </div>

          <div className="p-6">
            {status === 'not_found' && (
              <div className="text-center py-8">
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t('creator.unsubscribe.linkNotFound', 'Link Not Found')}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t('creator.unsubscribe.linkExpired', 'This unsubscribe link is invalid or has expired.')}
                </p>
                <Link to="/">
                  <Button>{t('common.goHome', 'Go to Home')}</Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8">
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t('common.error', 'Error')}
                </h2>
                <p className="text-muted-foreground mb-6">{errorMessage}</p>
                <Link to="/">
                  <Button>{t('common.goHome', 'Go to Home')}</Button>
                </Link>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t('creator.unsubscribe.unsubscribed', 'Unsubscribed Successfully')}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t('creator.unsubscribe.noMoreEmails', "You won't receive any more emails from this creator.")}
                </p>
                <div className="flex flex-col gap-3">
                  <Button variant="outline" onClick={handleResubscribe} disabled={processing}>
                    {processing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    ) : (
                      t('creator.unsubscribe.resubscribe', 'Resubscribe')
                    )}
                  </Button>
                  <Link to="/">
                    <Button className="w-full">{t('common.goHome', 'Go to Home')}</Button>
                  </Link>
                </div>
              </div>
            )}

            {status === 'ready' && creator && (
              <div className="space-y-6">
                {/* Creator Info */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={creator.profile_photo || ''} alt={creator.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {creator.full_name?.charAt(0)?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{creator.full_name}</h3>
                    {creator.job_title && (
                      <p className="text-sm text-muted-foreground">{creator.job_title}</p>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground">
                  {t('creator.unsubscribe.confirmUnsubscribe', 'Are you sure you want to unsubscribe from {{name}}\'s newsletter?', {
                    name: creator.full_name
                  })}
                </p>

                {/* Options */}
                <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={unsubscribeNewsletter}
                    onCheckedChange={(checked) => setUnsubscribeNewsletter(checked as boolean)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {t('creator.unsubscribe.stopNewsletter', 'Stop receiving newsletters')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('creator.unsubscribe.stopNewsletterDesc', 'You will no longer receive email updates from this creator')}
                    </p>
                  </div>
                </label>

                <div className="flex gap-3">
                  <Link to="/" className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t('common.cancel', 'Cancel')}
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleUnsubscribe} 
                    disabled={processing || !unsubscribeNewsletter}
                    className="flex-1"
                  >
                    {processing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      t('creator.unsubscribe.confirm', 'Unsubscribe')
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorUnsubscribe;
