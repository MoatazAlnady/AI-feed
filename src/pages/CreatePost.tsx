import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Image, Video, Link as LinkIcon, Send, User, Calendar, Clock, ArrowLeft, Upload, Camera, Radio, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import InterestTagSelector from '../components/InterestTagSelector';
import LinkPreview from '../components/LinkPreview';
import PostPrivacySelector from '../components/PostPrivacySelector';
import VideoUploader from '../components/VideoUploader';
import VideoRecorder from '../components/VideoRecorder';
import LiveVideoModal from '../components/LiveVideoModal';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useToast } from '@/hooks/use-toast';

interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium } = usePremiumStatus();
  
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Privacy settings
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'groups'>('public');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [defaultVisibility, setDefaultVisibility] = useState<'public' | 'connections' | 'groups'>('public');
  const [defaultGroups, setDefaultGroups] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchDefaultPrivacy();
    }
  }, [user]);

  const fetchDefaultPrivacy = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('default_post_visibility, default_post_groups')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        const vis = (data.default_post_visibility || 'public') as 'public' | 'connections' | 'groups';
        setDefaultVisibility(vis);
        setVisibility(vis);
        setDefaultGroups(data.default_post_groups || []);
        setSelectedGroups(data.default_post_groups || []);
      }
    } catch (error) {
      console.error('Error fetching default privacy:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);

    try {
      const { data: newPostData, error } = await supabase
        .from('posts')
        .insert({
          content,
          image_url: image ? URL.createObjectURL(image) : null,
          video_url: videoUrl || null,
          link_url: linkUrl || null,
          link_metadata: linkMetadata,
          visibility,
          visible_to_groups: visibility === 'groups' ? selectedGroups : []
        } as any)
        .select()
        .single();

      if (error) throw error;

      navigate(`/posts/${newPostData.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to create post. Please try again.',
        variant: 'destructive'
      });
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

  const handleVideoFeatureClick = (feature: 'upload' | 'record' | 'live') => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (feature === 'upload') {
      setShowVideoUploader(true);
      setShowVideoRecorder(false);
    } else if (feature === 'record') {
      setShowVideoRecorder(true);
      setShowVideoUploader(false);
    } else {
      setShowLiveModal(true);
    }
  };

  const handleMakeDefault = async () => {
    if (!user) return;
    try {
      await supabase
        .from('user_profiles')
        .update({
          default_post_visibility: visibility,
          default_post_groups: visibility === 'groups' ? selectedGroups : []
        })
        .eq('id', user.id);
      
      setDefaultVisibility(visibility);
      setDefaultGroups(selectedGroups);
      
      toast({
        title: 'Default updated',
        description: 'Your default post visibility has been saved'
      });
    } catch (error) {
      console.error('Error saving default:', error);
    }
  };

  const isVisibilityChanged = visibility !== defaultVisibility || 
    JSON.stringify(selectedGroups) !== JSON.stringify(defaultGroups);

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold text-foreground">{t('createPost.title')}</h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-card rounded-2xl shadow-sm p-8 border border-border">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous'}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.user_metadata?.job_title || t('community.networking.aiEnthusiast')}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('createPost.placeholder')}
                  className="w-full p-4 border border-border rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  rows={8}
                  required
                />
              </div>

              {/* Video Upload/Record Section */}
              {showVideoUploader && (
                <VideoUploader
                  onVideoUploaded={(url) => {
                    setVideoUrl(url);
                    setShowVideoUploader(false);
                  }}
                  onCancel={() => setShowVideoUploader(false)}
                />
              )}

              {showVideoRecorder && (
                <VideoRecorder
                  onVideoRecorded={(url) => {
                    setVideoUrl(url);
                    setShowVideoRecorder(false);
                  }}
                  onCancel={() => setShowVideoRecorder(false)}
                />
              )}

              {videoUrl && !showVideoUploader && !showVideoRecorder && (
                <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm text-foreground truncate flex-1">Video attached</span>
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    className="text-destructive hover:text-destructive/80 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Link URL Input with Preview */}
              {showLinkInput && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('createPost.labels.linkUrl')}
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => {
                        setLinkUrl(e.target.value);
                        setLinkMetadata(null);
                      }}
                      placeholder={t('createPost.placeholders.linkUrl')}
                      className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLinkUrl('');
                        setLinkMetadata(null);
                        setShowLinkInput(false);
                      }}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {linkUrl && (
                    <LinkPreview 
                      url={linkUrl} 
                      onMetadataFetched={setLinkMetadata}
                    />
                  )}
                </div>
              )}

              {/* Interest Tags */}
              <InterestTagSelector 
                selectedTags={tags}
                onTagsChange={setTags}
                maxTags={5}
                label="Post Interests (max 5)"
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
                    className="mt-2 text-destructive text-sm hover:text-destructive/80"
                  >
                    {t('createPost.buttons.removeImage')}
                  </button>
                </div>
              )}

              {/* Privacy Selector */}
              <PostPrivacySelector
                visibility={visibility}
                selectedGroups={selectedGroups}
                onVisibilityChange={setVisibility}
                onGroupsChange={setSelectedGroups}
                showMakeDefault={isVisibilityChanged}
                onMakeDefault={handleMakeDefault}
              />

              {/* Scheduling Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="schedule-post"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="schedule-post" className="text-sm font-medium text-foreground">
                    {t('createPost.labels.scheduleForLater')}
                  </label>
                </div>
                
                {isScheduled && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('createPost.labels.date')}
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('createPost.labels.time')}
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
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
                    className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors"
                  >
                    <Image className="h-5 w-5" />
                  </label>
                  
                  {/* Premium Video Features */}
                  <button
                    type="button"
                    onClick={() => handleVideoFeatureClick('upload')}
                    className={`p-3 rounded-lg transition-colors relative ${
                      showVideoUploader 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Upload className="h-5 w-5" />
                    {!isPremium && <Crown className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleVideoFeatureClick('record')}
                    className={`p-3 rounded-lg transition-colors relative ${
                      showVideoRecorder 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Camera className="h-5 w-5" />
                    {!isPremium && <Crown className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleVideoFeatureClick('live')}
                    className="p-3 rounded-lg transition-colors relative text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Radio className="h-5 w-5" />
                    {!isPremium && <Crown className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    className={`p-3 rounded-lg transition-colors ${
                      showLinkInput 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <LinkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {content.length}/500
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('createPost.buttons.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-8 py-3 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t('createPost.buttons.posting')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>{isScheduled ? t('createPost.buttons.schedulePost') : t('createPost.buttons.sharePost')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <LiveVideoModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
      />

      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName="video"
      />
    </>
  );
};

export default CreatePost;
