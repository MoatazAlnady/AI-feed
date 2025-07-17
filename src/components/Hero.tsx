import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Hero: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-primary-200 dark:border-primary-800 mb-8">
            <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Discover 1000+ AI Tools
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t('common.search') + ' AI tools, categories, or use cases...'}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 dark:border-blue-600 rounded-2xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent shadow-lg dark:shadow-gray-800/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-shadow">
                {t('common.search')}
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/tools"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow group"
            >
              {t('hero.cta')}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center px-8 py-3 border-2 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              Explore Categories
            </Link>
          </div>

          {/* Popular Tags */}
          <div className="mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Popular: </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['ChatGPT', 'Midjourney', 'Claude', 'Stability AI', 'OpenAI', 'Anthropic'].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200 dark:bg-primary-800/50 rounded-full opacity-20 animate-bounce-gentle"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-secondary-200 dark:bg-secondary-800/50 rounded-full opacity-20 animate-bounce-gentle" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-5 w-12 h-12 bg-accent-200 dark:bg-accent-800/50 rounded-full opacity-20 animate-bounce-gentle" style={{animationDelay: '2s'}}></div>
    </section>
  );
};

export default Hero;