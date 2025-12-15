import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
  Building
} from 'lucide-react';
import TodoSystem from '../components/TodoSystem';
import EmployerChatDock from '../components/EmployerChatDock';
import JobsManagement from '../components/JobsManagement';
import EmployerAnalytics from '../components/EmployerAnalytics';
import EmployerProjects from '../components/EmployerProjects';
import EmployerMessages from '../components/EmployerMessages';
import TalentSearch from './TalentSearch';
import OrganizationManagement from '../components/OrganizationManagement';

const EmployerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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

  const AnalyticsPage = () => <EmployerAnalytics />;

  const MessagesPage = () => <EmployerMessages />;

  const SettingsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <OrganizationManagement />
    </div>
  );

  const handleTalentSearch = (query: string) => {
    // Navigate to talents page with search query
    navigate(`/employer/talents?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </Routes>
      </div>
      
      {/* Chat Dock for Employers */}
      <EmployerChatDock onTalentSearch={handleTalentSearch} />
    </div>
  );
};

export default EmployerDashboard;