import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Check, X, DollarSign, Users, Building } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  max_users: number;
  max_projects: number;
  is_active: boolean;
  created_at: string;
}

const PricingManagement: React.FC = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PricingPlan[]>([
    {
      id: '1',
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      price: 29,
      currency: 'USD',
      billing_period: 'monthly',
      features: ['Up to 5 users', 'Basic analytics', 'Email support'],
      max_users: 5,
      max_projects: 10,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Professional',
      description: 'For growing teams with advanced needs',
      price: 99,
      currency: 'USD',
      billing_period: 'monthly',
      features: ['Up to 25 users', 'Advanced analytics', 'Priority support', 'API access'],
      max_users: 25,
      max_projects: 50,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Enterprise',
      description: 'Custom solutions for large organizations',
      price: 299,
      currency: 'USD',
      billing_period: 'monthly',
      features: ['Unlimited users', 'Custom integrations', '24/7 support', 'Dedicated account manager'],
      max_users: -1,
      max_projects: -1,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billing_period: 'monthly' as 'monthly' | 'yearly',
    features: [''],
    max_users: 5,
    max_projects: 10,
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const planData: PricingPlan = {
      id: editingPlan?.id || Date.now().toString(),
      ...formData,
      features: formData.features.filter(f => f.trim() !== ''),
      created_at: editingPlan?.created_at || new Date().toISOString()
    };

    if (editingPlan) {
      setPlans(plans.map(plan => plan.id === editingPlan.id ? planData : plan));
      toast({ title: "Success", description: "Pricing plan updated successfully" });
    } else {
      setPlans([...plans, planData]);
      toast({ title: "Success", description: "Pricing plan created successfully" });
    }

    resetForm();
  };

  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billing_period: plan.billing_period,
      features: [...plan.features, ''], // Add empty string for new feature input
      max_users: plan.max_users,
      max_projects: plan.max_projects,
      is_active: plan.is_active
    });
    setShowCreateForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) return;
    setPlans(plans.filter(plan => plan.id !== id));
    toast({ title: "Success", description: "Pricing plan deleted successfully" });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billing_period: 'monthly',
      features: [''],
      max_users: 5,
      max_projects: 10,
      is_active: true
    });
    setEditingPlan(null);
    setShowCreateForm(false);
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      features: prev.features.filter((_, i) => i !== index) 
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pricing Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage subscription plans for organizations</p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</CardTitle>
            <CardDescription>
              {editingPlan ? 'Update pricing plan details' : 'Set up a new subscription plan'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Professional"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="99"
                      required
                    />
                    <select
                      value={formData.billing_period}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_period: e.target.value as 'monthly' | 'yearly' }))}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this plan offers..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Users</label>
                  <Input
                    type="number"
                    value={formData.max_users === -1 ? '' : formData.max_users}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_users: e.target.value === '' ? -1 : parseInt(e.target.value) || 0 }))}
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Projects</label>
                  <Input
                    type="number"
                    value={formData.max_projects === -1 ? '' : formData.max_projects}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_projects: e.target.value === '' ? -1 : parseInt(e.target.value) || 0 }))}
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Features</label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addFeature} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active (available for purchase)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit">
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.billing_period}</span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {plan.max_users === -1 ? 'Unlimited' : plan.max_users} users
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {plan.max_projects === -1 ? 'Unlimited' : plan.max_projects} projects
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PricingManagement;