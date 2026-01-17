import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Users, TrendingUp, Edit, Trash2, Check, Crown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CancellationSettingsManager from './CancellationSettingsManager';

interface SubscriptionTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  benefits: string[];
  platform_fee_percent: number;
  is_active: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  subscriber_id: string;
  tier_id: string;
  status: string;
  started_at: string;
  subscriber?: {
    full_name: string | null;
    profile_photo: string | null;
  };
}

interface Earnings {
  total_gross: number;
  total_fees: number;
  total_net: number;
}

const CreatorSubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({ total_gross: 0, total_fees: 0, total_net: 0 });
  const [loading, setLoading] = useState(true);
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    benefits: ''
  });

  const PLATFORM_FEE = 5; // 5% platform fee

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch subscription tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('creator_subscription_tiers')
        .select('*')
        .eq('creator_id', user?.id)
        .order('price', { ascending: true });

      if (tiersError) throw tiersError;
      
      // Parse benefits from JSON
      const parsedTiers = (tiersData || []).map(tier => ({
        ...tier,
        benefits: Array.isArray(tier.benefits) ? (tier.benefits as string[]) : []
      }));
      setTiers(parsedTiers as SubscriptionTier[]);

      // Fetch subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('creator_id', user?.id)
        .eq('status', 'active');

      if (!subsError && subsData) {
        // Fetch subscriber profiles
        const subscriberIds = subsData.map(s => s.subscriber_id);
        if (subscriberIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, full_name, profile_photo')
            .in('id', subscriberIds);

          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
          const subsWithProfiles = subsData.map(sub => ({
            ...sub,
            subscriber: profilesMap.get(sub.subscriber_id)
          }));
          setSubscriptions(subsWithProfiles);
        } else {
          setSubscriptions([]);
        }
      }

      // Fetch earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('creator_earnings')
        .select('gross_amount, platform_fee, net_amount')
        .eq('creator_id', user?.id);

      if (!earningsError && earningsData) {
        const totals = earningsData.reduce((acc, e) => ({
          total_gross: acc.total_gross + Number(e.gross_amount),
          total_fees: acc.total_fees + Number(e.platform_fee),
          total_net: acc.total_net + Number(e.net_amount)
        }), { total_gross: 0, total_fees: 0, total_net: 0 });
        setEarnings(totals);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTier = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast({
        title: "Error",
        description: "Name and price are required.",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive"
      });
      return;
    }

    const benefits = formData.benefits
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    try {
      if (editingTier) {
        const { error } = await supabase
          .from('creator_subscription_tiers')
          .update({
            name: formData.name,
            description: formData.description || null,
            price,
            benefits
          })
          .eq('id', editingTier.id);

        if (error) throw error;
        toast({ title: "Success", description: "Tier updated successfully." });
      } else {
        const { error } = await supabase
          .from('creator_subscription_tiers')
          .insert({
            creator_id: user?.id,
            name: formData.name,
            description: formData.description || null,
            price,
            benefits,
            platform_fee_percent: PLATFORM_FEE
          });

        if (error) throw error;
        toast({ title: "Success", description: "Tier created successfully." });
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving tier:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tier.",
        variant: "destructive"
      });
    }
  };

  const handleToggleTier = async (tierId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('creator_subscription_tiers')
        .update({ is_active: isActive })
        .eq('id', tierId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling tier:', error);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;

    try {
      const { error } = await supabase
        .from('creator_subscription_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;
      toast({ title: "Deleted", description: "Tier has been deleted." });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting tier:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete tier.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', benefits: '' });
    setEditingTier(null);
    setShowTierForm(false);
  };

  const handleEdit = (tier: SubscriptionTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description || '',
      price: tier.price.toString(),
      benefits: tier.benefits.join('\n')
    });
    setShowTierForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview & Tiers</TabsTrigger>
        <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        <TabsTrigger value="cancellation" className="gap-1">
          <Settings className="h-4 w-4" />
          Cancellation Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Subscribers</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {subscriptions.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              ${earnings.total_gross.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Platform Fees ({PLATFORM_FEE}%)</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              ${earnings.total_fees.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Earnings</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              ${earnings.total_net.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Subscription Tiers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Subscription Tiers</h2>
          {!showTierForm && (
            <Button onClick={() => setShowTierForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tier
            </Button>
          )}
        </div>

        {showTierForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingTier ? 'Edit Tier' : 'Create Subscription Tier'}</CardTitle>
              <CardDescription>
                AI Feed takes a {PLATFORM_FEE}% platform fee from each subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tier Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Basic, Pro, Premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD/month) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="9.99"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this tier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Exclusive content&#10;Early access&#10;Direct messaging"
                  rows={4}
                />
              </div>
              {formData.price && (
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Price per subscriber:</p>
                    <p className="text-lg font-bold">${parseFloat(formData.price || '0').toFixed(2)}/month</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Platform fee ({PLATFORM_FEE}%):</span>
                    <span className="text-orange-500">-${(parseFloat(formData.price || '0') * PLATFORM_FEE / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-green-500/20 mt-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">You receive per subscriber:</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        ${(parseFloat(formData.price || '0') * (100 - PLATFORM_FEE) / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      That's {100 - PLATFORM_FEE}% of each subscription payment directly to you!
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTier}>
                  {editingTier ? 'Update Tier' : 'Create Tier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tiers.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No subscription tiers yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <Card key={tier.id} className={!tier.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <Switch
                      checked={tier.is_active}
                      onCheckedChange={(checked) => handleToggleTier(tier.id, checked)}
                    />
                  </div>
                  <CardDescription>
                    ${tier.price}/month
                    {!tier.is_active && <Badge variant="secondary" className="ml-2">Inactive</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tier.description && (
                    <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                  )}
                  {tier.benefits.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(tier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteTier(tier.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </TabsContent>

      <TabsContent value="subscribers">
      {/* Active Subscribers */}
      {subscriptions.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Subscribers</h2>
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {sub.subscriber?.profile_photo ? (
                      <img src={sub.subscriber.profile_photo} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{sub.subscriber?.full_name || 'Subscriber'}</p>
                    <p className="text-sm text-muted-foreground">
                      Since {new Date(sub.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge>{sub.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No active subscribers yet</p>
        </div>
      )}
      </TabsContent>

      <TabsContent value="cancellation">
        <CancellationSettingsManager />
      </TabsContent>
    </Tabs>
  );
};

export default CreatorSubscriptionManager;
