import React, { useState } from 'react';
import { MessageSquare, Users, Lightbulb, TrendingUp, Star, Calendar, Plus, Search, Hash } from 'lucide-react';
import ChatDock from '../components/ChatDockProvider';

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'networking' | 'feed' | 'events' | 'groups'>('networking');
  const [searchTerm, setSearchTerm] = useState('');

  const renderFeed = () => (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Community Feed</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with other creators, share insights, and discover new opportunities.
          </p>
        </div>
      </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Community Events</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200">
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="text-sm text-gray-500 dark:text-gray-500">Tomorrow, 2:00 PM</span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Tools Showcase</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Discover the latest AI tools and their real-world applications.
          </p>
          <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Event →</button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="text-sm text-gray-500 dark:text-gray-500">Friday, 5:00 PM</span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Networking Mixer</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect with fellow AI enthusiasts and industry professionals.
          </p>
          <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">RSVP →</button>
        </div>
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Discussion Groups</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200">
          <Plus className="h-4 w-4" />
          <span>Create Group</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-gray-900 dark:text-white">Machine Learning</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Discuss ML algorithms, techniques, and latest research.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-500">2.4k members</span>
            <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Discussion →</button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-gray-900 dark:text-white">AI Tools</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Share and discover new AI tools and platforms.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-500">5.1k members</span>
            <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Discussion →</button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-gray-900 dark:text-white">Startups & AI</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect with AI startup founders and innovators.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-500">1.8k members</span>
            <button className="text-primary-600 dark:text-primary-400 hover:underline text-sm">Join Discussion →</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNetworking = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Find Creators</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">JD</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">John Doe</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI Researcher</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Passionate about ML and NLP. Published 20+ research papers.
          </p>
          <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200">
            Connect
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">SM</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Sarah Miller</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Product Manager</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Building AI-powered products. Love to share insights and tools.
          </p>
          <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-200">
            Connect
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Nexus Community
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Connect with like-minded AI enthusiasts, share knowledge, and build the future together.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <Users className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Active Members</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <MessageSquare className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Discussions</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <Lightbulb className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Shared Projects</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">95%</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Success Rate</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-0 px-6">
              {[
                { id: 'networking', label: 'Networking', icon: Users },
                { id: 'feed', label: 'Feed', icon: MessageSquare },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'groups', label: 'Groups', icon: Hash }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center space-x-2 py-4 px-6 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-cyan-400 bg-gray-700 dark:bg-gray-700 rounded-t-xl border-b-2 border-cyan-400'
                        : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-xl'
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

        {/* Content */}
        <div>
          {activeTab === 'feed' && renderFeed()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'groups' && renderGroups()}
          {activeTab === 'networking' && renderNetworking()}
        </div>
      </div>

      {/* Chat Dock */}
      <ChatDock />
    </div>
  );
};

export default Community;