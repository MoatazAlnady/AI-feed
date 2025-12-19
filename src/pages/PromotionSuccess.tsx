import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle, TrendingUp, Calendar, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PromotionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [promotionDetails, setPromotionDetails] = useState<{
    id: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const promotionId = searchParams.get('promotion_id');

      if (!sessionId || !promotionId) {
        setStatus('error');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: 'Authentication required',
            description: 'Please log in to verify your promotion.',
            variant: 'destructive'
          });
          navigate('/');
          return;
        }

        const { data, error } = await supabase.functions.invoke('verify-promotion', {
          body: { sessionId, promotionId }
        });

        if (error) throw error;

        if (data.success) {
          setStatus('success');
          setPromotionDetails(data.promotion);
          toast({
            title: 'Promotion Activated!',
            description: 'Your content is now being promoted.',
          });
        } else {
          setStatus('error');
          toast({
            title: 'Verification Failed',
            description: data.message || 'Failed to verify payment.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error verifying promotion:', error);
        setStatus('error');
        toast({
          title: 'Error',
          description: 'Failed to verify promotion payment.',
          variant: 'destructive'
        });
      }
    };

    verifyPayment();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>Please wait while we confirm your payment...</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Promotion Activated!</CardTitle>
              <CardDescription>Your content is now being promoted to your target audience.</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Something Went Wrong</CardTitle>
              <CardDescription>We couldn't verify your payment. Please contact support.</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {status === 'success' && promotionDetails && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Campaign Period</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(promotionDetails.startDate).toLocaleDateString()} - {new Date(promotionDetails.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">What's Next?</p>
                  <p className="text-xs text-muted-foreground">
                    Your content will start appearing in promoted sections and feeds.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Track Performance</p>
                  <p className="text-xs text-muted-foreground">
                    View impressions and clicks in your profile's promotions section.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/newsfeed')}
            >
              Back to Feed
            </Button>
            {status === 'success' && (
              <Button 
                className="flex-1"
                onClick={() => navigate('/profile?tab=promotions')}
              >
                View Promotions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionSuccess;
