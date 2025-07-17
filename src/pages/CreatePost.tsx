import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image, Video, Link as LinkIcon, Send, User, Plus, Hash, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import InterestTagSelector from '../components/InterestTagSelector';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);

    try {
      // Create post in Supabase
      const { data: newPostData, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          image_url: image ? URL.createObjectURL(image) : null,
          video_url: videoUrl || null,
          link_url: linkUrl || null
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to newsfeed to see the new post
      navigate('/newsfeed');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Post</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.user_metadata?.job_title || 'AI Enthusiast'}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind about AI?"
                className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={8}
                required
              />
            </div>

            {/* Video URL Input */}
            {showVideoInput && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl('');
                      setShowVideoInput(false);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Paste a YouTube, Vimeo, or other video embed URL
                </p>
              </div>
            )}

            {/* Link URL Input */}
            {showLinkInput && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLinkUrl('');
                      setShowLinkInput(false);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Interest Tags */}
            <InterestTagSelector 
              selectedTags={tags}
              onTagsChange={setTags}
            />

            {/* Image Preview */}
            {image && (
              <div>
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="mt-2 text-red-500 dark:text-red-400 text-sm hover:text-red-700 dark:hover:text-red-300"
                >
                  Remove image
                </button>
              </div>
            )}

            {/* Scheduling Section */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="schedule-post"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="schedule-post" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Schedule for later
                </label>
              </div>
              
              {isScheduled && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Media Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="p-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                >
                  <Image className="h-5 w-5" />
                </label>
                <button
                  type="button"
                  onClick={() => setShowVideoInput(!showVideoInput)}
                  className={`p-3 rounded-lg transition-colors ${
                    showVideoInput 
                      ? 'text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Video className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className={`p-3 rounded-lg transition-colors ${
                    showLinkInput 
                      ? 'text-green-500 bg-green-50 dark:text-green-400 dark:bg-green-900/20' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <LinkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {content.length}/500
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="px-8 py-3 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>{isScheduled ? 'Schedule Post' : 'Share Post'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;