import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap, Users, Target, Star, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import NewsletterPopup from '@/components/NewsletterPopup';
import AuthModal from '@/components/AuthModal';
import AnimatedBackground from '@/components/AnimatedBackground';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Newsletter popup logic - show for unsubscribed users every time
  useEffect(() => {
    // Always show newsletter popup for unsubscribed users after 3 seconds
    if (!user || (user && !user.user_metadata?.newsletter_subscription)) {
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
      navigate(`/tools?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient font-playfair">
              Welcome to AI Nexus
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
              The unified SaaS platform connecting AI-skilled creators
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link to="/tools">
                Explore AI Tools <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for AI tools, categories, or features..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need in one platform</h2>
            <p className="text-xl text-muted-foreground">Discover, connect, and collaborate in the AI ecosystem</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">AI Tools Directory</h3>
                <p className="text-muted-foreground mb-6">
                  Discover curated AI tools and resources to supercharge your projects
                </p>
                <Link to="/tools" className="text-primary hover:underline font-medium">
                  Browse Tools →
                </Link>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Creators Marketplace</h3>
                <p className="text-muted-foreground mb-6">
                  Find skilled AI creators and professionals for your next project
                </p>
                <Link to="/talent" className="text-primary hover:underline font-medium">
                  Find Creators →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">AI Tools Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Projects Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to join the AI revolution?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your journey with AI Nexus today and connect with the future of technology.
          </p>
          <Button size="lg" className="text-lg px-8" onClick={() => setShowAuthModal(true)}>
            Get Started Free <Star className="ml-2 h-5 w-5" />
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