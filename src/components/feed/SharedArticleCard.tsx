import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, RefreshCw, Heart, MessageCircle, Share2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import { getCreatorProfileLink } from '@/utils/profileUtils';

interface SharedArticleCardProps {
  article: {
    id: string;
    title: string;
    excerpt?: string | null;
    featured_image_url?: string | null;
    category: string;
    author: string;
    published_at: string;
    views?: number;
    user_id?: string;
  };
  sharedBy: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  shareText?: string;
  sharedAt: string;
  onShare: (article: any) => void;
}

const SharedArticleCard: React.FC<SharedArticleCardProps> = ({
  article,
  sharedBy,
  shareText,
  sharedAt,
  onShare,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
      {/* Shared by header */}
      <div className="px-6 py-3 bg-muted/50 flex items-center gap-2 text-sm border-b border-border">
        <RefreshCw className="h-3 w-3 text-muted-foreground" />
        <ProfileHoverCard userId={sharedBy.id}>
          <Link
            to={getCreatorProfileLink({ id: sharedBy.id, handle: sharedBy.handle })}
            className="flex items-center gap-2"
          >
            {sharedBy.avatar ? (
              <img
                src={sharedBy.avatar}
                alt={sharedBy.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
            )}
            <span className="font-medium hover:underline">{sharedBy.name}</span>
          </Link>
        </ProfileHoverCard>
        <span className="text-muted-foreground">shared an article • {sharedAt}</span>
      </div>

      {/* Share commentary */}
      {shareText && (
        <div className="px-6 py-3 border-b border-border">
          <p className="text-sm text-foreground italic">"{shareText}"</p>
        </div>
      )}

      {/* Article card content */}
      <div
        className="p-6 hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => navigate(`/article/${article.id}`)}
      >
        <div className="flex gap-4">
          {article.featured_image_url && (
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">{article.category}</Badge>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Article
              </Badge>
            </div>
            <h3 className="font-semibold line-clamp-2 text-foreground">{article.title}</h3>
            {article.excerpt && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{article.author}</span>
              <span>•</span>
              <span>{new Date(article.published_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-6 py-3 border-t border-border flex gap-4">
        <Button variant="ghost" size="sm">
          <Heart className="h-4 w-4 mr-1" />
          Like
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="h-4 w-4 mr-1" />
          Comment
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onShare(article);
          }}
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default SharedArticleCard;
