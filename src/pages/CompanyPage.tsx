import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import VerificationBadge from '@/components/VerificationBadge';
import CreateCompanyPageModal from '@/components/CreateCompanyPageModal';
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Edit,
  ExternalLink,
  Linkedin,
  Twitter,
  Loader2,
  Briefcase,
} from 'lucide-react';

interface CompanyPageData {
  id: string;
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
  created_by: string;
  verified: boolean;
}

interface Employee {
  id: string;
  full_name: string | null;
  job_title: string | null;
  profile_photo: string | null;
  verified: boolean;
  role: string;
  joined_at: string | null;
}

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  created_at: string;
}

const CompanyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyPageData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchCompanyPage();
    }
  }, [slug]);

  // Check if current user is a company admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !company) {
        setIsCompanyAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('company_employees')
        .select('role')
        .eq('company_page_id', company.id)
        .eq('user_id', user.id)
        .single();
      
      setIsCompanyAdmin(data?.role === 'admin');
    };
    
    checkAdminStatus();
  }, [user, company]);

  const fetchCompanyPage = async () => {
    try {
      setLoading(true);
      
      // Fetch company page by slug or ID
      const { data: companyData, error: companyError } = await supabase
        .from('company_pages')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

      if (companyError) throw companyError;
      
      // Safely parse social_links
      const socialLinks = companyData.social_links as { linkedin?: string; twitter?: string; github?: string } | null;
      
      setCompany({
        ...companyData,
        social_links: socialLinks,
      });

      // Fetch employees from company_employees table with user profile data
      const { data: employeesData, error: employeesError } = await supabase
        .from('company_employees')
        .select(`
          role,
          joined_at,
          user_id,
          user_profiles:user_id (
            id,
            full_name,
            job_title,
            profile_photo,
            verified
          )
        `)
        .eq('company_page_id', companyData.id)
        .limit(20);

      if (!employeesError && employeesData) {
        const mappedEmployees = employeesData
          .filter(emp => emp.user_profiles)
          .map(emp => ({
            id: (emp.user_profiles as any).id,
            full_name: (emp.user_profiles as any).full_name,
            job_title: (emp.user_profiles as any).job_title,
            profile_photo: (emp.user_profiles as any).profile_photo,
            verified: (emp.user_profiles as any).verified,
            role: emp.role,
            joined_at: emp.joined_at
          }));
        setEmployees(mappedEmployees);
      }

      // Fetch company jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, location, type, created_at')
        .eq('company_page_id', companyData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!jobsError && jobsData) {
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Error fetching company page:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user && company && user.id === company.created_by;
  const canEdit = isOwner || isCompanyAdmin;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('companyPages.notFound', 'Company Not Found')}</h1>
        <p className="text-muted-foreground mb-4">
          {t('companyPages.notFoundDesc', 'The company page you are looking for does not exist.')}
        </p>
        <Button asChild>
          <Link to="/">{t('common.back', 'Go Back')}</Link>
        </Button>
      </div>
    );
  }

  const displayLocation = company.location || [company.city, company.country].filter(Boolean).join(', ');
  const initials = company.name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/10 relative">
        {company.cover_image_url && (
          <img
            src={company.cover_image_url}
            alt={`${company.name} cover`}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-12">
        {/* Company Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={company.logo_url || ''} alt={company.name} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-3xl font-bold">{company.name}</h1>
                      {company.verified && <VerificationBadge />}
                    </div>
                    
                    {company.industry && (
                      <Badge variant="secondary" className="mb-2">{company.industry}</Badge>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                      {displayLocation && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{displayLocation}</span>
                        </div>
                      )}
                      {company.headcount && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{company.headcount} {t('companyPages.employees', 'employees')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t('common.edit', 'Edit')}
                    </Button>
                  )}
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {company.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        {t('companyPages.website', 'Website')}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  {company.social_links?.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={company.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {company.social_links?.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={company.social_links.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* About Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('companyPages.about', 'About')}</CardTitle>
              </CardHeader>
              <CardContent>
                {company.description ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{company.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t('companyPages.noDescription', 'No description available.')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Jobs Section */}
            {jobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {t('companyPages.openPositions', 'Open Positions')}
                    <Badge variant="secondary">{jobs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="block p-3 rounded-lg hover:bg-muted transition-colors border"
                      >
                        <p className="font-medium text-sm">{job.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{job.location}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">{job.type}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employees Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('companyPages.team', 'Team')}
                  {employees.length > 0 && (
                    <Badge variant="secondary">{employees.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employees.length > 0 ? (
                  <div className="space-y-3">
                    {employees.map((employee) => (
                      <Link
                        key={employee.id}
                        to={`/creator/${employee.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.profile_photo || ''} />
                          <AvatarFallback>
                            {employee.full_name?.slice(0, 2).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-sm truncate">
                              {employee.full_name || 'Unknown'}
                            </p>
                            {employee.verified && <VerificationBadge size="sm" />}
                            {employee.role === 'admin' && (
                              <Badge variant="secondary" className="text-xs ml-1">Admin</Badge>
                            )}
                          </div>
                          {employee.job_title && (
                            <p className="text-xs text-muted-foreground truncate">
                              {employee.job_title}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('companyPages.noEmployees', 'No team members yet')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {company && (
        <CreateCompanyPageModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          editingCompany={company}
          onSuccess={() => {
            fetchCompanyPage();
            setEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default CompanyPage;
