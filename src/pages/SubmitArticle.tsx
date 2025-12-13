import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Tag, FileText, Send, Video, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatDock from '../components/ChatDock';

const SubmitArticle: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    type: 'article',
    author: '',
    email: '',
    featuredImage: null as File | null,
    videoUrl: ''
  });

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
    setIsSubmitting(true);
    
    const submissionData = {
      ...formData,
      submittedBy: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous'
    };
    
    console.log('Submitting article:', submissionData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('submitArticle.successTitle')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('submitArticle.successMessage')}
            </p>
            <p className="text-sm text-gray-500 mb-6">
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
                  tags: '',
                  type: 'article',
                  author: '',
                  email: '',
                  featuredImage: null,
                  videoUrl: ''
                });
              }}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
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
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t('submitArticle.title')}
          </h1>
          <p className="text-xl text-gray-600">
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
          className="bg-white rounded-2xl shadow-sm p-8"
        >
          {/* Author Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                {t('submitArticle.form.authorName')} *
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('submitArticle.form.authorPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('submitArticle.form.email')} *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('submitArticle.form.emailPlaceholder')}
              />
            </div>
          </div>

          {/* Content Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('submitArticle.form.contentType')} *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
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
              <label className="flex items-center">
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
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('submitArticle.form.titleLabel')} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('submitArticle.form.titlePlaceholder')}
            />
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              {t('submitArticle.form.excerpt')} *
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder={t('submitArticle.form.excerptPlaceholder')}
            />
          </div>

          {/* Video URL (if video type) */}
          {formData.type === 'video' && (
            <div className="mb-6">
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                {t('submitArticle.form.videoUrl')} *
              </label>
              <input
                type="url"
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                required={formData.type === 'video'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('submitArticle.form.videoUrlPlaceholder')}
              />
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {t('submitArticle.form.content')} *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={12}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder={t('submitArticle.form.contentPlaceholder')}
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                {t('submitArticle.form.category')} *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{t('submitArticle.form.selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                {t('submitArticle.form.tags')}
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('submitArticle.form.tagsPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-8">
            <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-2">
              {t('submitArticle.form.featuredImage')}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
              <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {t('submitArticle.form.uploadFeaturedImage')}
              </p>
              <p className="text-xs text-gray-500">
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
                className="mt-2 inline-block bg-primary-50 text-primary-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors"
              >
                {t('submitArticle.form.chooseImage')}
              </label>
              {formData.featuredImage && (
                <p className="mt-2 text-sm text-gray-600">
                  {t('submitArticle.form.selected')}: {formData.featuredImage.name}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t('submitArticle.form.submitting')}</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>{t('submitArticle.form.submit')}</span>
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
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