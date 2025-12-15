import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  FileText, 
  Star, 
  TrendingUp,
  Calendar,
  MessageSquare,
  Settings,
  Building,
  Crown,
  AlertCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TodoSystem from '../components/TodoSystem';
import EmployerChatDock from '../components/EmployerChatDock';
import JobsManagement from '../components/JobsManagement';
import EmployerAnalytics from '../components/EmployerAnalytics';
import EmployerProjects from '../components/EmployerProjects';
import EmployerMessages from '../components/EmployerMessages';
import TalentSearch from './TalentSearch';
import OrganizationManagement from '../components/OrganizationManagement';
import CompanyEmployeeManager from '../components/CompanyEmployeeManager';
import SubscriptionGate from '../components/SubscriptionGate';
import { useEmployerAccess } from '../hooks/useEmployerAccess';
import CreateCompanyPageModal from '../components/CreateCompanyPageModal';

const EmployerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const { 
    loading: employerLoading, 
    companyPage, 
    hasActiveSubscription, 
    subscriptionStatus,
    isCompanyAdmin,
    isEmployer,
    refetch: refetchEmployerAccess
  } = useEmployerAccess();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname.split('/').pop();
    return path === 'employer' ? 'overview' : path || 'overview';
  });

  // Dynamic page title based on current route
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/employer' || path === '/employer/') return t('employer.titles.dashboard', 'Dashboard');
    if (path.includes('/talents')) return t('employer.titles.talents', 'Talent Search');
    if (path.includes('/jobs')) return t('employer.titles.jobs', 'Jobs Management');
    if (path.includes('/projects')) return t('employer.titles.projects', 'Projects');
    if (path.includes('/analytics')) return t('employer.titles.analytics', 'Analytics');
    if (path.includes('/messages')) return t('employer.titles.messages', 'Messages');
    if (path.includes('/settings')) return t('employer.titles.settings', 'Settings');
    return t('employer.titles.dashboard', 'Dashboard');
  }, [location.pathname, t]);

  const tabs = [
    { id: 'overview', label: t('nav.dashboard'), icon: BarChart3, path: '/employer' },
    { id: 'talents', label: t('nav.talent'), icon: Users, path: '/employer/talents' },
    { id: 'jobs', label: t('nav.jobs'), icon: Briefcase, path: '/employer/jobs' },
    { id: 'projects', label: t('dashboard.projects'), icon: FileText, path: '/employer/projects' },
    { id: 'analytics', label: t('dashboard.analytics'), icon: TrendingUp, path: '/employer/analytics' },
    { id: 'messages', label: t('nav.messages'), icon: MessageSquare, path: '/employer/messages' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, path: '/employer/settings' }
  ];

  const handleTabClick = (tab: any) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  const DashboardOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Applicants</p>
              <p className="text-2xl font-bold">156</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Projects</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">87%</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">JD</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-muted-foreground">Applied for Senior Developer</p>
              </div>
              <span className="text-sm text-muted-foreground">2h ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">AS</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Alice Smith</p>
                <p className="text-sm text-muted-foreground">Applied for UI/UX Designer</p>
              </div>
              <span className="text-sm text-muted-foreground">1d ago</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Quick Analytics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">This Week</p>
                  <p className="text-xs text-muted-foreground">Job views</p>
                </div>
              </div>
              <span className="text-lg font-bold">2.4k</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Applications</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
              <span className="text-lg font-bold">67</span>
            </div>
          </div>
        </div>
      </div>

      {/* Todo System */}
      <div className="bg-card p-6 rounded-xl shadow-sm">
        <TodoSystem />
      </div>
    </div>
  );

  const TalentsPage = () => {
    const urlParams = new URLSearchParams(location.search);
    const searchQuery = urlParams.get('search') || '';
    
    return <TalentSearch initialSearch={searchQuery} />;
  };

  const JobsPage = () => <JobsManagement />;

  const ProjectsPage = () => <EmployerProjects />;

  const AnalyticsPage = () => (
    <SubscriptionGate hasActiveSubscription={hasActiveSubscription} featureName="analytics">
      <EmployerAnalytics />
    </SubscriptionGate>
  );

  const MessagesPage = () => <EmployerMessages />;

  const SettingsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      {/* Company Employee Management - shown if user has a company page */}
      {companyPage && (
        <CompanyEmployeeManager
          companyPageId={companyPage.id}
          companyName={companyPage.name}
          maxEmployees={companyPage.max_employees || 1}
          isAdmin={isCompanyAdmin}
          hasActiveSubscription={hasActiveSubscription}
        />
      )}
      
      <OrganizationManagement />
    </div>
  );

  const handleTalentSearch = (query: string) => {
    // Navigate to talents page with search query
    navigate(`/employer/talents?search=${encodeURIComponent(query)}`);
  };

  const getSubscriptionBadge = () => {
    if (!companyPage) return null;
    
    if (hasActiveSubscription) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <Crown className="h-3 w-3 mr-1" />
          {t('subscription.active', 'Active')}
        </Badge>
      );
    }
    
    if (subscriptionStatus === 'expired') {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {t('subscription.expired', 'Expired')}
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        {t('subscription.inactive', 'Inactive')}
      </Badge>
    );
  };

  // Check if user is an employer without a company
  const isEmployerWithoutCompany = isEmployer && !companyPage && !employerLoading;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Setup CTA for employers without a company */}
        {isEmployerWithoutCompany && (
          <div className="mb-6 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {t('employer.createCompany.title', 'Create Your Company Page')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('employer.createCompany.description', 'Set up your company page to post jobs, manage projects, and find talent.')}
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowCreateCompanyModal(true)}>
                <Building className="h-4 w-4 mr-2" />
                {t('employer.createCompany.button', 'Create Company')}
              </Button>
            </div>
          </div>
        )}

        {/* Company Branding Header */}
        {companyPage && (
          <div className="mb-6 p-4 bg-card rounded-xl border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={companyPage.logo_url || ''} alt={companyPage.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {companyPage.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{companyPage.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('employer.companyDashboard', 'Company Dashboard')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getSubscriptionBadge()}
              {!hasActiveSubscription && (
                <Button size="sm" onClick={() => navigate('/employer/upgrade')}>
                  <Crown className="h-4 w-4 mr-1" />
                  {t('subscription.upgrade', 'Upgrade')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Subscription Warning Banner */}
        {companyPage && !hasActiveSubscription && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t('subscription.limitedAccess', 'Limited Access')}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('subscription.upgradePrompt', 'Upgrade your subscription to unlock all employer features.')}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/employer/upgrade')}>
              {t('subscription.viewPlans', 'View Plans')}
            </Button>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
          </div>
        </div>

        {/* Content Area */}
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="talents" element={<TalentsPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<Navigate to="/profile" replace />} />
        </Routes>
      </div>
      
      {/* Chat Dock for Employers */}
      <EmployerChatDock onTalentSearch={handleTalentSearch} />

      {/* Create Company Modal */}
      <CreateCompanyPageModal 
        open={showCreateCompanyModal} 
        onOpenChange={setShowCreateCompanyModal}
        onSuccess={() => {
          refetchEmployerAccess();
          setShowCreateCompanyModal(false);
        }}
      />
    </div>
  );
};

export default EmployerDashboard;