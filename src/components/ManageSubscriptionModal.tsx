import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Gift, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PremiumBadge, { PremiumTier } from '@/components/PremiumBadge';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  premiumUntil: string | null;
  premiumTier: PremiumTier;
}

type ModalView = 'details' | 'cancel-feedback' | 'cancel-confirm' | 'offer-accepted' | 'cancelled';

const cancellationReasons = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using it enough' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'found_alternative', label: 'Found a better alternative' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'other', label: 'Other' },
];

const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
  isOpen,
  onClose,
  premiumUntil,
  premiumTier,
}) => {
  const [view, setView] = useState<ModalView>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [accessUntilDate, setAccessUntilDate] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelComments, setCancelComments] = useState<string>('');

  // Tier-specific display info
  const tierInfo = {
    silver: {
      name: 'Silver Membership',
      monthlyPrice: 20,
      features: ['10 AI prompts/day', 'Silver badge', 'Promote content'],
    },
    gold: {
      name: 'Gold Membership',
      monthlyPrice: 30,
      features: ['Unlimited AI prompts', 'Gold badge', 'Accept paid subscriptions'],
    },
  };

  const currentTierInfo = premiumTier ? tierInfo[premiumTier] : null;
  const monthlySavings = currentTierInfo ? Math.round(currentTierInfo.monthlyPrice * 0.5) : 0;

  const formattedRenewalDate = premiumUntil 
    ? format(new Date(premiumUntil), 'MMMM d, yyyy')
    : 'Unknown';

  const handleCancelClick = () => {
    setView('cancel-feedback');
  };

  const handleFeedbackSubmit = () => {
    if (!cancelReason) {
      toast({
        title: "Please select a reason",
        description: "Let us know why you're cancelling.",
        variant: "destructive",
      });
      return;
    }
    setView('cancel-confirm');
  };

  const handleAcceptOffer = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('apply-retention-offer');
      
      if (error) throw error;

      if (data?.success) {
        setView('offer-accepted');
        toast({
          title: "Offer Applied!",
          description: "You'll get 50% off for the next 2 months.",
        });
        // Reset feedback state since they didn't cancel
        setCancelReason('');
        setCancelComments('');
      } else if (data?.error === 'coupon_already_applied') {
        toast({
          title: "Offer Already Used",
          description: data.message,
          variant: "destructive",
        });
        setView('details');
      } else {
        throw new Error(data?.message || 'Failed to apply offer');
      }
    } catch (err) {
      console.error('Error applying retention offer:', err);
      toast({
        title: "Error",
        description: "Failed to apply the offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAnyway = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          reason: cancelReason,
          comments: cancelComments || null,
        },
      });
      
      if (error) throw error;

      if (data?.success) {
        setAccessUntilDate(data.access_until);
        setView('cancelled');
        toast({
          title: "Subscription Cancelled",
          description: "You'll still have access until your billing period ends.",
        });
      } else {
        throw new Error(data?.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setView('details');
    setCancelReason('');
    setCancelComments('');
    onClose();
  };

  const handleBack = () => {
    if (view === 'cancel-feedback') {
      setView('details');
    } else if (view === 'cancel-confirm') {
      setView('cancel-feedback');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {view === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PremiumBadge tier={premiumTier} size="md" />
                Your {currentTierInfo?.name || 'Subscription'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className={`rounded-lg p-4 border ${
                premiumTier === 'gold' 
                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-700'
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-300 dark:border-gray-600'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Current Plan</span>
                  <PremiumBadge tier={premiumTier} size="sm" showLabel />
                </div>
                <div className="text-2xl font-bold text-foreground">{currentTierInfo?.name || 'Premium'}</div>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  {currentTierInfo?.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Next Billing Date</span>
                <span className="text-sm font-medium">{formattedRenewalDate}</span>
              </div>

              <Button 
                variant="outline" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleCancelClick}
              >
                Cancel Subscription
              </Button>
            </div>
          </>
        )}

        {view === 'cancel-feedback' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Why are you cancelling?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                We'd love to understand why you're leaving so we can improve.
              </p>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Select a reason *</Label>
                <RadioGroup value={cancelReason} onValueChange={setCancelReason}>
                  {cancellationReasons.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label 
                        htmlFor={reason.value} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments" className="text-sm font-medium">
                  Additional comments (optional)
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Tell us more about your experience..."
                  value={cancelComments}
                  onChange={(e) => setCancelComments(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={handleFeedbackSubmit}
                  disabled={!cancelReason}
                  className="w-full"
                >
                  Continue
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </>
        )}

        {view === 'cancel-confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Wait! We Have a Special Offer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                We'd hate to see you go! Before you cancel, how about this exclusive offer?
              </p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border-2 border-green-500 dark:border-green-600">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  <span className="font-bold text-green-700 dark:text-green-400">Special Retention Offer</span>
                </div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                  50% OFF
                </div>
                <p className="text-sm text-green-600 dark:text-green-500">
                  for your next 2 months — Save ${monthlySavings}/month on {currentTierInfo?.name || 'your plan'}
                </p>
                <ul className="mt-3 space-y-1">
                  <li className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    Keep all {premiumTier === 'gold' ? 'Gold' : 'Silver'} features
                  </li>
                  {currentTierInfo?.features.slice(0, 2).map((feature, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                  <li className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    Cancel anytime
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleAcceptOffer}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Gift className="h-4 w-4 mr-2" />
                  )}
                  Accept Offer & Stay
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleCancelAnyway}
                  disabled={isLoading}
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  No Thanks, Cancel Anyway
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  disabled={isLoading}
                  className="w-full text-muted-foreground"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </>
        )}

        {view === 'offer-accepted' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Offer Applied Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 text-center">
                <Gift className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                  You're getting 50% off for 2 months!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Thank you for staying with us. Your discount has been applied to your next 2 billing cycles.
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </>
        )}

        {view === 'cancelled' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-muted-foreground" />
                Subscription Cancelled
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border text-center">
                <p className="text-muted-foreground">
                  Your subscription has been cancelled. You'll continue to have access to premium features until:
                </p>
                <p className="text-lg font-semibold mt-2">
                  {accessUntilDate 
                    ? format(new Date(accessUntilDate), 'MMMM d, yyyy')
                    : formattedRenewalDate
                  }
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                We're sorry to see you go. You can resubscribe anytime from the Upgrade page.
              </p>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscriptionModal;