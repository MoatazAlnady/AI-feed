import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AdCampaignManager } from '@/components/AdCampaignManager';
import { AdAnalytics } from '@/components/AdAnalytics';
import CreatorSubscriptionManager from '@/components/CreatorSubscriptionManager';
import CreatorNewsletterManager from '@/components/CreatorNewsletterManager';
import { LayoutDashboard, Megaphone, BarChart3, Users, Mail, Crown } from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';

export default function ProfessionalDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in to access the Professional Dashboard');
      navigate('/');
      return;
    }

    if (!authLoading && !premiumLoading && !isPremium) {
      toast.error('Professional Dashboard is available for premium users only');
      navigate('/upgrade');
    }
  }, [user, isPremium, authLoading, premiumLoading, navigate]);

  if (authLoading || premiumLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isPremium) {
    return null;
  }

  return (
    <>
      <SEOHead 
        title="Professional Dashboard | Creator Tools"
        description="Manage your ad campaigns, analytics, subscribers, and newsletters from your professional dashboard."
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Professional Dashboard</h1>
            <Crown className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-muted-foreground">
            Manage your campaigns, track analytics, and engage with your audience
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Subscribers</span>
            </TabsTrigger>
            <TabsTrigger value="newsletter" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Newsletter</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6">
            <AdCampaignManager />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AdAnalytics />
          </TabsContent>

          <TabsContent value="subscribers" className="mt-6">
            <CreatorSubscriptionManager />
          </TabsContent>

          <TabsContent value="newsletter" className="mt-6">
            <CreatorNewsletterManager />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
