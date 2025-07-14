import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import CreateJobModal from '@/components/modals/CreateJobModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import { supabase } from '@/integrations/supabase/client';

interface EmployerDashboardProps {
  section?: 'dashboard' | 'talents' | 'jobs' | 'analytics';
}

const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ section = 'dashboard' }) => {
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

  // Language filter state
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [languageProficiency, setLanguageProficiency] = useState<{[key: string]: number}>({});

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 
    'Arabic', 'Russian', 'Portuguese', 'Hindi', 'Bengali', 'Italian'
  ];

  const proficiencyLevels = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Elementary' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Native/Fluent' }
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
        
        // Fetch jobs data if needed
        if (section === 'jobs') {
          const { data: jobsData } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          setJobs(jobsData || []);
        }
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
    // Update user subscription status
  };

  const toggleLanguageFilter = (language: string) => {
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== language));
      // Remove proficiency level for this language
      const newProficiency = {...languageProficiency};
      delete newProficiency[language];
      setLanguageProficiency(newProficiency);
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
      // Set default proficiency level
      setLanguageProficiency({...languageProficiency, [language]: 3});
    }
  };

  const updateLanguageProficiency = (language: string, level: number) => {
    setLanguageProficiency({...languageProficiency, [language]: level});
  };

  const renderDashboard = () => (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Subscription</h3>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
              {isAdmin ? 'Admin Access' : 'Free Trial'}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isAdmin 
              ? 'You have full access to all employer features as an admin.'
              : 'Upgrade to access premium features and find the best AI talent.'}
          </p>
          {!isAdmin && (
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Upgrade Now
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Jobs</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{jobsCount}</div>
            <button
              onClick={() => setShowCreateJob(true)}
              className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Post Job</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Projects</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{projectsCount}</div>
            {projectsCount > 0 ? (
              <button
                onClick={() => navigate('/employer/projects')}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm"
              >
                View Projects →
              </button>
            ) : (
              <button
                onClick={() => navigate('/employer/projects')}
                className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Create Project</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Talent Pool</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{talentPoolCount}</div>
            <button
              onClick={() => navigate('/employer/talents')}
              className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Recent Job Postings</h3>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{job.title}</h4>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
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
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Posted {job.postedAt}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/employer/jobs')}
                className="w-full py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                View All Jobs
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't posted any jobs yet.
              </p>
              <button
                onClick={() => setShowCreateJob(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Post Your First Job
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Recommended Talent</h3>
          {isAdmin ? (
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">JS</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">John Smith</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">AI Engineer • San Francisco</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">Python</span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">TensorFlow</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">AK</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Anna Kim</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ML Researcher • London</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">PyTorch</span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">NLP</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/employer/talents')}
                className="w-full py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                View All Talent
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upgrade to see AI-matched talent recommendations based on your job postings.
              </p>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
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
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, skills, location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">Filters</span>
            {activeFilters.length > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs">
                {activeFilters.length}
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Select skills</option>
                  <option value="machine-learning">Machine Learning</option>
                  <option value="deep-learning">Deep Learning</option>
                  <option value="nlp">Natural Language Processing</option>
                  <option value="computer-vision">Computer Vision</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Any location</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="eu">Europe</option>
                  <option value="asia">Asia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience Level
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Any experience</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            
            {/* Languages section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Languages
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {languages.map((language) => (
                  <button
                    key={language}
                    onClick={() => toggleLanguageFilter(language)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedLanguages.includes(language)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
              
              {/* Language proficiency levels */}
              {selectedLanguages.length > 0 && (
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Language Proficiency</h4>
                  {selectedLanguages.map(language => (
                    <div key={`proficiency-${language}`} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-24">{language}</span>
                      <div className="flex-1 mx-4">
                        <select 
                          value={languageProficiency[language] || 3}
                          onChange={(e) => updateLanguageProficiency(language, parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {proficiencyLevels.map(level => (
                            <option key={`${language}-${level.value}`} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {isAdmin ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Talent Search Results</h3>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xl">
                      {['JS', 'AK'][i-1]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {['John Smith', 'Anna Kim'][i-1]}
                      </h4>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">
                          Contact
                        </button>
                        <button className="px-3 py-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Save
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {['AI Engineer', 'ML Researcher'][i-1]} • 
                      {[' San Francisco', ' London'][i-1]}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        ['Python', 'TensorFlow', 'PyTorch'],
                        ['PyTorch', 'NLP', 'Research']
                      ][i-1].map((skill, j) => (
                        <span key={j} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {[
                        'Experienced AI engineer with a focus on building production-ready machine learning systems.',
                        'Machine learning researcher specializing in natural language processing and transformer models.'
                      ][i-1]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Talent Search
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            Search for AI professionals with specific skills, experience, and location. Filter results to find the perfect match for your team.
          </p>
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
          >
            Upgrade to Access Talent Database
          </button>
        </div>
      )}
    </div>
  );

  const renderJobs = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Postings</h2>
        <button
          onClick={() => setShowCreateJob(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Post New Job</span>
        </button>
      </div>

      {jobs.length > 0 ? (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{job.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      {job.type}
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                      {job.workMode}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                      {job.experience}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Posted {job.postedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    {job.applicants} applicants
                  </span>
                  <div className="flex space-x-2 mt-4">
                    <button className="px-3 py-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                  {job.description}
                </p>
                <button className="text-primary-600 dark:text-primary-400 text-sm font-medium mt-2 hover:text-primary-700 dark:hover:text-primary-300">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <Briefcase className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Job Postings Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            Create your first job posting to start finding the perfect AI talent for your team.
          </p>
          <button
            onClick={() => setShowCreateJob(true)}
            className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
          >
            Post Your First Job
          </button>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h2>
        <button
          onClick={() => {}}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Download className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">Export</span>
        </button>
      </div>

      {isAdmin ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Job Views</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">1,245</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Applications</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">87</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Profile Views</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">324</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Job Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Views</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Applications</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Conversion</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">Senior AI Engineer</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">458</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">32</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">7.0%</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                        Active
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">ML Research Scientist</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">312</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">18</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">5.8%</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                        Active
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">Data Scientist</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">287</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">24</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">8.4%</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                        Active
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            Track your job postings performance, application rates, and candidate engagement with our advanced analytics.
          </p>
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
          >
            Upgrade to Access Analytics
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Employer Dashboard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Find and hire top AI talent for your organization
            </p>
          </div>

          {/* Section Content */}
          <div className="mt-4">
            {section === 'dashboard' && renderDashboard()}
            {section === 'talents' && renderTalents()}
            {section === 'jobs' && renderJobs()}
            {section === 'analytics' && renderAnalytics()}
          </div>
        </div>
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
    </>
  );
};

export default EmployerDashboard;