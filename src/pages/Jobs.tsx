import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Briefcase, ExternalLink, Loader2 } from 'lucide-react';
import ChatDock from '@/components/ChatDock';
import SEOHead from '@/components/SEOHead';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  created_at: string;
  salary: string | null;
  application_url: string | null;
  company_pages?: {
    name: string;
    logo_url: string | null;
  } | null;
}

const Jobs: React.FC = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const [filters, setFilters] = useState({
    location: 'all',
    type: 'all',
    experience: 'all'
  });

  const fetchJobs = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOffset(0);
    }

    try {
      const currentOffset = isLoadMore ? offset : 0;
      
      // Bypass deep type instantiation by using any
      const result = await (supabase
        .from('jobs') as any)
        .select('id, title, company, location, type, experience, description, created_at, salary, application_url')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + LIMIT - 1);
      
      const data = result.data as Job[] | null;
      const error = result.error;

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      const formattedJobs = (data || []).map(job => ({
        ...job,
      }));

      if (isLoadMore) {
        setJobs(prev => [...prev, ...formattedJobs]);
        setOffset(prev => prev + LIMIT);
      } else {
        setJobs(formattedJobs);
        setOffset(LIMIT);
      }

      setHasMore((data?.length || 0) === LIMIT);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleApply = (job: Job) => {
    if (job.application_url) {
      window.open(job.application_url, '_blank');
    }
  };

  return (
    <>
      <SEOHead
        title="AI Jobs - Find AI & Machine Learning Career Opportunities"
        description="Discover the latest AI and machine learning job opportunities. Find positions for AI engineers, data scientists, ML researchers, and more. Start your AI career today."
        keywords="AI jobs, machine learning jobs, data scientist jobs, AI engineer, ML researcher, AI career, artificial intelligence careers"
        url="https://aifeed.app/jobs"
        type="website"
      />
      <div className="py-8 min-h-screen bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">{t('jobs.title')}</h1>
            <p className="text-xl text-muted-foreground">
              {t('jobs.subtitle')}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl shadow-sm p-6 mb-8 border border-border">
            <div className="flex flex-wrap gap-4">
              <select 
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="border border-border rounded-xl px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t('jobs.allLocations')}</option>
                <option value="remote">{t('jobs.remote')}</option>
                <option value="San Francisco">San Francisco</option>
                <option value="New York">New York</option>
              </select>
              <select 
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="border border-border rounded-xl px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t('jobs.allTypes')}</option>
                <option value="Full-time">{t('jobs.fullTime')}</option>
                <option value="Part-time">{t('jobs.partTime')}</option>
                <option value="Contract">{t('jobs.contract')}</option>
              </select>
              <select 
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
                className="border border-border rounded-xl px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t('jobs.allExperience')}</option>
                <option value="Entry Level">{t('jobs.entryLevel')}</option>
                <option value="Mid Level">{t('jobs.midLevel')}</option>
                <option value="Senior Level">{t('jobs.seniorLevel')}</option>
              </select>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No jobs found matching your criteria.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-card rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-foreground">{job.title}</h3>
                      <p className="text-foreground font-medium mb-2">{job.company}</p>
                      <p className="text-muted-foreground mb-3 line-clamp-2">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.type}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.experience}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-6">
                      {job.salary && (
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">{job.salary}</div>
                      )}
                      <div className="text-sm text-muted-foreground mb-4">
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </div>
                      <button 
                        onClick={() => handleApply(job)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        {t('jobs.applyNow')}
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          {hasMore && jobs.length > 0 && (
            <div className="text-center mt-8">
              <button 
                onClick={() => fetchJobs(true)}
                disabled={loadingMore}
                className="bg-card border border-border text-foreground px-6 py-3 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  t('jobs.loadMore')
                )}
              </button>
            </div>
          )}
        </div>

        {/* Chat Dock */}
        <ChatDock />
      </div>
    </>
  );
};

export default Jobs;