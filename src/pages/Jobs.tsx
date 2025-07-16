import React from 'react';
import { MapPin, Clock, Briefcase, ExternalLink } from 'lucide-react';

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
    <div className="min-h-screen bg-[#111827] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">AI Jobs</h1>
          <p className="text-gray-300 text-lg">
            Discover exciting career opportunities in artificial intelligence and machine learning.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Locations</option>
            <option>Remote</option>
            <option>San Francisco</option>
            <option>New York</option>
          </select>
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Types</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
          </select>
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Experience Levels</option>
            <option>Entry Level</option>
            <option>Mid Level</option>
            <option>Senior Level</option>
          </select>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                  <p className="text-gray-300 font-medium mb-2">{job.company}</p>
                  <p className="text-gray-400 mb-3">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-300">
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
                  <div className="text-lg font-semibold text-green-400 mb-2">{job.salary}</div>
                  <div className="text-sm text-gray-400 mb-4">{job.postedAt}</div>
                  <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
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
          <button className="bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
            Load More Jobs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Jobs;