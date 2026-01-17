import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Upload, FileText, Send, Video, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ChatDock from '../components/ChatDock';
import InterestTagSelector from '../components/InterestTagSelector';

interface LocationState {
  prefillContent?: string;
  prefillTitle?: string;
}

const SubmitArticle: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [formData, setFormData] = useState({
    title: state?.prefillTitle || '',
    excerpt: '',
    content: state?.prefillContent || '',
    category: '',
    interests: [] as string[],
    type: 'article',
    featuredImage: null as File | null,
    videoUrl: ''
  });

  // Pre-fill form from navigation state (e.g., from post modal)
  useEffect(() => {
    if (state?.prefillContent) {
      setFormData(prev => ({
        ...prev,
        content: state.prefillContent || '',
        title: state.prefillTitle || '',
        excerpt: state.prefillContent?.substring(0, 200) || ''
      }));
    }
  }, [state]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    'Trends',
    'Tutorial',
    'Review',
    'News',
    'Ethics',
    'Research',
    'Industry Analysis',
    'Case Study'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, featuredImage: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit an article');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload featured image if provided
      let imageUrl = null;
      if (formData.featuredImage) {
        const fileExt = formData.featuredImage.name.split('.').pop();
        const fileName = `articles/${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, formData.featuredImage);
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('articles')
        .insert({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          tags: formData.interests,
          type: formData.type,
          featured_image_url: imageUrl,
          video_url: formData.videoUrl || null,
          user_id: user.id,
          author: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
          email: user.email || '',
          status: 'pending'
        });

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting article:', error);
      toast.error('Failed to submit article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-8 bg-muted min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl shadow-sm p-8 text-center border border-border">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {t('submitArticle.successTitle')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('submitArticle.successMessage')}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {t('toolDetails.submittedBy')}: {user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('toolDetails.anonymous')}
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  title: '',
                  excerpt: '',
                  content: '',
                  category: '',
                  interests: [],
                  type: 'article',
                  featuredImage: null,
                  videoUrl: ''
                });
              }}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('submitArticle.submitAnother')}
            </button>
          </div>
        </div>

        {/* Chat Dock */}
        <ChatDock />
      </div>
    );
  }

  return (
    <div className="py-8 bg-muted min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('submitArticle.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('submitArticle.subtitle')}
          </p>
        </div>

        <form 
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
          className="bg-card rounded-2xl shadow-sm p-8 border border-border"
        >
          {/* Content Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              {t('submitArticle.form.contentType')} *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center text-foreground">
                <input
                  type="radio"
                  name="type"
                  value="article"
                  checked={formData.type === 'article'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <FileText className="h-4 w-4 mr-1" />
                {t('submitArticle.form.article')}
              </label>
              <label className="flex items-center text-foreground">
                <input
                  type="radio"
                  name="type"
                  value="video"
                  checked={formData.type === 'video'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <Video className="h-4 w-4 mr-1" />
                {t('submitArticle.form.video')}
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              {t('submitArticle.form.titleLabel')} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder={t('submitArticle.form.titlePlaceholder')}
            />
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label htmlFor="excerpt" className="block text-sm font-medium text-foreground mb-2">
              {t('submitArticle.form.excerpt')} *
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
              placeholder={t('submitArticle.form.excerptPlaceholder')}
            />
          </div>

          {/* Video URL (if video type) */}
          {formData.type === 'video' && (
            <div className="mb-6">
              <label htmlFor="videoUrl" className="block text-sm font-medium text-foreground mb-2">
                {t('submitArticle.form.videoUrl')} *
              </label>
              <input
                type="url"
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                required={formData.type === 'video'}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder={t('submitArticle.form.videoUrlPlaceholder')}
              />
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
              {t('submitArticle.form.content')} *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={12}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
              placeholder={t('submitArticle.form.contentPlaceholder')}
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
              {t('submitArticle.form.category')} *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="">{t('submitArticle.form.selectCategory')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <InterestTagSelector
              selectedTags={formData.interests}
              onTagsChange={(interests) => setFormData(prev => ({ ...prev, interests }))}
              maxTags={5}
              label="Article Interests (max 5)"
            />
          </div>

          {/* Featured Image */}
          <div className="mb-8">
            <label htmlFor="featuredImage" className="block text-sm font-medium text-foreground mb-2">
              {t('submitArticle.form.featuredImage')}
            </label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                {t('submitArticle.form.uploadFeaturedImage')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('submitArticle.form.imageSpecs')}
              </p>
              <input
                type="file"
                id="featuredImage"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="featuredImage"
                className="mt-2 inline-block bg-primary/10 text-primary px-4 py-2 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {t('submitArticle.form.chooseImage')}
              </label>
              {formData.featuredImage && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('submitArticle.form.selected')}: {formData.featuredImage.name}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                <span>{t('submitArticle.form.submitting')}</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>{t('submitArticle.form.submit')}</span>
              </>
            )}
          </button>

          <p className="text-sm text-muted-foreground text-center mt-4">
            {t('submitArticle.form.disclaimer')}
          </p>
        </form>
      </div>

      {/* Chat Dock */}
      <ChatDock />
    </div>
  );
};

export default SubmitArticle;