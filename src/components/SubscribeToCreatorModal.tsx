import React, { useState, useEffect } from 'react';
import { X, Crown, Check, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  benefits: string[];
}

interface SubscribeToCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
}

const SubscribeToCreatorModal: React.FC<SubscribeToCreatorModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  creatorName
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [existingSubscription, setExistingSubscription] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && creatorId) {
      fetchTiers();
      checkExistingSubscription();
    }
  }, [isOpen, creatorId, user]);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_subscription_tiers')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      
      const parsedTiers = (data || []).map(tier => ({
        ...tier,
        benefits: Array.isArray(tier.benefits) ? (tier.benefits as string[]) : []
      }));
      setTiers(parsedTiers as SubscriptionTier[]);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select('tier_id')
        .eq('subscriber_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        setExistingSubscription(data.tier_id);
      }
    } catch (error) {
      // No existing subscription
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to subscribe.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTier) {
      toast({
        title: "Select a Tier",
        description: "Please select a subscription tier.",
        variant: "destructive"
      });
      return;
    }

    const tier = tiers.find(t => t.id === selectedTier);
    if (!tier) return;

    setSubscribing(true);
    try {
      // For free tiers, create subscription directly
      if (tier.price === 0) {
        const { error } = await supabase
          .from('creator_subscriptions')
          .insert({
            subscriber_id: user.id,
            tier_id: selectedTier,
            creator_id: creatorId,
            status: 'active',
            started_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: "Subscribed!",
          description: `You are now subscribed to ${creatorName}'s ${tier.name} tier.`
        });

        onClose();
      } else {
        // For paid tiers, redirect to payment (Stripe integration would go here)
        toast({
          title: "Payment Required",
          description: "Paid subscriptions require Stripe integration. Coming soon!",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubscribing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Subscribe to {creatorName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Get exclusive content and benefits
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">This creator hasn't set up subscription tiers yet.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {tiers.map((tier) => {
                  const isSubscribed = existingSubscription === tier.id;
                  const isSelected = selectedTier === tier.id;
                  
                  return (
                    <div
                      key={tier.id}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSubscribed
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                      onClick={() => !isSubscribed && setSelectedTier(tier.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {tier.name}
                            {isSubscribed && (
                              <Badge className="bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Subscribed
                              </Badge>
                            )}
                          </h3>
                          {tier.description && (
                            <p className="text-sm text-muted-foreground">{tier.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {tier.price === 0 ? 'Free' : `$${tier.price}`}
                          </p>
                          {tier.price > 0 && (
                            <p className="text-xs text-muted-foreground">/month</p>
                          )}
                        </div>
                      </div>
                      
                      {tier.benefits.length > 0 && (
                        <ul className="space-y-2">
                          {tier.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubscribe} 
                  disabled={subscribing || !selectedTier || existingSubscription === selectedTier}
                  className="flex-1"
                >
                  {subscribing ? (
                    "Processing..."
                  ) : tiers.find(t => t.id === selectedTier)?.price === 0 ? (
                    "Subscribe Free"
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscribeToCreatorModal;
