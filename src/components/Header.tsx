import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Zap, Plus, Settings, User, LogOut, Bell, MessageCircle, Building, BarChart3, Moon, Sun, Briefcase, Users, Crown, BookOpen, Shield, LayoutDashboard, Flag, Headphones, CreditCard } from 'lucide-react';
import ChatDock from './ChatDock';
import GlobalSearch from './GlobalSearch';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../providers/ThemeProvider';
import AuthModal from './AuthModal';
import VerificationBadge from './VerificationBadge';
import LanguageSelector from './LanguageSelector';
import ConnectionRequestsPopover from './ConnectionRequestsPopover';
import NotificationDropdown from './NotificationDropdown';
import ContactSupportModal from './ContactSupportModal';
import ReportProblemModal from './ReportProblemModal';
import ManageSubscriptionModal from './ManageSubscriptionModal';
import PremiumBadge from './PremiumBadge';
import { supabase } from '../integrations/supabase/client';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showManageSubscriptionModal, setShowManageSubscriptionModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [connectionRequestsCount, setConnectionRequestsCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [premiumTier, setPremiumTier] = useState<'silver' | 'gold' | null>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, isEmployer, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userProfilePhoto, setUserProfilePhoto] = useState<string | null>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const createTriggerRef = useRef<HTMLButtonElement>(null);

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

  // Creator access is available to all logged-in users
  const isCreator = !!user;
  
  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('Header - isCreator:', isCreator);
      console.log('Header - isEmployer:', isEmployer);
      console.log('Header - isAdmin:', isAdmin);
    }
  }, [user, isCreator, isEmployer, isAdmin]);

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

  // Fetch connection requests count dynamically
  useEffect(() => {
    const fetchConnectionRequestsCount = async () => {
      if (user && isCreator && !isEmployerView) {
        try {
          const { data, error } = await supabase
            .from('connection_requests')
            .select('id', { count: 'exact' })
            .eq('recipient_id', user.id)
            .eq('status', 'pending');

          if (!error) {
            setConnectionRequestsCount(data?.length || 0);
          }
        } catch (error) {
          console.error('Error fetching connection requests count:', error);
        }
      }
    };

    fetchConnectionRequestsCount();

    // Listen for connection request processing events
    const handleConnectionRequestProcessed = () => fetchConnectionRequestsCount();
    window.addEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);

    return () => {
      window.removeEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);
    };
  }, [user, isCreator, isEmployerView]);

  // Fetch user profile photo from database
  useEffect(() => {
    const fetchUserProfilePhoto = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('profile_photo, handle, is_premium, premium_until, premium_tier, role_id, account_type')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            if (data.profile_photo) {
              setUserProfilePhoto(data.profile_photo);
            }
            if (data.handle) {
              setUserHandle(data.handle);
            }
            // Check premium status - admins automatically get gold premium access
            const isAdminUser = data.role_id === 1 || data.account_type === 'admin';
            const isActive = isAdminUser || (data.is_premium && (!data.premium_until || new Date(data.premium_until) > new Date()));
            setIsPremium(isActive);
            setPremiumTier(isAdminUser ? 'gold' : (data.premium_tier as 'silver' | 'gold' | null));
            setPremiumUntil(data.premium_until || null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfilePhoto();
  }, [user]);

  // Click-outside listener for create menu
  useEffect(() => {
    if (!showCreateMenu) return;
    
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      
      if (createMenuRef.current?.contains(target)) {
        return; // inside menu
      }
      if (createTriggerRef.current?.contains(target)) {
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
        createTriggerRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [showCreateMenu]);

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
      <header className="w-full bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-sm">
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
                    ? 'text-primary bg-primary/10 active'
                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
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
                  <span className="ml-1 text-xs text-primary">*</span>
                )}
              </Link>
            ))}
            
            {isEmployerView && (
              <>
                <Link
                  to="/employer"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    isActive('/employer')
                      ? 'text-primary bg-primary/10 active'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
                  }`}
                >
                   {t('nav.dashboard')}
                </Link>
                <Link
                  to="/employer/talents"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    location.pathname.includes('/employer/talents')
                      ? 'text-primary bg-primary/10 active'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
                  }`}
                >
                  {t('nav.talent')}
                </Link>
                <Link
                  to="/employer/jobs"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    location.pathname.includes('/employer/jobs')
                      ? 'text-primary bg-primary/10 active'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
                  }`}
                >
                  {t('nav.jobs')}
                </Link>
                <Link
                  to="/employer/projects"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    location.pathname.includes('/employer/projects')
                      ? 'text-primary bg-primary/10 active'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
                  }`}
                >
                  {t('dashboard.projects')}
                </Link>
                <Link
                  to="/employer/analytics"
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${
                    location.pathname.includes('/employer/analytics')
                      ? 'text-primary bg-primary/10 active'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
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
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            {/* Search Button */}
            {!isEmployerView ? (
              <GlobalSearch className="hidden md:block w-64" />
            ) : (
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search talent, jobs..."
                    className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-64 transition-all duration-200 bg-card text-foreground"
                  />
                </div>
              </form>
            )}
            
            {/* Mobile Search Button */}
            <button 
              onClick={() => navigate(isEmployerView ? '/employer/talents' : '/tools')}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            
            {user ? (
              <>
                {/* Notifications */}
                {isEmployerView ? (
                  <Link
                    to="/employer/notifications"
                    className="relative p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted rounded-lg"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                ) : (
                  <NotificationDropdown notificationCount={notificationCount} />
                )}

                {/* Messages */}
                <Link
                  to="/messages"
                  className="relative p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted rounded-lg"
                  title="Messages"
                >
                  <MessageCircle className="h-5 w-5" />
                  {messageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {messageCount}
                    </span>
                  )}
                </Link>

                {/* Connection Requests - Only for creators */}
                {isCreator && !isEmployerView && (
                  <ConnectionRequestsPopover 
                    connectionRequestsCount={connectionRequestsCount} 
                  />
                )}


                {/* Create Dropdown - Only for authenticated users in creator view */}
                {!isEmployerView && (
                  <div className="relative">
                    <button
                      ref={createTriggerRef}
                      onClick={() => setShowCreateMenu(!showCreateMenu)}
                      className="flex items-center space-x-1 px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-all duration-200 whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium hidden sm:inline">Create</span>
                    </button>
                    
                    {showCreateMenu && (
                      <div ref={createMenuRef} className="absolute right-0 mt-2 w-48 bg-popover rounded-xl shadow-lg border border-border py-2 z-50 animate-slide-up backdrop-blur-sm">
                        <Link
                          to="/tools/create"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateMenu(false);
                          }}
                        >
                          AI Tool
                        </Link>
                        <Link
                          to="/articles/create"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateMenu(false);
                          }}
                        >
                          Article
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateMenu(false);
                            navigate('/create-post');
                          }}
                          className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          Post
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateMenu(false);
                            navigate('/community');
                            setTimeout(() => {
                              const event = new CustomEvent('openCreateEventModal');
                              window.dispatchEvent(event);
                            }, 100);
                          }}
                          className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          Event
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateMenu(false);
                            navigate('/community');
                            setTimeout(() => {
                              const event = new CustomEvent('openCreateGroupModal');
                              window.dispatchEvent(event);
                            }, 100);
                          }}
                          className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          Group
                        </button>
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
                    {userProfilePhoto || user?.user_metadata?.profile_photo ? (
                      <img 
                        src={userProfilePhoto || user.user_metadata.profile_photo} 
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
                        <Link
                          to={`/creator/${userHandle || user?.id}`}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary transition-colors">
                            {user?.user_metadata?.full_name || user.email?.split('@')[0]}
                          </p>
                          {isPremium && (
                            <PremiumBadge tier={premiumTier} size="sm" />
                          )}
                          {verificationBadgeType && (
                            <VerificationBadge type={verificationBadgeType} size="sm" />
                          )}
                        </Link>
                      </div>
                      {isEmployerView ? (
                        <>
                          <LanguageSelector 
                            variant="menu" 
                            onLocaleChange={() => setShowUserMenu(false)} 
                          />
                        </>
                      ) : (
                        <>
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
                          <Link
                            to="/guidelines"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                              {t('nav.guidelines')}
                            </div>
                          </Link>
                           {isCreator && !isPremium && (
                              <Link
                                to="/upgrade"
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <div className="flex items-center">
                                  <Crown className="h-4 w-4 mr-2 text-yellow-500 dark:text-yellow-400" />
                                  Upgrade to Premium
                                </div>
                              </Link>
                            )}
                          {/* Contact Support - Premium Only */}
                          {isPremium && (
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                setShowContactSupportModal(true);
                              }}
                              className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center">
                                <Headphones className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
                                Contact Support
                              </div>
                            </button>
                          )}
                          {/* Professional Dashboard - Premium Only */}
                          {isPremium && (
                            <Link
                              to="/professional-dashboard"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <div className="flex items-center">
                                <LayoutDashboard className="h-4 w-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                                Professional Dashboard
                              </div>
                            </Link>
                          )}
                          {/* Manage Subscription - Premium Only */}
                          {isPremium && (
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                setShowManageSubscriptionModal(true);
                              }}
                              className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center">
                                <CreditCard className="h-4 w-4 mr-2 text-orange-500 dark:text-orange-400" />
                                Manage Subscription
                              </div>
                            </button>
                          )}
                          {/* Report a Problem */}
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowReportModal(true);
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center">
                              <Flag className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" />
                              Report a Problem
                            </div>
                          </button>
                        </>
                      )}
                      {/* Dashboard Switcher Section - Only show for employers and admins */}
                      {(isEmployer || isAdmin) && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                          <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Switch Dashboard
                          </p>
                          {/* Toggle View Button - Switch between Creator/Employer views */}
                          {(isEmployer || isAdmin) && (
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                toggleEmployerView();
                              }}
                              className="w-full block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-2 text-purple-500 dark:text-purple-400" />
                                {isEmployerView ? "Creator View" : "Employer View"}
                              </div>
                            </button>
                          )}
                          {/* Admin Dashboard */}
                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" />
                                Admin Dashboard
                              </div>
                            </Link>
                          )}
                        </div>
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
                  
                  {isCreator && !isEmployerView && !isPremium && (
                      <Link
                        to="/upgrade"
                        className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-yellow-500 dark:text-yellow-400" />
                          Upgrade to Premium
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
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/create-post');
                        }}
                        className="w-full text-left block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                      >
                        Post
                      </button>
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
                        {isEmployerView ? "Creator View" : "Employer View"}
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

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={showContactSupportModal}
        onClose={() => setShowContactSupportModal(false)}
      />

      {/* Report a Problem Modal */}
      <ReportProblemModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* Manage Subscription Modal */}
      <ManageSubscriptionModal
        isOpen={showManageSubscriptionModal}
        onClose={() => setShowManageSubscriptionModal(false)}
        premiumUntil={premiumUntil}
        premiumTier={premiumTier}
      />
    </>
  );
};

export default Header;