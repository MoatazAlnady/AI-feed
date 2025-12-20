import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Star, Users, TrendingUp, Bookmark, Flag, Share2 } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { ShareButton } from './ShareButton';
import ToolActionButtons from './ToolActionButtons';
import ReportContentModal from './ReportContentModal';
import ShareToolModal from './ShareToolModal';

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    description: string;
    website: string;
    pricing: string;
    free_plan?: string;
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
    average_rating?: number;
    review_count?: number;
  };
  className?: string;
  onDelete?: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, className = '', onDelete }) => {
  const { theme } = useTheme();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={`bg-card rounded-xl shadow-sm border border-border hover:shadow-md dark:hover:shadow-lg transition-all duration-300 group ${className}`}>
      <div className="p-6">
        {/* Header with Logo, Title, Category, and Bookmark */}
        <div className="relative">
          {/* Category chip in top-left corner */}
          {tool.subcategory && (
            <div className="absolute -top-2 -left-2 z-10">
              <span className="px-2 py-1 text-xs font-medium rounded-full border bg-card border-border text-foreground">
                {tool.subcategory}
              </span>
            </div>
          )}
          
          {/* Bookmark button in top-right corner */}
          <button className="absolute -top-2 -right-2 z-10 p-2 rounded-full border transition-all duration-200 hover:scale-105 bg-card border-border text-foreground">
            <Bookmark className="h-3 w-3" />
          </button>
          
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
                <div className="w-10 h-10 rounded-lg border flex items-center justify-center bg-card border-border">
                  <span className="font-semibold text-sm text-foreground">
                    {tool.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tool.name}
                  </h3>
                  {/* Rating Stars */}
                  {tool.average_rating && tool.average_rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= (tool.average_rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tool.average_rating} ({tool.review_count || 0})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Pricing Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full border bg-card border-border text-foreground">
                {tool.pricing || 'Free'}
              </span>
              {tool.free_plan === 'Yes' && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Free Plan Available
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {tool.description}
        </p>

        {/* Tags */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tool.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-md font-medium bg-primary/10 text-primary border border-primary/30"
              >
                #{tag}
              </span>
            ))}
            {tool.tags.length > 3 && (
              <span className="px-2 py-1 text-xs rounded-md font-medium border bg-card border-border text-foreground">
                +{tool.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Features */}
        {tool.features && tool.features.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Key Features:</p>
            <ul className="space-y-1">
              {tool.features.slice(0, 2).map((feature, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start">
                  <Star className="h-3 w-3 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1 text-blue-500" />
              <span>Popular</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span>Trending</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <ShareButton
              contentType="tool"
              contentId={tool.id}
              shareCount={tool.share_count || 0}
              className="text-xs"
            />
            
            <div className="flex items-center space-x-2">
              {/* Reshare Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="p-1.5 rounded-md transition-all duration-200 border hover:bg-primary/10 bg-card border-border text-primary"
                title="Share this tool"
              >
                <Share2 className="h-3 w-3" />
              </button>
              
              {/* View Details Button */}
              <Link
                to={`/tools/${tool.id}`}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 border bg-card border-border text-foreground hover:bg-muted"
              >
                View Details
              </Link>
              
              {/* Action Buttons (Edit/Delete/External) */}
              <ToolActionButtons 
                tool={tool} 
                onDelete={onDelete}
                className="flex items-center space-x-1"
              />
              
              {/* Report Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="p-1.5 rounded-md transition-all duration-200 border hover:bg-destructive/10 bg-card border-border text-destructive"
                title="Report this tool"
              >
                <Flag className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      <ReportContentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="tool"
        contentId={tool.id}
        contentTitle={tool.name}
      />
      
      {/* Share Modal */}
      <ShareToolModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tool={tool}
      />
    </div>
  );
};

export default ToolCard;