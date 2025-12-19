import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap, FolderOpen, Briefcase, Star, Search, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import NewsletterPopup from '@/components/NewsletterPopup';
import AuthModal from '@/components/AuthModal';
import AnimatedBackground from '@/components/AnimatedBackground';
import TrendingTools from '@/components/TrendingTools';
import TopCreators from '@/components/TopCreators';

import NewsFeedPage from '@/pages/NewsFeed';
import SEOHead from '@/components/SEOHead';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [autoOpenChat, setAutoOpenChat] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useTranslation('common');

  // Scroll animations
  const heroAnimation = useScrollAnimation(0.1);
  const featuresAnimation = useScrollAnimation(0.1);
  const statsAnimation = useScrollAnimation(0.1);
  const ctaAnimation = useScrollAnimation(0.1);

  // Redirect authenticated users to newsfeed and manage logged-in class appropriately
  useEffect(() => {
    if (user && window.location.pathname === '/') {
      navigate('/newsfeed', { replace: true });
      return;
    }
    
    // Only remove logged-in class if user is actually not logged in
    if (!user && !loading) {
      document.body.classList.remove('logged-in');
    }
  }, [user, navigate, loading]);

  // Newsletter popup logic - show for unsubscribed users every time
  useEffect(() => {
    // Only show for non-authenticated users
    if (!user) {
      const timer = setTimeout(() => {
        setShowNewsletterPopup(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleCloseNewsletterPopup = () => {
    setShowNewsletterPopup(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Set the search term to be displayed in the chat
      setChatMessage(`I'm looking for: ${searchTerm.trim()}`);
      setAutoOpenChat(true);
      // Small delay to ensure state is set before navigation
      setTimeout(() => {
        navigate(`/tools?search=${encodeURIComponent(searchTerm.trim())}`);
      }, 100);
      setSearchTerm('');
    }
  };

  // If user is authenticated, show newsfeed content instead
  if (user) {
    return <NewsFeedPage />;
  }

  return (
    <div className="min-h-screen relative">
      <SEOHead 
        title="AI Feed - Discover, Compare & Share AI Tools | The Ultimate AI Platform"
        description="The ultimate AI tools platform. Discover 1000+ AI tools, compare features, read reviews, and connect with AI enthusiasts. Your go-to hub for everything AI."
        keywords="AI tools, artificial intelligence, machine learning, AI directory, AI comparison, AI community, ChatGPT, AI assistants, AI image generators"
        url="https://aifeed.app/"
      />
      <AnimatedBackground />
      {/* Hero Section */}
      <section ref={heroAnimation.ref} className={`py-20 px-6 transition-all duration-1000 ${
        heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="container max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient slogan">
              {t('index.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl font-bold text-gradient max-w-3xl mx-auto mb-8 leading-relaxed slogan-subtitle">
              {t('index.hero.subtitle')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              variant="gradient"
              className="text-lg px-8"
              onClick={() => setShowNewsletterPopup(true)}
            >
              {t('index.hero.ctaNewsletter')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="gradient"
              className="text-lg px-8"
              onClick={() => setShowAuthModal(true)}
            >
              {t('index.hero.ctaGetStarted')} <Star className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="relative bg-white dark:bg-[#091527] rounded-2xl shadow-lg p-2 border border-gray-200 dark:border-gray-700">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('index.hero.searchPlaceholder')}
                className="w-full pl-14 pr-4 py-4 text-lg border-0 rounded-xl focus:ring-0 focus:outline-none bg-white dark:bg-[#091527] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
          </form>
          
          
          {/* Trending Tools Section */}
          <div className="mt-16">
            <TrendingTools />
          </div>

          {/* Top Creators Section - Centered */}
          <div className="mt-12 text-center">
            <TopCreators />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresAnimation.ref} className={`py-20 px-6 bg-white/30 dark:bg-[#091527]/30 backdrop-blur-sm transition-all duration-1000 ${
        featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('index.features.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('index.features.subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className={`group hover:shadow-lg transition-all duration-500 bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700 ${
              featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`} style={{ transitionDelay: '100ms' }}>
              <CardContent className="p-8 text-center">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('index.features.tools.title')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('index.features.tools.desc')}
                </p>
                <Link to="/tools" className="text-primary hover:underline font-medium">
                  {t('index.features.tools.cta')} →
                </Link>
              </CardContent>
            </Card>
            
            <Card className={`group hover:shadow-lg transition-all duration-500 bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700 ${
              featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`} style={{ transitionDelay: '200ms' }}>
              <CardContent className="p-8 text-center">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('index.features.categories.title')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('index.features.categories.desc')}
                </p>
                <Link to="/categories" className="text-primary hover:underline font-medium">
                  {t('index.features.categories.cta')} →
                </Link>
              </CardContent>
            </Card>
            
            <Card className={`group hover:shadow-lg transition-all duration-500 bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700 ${
              featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`} style={{ transitionDelay: '300ms' }}>
              <CardContent className="p-8 text-center">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('index.features.jobs.title')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('index.features.jobs.desc')}
                </p>
                <Link to="/talent" className="text-primary hover:underline font-medium">
                  {t('index.features.jobs.cta')} →
                </Link>
              </CardContent>
            </Card>
            
            <Card className={`group hover:shadow-lg transition-all duration-500 bg-white dark:bg-[#091527] border-gray-200 dark:border-gray-700 ${
              featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`} style={{ transitionDelay: '400ms' }}>
              <CardContent className="p-8 text-center">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('index.features.blog.title')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('index.features.blog.desc')}
                </p>
                <Link to="/blog" className="text-primary hover:underline font-medium">
                  {t('index.features.blog.cta')} →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsAnimation.ref} className={`py-20 px-6 transition-all duration-1000 ${
        statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className={`transition-all duration-500 ${
              statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`} style={{ transitionDelay: '100ms' }}>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">{t('index.stats.tools')}</div>
            </div>
            <div className={`transition-all duration-500 ${
              statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`} style={{ transitionDelay: '200ms' }}>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">{t('index.stats.creators')}</div>
            </div>
            <div className={`transition-all duration-500 ${
              statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`} style={{ transitionDelay: '300ms' }}>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">{t('index.stats.projects')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaAnimation.ref} className={`py-20 px-6 bg-white dark:bg-[#091527] transition-all duration-1000 ${
        ctaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('index.cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('index.cta.subtitle')}
          </p>
          <Button size="lg" className="text-lg px-8" onClick={() => setShowAuthModal(true)}>
            {t('index.cta.button')} <Star className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Newsletter Popup */}
      {showNewsletterPopup && (
        <NewsletterPopup onClose={handleCloseNewsletterPopup} />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          initialMode="signin"
        />
      )}

    </div>
  );
};

export default Index;