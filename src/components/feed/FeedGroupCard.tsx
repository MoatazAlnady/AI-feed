import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Lock, Globe, Share2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileHoverCard from '@/components/ProfileHoverCard';

interface FeedGroupCardProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    cover_photo?: string | null;
    member_count?: number;
    is_private?: boolean;
    category?: string | null;
    interests?: string[];
    tags?: string[];
    creator_id?: string;
    created_at?: string;
  };
  creator?: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  onShare: (group: any) => void;
  isNew?: boolean;
}

const FeedGroupCard: React.FC<FeedGroupCardProps> = ({ 
  group, 
  creator, 
  onShare, 
  isNew = false 
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
      {creator && (
        <div className="px-6 py-3 bg-muted/50 border-b flex items-center gap-3">
          <ProfileHoverCard userId={creator.id}>
            <Link to={`/creator/${creator.handle || creator.id}`} className="flex items-center gap-2">
              {creator.avatar ? (
                <img src={creator.avatar} alt={creator.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">{creator.name.charAt(0)}</span>
                </div>
              )}
              <span className="font-medium text-sm hover:underline">{creator.name}</span>
            </Link>
          </ProfileHoverCard>
          <span className="text-muted-foreground text-sm">
            {isNew ? 'created a new group' : 'shared a group'}
          </span>
          {isNew && (
            <Badge variant="secondary" className="ml-auto flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Sparkles className="h-3 w-3" />
              New
            </Badge>
          )}
          <Badge variant="outline" className={`${!isNew ? 'ml-auto' : ''} flex items-center gap-1`}>
            <Users className="h-3 w-3" />
            Group
          </Badge>
        </div>
      )}

      <div className="cursor-pointer" onClick={() => navigate(`/group/${group.id}`)}>
        {group.cover_photo && (
          <img src={group.cover_photo} alt={group.name} className="w-full h-32 object-cover" />
        )}
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            {!group.cover_photo && (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                <Users className="h-8 w-8 text-primary" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors line-clamp-1">
                  {group.name}
                </h3>
                {group.is_private ? (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                )}
              </div>

              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {group.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {group.member_count || 0} members
                </div>
                
                {group.category && (
                  <Badge variant="secondary" className="text-xs">{group.category}</Badge>
                )}
                
                {group.interests?.slice(0, 4).map((interest, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5">
                    {interest}
                  </Badge>
                ))}
                
                {group.tags?.slice(0, 4).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onShare(group);
          }}
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
        <Link to={`/group/${group.id}`}>
          <Button variant="outline" size="sm">
            View Group
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FeedGroupCard;
