import React, { useState } from 'react';
import { MessageSquare, Users, Lightbulb, TrendingUp, Star, Calendar, Plus, Search, Hash } from 'lucide-react';
import ChatDock from '../components/ChatDockProvider';

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'groups' | 'networking'>('feed');

  const renderFeed = () => (
      <div className="space-y-6">
        <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Community Feed</h3>
          <p className="text-muted-foreground">
            Connect with other creators, share insights, and discover new opportunities.
          </p>
        </div>
      </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Community Events</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Tomorrow, 2:00 PM</span>
          </div>
          <h4 className="font-semibold text-foreground mb-2">AI Tools Showcase</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Discover the latest AI tools and their real-world applications.
          </p>
          <button className="text-primary hover:underline text-sm">Join Event →</button>
        </div>
        
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Friday, 5:00 PM</span>
          </div>
          <h4 className="font-semibold text-foreground mb-2">Networking Mixer</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Connect with fellow AI enthusiasts and industry professionals.
          </p>
          <button className="text-primary hover:underline text-sm">RSVP →</button>
        </div>
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Discussion Groups</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Create Group</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Hash className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Machine Learning</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Discuss ML algorithms, techniques, and latest research.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">2.4k members</span>
            <button className="text-primary hover:underline text-sm">Join Discussion →</button>
          </div>
        </div>
        
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Hash className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">AI Tools</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Share and discover new AI tools and platforms.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">5.1k members</span>
            <button className="text-primary hover:underline text-sm">Join Discussion →</button>
          </div>
        </div>
        
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Hash className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Startups & AI</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect with AI startup founders and innovators.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">1.8k members</span>
            <button className="text-primary hover:underline text-sm">Join Discussion →</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNetworking = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Find Creators</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search creators..."
            className="pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">JD</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">John Doe</h4>
              <p className="text-sm text-muted-foreground">AI Researcher</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Passionate about ML and NLP. Published 20+ research papers.
          </p>
          <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Connect
          </button>
        </div>
        
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">SM</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Sarah Miller</h4>
              <p className="text-sm text-muted-foreground">Product Manager</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Building AI-powered products. Love to share insights and tools.
          </p>
          <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Connect
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            AI Nexus Community
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with like-minded AI enthusiasts, share knowledge, and build the future together.
          </p>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-8 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-background rounded-lg border border-border">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">10K+</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center p-6 bg-background rounded-lg border border-border">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Discussions</div>
            </div>
            <div className="text-center p-6 bg-background rounded-lg border border-border">
              <Lightbulb className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">Shared Projects</div>
            </div>
            <div className="text-center p-6 bg-background rounded-lg border border-border">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">95%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'feed', label: 'Feed', icon: MessageSquare },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'groups', label: 'Groups', icon: Hash },
                { id: 'networking', label: 'Networking', icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
      </section>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="container max-w-6xl mx-auto">
          {activeTab === 'feed' && renderFeed()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'groups' && renderGroups()}
          {activeTab === 'networking' && renderNetworking()}
        </div>
      </section>

      {/* Chat Dock */}
      <ChatDock />
    </div>
  );
};

export default Community;