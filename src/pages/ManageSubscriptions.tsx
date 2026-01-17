import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crown, Calendar, DollarSign, Check, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SEOHead from '@/components/SEOHead';

interface CreatorSubscription {
  id: string;
  started_at: string;
  status: string;
  expires_at: string | null;
  tier: {
    id: string;
    name: string;
    price: number;
    currency: string;
    benefits: any;
  };
  creator: {
    id: string;
    full_name: string;
    handle: string;
    profile_photo: string;
  };
}

export default function ManageSubscriptions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<CreatorSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<CreatorSubscription | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select(`
          id,
          started_at,
          status,
          expires_at,
          tier:creator_subscription_tiers(
            id,
            name,
            price,
            currency,
            benefits
          ),
          creator:user_profiles!creator_subscriptions_creator_id_fkey(
            id,
            full_name,
            handle,
            profile_photo
          )
        `)
        .eq('subscriber_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Transform the data
      const transformedData = (data || []).map(item => ({
        ...item,
        tier: Array.isArray(item.tier) ? item.tier[0] : item.tier,
        creator: Array.isArray(item.creator) ? item.creator[0] : item.creator,
      })).filter(item => item.tier && item.creator) as CreatorSubscription[];

      setSubscriptions(transformedData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error(t('common.error', 'Failed to load subscriptions'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscription: CreatorSubscription) => {
    setCancellingId(subscription.id);
    try {
      const { error } = await supabase
        .from('creator_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscriptions(prev => prev.filter(s => s.id !== subscription.id));
      toast.success(t('subscriptions.cancelled', 'Subscription cancelled successfully'));
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(t('common.error', 'Failed to cancel subscription'));
    } finally {
      setCancellingId(null);
      setConfirmCancel(null);
    }
  };

  const formatBenefits = (benefits: any): string[] => {
    if (Array.isArray(benefits)) return benefits;
    if (typeof benefits === 'object' && benefits !== null) {
      return Object.values(benefits).filter(v => typeof v === 'string') as string[];
    }
    return [];
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p>{t('common.loginRequired', 'Please log in to view your subscriptions')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={t('subscriptions.manageTitle', 'Manage Subscriptions')}
        description={t('subscriptions.manageDescription', 'View and manage your creator subscriptions')}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back', 'Back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('subscriptions.manageTitle', 'Manage Subscriptions')}</h1>
          <p className="text-muted-foreground">
            {t('subscriptions.manageSubtitle', 'View and manage your active creator subscriptions')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('subscriptions.noSubscriptions', 'No active subscriptions')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('subscriptions.discoverCreators', 'Discover creators and subscribe to support their work')}
              </p>
              <Button onClick={() => navigate('/community')}>
                {t('subscriptions.exploreCreators', 'Explore Creators')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map(subscription => (
              <Card key={subscription.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Link to={getCreatorProfileLink(subscription.creator)}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={subscription.creator?.profile_photo} />
                        <AvatarFallback>
                          {subscription.creator?.full_name?.[0] || 'C'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={getCreatorProfileLink(subscription.creator)}
                        className="font-medium hover:text-primary block truncate"
                      >
                        {subscription.creator?.full_name}
                      </Link>
                      {subscription.creator?.handle && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{subscription.creator.handle}
                        </p>
                      )}
                    </div>
                    <Link to={getCreatorProfileLink(subscription.creator)}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1">
                      <Crown className="h-3 w-3" />
                      {subscription.tier?.name}
                    </Badge>
                    <span className="font-semibold text-primary">
                      ${subscription.tier?.price}/{t('common.month', 'mo')}
                    </span>
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {t('subscriptions.since', 'Since')}{' '}
                        {format(new Date(subscription.started_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  {subscription.tier?.benefits && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {t('subscriptions.benefits', 'Benefits')}
                      </p>
                      <ul className="text-sm space-y-1">
                        {formatBenefits(subscription.tier.benefits).slice(0, 3).map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmCancel(subscription)}
                    disabled={cancellingId === subscription.id}
                  >
                    {cancellingId === subscription.id
                      ? t('common.cancelling', 'Cancelling...')
                      : t('subscriptions.cancelSubscription', 'Cancel Subscription')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('subscriptions.confirmCancelTitle', 'Cancel Subscription?')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'subscriptions.confirmCancelMessage',
                  'Are you sure you want to cancel your subscription to {{creator}}? You will lose access to exclusive content and benefits.',
                  { creator: confirmCancel?.creator?.full_name }
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.keepSubscription', 'Keep Subscription')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmCancel && handleCancelSubscription(confirmCancel)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('subscriptions.confirmCancel', 'Yes, Cancel')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
