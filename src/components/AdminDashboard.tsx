import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Wrench, 
  FileText, 
  Settings,
  Shield,
  Bell,
  Search, 
  Plus, 
  Edit,
  Briefcase,
  MessageSquare,
  Flag,
  UserX,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  PieChart,
  List,
  Tag,
  Globe,
  Map,
  Layers,
  Database,
  X,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CreateUserModal from '../components/CreateUserModal';
import PricingManagement from '../components/PricingManagement';
import CategoryManagement from '../components/CategoryManagement';
import AdminSidebar from '../components/AdminSidebar';
import NewsletterManagement from '../components/NewsletterManagement';
import ContentManagement from '../components/ContentManagement';
import { supabase } from '../lib/supabase';
import useI18nGuard from '../hooks/useI18nGuard';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  useI18nGuard();
  
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [pendingEditRequests, setPendingEditRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!userError) {
        setUsers(userData || []);
      }
      
      // Fetch tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!toolsError) {
        setTools(toolsData || []);
      }
      
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!articlesError) {
        setArticles(articlesData || []);
      }
      
      // Check for pending edit requests with error handling
      try {
        const { count, error } = await supabase
          .from('tool_edit_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (error) {
          console.warn('Tool edit requests table not found or not accessible:', error.message);
          setPendingEditRequests(0);
        } else {
          setPendingEditRequests(count || 0);
        }
      } catch (error) {
        console.warn('Error fetching edit requests count:', error);
        setPendingEditRequests(0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = (newUser: any) => {
    setUsers([newUser, ...users]);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('auto.totalUsers')}</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 ml-1">0%</span>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-surface rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('auto.totalTools')}</p>
                    <p className="text-2xl font-bold">{tools.length}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 ml-1">0%</span>
                    </div>
                  </div>
                  <Settings className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <div className="bg-surface rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('auto.totalArticles')}</p>
                    <p className="text-2xl font-bold">{articles.length}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 ml-1">0%</span>
                    </div>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-surface rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('auto.editRequests')}</p>
                    <p className="text-2xl font-bold">{pendingEditRequests}</p>
                    {pendingEditRequests > 0 && (
                      <button
                        onClick={() => setActiveSection('tool-requests')}
                        className="mt-2 text-sm text-primary hover:text-primary/80"
                      >
                        Review requests →
                      </button>
                    )}
                  </div>
                  <Edit className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">{t('auto.quickActions')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="p-4 bg-surface rounded-xl border hover:shadow-md transition-shadow flex items-center space-x-3"
                >
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium">{t('admin.createUser')}</span>
                </button>
                
                <button
                  onClick={() => setActiveSection('tool-requests')}
                  className="p-4 bg-surface rounded-xl border hover:shadow-md transition-shadow flex items-center space-x-3"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">{t('admin.toolEditRequests')}</span>
                  {pendingEditRequests > 0 && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs">
                      {pendingEditRequests}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveSection('newsletters')}
                  className="p-4 bg-surface rounded-xl border hover:shadow-md transition-shadow flex items-center space-x-3"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Newsletter</span>
                </button>
                
                <button
                  onClick={() => setActiveSection('categories')}
                  className="p-4 bg-surface rounded-xl border hover:shadow-md transition-shadow flex items-center space-x-3"
                >
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Flag className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <span className="font-medium">Categories</span>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">User Management</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create User</span>
              </button>
            </div>
            <ContentManagement />
          </div>
        );

      case 'categories':
        return <CategoryManagement />;

      case 'newsletters':
        return <NewsletterManagement />;

      case 'pricing':
        return <PricingManagement />;

      case 'tool-requests':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Tool Edit Requests</h2>
            <p className="text-muted-foreground">Manage pending tool edit requests from users.</p>
            {/* Tool requests content would go here */}
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <p className="text-muted-foreground">Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        
        <div className="flex-1 bg-background">
          <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-xl text-muted-foreground">
                Manage users, content, and platform settings
              </p>
            </div>

            {/* Dynamic Content */}
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onUserCreated={handleUserCreated}
      />
    </>
  );
};

export default AdminDashboard;