import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const { t } = useTranslation();
  const { userId, handle } = useParams(); // Support both userId and handle params
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'content'>('overview');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileId = userId || handle; // Use either userId or handle
        console.log('Fetching user profile for ID/handle:', profileId);
        
        if (!profileId) {
          console.error('No profile ID provided');
          setUserProfile(null);
          setLoading(false);
          return;
        }

        // Direct query to user_profiles table
        let query = supabase
          .from('user_profiles')
          .select('*');

        // Check if profileId is a UUID (userId) or handle
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId);
        
        if (isUUID) {
          query = query.eq('id', profileId);
        } else {
          // If it's not a UUID, treat it as a handle or email
          query = query.or(`id.eq.${profileId}`);
        }

        const { data: profile, error } = await query.maybeSingle();

        console.log('Profile query result:', { profile, error });

        if (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        if (profile) {
          // Convert the real profile data to our UserProfile interface
          const userProfile: UserProfile = {
            id: profile.id,
            fullName: profile.full_name || 'Anonymous User',
            email: 'Email not available', // Email not stored in user_profiles
            jobTitle: profile.job_title || '',
            company: profile.company || '',
            location: profile.location || 'Location not specified',
            bio: profile.bio || '',
            profilePhoto: profile.profile_photo || undefined,
            interests: profile.interests || [],
            age: profile.age || 0,
            gender: profile.gender || 'Not specified',
            country: profile.country || 'Not specified',
            city: profile.city || 'Not specified',
            birthDate: profile.birth_date || '',
            joinedAt: profile.created_at || new Date().toISOString(),
            lastActive: profile.updated_at || new Date().toISOString(),
            accountType: (profile.account_type === 'employer' ? 'employer' : 'user') as 'user' | 'employer',
            status: 'active', // Default since we don't have this field
            verified: profile.verified || false,
            contactVisible: profile.contact_visible || false,
            phone: profile.phone || undefined,
            website: profile.website || undefined,
            linkedin: profile.linkedin || undefined,
            github: profile.github || undefined,
            stats: {
              toolsSubmitted: profile.tools_submitted || 0,
              articlesWritten: profile.articles_written || 0,
              postsCreated: 0, // Would need to query posts table
              likesReceived: 0, // Would need to calculate
              followers: 0, // Would need to implement follower system
              following: 0  // Would need to implement follower system
            },
            recentActivity: [] // Would need to implement activity tracking
          };
          
          console.log('Setting user profile:', userProfile);
          setUserProfile(userProfile);
        } else {
          console.log('No profile found for ID:', profileId);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId || handle) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [userId, handle, currentUser]);

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
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('userView.notFound.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('userView.notFound.description')}
            </p>
            <button
              onClick={() => navigate('/community')}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              {t('userView.notFound.backToCommunity')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t('userView.back')}</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t('userView.title')}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t('userView.viewingProfile', { name: userProfile.fullName })}
              </p>
            </div>
            
            {/* Only show admin actions for admin users */}
            {currentUser && isAdmin && (
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
                  <option value="active">{t('userView.status.active')}</option>
                  <option value="inactive">{t('userView.status.inactive')}</option>
                  <option value="banned">{t('userView.status.banned')}</option>
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
                  <span>{userProfile.verified ? t('userView.verification.verified') : t('userView.verification.unverified')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mb-8">
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {userProfile.fullName}
                    </h2>
                    <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 mb-3">
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
                      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">{userProfile.bio}</p>
                    )}
                    
                    {/* Interests */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {userProfile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
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
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                      {userProfile.github && (
                        <a
                          href={userProfile.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <Github className="h-5 w-5" />
                        </a>
                      )}
                      {userProfile.linkedin && (
                        <a
                          href={userProfile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Message Button */}
                  {currentUser && currentUser.id !== userProfile.id && (
                    <Button
                      onClick={async () => {
                        try {
                          if (typeof window !== 'undefined' && (window as any).chatDock?.open) {
                            const success = await (window as any).chatDock.open(userProfile.id);
                            if (success) {
                              toast.success(`Opening chat with ${userProfile.fullName}`);
                            } else {
                              toast.error('Failed to open chat');
                            }
                          } else {
                            toast.error('Chat is not ready yet');
                          }
                        } catch (error) {
                          console.error('Error opening chat:', error);
                          toast.error('Failed to open chat');
                        }
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  )}
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
              { key: 'overview', label: t('userView.tabs.overview') },
              { key: 'activity', label: t('userView.tabs.activity') },
              { key: 'content', label: t('userView.tabs.content') }
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('userView.sections.personalInfo')}</h3>
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
                    {userProfile.birthDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Born {new Date(userProfile.birthDate).toLocaleDateString()} {userProfile.age ? `(Age: ${userProfile.age})` : ''}
                        </span>
                      </div>
                    )}
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