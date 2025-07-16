import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  Settings, 
  Search, 
  Plus, 
  Edit,
  Eye,
  Trash2,
  Star,
  Clock,
  MapPin,
  DollarSign,
  BarChart3,
  TrendingUp,
  Building,
  UserPlus,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'candidates' | 'jobs' | 'settings'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is employer
  const isEmployer = user?.user_metadata?.account_type === 'employer';

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!isEmployer) {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user, isEmployer]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employer projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('employer_projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!projectsError) {
        setProjects(projectsData || []);
      }
      
      // Fetch project candidates
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('project_candidates')
          .select(`
            *,
            user_profiles!project_candidates_candidate_id_fkey (
              id,
              full_name,
              job_title,
              profile_photo,
              verified,
              country,
              city
            )
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });
        
        if (!candidatesError) {
          setCandidates(candidatesData || []);
        }
      }
      
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!jobsError) {
        setJobs(jobsData || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{candidates.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Jobs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</p>
              </div>
              <Building className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <span className="text-sm text-green-600 dark:text-green-400 ml-1">+15%</span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{project.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Projects Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first project to get started.</p>
              <Button onClick={() => setActiveTab('projects')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>
      
      <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Project management coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCandidates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Candidates</h2>
      </div>
      
      <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          {candidates.length > 0 ? (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {candidate.user_profiles?.full_name?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {candidate.user_profiles?.full_name || 'Unknown'}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {candidate.user_profiles?.job_title || 'No title'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {candidate.user_profiles?.city}, {candidate.user_profiles?.country}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Candidates Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">Candidates will appear here when they apply to your projects.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Postings</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Post Job
        </Button>
      </div>
      
      <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Job posting management coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
      
      <Card className="bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Settings panel coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#091527]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isEmployer) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#091527] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">This page is only accessible to employers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#091527]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Employer Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage your projects, candidates, and job postings
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl max-w-2xl">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'projects', label: 'Projects', icon: Briefcase },
              { id: 'candidates', label: 'Candidates', icon: Users },
              { id: 'jobs', label: 'Jobs', icon: Building },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-[#091527] text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="w-full">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'candidates' && renderCandidates()}
          {activeTab === 'jobs' && renderJobs()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;