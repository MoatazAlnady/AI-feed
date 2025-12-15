import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2 } from 'lucide-react';

interface CompanyPageData {
  id?: string;
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  website: string | null;
  social_links: { linkedin?: string; twitter?: string; github?: string } | null;
  industry: string | null;
  headcount: string | null;
  country: string | null;
  city: string | null;
  location: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
}

interface CreateCompanyPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCompany?: CompanyPageData | null;
  onSuccess?: (company: CompanyPageData) => void;
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Marketing',
  'Media',
  'Non-profit',
  'Government',
  'Other',
];

const headcounts = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10000+',
];

const CreateCompanyPageModal = ({ open, onOpenChange, editingCompany, onSuccess }: CreateCompanyPageModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<Array<{ id: string; country_name: string }>>([]);
  
  const [formData, setFormData] = useState<CompanyPageData>({
    name: '',
    slug: '',
    domain: '',
    description: '',
    website: '',
    social_links: { linkedin: '', twitter: '', github: '' },
    industry: '',
    headcount: '',
    country: '',
    city: '',
    location: '',
    logo_url: '',
    cover_image_url: '',
  });

  useEffect(() => {
    if (open) {
      fetchCountries();
      if (editingCompany) {
        setFormData({
          ...editingCompany,
          domain: editingCompany.domain || '',
          social_links: editingCompany.social_links || { linkedin: '', twitter: '', github: '' },
        });
      } else {
        setFormData({
          name: '',
          slug: '',
          domain: '',
          description: '',
          website: '',
          social_links: { linkedin: '', twitter: '', github: '' },
          industry: '',
          headcount: '',
          country: '',
          city: '',
          location: '',
          logo_url: '',
          cover_image_url: '',
        });
      }
    }
  }, [open, editingCompany]);

  const fetchCountries = async () => {
    const { data, error } = await supabase
      .from('country_codes')
      .select('id, country_name')
      .order('country_name');
    
    if (!error && data) {
      setCountries(data);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCompany ? prev.slug : generateSlug(name),
    }));
  };

  const handleSocialLinkChange = (key: 'linkedin' | 'twitter' | 'github', value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [key]: value,
      },
    }));
  };

  const validateDomain = (domain: string): boolean => {
    if (!domain) return false;
    // Simple domain validation pattern
    const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainPattern.test(domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]);
  };

  const handleSubmit = async () => {
    if (!user || !formData.name.trim()) return;
    
    // Validate domain for new companies
    if (!editingCompany && !validateDomain(formData.domain || '')) {
      toast({
        title: t('common.error'),
        description: t('companyPages.invalidDomain', 'Please enter a valid company domain (e.g., company.com)'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Clean the domain (remove protocol and www if present)
      const cleanDomain = formData.domain?.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || null;
      
      const companyData = {
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        domain: cleanDomain,
        description: formData.description?.trim() || null,
        website: formData.website?.trim() || null,
        social_links: formData.social_links,
        industry: formData.industry || null,
        headcount: formData.headcount || null,
        country: formData.country || null,
        city: formData.city?.trim() || null,
        location: formData.location?.trim() || null,
        logo_url: formData.logo_url?.trim() || null,
        cover_image_url: formData.cover_image_url?.trim() || null,
      };

      if (editingCompany?.id) {
        const { error } = await supabase
          .from('company_pages')
          .update(companyData)
          .eq('id', editingCompany.id);

        if (error) throw error;

        toast({
          title: t('common.success'),
          description: t('companyPages.updated', 'Company page updated successfully'),
        });
      } else {
        // Create company page
        const { data, error } = await supabase
          .from('company_pages')
          .insert({
            ...companyData,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Auto-add creator as admin employee
        if (data) {
          const { error: employeeError } = await supabase
            .from('company_employees')
            .insert({
              company_page_id: data.id,
              user_id: user.id,
              role: 'admin',
              invited_by: null,
            });

          if (employeeError) {
            console.error('Error adding creator as admin:', employeeError);
            // Don't fail the whole operation, just log the error
          }
        }

        toast({
          title: t('common.success'),
          description: t('companyPages.created', 'Company page created successfully'),
        });

        if (onSuccess && data) {
          onSuccess({
            ...data,
            domain: data.domain,
            social_links: data.social_links as { linkedin?: string; twitter?: string; github?: string } | null,
          });
        }
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving company page:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('companyPages.saveError', 'Failed to save company page'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {editingCompany 
              ? t('companyPages.editTitle', 'Edit Company Page') 
              : t('companyPages.createTitle', 'Create Company Page')}
          </DialogTitle>
          <DialogDescription>
            {editingCompany
              ? t('companyPages.editDesc', 'Update your company information')
              : t('companyPages.createDesc', 'Create a page for your company')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('companyPages.name', 'Company Name')} *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={t('companyPages.namePlaceholder', 'Enter company name')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companyPages.slug', 'URL Slug')}</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="company-name"
                    disabled={!!editingCompany}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('companyPages.description', 'Description')}</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('companyPages.descriptionPlaceholder', 'Describe your company...')}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('companyPages.domain', 'Company Domain')} *</Label>
                  <Input
                    value={formData.domain || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="company.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('companyPages.domainHint', 'e.g., company.com (without https://)')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t('companyPages.website', 'Website')}</Label>
                  <Input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Industry & Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('companyPages.industry', 'Industry')}</Label>
                <Select
                  value={formData.industry || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('companyPages.selectIndustry', 'Select industry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('companyPages.headcount', 'Company Size')}</Label>
                <Select
                  value={formData.headcount || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, headcount: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('companyPages.selectHeadcount', 'Select size')} />
                  </SelectTrigger>
                  <SelectContent>
                    {headcounts.map((hc) => (
                      <SelectItem key={hc} value={hc}>{hc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('companyPages.country', 'Country')}</Label>
                <Select
                  value={formData.country || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('companyPages.selectCountry', 'Select country')} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.country_name}>{c.country_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('companyPages.city', 'City')}</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder={t('companyPages.cityPlaceholder', 'City name')}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('companyPages.socialLinks', 'Social Links')}</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">LinkedIn</Label>
                  <Input
                    value={formData.social_links?.linkedin || ''}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Twitter</Label>
                  <Input
                    value={formData.social_links?.twitter || ''}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Image URLs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('companyPages.logoUrl', 'Logo URL')}</Label>
                <Input
                  type="url"
                  value={formData.logo_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t('companyPages.coverUrl', 'Cover Image URL')}</Label>
                <Input
                  type="url"
                  value={formData.cover_image_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name.trim() || (!editingCompany && !formData.domain?.trim()) || saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editingCompany ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompanyPageModal;
