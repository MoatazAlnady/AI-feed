import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CreateUserModal from '../components/CreateUserModal';
import { supabase } from '../lib/supabase';

const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tools' | 'content' | 'settings' | 'configuration'>('overview');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [pendingEditRequests, setPendingEditRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Configuration state
  const [configType, setConfigType] = useState<'countries' | 'skills' | 'tags' | 'categories'>('countries');
  const [configItems, setConfigItems] = useState<string[]>([]);
  const [newConfigItem, setNewConfigItem] = useState('');

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

  const handleAddConfigItem = () => {
    if (newConfigItem.trim()) {
      setConfigItems([...configItems, newConfigItem.trim()]);
      setNewConfigItem('');
    }
  };

  const handleRemoveConfigItem = (index: number) => {
    setConfigItems(configItems.filter((_, i) => i !== index));
  };

  const loadConfigItems = (type: 'countries' | 'skills' | 'tags' | 'categories') => {
    setConfigType(type);
    
    // Mock data for demonstration
    if (type === 'countries') {
      setConfigItems(['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'India', 'Brazil', 'Egypt', 'Saudi Arabia', 'UAE']);
    } else if (type === 'skills') {
      setConfigItems(['Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Data Science', 'Python', 'TensorFlow', 'PyTorch', 'JavaScript', 'React', 'Node.js']);
    } else if (type === 'tags') {
      setConfigItems(['AI', 'Machine Learning', 'Chatbot', 'Image Generation', 'Video AI', 'Text-to-Speech', 'Speech-to-Text', 'Code Assistant', 'Productivity', 'Writing']);
    } else if (type === 'categories') {
      setConfigItems(['Conversational AI', 'Image Generation', 'Video AI', 'Code Assistant', 'Data Analysis', 'Audio AI', 'Writing & Content', 'Productivity']);
    }
  };

  const renderOverview = () => (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                <span className="text-sm text-green-600 dark:text-green-400 ml-1">0%</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tools</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tools.length}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                <span className="text-sm text-green-600 dark:text-green-400 ml-1">0%</span>
              </div>
            </div>
            <Wrench className="h-8 w-8 text-purple-500 dark:text-purple-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{articles.length}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                <span className="text-sm text-green-600 dark:text-green-400 ml-1">0%</span>
              </div>
            </div>
            <FileText className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Edit Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingEditRequests}</p>
              {pendingEditRequests > 0 && (
                <button
                  onClick={() => navigate('/admin/tool-requests')}
                  className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Review requests →
                </button>
              )}
            </div>
            <Edit className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center">
            <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
            User growth data will appear here as users join the platform
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <PieChart className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
            Content distribution data will appear here as content is added
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowCreateUser(true)}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex items-center space-x-3"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Create User</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/tool-requests')}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex items-center space-x-3"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Tool Edit Requests</span>
            {pendingEditRequests > 0 && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs">
                {pendingEditRequests}
              </span>
            )}
          </button>
          
          <button
            onClick={() => {}}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex items-center space-x-3"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Review Articles</span>
          </button>
          
          <button
            onClick={() => {}}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex items-center space-x-3"
          >
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Flag className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Reported Content</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <button
          onClick={() => setShowCreateUser(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create User</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {users.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{user.full_name?.[0] || user.id[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.full_name || 'Unnamed User'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.account_type === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        user.account_type === 'staff' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        user.account_type === 'employer' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {user.account_type || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        user.status === 'inactive' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/user/${user.id}`)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {}}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Ban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Users Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm ? 'No users match your search criteria.' : 'There are no users in the system yet.'}
          </p>
          <button
            onClick={() => setShowCreateUser(true)}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Create First User
          </button>
        </div>
      )}
    </div>
  );

  const renderTools = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tool Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/admin/tool-requests')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Requests</span>
            {pendingEditRequests > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                {pendingEditRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/tools/create')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Tool</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search tools by name, category, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {tools.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tool</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold">{tool.name?.[0] || 'T'}</span>
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">{tool.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tool.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tool.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        tool.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {tool.status || 'published'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tool.user_id || 'Admin'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tool.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/tools/${tool.id}`)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/tools/${tool.id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {}}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
          <Wrench className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Tools Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm ? 'No tools match your search criteria.' : 'There are no tools in the system yet.'}
          </p>
          <button
            onClick={() => navigate('/tools/create')}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Add First Tool
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h2>
        <button
          onClick={() => navigate('/articles/create')}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Article</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search articles by title, author, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {articles.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Article</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{article.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {article.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        article.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        article.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {article.status || 'published'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Not published'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {article.views || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {}}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {}}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {}}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Articles Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm ? 'No articles match your search criteria.' : 'There are no articles in the system yet.'}
          </p>
          <button
            onClick={() => navigate('/articles/create')}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Create First Article
          </button>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Site Configuration</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value="AI Nexus"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Description
            </label>
            <textarea
              rows={3}
              value="Your ultimate destination for discovering, exploring, and staying updated with the latest AI tools and technologies."
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value="contact@ainexus.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Maintenance</h3>
        
        <div className="space-y-4">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            <span>Run System Health Check</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            <span>Clear Cache</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            <span>Backup Database</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Platform Configuration</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => loadConfigItems('countries')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              configType === 'countries' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Globe className="h-5 w-5" />
            <span>Countries</span>
          </button>
          <button
            onClick={() => loadConfigItems('skills')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              configType === 'skills' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span>Skills</span>
          </button>
          <button
            onClick={() => loadConfigItems('tags')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              configType === 'tags' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Tag className="h-5 w-5" />
            <span>Tags</span>
          </button>
          <button
            onClick={() => loadConfigItems('categories')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              configType === 'categories' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Layers className="h-5 w-5" />
            <span>Categories</span>
          </button>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          {configType === 'countries' && <Globe className="h-5 w-5 mr-2" />}
          {configType === 'skills' && <Briefcase className="h-5 w-5 mr-2" />}
          {configType === 'tags' && <Tag className="h-5 w-5 mr-2" />}
          {configType === 'categories' && <Layers className="h-5 w-5 mr-2" />}
          Manage {configType.charAt(0).toUpperCase() + configType.slice(1)}
        </h3>
        
        <div className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newConfigItem}
              onChange={(e) => setNewConfigItem(e.target.value)}
              placeholder={`Add new ${configType.slice(0, -1)}...`}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleAddConfigItem}
              disabled={!newConfigItem.trim()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {configItems.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {configItems.map((item, index) => (
                  <li key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="text-gray-900 dark:text-white">{item}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {}}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveConfigItem(index)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No items found. Add your first {configType.slice(0, -1)}.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Import from CSV
          </button>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Database Management
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Import Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Import data from CSV files to populate the database with countries, skills, tags, or categories.
            </p>
            <div className="flex space-x-2">
              <select className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="countries">Countries</option>
                <option value="skills">Skills</option>
                <option value="tags">Tags</option>
                <option value="categories">Categories</option>
              </select>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Import
              </button>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Export data to CSV files for backup or analysis purposes.
            </p>
            <div className="flex space-x-2">
              <select className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="all">All Data</option>
                <option value="users">Users</option>
                <option value="tools">Tools</option>
                <option value="articles">Articles</option>
                <option value="configuration">Configuration</option>
              </select>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="py-8 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-8 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Admin Dashboard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Manage users, content, and platform settings
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-8">
            <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Shield className="h-5 w-5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Users</span>
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'tools'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Wrench className="h-5 w-5" />
                <span>Tools</span>
                {pendingEditRequests > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs">
                    {pendingEditRequests}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'content'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Content</span>
              </button>
              <button
                onClick={() => setActiveTab('configuration')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'configuration'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <List className="h-5 w-5" />
                <span>Configuration</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'tools' && renderTools()}
          {activeTab === 'content' && renderContent()}
          {activeTab === 'configuration' && renderConfiguration()}
          {activeTab === 'settings' && renderSettings()}
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