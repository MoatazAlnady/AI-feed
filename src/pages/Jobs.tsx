import React from 'react';
import { MapPin, Clock, Briefcase, ExternalLink } from 'lucide-react';
import ChatDock from '@/components/ChatDock';
import SEOHead from '@/components/SEOHead';
import { useTranslation } from 'react-i18next';

const Jobs: React.FC = () => {
  const { t } = useTranslation();
  // Mock jobs data - replace with real data from Supabase
  const jobs = [
    {
      id: 1,
      title: "Senior AI Engineer",
      company: "TechCorp",
      location: "San Francisco, CA",
      type: "Full-time",
      experience: "5+ years",
      description: "Join our AI team to build cutting-edge machine learning solutions.",
      postedAt: "2 days ago",
      salary: "$150k - $200k"
    },
    {
      id: 2,
      title: "ML Research Scientist",
      company: "AI Labs",
      location: "New York, NY",
      type: "Full-time",
      experience: "3+ years",
      description: "Research and develop new machine learning algorithms.",
      postedAt: "1 week ago",
      salary: "$120k - $180k"
    },
    {
      id: 3,
      title: "Data Scientist",
      company: "DataFlow",
      location: "Remote",
      type: "Contract",
      experience: "2+ years",
      description: "Analyze complex datasets and build predictive models.",
      postedAt: "3 days ago",
      salary: "$80k - $120k"
    }
  ];

  return (
    <>
      <SEOHead
        title="AI Jobs - Find AI & Machine Learning Career Opportunities"
        description="Discover the latest AI and machine learning job opportunities. Find positions for AI engineers, data scientists, ML researchers, and more. Start your AI career today."
        keywords="AI jobs, machine learning jobs, data scientist jobs, AI engineer, ML researcher, AI career, artificial intelligence careers"
        url="https://aifeed.app/jobs"
        type="website"
      />
      <div className="py-8 min-h-screen">
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
              <select className="border border-border rounded-xl px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>{t('jobs.allLocations')}</option>
                <option>{t('jobs.remote')}</option>
                <option>San Francisco</option>
                <option>New York</option>
              </select>
              <select className="border border-border rounded-xl px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>{t('jobs.allTypes')}</option>
                <option>{t('jobs.fullTime')}</option>
                <option>{t('jobs.partTime')}</option>
                <option>{t('jobs.contract')}</option>
              </select>
              <select className="border border-border rounded-xl px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>{t('jobs.allExperience')}</option>
                <option>{t('jobs.entryLevel')}</option>
                <option>{t('jobs.midLevel')}</option>
                <option>{t('jobs.seniorLevel')}</option>
              </select>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-card rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-border">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{job.title}</h3>
                    <p className="text-foreground font-medium mb-2">{job.company}</p>
                    <p className="text-muted-foreground mb-3">{job.description}</p>
                    
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
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">{job.salary}</div>
                    <div className="text-sm text-muted-foreground mb-4">{job.postedAt}</div>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200">
                      {t('jobs.applyNow')}
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-8">
            <button className="bg-card border border-border text-foreground px-6 py-3 rounded-xl hover:bg-muted transition-colors">
              {t('jobs.loadMore')}
            </button>
          </div>
        </div>

        {/* Chat Dock */}
        <ChatDock />
      </div>
    </>
  );
};

export default Jobs;