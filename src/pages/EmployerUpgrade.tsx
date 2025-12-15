import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Crown, 
  Check, 
  X, 
  Briefcase, 
  Users, 
  FolderOpen, 
  Search, 
  BarChart3, 
  Zap,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEmployerAccess } from '@/hooks/useEmployerAccess';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_interval: string;
  description: string | null;
  features: any;
  max_users: number | null;
  is_active: boolean;
}

const EmployerUpgrade = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { companyPage, hasActiveSubscription } = useEmployerAccess();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans((data as PricingPlan[]) || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureValue = (plan: PricingPlan, feature: string): string | boolean | number => {
    if (!plan.features || typeof plan.features !== 'object') return false;
    const features = plan.features as Record<string, any>;
    return features?.[feature] ?? false;
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    // TODO: Integrate with Stripe for payment
    // For now, show a placeholder
    console.log('Selected plan:', planId);
  };

  const featuresList = [
    { key: 'job_posts', label: 'Job Posts', icon: Briefcase },
    { key: 'team_members', label: 'Team Members', icon: Users },
    { key: 'projects', label: 'Projects', icon: FolderOpen },
    { key: 'talent_search', label: 'Talent Search', icon: Search },
    { key: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
    { key: 'api_access', label: 'API Access', icon: Zap },
  ];

  const renderFeatureValue = (value: string | boolean | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground" />
      );
    }
    return <span className="font-medium">{value}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/employer')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back', 'Back to Dashboard')}
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Crown className="h-3 w-3 mr-1" />
            {t('employer.upgrade.badge', 'Employer Plans')}
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            {t('employer.upgrade.title', 'Choose Your Employer Plan')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('employer.upgrade.description', 'Unlock powerful hiring tools to find the best talent, manage your team, and grow your business.')}
          </p>
        </div>

        {/* Current Plan Badge */}
        {hasActiveSubscription && companyPage && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
            <p className="text-green-700 dark:text-green-300">
              <Check className="inline h-4 w-4 mr-2" />
              {t('employer.upgrade.currentPlan', 'You currently have an active subscription')}
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => {
            const isPopular = index === 1; // Middle plan is popular
            
            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden transition-all ${
                  isPopular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    {t('employer.upgrade.popular', 'Most Popular')}
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.billing_interval}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {featuresList.map(({ key, label, icon: Icon }) => {
                      const value = getFeatureValue(plan, key);
                      return (
                        <li key={key} className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-sm">{label}</span>
                          {renderFeatureValue(value)}
                        </li>
                      );
                    })}
                    
                    {plan.max_users && (
                      <li className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-sm">Max Users</span>
                        <span className="font-medium">{plan.max_users}</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={selectedPlan === plan.id}
                  >
                    {selectedPlan === plan.id 
                      ? t('employer.upgrade.processing', 'Processing...')
                      : t('employer.upgrade.selectPlan', 'Select Plan')
                    }
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {plans.length === 0 && (
          <div className="text-center py-12">
            <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('employer.upgrade.noPlans', 'No Plans Available')}
            </h3>
            <p className="text-muted-foreground">
              {t('employer.upgrade.noPlansDescription', 'Please check back later for available employer plans.')}
            </p>
          </div>
        )}

        {/* FAQ or Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            {t('employer.upgrade.questions', 'Have questions?')}{' '}
            <a href="/about" className="text-primary hover:underline">
              {t('employer.upgrade.contactUs', 'Contact our sales team')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployerUpgrade;
