import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Plus, Building2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import CreateCompanyPageModal from './CreateCompanyPageModal';

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface CompanySelectorProps {
  value: string | null;
  companyPageId: string | null;
  onChange: (companyName: string, companyPageId: string | null) => void;
}

const CompanySelector = ({ value, companyPageId, onChange }: CompanySelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);
  const [manualValue, setManualValue] = useState(value || '');

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  useEffect(() => {
    // If value exists but no companyPageId, it means manual input
    if (value && !companyPageId) {
      setUseManualInput(true);
      setManualValue(value);
    }
  }, [value, companyPageId]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_pages')
        .select('id, name, slug, logo_url')
        .order('name')
        .limit(100);

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.id === companyPageId);

  const handleSelectCompany = (company: CompanyOption) => {
    onChange(company.name, company.id);
    setUseManualInput(false);
    setOpen(false);
  };

  const handleManualInputChange = (value: string) => {
    setManualValue(value);
    onChange(value, null);
  };

  const handleCreateSuccess = (company: any) => {
    setCompanies([...companies, company]);
    onChange(company.name, company.id);
    setUseManualInput(false);
    setCreateModalOpen(false);
  };

  if (useManualInput) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('settings.company', 'Company')}</Label>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => {
              setUseManualInput(false);
              setOpen(true);
            }}
            className="text-xs h-auto p-0"
          >
            {t('companyPages.selectFromList', 'Select from list')}
          </Button>
        </div>
        <Input
          value={manualValue}
          onChange={(e) => handleManualInputChange(e.target.value)}
          placeholder={t('settings.companyPlaceholder', 'Enter company name')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('settings.company', 'Company')}</Label>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => setUseManualInput(true)}
          className="text-xs h-auto p-0"
        >
          {t('companyPages.enterManually', 'Enter manually')}
        </Button>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCompany ? (
              <div className="flex items-center gap-2">
                {selectedCompany.logo_url ? (
                  <img
                    src={selectedCompany.logo_url}
                    alt=""
                    className="h-5 w-5 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{selectedCompany.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {t('companyPages.selectCompany', 'Select company...')}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('companyPages.searchCompanies', 'Search companies...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[200px]">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchTerm
                  ? t('companyPages.noCompaniesFound', 'No companies found')
                  : t('companyPages.noCompanies', 'No companies yet')}
              </div>
            ) : (
              <div className="p-1">
                {filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company)}
                    className={cn(
                      'w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left',
                      companyPageId === company.id && 'bg-muted'
                    )}
                  >
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt=""
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate text-sm">{company.name}</span>
                    {companyPageId === company.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOpen(false);
                setCreateModalOpen(true);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('companyPages.createNew', 'Create Company Page')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <CreateCompanyPageModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default CompanySelector;
