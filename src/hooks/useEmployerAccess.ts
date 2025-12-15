import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface CompanyPage {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  max_employees: number | null;
  domain: string | null;
}

interface EmployerAccess {
  loading: boolean;
  isEmployer: boolean;
  hasCompany: boolean;
  companyPage: CompanyPage | null;
  isCompanyAdmin: boolean;
  subscriptionStatus: string | null;
  hasActiveSubscription: boolean;
  employeeLimit: number;
  currentEmployeeCount: number;
  canInviteEmployees: boolean;
  refetch: () => Promise<void>;
}

export const useEmployerAccess = (): EmployerAccess => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEmployer, setIsEmployer] = useState(false);
  const [companyPage, setCompanyPage] = useState<CompanyPage | null>(null);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [currentEmployeeCount, setCurrentEmployeeCount] = useState(0);

  const fetchEmployerData = async () => {
    if (!user) {
      setLoading(false);
      setIsEmployer(false);
      setCompanyPage(null);
      setIsCompanyAdmin(false);
      return;
    }

    setLoading(true);
    try {
      // Check if user is an employer
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('account_type, company_page_id')
        .eq('id', user.id)
        .single();

      const isEmployerAccount = profile?.account_type === 'employer';
      setIsEmployer(isEmployerAccount);

      // Check if user is part of any company
      const { data: employeeData } = await supabase
        .from('company_employees')
        .select(`
          role,
          company_page_id,
          company_pages (
            id,
            name,
            slug,
            logo_url,
            subscription_status,
            subscription_expires_at,
            max_employees,
            domain
          )
        `)
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (employeeData?.company_pages) {
        const company = employeeData.company_pages as unknown as CompanyPage;
        setCompanyPage(company);
        setIsCompanyAdmin(employeeData.role === 'admin');

        // Get employee count
        const { count } = await supabase
          .from('company_employees')
          .select('*', { count: 'exact', head: true })
          .eq('company_page_id', company.id);

        setCurrentEmployeeCount(count || 0);
      } else {
        setCompanyPage(null);
        setIsCompanyAdmin(false);
        setCurrentEmployeeCount(0);
      }
    } catch (error) {
      console.error('Error fetching employer data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployerData();
  }, [user]);

  const hasActiveSubscription = 
    companyPage?.subscription_status === 'active' && 
    (!companyPage?.subscription_expires_at || 
      new Date(companyPage.subscription_expires_at) > new Date());

  const employeeLimit = companyPage?.max_employees || 1;
  const canInviteEmployees = isCompanyAdmin && hasActiveSubscription && currentEmployeeCount < employeeLimit;

  return {
    loading,
    isEmployer,
    hasCompany: !!companyPage,
    companyPage,
    isCompanyAdmin,
    subscriptionStatus: companyPage?.subscription_status || null,
    hasActiveSubscription,
    employeeLimit,
    currentEmployeeCount,
    canInviteEmployees,
    refetch: fetchEmployerData,
  };
};
