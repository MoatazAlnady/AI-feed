import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Star,
  MessageCircle,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Settings,
  ExternalLink,
  Github,
  Linkedin,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  company?: string;
  location: string;
  bio?: string;
  profilePhoto?: string;
  interests: string[];
  age: number;
  gender: string;
  country: string;
  city: string;
  birthDate: string;
  joinedAt: string;
  lastActive: string;
  accountType: 'user' | 'employer';
  status: 'active' | 'inactive' | 'banned';
  verified: boolean;
  contactVisible: boolean;
  phone?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  stats: {
    toolsSubmitted: number;
    articlesWritten: number;
    postsCreated: number;
    likesReceived: number;
    followers: number;
    following: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

const UserView: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'content'>('overview');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // In real app, fetch from API
        // const response = await fetch(`/api/admin/users/${userId}`);
        // const data = await response.json();
        // setUserProfile(data);
        
        // Mock user data for demonstration
        const mockUser: UserProfile = {
          id: userId || '1',
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          jobTitle: 'AI Engineer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          bio: 'Passionate AI engineer with 5+ years of experience in machine learning and deep learning. Love building innovative solutions that make a difference.',
          profilePhoto: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
          interests: ['Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'AI Research'],
          age: 28,
          gender: 'Male',
          country: 'United States',
          city: 'San Francisco',
          birthDate: '1996-03-15',
          joinedAt: '2024-01-15T00:00:00Z',
          lastActive: '2025-01-15T10:30:00Z',
          accountType: 'user',
          status: 'active',
          verified: true,
          contactVisible: true,
          phone: '+1 (555) 123-4567',
          website: 'https://johndoe.dev',
          linkedin: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe',
          stats: {
            toolsSubmitted: 3,
            articlesWritten: 7,
            postsCreated: 24,
            likesReceived: 156,
            followers: 89,
            following: 67
          },
          recentActivity: [
            {
              type: 'post_created',
              description: 'Created a post about "Latest trends in AI"',
              timestamp: '2 hours ago'
            },
            {
              type: 'tool_submitted',
              description: 'Submitted AI tool "Smart Code Assistant"',
              timestamp: '1 day ago'
            },
            {
              type: 'article_published',
              description: 'Published article "Getting Started with PyTorch"',
              timestamp: '3 days ago'
            },
            {
              type: 'comment_added',
              description: 'Commented on "Future of AI in Healthcare"',
              timestamp: '5 days ago'
            }
          ]
        };
        
        setUserProfile(mockUser);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'banned') => {
    if (!userProfile) return;
    
    try {
      // In real app, make API call
      // await fetch(`/api/admin/users/${userId}/status`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ status: newStatus })
      // });
      
      setUserProfile(prev => prev ? { ...prev, status: newStatus } : null);
      console.log(`Updated user ${userId} status to:`, newStatus);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleVerificationToggle = async () => {
    if (!userProfile) return;
    
    try {
      // In real app, make API call
      // await fetch(`/api/admin/users/${userId}/verify`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ verified: !userProfile.verified })
      // });
      
      setUserProfile(prev => prev ? { ...prev, verified: !prev.verified } : null);
      console.log(`Toggled verification for user ${userId}`);
    } catch (error) {
      console.error('Error toggling verification:', error);
    }
  };

  if (loading) {
    return (
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              User Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Admin Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                User Profile
              </h1>
              <p className="text-xl text-gray-600">
                Viewing profile for {userProfile.fullName}
              </p>
            </div>
            
            {/* Admin Actions */}
            <div className="flex space-x-3">
              <select
                value={userProfile.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className={`px-4 py-2 border rounded-lg font-medium ${
                  userProfile.status === 'active' ? 'border-green-300 text-green-700 bg-green-50' :
                  userProfile.status === 'inactive' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                  'border-red-300 text-red-700 bg-red-50'
                }`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>
              
              <button
                onClick={handleVerificationToggle}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  userProfile.verified 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>{userProfile.verified ? 'Verified' : 'Unverified'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
          <div className="px-8 pb-8">
            <div className="flex items-start space-x-6 -mt-16">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                  {userProfile.profilePhoto ? (
                    <img
                      src={userProfile.profilePhoto}
                      alt={userProfile.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                {userProfile.verified && (
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 pt-16">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {userProfile.fullName}
                    </h2>
                    <div className="flex items-center space-x-4 text-gray-600 mb-3">
                      {userProfile.jobTitle && userProfile.company && (
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{userProfile.jobTitle} at {userProfile.company}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{userProfile.location}</span>
                      </div>
                    </div>
                    {userProfile.bio && (
                      <p className="text-gray-600 mb-4 max-w-2xl">{userProfile.bio}</p>
                    )}
                    
                    {/* Interests */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {userProfile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>

                    {/* Social Links */}
                    <div className="flex space-x-3">
                      {userProfile.website && (
                        <a
                          href={userProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                      {userProfile.github && (
                        <a
                          href={userProfile.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Github className="h-5 w-5" />
                        </a>
                      )}
                      {userProfile.linkedin && (
                        <a
                          href={userProfile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          {Object.entries(userProfile.stats).map(([key, value]) => (
            <div key={key} className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
              <div className="text-sm text-gray-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'activity', label: 'Recent Activity' },
              { key: 'content', label: 'Content' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === key
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{userProfile.email}</span>
                    </div>
                    {userProfile.contactVisible && userProfile.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{userProfile.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Born {new Date(userProfile.birthDate).toLocaleDateString()} (Age: {userProfile.age})
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{userProfile.gender}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{userProfile.city}, {userProfile.country}</span>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Account Type</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userProfile.accountType === 'employer' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {userProfile.accountType.charAt(0).toUpperCase() + userProfile.accountType.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userProfile.status === 'active' ? 'bg-green-100 text-green-700' :
                        userProfile.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {userProfile.status.charAt(0).toUpperCase() + userProfile.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Verified</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userProfile.verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {userProfile.verified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Joined</span>
                      <span className="text-gray-900">
                        {new Date(userProfile.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Active</span>
                      <span className="text-gray-900">
                        {new Date(userProfile.lastActive).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {userProfile.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {userProfile.stats.toolsSubmitted}
                    </div>
                    <div className="text-sm text-gray-600">Tools Submitted</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {userProfile.stats.articlesWritten}
                    </div>
                    <div className="text-sm text-gray-600">Articles Written</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {userProfile.stats.postsCreated}
                    </div>
                    <div className="text-sm text-gray-600">Posts Created</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserView;