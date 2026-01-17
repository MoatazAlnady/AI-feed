import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ArticleCardProps {
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
    tags?: string[];
  };
  onShare: (article: any) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onShare }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-border">
      <div className="flex gap-4">
        {/* Featured Image */}
        {article.featured_image_url && (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-32 h-24 object-cover rounded-lg flex-shrink-0 cursor-pointer"
            onClick={() => navigate(`/article/${article.id}`)}
          />
        )}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">{article.category}</Badge>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Article
            </Badge>
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-foreground line-clamp-2 cursor-pointer hover:underline"
            onClick={() => navigate(`/article/${article.id}`)}
          >
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {article.excerpt}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{article.author}</span>
            <span>•</span>
            <span>{new Date(article.published_at).toLocaleDateString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views || 0} views
            </span>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {article.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onShare(article);
          }}
          className="flex-shrink-0"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ArticleCard;
