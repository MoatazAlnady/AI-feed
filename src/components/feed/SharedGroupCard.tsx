import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Users, Lock, Globe, Share2, Heart, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import { getCreatorProfileLink } from '@/utils/profileUtils';

interface SharedGroupCardProps {
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
  };
  sharedBy: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  shareText: string;
  sharedAt: string;
  onShare: (group: any) => void;
}

const SharedGroupCard: React.FC<SharedGroupCardProps> = ({
  group,
  sharedBy,
  shareText,
  sharedAt,
  onShare
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-3 bg-muted/50 flex items-center gap-2 text-sm border-b">
        <RefreshCw className="h-3 w-3 text-muted-foreground" />
        <ProfileHoverCard userId={sharedBy.id}>
          <Link to={getCreatorProfileLink({ id: sharedBy.id, handle: sharedBy.handle })} className="font-medium hover:underline">
            {sharedBy.name}
          </Link>
        </ProfileHoverCard>
        <span className="text-muted-foreground">shared a group • {sharedAt}</span>
        <Badge variant="outline" className="ml-auto flex items-center gap-1">
          <Users className="h-3 w-3" />
          Group
        </Badge>
      </div>

      {shareText && (
        <div className="px-6 py-3 border-b">
          <p className="text-sm text-foreground italic">"{shareText}"</p>
        </div>
      )}

      <div className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/group/${group.id}`)}>
        {group.cover_photo && (
          <img src={group.cover_photo} alt={group.name} className="w-full h-32 object-cover" />
        )}
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            {!group.cover_photo && (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                <Users className="h-7 w-7 text-primary" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg line-clamp-1">{group.name}</h3>
                {group.is_private ? (
                  <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />Private</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />Public</Badge>
                )}
              </div>

              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{group.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {group.member_count || 0} members
                </span>
                {group.category && <Badge variant="secondary" className="text-xs">{group.category}</Badge>}
                {group.interests?.slice(0, 4).map((interest, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5">{interest}</Badge>
                ))}
                {group.tags?.slice(0, 4).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t flex gap-4">
        <Button variant="ghost" size="sm"><Heart className="h-4 w-4 mr-1" />Like</Button>
        <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4 mr-1" />Comment</Button>
        <Button variant="ghost" size="sm" onClick={() => onShare(group)}><Share2 className="h-4 w-4 mr-1" />Share</Button>
        <Link to={`/group/${group.id}`} className="ml-auto">
          <Button variant="outline" size="sm">Join Group</Button>
        </Link>
      </div>
    </div>
  );
};

export default SharedGroupCard;
