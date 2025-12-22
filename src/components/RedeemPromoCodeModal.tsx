import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Ticket, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RedeemPromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RedeemPromoCodeModal({ isOpen, onClose, onSuccess }: RedeemPromoCodeModalProps) {
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);

  const handleRedeem = async () => {
    if (!user || !session) {
      toast.error('You must be logged in to redeem a promo code');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-promo-code', {
        body: { code: code.trim() }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setIsSuccess(true);
      setPremiumUntil(data.premium_until);
      toast.success('Promo code redeemed successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error redeeming promo code:', error);
      toast.error(error.message || 'Failed to redeem promo code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setIsSuccess(false);
    setPremiumUntil(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {isSuccess ? 'Code Redeemed!' : 'Redeem Promo Code'}
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? 'Your premium subscription has been activated.'
              : 'Enter your promo code below to unlock premium features.'
            }
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                Welcome to Premium!
              </p>
              {premiumUntil && (
                <p className="text-sm text-muted-foreground mt-1">
                  Your premium access is valid until {formatDate(premiumUntil)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="promo-code">Promo Code</Label>
              <Input
                id="promo-code"
                placeholder="Enter your promo code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleRedeem();
                  }
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {isSuccess ? (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleRedeem} disabled={isLoading || !code.trim()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Redeem Code
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
