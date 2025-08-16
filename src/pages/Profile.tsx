import React, { useState, useRef } from 'react';
import { 
  User, Mail, Calendar, Heart, Bookmark, MessageSquare, Upload, 
  Briefcase, MapPin, Edit, Camera, Target, TrendingUp, ExternalLink,
  Plus, Code, FileText, Users, Star, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PromoteContentModal from '../components/PromoteContentModal';
import NetworkTab from '../components/NetworkTab';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'content' | 'saved' | 'network'>('overview');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs for file inputs
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  // User profile data - only use real data from user object
  const userProfile = {
    email: user?.email || '',
    joinedAt: user?.created_at || new Date().toISOString(),
  };

  const userStats = [
    { label: 'Tools Submitted', value: user?.user_metadata?.tools_submitted || '0', icon: Upload },
    { label: 'Articles Written', value: user?.user_metadata?.articles_written || '0', icon: MessageSquare },
    { label: 'Likes Received', value: user?.user_metadata?.total_engagement || '0', icon: Heart },
    { label: 'Tools Bookmarked', value: '0', icon: Bookmark },
  ];

  const recentActivity: any[] = [];
  const userContent: any[] = [];

  const handlePromoteContent = (content: any) => {
    setSelectedContent(content);
    setShowPromoteModal(true);
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploading(true);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
      
      if (!data.publicUrl) throw new Error('Failed to get public URL');
      
      // Update user profile in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_photo: data.publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Refresh the page to show the new photo
      window.location.reload();
      
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      alert('Failed to upload profile photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploading(true);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-cover-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `cover-photos/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
      
      if (!data.publicUrl) throw new Error('Failed to get public URL');
      
      // Update user profile in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ cover_photo: data.publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Refresh the page to show the new photo
      window.location.reload();
      
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      alert('Failed to upload cover photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProfile = () => {
    // Navigate to settings page
    navigate('/settings');
  };

  return (
    <>
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mb-8">
            {/* Cover Photo - increased height */}
            <div className="h-64 bg-gradient-to-r from-primary-500 to-secondary-500 relative">
              {user?.user_metadata?.cover_photo && (
                <img 
                  src={user.user_metadata.cover_photo} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              )}
              <button 
                onClick={() => coverPhotoInputRef.current?.click()}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : <Camera className="h-4 w-4" />}
              </button>
              <input
                type="file"
                ref={coverPhotoInputRef}
                onChange={handleCoverPhotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            {/* Profile Info */}
            <div className="px-8 pb-8">
              <div className="flex items-start space-x-6 -mt-16">
                {/* Profile Photo */}
                <div className="relative">
                  <div className="w-32 h-32 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg">
                    {user?.user_metadata?.profile_photo ? (
                      <img
                        src={user.user_metadata.profile_photo}
                        alt={user.user_metadata?.full_name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <User className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute bottom-2 right-2 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                    disabled={isUploading}
                  >
                    {isUploading ? '...' : <Camera className="h-4 w-4" />}
                  </button>
                  <input
                    type="file"
                    ref={profilePhotoInputRef}
                    onChange={handleProfilePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* User Details */}
                <div className="flex-1 pt-16">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AI Enthusiast'}
                      </h1>
                      <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{userProfile.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(userProfile.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Job Title & Company - only show if available */}
                      {(user?.user_metadata?.job_title || user?.user_metadata?.company) && (
                        <div className="flex items-center space-x-1 mb-3">
                          <Briefcase className="h-4 w-4" />
                          <span>
                            {user?.user_metadata?.job_title}
                            {user?.user_metadata?.job_title && user?.user_metadata?.company && ' at '}
                            {user?.user_metadata?.company}
                          </span>
                        </div>
                      )}
                      
                      {/* Location - only show if available */}
                      {user?.user_metadata?.location && (
                        <div className="flex items-center space-x-1 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>{user?.user_metadata?.location}</span>
                        </div>
                      )}
                      
                      {/* Bio - only show if available */}
                      {user?.user_metadata?.bio && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">{user?.user_metadata?.bio}</p>
                      )}
                      
                      {/* Interests - only show if available */}
                      {user?.user_metadata?.interests && user?.user_metadata?.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {user?.user_metadata?.interests.map((interest: string, index: number) => (
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
                        {user?.user_metadata?.website && (
                          <a
                            href={user.user_metadata.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                        {user?.user_metadata?.github && (
                          <a
                            href={user.user_metadata.github}
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posts</h3>
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No posts yet. Start sharing your thoughts and insights with the community!
                    </p>
                  </div>
                </div>
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