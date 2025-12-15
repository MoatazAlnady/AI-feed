import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Mail, ArrowRight, ArrowLeft, Check, Sparkles, Users, Briefcase } from 'lucide-react';

type OnboardingStep = 'choose-path' | 'create-company' | 'accept-invitation' | 'select-plan' | 'complete';

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_interval: string;
  max_users: number | null;
  features: Record<string, boolean>;
}

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
  'Manufacturing', 'Consulting', 'Marketing', 'Media', 'Non-profit', 'Other',
];

const headcounts = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+'];

const EmployerOnboarding: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<OnboardingStep>('choose-path');
  const [loading, setLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState(searchParams.get('invite') || '');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  
  const [companyForm, setCompanyForm] = useState({
    name: '',
    domain: '',
    description: '',
    industry: '',
    headcount: '',
    website: '',
  });

  // Check if user already has a company
  useEffect(() => {
    const checkExistingCompany = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('company_employees')
        .select('company_page_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      if (data?.company_page_id) {
        navigate('/employer');
      }
    };
    
    checkExistingCompany();
  }, [user, navigate]);

  // Fetch pricing plans
  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (data) {
        setPlans(data.map(plan => ({
          ...plan,
          features: (plan.features as Record<string, boolean>) || {},
        })));
      }
    };
    
    fetchPlans();
  }, []);

  // Auto-check invitation token from URL
  useEffect(() => {
    if (searchParams.get('invite')) {
      setStep('accept-invitation');
    }
  }, [searchParams]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const validateDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  };

  const handleCreateCompany = async () => {
    if (!user) return;
    
    if (!companyForm.name.trim()) {
      toast({ title: 'Error', description: 'Company name is required', variant: 'destructive' });
      return;
    }
    
    if (!companyForm.domain.trim() || !validateDomain(companyForm.domain)) {
      toast({ title: 'Error', description: 'Please enter a valid domain (e.g., example.com)', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Create company page
      const { data: company, error: companyError } = await supabase
        .from('company_pages')
        .insert({
          name: companyForm.name.trim(),
          slug: generateSlug(companyForm.name),
          domain: companyForm.domain.trim().toLowerCase(),
          description: companyForm.description.trim() || null,
          industry: companyForm.industry || null,
          headcount: companyForm.headcount || null,
          website: companyForm.website.trim() || null,
          created_by: user.id,
          subscription_status: 'inactive',
          max_employees: 1,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Add creator as admin employee
      const { error: employeeError } = await supabase
        .from('company_employees')
        .insert({
          company_page_id: company.id,
          user_id: user.id,
          role: 'admin',
          invited_by: user.id,
        });

      if (employeeError) throw employeeError;

      // Update user's company_page_id
      await supabase
        .from('user_profiles')
        .update({ company_page_id: company.id })
        .eq('id', user.id);

      setCreatedCompanyId(company.id);
      setStep('select-plan');
      
      toast({ title: 'Success', description: 'Company created successfully!' });
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create company',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user || !invitationToken.trim()) return;

    setLoading(true);
    try {
      // Find invitation by token
      const { data: invitation, error: invError } = await supabase
        .from('company_invitations')
        .select('*, company_pages(name)')
        .eq('token', invitationToken.trim())
        .eq('status', 'pending')
        .single();

      if (invError || !invitation) {
        toast({ title: 'Error', description: 'Invalid or expired invitation', variant: 'destructive' });
        return;
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        toast({ title: 'Error', description: 'This invitation has expired', variant: 'destructive' });
        return;
      }

      // Add user as employee
      const { error: employeeError } = await supabase
        .from('company_employees')
        .insert({
          company_page_id: invitation.company_page_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by,
        });

      if (employeeError) throw employeeError;

      // Update invitation status
      await supabase
        .from('company_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      // Update user's company_page_id
      await supabase
        .from('user_profiles')
        .update({ company_page_id: invitation.company_page_id })
        .eq('id', user.id);

      toast({ title: 'Success', description: `You've joined ${(invitation.company_pages as any)?.name || 'the company'}!` });
      navigate('/employer');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!createdCompanyId) return;

    setLoading(true);
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      // Update company with subscription (for now, just activate it - payment integration can be added later)
      const { error } = await supabase
        .from('company_pages')
        .update({
          subscription_plan_id: planId,
          subscription_status: 'active',
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
          max_employees: plan.max_users || 1,
        })
        .eq('id', createdCompanyId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Subscription activated! You have a 30-day trial.' });
      navigate('/employer');
    } catch (error: any) {
      console.error('Error selecting plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate subscription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPlan = () => {
    navigate('/employer');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['choose-path', 'create-company', 'select-plan'].map((s, i) => (
          <div
            key={s}
            className={`h-2 w-16 rounded-full transition-colors ${
              step === s || 
              (step === 'accept-invitation' && s === 'create-company') ||
              (step === 'select-plan' && i < 2) ||
              (step === 'complete' && i < 3)
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step: Choose Path */}
      {step === 'choose-path' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome to AI Feed for Employers</h1>
            <p className="text-muted-foreground text-lg">
              Get started by creating your company page or joining an existing one
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setStep('create-company')}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Create a Company</CardTitle>
                <CardDescription>
                  Set up your company page and start posting jobs, finding talent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="default">
                  Create Company <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setStep('accept-invitation')}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>I Have an Invitation</CardTitle>
                <CardDescription>
                  Enter your invitation code to join an existing company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Enter Code <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step: Create Company */}
      {step === 'create-company' && (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setStep('choose-path')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Create Your Company</h1>
            <p className="text-muted-foreground">
              Fill in your company details to get started
            </p>
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Domain *</Label>
                  <Input
                    value={companyForm.domain}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="acme.com"
                  />
                  <p className="text-xs text-muted-foreground">Your company's email domain</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us about your company..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={companyForm.industry}
                    onValueChange={(value) => setCompanyForm(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select
                    value={companyForm.headcount}
                    onValueChange={(value) => setCompanyForm(prev => ({ ...prev, headcount: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {headcounts.map((hc) => (
                        <SelectItem key={hc} value={hc}>{hc} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  type="url"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://acme.com"
                />
              </div>

              <Button 
                onClick={handleCreateCompany} 
                disabled={loading || !companyForm.name.trim() || !companyForm.domain.trim()}
                className="w-full"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Company & Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Accept Invitation */}
      {step === 'accept-invitation' && (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setStep('choose-path')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Join a Company</h1>
            <p className="text-muted-foreground">
              Enter the invitation code you received
            </p>
          </div>

          <Card className="mt-6 max-w-md mx-auto">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Invitation Code</Label>
                <Input
                  value={invitationToken}
                  onChange={(e) => setInvitationToken(e.target.value)}
                  placeholder="Enter your invitation code"
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <Button 
                onClick={handleAcceptInvitation} 
                disabled={loading || !invitationToken.trim()}
                className="w-full"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join Company
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Select Plan */}
      {step === 'select-plan' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Choose Your Plan</h1>
            <p className="text-muted-foreground">
              Select a plan that fits your hiring needs. Start with a 30-day free trial!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.name === 'Professional' && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    <Sparkles className="h-3 w-3 mr-1" /> Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.billing_interval}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Up to {plan.max_users || 1} team members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.features?.unlimited_jobs ? 'Unlimited' : 'Limited'} job posts</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(plan.features || {}).slice(0, 4).map(([key, value]) => (
                      value && (
                        <li key={key} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        </li>
                      )
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    variant={selectedPlan === plan.id ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan.id);
                    }}
                    disabled={loading}
                  >
                    {loading && selectedPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-6">
            <Button variant="ghost" onClick={handleSkipPlan}>
              Skip for now (limited features)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerOnboarding;
