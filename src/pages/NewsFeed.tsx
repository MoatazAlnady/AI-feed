import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageCircle, 
  Calendar, 
  FileText, 
  Zap,
  User,
  PenTool,
  TrendingUp,
  Star
} from 'lucide-react';
import NewsFeedComponent from '../components/NewsFeed';
import CreatePostModal from '../components/CreatePostModal';
import CreateEventModal from '../components/CreateEventModal';
import HashtagSystem from '../components/HashtagSystem';
import ChatDock from '../components/ChatDockProvider';
import NewsletterPopup from '../components/NewsletterPopup';
import { useAuth } from '../context/AuthContext';

const Newsfeed: React.FC = () => {
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [trendingTools, setTrendingTools] = useState<any[]>([]);

  // Check if user should see newsletter popup - show on every refresh for unsubscribed users
  useEffect(() => {
    const checkNewsletterSubscription = () => {
      if (user && !user.user_metadata?.newsletter_subscription) {
        // Always show newsletter popup for registered but unsubscribed users on refresh
        setShowNewsletterPopup(true);
      }
    };

    // Check on component mount and when user changes
    checkNewsletterSubscription();
  }, [user]);

  const handlePostCreated = (newPost: any) => {
    setPosts([newPost, ...posts]);
  };

  const handleEventCreated = (newEvent: any) => {
    // Handle event creation
    console.log('Event created:', newEvent);
  };

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to tools page with hashtag search
    window.location.href = `/tools?search=${encodeURIComponent(hashtag)}`;
  };

  const createOptions = [
    {
      icon: MessageCircle,
      label: 'Post',
      description: 'Share your thoughts with the community',
      action: () => setShowCreatePost(true),
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Zap,
      label: 'AI Tool',
      description: 'Add a new AI tool to our directory',
      action: () => window.location.href = '/tools/create',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: PenTool,
      label: 'Article',
      description: 'Share your knowledge and insights',
      action: () => window.location.href = '/articles/create',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Calendar,
      label: 'Event',
      description: 'Organize an AI-related event',
      action: () => setShowCreateEvent(true),
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <>
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AI Enthusiast'}!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Stay updated with the latest from the AI community
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Create Content Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Create Something</h3>
                  <button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {showCreateMenu && (
                  <div className="space-y-3">
                    {createOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          option.action();
                          setShowCreateMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className={`p-2 bg-gradient-to-r ${option.color} rounded-lg`}>
                          <option.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{option.label}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!showCreateMenu && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/20 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-1" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Post</span>
                    </button>
                    <button
                      onClick={() => window.location.href = '/tools/create'}
                      className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-800/20 transition-colors"
                    >
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-1" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Tool</span>
                    </button>
                    <button
                      onClick={() => window.location.href = '/articles/create'}
                      className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-800/20 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">Article</span>
                    </button>
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-800/20 transition-colors"
                    >
                      <Calendar className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">Event</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hashtag System */}
              <HashtagSystem onHashtagClick={handleHashtagClick} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Create Post Quick Access */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    What's on your mind about AI?
                  </button>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {/* Trending Tools Section - Only show if there are trending tools */}
              {trendingTools.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Trending AI Tools</h3>
                  </div>
                  
                  <div className="flex overflow-x-auto pb-4 space-x-4">
                    {trendingTools.map((tool) => (
                      <a 
                        key={tool.id}
                        href={`/tools/${tool.id}`}
                        className="flex-shrink-0 w-64 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {tool.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{tool.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tool.category}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{tool.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{tool.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{tool.engagement.toLocaleString()}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* News Feed */}
              <NewsFeedComponent />
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Popup */}
      {showNewsletterPopup && (
        <NewsletterPopup onClose={() => setShowNewsletterPopup(false)} />
      )}

      {/* Chat Dock */}
      <ChatDock />

      {/* Modals */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
      />
      
      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={handleEventCreated}
      />
    </>
  );
};

export default Newsfeed;