import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAuth } from '../contexts/AuthContext';

// Pages
import Home from '../pages/Home';
import Tools from '../pages/Tools';
import ToolDetail from '../pages/ToolDetail';
import Categories from '../pages/Categories';
import Community from '../pages/Community';
import Newsfeed from '../pages/NewsFeed';
import Blog from '../pages/Blog';
import About from '../pages/About';
import SubmitTool from '../pages/SubmitTool';
import SubmitArticle from '../pages/SubmitArticle';
import AdminDashboard from '../pages/AdminDashboard';
import AdminToolRequests from '../pages/AdminToolRequests';
import EmployerDashboard from '../pages/EmployerDashboard';
import ProjectsPage from '../pages/ProjectsPage';
import Profile from '../pages/Profile';
import Messages from '../pages/Messages';
import Notifications from '../pages/Notifications';
import Settings from '../pages/Settings';
import UserView from '../pages/UserView';
import Analytics from '../pages/Analytics';
import ProtectedRoute from './ProtectedRoute';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  
  // Determine if we're in the employer dashboard
  const isEmployerDashboard = pathname.startsWith('/employer');

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.pathname}
        classNames="page-transition"
        timeout={300}
      >
        <div className="animate-fade-in">
          <Routes location={location}>
            {/* Redirect to Newsfeed if user is logged in and trying to access home */}
            <Route path="/" element={user ? <Navigate to="/newsfeed" replace /> : <Home />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/:id" element={<ToolDetail />} />
            <Route path="/tools/create" element={
              <ProtectedRoute>
                <SubmitTool />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={<Categories />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/articles/create" element={
              <ProtectedRoute>
                <SubmitArticle />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<About />} />
            
            {/* Protected Routes - Require Authentication */}
            <Route path="/newsfeed" element={
              <ProtectedRoute>
                <Newsfeed />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            <Route path="/posts/create" element={
              <ProtectedRoute>
                <Newsfeed />
              </ProtectedRoute>
            } />
            <Route path="/groups/create" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            
            {/* Employer Dashboard - Protected Route for Employers */}
            <Route path="/employer" element={
              <ProtectedRoute>
                <EmployerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/employer/talents" element={
              <ProtectedRoute>
                <EmployerDashboard section="talents" />
              </ProtectedRoute>
            } />
            <Route path="/employer/jobs" element={
              <ProtectedRoute>
                <EmployerDashboard section="jobs" />
              </ProtectedRoute>
            } />
            <Route path="/employer/projects" element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            } />
            <Route path="/employer/analytics" element={
              <ProtectedRoute>
                <EmployerDashboard section="analytics" />
              </ProtectedRoute>
            } />
            <Route path="/employer/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/employer/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/employer/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/employer/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            
            {/* Admin Only Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/user/:userId" element={
              <ProtectedRoute requireAdmin={true}>
                <UserView />
              </ProtectedRoute>
            } />
            <Route path="/admin/tool-requests" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminToolRequests />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
};

export default AnimatedRoutes;