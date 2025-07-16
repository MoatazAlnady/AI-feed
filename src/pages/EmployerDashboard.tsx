import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  BarChart3, 
  Search, 
  Filter, 
  Plus, 
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CreateJobModal from '@/components/CreateJobModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import { supabase } from '@/integrations/supabase/client';

const EmployerDashboard: React.FC = () => {
  const { section } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [talents, setTalents] = useState<any[]>([]);
  const [talentPoolCount, setTalentPoolCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentSection = section || 'dashboard';

  // Navigation tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'talents', label: 'Talents', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch talent pool count
      const { count: talentCount, error: talentError } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true });
      
      if (!talentError) {
        setTalentPoolCount(talentCount || 0);
      }
      
      // Fetch jobs count
      const { count: jobsCountData, error: jobsError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!jobsError) {
        setJobsCount(jobsCountData || 0);
        
        // Fetch jobs data
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        setJobs(jobsData || []);
      }
      
      // Fetch projects count
      const { count: projectsCountData, error: projectsError } = await supabase
        .from('employer_projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!projectsError) {
        setProjectsCount(projectsCountData || 0);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = (newJob: any) => {
    setJobs([newJob, ...jobs]);
    setJobsCount(prev => prev + 1);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Subscription</h3>
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
              {isAdmin ? 'Admin Access' : 'Free Trial'}
            </span>
          </div>
          <p className="text-muted-foreground mb-4">
            {isAdmin 
              ? 'You have full access to all employer features as an admin.'
              : 'Upgrade to access premium features and find the best AI talent.'}
          </p>
          {!isAdmin && (
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="w-full bg-gradient-primary text-white py-2 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Upgrade Now
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4">Active Jobs</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-foreground">{jobsCount}</div>
            <button
              onClick={() => setShowCreateJob(true)}
              className="flex items-center space-x-1 text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Post Job</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4">Projects</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-foreground">{projectsCount}</div>
            <button
              onClick={() => navigate('/employer/projects')}
              className="flex items-center space-x-1 text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">{projectsCount > 0 ? 'View' : 'Create'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4">Talent Pool</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-foreground">{talentPoolCount}</div>
            <button
              onClick={() => navigate('/employer/talents')}
              className="flex items-center space-x-1 text-primary hover:text-primary/80"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-6">Recent Job Postings</h3>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{job.title}</h4>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Building className="h-3 w-3" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                        {job.applicants} applicants
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/employer/jobs')}
                className="w-full py-2 text-primary hover:text-primary/80 text-sm font-medium"
              >
                View All Jobs
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                You haven't posted any jobs yet.
              </p>
              <button
                onClick={() => setShowCreateJob(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Post Your First Job
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-6">Recommended Talent</h3>
          {isAdmin ? (
            <div className="space-y-4">
              <div className="border border-border rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">JS</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">John Smith</h4>
                    <p className="text-sm text-muted-foreground">AI Engineer • San Francisco</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">Python</span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">TensorFlow</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/employer/talents')}
                className="w-full py-2 text-primary hover:text-primary/80 text-sm font-medium"
              >
                View All Talent
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                Upgrade to see AI-matched talent recommendations.
              </p>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTalents = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, skills, location..."
              className="w-full pl-10 pr-4 py-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-muted-foreground focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-3 border border-input rounded-xl hover:bg-muted/50 transition-colors"
          >
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">Filters</span>
            {showFilters ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <div className="text-center py-20">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Talent Search Feature
        </h3>
        <p className="text-muted-foreground">
          This feature is under development. You'll be able to search and filter through our talent pool soon.
        </p>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Job Postings</h2>
        <button
          onClick={() => setShowCreateJob(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Post New Job</span>
        </button>
      </div>

      {jobs.length > 0 ? (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{job.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{job.salary || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                    {job.applicants} applicants
                  </span>
                  <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                    {job.type}
                  </span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-4">{job.description}</p>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    Edit
                  </button>
                  <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    View Applicants
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Job Postings Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start by posting your first job to attract top AI talent.
          </p>
          <button
            onClick={() => setShowCreateJob(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Post Your First Job
          </button>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-2">Job Views</h3>
          <div className="text-3xl font-bold text-primary">1,234</div>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>
        
        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-2">Applications</h3>
          <div className="text-3xl font-bold text-primary">89</div>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>
        
        <div className="bg-white dark:bg-[#091527] rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-2">Conversion Rate</h3>
          <div className="text-3xl font-bold text-primary">7.2%</div>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>
      </div>

      <div className="text-center py-20">
        <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Detailed Analytics Coming Soon
        </h3>
        <p className="text-muted-foreground">
          We're working on comprehensive analytics to help you track your hiring performance.
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentSection) {
      case 'talents':
        return renderTalents();
      case 'jobs':
        return renderJobs();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Employer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your job postings, find talent, and track your hiring progress.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentSection === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(`/employer/${tab.id}`)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Modals */}
      <CreateJobModal
        isOpen={showCreateJob}
        onClose={() => setShowCreateJob(false)}
        onJobCreated={handleJobCreated}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default EmployerDashboard;