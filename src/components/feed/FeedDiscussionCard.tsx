import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, BarChart3, Share2, Sparkles, MessageCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileHoverCard from '@/components/ProfileHoverCard';

interface FeedDiscussionCardProps {
  discussion: {
    id: string;
    title: string;
    subtitle?: string | null;
    content?: string | null;
    poll_options?: any[] | null;
    reply_count?: number;
    group_id: string;
    interests?: string[];
    tags?: string[];
    author_id?: string;
    created_at?: string;
  };
  groupName: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  onShare: (discussion: any) => void;
  isNew?: boolean;
}

const FeedDiscussionCard: React.FC<FeedDiscussionCardProps> = ({ 
  discussion, 
  groupName,
  author, 
  onShare, 
  isNew = false 
}) => {
  const navigate = useNavigate();
  const hasPoll = discussion.poll_options && discussion.poll_options.length > 0;
  const discussionUrl = `/group/${discussion.group_id}?tab=discussions`;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
      {author && (
        <div className="px-6 py-3 bg-muted/50 border-b flex items-center gap-3">
          <ProfileHoverCard userId={author.id}>
            <Link to={`/creator/${author.handle || author.id}`} className="flex items-center gap-2">
              {author.avatar ? (
                <img src={author.avatar} alt={author.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">{author.name.charAt(0)}</span>
                </div>
              )}
              <span className="font-medium text-sm hover:underline">{author.name}</span>
            </Link>
          </ProfileHoverCard>
          <span className="text-muted-foreground text-sm">
            {isNew ? 'started a discussion' : 'shared a discussion'}
            {hasPoll && ' with a poll'}
          </span>
          {isNew && (
            <Badge variant="secondary" className="ml-auto flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Sparkles className="h-3 w-3" />New
            </Badge>
          )}
          <Badge variant="outline" className={`${!isNew ? 'ml-auto' : ''} flex items-center gap-1`}>
            {hasPoll ? <BarChart3 className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
            {hasPoll ? 'Poll' : 'Discussion'}
          </Badge>
        </div>
      )}

      <div className="p-6 cursor-pointer" onClick={() => navigate(discussionUrl)}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
            {hasPoll ? (
              <BarChart3 className="h-6 w-6 text-primary" />
            ) : (
              <MessageSquare className="h-6 w-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors line-clamp-2 mb-1">
              {discussion.title}
            </h3>
            
            {discussion.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {discussion.subtitle}
              </p>
            )}

            {discussion.content && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {discussion.content}
              </p>
            )}

            {hasPoll && (
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Poll Options
                </div>
                <div className="space-y-1">
                  {discussion.poll_options?.slice(0, 3).map((option: any, idx: number) => (
                    <div key={idx} className="text-sm text-muted-foreground bg-background rounded px-3 py-1.5 border">
                      {option.text || option}
                    </div>
                  ))}
                  {(discussion.poll_options?.length || 0) > 3 && (
                    <div className="text-xs text-primary">+{(discussion.poll_options?.length || 0) - 3} more options</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {groupName}
              </Badge>
              
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {discussion.reply_count || 0} replies
              </span>
              
              {discussion.interests?.slice(0, 2).map((interest, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-primary/5">{interest}</Badge>
              ))}
              
              {discussion.tags?.slice(0, 2).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onShare(discussion); }}>
          <Share2 className="h-4 w-4 mr-1" />Share
        </Button>
        <Link to={discussionUrl}>
          <Button variant="outline" size="sm">
            {hasPoll ? 'Vote Now' : 'Join Discussion'}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FeedDiscussionCard;
