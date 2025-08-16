import React, { useState, useEffect } from 'react';
import ChatDock from '@/components/ChatDock';
import { 
  User, Mail, Calendar, Heart, Bookmark, MessageSquare, Upload, 
  Briefcase, MapPin, Edit, Target, TrendingUp, ExternalLink,
  Plus, Code, FileText, Users, Star, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import PromoteContentModal from '../components/PromoteContentModal';
import NetworkTab from '../components/NetworkTab';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import { useUserStats } from '../hooks/useUserStats';
import { Link } from 'react-router-dom';
import PostsTab from '../components/PostsTab';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'content' | 'saved' | 'network'>('overview');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const { stats } = useUserStats();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserProfile(data);
        } else {
          // Fallback to user metadata if no profile exists
          setUserProfile(user.user_metadata || {});
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(user.user_metadata || {});
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // User profile data with fallback
  const profileData = {
    email: user?.email || '',
    joinedAt: user?.created_at || new Date().toISOString(),
    fullName: userProfile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AI Enthusiast',
    jobTitle: userProfile.job_title || user?.user_metadata?.job_title,
    company: userProfile.company || user?.user_metadata?.company,
    location: userProfile.location || user?.user_metadata?.location,
    bio: userProfile.bio || user?.user_metadata?.bio,
    interests: userProfile.interests || user?.user_metadata?.interests || [],
    website: userProfile.website || user?.user_metadata?.website,
    github: userProfile.github || user?.user_metadata?.github,
    profilePhoto: userProfile.profile_photo || user?.user_metadata?.profile_photo,
    coverPhoto: userProfile.cover_photo || user?.user_metadata?.cover_photo,
  };

  const userStats = [
    { label: 'Tools Submitted', value: stats.toolsSubmitted.toString(), icon: Upload },
    { label: 'Articles Written', value: stats.articlesWritten.toString(), icon: MessageSquare },
    { label: 'Likes Received', value: stats.totalEngagement.toString(), icon: Heart },
    { label: 'Tools Bookmarked', value: '0', icon: Bookmark },
  ];

  const recentActivity: any[] = [];
  const userContent: any[] = [];

  const handlePromoteContent = (content: any) => {
    setSelectedContent(content);
    setShowPromoteModal(true);
  };

  return (
    <>
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mb-8">
            {/* Cover Photo */}
            <ProfilePhotoUploader
              type="cover"
              currentPhoto={profileData.coverPhoto}
            />
            
            {/* Profile Info */}
            <div className="px-8 pb-8">
              <div className="flex items-start space-x-6 -mt-16">
                {/* Profile Photo */}
                <ProfilePhotoUploader
                  type="profile"
                  currentPhoto={profileData.profilePhoto}
                  className="relative -mt-16"
                />

                {/* User Details */}
                <div className="flex-1 pt-16">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {profileData.fullName}
                      </h1>
                      <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{profileData.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(profileData.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Job Title & Company - only show if available */}
                      {(profileData.jobTitle || profileData.company) && (
                        <div className="flex items-center space-x-1 mb-3">
                          <Briefcase className="h-4 w-4" />
                          <span>
                            {profileData.jobTitle}
                            {profileData.jobTitle && profileData.company && ' at '}
                            {profileData.company}
                          </span>
                        </div>
                      )}
                      
                      {/* Location - only show if available */}
                      {profileData.location && (
                        <div className="flex items-center space-x-1 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>{profileData.location}</span>
                        </div>
                      )}
                      
                      {/* Bio - only show if available */}
                      {profileData.bio && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">{profileData.bio}</p>
                      )}
                      
                      {/* Interests - only show if available */}
                      {profileData.interests && profileData.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profileData.interests.map((interest: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Social Links - only show if available */}
                      <div className="flex space-x-3">
                        {profileData.website && (
                          <a
                            href={profileData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                        {profileData.github && (
                          <a
                            href={profileData.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <Code className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {userStats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-center">
                <div className="inline-flex p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl mb-4">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-8">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'posts', label: 'Posts' },
                { key: 'content', label: 'My Content' },
                { key: 'saved', label: 'Saved Items' },
                { key: 'network', label: 'Network' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === key
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{activity.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{activity.date}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            activity.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No recent activity. Start creating content or interacting with the community!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'posts' && (
                <PostsTab userId={user?.id} />
              )}

              {activeTab === 'content' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Content</h3>
                  {userContent.length > 0 ? (
                    <div className="space-y-4">
                      {userContent.map((content) => (
                        <div key={content.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  content.type === 'tool' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                }`}>
                                  {content.type}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{content.createdAt}</span>
                              </div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{content.title}</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{content.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>{content.views.toLocaleString()} views</span>
                                <span>{content.likes} likes</span>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handlePromoteContent(content)}
                                className="flex items-center space-x-1 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800/30 transition-colors"
                              >
                                <Target className="h-4 w-4" />
                                <span>Promote</span>
                              </button>
                              <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <TrendingUp className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You haven't created any content yet.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Link
                          to="/tools/create"
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          Submit Tool
                        </Link>
                        <Link
                          to="/articles/create"
                          className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
                        >
                          Write Article
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Saved Items</h3>
                  {savedItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                              {item.type === 'tool' ? (
                                <Zap className="h-6 w-6 text-white" />
                              ) : (
                                <FileText className="h-6 w-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                                <button 
                                  onClick={() => {
                                    setSavedItems(savedItems.filter(i => i.id !== item.id));
                                  }}
                                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                                >
                                  <Bookmark className="h-4 w-4 fill-current" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{item.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Saved on {item.savedAt}</span>
                                <a 
                                  href={item.url} 
                                  className="text-primary-600 dark:text-primary-400 text-sm hover:underline"
                                >
                                  View
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bookmark className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Saved Items
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tools and articles you've bookmarked will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Promote Content Modal */}
      {showPromoteModal && selectedContent && (
        <PromoteContentModal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          contentType={selectedContent.type}
          contentId={selectedContent.id}
          contentTitle={selectedContent.title}
        />
      )}
    </>
  );
};

export default Profile;