import React, { useState, useEffect } from 'react';
import { X, Image, Video, Link as LinkIcon, Send, User, Calendar, Clock, Upload, Camera, Radio, Crown, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import InterestTagSelector from './InterestTagSelector';
import LinkPreview from './LinkPreview';
import PostPrivacySelector from './PostPrivacySelector';
import VideoUploader from './VideoUploader';
import VideoRecorder from './VideoRecorder';
import LiveVideoModal from './LiveVideoModal';
import PremiumUpgradeModal from './PremiumUpgradeModal';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MAX_POST_LENGTH = 3000;
interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium } = usePremiumStatus();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [showArticleDialog, setShowArticleDialog] = useState(false);
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

  // Fetch user's default privacy settings
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

    // Check if content exceeds limit
    if (content.length > MAX_POST_LENGTH) {
      setShowArticleDialog(true);
      return;
    }

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

      const newPost = {
        id: parseInt(newPostData.id),
        author: {
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
          avatar: user?.user_metadata?.profile_photo || '',
          title: user?.user_metadata?.job_title || 'AI Enthusiast',
          verified: user?.user_metadata?.verified || false,
          topVoice: user?.user_metadata?.ai_nexus_top_voice || false
        },
        content,
        timestamp: 'Just now',
        likes: 0,
        comments: [],
        shares: 0,
        tags: tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`),
        liked: false,
        bookmarked: false,
        image: image ? URL.createObjectURL(image) : undefined,
        video: videoUrl || undefined,
        link: linkUrl || undefined,
        link_metadata: linkMetadata
      };

      onPostCreated(newPost);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setTags([]);
    setImage(null);
    setVideoUrl('');
    setLinkUrl('');
    setLinkMetadata(null);
    setShowVideoInput(false);
    setShowLinkInput(false);
    setShowVideoUploader(false);
    setShowVideoRecorder(false);
    setScheduleDate('');
    setScheduleTime('');
    setIsScheduled(false);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Create Post</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous'}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.user_metadata?.job_title || 'AI Enthusiast'}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind about AI?"
                  className={`w-full p-4 border rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                    content.length > MAX_POST_LENGTH 
                      ? 'border-destructive' 
                      : content.length > MAX_POST_LENGTH - 300 
                        ? 'border-yellow-500' 
                        : 'border-border'
                  }`}
                  rows={6}
                  required
                />
              </div>

              {/* Video Upload/Record Section (Premium Only) */}
              {showVideoUploader && (
                <div className="mb-4">
                  <VideoUploader
                    onVideoUploaded={(url) => {
                      setVideoUrl(url);
                      setShowVideoUploader(false);
                    }}
                    onCancel={() => setShowVideoUploader(false)}
                  />
                </div>
              )}

              {showVideoRecorder && (
                <div className="mb-4">
                  <VideoRecorder
                    onVideoRecorded={(url) => {
                      setVideoUrl(url);
                      setShowVideoRecorder(false);
                    }}
                    onCancel={() => setShowVideoRecorder(false)}
                  />
                </div>
              )}

              {/* Video URL Display */}
              {videoUrl && !showVideoUploader && !showVideoRecorder && (
                <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Link URL
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => {
                        setLinkUrl(e.target.value);
                        setLinkMetadata(null);
                      }}
                      placeholder="https://example.com"
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
              />

              {/* Image Preview */}
              {image && (
                <div className="mb-4">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="mt-2 text-destructive text-sm hover:text-destructive/80"
                  >
                    Remove image
                  </button>
                </div>
              )}

              {/* Privacy Selector */}
              <div className="mb-6">
                <PostPrivacySelector
                  visibility={visibility}
                  selectedGroups={selectedGroups}
                  onVisibilityChange={setVisibility}
                  onGroupsChange={setSelectedGroups}
                  showMakeDefault={isVisibilityChanged}
                  onMakeDefault={handleMakeDefault}
                />
              </div>

              {/* Scheduling Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="schedule-post"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="schedule-post" className="text-sm font-medium text-foreground">
                    Schedule for later
                  </label>
                </div>
                
                {isScheduled && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Date</label>
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
                      <label className="block text-sm font-medium text-foreground mb-2">Time</label>
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
              <div className="flex items-center justify-between mb-6">
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
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors"
                  >
                    <Image className="h-5 w-5" />
                  </label>
                  
                  {/* Premium Video Features */}
                  <button
                    type="button"
                    onClick={() => handleVideoFeatureClick('upload')}
                    className={`p-2 rounded-lg transition-colors relative ${
                      showVideoUploader 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title={isPremium ? 'Upload Video' : 'Premium Feature'}
                  >
                    <Upload className="h-5 w-5" />
                    {!isPremium && <Crown className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleVideoFeatureClick('record')}
                    className={`p-2 rounded-lg transition-colors relative ${
                      showVideoRecorder 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title={isPremium ? 'Record Video' : 'Premium Feature'}
                  >
                    <Camera className="h-5 w-5" />
                    {!isPremium && <Crown className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleVideoFeatureClick('live')}
                    className="p-2 rounded-lg transition-colors relative text-muted-foreground hover:text-foreground hover:bg-muted"
                    title={isPremium ? 'Go Live' : 'Premium Feature'}
                  >
                    <Radio className="h-5 w-5" />
                    {!isPremium && <Crown className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    className={`p-2 rounded-lg transition-colors ${
                      showLinkInput 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <LinkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className={`text-sm ${
                  content.length > MAX_POST_LENGTH 
                    ? 'text-destructive font-medium' 
                    : content.length > MAX_POST_LENGTH - 300 
                      ? 'text-yellow-600' 
                      : 'text-muted-foreground'
                }`}>
                  {content.length.toLocaleString()}/{MAX_POST_LENGTH.toLocaleString()}
                  {content.length > MAX_POST_LENGTH && (
                    <span className="ml-2">• Consider posting as an article</span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="w-full bg-gradient-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
            </form>
          </div>
        </div>
      </div>

      {/* Live Video Modal */}
      <LiveVideoModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
      />

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName="video"
      />

      {/* Article Suggestion Dialog */}
      <AlertDialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Content Too Long for a Post
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your content exceeds the {MAX_POST_LENGTH.toLocaleString()} character limit for posts. 
              Consider publishing it as an article instead for better formatting and reach.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowArticleDialog(false)}>
              Trim to {MAX_POST_LENGTH.toLocaleString()}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowArticleDialog(false);
                onClose();
                navigate('/submit-article', { 
                  state: { 
                    prefillContent: content,
                    prefillTitle: content.split('\n')[0]?.substring(0, 100) || ''
                  } 
                });
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create as Article
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreatePostModal;
