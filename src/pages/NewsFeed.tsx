import React, { useState, useEffect, useRef } from 'react';
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
import CreateEventModal from '../components/CreateEventModal';
import CreatePostModal from '../components/CreatePostModal';
import HashtagSystem from '../components/HashtagSystem';
import ChatDock from '../components/ChatDockProvider';
import NewsletterPopup from '../components/NewsletterPopup';
import GoogleAd from '../components/GoogleAd';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Newsfeed: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [trendingTools, setTrendingTools] = useState<any[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Click-outside listener for create menu
  useEffect(() => {
    if (!showCreateMenu) return;
    
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      
      if (menuRef.current?.contains(target)) {
        return; // inside menu
      }
      if (triggerRef.current?.contains(target)) {
        return; // the trigger button itself
      }
      
      setShowCreateMenu(false);
    };
    
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('touchstart', onDown, true);
    
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('touchstart', onDown, true);
    };
  }, [showCreateMenu]);

  // Esc to close create menu
  useEffect(() => {
    if (!showCreateMenu) return;
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setShowCreateMenu(false);
        triggerRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [showCreateMenu]);

  const handleEventCreated = (newEvent: any) => {
    // Handle event creation
    console.log('Event created:', newEvent);
  };

  const handlePostCreated = (newPost: any) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to tools page with hashtag search
    window.location.href = `/tools?search=${encodeURIComponent(hashtag)}`;
  };

  const createOptions = [
    {
      icon: MessageCircle,
      label: t('feed.create.post.label'),
      description: t('feed.create.post.desc'),
      action: () => setShowCreatePost(true),
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Zap,
      label: t('feed.create.tool.label'),
      description: t('feed.create.tool.desc'),
      action: () => window.location.href = '/tools/create',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: PenTool,
      label: t('feed.create.article.label'),
      description: t('feed.create.article.desc'),
      action: () => window.location.href = '/articles/create',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Calendar,
      label: t('feed.create.event.label'),
      description: t('feed.create.event.desc'),
      action: () => setShowCreateEvent(true),
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <>
      <div className="py-8 min-h-screen bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t('feed.welcome', { name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there' })}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('feed.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Create Content Card */}
              <div className="bg-card rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{t('feed.createSomething')}</h3>
                  <button
                    ref={triggerRef}
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="p-2 bg-gradient-primary text-white rounded-lg hover:shadow-md transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {showCreateMenu && (
                  <div ref={menuRef} className="space-y-3">
                    {createOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          option.action();
                          setShowCreateMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        <div className={`p-2 bg-gradient-to-r ${option.color} rounded-lg`}>
                          <option.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground text-sm">{option.label}</h4>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
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
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 dark:text-white">{t('feed.create.post.label')}</span>
                    </button>
                    <button
                      onClick={() => window.location.href = '/tools/create'}
                      className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-800/20 transition-colors"
                    >
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-1" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{t('feed.create.tool.label')}</span>
                    </button>
                    <button
                      onClick={() => window.location.href = '/articles/create'}
                      className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-800/20 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">{t('feed.create.article.label')}</span>
                    </button>
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-800/20 transition-colors"
                    >
                      <Calendar className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">{t('feed.create.event.label')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hashtag System */}
              <HashtagSystem onHashtagClick={handleHashtagClick} />

              {/* Sidebar Ad - 100% platform revenue (no creatorId) */}
              <div className="mt-6">
                <GoogleAd 
                  adFormat="display" 
                  className="min-h-[250px] rounded-xl overflow-hidden"
                  // No contentId or creatorId = 100% platform revenue
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Create Post Quick Access */}
              <div className="bg-card rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 text-left p-4 bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    {t('feed.compose.placeholder')}
                  </button>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-medium hover:shadow-md transition-all flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('feed.compose.post')}</span>
                  </button>
                </div>
              </div>

              {/* Trending Tools Section - Only show if there are trending tools */}
              {trendingTools.length > 0 && (
                <div className="bg-card rounded-2xl shadow-sm p-6 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{t('feed.trendingTitle')}</h3>
                  </div>
                  
                  <div className="flex overflow-x-auto pb-4 space-x-4">
                    {trendingTools.map((tool) => (
                      <a 
                        key={tool.id}
                        href={`/tools/${tool.id}`}
                        className="flex-shrink-0 w-64 p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold">
                            {tool.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{tool.name}</h4>
                            <p className="text-xs text-muted-foreground">{tool.category}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tool.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-foreground">{tool.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-foreground">{tool.engagement.toLocaleString()}</span>
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