import React, { useState } from 'react';
import { Calendar, Users, MessageSquare, Plus, Clock, MapPin, User } from 'lucide-react';

const CommunityFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState('events');

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare }
  ];

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Community Events</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </button>
      </div>

      <div className="grid gap-6">
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">AI Innovation Summit 2024</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>March 15, 2024</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>2:00 PM - 6:00 PM EST</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Virtual Event</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
              Upcoming
            </span>
          </div>
          
          <p className="text-muted-foreground mb-4">
            Join industry leaders and AI enthusiasts for a day of innovation, networking, and knowledge sharing. 
            Discover the latest trends in AI technology and connect with like-minded professionals.
          </p>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              124 attendees registered
            </span>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Community Groups</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Create Group</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">Machine Learning Researchers</h3>
              <p className="text-sm text-muted-foreground">A community for ML researchers to share insights and collaborate</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">1,234 members</span>
            <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">Public</span>
          </div>
          
          <div className="flex space-x-2">
            <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Join Group
            </button>
            <button className="px-3 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">AI Startups & Entrepreneurs</h3>
              <p className="text-sm text-muted-foreground">Connect with fellow AI entrepreneurs and startup founders</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">856 members</span>
            <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">Public</span>
          </div>
          
          <div className="flex space-x-2">
            <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Join Group
            </button>
            <button className="px-3 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDiscussions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Group Discussions</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Start Discussion</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-medium text-foreground">What are the best practices for fine-tuning LLMs?</h4>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">ML Research</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                I'm working on fine-tuning a large language model for a specific domain and would love to hear about your experiences...
              </p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>By Sarah Chen</span>
                <span>•</span>
                <span>2 hours ago</span>
                <span>•</span>
                <span>23 replies</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-medium text-foreground">Looking for co-founder for AI healthcare startup</h4>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">Startups</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                We're building an AI-powered diagnostic tool and looking for a technical co-founder with ML expertise...
              </p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>By Alex Kumar</span>
                <span>•</span>
                <span>5 hours ago</span>
                <span>•</span>
                <span>15 replies</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return renderEvents();
      case 'groups':
        return renderGroups();
      case 'discussions':
        return renderDiscussions();
      default:
        return renderEvents();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Community Features
          </h1>
          <p className="text-muted-foreground">
            Connect, collaborate, and grow with the AI community.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
    </div>
  );
};

export default CommunityFeatures;