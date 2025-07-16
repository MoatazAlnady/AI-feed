import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AnimatedRoutes from './components/AnimatedRoutes';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Tools from './pages/Tools';
import ToolDetail from './pages/ToolDetail';
import Categories from './pages/Categories';
import Community from './pages/Community';
import Newsfeed from './pages/NewsFeed';
import Blog from './pages/Blog';
import About from './pages/About';
import SubmitTool from './pages/SubmitTool';
import SubmitArticle from './pages/SubmitArticle';
import AdminDashboard from './pages/AdminDashboard';
import AdminToolRequests from './pages/AdminToolRequests';
import EmployerDashboard from './pages/EmployerDashboard';
import ProjectsPage from './pages/ProjectsPage';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import UserView from './pages/UserView';
import Analytics from './pages/Analytics';
import ProtectedRoute from './components/ProtectedRoute';
import AIAssistant from './components/AIAssistant';
import { ThemeProvider } from './contexts/ThemeContext';
import NewsletterPopup from './components/NewsletterPopup';
import { ChatDockProvider } from './contexts/ChatDockContext';
import ChatDock from './components/ChatDock';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { pathname } = location;
  const { user } = useAuth();
  
  // Determine if we're in the employer dashboard
  const isEmployerDashboard = pathname.startsWith('/employer');
  const isCreatorDashboard = !isEmployerDashboard && pathname !== '/admin' && !pathname.startsWith('/admin/');

  // Newsletter popup state
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);

  useEffect(() => {
    // Only show newsletter popup for non-authenticated users or users who haven't subscribed
    if (!user || (user && !user.user_metadata?.newsletter_subscription)) {
      // Check if we've shown the popup in this session
      const hasShownInSession = sessionStorage.getItem('newsletter_shown');
      
      if (!hasShownInSession) {
        const timer = setTimeout(() => {
          setShowNewsletterPopup(true);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleCloseNewsletterPopup = () => {
    setShowNewsletterPopup(false);
    // Mark that we've shown the popup in this session
    sessionStorage.setItem('newsletter_shown', 'true');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main>
        <AnimatedRoutes />
      </main>
      <Footer />
      
      {/* AI Assistant - show different versions based on dashboard */}
      {isCreatorDashboard && <AIAssistant mode="creator" />}
      {isEmployerDashboard && <AIAssistant mode="employer" />}

      {/* Chat Dock - available on all pages for authenticated users */}
      <ChatDock />

      {/* Newsletter Popup for non-subscribed users */}
      {showNewsletterPopup && (
        <NewsletterPopup onClose={handleCloseNewsletterPopup} />
      )}
    </div>
  );
};

const AppWithRouter = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ChatDockProvider>
            <AppContent />
          </ChatDockProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default AppWithRouter;