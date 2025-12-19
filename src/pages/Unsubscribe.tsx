import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MailX, CheckCircle, AlertCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Unsubscribe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirming' | 'success' | 'error' | 'not_found'>('pending');
  const [loading, setLoading] = useState(false);
  const [subscriberData, setSubscriberData] = useState<{ email: string; id: string } | null>(null);

  // Check for token or email in URL params
  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (token) {
      verifyToken(token);
    } else if (emailParam) {
      setEmail(emailParam);
      findSubscriber(emailParam);
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    setLoading(true);
    try {
      // @ts-ignore - Avoid deep type instantiation with unsubscribe_token column
      const result = await supabase
        .from('newsletter_subscribers')
        .select('id, email')
        .eq('unsubscribe_token', token)
        .limit(1);
      
      const { data, error } = result as { data: any[] | null; error: any };

      if (error || !data || data.length === 0) {
        setStatus('not_found');
        return;
      }

      const subscriber = data[0] as { id: string; email: string };
      setSubscriberData(subscriber);
      setEmail(subscriber.email);
      setStatus('confirming');
    } catch (error) {
      console.error('Error verifying token:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const findSubscriber = async (emailToFind: string) => {
    setLoading(true);
    try {
      // Type assertion to avoid deep type instantiation
      const result: any = await supabase
        .from('newsletter_subscribers')
        .select('id, email')
        .eq('email', emailToFind.toLowerCase())
        .single();
      
      const { data, error } = result;

      if (error || !data) {
        setStatus('not_found');
        return;
      }

      setSubscriberData(data);
      setStatus('confirming');
    } catch (error) {
      console.error('Error finding subscriber:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      findSubscriber(email.trim());
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscriberData) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', subscriberData.id);

      if (error) throw error;

      setStatus('success');
      toast({
        title: "Unsubscribed Successfully",
        description: "You have been removed from our newsletter.",
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setStatus('error');
      toast({
        title: "Error",
        description: "Failed to unsubscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email.toLowerCase(),
          frequency: 'weekly',
        });

      if (error) throw error;

      toast({
        title: "Resubscribed!",
        description: "Welcome back! You'll receive our newsletter again.",
      });
      setStatus('pending');
    } catch (error) {
      console.error('Error resubscribing:', error);
      toast({
        title: "Error",
        description: "Failed to resubscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background py-16 px-4">
      <div className="max-w-md mx-auto">
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              status === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
              status === 'error' || status === 'not_found' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-primary/10'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : status === 'error' || status === 'not_found' ? (
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              ) : (
                <MailX className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {status === 'success' ? 'Unsubscribed!' :
               status === 'not_found' ? 'Email Not Found' :
               status === 'error' ? 'Something Went Wrong' :
               'Unsubscribe from Newsletter'}
            </CardTitle>
            <CardDescription>
              {status === 'success' ? 'You have been successfully removed from our mailing list.' :
               status === 'not_found' ? 'This email address is not subscribed to our newsletter.' :
               status === 'error' ? 'An error occurred. Please try again.' :
               status === 'confirming' ? `Confirm unsubscription for ${email}` :
               'Enter your email to unsubscribe from our newsletter.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {status === 'pending' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Finding...' : 'Find Subscription'}
                </Button>
              </form>
            )}

            {status === 'confirming' && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Email:</p>
                  <p className="font-medium">{email}</p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Are you sure you want to unsubscribe? You'll no longer receive updates about the latest AI tools and insights.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStatus('pending')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleUnsubscribe}
                    disabled={loading}
                  >
                    {loading ? 'Unsubscribing...' : 'Unsubscribe'}
                  </Button>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Changed your mind? You can always subscribe again.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResubscribe}
                  disabled={loading}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {loading ? 'Resubscribing...' : 'Resubscribe'}
                </Button>
              </div>
            )}

            {(status === 'not_found' || status === 'error') && (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStatus('pending');
                    setEmail('');
                    setSubscriberData(null);
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <Link
                to="/"
                className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Homepage
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Unsubscribe;
