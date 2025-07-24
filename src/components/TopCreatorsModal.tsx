import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Star, ArrowRight, X } from 'lucide-react';

interface TopCreator {
  id: string;
  full_name: string;
  profile_photo?: string;
  bio?: string;
  interests: string[];
  tools_submitted: number;
  articles_written: number;
  total_reach: number;
  verified: boolean;
  ai_nexus_top_voice: boolean;
}

interface TopCreatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInterests: string[];
  userId: string;
}

const TopCreatorsModal: React.FC<TopCreatorsModalProps> = ({
  isOpen,
  onClose,
  userInterests,
  userId
}) => {
  const { toast } = useToast();
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && userInterests.length > 0) {
      fetchTopCreators();
    }
  }, [isOpen, userInterests]);

  const fetchTopCreators = async () => {
    try {
      setLoading(true);
      
      // Fetch top creators who have interests that match the user's interests
      const { data: creatorsData, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          profile_photo,
          bio,
          interests,
          tools_submitted,
          articles_written,
          total_reach,
          verified,
          ai_nexus_top_voice
        `)
        .neq('id', userId) // Exclude current user
        .gt('tools_submitted', 0) // Must have submitted tools
        .order('total_reach', { ascending: false })
        .limit(8);

      if (error) throw error;

      // Filter creators who have matching interests
      const relevantCreators = creatorsData?.filter(creator => {
        const creatorInterests = creator.interests || [];
        return userInterests.some(interest => 
          creatorInterests.some((creatorInterest: string) => 
            creatorInterest.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(creatorInterest.toLowerCase())
          )
        );
      }) || [];

      setTopCreators(relevantCreators.slice(0, 6));
    } catch (error) {
      console.error('Error fetching top creators:', error);
      toast({
        title: "Error",
        description: "Failed to load top creators",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (creatorId: string) => {
    try {
      // For now, just track locally. In a real app, you'd save follows to database
      setFollowingIds(prev => new Set([...prev, creatorId]));
      
      toast({
        title: "Followed!",
        description: "You are now following this creator"
      });
    } catch (error) {
      console.error('Error following creator:', error);
      toast({
        title: "Error",
        description: "Failed to follow creator",
        variant: "destructive"
      });
    }
  };

  const getMatchingInterests = (creatorInterests: string[]) => {
    return creatorInterests.filter(interest => 
      userInterests.some(userInterest => 
        userInterest.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(userInterest.toLowerCase())
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connect with Top Creators
              </DialogTitle>
              <DialogDescription>
                Discover and follow creators who share your interests in AI tools and technology
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : topCreators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No top creators found matching your interests yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topCreators.map((creator) => {
                const matchingInterests = getMatchingInterests(creator.interests || []);
                const isFollowing = followingIds.has(creator.id);
                
                return (
                  <div key={creator.id} className="p-4 border border-border rounded-lg hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.profile_photo} />
                        <AvatarFallback>
                          {creator.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {creator.full_name || 'Anonymous User'}
                          </h3>
                          {creator.verified && (
                            <Badge variant="secondary" className="px-1 py-0 text-xs">
                              ✓
                            </Badge>
                          )}
                          {creator.ai_nexus_top_voice && (
                            <Badge variant="default" className="px-1 py-0 text-xs">
                              <Star className="h-2 w-2 mr-1" />
                              Top Voice
                            </Badge>
                          )}
                        </div>
                        
                        {creator.bio && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {creator.bio}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span>{creator.tools_submitted} tools</span>
                          <span>{creator.articles_written} articles</span>
                          <span>{creator.total_reach} reach</span>
                        </div>
                        
                        {matchingInterests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {matchingInterests.slice(0, 3).map((interest, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {interest}
                              </Badge>
                            ))}
                            {matchingInterests.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{matchingInterests.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          variant={isFollowing ? "outline" : "default"}
                          onClick={() => handleFollow(creator.id)}
                          disabled={isFollowing}
                          className="w-full text-xs"
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Found {topCreators.length} creators matching your interests
              </p>
              <Button onClick={onClose} className="flex items-center gap-2">
                Continue to Platform
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TopCreatorsModal;