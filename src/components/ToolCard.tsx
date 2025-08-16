import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Star, Users, TrendingUp } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { ShareButton } from './ShareButton';

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    description: string;
    website: string;
    pricing: string;
    category_id?: string;
    subcategory?: string;
    is_light_logo?: boolean;
    is_dark_logo?: boolean;
    logo_url?: string;
    tags?: string[];
    features?: string[];
    pros?: string[];
    cons?: string[];
    created_at?: string;
    user_id?: string;
    share_count?: number;
  };
  className?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, className = '' }) => {
  const { theme } = useTheme();

  // Determine if logo should be inverted based on theme and logo type
  const shouldInvertLogo = () => {
    if (!tool.logo_url) return false;
    if (theme === 'dark' && tool.is_light_logo) return true;
    if (theme === 'light' && tool.is_dark_logo) return true;
    return false;
  };

  const getPricingColor = (pricing: string) => {
    switch (pricing?.toLowerCase()) {
      case 'free':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'freemium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'paid':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'subscription':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 group ${className}`}>
      <div className="p-6">
        {/* Header with Logo and Title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {tool.logo_url ? (
              <div className="flex-shrink-0">
                <img
                  src={tool.logo_url}
                  alt={`${tool.name} logo`}
                  className={`w-10 h-10 rounded-lg object-contain ${
                    shouldInvertLogo() ? 'filter invert' : ''
                  }`}
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {tool.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {tool.name}
              </h3>
              {tool.subcategory && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tool.subcategory}
                </p>
              )}
            </div>
          </div>
          
          {/* Pricing Badge */}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPricingColor(tool.pricing)}`}>
            {tool.pricing || 'Free'}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {tool.description}
        </p>

        {/* Tags */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tool.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
              >
                #{tag}
              </span>
            ))}
            {tool.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                +{tool.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Features */}
        {tool.features && tool.features.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Key Features:</p>
            <ul className="space-y-1">
              {tool.features.slice(0, 2).map((feature, index) => (
                <li key={index} className="text-xs text-gray-600 dark:text-gray-300 flex items-start">
                  <Star className="h-3 w-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text mr-1 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text" />
              <span>Popular</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 bg-gradient-to-r from-green-500 to-blue-500 text-transparent bg-clip-text" />
              <span>Trending</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ShareButton
              contentType="tool"
              contentId={tool.id}
              shareCount={tool.share_count || 0}
              className="text-xs"
            />
            <Link
              to={`/tools/${tool.id}`}
              className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 rounded-md transition-all duration-200"
            >
              View Details
            </Link>
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 rounded-md transition-all duration-200 group"
            >
              <span>Try Now</span>
              <ExternalLink className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;