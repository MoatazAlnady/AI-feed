import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname.split('/').pop();
    return path === 'employer' ? 'overview' : path || 'overview';
  });

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3, path: '/employer' },
    { id: 'talents', label: 'Talents', icon: Users, path: '/employer/talents' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, path: '/employer/jobs' },
    { id: 'projects', label: 'Projects', icon: FileText, path: '/employer/projects' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/employer/analytics' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/employer/messages' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/employer/settings' }
  ];

  const handleTabClick = (tab: any) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  const DashboardOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Applicants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Projects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">87%</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Applications</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">JD</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">John Doe</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Applied for Senior Developer</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">2h ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">AS</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Alice Smith</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Applied for UI/UX Designer</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">1d ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Analytics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">This Week</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Job views</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">2.4k</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Applications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">This month</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">67</span>
            </div>
          </div>
        </div>
      </div>

      {/* Todo System */}
      <TodoSystem className="mt-6" />
    </div>
  );

  const TalentsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Talent Management</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">Talent search and management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const JobsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Management</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">Job posting and management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const ProjectsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Management</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">Project management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const AnalyticsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">Analytics and reporting functionality will be implemented here.</p>
      </div>
    </div>
  );

  const MessagesPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">Messaging functionality will be implemented here.</p>
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">Settings and configuration options will be implemented here.</p>
      </div>
    </div>
  );

  const handleTalentSearch = (query: string) => {
    // Navigate to talents page with search query
    navigate(`/employer/talents?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Building className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employer Dashboard</h1>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-sky-50 dark:bg-blue-900/20 rounded-t-lg'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
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