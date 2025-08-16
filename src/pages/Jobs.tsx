import React from 'react';
import { MapPin, Clock, Briefcase, ExternalLink } from 'lucide-react';
import ChatDock from '@/components/ChatDock';

const Jobs: React.FC = () => {
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
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">AI Jobs</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Discover exciting career opportunities in artificial intelligence and machine learning.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <select className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>All Locations</option>
              <option>Remote</option>
              <option>San Francisco</option>
              <option>New York</option>
            </select>
            <select className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>All Types</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
            </select>
            <select className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>All Experience Levels</option>
              <option>Entry Level</option>
              <option>Mid Level</option>
              <option>Senior Level</option>
            </select>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{job.title}</h3>
                  <p className="text-gray-900 dark:text-white font-medium mb-2">{job.company}</p>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-500">
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
                  <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">{job.postedAt}</div>
                  <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200">
                    Apply Now
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Load More Jobs
          </button>
        </div>
      </div>

      {/* Chat Dock */}
      <ChatDock />
    </div>
  );
};

export default Jobs;