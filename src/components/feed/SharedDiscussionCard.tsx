import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, MessageSquare, BarChart3, Share2, Heart, MessageCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import TranslateButton from '@/components/TranslateButton';

interface SharedDiscussionCardProps {
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
    detected_language?: string | null;
  };
  groupName: string;
  sharedBy: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  shareText: string;
  sharedAt: string;
  onShare: (discussion: any) => void;
}

const SharedDiscussionCard: React.FC<SharedDiscussionCardProps> = ({
  discussion,
  groupName,
  sharedBy,
  shareText,
  sharedAt,
  onShare
}) => {
  const navigate = useNavigate();
  const hasPoll = discussion.poll_options && discussion.poll_options.length > 0;
  const discussionUrl = `/group/${discussion.group_id}?tab=discussions`;
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-3 bg-muted/50 flex items-center gap-2 text-sm border-b">
        <RefreshCw className="h-3 w-3 text-muted-foreground" />
        <ProfileHoverCard userId={sharedBy.id}>
          <Link to={getCreatorProfileLink({ id: sharedBy.id, handle: sharedBy.handle })} className="font-medium hover:underline">
            {sharedBy.name}
          </Link>
        </ProfileHoverCard>
        <span className="text-muted-foreground">shared a {hasPoll ? 'poll' : 'discussion'} • {sharedAt}</span>
        <Badge variant="outline" className="ml-auto flex items-center gap-1">
          {hasPoll ? <BarChart3 className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
          {hasPoll ? 'Poll' : 'Discussion'}
        </Badge>
      </div>

      {shareText && (
        <div className="px-6 py-3 border-b">
          <p className="text-sm text-foreground italic">"{shareText}"</p>
        </div>
      )}

      <div className="p-6 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(discussionUrl)}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
            {hasPoll ? <BarChart3 className="h-6 w-6 text-primary" /> : <MessageSquare className="h-6 w-6 text-primary" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 mb-1">{discussion.title}</h3>
            
            {discussion.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{discussion.subtitle}</p>
            )}

            {discussion.content && (
              <>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{translatedContent || discussion.content}</p>
                <TranslateButton
                  contentType="discussion"
                  contentId={discussion.id}
                  originalText={discussion.content}
                  detectedLanguage={discussion.detected_language}
                  onTranslated={setTranslatedContent}
                  className="mb-3"
                />
              </>
            )}

            {hasPoll && (
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <BarChart3 className="h-4 w-4 text-primary" />Poll
                </div>
                <div className="space-y-1">
                  {discussion.poll_options?.slice(0, 2).map((option: any, idx: number) => (
                    <div key={idx} className="text-sm text-muted-foreground bg-background rounded px-3 py-1.5 border">
                      {option.text || option}
                    </div>
                  ))}
                  {(discussion.poll_options?.length || 0) > 2 && (
                    <div className="text-xs text-primary">+{(discussion.poll_options?.length || 0) - 2} more</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />{groupName}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />{discussion.reply_count || 0} replies
              </span>
              {discussion.interests?.slice(0, 4).map((interest, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-primary/5">{interest}</Badge>
              ))}
              {discussion.tags?.slice(0, 4).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t flex gap-4">
        <Button variant="ghost" size="sm"><Heart className="h-4 w-4 mr-1" />Like</Button>
        <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4 mr-1" />Comment</Button>
        <Button variant="ghost" size="sm" onClick={() => onShare(discussion)}><Share2 className="h-4 w-4 mr-1" />Share</Button>
        <Link to={discussionUrl} className="ml-auto">
          <Button variant="outline" size="sm">{hasPoll ? 'Vote' : 'Join'}</Button>
        </Link>
      </div>
    </div>
  );
};

export default SharedDiscussionCard;
