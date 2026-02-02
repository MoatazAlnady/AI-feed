import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ExternalLink, Share2, Wrench, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/ThemeProvider';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import TranslateButton from '@/components/TranslateButton';

interface FeedToolCardProps {
  tool: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    website: string;
    pricing_type?: string;
    free_plan?: string;
    tags?: string[];
    interests?: string[];
    average_rating?: number;
    review_count?: number;
    views?: number;
    is_light_logo?: boolean;
    user_id?: string;
    created_at?: string;
    detected_language?: string | null;
  };
  author?: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  onShare: (tool: any) => void;
  isNew?: boolean;
}

const FeedToolCard: React.FC<FeedToolCardProps> = ({ 
  tool, 
  author, 
  onShare, 
  isNew = false 
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);

  // is_light_logo TRUE = light logo, invert in LIGHT mode to make visible
  // is_light_logo FALSE = dark logo, invert in DARK mode to make visible
  const shouldInvertLogo = () => {
    if (!tool.logo_url) return false;
    if (theme === 'light' && tool.is_light_logo) return true;
    if (theme === 'dark' && !tool.is_light_logo) return true;
    return false;
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
      {/* Author Header (if showing as creator's new tool) */}
      {author && (
        <div className="px-6 py-3 bg-muted/50 border-b flex items-center gap-3">
          <ProfileHoverCard userId={author.id}>
            <Link 
              to={`/creator/${author.handle || author.id}`}
              className="flex items-center gap-2"
            >
              {author.avatar ? (
                <img src={author.avatar} alt={author.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">{author.name.charAt(0)}</span>
                </div>
              )}
              <span className="font-medium text-sm hover:underline text-foreground">{author.name}</span>
            </Link>
          </ProfileHoverCard>
          <span className="text-muted-foreground text-sm">
            {isNew ? 'added a new AI tool' : 'shared a tool'}
          </span>
          <Badge variant="outline" className="ml-auto flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            Tool
          </Badge>
        </div>
      )}

      {/* Tool Content */}
      <div 
        className="p-6 cursor-pointer"
        onClick={() => navigate(`/tools/${tool.id}`)}
      >
        <div className="flex gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt={tool.name}
                className={`w-16 h-16 rounded-xl object-contain ${
                  shouldInvertLogo() ? 'filter invert' : ''
                }`}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {tool.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Title & Rating */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors line-clamp-1">
                {tool.name}
              </h3>
              {tool.average_rating && tool.average_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-muted-foreground">
                    {tool.average_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {translatedDescription || tool.description}
            </p>

            {/* Translate Button */}
            <TranslateButton
              contentType="tool"
              contentId={tool.id}
              originalText={tool.description}
              detectedLanguage={tool.detected_language || undefined}
              onTranslated={setTranslatedDescription}
              className="mb-2"
            />

            {/* Tags & Pricing */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{tool.pricing_type || 'Free'}</Badge>
              {tool.free_plan === 'Yes' && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Free Plan
                </Badge>
              )}
              {tool.interests?.slice(0, 4).map((interest, i) => (
                <Badge key={`int-${i}`} variant="outline" className="text-xs bg-primary/5">
                  {interest}
                </Badge>
              ))}
              {tool.tags?.slice(0, 4).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Meta */}
            {tool.views !== undefined && tool.views > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                {tool.views} views
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 border-t flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onShare(tool);
            }}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(tool.website, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Visit
          </Button>
        </div>
        <Link to={`/tools/${tool.id}`} onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FeedToolCard;
