import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Zap, Plus, Settings, User, LogOut, Bell, MessageCircle, Building, BarChart3, Moon, Sun, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../providers/ThemeProvider';
import AuthModal from './AuthModal';
import VerificationBadge from './VerificationBadge';
import LanguageSelector from './LanguageSelector';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Navigation items for different user types
  const navigation = [
    { name: t('nav.home'), href: '/', hideWhenLoggedIn: true },
    { name: t('nav.about'), href: '/about', hideWhenLoggedIn: true },
    { name: t('nav.newsfeed'), href: '/newsfeed', protected: true },
    { name: t('nav.tools'), href: '/tools' },
    { name: t('nav.categories'), href: '/categories' },
    { name: t('nav.jobs'), href: '/jobs' },
    { name: t('nav.community'), href: '/community', protected: true },
    { name: t('nav.blog'), href: '/blog' },
  ];

  // Check if user is employer
  const isEmployer = user?.user_metadata?.account_type === 'employer';
  const isCreator = user?.user_metadata?.account_type === 'creator' || user?.user_metadata?.account_type === 'user';

  // Check verification status
  const isVerified = user?.user_metadata?.verified || false;
  const isTopVoice = user?.user_metadata?.ai_nexus_top_voice || false;
  const toolsSubmitted = user?.user_metadata?.tools_submitted || 0;
  const articlesWritten = user?.user_metadata?.articles_written || 0;
  const totalReach = user?.user_metadata?.total_reach || 0;
  const totalEngagement = user?.user_metadata?.total_engagement || 0;

  // Check if user qualifies for Top Voice (50+ tools, 50+ articles, 100K+ reach, 10K+ engagement)
  const qualifiesForTopVoice = toolsSubmitted >= 50 && articlesWritten >= 50 && totalReach >= 100000 && totalEngagement >= 10000;

  // Check if we're in employer dashboard view
  const isEmployerView = location.pathname.startsWith('/employer');

  // Filter navigation items based on authentication status
  const filteredNavigation = user 
    ? navigation.filter(item => !item.hideWhenLoggedIn)
    : navigation.filter(item => item.href === '/' || item.href === '/about' || item.href === '/tools' || item.href === '/categories' || item.href === '/jobs' || item.href === '/blog');

  useEffect(() => {
    // Restore preferred locale on page load
    const preferredLocale = localStorage.getItem('preferredLocale');
    if (preferredLocale && preferredLocale !== 'en') {
      // Set app locale logic would go here when i18n is fully implemented
      console.log('Preferred locale:', preferredLocale);
    }
    
    // Fetch real notification and message counts from API
    const fetchCounts = async () => {
      if (user) {
        try {
          // const notifResponse = await fetch('/api/notifications/count');
          // const notifData = await notifResponse.json();
          // setNotificationCount(notifData.count);
          
          // const msgResponse = await fetch('/api/messages/unread-count');
          // const msgData = await msgResponse.json();
          // setMessageCount(msgData.count);
          
          // For now, set to 0 until real data is available
          setNotificationCount(0);
          setMessageCount(0);
        } catch (error) {
          console.error('Error fetching counts:', error);
        }
      }
    };

    fetchCounts();
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (isEmployerView) {
        navigate(`/employer/talents?search=${encodeURIComponent(searchTerm.trim())}`);
      } else {
        navigate(`/tools?search=${encodeURIComponent(searchTerm.trim())}`);
      }
      setSearchTerm('');
    }
  };

  const getVerificationBadgeType = () => {
    if (isVerified && (isTopVoice || qualifiesForTopVoice)) return 'both';
    if (isTopVoice || qualifiesForTopVoice) return 'top-voice';
    if (isVerified) return 'verified';
    return null;
  };

  const verificationBadgeType = getVerificationBadgeType();

  const toggleEmployerView = () => {
    if (isEmployerView) {
      navigate('/');
    } else {
      navigate('/employer');
    }
  };

  return (
    <>
      <header className="w-full bg-white dark:bg-[#091527] shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-[#091527]/95">
        <div className="mx-auto flex max-w-[1440px] items-center px-4 h-16">
          {/* Col 1 - Left: Logo + Navigation cluster */}
          <div className="flex items-center gap-x-2">
            <Link to={isEmployerView ? "/employer" : "/"} className="flex items-center space-x-3 group flex-shrink-0">
              <div className="p-2 bg-gradient-primary rounded-lg group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient whitespace-nowrap">
                AI Feed
              </span>
            </Link>
          </div>

          {/* Col 2 - Center: Navigation Links */}
          <nav className="flex flex-1 justify-center gap-x-10 max-lg:hidden ml-2">
            {!isEmployerView && filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                  isActive(item.href)
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 active'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${item.protected && !user ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  if (item.protected && !user) {
                    e.preventDefault();
                    openAuthModal('signin');
                  }
                }}
              >
                {item.name}
                {item.protected && !user && (
                  <span className="ml-1 text-xs text-primary-500 dark:text-primary-400">*</span>
                )}
              </Link>
            ))}
            
            {isEmployerView && (
              <>
                <Link
                  to="/employer"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    isActive('/employer')
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 active'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                   {t('nav.dashboard')}
                </Link>
                <Link
                  to="/employer/talents"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    location.pathname.includes('/employer/talents')
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 active'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('nav.talent')}
                </Link>
                <Link
                  to="/employer/jobs"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    location.pathname.includes('/employer/jobs')
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 active'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('nav.jobs')}
                </Link>
                <Link
                  to="/employer/projects"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    location.pathname.includes('/employer/projects')
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 active'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('dashboard.projects')}
                </Link>
                <Link
                  to="/employer/analytics"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    location.pathname.includes('/employer/analytics')
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 active'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('dashboard.analytics')}
                </Link>
              </>
            )}
          </nav>

          {/* Col 3 - Right: Language, Theme, Search, User Actions */}
          <div className="flex items-center gap-x-4">
            {/* Language Picker - Only show for non-authenticated users */}
            {!user && (
              <div className="relative">
                <LanguageSelector variant="header" />
              </div>
            )}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            {/* Search Button */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isEmployerView ? "Search talent, jobs..." : "Search AI tools..."}
                  className="pl-10 pr-4 py-2 border border-gray-200 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </form>
            
            {/* Mobile Search Button */}
            <button 
              onClick={() => navigate(isEmployerView ? '/employer/talents' : '/tools')}
              className="md:hidden p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            
            {user ? (
              <>
                {/* Analytics - Only for creators */}
                {isCreator && !isEmployerView && (
                  <Link
                    to="/analytics"
                    className={`p-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ${
                      location.pathname === '/analytics'
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                        : 'text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100'
                    }`}
                    title="Analytics"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Link>
                )}

                {/* Notifications */}
                {isEmployerView ? (
                  <Link
                    to="/employer/notifications"
                    className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    to="/notifications"
                    className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Messages */}
                {isEmployerView ? (
                  <Link
                    to="/employer/messages"
                    className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {messageCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {messageCount}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    to="/messages"
                    className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {messageCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {messageCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Create Dropdown - Only for authenticated users in creator view */}
                {!isEmployerView && (
                  <div className="relative">
                    <button
                      onClick={() => setShowCreateMenu(!showCreateMenu)}
                      className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-all duration-200 whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium hidden sm:inline">Create</span>
                    </button>
                    
                    {showCreateMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slide-up">
                        <Link
                          to="/tools/create"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowCreateMenu(false)}
                        >
                          AI Tool
                        </Link>
                        <Link
                          to="/articles/create"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowCreateMenu(false)}
                        >
                          Article
                        </Link>
                        <Link
                          to="/posts/create"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowCreateMenu(false)}
                        >
                          Post
                        </Link>
                        <Link
                          to="/community"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowCreateMenu(false)}
                        >
                          Event
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* User Avatar with Dropdown */}
                <div className="relative ml-6">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary hover:shadow-md transition-all duration-200"
                    title={user?.user_metadata?.full_name || user?.email || 'User'}
                  >
                    {user?.user_metadata?.profile_photo ? (
                      <img 
                        src={user.user_metadata.profile_photo} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white dark:text-white text-sm font-medium">
                        {((user?.user_metadata?.full_name || user?.email || 'User')[0] || 'U').toUpperCase()}
                      </span>
                    )}
                    {/* Verification Badge */}
                    {verificationBadgeType && (
                      <div className="absolute -bottom-1 -right-1">
                        <VerificationBadge type={verificationBadgeType} size="sm" />
                      </div>
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slide-up">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user?.user_metadata?.full_name || user.email?.split('@')[0]}
                          </p>
                          {verificationBadgeType && (
                            <VerificationBadge type={verificationBadgeType} size="sm" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isEmployer ? 'Employer Account' : 'Creator Account'}
                        </p>
                      </div>
                      {isEmployerView ? (
                        <>
                          <Link
                            to="/employer/profile"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            {t('nav.profile')}
                          </Link>
                          <LanguageSelector 
                            variant="menu" 
                            onLocaleChange={() => setShowUserMenu(false)} 
                          />
                        </>
                      ) : (
                        <>
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            {t('nav.profile')}
                          </Link>
                          <Link
                            to="/settings"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                            {t('nav.settings')}
                            </div>
                          </Link>
                          <LanguageSelector 
                            variant="menu" 
                            onLocaleChange={() => setShowUserMenu(false)} 
                          />
                          {isCreator && (
                            <Link
                              to="/analytics"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <div className="flex items-center">
                                <BarChart3 className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                                Analytics
                              </div>
                            </Link>
                          )}
                        </>
                      )}
                      {(isEmployer || isAdmin) && (
                        <Link
                          to={isEmployerView ? "/" : "/employer"}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => {
                            setShowUserMenu(false);
                            toggleEmployerView();
                          }}
                        >
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-purple-500 dark:text-purple-400" />
                            {isEmployerView ? "Switch to Creator View" : "Switch to Employer View"}
                          </div>
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('auth.signOut')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Auth Buttons for non-authenticated users */
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  id="signupBtn"
                >
                  {t('nav.signIn')}
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isEmployerView ? "Search talent, jobs..." : "Search AI tools..."}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </form>

              {!isEmployerView ? (
                // Regular navigation for creator view
                filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${item.protected && !user ? 'opacity-50' : ''}`}
                    onClick={(e) => {
                      if (item.protected && !user) {
                        e.preventDefault();
                        openAuthModal('signin');
                      } else {
                        setIsMenuOpen(false);
                      }
                    }}
                  >
                    {item.name}
                    {item.protected && !user && (
                      <span className="ml-1 text-xs text-primary-500 dark:text-primary-400">*</span>
                    )}
                  </Link>
                ))
              ) : (
                // Employer dashboard navigation
                <>
                  <Link
                    to="/employer"
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive('/employer')
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    to="/employer/talents"
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      location.pathname.includes('/employer/talents')
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.talent')}
                  </Link>
                  <Link
                    to="/employer/jobs"
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      location.pathname.includes('/employer/jobs')
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.jobs')}
                  </Link>
                  <Link
                    to="/employer/projects"
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      location.pathname.includes('/employer/projects')
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('dashboard.projects')}
                  </Link>
                  <Link
                    to="/employer/analytics"
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      location.pathname.includes('/employer/analytics')
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('dashboard.analytics')}
                  </Link>
                </>
              )}
              
              {user ? (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  {isEmployerView ? (
                    <>
                      <Link
                        to="/employer/notifications"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Notifications {notificationCount > 0 && `(${notificationCount})`}
                      </Link>
                      <Link
                        to="/employer/messages"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Messages {messageCount > 0 && `(${messageCount})`}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/notifications"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Notifications {notificationCount > 0 && `(${notificationCount})`}
                      </Link>
                      <Link
                        to="/messages"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Messages {messageCount > 0 && `(${messageCount})`}
                      </Link>
                    </>
                  )}
                  
                  {isCreator && !isEmployerView && (
                    <Link
                      to="/analytics"
                      className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                        Analytics
                      </div>
                    </Link>
                  )}
                  {!isEmployerView && (
                    <>
                      <Link
                        to="/tools/create"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        AI Tool
                      </Link>
                      <Link
                        to="/articles/create"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Article
                      </Link>
                      <Link
                        to="/posts/create"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Post
                      </Link>
                      <Link
                        to="/community"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Event
                      </Link>
                    </>
                  )}
                  {(isEmployer || isAdmin) && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        toggleEmployerView();
                      }}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-purple-500 dark:text-purple-400" />
                        {isEmployerView ? "Switch to Creator View" : "Switch to Employer View"}
                      </div>
                    </button>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {isEmployerView ? (
                    <Link
                      to="/employer/profile"
                      className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                    {t('nav.profile')}
                    </Link>
                  ) : (
                    <Link
                      to="/profile"
                      className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {t('auth.signOut')}
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <button
                    onClick={() => {
                      openAuthModal('signin');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-base font-medium bg-gradient-to-r from-primary-500 to-secondary-500 text-gray-600 dark:text-gray-300 rounded-md transition-colors"
                    id="signupBtn"
                  >
                    {t('nav.signIn')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Overlays */}
        {showCreateMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCreateMenu(false)}
          />
        )}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;