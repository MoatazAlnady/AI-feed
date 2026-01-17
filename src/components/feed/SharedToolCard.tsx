import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Star, ExternalLink, Share2, Heart, MessageCircle, Wrench, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/ThemeProvider';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import { getCreatorProfileLink } from '@/utils/profileUtils';

interface SharedToolCardProps {
  tool: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    website: string;
    pricing?: string;
    free_plan?: string;
    tags?: string[];
    average_rating?: number;
    review_count?: number;
    views?: number;
    is_light_logo?: boolean;
    is_dark_logo?: boolean;
  };
  sharedBy: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  shareText: string;
  sharedAt: string;
  onShare: (tool: any) => void;
}

const SharedToolCard: React.FC<SharedToolCardProps> = ({
  tool,
  sharedBy,
  shareText,
  sharedAt,
  onShare
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const shouldInvertLogo = () => {
    if (!tool.logo_url) return false;
    if (theme === 'dark' && tool.is_light_logo) return true;
    if (theme === 'light' && tool.is_dark_logo) return true;
    return false;
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Shared by header */}
      <div className="px-6 py-3 bg-muted/50 flex items-center gap-2 text-sm border-b">
        <RefreshCw className="h-3 w-3 text-muted-foreground" />
        <ProfileHoverCard userId={sharedBy.id}>
          <Link
            to={getCreatorProfileLink({ id: sharedBy.id, handle: sharedBy.handle })}
            className="font-medium hover:underline text-foreground"
          >
            {sharedBy.name}
          </Link>
        </ProfileHoverCard>
        <span className="text-muted-foreground">shared a tool • {sharedAt}</span>
        <Badge variant="outline" className="ml-auto flex items-center gap-1">
          <Wrench className="h-3 w-3" />
          Tool
        </Badge>
      </div>

      {/* Share commentary */}
      {shareText && (
        <div className="px-6 py-3 border-b">
          <p className="text-sm text-foreground italic">"{shareText}"</p>
        </div>
      )}

      {/* Tool content */}
      <div
        className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg line-clamp-1 text-foreground">{tool.name}</h3>
              {tool.average_rating && tool.average_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-muted-foreground">
                    {tool.average_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {tool.description}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{tool.pricing || 'Free'}</Badge>
              {tool.free_plan === 'Yes' && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Free Plan
                </Badge>
              )}
              {tool.tags?.slice(0, 2).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-6 py-3 border-t flex gap-4">
        <Button variant="ghost" size="sm">
          <Heart className="h-4 w-4 mr-1" />
          Like
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="h-4 w-4 mr-1" />
          Comment
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onShare(tool)}>
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
          className="ml-auto"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Visit Site
        </Button>
      </div>
    </div>
  );
};

export default SharedToolCard;
